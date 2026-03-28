// src/lib/services/adapters.ts
// Adapter detection and management via Tauri IPC

import { isTauri } from "$lib/utils/platform";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdapterStatus {
  id: string;
  name: string;
  installed: boolean;
  version: string | null;
  path: string | null;
  running: boolean;
  installHint: string;
}

export interface InstallResult {
  success: boolean;
  output: string;
}

export interface HealthResult {
  healthy: boolean;
  message: string;
}

// ── Detection ────────────────────────────────────────────────────────────────

/** Detect all adapters installed on the user's system via Tauri IPC */
export async function detectAdapters(): Promise<AdapterStatus[]> {
  if (!isTauri()) {
    return getDefaultAdapterStatuses();
  }
  const { invoke } = await import("@tauri-apps/api/core");
  const results = await invoke<AdapterStatus[]>("detect_adapters");

  // Rust uses snake_case in JSON — map install_hint to installHint
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    installed: r.installed,
    version: r.version ?? null,
    path: r.path ?? null,
    running: r.running,
    installHint:
      (r as unknown as Record<string, string>).install_hint ??
      (r as unknown as Record<string, string>).installHint ??
      "",
  }));
}

// ── Installation ─────────────────────────────────────────────────────────────

/** Install an adapter by running its install command in a shell */
export async function installAdapter(id: string): Promise<InstallResult> {
  if (!isTauri()) {
    return { success: false, output: "Not in Tauri environment" };
  }
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    const output = await invoke<string>("install_adapter", { adapterId: id });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: String(error) };
  }
}

// ── Health Checks ────────────────────────────────────────────────────────────

/** Check if a specific adapter is connected and ready */
export async function checkAdapterHealth(id: string): Promise<HealthResult> {
  // For network adapters, check their health endpoints
  const healthEndpoints: Record<string, string> = {
    osa: "http://127.0.0.1:9090/health",
    openclaw: "http://127.0.0.1:8100/health",
    jidoclaw: "http://127.0.0.1:4000/health",
  };

  const endpoint = healthEndpoints[id];
  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        return { healthy: true, message: "Service responding" };
      }
      return { healthy: false, message: `HTTP ${res.status}` };
    } catch {
      return { healthy: false, message: "Service unreachable" };
    }
  }

  // For CLI adapters, re-run detection and check the specific one
  const adapters = await detectAdapters();
  const adapter = adapters.find((a) => a.id === id);
  if (!adapter) {
    return { healthy: false, message: "Adapter not found" };
  }
  if (adapter.installed) {
    return { healthy: true, message: "Binary available" };
  }
  return { healthy: false, message: "Not installed" };
}

// ── Defaults ─────────────────────────────────────────────────────────────────

function getDefaultAdapterStatuses(): AdapterStatus[] {
  return [
    {
      id: "osa",
      name: "OSA",
      installed: false,
      version: null,
      path: null,
      running: false,
      installHint: "Visit miosa.dev/install",
    },
    {
      id: "claude-code",
      name: "Claude Code",
      installed: false,
      version: null,
      path: null,
      running: false,
      installHint: "npm install -g @anthropic-ai/claude-code",
    },
    {
      id: "codex",
      name: "Codex",
      installed: false,
      version: null,
      path: null,
      running: false,
      installHint: "npm install -g @openai/codex",
    },
    {
      id: "openclaw",
      name: "OpenClaw",
      installed: false,
      version: null,
      path: null,
      running: false,
      installHint: "npm install -g openclaw",
    },
    {
      id: "jidoclaw",
      name: "JidoClaw",
      installed: false,
      version: null,
      path: null,
      running: false,
      installHint: "mix archive.install hex jidoclaw",
    },
    {
      id: "hermes",
      name: "Hermes Agent",
      installed: false,
      version: null,
      path: null,
      running: false,
      installHint: "cargo install hermes-agent",
    },
    {
      id: "bash",
      name: "Bash",
      installed: true,
      version: null,
      path: "/bin/bash",
      running: true,
      installHint: "Already installed",
    },
    {
      id: "http",
      name: "HTTP",
      installed: true,
      version: null,
      path: null,
      running: true,
      installHint: "No installation needed",
    },
  ];
}
