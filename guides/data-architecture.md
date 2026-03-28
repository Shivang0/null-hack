# Data Architecture Guide

> How to structure, store, and retrieve data in a Canopy workspace. When to use
> files vs databases, how tiers work, what goes where, and why.
>
> Based on patterns proven in the OptimalOS cognitive workspace (269 contexts,
> 416 entities, 1045 edges, 39 modules).

---

## The Two Storage Paradigms

Every piece of data in a Canopy workspace is either a **file** or a **record**.

```
FILES (human-readable, git-versioned)         RECORDS (engine-managed, queryable)
├── context.md    "Ed Honour is..."           ├── search index    (FTS5)
├── signal.md     "Ed called about..."        ├── vector store    (embeddings)
├── SKILL.md      "/qualify — run MEDDPICC"   ├── edges table     (knowledge graph)
├── agent.md      "You are a closer..."       ├── memory tables   (episodic/semantic)
└── output/*.md   Generated artifacts         └── observations    (learning loop)
```

**Files are the source of truth.** Records are derived. You can delete every database
and rebuild from files. You can never delete the files and rebuild from records.

This is the foundational rule: **files are ROM, records are cache.**

---

## The 5 Data Buckets

Every workspace has 5 categories of data. Each has different storage rules,
different lifespans, and different retrieval patterns.

### Bucket 1: Identity & Configuration

**What**: Who is this workspace? What are the rules? What agents exist?
**Files**: `SYSTEM.md`, `company.yaml`, `agents/*.md`, `skills/*/SKILL.md`
**Lifespan**: Permanent until explicitly changed
**Tier**: L0 (SYSTEM.md, company.yaml) + L1 (agents, skills)
**Storage**: Files only. Never in a database.

```
WHY files: These define the workspace itself. They must be:
  - Human-readable (non-technical people configure them)
  - Git-versioned (track every change)
  - Portable (copy to another machine and it works)
  - Editable without tools (any text editor)
```

**When to update**: When ground truth changes. New agent hired, skill added,
governance rules updated, budget changed.

### Bucket 2: Domain Knowledge

**What**: Reference material, playbooks, decision trees, methodologies, templates.
**Files**: `reference/*.md`, `workflows/*.md`, `handoffs/*.md`
**Lifespan**: Permanent, evolves slowly
**Tier**: L2 (loaded for specific tasks, via search)
**Storage**: Files + search index

```
WHY files + index: Knowledge needs to be:
  - Searchable (agent finds the right playbook for the situation)
  - Deep (full MEDDPICC methodology is 2000+ words)
  - Structured (decision trees need headers, tables, flow)
  - Human-editable (domain expert updates the playbook)

The file IS the knowledge. The index makes it findable.
```

**When to update**: When methodology changes, when new playbooks are created,
when the learning loop (`/rethink`) suggests updates.

### Bucket 3: Temporal Signals

**What**: Things that happened. Calls, meetings, decisions, observations, events.
**Files**: `signals/*.md` or node-specific signal files
**Lifespan**: Permanent (historical record) but relevance decays
**Tier**: L2 (searchable) → L3 (engine-managed after aging)
**Storage**: Files + search index + knowledge graph edges + memory tables

```
WHY multi-storage: Signals need to be:
  - Captured quickly (low friction intake)
  - Searchable (find "what did Ed say about pricing?")
  - Cross-referenced (signal about Ed → Ed entity → all Ed signals)
  - Time-aware (recent signals weighted higher)

File captures the content. Index makes it searchable.
Graph connects it to entities. Memory stores extracted facts.
```

**Signal intake pipeline**:
```
Raw input ("Ed called about pricing, wants $2K")
  → Classify: S=(linguistic, note, inform, markdown, note-skeleton)
  → Route: ai-masters (Ed) + money-revenue (pricing)
  → Extract: entities (Ed Honour, $2K), action items, decisions
  → Write: signal file to ai-masters/signals/
  → Index: FTS5 + vector embedding
  → Graph: create/update Ed Honour entity + pricing edge
  → Memory: store episodic record + update semantic facts
  → Cross-ref: copy financial data to money-revenue
```

**When to create**: Every time something happens. Every call, every decision,
every observation. Low friction is critical — if capture is hard, signals get lost.

### Bucket 4: Work Product (Output)

**What**: Things agents BUILD. Proposals, reports, analyses, code, generated content.
**Files**: `output/{genre}/*.md`, `data/*.json`, `src/**/*`
**Lifespan**: Permanent (deliverables), versioned
**Tier**: L2 (searchable for context) but primarily for HUMAN consumption
**Storage**: Files. Optionally indexed for agent retrieval.

```
WHY files: Output is for humans to review:
  - Proposals go to clients
  - Reports go to stakeholders
  - Code gets deployed
  - Everything needs review before going external

File format with frontmatter:
---
genre: proposal
status: draft          ← draft → review → approved → sent
created_by: closer
created_at: 2026-03-20
for: ACME Corp
template: client-brief
---
```

**Output directory structure by genre**:
```
output/
├── proposals/          Client-facing proposals
├── reports/            Internal reports, analyses
├── briefs/             Executive summaries
├── specs/              Technical specifications
├── sequences/          Email sequences, outreach
├── transcripts/        Processed call notes
└── compositions/       Generated from composition templates
```

**When to create**: When a skill produces a deliverable. Status starts at `draft`.
Human promotes to `review` → `approved` → `sent`.

### Bucket 5: Runtime State

**What**: Active tasks, sessions, observations, caches, locks.
**Files**: `.canopy/tasks/`, `.canopy/sessions/`, `.canopy/observations/`
**Lifespan**: Session to permanent (varies by type)
**Tier**: L3 (invisible, engine-managed)
**Storage**: SQLite tables + JSON files. Gitignored.

```
WHY gitignored: Runtime state is:
  - Machine-specific (task locks, session IDs)
  - Ephemeral (completed tasks get archived)
  - High-frequency (updated every heartbeat)

But some runtime data graduates:
  - Observations that accumulate → become procedural memory → become skills
  - Sessions that matter → compressed into episodic memory
  - Task patterns → inform future task estimation
```

**Runtime state types**:

| Type | Storage | Lifespan | Graduates To |
|------|---------|----------|-------------|
| **Tasks** | JSON in `.canopy/tasks/` | Until completed/cancelled | Archived, informs estimation |
| **Sessions** | SQLite or JSON | Until compacted | Episodic memory |
| **Observations** | SQLite `observations` table | Until synthesized | Procedural memory → skills |
| **Locks** | Filesystem (`.lock` files) | Until released | Nothing (pure ephemeral) |
| **Cache** | `.canopy/cache/` or ETS/Redis | Until invalidated | Nothing (rebuilt on demand) |

---

## Tiered Loading: What Loads When

The tier system controls **what enters the agent's context window and when**.
This is the single most important performance decision in a workspace.

```
                    ALWAYS LOADED
                    ┌─────────────────────────┐
         L0        │ SYSTEM.md (~120 lines)    │  ~2K tokens total
                    │ company.yaml (summary)    │  Agent reads on BOOT
                    │ Active task (if any)      │  Every conversation
                    │ Budget status (1 line)    │
                    └────────────┬────────────┘
                                 │
                    ON DEMAND     │ agent discovers from L0
                    ┌────────────┴────────────┐
         L1        │ Agent definition          │  ~2K tokens each
                    │ Skill definition          │  Loaded when task
                    │ L1 summary of a context   │  requires this
                    └────────────┬────────────┘  specific capability
                                 │
                    SEARCHED      │ referenced by L1 or search
                    ┌────────────┴────────────┐
         L2        │ Full reference doc        │  Variable size
                    │ Complete signal file      │  Only the relevant
                    │ Full knowledge note       │  parts, not everything
                    └────────────┬────────────┘
                                 │
                    INVISIBLE     │ called by skills, never by agent
                    ┌────────────┴────────────┐
         L3        │ Search engine             │  0 tokens
                    │ Vector store              │  Powers skills
                    │ Knowledge graph           │  Agent never sees
                    │ Memory tables             │  the infrastructure
                    │ External integrations     │
                    └─────────────────────────┘
```

### L0 Design Rules

L0 is the most expensive real estate in the system. Every token here is loaded
in EVERY conversation. Rules:

1. **Under 2K tokens total.** If SYSTEM.md is 3000 tokens, it's too long. Cut.
2. **Identity + routing only.** Who am I? What do I do? Where do I find things?
3. **No reference material.** Methodology docs, playbooks, decision trees → L2.
4. **No history.** Past signals, completed tasks, old decisions → L2 via search.
5. **Pointers, not content.** "Skills are in `skills/`" not the skill definitions themselves.

**What belongs in L0**:
```markdown
SYSTEM.md:
  - Agent identity (2 sentences)
  - Core loop (5-7 steps)
  - Skill list (names only, 1 line each)
  - Agent list (names + 1-line descriptions)
  - Routing table (keyword → action)
  - Quality rules (3-5 rules)
  - Current priority (1 line, updated weekly)

company.yaml:
  - Mission (1 sentence)
  - Budget (1 line)
  - Org chart (names + roles, no details)
  - Active goals (3-5, names only)
```

### L1 Design Rules

L1 items load when the agent's current task requires them. Each item is ~2K tokens.

1. **Self-contained.** Each agent/skill definition works without needing to load others.
2. **~2K tokens each.** Longer → split into L1 summary + L2 full content.
3. **Discoverable from L0.** SYSTEM.md lists what's available. Agent loads what it needs.
4. **Include usage triggers.** When should this agent/skill be activated?

**L1 summaries for large knowledge bases**:

If your workspace has hundreds of contexts (like OptimalOS with 269), generate
L1 summaries — ~200 word abstracts of each context that capture the key facts.
The agent searches L1 summaries first, then loads L2 (full content) only for
the relevant matches.

```
Context: "Ed Honour — AI Masters Partner"
L0 abstract: "AI Masters course partner, manages curriculum, pricing discussions active"  (~15 words)
L1 summary:  200-word overview of Ed's role, key decisions, current status
L2 full:     Complete context.md with all history, decisions, relationships
```

This gives you **96% token savings** vs loading everything. The agent reads 15-word
abstracts for 269 contexts (4K tokens), finds the 3 relevant ones, loads their
L1 summaries (6K tokens), and only reads full content for the 1 it actually needs.

### L2 Design Rules

L2 is the deep context. Full documents, complete reference material, detailed signals.

1. **Loaded via search.** Agent doesn't browse L2 — it searches and loads matches.
2. **Structured for scanning.** Headers, tables, bullet points. Agent needs to extract
   relevant sections quickly, not read the whole thing.
3. **Cross-referenced.** Frontmatter includes related entities, tags, and links.
4. **Timestamped.** Especially for signals — the agent needs to know how fresh the data is.

### L3 Design Rules

L3 is invisible. The agent never directly accesses engine infrastructure.

1. **Skills are the API.** `/search "query"` not `SELECT * FROM contexts_fts`.
2. **Graceful degradation.** If the engine is down, skills should fall back to file I/O.
3. **No tokens consumed.** Engine results are formatted by the skill before entering
   the context window. Raw database output never touches the agent.

---

## Memory Architecture: The 4 Types

Memory in a Canopy workspace follows 4 types, each with different storage and retrieval patterns.

### Working Memory (RAM)

The agent's current context window. Not stored externally.

- **Size**: Model-dependent (200K for Claude, 128K for GPT-4o)
- **Managed by**: Tiered loading (L0/L1/L2 control what's in the window)
- **When it overflows**: Session compaction → generate handoff summary → fresh context
- **Optimization**: Load L0 first, L1 on demand, L2 only when needed. Never dump everything.

### Episodic Memory (Session Recordings)

What happened in past sessions. Time-indexed, queryable.

- **Storage**: SQLite `episodic_records` table or `.canopy/sessions/*.json`
- **Schema**: `{session_id, timestamp, summary, entities[], decisions[], action_items[]}`
- **Retrieval**: By time range, by entity mention, by keyword search
- **Compaction**: Full transcripts compress to structured summaries. Originals go to cold storage.

**When to record**: End of every session. Automatic — the heartbeat protocol
should compress and store before the agent sleeps.

### Semantic Memory (Facts)

Persistent facts about the world. Entity profiles, relationships, knowledge.

- **Storage**: `context.md` files (source of truth) + SQLite `semantic_records` table (index)
- **Schema**: Entity graph — entities with properties, connected by typed edges
- **Retrieval**: By entity name, by relationship traversal, by semantic search
- **Update**: When ground truth changes. NOT temporal — "Ed's role changed" not "Ed called today."

**The knowledge graph**:
```
Entity: Ed Honour
  Properties: {role: "AI Masters partner", channel: "slack, email, voice"}
  Edges:
    → AI Masters (relationship: "partner")
    → Robert Potter (relationship: "works with")
    → Pricing (relationship: "active discussion")
    → Roberto (relationship: "reports to")
```

**Graph operations**:
- **Triangle detection**: A→B and A→C exist, but B→C doesn't = synthesis opportunity
- **Hub analysis**: Entities with connections >2σ above mean = key nodes
- **Cluster detection**: BFS connected components = isolated knowledge islands
- **Reflection**: Co-occurring entities without edges = missing relationships

### Procedural Memory (Learned Patterns)

How to do things. Extracted from experience, codified as skills or rules.

- **Storage**: YAML files in `.canopy/procedural/` (version controlled)
- **Schema**: `{trigger, pattern, action, confidence, evidence_count}`
- **Retrieval**: By trigger matching against current situation
- **Lifecycle**: Observations → accumulate → reach confidence threshold → synthesize → codify

**The learning loop**:
```
1. OBSERVE: Agent notices friction ("always check duplicates before inserting")
   → Stored as observation with category + confidence

2. ACCUMULATE: Same category gets multiple observations
   → When confidence sum >= threshold: ready for synthesis

3. SYNTHESIZE: Gather all observations + related context → generate insight
   → Structured report with evidence + proposed updates

4. CODIFY: Insight becomes a rule, skill update, or reference doc change
   → Procedural memory graduates to workspace ROM
```

### Foresight Memory (Forward-Looking)

What WILL matter. Predictions, deadlines, anticipated needs.

- **Storage**: SQLite `foresight` table or tagged signals
- **Schema**: `{prediction, confidence, start_time, end_time, duration_days, source}`
- **Retrieval**: By time window (what's relevant this week?), by topic
- **Lifecycle**: Created during signal intake, expires when time window passes

```
Examples:
  "Ed wants pricing finalized by next Wednesday" → foresight, 7 days, high confidence
  "ClinicIQ launch likely delayed to Q3" → foresight, 90 days, medium confidence
  "Bennett will need new closer scripts after AA redesign" → foresight, 30 days, low confidence
```

**This is the bucket most systems miss.** They record what happened. They don't
track what's ABOUT to matter. Foresight memory lets the agent proactively surface
upcoming deadlines, dependencies, and risks during daily boot.

---

## Retrieval Strategy: How to Find Things

### The Retrieval Hierarchy

When the agent needs information, it should follow this order:

```
1. CHECK L0 (already loaded)
   Is it in SYSTEM.md or company.yaml? → Use it. Done.

2. CHECK WORKING MEMORY (current session)
   Was it mentioned earlier in this conversation? → Use it. Done.

3. SEARCH L1 SUMMARIES (cheap, fast)
   Search L0 abstracts and L1 summaries → find relevant contexts → load L1 for top 3.
   If that's enough → Done.

4. SEARCH L2 FULL CONTENT (medium cost)
   Load full content for the 1-2 most relevant L1 matches.
   If that's enough → Done.

5. ENGINE SEARCH (multi-signal)
   Hybrid search: FTS5 keyword + vector semantic + knowledge graph traversal.
   Reciprocal Rank Fusion (RRF) to combine results.
   If that's enough → Done.

6. AGENTIC RETRIEVAL (expensive, thorough)
   LLM judges if results are sufficient.
   If not → generate 2-3 refined sub-queries → search again → combine.
   Last resort. Only for complex queries that simple search misses.
```

### Hybrid Search: How It Works

The best retrieval combines keyword search (exact term matching) with semantic
search (conceptual similarity):

```
Query: "What did Ed say about pricing?"

KEYWORD (FTS5/BM25):
  Searches for exact words: "Ed", "pricing"
  Finds: documents containing those terms
  Good at: Exact matches, names, numbers, specific terms

SEMANTIC (Vector):
  Embeds the query as a vector
  Finds: documents about similar concepts (cost, budget, revenue, deal terms)
  Good at: Conceptual matches, paraphrases, related topics

FUSION (RRF):
  Combines both result sets using Reciprocal Rank Fusion
  Documents appearing in both lists rank highest
  Result: Best of both worlds
```

**When to use which**:

| Query Type | Best Search | Why |
|-----------|------------|-----|
| "Ed Honour" | Keyword | Exact name match |
| "pricing decisions" | Hybrid | Keyword finds "pricing", semantic finds "cost", "budget", "deal" |
| "what should I do about the delayed launch?" | Semantic | No exact keywords to match on |
| "show me everything from March" | Keyword + filter | Date filter, not semantic similarity |

---

## Data Lifecycle: From Capture to Wisdom

```
RAW INPUT                    STRUCTURED STORAGE           CONNECTED KNOWLEDGE        ACTIVE WISDOM
─────────────                ──────────────────           ────────────────────        ─────────────

"Ed called,      INGEST→    Signal file                  Entity: Ed Honour          Agent uses Ed's
 wants $2K"                  ai-masters/signals/          Edge: Ed → pricing         context in next
                             2026-03-20-ed-call.md        Edge: Ed → AI Masters      conversation
                                                          Episodic: call record
                                                          Foresight: pricing
                                                          due next week

"Always check    OBSERVE→    Observation record           Category: "data quality"   After 3+ observations:
 dupes first"                confidence: 0.6              Evidence: 1 instance       /rethink synthesizes
                                                                                     → updates reference doc
                                                                                     → becomes workspace rule

Weekly review    REFLECT→    Updated context.md           Stale edges flagged        /reweave suggests
                             Updated signal.md            Missing triangles found     updates to old content
                             Alignment scores             Hub entities identified     based on new signals
```

The system moves data from left to right automatically:
- **Ingest** captures and classifies
- **Index** makes it searchable
- **Graph** connects it to entities
- **Memory** stores extracted facts and predictions
- **Learning loop** turns friction into wisdom

---

## Anti-Patterns

| Don't | Do | Why |
|-------|----|-----|
| Store everything in L0 | Only identity + routing in L0 | Context window is expensive |
| Put temporal data in context.md | Temporal → signals, persistent → context.md | Mixing causes staleness |
| Skip the search index | Index everything in FTS5 at minimum | Without search, agent guesses which file to read |
| Store knowledge only in databases | Files are source of truth, DB is cache | Files are portable, versioned, human-readable |
| Load full content when L1 suffices | Use tiered loading: L0 → L1 → L2 | 96% token savings |
| Ignore entity extraction | Build knowledge graph edges on every ingest | Graph enables triangle detection, hub analysis, reflection |
| Record only what happened | Also extract foresight (what WILL matter) | Proactive > reactive |
| Manual memory management | Automate via heartbeat: compress → extract → store | Humans forget, agents don't |
| One search method | Hybrid search: keyword + semantic + graph | Each catches what others miss |
| Wait for perfect data to start | Start with files + SQLite, scale up later | The minimal engine handles 90% of workspaces |

---

## Quick Reference: What Goes Where

| Data Type | File | Database Table | Tier | Bucket |
|-----------|------|---------------|------|--------|
| Agent identity | `SYSTEM.md` | — | L0 | Identity |
| Budget/org chart | `company.yaml` | — | L0 | Identity |
| Agent definitions | `agents/*.md` | — | L1 | Identity |
| Skill definitions | `skills/*/SKILL.md` | — | L1 | Identity |
| Playbooks | `reference/*.md` | `contexts_fts` | L2 | Knowledge |
| Decision trees | `reference/*.md` | `contexts_fts` | L2 | Knowledge |
| Workflows | `workflows/*.md` | `contexts_fts` | L2 | Knowledge |
| Call notes | `signals/*.md` | `contexts_fts` + `episodic` | L2 | Signals |
| Decisions | `context.md` (Key Decisions) | `semantic_records` | L2 | Signals |
| Entity profiles | `context.md` | `entities` + `edges` | L2 | Knowledge |
| Generated proposals | `output/proposals/*.md` | optionally indexed | L2 | Output |
| Active tasks | `.canopy/tasks/*.json` | `tasks` | L3 | Runtime |
| Sessions | `.canopy/sessions/*.json` | `sessions` | L3 | Runtime |
| Observations | — | `observations` | L3 | Runtime |
| Foresight | — | `foresight` | L3 | Runtime |
| Search index | — | `contexts_fts` | L3 | Runtime |
| Vector embeddings | — | `vectors` | L3 | Runtime |
| Knowledge graph | — | `entities` + `edges` | L3 | Runtime |

---

## Related

- [`architecture/engine-layer.md`](../architecture/engine-layer.md) — Pluggable backend options for each engine function
- [`architecture/system-model.md`](../architecture/system-model.md) — 4-dimensional coordinate system
- [`architecture/tiered-loading.md`](../architecture/tiered-loading.md) — L0/L1/L2/L3 detailed spec
- [`architecture/memory-architecture.md`](../architecture/memory-architecture.md) — Memory type deep dive
- [`architecture/processing-pipeline.md`](../architecture/processing-pipeline.md) — 6R knowledge pipeline
