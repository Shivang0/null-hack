// src/lib/stores/analytics.svelte.ts
import { analytics as analyticsApi } from "$api/client";

export interface AgentMetrics {
  agent_id: string;
  agent_name: string;
  total_sessions: number;
  successful_sessions: number;
  failed_sessions: number;
  success_rate: number;
  avg_duration_seconds: number;
  total_cost_cents: number;
  tasks_completed: number;
  tasks_per_day: number;
}

export interface TeamMetrics {
  team_id: string;
  team_name: string;
  agent_count: number;
  total_sessions: number;
  total_cost_cents: number;
  success_rate: number;
}

export interface AnalyticsTotals {
  total_sessions: number;
  total_cost_cents: number;
  avg_success_rate: number;
  total_tasks: number;
  active_agents: number;
}

export interface AnalyticsTrends {
  sessions_by_day: { date: string; count: number }[];
  costs_by_day: { date: string; cents: number }[];
}

export interface AnalyticsData {
  period: string;
  agent_metrics: AgentMetrics[];
  team_metrics: TeamMetrics[];
  totals: AnalyticsTotals;
  trends: AnalyticsTrends;
}

class AnalyticsStore {
  isLoading = $state(true);
  error = $state<string | null>(null);
  period = $state<"7d" | "30d" | "90d">("30d");

  data = $state<AnalyticsData | null>(null);

  topPerformers = $derived(
    [...(this.data?.agent_metrics ?? [])]
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 5),
  );

  highestCost = $derived(
    [...(this.data?.agent_metrics ?? [])]
      .sort((a, b) => b.total_cost_cents - a.total_cost_cents)
      .slice(0, 5),
  );

  totalROI = $derived(() => {
    const totals = this.data?.totals;
    if (!totals || totals.total_cost_cents === 0) return 0;
    // Estimated ROI: each task completion valued at $5 vs actual cost
    const estimatedValue = totals.total_tasks * 500; // cents
    return Math.round(
      ((estimatedValue - totals.total_cost_cents) / totals.total_cost_cents) *
        100,
    );
  });

  async fetchAnalytics(period: "7d" | "30d" | "90d" = "30d"): Promise<void> {
    this.period = period;
    this.isLoading = true;
    this.error = null;
    try {
      const raw = await analyticsApi.summary(period);
      this.data = raw as AnalyticsData;
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.isLoading = false;
    }
  }

  async fetchAgentMetrics(): Promise<AgentMetrics[]> {
    try {
      const raw = (await analyticsApi.agents(this.period)) as {
        agents: AgentMetrics[];
      };
      return raw.agents ?? [];
    } catch {
      return [];
    }
  }

  async fetchTeamMetrics(): Promise<TeamMetrics[]> {
    try {
      const raw = (await analyticsApi.teams(this.period)) as {
        teams: TeamMetrics[];
      };
      return raw.teams ?? [];
    } catch {
      return [];
    }
  }
}

export const analyticsStore = new AnalyticsStore();
