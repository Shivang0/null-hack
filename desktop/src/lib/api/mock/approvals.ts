import type { Approval } from "../types";

const MOCK_APPROVALS: Approval[] = [
  {
    id: "approval-1",
    title: "Budget override — code review task",
    description:
      "Daily budget exceeded — requesting $5 override for code review task",
    status: "pending",
    requester_id: "agt-orch-001",
    requester_name: "Orchestrator",
    reviewer_id: null,
    reviewer_name: null,
    entity_type: "agent",
    entity_id: "agt-orch-001",
    comment: null,
    expires_at: null,
    reviewed_at: null,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
  },
  {
    id: "approval-2",
    title: "Tool access — web_fetch for market research",
    description: "Requesting web_fetch tool access for market research",
    status: "approved",
    requester_id: "agt-rsrch-002",
    requester_name: "Research Agent",
    reviewer_id: "user-admin",
    reviewer_name: "Admin User",
    entity_type: "tool",
    entity_id: "web_fetch",
    comment: "Approved — limit to read-only fetches",
    expires_at: null,
    reviewed_at: "2026-03-20T09:30:00Z",
    created_at: "2026-03-20T09:00:00Z",
    updated_at: "2026-03-20T09:30:00Z",
  },
];

export function mockApprovals(): Approval[] {
  return MOCK_APPROVALS;
}
