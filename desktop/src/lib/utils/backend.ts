import { isTauri } from "./platform";

export async function restartBackend(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("restart_backend");
  } catch {
    // Command may not exist yet
  }
}
