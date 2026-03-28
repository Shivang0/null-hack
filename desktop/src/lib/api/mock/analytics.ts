// src/lib/api/mock/analytics.ts

const AGENTS = [
  { id: "agt-orchestrator", name: "Orchestrator", team_id: "team-core" },
  { id: "agt-developer", name: "Developer Agent", team_id: "team-core" },
  { id: "agt-reviewer", name: "Code Reviewer", team_id: "team-core" },
  { id: "agt-researcher", name: "Researcher", team_id: "team-research" },
  { id: "agt-devops", name: "DevOps Engineer", team_id: "team-infra" },
  { id: "agt-api-monitor", name: "API Monitor", team_id: "team-infra" },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDailyPoints(
  days: number,
  baseCount: number,
  baseCost: number,
): { date: string; count: number; cents: number }[] {
  const points: { date: string; count: number; cents: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    const weekendFactor = dow === 0 || dow === 6 ? 0.4 : 1.0;
    const jitter = seededRandom(i * 7 + 3) * 0.4 - 0.2;
    const count = Math.max(
      1,
      Math.round(baseCount * weekendFactor * (1 + jitter)),
    );
    const cents = Math.max(
      10,
      Math.round(baseCost * weekendFactor * (1 + jitter)),
    );
    points.push({ date: dateStr, count, cents });
  }
  return points;
}

export function mockAnalytics(period: string) {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  const agentMetrics = AGENTS.map((agent, idx) => {
    const seed = idx + 1;
    const baseSessions = [180, 140, 110, 90, 65, 50][idx];
    const sessionScale = days / 30;
    const totalSessions = Math.round(
      baseSessions * sessionScale * (0.9 + seededRandom(seed * 3) * 0.2),
    );
    const successRates = [0.97, 0.94, 0.96, 0.91, 0.88, 0.98];
    const successRate = successRates[idx];
    const successfulSessions = Math.round(totalSessions * successRate);
    const failedSessions = totalSessions - successfulSessions;
    const avgDurations = [180, 240, 150, 300, 90, 45];
    const avgDuration = Math.round(
      avgDurations[idx] * (0.85 + seededRandom(seed * 5) * 0.3),
    );
    const baseCosts = [3200, 2800, 1200, 900, 400, 300];
    const totalCostCents = Math.round(
      baseCosts[idx] * sessionScale * (0.9 + seededRandom(seed * 7) * 0.2),
    );
    const tasksCompleted = Math.round(
      totalSessions * (0.8 + seededRandom(seed * 9) * 0.15),
    );
    const tasksPerDay = Math.round((tasksCompleted / days) * 10) / 10;

    return {
      agent_id: agent.id,
      agent_name: agent.name,
      total_sessions: totalSessions,
      successful_sessions: successfulSessions,
      failed_sessions: failedSessions,
      success_rate: successRate,
      avg_duration_seconds: avgDuration,
      total_cost_cents: totalCostCents,
      tasks_completed: tasksCompleted,
      tasks_per_day: tasksPerDay,
    };
  });

  const teamMetrics = [
    {
      team_id: "team-core",
      team_name: "Core Team",
      agent_count: 3,
      total_sessions:
        agentMetrics[0].total_sessions +
        agentMetrics[1].total_sessions +
        agentMetrics[2].total_sessions,
      total_cost_cents:
        agentMetrics[0].total_cost_cents +
        agentMetrics[1].total_cost_cents +
        agentMetrics[2].total_cost_cents,
      success_rate:
        Math.round(
          ((agentMetrics[0].success_rate +
            agentMetrics[1].success_rate +
            agentMetrics[2].success_rate) /
            3) *
            1000,
        ) / 1000,
    },
    {
      team_id: "team-research",
      team_name: "Research Team",
      agent_count: 1,
      total_sessions: agentMetrics[3].total_sessions,
      total_cost_cents: agentMetrics[3].total_cost_cents,
      success_rate: agentMetrics[3].success_rate,
    },
    {
      team_id: "team-infra",
      team_name: "Infrastructure Team",
      agent_count: 2,
      total_sessions:
        agentMetrics[4].total_sessions + agentMetrics[5].total_sessions,
      total_cost_cents:
        agentMetrics[4].total_cost_cents + agentMetrics[5].total_cost_cents,
      success_rate:
        Math.round(
          ((agentMetrics[4].success_rate + agentMetrics[5].success_rate) / 2) *
            1000,
        ) / 1000,
    },
  ];

  const totalSessions = agentMetrics.reduce(
    (sum, a) => sum + a.total_sessions,
    0,
  );
  const totalCostCents = agentMetrics.reduce(
    (sum, a) => sum + a.total_cost_cents,
    0,
  );
  const avgSuccessRate =
    agentMetrics.reduce((sum, a) => sum + a.success_rate, 0) /
    agentMetrics.length;
  const totalTasks = agentMetrics.reduce(
    (sum, a) => sum + a.tasks_completed,
    0,
  );

  const dailyPoints = generateDailyPoints(
    days,
    totalSessions / days,
    totalCostCents / days,
  );

  return {
    period,
    agent_metrics: agentMetrics,
    team_metrics: teamMetrics,
    totals: {
      total_sessions: totalSessions,
      total_cost_cents: totalCostCents,
      avg_success_rate: Math.round(avgSuccessRate * 1000) / 1000,
      total_tasks: totalTasks,
      active_agents: AGENTS.length,
    },
    trends: {
      sessions_by_day: dailyPoints.map((p) => ({
        date: p.date,
        count: p.count,
      })),
      costs_by_day: dailyPoints.map((p) => ({
        date: p.date,
        cents: p.cents,
      })),
    },
  };
}
