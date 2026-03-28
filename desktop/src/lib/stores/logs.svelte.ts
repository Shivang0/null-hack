// src/lib/stores/logs.svelte.ts
import type { LogEntry } from "$api/types";
import { logs as logsApi } from "$api/client";
import { connectSSE, type StreamController } from "$api/sse";
import { toastStore } from "./toasts.svelte";

// Extend the base LogEntry level union to include aliases used in the UI
export type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "warning"
  | "error"
  | "fatal";

export interface LogEntryEx extends Omit<LogEntry, "level"> {
  level: LogLevel;
  agent_id?: string;
  agent_name?: string;
  stack_trace?: string;
}

export interface LogFetchParams {
  limit?: number;
  since?: string;
  level?: LogLevel;
  source?: string;
  agent_id?: string;
}

const MAX_ENTRIES = 10_000;

class LogsStore {
  // Ring buffer — newest first
  entries = $state<LogEntryEx[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);
  connected = $state(false);
  isPaused = $state(false);

  // Filters
  filterLevels = $state<Set<LogLevel>>(new Set());
  filterSource = $state<string>("all");
  filterAgent = $state<string>("all");
  searchQuery = $state("");

  // Derived: unique sources and agents for dropdowns
  sources = $derived.by(() => {
    const set = new Set<string>();
    for (const e of this.entries) set.add(e.source);
    return Array.from(set).sort();
  });

  agents = $derived.by(() => {
    const set = new Set<string>();
    for (const e of this.entries) {
      if (e.agent_name) set.add(e.agent_name);
    }
    return Array.from(set).sort();
  });

  filteredEntries = $derived.by(() => {
    let result = this.entries;

    if (this.filterLevels.size > 0) {
      result = result.filter((e) => {
        const normalized = this.#normalizeLevel(e.level);
        return (
          this.filterLevels.has(normalized) || this.filterLevels.has(e.level)
        );
      });
    }

    if (this.filterSource !== "all") {
      result = result.filter((e) => e.source === this.filterSource);
    }

    if (this.filterAgent !== "all") {
      result = result.filter((e) => e.agent_name === this.filterAgent);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.message.toLowerCase().includes(q) ||
          e.source.toLowerCase().includes(q) ||
          (e.agent_name ?? "").toLowerCase().includes(q),
      );
    }

    return result;
  });

  // Level stats
  stats = $derived.by(() => {
    const counts: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      warning: 0,
      error: 0,
      fatal: 0,
    };
    for (const e of this.entries) {
      const lvl = this.#normalizeLevel(e.level);
      counts[lvl] = (counts[lvl] ?? 0) + 1;
    }
    return {
      debug: counts.debug,
      info: counts.info,
      warn: counts.warn + counts.warning,
      error: counts.error,
      fatal: counts.fatal,
      total: this.entries.length,
    };
  });

  // SSE stream controller returned by connectSSE
  #sseController: StreamController | null = null;

  async fetch(params: LogFetchParams = {}): Promise<void> {
    this.loading = true;
    try {
      const level =
        params.level ??
        (this.filterLevels.size === 1
          ? Array.from(this.filterLevels)[0]
          : undefined);
      const source = params.source ?? this.filterSource;
      const agent_id = params.agent_id ?? this.filterAgent;
      const raw = await logsApi.list(params.limit ?? 200, {
        level,
        source,
        agent_id,
      });
      const entries: LogEntryEx[] = raw.map((e) => ({
        ...e,
        level: this.#normalizeLevel(e.level as LogLevel),
      }));
      // Merge without duplicates, newest first
      const existingIds = new Set(this.entries.map((e) => e.id));
      const fresh = entries.filter((e) => !existingIds.has(e.id));
      this.entries = this.#trim([...fresh, ...this.entries]);
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load logs", msg);
    } finally {
      this.loading = false;
    }
  }

  startStreaming(): void {
    if (this.#sseController) return;
    // Append current filter params so the backend only sends matching events
    const params = new URLSearchParams();
    if (this.filterLevels.size > 0) {
      params.set("levels", Array.from(this.filterLevels).join(","));
    }
    if (this.filterSource !== "all") {
      params.set("source", this.filterSource);
    }
    if (this.filterAgent !== "all") {
      params.set("agent", this.filterAgent);
    }
    const query = params.toString();
    const path = `/logs/stream${query ? `?${query}` : ""}`;
    this.#sseController = connectSSE(path, {
      onConnect: () => {
        this.connected = true;
        this.error = null;
      },
      onDisconnect: () => {
        this.connected = false;
      },
      onEvent: (event) => {
        if (this.isPaused) return;
        const eventType = (event as { type: string }).type;
        if (eventType === "log_entry" || event.type === "system_event") {
          const payload = (event as { payload?: LogEntryEx }).payload;
          if (payload?.id) {
            this.#prependEntry(payload);
          }
        }
      },
      onError: (err) => {
        this.connected = false;
        this.error = err.message;
      },
    });
  }

  stopStreaming(): void {
    this.#sseController?.abort();
    this.#sseController = null;
    this.connected = false;
  }

  clear(): void {
    this.entries = [];
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  toggleLevel(level: LogLevel): void {
    const normalized = this.#normalizeLevel(level);
    const next = new Set(this.filterLevels);
    if (next.has(normalized)) {
      next.delete(normalized);
    } else {
      next.add(normalized);
    }
    this.filterLevels = next;
  }

  setSource(source: string): void {
    this.filterSource = source;
  }

  setAgent(agent: string): void {
    this.filterAgent = agent;
  }

  setSearch(query: string): void {
    this.searchQuery = query;
  }

  clearFilters(): void {
    this.filterLevels = new Set();
    this.filterSource = "all";
    this.filterAgent = "all";
    this.searchQuery = "";
  }

  #prependEntry(entry: LogEntryEx): void {
    if (this.entries.some((e) => e.id === entry.id)) return;
    const normalized: LogEntryEx = {
      ...entry,
      level: this.#normalizeLevel(entry.level),
    };
    this.entries = this.#trim([normalized, ...this.entries]);
  }

  #trim(entries: LogEntryEx[]): LogEntryEx[] {
    if (entries.length > MAX_ENTRIES) {
      return entries.slice(0, MAX_ENTRIES);
    }
    return entries;
  }

  // Map "warning" → "warn"; keep everything else canonical
  #normalizeLevel(level: LogLevel): LogLevel {
    if (level === "warning") return "warn";
    return level;
  }
}

export const logsStore = new LogsStore();
