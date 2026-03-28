import type { SpawnInstance } from "../types";

let mockSpawnData: SpawnInstance[] = [
  {
    id: "spawn-1",
    agent_id: "agent-3",
    agent_name: "Architect",
    task: "Review PR #312: Refactor authentication middleware to support OAuth 2.0 PKCE flow. Check for security implications, API contract changes, and migration path.",
    model: "claude-opus-4-6",
    status: "running",
    started_at: new Date(Date.now() - 180_000).toISOString(),
    completed_at: null,
    token_usage: {
      input: 32_000,
      output: 8_400,
      cache_read: 12_000,
      cache_write: 3_200,
    },
    cost_cents: 142,
  },
  {
    id: "spawn-2",
    agent_id: "agent-1",
    agent_name: "Scout",
    task: "Full dependency audit of miosa-frontend package.json. Cross-reference all direct and transitive deps against OSV.dev for known CVEs. Produce a severity-ranked report.",
    model: "claude-sonnet-4-6",
    status: "running",
    started_at: new Date(Date.now() - 95_000).toISOString(),
    completed_at: null,
    token_usage: {
      input: 18_500,
      output: 4_200,
      cache_read: 6_800,
      cache_write: 1_400,
    },
    cost_cents: 58,
  },
  {
    id: "spawn-3",
    agent_id: "agent-2",
    agent_name: "Scribe",
    task: "Generate OpenAPI 3.1 spec from the Phoenix router and controller modules. Include all request/response schemas, authentication requirements, and example payloads.",
    model: "claude-sonnet-4-6",
    status: "completed",
    started_at: new Date(Date.now() - 7_200_000).toISOString(),
    completed_at: new Date(Date.now() - 6_300_000).toISOString(),
    token_usage: {
      input: 55_200,
      output: 18_900,
      cache_read: 22_000,
      cache_write: 4_800,
    },
    cost_cents: 213,
  },
  {
    id: "spawn-4",
    agent_id: "agent-3",
    agent_name: "Architect",
    task: "Analyze the miosa_knowledge SPARQL executor for performance bottlenecks. Profile BGP join ordering and suggest index structures to reduce query latency for 10K+ triple stores.",
    model: "claude-opus-4-6",
    status: "completed",
    started_at: new Date(Date.now() - 86_400_000).toISOString(),
    completed_at: new Date(Date.now() - 83_600_000).toISOString(),
    token_usage: {
      input: 91_400,
      output: 28_700,
      cache_read: 35_000,
      cache_write: 7_200,
    },
    cost_cents: 480,
  },
  {
    id: "spawn-5",
    agent_id: "agent-7",
    agent_name: "Forge",
    task: "Run the full Elixir test suite with coverage reporting. Identify any flaky tests by running the suite 3 times consecutively. Generate a diff against the baseline coverage from last week.",
    model: "claude-sonnet-4-6",
    status: "failed",
    started_at: new Date(Date.now() - 172_800_000).toISOString(),
    completed_at: new Date(Date.now() - 172_500_000).toISOString(),
    token_usage: {
      input: 4_200,
      output: 800,
      cache_read: 1_200,
      cache_write: 400,
    },
    cost_cents: 12,
  },
  {
    id: "spawn-6",
    agent_id: "agent-4",
    agent_name: "Oracle",
    task: "Research the latest developments in multi-agent coordination protocols (PACT, AutoGen, LangGraph). Summarize architectural tradeoffs relevant to the OSA swarm execution model.",
    model: "claude-opus-4-6",
    status: "completed",
    started_at: new Date(Date.now() - 259_200_000).toISOString(),
    completed_at: new Date(Date.now() - 255_600_000).toISOString(),
    token_usage: {
      input: 68_000,
      output: 22_400,
      cache_read: 28_000,
      cache_write: 5_600,
    },
    cost_cents: 385,
  },
];

export function getSpawnInstances(): SpawnInstance[] {
  return mockSpawnData;
}

export function getSpawnById(id: string): SpawnInstance | undefined {
  return mockSpawnData.find((s) => s.id === id);
}

export function createSpawnInstance(
  input: Partial<SpawnInstance>,
): SpawnInstance {
  const newInstance: SpawnInstance = {
    id: `spawn-${mockSpawnData.length + 1}`,
    agent_id: input.agent_id ?? "agent-1",
    agent_name: input.agent_name ?? "Scout",
    task: input.task ?? "Ad-hoc task",
    model: input.model ?? "claude-sonnet-4-6",
    status: "running",
    started_at: new Date().toISOString(),
    completed_at: null,
    token_usage: null,
    cost_cents: null,
  };
  mockSpawnData = [newInstance, ...mockSpawnData];
  return newInstance;
}

export function deleteSpawn(id: string): boolean {
  const len = mockSpawnData.length;
  mockSpawnData = mockSpawnData.filter((s) => s.id !== id);
  return mockSpawnData.length < len;
}
