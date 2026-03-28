// src/lib/api/mock/memory.ts
// Knowledge entries with rich metadata, categories, and relationship graph

export interface MockMemoryEntry {
  id: string;
  namespace: string;
  key: string;
  value: string;
  value_type: "string" | "json";
  // Knowledge graph extensions
  agent_id: string;
  agent_name: string;
  category:
    | "fact"
    | "procedure"
    | "preference"
    | "observation"
    | "decision"
    | "context";
  confidence: number;
  source: string;
  related_entries: string[];
  tags: string[];
  metadata: {
    agent: string;
    agent_id: string;
    created_at: string;
    updated_at: string;
    access_count: number;
    ttl_seconds: number | null;
  };
}

const now = Date.now();
function ago(ms: number): string {
  return new Date(now - ms).toISOString();
}

const MOCK_ENTRIES: MockMemoryEntry[] = [
  // ── Facts ──────────────────────────────────────────────────────────────────
  {
    id: "mem-001",
    namespace: "knowledge_graph",
    key: "osa.architecture.supervision_tree",
    value: JSON.stringify(
      {
        root: "OptimalSystemAgent.Supervisor",
        children: [
          "Infrastructure.Supervisor",
          "Sessions.Supervisor",
          "AgentServices.Supervisor",
          "Extensions.Supervisor",
        ],
      },
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-5",
    agent_name: "Architect",
    category: "fact",
    confidence: 0.98,
    source: "session-arch-2026-01",
    related_entries: ["mem-002", "mem-010"],
    tags: ["architecture", "otp", "supervision", "osa"],
    metadata: {
      agent: "Architect",
      agent_id: "agent-5",
      created_at: ago(604_800_000),
      updated_at: ago(172_800_000),
      access_count: 234,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-002",
    namespace: "knowledge_graph",
    key: "osa.tools.computer_use.adapters",
    value: JSON.stringify(
      {
        macos: "accessibility tree via AXUIElement",
        linux_x11: "AT-SPI2 + xdotool",
        docker: "container-scoped accessibility",
        remote_ssh: "SSH tunnel + remote X11",
        platform_vm: "Firecracker microVM guest agent",
      },
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-3",
    agent_name: "Backend Elixir",
    category: "fact",
    confidence: 0.95,
    source: "session-computer-use-2026-03",
    related_entries: ["mem-001", "mem-011"],
    tags: ["computer-use", "adapters", "cross-platform", "osa"],
    metadata: {
      agent: "Backend Elixir",
      agent_id: "agent-3",
      created_at: ago(518_400_000),
      updated_at: ago(518_400_000),
      access_count: 28,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-003",
    namespace: "knowledge_graph",
    key: "canopy.foundation.component_list",
    value: JSON.stringify(
      [
        "Button",
        "Input",
        "Textarea",
        "Select",
        "Checkbox",
        "Toggle",
        "Modal",
        "Tooltip",
        "GlassCard",
        "AppCard",
        "Tabs",
        "Menu",
        "Table",
        "ScrollArea",
        "Alert",
        "Toast",
      ],
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-12",
    agent_name: "OSA Frontend Design",
    category: "fact",
    confidence: 0.99,
    source: "session-foundation-audit",
    related_entries: ["mem-004", "mem-005"],
    tags: ["foundation", "components", "ui", "canopy"],
    metadata: {
      agent: "OSA Frontend Design",
      agent_id: "agent-12",
      created_at: ago(259_200_000),
      updated_at: ago(86_400_000),
      access_count: 156,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-004",
    namespace: "knowledge_graph",
    key: "canopy.design_tokens",
    value: JSON.stringify(
      {
        text: ["--dt", "--dt2", "--dt3", "--dt4"],
        bg: ["--dbg", "--dbg2", "--dbg3"],
        border: ["--dbd", "--dbd2"],
        semantic: [
          "--text-primary",
          "--text-secondary",
          "--bg-elevated",
          "--border-default",
        ],
      },
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-8",
    agent_name: "Svelte Specialist",
    category: "fact",
    confidence: 1.0,
    source: "session-design-system-audit",
    related_entries: ["mem-003", "mem-005"],
    tags: ["design-tokens", "css", "foundation", "canopy"],
    metadata: {
      agent: "Svelte Specialist",
      agent_id: "agent-8",
      created_at: ago(86_400_000),
      updated_at: ago(86_400_000),
      access_count: 112,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-005",
    namespace: "knowledge_graph",
    key: "canopy.routes.implemented",
    value: JSON.stringify(
      [
        "/app/dashboard",
        "/app/agents",
        "/app/sessions",
        "/app/activity",
        "/app/goals",
        "/app/issues",
        "/app/inbox",
        "/app/memory",
        "/app/usage",
      ],
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-8",
    agent_name: "Svelte Specialist",
    category: "fact",
    confidence: 0.97,
    source: "session-phase5-build",
    related_entries: ["mem-003", "mem-009"],
    tags: ["routing", "sveltekit", "canopy", "implemented"],
    metadata: {
      agent: "Svelte Specialist",
      agent_id: "agent-8",
      created_at: ago(172_800_000),
      updated_at: ago(3_600_000),
      access_count: 41,
      ttl_seconds: null,
    },
  },

  // ── Procedures ─────────────────────────────────────────────────────────────
  {
    id: "mem-006",
    namespace: "knowledge_graph",
    key: "osa.patterns.class_based_store",
    value:
      "Svelte 5 stores use class syntax with $state/$derived runes. Export singleton instance. Pattern: class FooStore { items = $state([]); filtered = $derived.by(() => ...); async fetch() { ... } }; export const fooStore = new FooStore();",
    value_type: "string",
    agent_id: "agent-8",
    agent_name: "Svelte Specialist",
    category: "procedure",
    confidence: 0.99,
    source: "session-svelte5-migration",
    related_entries: ["mem-004", "mem-007"],
    tags: ["svelte5", "runes", "store-pattern", "procedure"],
    metadata: {
      agent: "Svelte Specialist",
      agent_id: "agent-8",
      created_at: ago(432_000_000),
      updated_at: ago(432_000_000),
      access_count: 67,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-007",
    namespace: "knowledge_graph",
    key: "canopy.css.prefix_system",
    value:
      "Each Svelte component uses a unique 2-3 char CSS prefix to prevent collisions. Check registry.json before picking. Example: mb- (memory browser), act- (activity), ps- (page shell). Never use global selectors in scoped component styles.",
    value_type: "string",
    agent_id: "agent-12",
    agent_name: "OSA Frontend Design",
    category: "procedure",
    confidence: 0.98,
    source: "session-css-conventions",
    related_entries: ["mem-006", "mem-003"],
    tags: ["css", "prefix", "conventions", "canopy"],
    metadata: {
      agent: "OSA Frontend Design",
      agent_id: "agent-12",
      created_at: ago(345_600_000),
      updated_at: ago(345_600_000),
      access_count: 89,
      ttl_seconds: null,
    },
  },

  // ── Preferences ────────────────────────────────────────────────────────────
  {
    id: "mem-008",
    namespace: "agent_context",
    key: "miosa.signal_theory.sn_ratio",
    value:
      "Signal-to-Noise Ratio is the governing metric. S = (M, G, T, F, W). Maximize actionable intent per unit of output. Every sentence must carry actionable intent or necessary context — if not, cut it.",
    value_type: "string",
    agent_id: "agent-1",
    agent_name: "Master Orchestrator",
    category: "preference",
    confidence: 1.0,
    source: "session-signal-theory-init",
    related_entries: ["mem-009"],
    tags: ["signal-theory", "miosa", "communication", "governing"],
    metadata: {
      agent: "Master Orchestrator",
      agent_id: "agent-1",
      created_at: ago(2_592_000_000),
      updated_at: ago(2_592_000_000),
      access_count: 512,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-009",
    namespace: "agent_context",
    key: "osa.output.no_coauthored_commits",
    value:
      "NEVER add Co-Authored-By: Claude or any AI co-author line to commits. No exceptions. Git commit messages should be clean, professional, focused on the why.",
    value_type: "string",
    agent_id: "agent-1",
    agent_name: "Master Orchestrator",
    category: "preference",
    confidence: 1.0,
    source: "session-global-rules",
    related_entries: ["mem-008"],
    tags: ["git", "commits", "rules", "preferences"],
    metadata: {
      agent: "Master Orchestrator",
      agent_id: "agent-1",
      created_at: ago(1_728_000_000),
      updated_at: ago(1_728_000_000),
      access_count: 78,
      ttl_seconds: null,
    },
  },

  // ── Observations ───────────────────────────────────────────────────────────
  {
    id: "mem-010",
    namespace: "knowledge_graph",
    key: "osa.performance.tools_registry_bottleneck",
    value: JSON.stringify(
      {
        finding:
          "Tools.Registry was a GenServer deadlock bottleneck under parallel load",
        fix: "Switched to :persistent_term for parallel execution",
        impact:
          "Eliminated deadlocks, full parallel tool dispatch now possible",
        session: "session-simulation-2026-03",
      },
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-5",
    agent_name: "Architect",
    category: "observation",
    confidence: 0.97,
    source: "session-simulation-2026-03",
    related_entries: ["mem-001", "mem-011"],
    tags: ["performance", "genserver", "bottleneck", "osa", "tools"],
    metadata: {
      agent: "Architect",
      agent_id: "agent-5",
      created_at: ago(1_296_000_000),
      updated_at: ago(1_296_000_000),
      access_count: 44,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-011",
    namespace: "knowledge_graph",
    key: "osa.knowledge.miosa_knowledge_pure_elixir",
    value:
      "miosa_knowledge is 100% pure Elixir — no NIFs, no C deps. Dictionary encoding (String↔64-bit IDs), native SPARQL parser (recursive descent), OWL 2 RL reasoner (16 rules, forward-chaining). Fully independent from triple_store.",
    value_type: "string",
    agent_id: "agent-5",
    agent_name: "Architect",
    category: "observation",
    confidence: 0.99,
    source: "session-knowledge-graph-build",
    related_entries: ["mem-001", "mem-010"],
    tags: ["miosa-knowledge", "elixir", "sparql", "owl", "no-deps"],
    metadata: {
      agent: "Architect",
      agent_id: "agent-5",
      created_at: ago(777_600_000),
      updated_at: ago(777_600_000),
      access_count: 31,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-012",
    namespace: "session_memory",
    key: "session-e5f6.last_error",
    value: JSON.stringify(
      {
        type: "CompileError",
        file: "src/lib/components/activity/ActivityFeed.svelte",
        line: 42,
        message: "Cannot use $state inside a non-rune context",
        resolved: true,
        fix: "Added lang='ts' to script tag to enable rune mode",
      },
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-6",
    agent_name: "Debugger",
    category: "observation",
    confidence: 1.0,
    source: "session-e5f6",
    related_entries: ["mem-006"],
    tags: ["debug", "svelte5", "compile-error", "resolved"],
    metadata: {
      agent: "Debugger",
      agent_id: "agent-6",
      created_at: ago(14_400_000),
      updated_at: ago(14_100_000),
      access_count: 4,
      ttl_seconds: 3600,
    },
  },

  // ── Decisions ──────────────────────────────────────────────────────────────
  {
    id: "mem-013",
    namespace: "session_memory",
    key: "session-c3d4.debate_outcome",
    value: JSON.stringify(
      {
        topic: "Mock data architecture for NULLHACK",
        winner: "class-based store with $derived",
        votes: { for: 3, against: 1 },
        rationale:
          "Aligns with existing agents.svelte.ts pattern. Zero cognitive overhead for future contributors.",
      },
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-7",
    agent_name: "Debate Moderator",
    category: "decision",
    confidence: 0.92,
    source: "session-c3d4",
    related_entries: ["mem-006", "mem-014"],
    tags: ["architecture", "debate", "stores", "canopy"],
    metadata: {
      agent: "Debate Moderator",
      agent_id: "agent-7",
      created_at: ago(7_200_000),
      updated_at: ago(7_200_000),
      access_count: 12,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-014",
    namespace: "knowledge_graph",
    key: "canopy.location.separate_from_osa",
    value: JSON.stringify(
      {
        decision: "NULLHACK is a standalone app, not inside OSA repo",
        canopy_desktop: "/Users/rhl/Desktop/MIOSA/code/canopy/app/desktop/",
        osa_desktop:
          "/Users/rhl/Desktop/MIOSA/code/OptimalSystemAgent/desktop/ (old terminal)",
        rationale:
          "Different product concerns — NULLHACK = command center, OSA = framework",
      },
      null,
      2,
    ),
    value_type: "json",
    agent_id: "agent-1",
    agent_name: "Master Orchestrator",
    category: "decision",
    confidence: 1.0,
    source: "session-canopy-location-2026-03",
    related_entries: ["mem-013", "mem-005"],
    tags: ["canopy", "architecture", "location", "separation"],
    metadata: {
      agent: "Master Orchestrator",
      agent_id: "agent-1",
      created_at: ago(259_200_000),
      updated_at: ago(259_200_000),
      access_count: 23,
      ttl_seconds: null,
    },
  },

  // ── Context ────────────────────────────────────────────────────────────────
  {
    id: "mem-015",
    namespace: "agent_context",
    key: "orchestrator.current_goal",
    value:
      "Build NULLHACK Command Center frontend Phase 5 — Observability (activity, logs, memory, signals, audit)",
    value_type: "string",
    agent_id: "agent-1",
    agent_name: "Master Orchestrator",
    category: "context",
    confidence: 0.99,
    source: "session-a1b2",
    related_entries: ["mem-016", "mem-005"],
    tags: ["current-goal", "phase5", "observability", "canopy"],
    metadata: {
      agent: "Master Orchestrator",
      agent_id: "agent-1",
      created_at: ago(7_200_000),
      updated_at: ago(900_000),
      access_count: 47,
      ttl_seconds: null,
    },
  },
  {
    id: "mem-016",
    namespace: "agent_context",
    key: "orchestrator.active_subagents",
    value: JSON.stringify(["agent-3", "agent-8", "agent-12"], null, 2),
    value_type: "json",
    agent_id: "agent-1",
    agent_name: "Master Orchestrator",
    category: "context",
    confidence: 0.95,
    source: "session-a1b2",
    related_entries: ["mem-015", "mem-017"],
    tags: ["subagents", "active", "session", "context"],
    metadata: {
      agent: "Master Orchestrator",
      agent_id: "agent-1",
      created_at: ago(3_600_000),
      updated_at: ago(120_000),
      access_count: 23,
      ttl_seconds: 86400,
    },
  },
  {
    id: "mem-017",
    namespace: "session_memory",
    key: "session-c3d4.context_snapshot",
    value:
      "Working on NULLHACK Command Center desktop app. Stack: SvelteKit 2 + Tauri 2 + Foundation UI. Phase 5 = Observability (activity, logs, memory, signals, audit). CSS prefix system active — check registry.json before choosing prefix.",
    value_type: "string",
    agent_id: "agent-1",
    agent_name: "Master Orchestrator",
    category: "context",
    confidence: 0.98,
    source: "session-c3d4",
    related_entries: ["mem-016", "mem-004"],
    tags: ["context", "snapshot", "session", "canopy", "stack"],
    metadata: {
      agent: "Master Orchestrator",
      agent_id: "agent-1",
      created_at: ago(3_600_000),
      updated_at: ago(3_600_000),
      access_count: 19,
      ttl_seconds: 86400,
    },
  },
  {
    id: "mem-018",
    namespace: "agent_context",
    key: "svelte-specialist.last_component_built",
    value: "KnowledgeBrowser — Memory page rewrite for Phase 5 observability",
    value_type: "string",
    agent_id: "agent-8",
    agent_name: "Svelte Specialist",
    category: "context",
    confidence: 1.0,
    source: "session-a1b2",
    related_entries: ["mem-015", "mem-006"],
    tags: ["svelte", "component", "memory", "in-progress"],
    metadata: {
      agent: "Svelte Specialist",
      agent_id: "agent-8",
      created_at: ago(1_800_000),
      updated_at: ago(1_800_000),
      access_count: 5,
      ttl_seconds: 3600,
    },
  },
];

export function getMockMemoryEntries(): MockMemoryEntry[] {
  return [...MOCK_ENTRIES];
}

export function getMockMemoryNamespaces(): Array<{
  name: string;
  count: number;
}> {
  const counts = new Map<string, number>();
  for (const e of MOCK_ENTRIES) {
    counts.set(e.namespace, (counts.get(e.namespace) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}

export function getMockMemoryById(id: string): MockMemoryEntry | undefined {
  return MOCK_ENTRIES.find((e) => e.id === id);
}

export function searchMockMemory(q: string): MockMemoryEntry[] {
  if (!q.trim()) return [...MOCK_ENTRIES];
  const lower = q.toLowerCase();
  return MOCK_ENTRIES.filter(
    (e) =>
      e.key.toLowerCase().includes(lower) ||
      e.value.toLowerCase().includes(lower) ||
      e.namespace.toLowerCase().includes(lower) ||
      e.agent_name.toLowerCase().includes(lower) ||
      e.category.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower)),
  );
}

// Mutable store for create/update/delete in mock mode
let _entries: MockMemoryEntry[] = [...MOCK_ENTRIES];

export function getMutableEntries(): MockMemoryEntry[] {
  return _entries;
}

export function createMockEntry(
  data: Omit<MockMemoryEntry, "id" | "metadata"> &
    Partial<Pick<MockMemoryEntry, "metadata">>,
): MockMemoryEntry {
  const entry: MockMemoryEntry = {
    id: `mem-${Date.now()}`,
    namespace: data.namespace,
    key: data.key,
    value: data.value,
    value_type: data.value_type,
    agent_id: data.agent_id,
    agent_name: data.agent_name,
    category: data.category,
    confidence: data.confidence,
    source: data.source,
    related_entries: data.related_entries,
    tags: data.tags,
    metadata: data.metadata ?? {
      agent: data.agent_name,
      agent_id: data.agent_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      access_count: 0,
      ttl_seconds: null,
    },
  };
  _entries = [entry, ..._entries];
  return entry;
}

export function updateMockEntry(
  id: string,
  patch: Partial<MockMemoryEntry>,
): MockMemoryEntry | undefined {
  const idx = _entries.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  const updated: MockMemoryEntry = {
    ..._entries[idx],
    ...patch,
    metadata: {
      ..._entries[idx].metadata,
      ...(patch.metadata ?? {}),
      updated_at: new Date().toISOString(),
    },
  };
  _entries = _entries.map((e) => (e.id === id ? updated : e));
  return updated;
}

export function deleteMockEntry(id: string): boolean {
  const before = _entries.length;
  _entries = _entries.filter((e) => e.id !== id);
  return _entries.length < before;
}
