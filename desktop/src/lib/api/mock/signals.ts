import type { Signal } from "../types";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const MOCK_SIGNALS: Signal[] = [
  {
    id: "sig-001",
    session_id: "sess-1",
    channel: "agent:developer",
    mode: "BUILD",
    genre: "COMMIT",
    tier: "sonnet",
    weight: 0.87,
    agent_name: "Developer Agent",
    input_preview: "Implement SSE reconnect logic with exponential backoff",
    failure_mode: null,
    created_at: ago(120_000),
  },
  {
    id: "sig-002",
    session_id: "sess-2",
    channel: "agent:reviewer",
    mode: "ANALYZE",
    genre: "DECIDE",
    tier: "sonnet",
    weight: 0.92,
    agent_name: "Code Reviewer",
    input_preview:
      "Auth flow PR #312 — approve with requested changes on session management",
    failure_mode: null,
    created_at: ago(300_000),
  },
  {
    id: "sig-003",
    session_id: "sess-1",
    channel: "agent:orchestrator",
    mode: "EXECUTE",
    genre: "DIRECT",
    tier: "opus",
    weight: 0.95,
    agent_name: "Orchestrator",
    input_preview:
      "Assign SSE bug to Developer; unblock Reviewer from pending auth PR",
    failure_mode: null,
    created_at: ago(600_000),
  },
  {
    id: "sig-004",
    session_id: "sess-3",
    channel: "agent:researcher",
    mode: "ASSIST",
    genre: "INFORM",
    tier: "haiku",
    weight: 0.71,
    agent_name: "Research Agent",
    input_preview:
      "Svelte 5 runes migration guide — summary of breaking changes vs legacy $:",
    failure_mode: "Fidelity Failure",
    created_at: ago(1_200_000),
  },
];

export function mockSignals(): Signal[] {
  return MOCK_SIGNALS;
}
