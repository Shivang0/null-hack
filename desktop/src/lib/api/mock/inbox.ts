import type { InboxItem } from "../types";

const MOCK_INBOX: InboxItem[] = [
  {
    id: "inb-1",
    type: "approval",
    status: "unread",
    title: "Budget override request",
    body: "Scout is requesting $15.00 over the daily budget limit to complete an in-progress code review task. Current spend: $12.40 of $10.00 limit.",
    source_agent: "Scout",
    source_entity_type: "budget",
    source_entity_id: "bp-1",
    actions: [
      { id: "approve", label: "Approve", type: "approve" },
      { id: "reject", label: "Reject", type: "reject" },
    ],
    created_at: new Date(Date.now() - 300_000).toISOString(),
  },
  {
    id: "inb-2",
    type: "alert",
    status: "unread",
    title: "Sentinel detected security anomaly",
    body: "Unusual API access pattern detected from IP 192.168.1.100. 47 requests in 60 seconds against /agents endpoint. Possible scraping or misconfigured client.",
    source_agent: "Sentinel",
    source_entity_type: "agent",
    source_entity_id: "agent-5",
    actions: [{ id: "ack", label: "Acknowledge", type: "acknowledge" }],
    created_at: new Date(Date.now() - 600_000).toISOString(),
  },
  {
    id: "inb-3",
    type: "mention",
    status: "read",
    title: "Architect mentioned you in issue #7",
    body: "Need your input on the database schema migration strategy. The current approach may have performance implications at scale — want your sign-off before proceeding.",
    source_agent: "Architect",
    source_entity_type: "issue",
    source_entity_id: "issue-7",
    actions: [
      {
        id: "nav",
        label: "View Issue",
        type: "navigate",
        payload: { url: "/app/issues" },
      },
    ],
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "inb-4",
    type: "failure",
    status: "unread",
    title: "Heartbeat failed: Scribe morning sync",
    body: "Schedule sched-2 failed at 07:00 UTC. Scribe encountered a parse error in the changelog template. Last 3 runs succeeded. Error: unexpected token at line 42 of CHANGELOG.md.",
    source_agent: "Scribe",
    source_entity_type: "schedule",
    source_entity_id: "sched-2",
    actions: [
      { id: "ack", label: "Acknowledge", type: "acknowledge" },
      {
        id: "nav",
        label: "View Schedule",
        type: "navigate",
        payload: { url: "/app/schedules" },
      },
    ],
    created_at: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: "inb-5",
    type: "report",
    status: "read",
    title: "Weekly cost report ready",
    body: "Total spend this week: $24.18 across 8 agents. Architect accounted for 42% of spend ($10.15). Cache hit rate improved to 68%, saving an estimated $3.40 vs last week.",
    source_agent: "Courier",
    source_entity_type: "budget",
    source_entity_id: "bp-1",
    actions: [
      {
        id: "nav",
        label: "View Report",
        type: "navigate",
        payload: { url: "/app/usage" },
      },
    ],
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "inb-6",
    type: "budget_warning",
    status: "unread",
    title: "Architect approaching daily limit",
    body: "Architect has consumed 82% of its daily budget ($8.20 of $10.00). At current token velocity, the limit will be reached in approximately 35 minutes.",
    source_agent: "Architect",
    source_entity_type: "budget",
    source_entity_id: "bp-2",
    actions: [
      { id: "approve", label: "Extend Limit", type: "approve" },
      { id: "ack", label: "Acknowledge", type: "acknowledge" },
    ],
    created_at: new Date(Date.now() - 900_000).toISOString(),
  },
  {
    id: "inb-7",
    type: "approval",
    status: "actioned",
    title: "Agent spawn request: Forge clone",
    body: "Oracle is requesting to spawn a Forge instance to run parallel build validation on the MIOSA Platform branch. Estimated cost: $0.45.",
    source_agent: "Oracle",
    source_entity_type: "agent",
    source_entity_id: "agent-4",
    actions: [
      { id: "approve", label: "Approve", type: "approve" },
      { id: "reject", label: "Reject", type: "reject" },
    ],
    created_at: new Date(Date.now() - 10_800_000).toISOString(),
  },
  {
    id: "inb-8",
    type: "failure",
    status: "actioned",
    title: "Muse tool call error: computer_use timed out",
    body: "Muse failed to complete a computer_use screenshot capture after 30s. The macOS accessibility bridge returned error code -600. Session sess-8 was aborted.",
    source_agent: "Muse",
    source_entity_type: "agent",
    source_entity_id: "agent-8",
    actions: [{ id: "ack", label: "Acknowledged", type: "acknowledge" }],
    created_at: new Date(Date.now() - 14_400_000).toISOString(),
  },
  {
    id: "inb-9",
    type: "mention",
    status: "unread",
    title: "Scout flagged a critical dependency",
    body: "lodash@4.17.20 has a known prototype pollution vulnerability (CVE-2023-9999). 3 direct usages found in miosa-frontend. Patch available: lodash@4.17.21.",
    source_agent: "Scout",
    source_entity_type: "issue",
    source_entity_id: "issue-12",
    actions: [
      {
        id: "nav",
        label: "View Issue",
        type: "navigate",
        payload: { url: "/app/issues" },
      },
      { id: "ack", label: "Acknowledge", type: "acknowledge" },
    ],
    created_at: new Date(Date.now() - 1_800_000).toISOString(),
  },
  {
    id: "inb-10",
    type: "report",
    status: "unread",
    title: "Daily activity summary",
    body: "24 agent sessions completed today. 187 tool calls executed. 3 issues closed, 2 opened. Top contributor: Architect (6 sessions). System uptime: 99.8%.",
    source_agent: "Courier",
    source_entity_type: null,
    source_entity_id: null,
    actions: [
      {
        id: "nav",
        label: "View Activity",
        type: "navigate",
        payload: { url: "/app/activity" },
      },
    ],
    created_at: new Date(Date.now() - 28_800_000).toISOString(),
  },
  {
    id: "inb-11",
    type: "alert",
    status: "dismissed",
    title: "Backend connectivity degraded",
    body: "The OSA backend at localhost:4000 returned 3 consecutive 503 responses between 14:22 and 14:24 UTC. Service recovered automatically. No agent sessions were lost.",
    source_agent: null,
    source_entity_type: "system",
    source_entity_id: null,
    actions: [{ id: "ack", label: "Acknowledged", type: "acknowledge" }],
    created_at: new Date(Date.now() - 21_600_000).toISOString(),
  },
  {
    id: "inb-12",
    type: "budget_warning",
    status: "read",
    title: "Monthly budget at 74% with 12 days remaining",
    body: "Current monthly spend is $148.20 of $200.00. At current burn rate ($12.40/day), the monthly cap will be reached in ~4.2 days. Consider reviewing scheduled heartbeats.",
    source_agent: null,
    source_entity_type: "budget",
    source_entity_id: "bp-1",
    actions: [
      {
        id: "nav",
        label: "Review Budget",
        type: "navigate",
        payload: { url: "/app/usage" },
      },
      { id: "ack", label: "Acknowledge", type: "acknowledge" },
    ],
    created_at: new Date(Date.now() - 43_200_000).toISOString(),
  },
];

export function getInbox(): InboxItem[] {
  return MOCK_INBOX;
}

export function performInboxAction(
  itemId: string,
  actionId: string,
): InboxItem {
  const item = MOCK_INBOX.find((i) => i.id === itemId);
  if (!item) throw new Error(`Inbox item ${itemId} not found`);
  if (actionId === "approve" || actionId === "reject") {
    item.status = "actioned";
  } else if (actionId === "ack") {
    item.status = "actioned";
  } else if (actionId === "snooze") {
    item.status = "read";
  }
  return item;
}
