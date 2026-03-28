// src/lib/stores/memory.svelte.ts
import type {
  MemoryEntry,
  MemoryNamespace,
  MemoryCreateRequest,
} from "$api/types";
import { memory as memoryApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

const PAGE_SIZE = 20;

// ── Knowledge entry shape (superset of MemoryEntry) ──────────────────────────
export type KnowledgeCategory =
  | "fact"
  | "procedure"
  | "preference"
  | "observation"
  | "decision"
  | "context";

export interface KnowledgeEntry extends MemoryEntry {
  agent_id: string;
  agent_name: string;
  category: KnowledgeCategory;
  confidence: number;
  source: string;
  related_entries: string[];
  tags: string[];
  // metadata fields promoted for convenience
  created_at: string;
  updated_at: string;
  access_count: number;
}

// ── Category metadata ─────────────────────────────────────────────────────────
export const CATEGORY_META: Record<
  KnowledgeCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  fact: {
    label: "Fact",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.25)",
  },
  procedure: {
    label: "Procedure",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
  },
  preference: {
    label: "Preference",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
  },
  observation: {
    label: "Observation",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
  },
  decision: {
    label: "Decision",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.12)",
    border: "rgba(244,114,182,0.25)",
  },
  context: {
    label: "Context",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.25)",
  },
};

// ── Normalize raw API entry into KnowledgeEntry ───────────────────────────────
function toKnowledgeEntry(raw: MemoryEntry): KnowledgeEntry {
  const r = raw as unknown as Record<string, unknown>;
  const meta = raw.metadata ?? {};

  // category: prefer explicit field, fall back to namespace-based inference
  const categoryRaw = (r["category"] as string) ?? raw.namespace ?? "fact";
  const knownCategories: KnowledgeCategory[] = [
    "fact",
    "procedure",
    "preference",
    "observation",
    "decision",
    "context",
  ];
  const category: KnowledgeCategory = knownCategories.includes(
    categoryRaw as KnowledgeCategory,
  )
    ? (categoryRaw as KnowledgeCategory)
    : "fact";

  return {
    ...raw,
    agent_id: (r["agent_id"] as string) ?? meta.agent_id ?? "unknown",
    agent_name: (r["agent_name"] as string) ?? meta.agent ?? "Unknown Agent",
    category,
    confidence:
      typeof r["confidence"] === "number" ? (r["confidence"] as number) : 0.8,
    source: (r["source"] as string) ?? "unknown",
    related_entries: Array.isArray(r["related_entries"])
      ? (r["related_entries"] as string[])
      : [],
    tags: Array.isArray(r["tags"]) ? (r["tags"] as string[]) : [],
    created_at:
      (r["created_at"] as string) ??
      meta.created_at ??
      new Date().toISOString(),
    updated_at:
      (r["updated_at"] as string) ??
      meta.updated_at ??
      new Date().toISOString(),
    access_count:
      typeof r["access_count"] === "number"
        ? (r["access_count"] as number)
        : (meta.access_count ?? 0),
  };
}

class MemoryStore {
  // ── Raw data ────────────────────────────────────────────────────────────────
  entries = $state<MemoryEntry[]>([]);
  namespaces = $state<MemoryNamespace[]>([]);

  // ── Selection / navigation ──────────────────────────────────────────────────
  selected = $state<KnowledgeEntry | null>(null);
  activeNamespace = $state<string>("all");

  // ── View state ───────────────────────────────────────────────────────────────
  viewMode = $state<"list" | "graph">("list");
  activeCategory = $state<KnowledgeCategory | "all">("all");

  // ── Search ──────────────────────────────────────────────────────────────────
  searchQuery = $state("");
  isSearching = $state(false);

  // ── Loading / error ─────────────────────────────────────────────────────────
  loading = $state(false);
  error = $state<string | null>(null);

  // ── Pagination ──────────────────────────────────────────────────────────────
  page = $state(1);
  pageSize = $state(PAGE_SIZE);

  // ── Knowledge derived ────────────────────────────────────────────────────────
  knowledgeEntries = $derived(this.entries.map(toKnowledgeEntry));

  filteredEntries = $derived.by(() => {
    let result = this.knowledgeEntries;

    if (this.activeNamespace !== "all") {
      result = result.filter((e) => e.namespace === this.activeNamespace);
    }

    if (this.activeCategory !== "all") {
      result = result.filter((e) => e.category === this.activeCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.key.toLowerCase().includes(q) ||
          e.value.toLowerCase().includes(q) ||
          e.namespace.toLowerCase().includes(q) ||
          e.agent_name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  });

  totalCount = $derived(this.filteredEntries.length);

  paginatedEntries = $derived.by(() => {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredEntries.slice(start, start + this.pageSize);
  });

  totalPages = $derived(
    Math.max(1, Math.ceil(this.totalCount / this.pageSize)),
  );
  hasNextPage = $derived(this.page < this.totalPages);
  hasPrevPage = $derived(this.page > 1);

  // By category counts (over ALL entries, not just filtered)
  byCategory = $derived.by(() => {
    const counts = new Map<KnowledgeCategory, number>();
    for (const e of this.knowledgeEntries) {
      counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    }
    return counts;
  });

  // By agent (name → count)
  byAgent = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const e of this.knowledgeEntries) {
      counts.set(e.agent_name, (counts.get(e.agent_name) ?? 0) + 1);
    }
    return counts;
  });

  // Average confidence across all entries
  avgConfidence = $derived.by(() => {
    if (this.knowledgeEntries.length === 0) return 0;
    const sum = this.knowledgeEntries.reduce((acc, e) => acc + e.confidence, 0);
    return sum / this.knowledgeEntries.length;
  });

  // 5 most recently updated entries
  recentEntries = $derived(
    [...this.knowledgeEntries]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 5),
  );

  namespaceSummary = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const e of this.entries) {
      counts.set(e.namespace, (counts.get(e.namespace) ?? 0) + 1);
    }
    return counts;
  });

  // ── Normalize legacy entries ──────────────────────────────────────────────────
  #normalizeEntries(entries: MemoryEntry[]): MemoryEntry[] {
    return entries.map((e) => {
      const raw = e as unknown as Record<string, unknown>;
      return {
        ...e,
        value: (raw.content as string) ?? e.value,
        namespace: (raw.category as string) ?? e.namespace,
      };
    });
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  async fetch(): Promise<void> {
    this.loading = true;
    try {
      const [rawEntries, namespaces] = await Promise.all([
        memoryApi.list(),
        memoryApi.namespaces(),
      ]);
      this.entries = this.#normalizeEntries(rawEntries);
      this.namespaces = namespaces;
      this.error = null;
      if (this.selected) {
        const refreshed = this.entries.find((e) => e.id === this.selected!.id);
        this.selected = refreshed ? toKnowledgeEntry(refreshed) : null;
      }
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load memory", msg);
    } finally {
      this.loading = false;
    }
  }

  // ── Knowledge-specific methods ────────────────────────────────────────────────
  async fetchKnowledge(): Promise<void> {
    return this.fetch();
  }

  async searchKnowledge(q: string): Promise<void> {
    this.searchQuery = q;
    this.page = 1;

    if (!q.trim()) {
      this.isSearching = false;
      await this.fetch();
      return;
    }

    this.isSearching = true;
    try {
      const results = await memoryApi.search(q);
      this.entries = this.#normalizeEntries(results);
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Search failed", msg);
    } finally {
      this.isSearching = false;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    return this.delete(id);
  }

  getRelated(id: string): KnowledgeEntry[] {
    const entry = this.knowledgeEntries.find((e) => e.id === id);
    if (!entry) return [];
    return entry.related_entries
      .map((relId) => this.knowledgeEntries.find((e) => e.id === relId))
      .filter((e): e is KnowledgeEntry => e !== undefined);
  }

  // ── Legacy search (used by older code paths) ──────────────────────────────────
  async search(q: string): Promise<void> {
    return this.searchKnowledge(q);
  }

  async getByNamespace(ns: string): Promise<void> {
    this.activeNamespace = ns;
    this.page = 1;
    this.loading = true;
    try {
      const rawEntries = await memoryApi.list(ns === "all" ? undefined : ns);
      this.entries = this.#normalizeEntries(rawEntries);
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load namespace", msg);
    } finally {
      this.loading = false;
    }
  }

  async create(entryData: MemoryCreateRequest): Promise<MemoryEntry | null> {
    this.loading = true;
    try {
      const created = await memoryApi.create(entryData);
      this.entries = [created, ...this.entries];
      const ns = this.namespaces.find((n) => n.name === created.namespace);
      if (ns) {
        this.namespaces = this.namespaces.map((n) =>
          n.name === created.namespace ? { ...n, count: n.count + 1 } : n,
        );
      } else {
        this.namespaces = [
          ...this.namespaces,
          { name: created.namespace, count: 1 },
        ];
      }
      this.error = null;
      toastStore.success(
        "Entry created",
        `"${created.key}" saved to ${created.namespace}`,
      );
      return created;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to create entry", msg);
      return null;
    } finally {
      this.loading = false;
    }
  }

  async update(
    id: string,
    patch: Partial<MemoryCreateRequest>,
  ): Promise<MemoryEntry | null> {
    const previous = this.entries;
    const prevSelected = this.selected;
    // Optimistic update
    this.entries = this.entries.map((e) =>
      e.id === id
        ? {
            ...e,
            ...(patch.key !== undefined ? { key: patch.key } : {}),
            ...(patch.value !== undefined ? { value: patch.value } : {}),
            ...(patch.value_type !== undefined
              ? { value_type: patch.value_type }
              : {}),
            metadata: { ...e.metadata, updated_at: new Date().toISOString() },
          }
        : e,
    );
    if (this.selected?.id === id) {
      const updated = this.entries.find((e) => e.id === id);
      if (updated) this.selected = toKnowledgeEntry(updated);
    }

    try {
      const updated = await memoryApi.update(id, patch);
      this.entries = this.entries.map((e) => (e.id === id ? updated : e));
      if (this.selected?.id === id) this.selected = toKnowledgeEntry(updated);
      this.error = null;
      toastStore.success("Entry updated");
      return updated;
    } catch (e) {
      this.entries = previous;
      this.selected = prevSelected;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to update entry", msg);
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    const previous = this.entries;
    const prevSelected = this.selected;
    const entry = this.entries.find((e) => e.id === id);

    this.entries = this.entries.filter((e) => e.id !== id);
    if (this.selected?.id === id) this.selected = null;
    if (entry) {
      this.namespaces = this.namespaces.map((n) =>
        n.name === entry.namespace
          ? { ...n, count: Math.max(0, n.count - 1) }
          : n,
      );
    }

    try {
      await memoryApi.delete(id);
      this.error = null;
      toastStore.success("Entry deleted");
    } catch (e) {
      this.entries = previous;
      this.selected = prevSelected;
      if (entry) {
        this.namespaces = this.namespaces.map((n) =>
          n.name === entry.namespace ? { ...n, count: n.count + 1 } : n,
        );
      }
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to delete entry", msg);
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  selectEntry(entry: KnowledgeEntry | MemoryEntry | null): void {
    this.selected = entry ? toKnowledgeEntry(entry) : null;
  }

  setActiveNamespace(ns: string): void {
    this.activeNamespace = ns;
    this.page = 1;
    this.selected = null;
    if (this.searchQuery) this.searchQuery = "";
  }

  setActiveCategory(cat: KnowledgeCategory | "all"): void {
    this.activeCategory = cat;
    this.page = 1;
  }

  setViewMode(mode: "list" | "graph"): void {
    this.viewMode = mode;
  }

  setSearch(q: string): void {
    this.searchQuery = q;
    this.page = 1;
  }

  nextPage(): void {
    if (this.hasNextPage) this.page++;
  }

  prevPage(): void {
    if (this.hasPrevPage) this.page--;
  }

  reset(): void {
    this.entries = [];
    this.namespaces = [];
    this.selected = null;
    this.activeNamespace = "all";
    this.activeCategory = "all";
    this.searchQuery = "";
    this.page = 1;
    this.error = null;
  }

  // Legacy compat
  filterAgentId = $state<string | null>(null);

  async fetchEntries(agentId?: string): Promise<void> {
    this.filterAgentId = agentId ?? null;
    await this.fetch();
  }

  setAgentFilter(agentId: string | null): void {
    this.filterAgentId = agentId;
  }
}

export const memoryStore = new MemoryStore();
