// src/lib/api/mock/notifications.ts
// Realistic mock notifications spanning all categories and severities

import type { Notification } from "../types";

const now = Date.now();
function ago(ms: number): string {
  return new Date(now - ms).toISOString();
}

const WS_ID = "ws-1";

const MOCK_NOTIFICATIONS: Notification[] = [
  // ── Task notifications ──────────────────────────────────────────────────────
  {
    id: "ntf-1",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "agent",
    sender_id: "agent-1",
    category: "task",
    severity: "info",
    title: "Architect completed code review",
    body: "Code review for PR #142 (auth middleware refactor) is complete. 3 suggestions, 0 blocking issues. Ready to merge.",
    action_url: "/app/sessions",
    action_label: "View Session",
    metadata: { pr_number: 142, agent: "Architect" },
    read_at: ago(3_600_000),
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(3_600_000),
  },
  {
    id: "ntf-2",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "agent",
    sender_id: "agent-2",
    category: "task",
    severity: "warning",
    title: "Scout needs your input",
    body: "Scout is blocked on the database migration task and needs clarification on the rollback strategy before proceeding.",
    action_url: "/app/sessions",
    action_label: "Reply",
    metadata: { agent: "Scout", task_id: "task-88" },
    read_at: null,
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(900_000),
  },
  {
    id: "ntf-3",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "agent",
    sender_id: "agent-3",
    category: "task",
    severity: "error",
    title: "Scribe task failed",
    body: "Weekly changelog generation failed after 3 retries. Parse error at line 42 of CHANGELOG.md — unexpected token.",
    action_url: "/app/sessions",
    action_label: "View Error",
    metadata: { agent: "Scribe", error: "parse_error", retries: 3 },
    read_at: null,
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(1_800_000),
  },

  // ── Approval notifications ───────────────────────────────────────────────────
  {
    id: "ntf-4",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "workflow",
    sender_id: "wf-3",
    category: "approval",
    severity: "warning",
    title: "Workflow approval required",
    body: "The 'Deploy to Production' workflow step requires your sign-off before executing database migrations on the prod cluster.",
    action_url: "/app/inbox?tab=approvals",
    action_label: "Review",
    metadata: { workflow: "Deploy to Production", step: "db_migration" },
    read_at: null,
    dismissed_at: null,
    expires_at: ago(-86_400_000),
    inserted_at: ago(600_000),
  },
  {
    id: "ntf-5",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "agent",
    sender_id: "agent-1",
    category: "approval",
    severity: "warning",
    title: "Budget increase request",
    body: "Architect is requesting a $20 budget increase for the current sprint to complete the API integration task. Current budget: $50/day.",
    action_url: "/app/inbox?tab=approvals",
    action_label: "Approve or Reject",
    metadata: { agent: "Architect", requested_cents: 2000 },
    read_at: null,
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(300_000),
  },

  // ── Alert notifications ──────────────────────────────────────────────────────
  {
    id: "ntf-6",
    workspace_id: WS_ID,
    recipient_type: "broadcast",
    recipient_id: null,
    sender_type: "system",
    sender_id: null,
    category: "alert",
    severity: "critical",
    title: "Agent Sentinel encountered runtime error",
    body: "Sentinel crashed with an unhandled exception in the threat detection module. Automatic restart attempted 3 times. Manual intervention required.",
    action_url: "/app/logs",
    action_label: "View Logs",
    metadata: {
      agent: "Sentinel",
      restart_count: 3,
      module: "threat_detection",
    },
    read_at: null,
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(120_000),
  },
  {
    id: "ntf-7",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "system",
    sender_id: null,
    category: "alert",
    severity: "warning",
    title: "High API latency detected",
    body: "Average response time for the Anthropic Claude API has been above 4s for the last 10 minutes. Affecting 3 active agents.",
    action_url: "/app/analytics",
    action_label: "View Metrics",
    metadata: { avg_latency_ms: 4200, affected_agents: 3 },
    read_at: ago(600_000),
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(720_000),
  },
  {
    id: "ntf-8",
    workspace_id: WS_ID,
    recipient_type: "broadcast",
    recipient_id: null,
    sender_type: "system",
    sender_id: null,
    category: "alert",
    severity: "warning",
    title: "Disk space warning",
    body: "The session log volume is at 82% capacity (16.4 GB / 20 GB). Consider archiving old sessions to free up space.",
    action_url: "/app/sessions",
    action_label: "Manage Sessions",
    metadata: { used_gb: 16.4, total_gb: 20, percent: 82 },
    read_at: ago(7_200_000),
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(7_200_000),
  },

  // ── Mention notifications ────────────────────────────────────────────────────
  {
    id: "ntf-9",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "agent",
    sender_id: "agent-1",
    category: "mention",
    severity: "info",
    title: "Architect mentioned you in a conversation",
    body: "@you — I need your input on the rate limiting strategy for the public API. See the thread for context.",
    action_url: "/app/sessions",
    action_label: "View Thread",
    metadata: { agent: "Architect", conversation_id: "conv-12" },
    read_at: ago(1_800_000),
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(1_800_000),
  },
  {
    id: "ntf-10",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "agent",
    sender_id: "agent-4",
    category: "mention",
    severity: "info",
    title: "You were mentioned in issue #23",
    body: "Courier flagged you as the owner of issue #23 (webhook delivery failures). 12 failed deliveries in the last 24h.",
    action_url: "/app/issues",
    action_label: "View Issue",
    metadata: { agent: "Courier", issue_id: "issue-23" },
    read_at: null,
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(450_000),
  },

  // ── System notifications ─────────────────────────────────────────────────────
  {
    id: "ntf-11",
    workspace_id: WS_ID,
    recipient_type: "broadcast",
    recipient_id: null,
    sender_type: "system",
    sender_id: null,
    category: "system",
    severity: "info",
    title: "Workspace backup complete",
    body: "Daily backup completed successfully. 847 MB archived to cold storage. Backup ID: bk-2026-03-24-001.",
    action_url: null,
    action_label: null,
    metadata: { backup_id: "bk-2026-03-24-001", size_mb: 847 },
    read_at: ago(86_400_000),
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(86_400_000),
  },
  {
    id: "ntf-12",
    workspace_id: WS_ID,
    recipient_type: "broadcast",
    recipient_id: null,
    sender_type: "system",
    sender_id: null,
    category: "system",
    severity: "info",
    title: "NULLHACK update available: v2.4.1",
    body: "A new version of NULLHACK is available. Includes performance improvements and 3 bug fixes. Update at your convenience.",
    action_url: "/app/config",
    action_label: "View Changelog",
    metadata: { version: "2.4.1", release_type: "patch" },
    read_at: null,
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(43_200_000),
  },

  // ── Budget notifications ─────────────────────────────────────────────────────
  {
    id: "ntf-13",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "system",
    sender_id: null,
    category: "budget",
    severity: "warning",
    title: "Architect approaching daily budget limit",
    body: "Architect has used $8.72 of its $10.00 daily budget (87.2%). At current rate, limit will be reached in ~40 minutes.",
    action_url: "/app/costs",
    action_label: "View Costs",
    metadata: {
      agent: "Architect",
      used_cents: 872,
      limit_cents: 1000,
      percent: 87.2,
    },
    read_at: null,
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(240_000),
  },
  {
    id: "ntf-14",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "system",
    sender_id: null,
    category: "budget",
    severity: "error",
    title: "Monthly budget threshold exceeded",
    body: "Workspace total spend has exceeded the $200 monthly soft threshold at $214.50. No agents have been stopped — hard limit is $300.",
    action_url: "/app/costs",
    action_label: "Review Budget",
    metadata: {
      used_cents: 21450,
      soft_limit_cents: 20000,
      hard_limit_cents: 30000,
    },
    read_at: ago(3_600_000),
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(3_600_000),
  },

  // ── Workflow notifications ───────────────────────────────────────────────────
  {
    id: "ntf-15",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "workflow",
    sender_id: "wf-1",
    category: "workflow",
    severity: "info",
    title: "Nightly report workflow completed",
    body: "The 'Nightly Summary Report' workflow finished in 4m 32s. 6 steps executed, 0 failures. Report sent to 3 recipients.",
    action_url: "/app/workflows",
    action_label: "View Run",
    metadata: { workflow: "Nightly Summary Report", duration_s: 272, steps: 6 },
    read_at: ago(28_800_000),
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(28_800_000),
  },
  {
    id: "ntf-16",
    workspace_id: WS_ID,
    recipient_type: "user",
    recipient_id: "user-1",
    sender_type: "workflow",
    sender_id: "wf-2",
    category: "workflow",
    severity: "error",
    title: "Workflow step failed: Send Slack notification",
    body: "The 'Weekly Digest' workflow failed at step 4 (Send Slack notification). Slack webhook returned 403. Check integration credentials.",
    action_url: "/app/workflows",
    action_label: "Debug Workflow",
    metadata: {
      workflow: "Weekly Digest",
      failed_step: 4,
      step_name: "Send Slack notification",
    },
    read_at: null,
    dismissed_at: null,
    expires_at: null,
    inserted_at: ago(5_400_000),
  },
];

export function getMockNotifications(): Notification[] {
  return MOCK_NOTIFICATIONS;
}

export function getMockNotificationById(id: string): Notification | undefined {
  return MOCK_NOTIFICATIONS.find((n) => n.id === id);
}

export function markNotificationRead(id: string): Notification | undefined {
  const n = MOCK_NOTIFICATIONS.find((n) => n.id === id);
  if (n && !n.read_at) {
    n.read_at = new Date().toISOString();
  }
  return n;
}

export function markAllNotificationsRead(category?: string): void {
  for (const n of MOCK_NOTIFICATIONS) {
    if (!n.read_at && (!category || n.category === category)) {
      n.read_at = new Date().toISOString();
    }
  }
}

export function dismissNotification(id: string): Notification | undefined {
  const n = MOCK_NOTIFICATIONS.find((n) => n.id === id);
  if (n && !n.dismissed_at) {
    n.dismissed_at = new Date().toISOString();
    if (!n.read_at) n.read_at = new Date().toISOString();
  }
  return n;
}

export function getMockNotificationBadges(): {
  unread: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
} {
  const visible = MOCK_NOTIFICATIONS.filter((n) => !n.dismissed_at);
  const unread = visible.filter((n) => !n.read_at).length;

  const by_category: Record<string, number> = {};
  const by_severity: Record<string, number> = {};

  for (const n of visible.filter((n) => !n.read_at)) {
    by_category[n.category] = (by_category[n.category] ?? 0) + 1;
    by_severity[n.severity] = (by_severity[n.severity] ?? 0) + 1;
  }

  return { unread, by_category, by_severity };
}
