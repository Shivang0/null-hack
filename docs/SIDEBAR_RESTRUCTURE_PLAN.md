# Canopy Command Center — Sidebar Restructure Plan

## Status: PRE-IMPLEMENTATION

## Pre-requisites

### PR Triage
1. **PR #12** (`fix/frontend-fixes`) — **CLOSE**. Destructive rebase of already-merged #11. Would delete 6,500 lines of our work (hierarchy store, org improvements, access/departments/divisions/teams/hierarchy/organizations/plugins/secrets/exec-workspaces pages, auth controller, idempotency plug).
2. **PR #13** (`fix/platform-sprint-fixes`) — **MERGE** after removing `erl_crash.dump`. 87 files, 47 bug fixes. Adds mutable mock CRUD, GoalDetail component, auth page, 4 library templates, seeds file. Fixes agent status, costs keys, spawn mapping, skills filter, webhook/alert forms, document CRUD, backend N+1, heartbeat, goal cycle detection.

### Post-Merge Conflict Resolution
PR #13 touches files we also modified. Expected conflicts:
- `desktop/src/routes/app/+layout.svelte` (both added init code)
- `desktop/src/lib/stores/agents.svelte.ts` (both modified)
- `desktop/src/lib/stores/costs.svelte.ts` (both modified)
- `desktop/src/lib/stores/workspace.svelte.ts` (both modified)
- `desktop/src/routes/onboarding/+page.svelte` (both modified)
- `desktop/src/lib/components/layout/Sidebar.svelte` (both modified)
- `desktop/src/lib/api/client.ts` (both modified)

---

## The Problem

Current sidebar: **8 sections, 51 nav items, all at one depth level.** Violates Signal Theory:
- **Shannon**: 51 items exceeds receiver bandwidth
- **Ashby**: Wrong genres grouped together (Memory in Monitor, Webhooks in Orchestrate)
- **Beer**: No structural recursion — 46 flat pages, no nesting
- **Wiener**: No feedback on active org context, open approval loops

## The Architecture: Progressive Disclosure via Depth

### Principle
Each sidebar section is a **nerve cluster**. You see ~10 items at the surface. Each click goes one layer deeper. Never more than ~10 items visible at any depth.

```
Layer 0: WHAT    — 7 concepts (what the system IS)
Layer 1: WHO     — entities (agents, projects, integrations)
Layer 2: HOW     — configuration (tools, access, adapters, budgets)
Layer 3: WHY     — audit trail (logs, history, costs, decisions)
```

### The Sidebar Tree

```
SIDEBAR (always visible)
|
+-- Home                          Cmd1
+-- Inbox                         Cmd2  [badge: pending + unread]
+-- Office                        Cmd3
|
+--- WORK --------------------------------
|   +-- Projects                       [inline: top 5 workspaces]
|   |   +-- + New Project
|   +-- Issues
|   +-- Goals
|   +-- Documents
|   +-- + New Issue
|
+--- AGENTS ------------------------------
|   +-- Team: Engineering              [badge: 3]
|   |   +-- Data Engineer
|   |   +-- Code Reviewer
|   |   +-- DevOps Agent
|   +-- Team: Marketing                [badge: 2]
|   |   +-- Content Strategist
|   |   +-- SEO Analyst
|   +-- Unassigned                     [badge: 1]
|   |   +-- General Assistant
|   +-- View all (6)
|   +-- + Deploy Agent
|
+--- OBSERVE -----------------------------
|   +-- Activity                       [live dot]
|   +-- Sessions
|   +-- Costs
|   +-- Signals
|
+--- AUTOMATE ----------------------------
|   +-- Skills
|   +-- Schedules
|   +-- Spawn
|   +-- Alerts
|   +-- Integrations
|
+--- SYSTEM (collapsed by default) ------
|   +-- Organization
|   +-- Org Chart
|   +-- Environment                    <-- NEW
|   +-- Gateways
|   +-- Library
|   +-- Templates
|   +-- Plugins
|   +-- Webhooks
|   +-- Users
|   +-- Access
|   +-- Secrets
|   +-- Exec Workspaces
|   +-- Audit
|   +-- Config
|
+-- -----------------------------------
+-- Terminal                      CmdT
+-- Settings                      Cmd,
+-- [User Avatar] Name
```

### Collapsed State (default view for new users)
```
Home              Cmd1
Inbox             Cmd2
Office            Cmd3
--- WORK (4) ----------
--- AGENTS (roster) ---
--- OBSERVE (4) -------
--- AUTOMATE (5) ------
--- SYSTEM > ----------
Terminal          CmdT
Settings          Cmd,
[User]
```
**~10 visible items.** Agents section always expanded (your workforce).

---

## What Moved Where (every page accounted for)

### Surface (Depth 0) — 3 items
| Item | Was | Now | Rationale |
|------|-----|-----|-----------|
| Home | Core > Dashboard | Surface | Daily driver, always visible |
| Inbox | Core > Inbox | Surface | Daily driver. Absorbs Approvals badge (same "needs attention" signal) |
| Office | Core > Office | Surface | Daily driver, spatial awareness |

### Work (Depth 0 section) — 4 items + action
| Item | Was | Now | Rationale |
|------|-----|-----|-----------|
| Projects | Projects section (own section) | Work | "What are we building?" — projects are the containers |
| Issues | Ops > Issues | Work | Issues are work items, not "operations" |
| Goals | Ops > Goals | Work | Goals scope the work |
| Documents | Ops > Documents | Work | Knowledge produced during work |
| + New Issue | Top-level button | Work section inline action | Contextual to work, not global |

### Agents (Depth 0 section) — dynamic roster
| Item | Was | Now | Rationale |
|------|-----|-----|-----------|
| [Agent roster] | Team section | Agents | Same content, better label. Grouped by hierarchy teams |
| View all | Team > View all | Agents | Same |
| + Deploy Agent | Team > Hire Agent | Agents | Renamed "Deploy" (agents are deployed, not hired) |

### Observe (Depth 0 section) — 4 items
| Item | Was | Now | Rationale |
|------|-----|-----|-----------|
| Activity | Monitor > Activity | Observe | Ops monitoring = "how's it going?" |
| Sessions | Monitor > Sessions | Observe | Execution history |
| Costs | Monitor > Costs | Observe | Financial monitoring |
| Signals | Monitor > Signals | Observe | Signal/data flow monitoring |

### Automate (Depth 0 section) — 5 items
| Item | Was | Now | Rationale |
|------|-----|-----|-----------|
| Skills | Orchestrate > Skills | Automate | Agent capabilities |
| Schedules | Orchestrate > Schedules | Automate | Cron triggers |
| Spawn | Orchestrate > Spawn | Automate | Ad-hoc execution |
| Alerts | Orchestrate > Alerts | Automate | Event-based triggers |
| Integrations | Orchestrate > Integrations | Automate | External connections (adapters, services) |

### System (Depth 0 section, collapsed) — 14 items
| Item | Was | Now | Rationale |
|------|-----|-----|-----------|
| Organization | Admin > Organizations | System | Org management |
| Org Chart | Structure > Hierarchy | System | Tree view (absorbs Structure section's 4 pages into 1 entry point) |
| Environment | **NEW** | System | Detected apps, agent-built apps, system resources, capabilities |
| Gateways | Admin > Gateways | System | LLM provider config |
| Library | Core > Library | System | Templates/skills marketplace (setup, not daily) |
| Templates | Admin > Templates | System | Agent templates |
| Plugins | Orchestrate > Plugins | System | Extensions |
| Webhooks | Orchestrate > Webhooks | System | Inbound/outbound hooks (plumbing, not automation) |
| Users | Admin > Users | System | User management |
| Access | Admin > Access | System | RBAC |
| Secrets | Admin > Secrets | System | Credential vault |
| Exec Workspaces | Admin > Exec Workspaces | System | Sandbox environments |
| Audit | Admin > Audit | System | Audit log |
| Config | Admin > Config | System | Instance settings |

### Absorbed / Merged Pages
| Page | Action | Rationale |
|------|--------|-----------|
| Approvals `/app/approvals` | Badge merged into Inbox | Same "needs attention" signal. Approvals page still exists, linked from Inbox |
| Logs `/app/logs` | Accessible via Sessions | Logs are session output. Sessions page links to logs. No sidebar slot needed |
| Memory `/app/memory` | Moved to Observe > (was Monitor) | Agent knowledge = observation data |
| Divisions `/app/divisions` | Accessible via Org Chart | Flat list view of one hierarchy level. Org Chart is the entry point |
| Departments `/app/departments` | Accessible via Org Chart | Same reasoning |
| Teams `/app/teams` | Accessible via Org Chart | Same reasoning |
| Workspaces `/app/workspaces` | Accessible via Settings or Projects | Workspace management is setup, not daily nav |

### Pinned (bottom)
| Item | Notes |
|------|-------|
| Terminal | Future: embedded terminal (currently stub) |
| Settings | 7-tab settings page |
| User avatar | Links to settings/profile |

---

## New Page: Environment

### Purpose
The "body awareness" layer — what's running on the host machine, what agents have built, what capabilities are available.

### Sections
1. **Detected Apps** — Apps running on the host OS (N8N, VS Code, Chrome, Postgres, Figma, etc.)
   - Auto-detected via Tauri system APIs (process list, listening ports)
   - Each app shows: name, status (running/stopped), port (if applicable), which agents have access
   - Grant/revoke per-agent access

2. **Agent-Built Apps** — Apps created by agents (from templates or custom)
   - ContentOS, custom dashboards, data pipelines, etc.
   - Shows: name, which agent built it, template source (if any), running status, port, resource usage

3. **System Resources** — CPU, RAM, disk, network utilization
   - Tauri sysinfo APIs

4. **Capabilities** — What this machine can do
   - Computer Use (macOS accessibility API status)
   - File System access level
   - Shell (which shell, permissions)
   - Tauri Bridge status
   - Docker (available? running?)

### API Surface (backend)
```
GET  /api/v1/environment/apps          — detected running apps
GET  /api/v1/environment/agent-apps    — agent-created apps
GET  /api/v1/environment/resources     — system resource snapshot
GET  /api/v1/environment/capabilities  — available capabilities
POST /api/v1/environment/apps/:id/grant   — grant agent access to app
POST /api/v1/environment/apps/:id/revoke  — revoke agent access
```

### Store
`environmentStore` — fetches on mount, polls resources every 30s, caches app list.

### Depends On
- Tauri sysinfo plugin for process/port detection
- Agent `tool_permissions` field (new) for per-agent app access control
- Adapter detection from existing `$lib/services/adapters`

---

## Implementation Order

### Phase 0: Merge & Stabilize
1. Close PR #12 (destructive rebase)
2. Merge PR #13 (exclude erl_crash.dump)
3. Resolve merge conflicts
4. Run `svelte-check --threshold error` → 0 errors
5. Run `mix compile` → 0 errors

### Phase 1: Sidebar Restructure (frontend only)
1. Rewrite `Sidebar.svelte` nav sections per the tree above
2. Update collapsed icon-only mode to match new sections
3. Update keyboard shortcuts (Cmd1/2/3 = Home/Inbox/Office)
4. Move "New Issue" button into Work section
5. Rename "Hire Agent" → "Deploy Agent"
6. Remove Library from top-level Core section
7. Move Approvals badge to Inbox nav item

### Phase 2: Inbox Absorbs Approvals
1. Update Inbox page to add "Approvals" filter tab
2. Show pending approvals inline in Inbox feed
3. Keep `/app/approvals` route working (deep link compat)
4. Remove Approvals from sidebar (badge now on Inbox)

### Phase 3: Environment Page (NEW)
1. Create `environmentStore`
2. Create `/app/environment/+page.svelte`
3. Backend: environment controller (app detection, capabilities)
4. Tauri: sysinfo integration for process/port scanning
5. Wire into Agent Detail → Tools tab (per-agent app access)

### Phase 4: Agent Detail — Tools/App Access Tab
1. Add "App Access" sub-section to Agent Detail Tools tab
2. Show detected apps with grant/revoke toggles per agent
3. Show agent-built apps this agent created
4. Wire to Environment store data

### Phase 5: Org Chart Consolidation
1. Make Org Chart (`/app/hierarchy`) the single entry for all structure
2. Add inline navigation: click Division → see departments, click Department → see teams
3. Keep `/app/divisions`, `/app/departments`, `/app/teams` routes for deep links
4. Remove Divisions, Departments, Teams from sidebar (only Org Chart remains)

---

## Pages After Restructure

### In Sidebar (direct nav): 27 items
```
Home, Inbox, Office
Projects, Issues, Goals, Documents
[Agent roster — dynamic]
Activity, Sessions, Costs, Signals
Skills, Schedules, Spawn, Alerts, Integrations
Organization, Org Chart, Environment, Gateways, Library, Templates,
  Plugins, Webhooks, Users, Access, Secrets, Exec Workspaces, Audit, Config
Terminal, Settings
```

### Accessible via parent (no sidebar slot): 19 routes
```
/app/approvals          — via Inbox filter tab
/app/logs               — via Sessions detail
/app/memory             — via Observe section (in sidebar as sub-item or via search)
/app/divisions          — via Org Chart click-through
/app/departments        — via Org Chart click-through
/app/teams              — via Org Chart click-through
/app/workspaces         — via Settings or Projects
/app/agents/[id]        — via Agent roster click
/app/projects/[id]      — via Projects click
/app/sessions/[id]      — via Sessions click
/app/library/agents/[id]    — via Library click
/app/library/skills/[id]    — via Library click
/app/library/teams/[id]     — via Library click
/app/library/companies/[id] — via Library click
/app/environment        — NEW, via System section
/app/auth               — NEW from PR #13, login page
/app/office             — via Surface
```

### Total: 46 existing + 1 new (Environment) + 1 new from PR #13 (Auth) = 48 routes

---

## Verification Checklist
- [ ] `npx svelte-check --threshold error` → 0 errors
- [ ] `cd backend && mix compile` → 0 errors
- [ ] All 48 routes reachable (no orphan pages)
- [ ] Keyboard shortcuts work (Cmd1/2/3/T/,/K/\)
- [ ] Collapsed sidebar shows correct icons
- [ ] System section collapsed by default
- [ ] Agents section always shows roster
- [ ] Inbox badge = unread + pending approvals
- [ ] Org Chart click-through reaches divisions/departments/teams
- [ ] Environment page detects at least process list
- [ ] No broken imports or missing stores
