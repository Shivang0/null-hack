// src/lib/stores/audit.svelte.ts
import type { AuditEntry } from "$api/types";
import { audit as auditApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class AuditStore {
  entries = $state<AuditEntry[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);
  page = $state(1);
  hasMore = $state(true);
  searchQuery = $state("");

  readonly LIMIT = 50;

  filteredEntries = $derived.by(() => {
    if (!this.searchQuery) return this.entries;
    const q = this.searchQuery.toLowerCase();
    return this.entries.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.entity_type.toLowerCase().includes(q) ||
        e.entity_id.toLowerCase().includes(q),
    );
  });

  totalCount = $derived(this.entries.length);

  async fetchEntries(reset = false): Promise<void> {
    if (reset) {
      this.page = 1;
      this.entries = [];
      this.hasMore = true;
    }
    this.loading = true;
    try {
      const fresh = await auditApi.list(this.page, this.LIMIT);
      this.entries = reset ? fresh : [...this.entries, ...fresh];
      this.hasMore = fresh.length === this.LIMIT;
      this.page = this.page + 1;
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load audit log", msg);
    } finally {
      this.loading = false;
    }
  }

  setSearch(q: string): void {
    this.searchQuery = q;
  }
}

export const auditStore = new AuditStore();
