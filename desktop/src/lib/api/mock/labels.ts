import type { Label } from "../types";

const MOCK_LABELS: Label[] = [
  {
    id: "label-priority",
    name: "priority",
    color: "#ef4444",
    description: "High-priority items requiring immediate attention",
    project_id: null,
    issue_count: 3,
    created_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "label-review",
    name: "needs-review",
    color: "#f59e0b",
    description: "Awaiting human or agent review",
    project_id: null,
    issue_count: 5,
    created_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "label-prod",
    name: "production",
    color: "#10b981",
    description: "Affects production environment",
    project_id: null,
    issue_count: 2,
    created_at: "2026-02-01T00:00:00Z",
  },
];

export function mockLabels(): Label[] {
  return MOCK_LABELS;
}
