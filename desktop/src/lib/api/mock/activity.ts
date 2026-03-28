import type { ActivityEvent } from "../types";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MIN = 60_000;

export function mockActivity(): ActivityEvent[] {
  return [
    {
      id: "act-1",
      type: "agent_woke",
      agent_id: "agt-orchestrator",
      agent_name: "Orchestrator",
      title: "Agent 'Orchestrator' added to workspace OSA Development.",
      detail: null,
      level: "info",
      metadata: { agent_slug: "orchestrator", adapter: "osa" },
      created_at: new Date(Date.now() - 5 * DAY).toISOString(),
    },
    {
      id: "act-2",
      type: "agent_woke",
      agent_id: "agt-developer",
      agent_name: "Developer Agent",
      title: "Agent 'Developer Agent' added to workspace OSA Development.",
      detail: null,
      level: "info",
      metadata: { agent_slug: "developer", adapter: "claude-code" },
      created_at: new Date(Date.now() - 4 * DAY).toISOString(),
    },
    {
      id: "act-3",
      type: "session_completed",
      agent_id: "agt-orchestrator",
      agent_name: "Orchestrator",
      title:
        "Orchestrator completed session: architecture planning for NULLHACK adapter system.",
      detail: null,
      level: "info",
      metadata: { duration_ms: 42300, tokens_used: 18400 },
      created_at: new Date(Date.now() - 3 * DAY).toISOString(),
    },
    {
      id: "act-4",
      type: "session_completed",
      agent_id: "agt-developer",
      agent_name: "Developer Agent",
      title:
        "Developer Agent completed session: implemented OSA adapter scaffold.",
      detail: null,
      level: "info",
      metadata: { duration_ms: 91200, tokens_used: 34750 },
      created_at: new Date(Date.now() - 2 * DAY).toISOString(),
    },
    {
      id: "act-5",
      type: "budget_warning",
      agent_id: null,
      agent_name: null,
      title: "Workspace budget at 72% of monthly limit ($144 / $200).",
      detail: null,
      level: "warning",
      metadata: { spent_cents: 14400, limit_cents: 20000, pct: 72 },
      created_at: new Date(Date.now() - 1 * DAY).toISOString(),
    },
    {
      id: "act-6",
      type: "issue_updated",
      agent_id: "agt-developer",
      agent_name: "Developer Agent",
      title:
        "Issue 'Fix SSE connection drops' moved to in_progress by Developer Agent.",
      detail: null,
      level: "info",
      metadata: { from_status: "todo", to_status: "in_progress" },
      created_at: new Date(Date.now() - 6 * HOUR).toISOString(),
    },
    {
      id: "act-7",
      type: "session_started",
      agent_id: "agt-reviewer",
      agent_name: "Code Reviewer",
      title: "Code Reviewer started review session for auth flow issue.",
      detail: null,
      level: "info",
      metadata: { issue_title: "Review auth flow" },
      created_at: new Date(Date.now() - 2 * HOUR).toISOString(),
    },
    {
      id: "act-8",
      type: "agent_error",
      agent_id: null,
      agent_name: null,
      title:
        "API Monitor failed health check: endpoint /api/health returned 503.",
      detail: null,
      level: "error",
      metadata: { endpoint: "/api/health", status_code: 503, retry_count: 3 },
      created_at: new Date(Date.now() - 30 * MIN).toISOString(),
    },
  ];
}
