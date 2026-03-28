import type { Session } from "../types";

let mockSessionData: Session[] = [
  {
    id: "sess-1",
    agent_id: "agent-1",
    agent_name: "Scout",
    title: "Security vulnerability scan",
    status: "active",
    message_count: 24,
    token_usage: {
      input: 45000,
      output: 12000,
      cache_read: 8000,
      cache_write: 2000,
    },
    cost_cents: 125,
    started_at: new Date(Date.now() - 45000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 45000).toISOString(),
  },
  {
    id: "sess-2",
    agent_id: "agent-3",
    agent_name: "Architect",
    title: "PR #247 Review",
    status: "active",
    message_count: 18,
    token_usage: {
      input: 80000,
      output: 25000,
      cache_read: 15000,
      cache_write: 5000,
    },
    cost_cents: 340,
    started_at: new Date(Date.now() - 120000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "sess-3",
    agent_id: "agent-2",
    agent_name: "Scribe",
    title: "Daily docs sync",
    status: "completed",
    message_count: 8,
    token_usage: {
      input: 22000,
      output: 8000,
      cache_read: 5000,
      cache_write: 1000,
    },
    cost_cents: 65,
    started_at: new Date(Date.now() - 600000).toISOString(),
    completed_at: new Date(Date.now() - 300000).toISOString(),
    created_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "sess-4",
    agent_id: "agent-5",
    agent_name: "Sentinel",
    title: "Security alert triage",
    status: "completed",
    message_count: 12,
    token_usage: {
      input: 15000,
      output: 3000,
      cache_read: 4000,
      cache_write: 500,
    },
    cost_cents: 18,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function mockSessions(): Session[] {
  return mockSessionData;
}

export function getSessionById(id: string): Session | undefined {
  return mockSessionData.find((s) => s.id === id);
}

export function addSession(session: Session): void {
  mockSessionData = [session, ...mockSessionData];
}

export function deleteSession(id: string): boolean {
  const len = mockSessionData.length;
  mockSessionData = mockSessionData.filter((s) => s.id !== id);
  return mockSessionData.length < len;
}
