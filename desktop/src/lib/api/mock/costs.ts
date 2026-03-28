import type {
  CostSummary,
  AgentCostBreakdown,
  ModelCostBreakdown,
  BudgetPolicy,
  BudgetIncident,
} from "../types";

export function mockCosts() {
  const summary: CostSummary = {
    today_cents: 850,
    week_cents: 4200,
    month_cents: 14400,
    daily_budget_cents: 2000,
    monthly_budget_cents: 20000,
    daily_remaining_cents: 1150,
    monthly_remaining_cents: 5600,
    cache_savings_cents: Math.round(14400 * 0.28),
  };

  // 6 agents from seeds — Orchestrator (Opus) is most expensive, then Developer
  // and Reviewer (Sonnet), Researcher (Sonnet), DevOps and API Monitor minimal.
  // Percentages are approximate and sum to 100.
  const byAgent: AgentCostBreakdown[] = [
    {
      agent_id: "agt-orchestrator",
      agent_name: "Orchestrator",
      cost_cents: 7200,
      token_usage: {
        input: 120000,
        output: 38000,
        cache_read: 28000,
        cache_write: 8000,
      },
      run_count: 18,
      percentage: 50,
    },
    {
      agent_id: "agt-developer",
      agent_name: "Developer Agent",
      cost_cents: 3960,
      token_usage: {
        input: 90000,
        output: 28000,
        cache_read: 18000,
        cache_write: 5000,
      },
      run_count: 12,
      percentage: 28,
    },
    {
      agent_id: "agt-reviewer",
      agent_name: "Code Reviewer",
      cost_cents: 1800,
      token_usage: {
        input: 55000,
        output: 16000,
        cache_read: 12000,
        cache_write: 3000,
      },
      run_count: 8,
      percentage: 13,
    },
    {
      agent_id: "agt-researcher",
      agent_name: "Researcher",
      cost_cents: 900,
      token_usage: {
        input: 35000,
        output: 9000,
        cache_read: 8000,
        cache_write: 1500,
      },
      run_count: 5,
      percentage: 6,
    },
    {
      agent_id: "agt-devops",
      agent_name: "DevOps Engineer",
      cost_cents: 288,
      token_usage: {
        input: 12000,
        output: 3000,
        cache_read: 3000,
        cache_write: 500,
      },
      run_count: 3,
      percentage: 2,
    },
    {
      agent_id: "agt-api-monitor",
      agent_name: "API Monitor",
      cost_cents: 252,
      token_usage: {
        input: 8000,
        output: 1500,
        cache_read: 2000,
        cache_write: 300,
      },
      run_count: 24,
      percentage: 1,
    },
  ];

  const byModel: ModelCostBreakdown[] = [
    {
      model: "claude-opus-4-6",
      cost_cents: 9360,
      token_usage: {
        input: 145000,
        output: 45000,
        cache_read: 32000,
        cache_write: 9000,
      },
      request_count: 22,
    },
    {
      model: "claude-sonnet-4-6",
      cost_cents: 4788,
      token_usage: {
        input: 175000,
        output: 55000,
        cache_read: 41000,
        cache_write: 9800,
      },
      request_count: 47,
    },
    {
      model: "bash",
      cost_cents: 0,
      token_usage: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
      request_count: 38,
    },
    {
      model: "http",
      cost_cents: 0,
      token_usage: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
      request_count: 96,
    },
  ];

  // Seeds define 2 policies: agent-scope (orchestrator, $50/mo) and workspace ($200/mo)
  const policies: BudgetPolicy[] = [
    {
      id: "bp-1",
      name: "Orchestrator Agent Cap",
      daily_limit_cents: 500,
      monthly_limit_cents: 5000,
      per_run_limit_cents: 100,
      warning_threshold: 0.8,
      hard_stop: true,
      agent_ids: ["agt-orchestrator"],
      created_at: "2026-03-01T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
    {
      id: "bp-2",
      name: "Workspace Monthly Cap",
      daily_limit_cents: 2000,
      monthly_limit_cents: 20000,
      per_run_limit_cents: 500,
      warning_threshold: 0.7,
      hard_stop: true,
      agent_ids: [
        "agt-orchestrator",
        "agt-developer",
        "agt-reviewer",
        "agt-researcher",
        "agt-devops",
        "agt-api-monitor",
      ],
      created_at: "2026-03-01T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
  ];

  // 1 incident matching seeds: workspace budget warning at 72%
  const incidents: BudgetIncident[] = [
    {
      id: "bi-1",
      agent_id: "agt-orchestrator",
      agent_name: "Orchestrator",
      policy_id: "bp-2",
      type: "warning",
      amount_cents: 14400,
      limit_cents: 20000,
      message: "Workspace budget at 72% of monthly limit ($144 / $200).",
      resolved: false,
      created_at: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ];

  return { summary, byAgent, byModel, policies, incidents };
}
