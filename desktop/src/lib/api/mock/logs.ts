import type { LogEntry } from "../types";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const MOCK_LOGS: LogEntry[] = [
  {
    id: "log-001",
    level: "info",
    source: "agent:developer",
    message:
      "SSE connection re-established after exponential backoff (attempt 3)",
    metadata: { agent_id: "agt-dev-003", session_id: "sess-1", attempt: 3 },
    created_at: ago(60_000),
  },
  {
    id: "log-002",
    level: "warning",
    source: "budget:enforcer",
    message:
      "Orchestrator daily cost at 89% of limit — throttling may activate",
    metadata: { agent_id: "agt-orch-001", cost_cents: 890, limit_cents: 1000 },
    created_at: ago(300_000),
  },
  {
    id: "log-003",
    level: "error",
    source: "gateway:anthropic",
    message: "Rate limit hit on claude-opus-4-6 — request queued for retry",
    metadata: {
      model: "claude-opus-4-6",
      retry_after_ms: 15000,
      queue_depth: 2,
    },
    created_at: ago(900_000),
  },
  {
    id: "log-004",
    level: "info",
    source: "system:scheduler",
    message: "Heartbeat schedule sched-3 triggered for api-monitor agent",
    metadata: {
      schedule_id: "sched-3",
      agent_id: "agt-mon-006",
      trigger: "cron",
    },
    created_at: ago(1_800_000),
  },
];

export function mockLogs(): LogEntry[] {
  return MOCK_LOGS;
}
