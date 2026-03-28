import type { Plugin, PluginLog } from "../types";

const MOCK_PLUGINS: Plugin[] = [
  {
    id: "plugin-github",
    name: "GitHub Integration",
    description: "GitHub webhook processing and PR automation",
    version: "1.2.0",
    author: "MIOSA",
    status: "active",
    enabled: true,
    config: { repo: "miosa/nullhack", events: ["push", "pull_request"] },
    capabilities: ["webhook_ingest", "pr_comment", "status_check"],
    installed_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "plugin-slack",
    name: "Slack Notifications",
    description: "Send agent notifications to Slack channels",
    version: "1.0.0",
    author: "MIOSA",
    status: "inactive",
    enabled: false,
    config: {},
    capabilities: ["message_send"],
    installed_at: "2026-03-10T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
  },
];

const MOCK_PLUGIN_LOGS: PluginLog[] = [
  {
    id: "plog-1",
    plugin_id: "plugin-github",
    level: "info",
    message: "Plugin initialized",
    metadata: {},
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "plog-2",
    plugin_id: "plugin-github",
    level: "info",
    message: "Webhook received",
    metadata: { event: "push", ref: "refs/heads/main" },
    created_at: new Date(Date.now() - 1_800_000).toISOString(),
  },
];

export function mockPlugins(): Plugin[] {
  return MOCK_PLUGINS;
}

export function mockPluginLogs(_pluginId: string): PluginLog[] {
  return MOCK_PLUGIN_LOGS;
}
