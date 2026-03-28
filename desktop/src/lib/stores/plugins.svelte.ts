// src/lib/stores/plugins.svelte.ts
import type { Plugin, PluginLog, PluginStatus } from "$api/types";
import { plugins as pluginsApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class PluginsStore {
  plugins = $state<Plugin[]>([]);
  logs = $state<PluginLog[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  totalCount = $derived(this.plugins.length);
  activeCount = $derived(
    this.plugins.filter((p) => p.enabled && p.status === "active").length,
  );
  errorCount = $derived(
    this.plugins.filter((p) => p.status === "error").length,
  );

  async fetchPlugins(): Promise<void> {
    this.loading = true;
    try {
      this.plugins = await pluginsApi.list();
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load plugins", msg);
    } finally {
      this.loading = false;
    }
  }

  async togglePlugin(id: string): Promise<void> {
    const previous = this.plugins;
    const plugin = this.plugins.find((p) => p.id === id);
    if (!plugin) return;

    // Optimistic toggle
    this.plugins = this.plugins.map((p) =>
      p.id === id ? { ...p, enabled: !p.enabled } : p,
    );
    try {
      const updated = await pluginsApi.update(id, { enabled: !plugin.enabled });
      this.plugins = this.plugins.map((p) => (p.id === id ? updated : p));
      this.error = null;
      toastStore.success(
        updated.enabled ? "Plugin enabled" : "Plugin disabled",
        updated.name,
      );
    } catch (e) {
      this.plugins = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to toggle plugin", msg);
    }
  }

  async fetchLogs(pluginId: string): Promise<void> {
    this.loading = true;
    try {
      this.logs = await pluginsApi.logs(pluginId);
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load plugin logs", msg);
    } finally {
      this.loading = false;
    }
  }

  async deletePlugin(id: string): Promise<void> {
    const previous = this.plugins;
    this.plugins = this.plugins.filter((p) => p.id !== id);
    try {
      await pluginsApi.delete(id);
      this.error = null;
      toastStore.success("Plugin removed");
    } catch (e) {
      this.plugins = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to remove plugin", msg);
    }
  }

  getById(id: string): Plugin | null {
    return this.plugins.find((p) => p.id === id) ?? null;
  }

  filterByStatus(status: PluginStatus): Plugin[] {
    return this.plugins.filter((p) => p.status === status);
  }
}

export const pluginsStore = new PluginsStore();
