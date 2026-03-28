// src/lib/api/mock/environment.ts

export interface MockDetectedApp {
  id: string;
  name: string;
  process_name: string;
  status: "running" | "stopped";
  port: number | null;
  pid: number | null;
  category:
    | "development"
    | "database"
    | "automation"
    | "browser"
    | "design"
    | "communication"
    | "other";
  agent_access: string[];
}

export interface MockAgentApp {
  id: string;
  name: string;
  agent_id: string;
  agent_name: string;
  template_source: string | null;
  status: "running" | "stopped" | "building" | "error";
  port: number | null;
  directory: string | null;
  created_at: string;
}

export interface MockSystemResources {
  cpu_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_free_gb: number;
  disk_total_gb: number;
  network_connections: number;
}

export interface MockCapability {
  id: string;
  name: string;
  available: boolean;
  details: string;
}

const _apps: MockDetectedApp[] = [
  {
    id: "app-vscode",
    name: "VS Code",
    process_name: "code",
    status: "running",
    port: null,
    pid: 12483,
    category: "development",
    agent_access: ["agent-1", "agent-2"],
  },
  {
    id: "app-chrome",
    name: "Google Chrome",
    process_name: "Google Chrome",
    status: "running",
    port: null,
    pid: 9821,
    category: "browser",
    agent_access: ["agent-1"],
  },
  {
    id: "app-postgres",
    name: "PostgreSQL",
    process_name: "postgres",
    status: "running",
    port: 5432,
    pid: 4401,
    category: "database",
    agent_access: ["agent-1", "agent-2", "agent-3"],
  },
  {
    id: "app-docker",
    name: "Docker Desktop",
    process_name: "com.docker.backend",
    status: "running",
    port: null,
    pid: 7733,
    category: "other",
    agent_access: [],
  },
  {
    id: "app-n8n",
    name: "n8n",
    process_name: "node",
    status: "running",
    port: 5678,
    pid: 11204,
    category: "automation",
    agent_access: ["agent-2"],
  },
  {
    id: "app-figma",
    name: "Figma",
    process_name: "Figma",
    status: "stopped",
    port: null,
    pid: null,
    category: "design",
    agent_access: [],
  },
  {
    id: "app-terminal",
    name: "Terminal",
    process_name: "Terminal",
    status: "running",
    port: null,
    pid: 3892,
    category: "development",
    agent_access: ["agent-1", "agent-2", "agent-3"],
  },
  {
    id: "app-slack",
    name: "Slack",
    process_name: "Slack",
    status: "stopped",
    port: null,
    pid: null,
    category: "communication",
    agent_access: [],
  },
];

const _agentApps: MockAgentApp[] = [
  {
    id: "agapp-contentos",
    name: "ContentOS",
    agent_id: "agent-1",
    agent_name: "Atlas",
    template_source: "content-management-stack",
    status: "running",
    port: 3001,
    directory: "~/.canopy/agent-apps/contentos",
    created_at: "2026-03-20T09:15:00Z",
  },
  {
    id: "agapp-datapipeline",
    name: "Data Pipeline",
    agent_id: "agent-2",
    agent_name: "Sage",
    template_source: null,
    status: "stopped",
    port: null,
    directory: "~/.canopy/agent-apps/data-pipeline",
    created_at: "2026-03-18T14:30:00Z",
  },
  {
    id: "agapp-dashboard",
    name: "Custom Dashboard",
    agent_id: "agent-3",
    agent_name: "Scout",
    template_source: "analytics-dashboard",
    status: "building",
    port: null,
    directory: "~/.canopy/agent-apps/custom-dashboard",
    created_at: "2026-03-24T08:00:00Z",
  },
];

const _resources: MockSystemResources = {
  cpu_percent: 42.7,
  memory_used_gb: 11.4,
  memory_total_gb: 32.0,
  disk_free_gb: 124.6,
  disk_total_gb: 500.0,
  network_connections: 38,
};

const _capabilities: MockCapability[] = [
  {
    id: "cap-computer-use",
    name: "Computer Use",
    available: true,
    details: "Accessibility tree + screenshot capture via macOS adapter",
  },
  {
    id: "cap-filesystem",
    name: "File System",
    available: true,
    details:
      "Read/write access to ~/.canopy and configured workspace directories",
  },
  {
    id: "cap-shell",
    name: "Shell Execution",
    available: true,
    details: "zsh via Tauri sidecar; sandboxed per agent",
  },
  {
    id: "cap-docker",
    name: "Docker",
    available: true,
    details: "Docker Desktop running — agents can build and run containers",
  },
  {
    id: "cap-tauri-bridge",
    name: "Tauri Bridge",
    available: true,
    details: "Native OS APIs via Tauri IPC (notifications, clipboard, dialogs)",
  },
];

export function mockEnvironmentApps(): MockDetectedApp[] {
  return _apps;
}

export function mockEnvironmentAgentApps(): MockAgentApp[] {
  return _agentApps;
}

export function mockEnvironmentResources(): MockSystemResources {
  return { ..._resources, cpu_percent: 30 + Math.random() * 40 };
}

export function mockEnvironmentCapabilities(): MockCapability[] {
  return _capabilities;
}

export function grantEnvironmentAccess(
  appId: string,
  agentId: string,
): MockDetectedApp | undefined {
  const app = _apps.find((a) => a.id === appId);
  if (app && !app.agent_access.includes(agentId)) {
    app.agent_access = [...app.agent_access, agentId];
  }
  return app;
}

export function revokeEnvironmentAccess(
  appId: string,
  agentId: string,
): MockDetectedApp | undefined {
  const app = _apps.find((a) => a.id === appId);
  if (app) {
    app.agent_access = app.agent_access.filter((id) => id !== agentId);
  }
  return app;
}
