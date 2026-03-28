# Known Issues — Canopy Platform

> All issues discovered and documented during PR #3 and PR #4 by Saeed.
> Last updated: 2026-03-22

---

## Overview

Across two pull requests (71 files changed, +2558/-815 lines), the following categories of problems were encountered. Issues marked **FIXED** were resolved in the PRs. Issues marked **OPEN** remain unresolved.

| Category | Fixed | Open |
|----------|-------|------|
| Backend — Agent Execution | 5 | 6 |
| Backend — Token/Cost Tracking | 0 | 4 |
| Backend — Controllers/API | 4 | 5 |
| Backend — Security | 0 | 3 |
| Frontend — Auth | 6 | 1 |
| Frontend — Mock Data | 7 | 1 |
| Frontend — Workspace Switching | 7 | 1 |
| Frontend — UI/UX | 3 | 3 |
| Tauri Native | 2 | 2 |
| Systemic/Architecture | 0 | 3 |
| **Total** | **34** | **29** |

---

## OPEN ISSUES — Backend

### CRITICAL

#### B-01: Cost tracking is completely broken
- **Files**: `heartbeat.ex:256-259`, `adapters/claude_code.ex:98`
- **Problem**: `tokens_output` is always 0 because the reduce accumulator only updates `acc.input` — the line reads `%{acc | input: acc.input + tokens, cost: acc.cost + cost}` but never touches `output`. The `event[:tokens]` extraction only grabs input tokens from individual stream events. The `run.completed` event contains the full usage breakdown (`output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`) in `data.usage`, but this is never parsed.
- **Impact**: All cost reports show $0.00. Budget enforcement never triggers. Finance dashboard is empty. The `estimate_cost` function receives ~10 tokens when the real usage is 10,000+, and `round(10 / 1000 * 0.3)` = 0.
- **Fix needed**: Parse the `run.completed` event's `data.usage` map for `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`. Update the reduce accumulator to track output separately. Calculate cost using Anthropic's actual per-direction rates.

#### B-02: Workspace path defaults to "." if lookup fails
- **File**: `heartbeat.ex:213-231`
- **Problem**: If `Repo.get(Workspace, agent.workspace_id)` returns nil or path is empty, the workspace path defaults to `"."` (the backend process CWD). Agents would execute file operations in the `backend/` directory.
- **Impact**: Agent could clobber backend server files. Security/safety issue.
- **Fix needed**: Return `{:error, :no_workspace}` instead of falling back to `"."`.

#### B-03: No workspace ownership checks on API endpoints
- **Files**: All controllers (`agent_controller.ex`, `issue_controller.ex`, etc.)
- **Problem**: Endpoints accept any `workspace_id` parameter without verifying the authenticated user owns that workspace. `AgentController.index()` returns all agents globally if workspace_id is nil.
- **Impact**: Multi-tenant data leakage. Any authenticated user can read any workspace's data.
- **Fix needed**: Add `Plugs.WorkspaceAuth` plug that validates `workspace_id` belongs to `conn.assigns.current_user`.

### HIGH

#### B-04: Issue checkout can become permanently stuck
- **File**: `heartbeat.ex:59-68, 99-108`
- **Problem**: If the heartbeat process crashes after checking out an issue but before the rescue block runs (e.g., OOM kill, node crash), the issue stays in `in_progress` with `checked_out_by` set forever. No timeout or cleanup mechanism exists.
- **Fix needed**: Add a periodic job that finds issues in `in_progress` with no active session for the agent and resets them to `backlog`.

#### B-05: SSE activity stream emits zero events during agent execution
- **Files**: `heartbeat.ex`, `activity_controller.ex:44`
- **Problem**: The SSE stream subscribes to `activity:global` topic, but Heartbeat only broadcasts to `workspace:{id}` and `session:{id}` topics. Agent runs, completions, and failures are never broadcast to the activity stream.
- **Impact**: Activity feed in the desktop app is always empty during real work.
- **Fix needed**: Add `EventBus.broadcast("activity:global", payload)` calls in heartbeat for `run.started`, `run.completed`, `run.failed` events.

#### B-06: Stream parsing drops multi-line JSON silently
- **File**: `adapters/claude_code.ex:142-156`
- **Problem**: `parse_stream_json/1` splits on `\n` and JSON-decodes each line. If a JSON value contains a literal newline (e.g., in a multi-line string), the line is split incorrectly and silently dropped by the `_ -> []` clause.
- **Fix needed**: Use a streaming JSON parser or accumulate until valid JSON is found.

#### B-07: `schedule_id` never persisted on session rows
- **File**: `heartbeat.ex:176-185`
- **Problem**: `create_session!` accepts `schedule_id` and passes it to `Session.changeset`, but every session in the database has `schedule_id: null`. The `run_count_for` query in schedule_controller therefore always returns 0.
- **Impact**: Schedule run history is broken. UI shows 0 runs for all schedules.
- **Fix needed**: Investigate why the changeset isn't persisting the value — may be a cast list issue in Session schema.

#### B-08: Race condition on issue checkout
- **File**: `issue_controller.ex:162`, `issue_dispatcher.ex`
- **Problem**: Two parallel dispatch requests can both pass the `checked_out_by == nil` check before either commits. No database-level lock or optimistic locking version field.
- **Fix needed**: Add `lock: "FOR UPDATE"` to the issue query in checkout, or add a version field with optimistic locking.

### MEDIUM

#### B-09: Cache tokens never tracked
- **Files**: `heartbeat.ex`, `schemas/session.ex`
- **Problem**: `tokens_cache` field exists in Session schema but is always 0. Claude events contain `cache_creation_input_tokens` and `cache_read_input_tokens` but these are never extracted.
- **Impact**: Cache savings metrics always show 0%. Finance dashboard cache hit rate is meaningless.

#### B-10: Cost estimation uses blended approximation
- **File**: `heartbeat.ex:293-303`
- **Problem**: Comment says "Adjust when per-direction token counts are available." Uses a single blended rate per model instead of Anthropic's actual input/output/cache rates.
- **Impact**: Even when token counting is fixed (B-01), costs will be approximate.

#### B-11: Schedule `agent_name` always nil in API response
- **File**: `schedule_controller.ex:188`
- **Problem**: `serialize/2` hardcodes `agent_name: nil`. The `index` action does a JOIN but other actions (create, update, show, trigger) all return nil.

#### B-12: Issue serialization missing assignee name and comment count
- **File**: `issue_controller.ex:192-194`
- **Problem**: `assignee_name: nil`, `labels: []`, `comments_count: 0` are all hardcoded. Assignee name is never fetched even though `assignee_id` is available.

#### B-13: Goal ancestry has no cycle detection
- **File**: `goal_controller.ex:121-129`
- **Problem**: `build_ancestry()` recurses on `parent_id` with no depth limit or cycle detection. Circular references cause infinite recursion → OOM crash.

#### B-14: `message_count` on sessions is hardcoded to 0
- **File**: `session_controller.ex:28,66`
- **Problem**: Never computed from actual SessionEvent count.

#### B-15: `next_run_at` never computed for schedules
- **Problem**: No cron-to-datetime computation exists. All schedules show `next_run_at: null`.

#### B-16: Error responses leak raw Elixir syntax
- **File**: `issue_controller.ex:175`, `goal_controller.ex`
- **Problem**: `json(%{error: inspect(reason)})` returns strings like `{:agent_not_ready, "working"}` to the frontend. Should return structured JSON.

#### B-17: Unescaped control characters in session transcript JSON
- **Problem**: Claude hook stderr output contains raw newlines/tabs inside JSON string values, causing strict JSON parsers to fail.

#### B-18: IssueDispatcher builds context differently from IssueContext module
- **Files**: `issue_dispatcher.ex:124-146`, `issue_context.ex`
- **Problem**: Two different context builders exist. IssueDispatcher has an inline `build_context/2` and never uses the `IssueContext` module.

---

## OPEN ISSUES — Frontend

### HIGH

#### F-01: Template deploy silently swallows failed agent registrations
- **File**: `services/template-deploy.ts:147-161`
- **Problem**: Uses `Promise.allSettled()` for backend agent creation. Failed creations are ignored. `agentsStore.agents` is directly assigned even though some agents may not exist on the backend.
- **Impact**: UI shows agents that don't exist in the backend. Dispatch/spawn fails for phantom agents.

### MEDIUM

#### F-02: Auth token race — mock can serve data during transition
- **File**: `api/client.ts:415-424`
- **Problem**: Double-check pattern for `useMock` has a gap between the two checks during the async `getMock()` call. If `useMock` flips between checks, a request could be served mock data against a live backend.

#### F-03: Session list doesn't update during live execution
- **File**: `stores/sessions.svelte.ts:185-200`
- **Problem**: Live stream updates `selectedSession` transcript but never refreshes the `sessions` array. The session list shows stale status while an agent is running.

#### F-04: Assignee names always blank in issue list
- **Files**: `IssueList.svelte`, `IssueTable.svelte`
- **Problem**: Backend issue serialization returns `assignee_name: nil` (see B-12). UI shows "—" even for assigned issues.

#### F-05: Workspace scan failure is silent
- **File**: `stores/workspace.svelte.ts:147-190`
- **Problem**: If `.canopy/` directory doesn't exist at the workspace path, scan returns null and agents appear to load but don't. No error message shown.

#### F-06: Offline queue is not persisted
- **File**: `stores/connection.svelte.ts`, `api/client.ts`
- **Problem**: Offline request queue only exists in memory. If the app crashes while offline, queued requests are lost.

### LOW

#### F-07: Selected goal loses selection after decompose
- **File**: `stores/goals.svelte.ts:149-151`
- **Problem**: Full re-fetch after decompose overwrites selected goal state.

---

## OPEN ISSUES — Tauri Native

#### T-01: Filesystem watcher threads leak on workspace switch
- **File**: `src-tauri/src/filesystem.rs:152-177`
- **Problem**: Each call to `watch_canopy_dir()` spawns a new thread with a new `RecommendedWatcher`. No mechanism to stop previous watchers. Multiple watchers accumulate over workspace switches.
- **Fix needed**: Store watcher handle in app state, cancel previous watcher before creating new one.

#### T-02: Provider API keys stored unencrypted
- **File**: `routes/onboarding/+page.svelte:194-200`
- **Problem**: API keys saved to Tauri store as plain JSON. No encryption at rest.
- **Impact**: Credentials readable from disk if device is compromised.

---

## OPEN ISSUES — Systemic

#### S-01: No idempotency keys for operations
- **Problem**: Heartbeat, spawn, dispatch have no deduplication. Retries cause duplicate sessions, double agent runs, double costs.

#### S-02: SSE auth doesn't work in browsers
- **File**: `router.ex`, `activity_controller.ex`
- **Problem**: Activity stream requires `Authorization: Bearer` header, but browser `EventSource` API cannot send custom headers. SSE connections get 401.
- **Fix needed**: Support token as query parameter (`?token=...`) or use cookie-based auth for SSE.

#### S-03: No timeout on hung agent sessions
- **File**: `adapters/claude_code.ex:107`
- **Problem**: 60-second `receive` timeout exists but no overall session timeout. If the Claude process hangs indefinitely between outputs (e.g., waiting on a tool), the heartbeat blocks forever.

---

## FIXED ISSUES (for reference)

These were resolved in PR #3 and PR #4:

| # | Issue | PR |
|---|-------|----|
| 1 | SSE MIME type not registered in Phoenix | #3 |
| 2 | SSE routes in wrong pipeline (JSON content-type broke event streams) | #3 |
| 3 | Activity stream crash on non-map PubSub messages | #3 |
| 4 | Ecto binary_id type casting error in agent skill queries | #3 |
| 5 | Claude CLI binary not found (wrong path) | #4 |
| 6 | Missing `--verbose` flag for stream-json output | #4 |
| 7 | Heartbeat used CWD instead of DB workspace path | #4 |
| 8 | Duplicate session per spawn (controller + heartbeat both created) | #4 |
| 9 | DateTime microsecond crashes in 5 controllers | #4 |
| 10 | `avatar_emoji` not persisted (hardcoded in serialization) | #4 |
| 11 | Auth race condition — requests fired before token set | #4 |
| 12 | `verifyToken()` hit unauthenticated endpoint | #4 |
| 13 | Connection polling started before auth completed | #4 |
| 14 | Activity SSE subscription started before auth | #4 |
| 15 | No fallback to mock when no credentials available | #4 |
| 16 | Mock agents persisted to localStorage across restarts | #4 |
| 17 | `clearAllMockData()` didn't exist | #4 |
| 18 | `useMock` set directly bypassing cleanup | #4 |
| 19 | Dashboard hardcoded demo health/finance data | #4 |
| 20 | Cost trends generated random `Math.random()` data | #4 |
| 21 | Connection store started in mock mode by default | #4 |
| 22 | Mock projects contained personal developer paths | #4 |
| 23 | Mock issues/goals referenced internal project names | #4 |
| 24 | Template deploy wrote mock agents when mock was disabled | #4 |
| 25 | No `workspaces.activate()` API method | #4 |
| 26 | `setActiveWorkspace()` never called backend | #4 |
| 27 | Agents only re-fetched if store was empty | #4 |
| 28 | Response cache not busted on workspace switch | #4 |
| 29 | Dashboard never reloaded on workspace switch | #4 |
| 30 | 5 API endpoints missing workspace_id scoping | #4 |
| 31 | 8 of 10 pages didn't react to workspace changes | #4 |
| 32 | Onboarding guard ran before auth completed | #4 |
| 33 | Onboarding `$derived` always truthy (arrow fn vs IIFE) | #4 |
| 34 | Duplicate Growth OS workspace + 7 zombie sessions | #4 |
