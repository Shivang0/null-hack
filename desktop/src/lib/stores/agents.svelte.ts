// src/lib/stores/agents.svelte.ts
import type {
  CanopyAgent,
  AgentStatus,
  AgentLifecycleAction,
  AgentCreateRequest,
  HierarchyNode,
} from "$api/types";

export type AgentViewMode = "grid" | "org" | "table";
import { agents as agentsApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class AgentsStore {
  agents = $state<CanopyAgent[]>([]);
  hierarchy = $state<HierarchyNode[]>([]);
  selected = $state<CanopyAgent | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  // View state
  viewMode = $state<"grid" | "org" | "table">("grid");
  filterStatus = $state<AgentStatus | "all">("all");
  searchQuery = $state("");

  // Derived
  activeCount = $derived(
    this.agents.filter((a) => a.status === "running" || a.status === "idle")
      .length,
  );
  totalCount = $derived(this.agents.length);

  filteredAgents = $derived.by(() => {
    let result = this.agents;
    if (this.filterStatus !== "all") {
      result = result.filter((a) => a.status === this.filterStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.display_name.toLowerCase().includes(q),
      );
    }
    return result;
  });

  async fetchAgents(workspaceId?: string): Promise<void> {
    this.loading = true;
    try {
      this.agents = await agentsApi.list(workspaceId);
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load agents", msg);
    } finally {
      this.loading = false;
    }
  }

  async fetchHierarchy(): Promise<void> {
    this.loading = true;
    try {
      const data = await agentsApi.hierarchy();
      const raw = (data.hierarchy ?? []) as HierarchyNode[];

      if (raw.length > 0) {
        // Use the dedicated hierarchy endpoint result directly
        this.hierarchy = raw;
      } else {
        // Fall back: synthesise from agent list using reports_to relationships
        try {
          const agents = await agentsApi.list();
          const nodeMap = new Map<string, HierarchyNode>();

          // First pass: create a node for every agent
          for (const a of agents) {
            nodeMap.set(a.id, {
              agent_id: a.id,
              agent_name: a.display_name || a.name,
              reports_to:
                (a as unknown as { reports_to?: string | null }).reports_to ??
                null,
              org_role: "engineer" as const,
              title: a.role,
              org_order: 0,
              children: [],
            });
          }

          // Second pass: attach children to parents
          const roots: HierarchyNode[] = [];
          for (const node of nodeMap.values()) {
            if (node.reports_to && nodeMap.has(node.reports_to)) {
              nodeMap.get(node.reports_to)!.children.push(node);
            } else {
              roots.push(node);
            }
          }

          this.hierarchy = roots;
        } catch (e) {
          // Fallback list call failed — surface the error so the UI can react
          this.hierarchy = [];
          this.error = (e as Error).message ?? "Failed to load hierarchy";
        }
      }

      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load hierarchy", msg);
    } finally {
      this.loading = false;
    }
  }

  async createAgent(data: AgentCreateRequest): Promise<CanopyAgent | null> {
    this.loading = true;
    try {
      const created = await agentsApi.create(data);
      this.agents = [created, ...this.agents];
      this.error = null;
      toastStore.success("Agent created", `${created.display_name} is ready.`);
      return created;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to create agent", msg);
      return null;
    } finally {
      this.loading = false;
    }
  }

  async performAction(id: string, action: AgentLifecycleAction): Promise<void> {
    // Optimistic update
    const previousAgents = this.agents;
    const optimisticStatus: Record<AgentLifecycleAction, AgentStatus> = {
      wake: "idle",
      sleep: "sleeping",
      focus: "running",
      pause: "paused",
      resume: "running",
      terminate: "terminated",
    };
    this.agents = this.agents.map((a) =>
      a.id === id ? { ...a, status: optimisticStatus[action] } : a,
    );
    if (this.selected?.id === id) {
      this.selected = { ...this.selected, status: optimisticStatus[action] };
    }
    try {
      const updated =
        action === "resume"
          ? await agentsApi.resume(id)
          : await agentsApi.action(id, action);
      this.agents = this.agents.map((a) => (a.id === id ? updated : a));
      if (this.selected?.id === id) {
        this.selected = updated;
      }
      this.error = null;
    } catch (e) {
      // Rollback on failure
      this.agents = previousAgents;
      if (this.selected?.id === id) {
        this.selected =
          previousAgents.find((a) => a.id === id) ?? this.selected;
      }
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error(`Action "${action}" failed`, msg);
    }
  }

  async deleteAgent(id: string): Promise<void> {
    const previousAgents = this.agents;
    // Optimistic remove
    this.agents = this.agents.filter((a) => a.id !== id);
    if (this.selected?.id === id) {
      this.selected = null;
    }
    try {
      await agentsApi.terminate(id);
      this.error = null;
      toastStore.success("Agent terminated");
    } catch (e) {
      // Rollback
      this.agents = previousAgents;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to terminate agent", msg);
    }
  }

  selectAgent(agent: CanopyAgent | null): void {
    this.selected = agent;
  }

  getById(id: string): CanopyAgent | null {
    return this.agents.find((a) => a.id === id) ?? null;
  }

  setViewMode(mode: "grid" | "org" | "table"): void {
    this.viewMode = mode;
  }

  setSearch(q: string): void {
    this.searchQuery = q;
  }

  async fetchAgent(id: string): Promise<CanopyAgent | null> {
    try {
      return await agentsApi.get(id);
    } catch (e) {
      this.error = (e as Error).message;
      return null;
    }
  }
}

export const agentsStore = new AgentsStore();
