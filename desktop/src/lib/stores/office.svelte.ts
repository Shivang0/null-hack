// src/lib/stores/office.svelte.ts
import type { CanopyAgent } from "$api/types";
import { agentsStore } from "./agents.svelte";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OfficeZone = "desk" | "hotDesk" | "meeting" | "lounge" | "corridor";
export type ViewMode = "2d" | "3d";

export interface AgentPosition {
  agentId: string;
  zone: OfficeZone;
  x: number;
  y: number;
  slot: number;
}

export interface CollaborationLink {
  fromAgentId: string;
  toAgentId: string;
  /** 0–1, derived from shared workspace membership */
  strength: number;
  sessionKey?: string;
}

// ── Zone layout constants (1200×700 SVG canvas) ───────────────────────────────

/**
 * Each zone definition contains the pixel bounds used to derive x/y from a
 * slot index.  Layout mirrors OpenClaw Office's 2D floor plan:
 *
 *  ┌──────────────┬─────────────────┐
 *  │  desk (0-11) │ meeting (0-5)   │
 *  ├──────────────┼─────────────────┤
 *  │ hotDesk(0-11)│ lounge  (0-5)   │
 *  └──────────────┴─────────────────┘
 */
const ZONE_COLS: Record<OfficeZone, number> = {
  desk: 4,
  hotDesk: 4,
  meeting: 3,
  lounge: 3,
  corridor: 1,
};

const ZONE_SLOTS: Record<OfficeZone, number> = {
  desk: 12, // 4 × 3
  hotDesk: 12, // 4 × 3
  meeting: 6, // 3 × 2 (circular arrangement, treated as grid here)
  lounge: 6, // 3 × 2
  corridor: 1,
};

interface ZoneBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const ZONE_BOUNDS: Record<OfficeZone, ZoneBounds> = {
  desk: { xMin: 50, xMax: 530, yMin: 50, yMax: 310 },
  hotDesk: { xMin: 50, xMax: 530, yMin: 400, yMax: 600 },
  meeting: { xMin: 650, xMax: 1100, yMin: 50, yMax: 310 },
  lounge: { xMin: 650, xMax: 1100, yMin: 400, yMax: 600 },
  corridor: { xMin: 560, xMax: 630, yMin: 300, yMax: 420 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** djb2 hash — deterministic, unsigned 32-bit result */
function djb2(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Map a slot index to pixel (x, y) within a zone's bounding box. */
function slotToPixel(zone: OfficeZone, slot: number): { x: number; y: number } {
  const { xMin, xMax, yMin, yMax } = ZONE_BOUNDS[zone];
  const cols = ZONE_COLS[zone];
  const totalSlots = ZONE_SLOTS[zone];
  const safeSlot = slot % totalSlots;

  const col = safeSlot % cols;
  const row = Math.floor(safeSlot / cols);
  const totalRows = Math.ceil(totalSlots / cols);

  const cellW = (xMax - xMin) / cols;
  const cellH = (yMax - yMin) / totalRows;

  // Centre of cell with a small hash-driven micro-jitter so avatars don't
  // stack exactly when sharing a slot (can happen with small agent sets).
  const x = Math.round(xMin + col * cellW + cellW / 2);
  const y = Math.round(yMin + row * cellH + cellH / 2);

  return { x, y };
}

/**
 * Determine whether an agent is a sub-agent.
 * Sub-agents carry `config.parent_id` (string) set by the caller at creation
 * time — a convention used throughout the NULLHACK agent creation flow.
 */
function isSubAgent(agent: CanopyAgent): boolean {
  return (
    typeof agent.config?.parent_id === "string" && agent.config.parent_id !== ""
  );
}

/**
 * Extract the workspace key used to compute collaboration links.
 * Agents sharing the same `config.workspace_id` are considered collaborators.
 * Falls back to `budget_policy_id` when workspace_id is absent (legacy agents).
 */
function workspaceKey(agent: CanopyAgent): string | null {
  if (
    typeof agent.config?.workspace_id === "string" &&
    agent.config.workspace_id !== ""
  ) {
    return `ws:${agent.config.workspace_id}`;
  }
  if (agent.budget_policy_id) {
    return `bp:${agent.budget_policy_id}`;
  }
  return null;
}

// ── Store ─────────────────────────────────────────────────────────────────────

class OfficeStore {
  // ── Mutable state ──────────────────────────────────────────────────────────
  viewMode = $state<ViewMode>("2d");
  selectedAgentId = $state<string | null>(null);

  // ── Derived: positions ─────────────────────────────────────────────────────
  /**
   * Map from agentId → AgentPosition.  Computed deterministically from
   * agent.id via djb2 so the floor plan is stable across re-renders.
   *
   * Placement rules (evaluated in priority order):
   *  1. running  → meeting zone (regardless of base zone)
   *  2. sub-agent (config.parent_id present) → hotDesk
   *  3. all other regular agents → desk
   *  4. sleeping / paused / error → stay in base zone (desk or hotDesk)
   */
  positions = $derived.by<Map<string, AgentPosition>>(() => {
    const map = new Map<string, AgentPosition>();

    for (const agent of agentsStore.agents) {
      const hash = djb2(agent.id);
      const sub = isSubAgent(agent);

      let zone: OfficeZone;
      if (agent.status === "running") {
        zone = "meeting";
      } else if (sub) {
        zone = "hotDesk";
      } else {
        zone = "desk";
      }

      const slot = hash % ZONE_SLOTS[zone];
      const { x, y } = slotToPixel(zone, slot);

      map.set(agent.id, { agentId: agent.id, zone, x, y, slot });
    }

    return map;
  });

  // ── Derived: collaboration links ───────────────────────────────────────────
  /**
   * Agents sharing the same workspace key get a CollaborationLink.
   * Strength is 1.0 when both are running, 0.5 otherwise.
   */
  collaborationLinks = $derived.by<CollaborationLink[]>(() => {
    const groups = new Map<string, CanopyAgent[]>();

    for (const agent of agentsStore.agents) {
      const key = workspaceKey(agent);
      if (!key) continue;
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(agent);
      } else {
        groups.set(key, [agent]);
      }
    }

    const links: CollaborationLink[] = [];

    for (const [key, members] of groups) {
      if (members.length < 2) continue;
      // Emit one link per pair (n*(n-1)/2 edges)
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const a = members[i];
          const b = members[j];
          const bothRunning = a.status === "running" && b.status === "running";
          links.push({
            fromAgentId: a.id,
            toAgentId: b.id,
            strength: bothRunning ? 1.0 : 0.5,
            sessionKey: key,
          });
        }
      }
    }

    return links;
  });

  // ── Derived: selected agent object ────────────────────────────────────────
  selectedAgent = $derived<CanopyAgent | null>(
    this.selectedAgentId
      ? (agentsStore.agents.find((a) => a.id === this.selectedAgentId) ?? null)
      : null,
  );

  // ── Derived: agents grouped by zone ───────────────────────────────────────
  zoneAgents = $derived.by<Record<OfficeZone, CanopyAgent[]>>(() => {
    const groups: Record<OfficeZone, CanopyAgent[]> = {
      desk: [],
      hotDesk: [],
      meeting: [],
      lounge: [],
      corridor: [],
    };

    for (const agent of agentsStore.agents) {
      const pos = this.positions.get(agent.id);
      if (pos) {
        groups[pos.zone].push(agent);
      }
    }

    return groups;
  });

  // ── Methods ────────────────────────────────────────────────────────────────

  selectAgent(id: string | null): void {
    this.selectedAgentId = id;
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  /**
   * Returns the computed position for an agent, or falls back to a
   * deterministic calculation when the agent is not yet in the store.
   */
  getAgentPosition(agentId: string): {
    x: number;
    y: number;
    zone: OfficeZone;
  } {
    const cached = this.positions.get(agentId);
    if (cached) {
      return { x: cached.x, y: cached.y, zone: cached.zone };
    }

    // Fallback: desk zone, hash-derived slot
    const hash = djb2(agentId);
    const slot = hash % ZONE_SLOTS.desk;
    const { x, y } = slotToPixel("desk", slot);
    return { x, y, zone: "desk" };
  }
}

export const officeStore = new OfficeStore();
