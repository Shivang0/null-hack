// src/lib/stores/settings.svelte.ts
import type { Settings, AdapterType } from "$api/types";
import { settings as settingsApi } from "$api/client";

class SettingsStore {
  data = $state<Settings>({
    theme: "dark",
    font_size: 14,
    sidebar_default_collapsed: false,
    notifications_enabled: true,
    auto_approve_budget_under_cents: 500,
    default_adapter:
      (typeof localStorage !== "undefined"
        ? (localStorage.getItem("canopy-default-adapter") as AdapterType)
        : null) ?? ("osa" as AdapterType),
    default_model: "claude-sonnet-4-6",
    working_directory: "",
    max_concurrent_agents: 10,
    session_timeout_minutes: 60,
    log_level: "info",
    telemetry_enabled: true,
    activity_retention_days: 30,
    budget_enforcement: true,
  });
  // miosaCloud is not part of the Settings API type — stored separately
  miosaCloud = $state(false);
  loading = $state(false);
  error = $state<string | null>(null);
  dirty = $state(false);

  async fetch(): Promise<void> {
    this.loading = true;
    try {
      this.data = await settingsApi.get();
      this.dirty = false;
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.loading = false;
    }
  }

  async save(): Promise<void> {
    this.loading = true;
    try {
      await settingsApi.update(this.data);
      this.dirty = false;
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.loading = false;
    }
  }

  update<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.data = { ...this.data, [key]: value };
    this.dirty = true;
  }

  /** Load adapter and miosaCloud settings from Tauri secure store.
   *  Must be called after the app shell mounts in Tauri context.
   */
  async loadFromTauriStore(): Promise<void> {
    try {
      const { isTauri } = await import("$lib/utils/platform");
      if (!isTauri()) return;
      const { Store } = await import("@tauri-apps/plugin-store");
      const store = await Store.load("settings.json");
      const adapter = await store.get<string>("default_adapter");
      if (adapter)
        this.data = { ...this.data, default_adapter: adapter as AdapterType };
      const cloud = await store.get<boolean>("miosa_cloud");
      if (cloud !== null && cloud !== undefined) {
        this.miosaCloud = cloud;
      }
    } catch {
      // Not in Tauri or store unavailable — silently ignore
    }
  }
}

export const settingsStore = new SettingsStore();
