import type { AuditEntry } from "../types";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const MOCK_AUDIT: AuditEntry[] = [
  {
    id: "audit-001",
    actor: "Admin User",
    actor_type: "human",
    action: "agent.wake",
    entity_type: "agent",
    entity_id: "agt-dev-003",
    details: { previous_status: "sleeping", new_status: "running" },
    ip_address: "127.0.0.1",
    created_at: ago(300_000),
  },
  {
    id: "audit-002",
    actor: "orchestrator",
    actor_type: "agent",
    action: "session.create",
    entity_type: "session",
    entity_id: "sess-1",
    details: { agent_id: "agt-dev-003", title: "Fix SSE connection drops" },
    ip_address: null,
    created_at: ago(600_000),
  },
  {
    id: "audit-003",
    actor: "Admin User",
    actor_type: "human",
    action: "approval.approve",
    entity_type: "approval",
    entity_id: "approval-2",
    details: { tool: "web_fetch", agent_id: "agent-researcher" },
    ip_address: "127.0.0.1",
    created_at: ago(3_600_000),
  },
  {
    id: "audit-004",
    actor: "system",
    actor_type: "system",
    action: "budget.threshold_exceeded",
    entity_type: "agent",
    entity_id: "agt-orch-001",
    details: {
      policy_id: "bp-elite",
      daily_limit_cents: 1000,
      actual_cents: 1050,
    },
    ip_address: null,
    created_at: ago(7_200_000),
  },
];

export function mockAudit(): AuditEntry[] {
  return MOCK_AUDIT;
}
