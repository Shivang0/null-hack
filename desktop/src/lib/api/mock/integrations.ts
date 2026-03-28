import type { Integration, Adapter } from "../types";

const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: "int-anthropic",
    name: "Anthropic",
    category: "auth",
    provider: "anthropic",
    icon_url: null,
    status: "connected",
    config: { api_key_set: true, default_model: "claude-opus-4-6" },
    last_sync_at: "2026-03-21T08:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "int-github",
    name: "GitHub",
    category: "version_control",
    provider: "github",
    icon_url: null,
    status: "connected",
    config: { org: "Miosa-osa", default_branch: "main" },
    last_sync_at: "2026-03-21T07:45:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "int-slack",
    name: "Slack",
    category: "communication",
    provider: "slack",
    icon_url: null,
    status: "connected",
    config: { workspace: "miosa", default_channel: "#agents" },
    last_sync_at: "2026-03-21T08:10:00Z",
    created_at: "2026-03-05T00:00:00Z",
  },
  {
    id: "int-linear",
    name: "Linear",
    category: "custom",
    provider: "linear",
    icon_url: null,
    status: "connected",
    config: { team_id: "MIOSA", sync_issues: true },
    last_sync_at: "2026-03-21T06:00:00Z",
    created_at: "2026-03-07T00:00:00Z",
  },
  {
    id: "int-notion",
    name: "Notion",
    category: "storage",
    provider: "notion",
    icon_url: null,
    status: "disconnected",
    config: {},
    last_sync_at: null,
    created_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "int-vercel",
    name: "Vercel",
    category: "ci_cd",
    provider: "vercel",
    icon_url: null,
    status: "connected",
    config: { team_slug: "miosa", auto_deploy: true },
    last_sync_at: "2026-03-21T05:30:00Z",
    created_at: "2026-03-03T00:00:00Z",
  },
];

const MOCK_ADAPTERS: Adapter[] = [
  {
    id: "osa",
    type: "osa",
    name: "OSA Runtime",
    description: "Native OSA Elixir agent runtime",
    status: "available",
    config: {},
    agent_count: 1,
  },
  {
    id: "claude_code",
    type: "claude_code",
    name: "Claude Code",
    description: "Claude Code CLI subprocess",
    status: "available",
    config: {},
    agent_count: 3,
  },
  {
    id: "bash",
    type: "bash",
    name: "Bash",
    description: "Raw shell execution",
    status: "available",
    config: {},
    agent_count: 1,
  },
  {
    id: "http",
    type: "http",
    name: "HTTP",
    description: "External HTTP service",
    status: "available",
    config: {},
    agent_count: 1,
  },
];

export function mockIntegrations(): Integration[] {
  return MOCK_INTEGRATIONS;
}

export function mockAdapters(): Adapter[] {
  return MOCK_ADAPTERS;
}
