// src/lib/stores/execution-workspaces.svelte.ts
import type { ExecutionWorkspace } from "$api/types";
import { executionWorkspaces as ewApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class ExecutionWorkspacesStore {
  workspaces = $state<ExecutionWorkspace[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  totalCount = $derived(this.workspaces.length);

  activeCount = $derived(
    this.workspaces.filter((w) => w.status === "active").length,
  );
  idleCount = $derived(
    this.workspaces.filter((w) => w.status === "idle").length,
  );

  async fetchWorkspaces(): Promise<void> {
    this.loading = true;
    try {
      const data = await ewApi.list();
      // API returns { execution_workspaces: unknown[] } — cast after fetch
      const raw =
        (data as unknown as { execution_workspaces: ExecutionWorkspace[] })
          .execution_workspaces ?? [];
      this.workspaces = raw;
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load execution workspaces", msg);
    } finally {
      this.loading = false;
    }
  }

  async createWorkspace(data: {
    agent_id?: string;
    directory?: string;
  }): Promise<boolean> {
    this.loading = true;
    try {
      await ewApi.create(data);
      // Refresh list after creation — API doesn't return the new entity
      await this.fetchWorkspaces();
      this.error = null;
      toastStore.success("Workspace created");
      return true;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to create workspace", msg);
      return false;
    } finally {
      this.loading = false;
    }
  }

  async deleteWorkspace(id: string): Promise<void> {
    const previous = this.workspaces;
    this.workspaces = this.workspaces.filter((w) => w.id !== id);
    try {
      await ewApi.delete(id);
      this.error = null;
      toastStore.success("Workspace deleted");
    } catch (e) {
      this.workspaces = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to delete workspace", msg);
    }
  }

  getById(id: string): ExecutionWorkspace | null {
    return this.workspaces.find((w) => w.id === id) ?? null;
  }
}

export const executionWorkspacesStore = new ExecutionWorkspacesStore();
