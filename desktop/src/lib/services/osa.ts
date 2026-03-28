// src/lib/services/osa.ts
// OSA (Optimal System Agent) setup and health service

import { isTauri } from "$lib/utils/platform";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OsaSetupStep {
  step: string;
  success: boolean;
  message: string;
}

export interface OsaHealth {
  status: string;
  version?: string;
  provider?: string;
  model?: string;
}

// ── Health Check ─────────────────────────────────────────────────────────────

/** Check if OSA is reachable on port 9090 or 9089, return health payload */
export async function checkOsaHealth(): Promise<OsaHealth | null> {
  // Try direct OSA health endpoint on both ports
  for (const port of [9090, 9089]) {
    for (const path of ["/health", "/api/v1/health"]) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}${path}`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) return await res.json();
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

/** Determine which port OSA is responding on */
export async function findOsaPort(): Promise<number | null> {
  for (const port of [9090, 9089]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return port;
    } catch {
      /* try next */
    }
  }
  return null;
}

// ── Setup ────────────────────────────────────────────────────────────────────

/** Run the full OSA setup flow via Tauri IPC */
export async function setupOsa(osaPath?: string): Promise<OsaSetupStep[]> {
  if (!isTauri()) {
    return [
      {
        step: "check",
        success: false,
        message: "OSA setup requires the NULLHACK desktop app",
      },
    ];
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<OsaSetupStep[]>("setup_osa", {
    osaPath: osaPath ?? null,
  });
}

/** Install OSA from scratch using the official install script via Tauri */
export async function installOsa(): Promise<{
  success: boolean;
  output: string;
}> {
  if (!isTauri()) {
    return { success: false, output: "Requires NULLHACK desktop app" };
  }
  const { invoke } = await import("@tauri-apps/api/core");
  try {
    const output = await invoke<string>("install_adapter", {
      adapterId: "osa",
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: String(error) };
  }
}

// ── Onboarding ───────────────────────────────────────────────────────────────

/** Check what OSA's onboarding has detected */
export async function getOsaOnboardingStatus(): Promise<unknown | null> {
  for (const port of [9090, 9089]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/onboarding/status`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {
      /* try next */
    }
  }
  return null;
}
