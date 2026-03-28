<!-- src/lib/components/activity/ActivityFilters.svelte -->
<!-- Filter bar: event type, level, agent, date range, search -->
<script lang="ts">
  import { activityStore } from '$lib/stores/activity.svelte';
  import type { ActivityEventType } from '$api/types';

  const EVENT_TYPE_LABELS: Record<ActivityEventType | 'all', string> = {
    all:                 'All Types',
    agent_woke:          'Agent Woke',
    agent_slept:         'Agent Slept',
    agent_error:         'Agent Error',
    heartbeat_started:   'Heartbeat Started',
    heartbeat_completed: 'Heartbeat Completed',
    heartbeat_failed:    'Heartbeat Failed',
    issue_created:       'Issue Created',
    issue_updated:       'Issue Updated',
    goal_completed:      'Goal Completed',
    budget_warning:      'Budget Warning',
    budget_exceeded:     'Budget Exceeded',
    session_started:     'Session Started',
    session_completed:   'Session Completed',
    skill_triggered:     'Skill Triggered',
    config_changed:      'Config Changed',
    deployment:          'Deployment',
  };

  const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as (ActivityEventType | 'all')[];

  const LEVEL_OPTIONS = [
    { value: 'all',     label: 'All Levels' },
    { value: 'info',    label: 'Info' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warning' },
    { value: 'error',   label: 'Error' },
  ] as const;

  // Debounced search
  let searchInput = $state(activityStore.searchQuery);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    searchInput = val;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      activityStore.searchQuery = val;
    }, 300);
  }

  function clearAll() {
    searchInput = '';
    activityStore.clearFilters();
  }

  const hasActiveFilters = $derived(
    activityStore.filterType !== 'all' ||
    activityStore.filterLevel !== 'all' ||
    activityStore.filterAgentId !== 'all' ||
    activityStore.searchQuery !== ''
  );

  // Unique agents from current events for the agent filter dropdown
  const agentOptions = $derived.by(() => {
    const seen = new Map<string, string>();
    for (const e of activityStore.events) {
      if (e.agent_id && e.agent_name && !seen.has(e.agent_id)) {
        seen.set(e.agent_id, e.agent_name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  });
</script>

<div class="af-bar" role="toolbar" aria-label="Activity filters">
  <!-- Search -->
  <div class="af-search-wrap">
    <span class="af-search-icon" aria-hidden="true">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    </span>
    <input
      class="af-search"
      type="search"
      placeholder="Search events..."
      value={searchInput}
      oninput={handleSearchInput}
      aria-label="Search activity events"
    />
  </div>

  <!-- Event type filter -->
  <select
    class="af-select"
    value={activityStore.filterType}
    onchange={(e) => { activityStore.filterType = (e.target as HTMLSelectElement).value as ActivityEventType | 'all'; }}
    aria-label="Filter by event type"
  >
    {#each EVENT_TYPES as type (type)}
      <option value={type}>{EVENT_TYPE_LABELS[type]}</option>
    {/each}
  </select>

  <!-- Level filter -->
  <select
    class="af-select"
    value={activityStore.filterLevel}
    onchange={(e) => { activityStore.filterLevel = (e.target as HTMLSelectElement).value as typeof activityStore.filterLevel; }}
    aria-label="Filter by level"
  >
    {#each LEVEL_OPTIONS as opt (opt.value)}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>

  <!-- Agent filter -->
  <select
    class="af-select"
    value={activityStore.filterAgentId}
    onchange={(e) => { activityStore.filterAgentId = (e.target as HTMLSelectElement).value; }}
    aria-label="Filter by agent"
  >
    <option value="all">All Agents</option>
    {#each agentOptions as agent (agent.id)}
      <option value={agent.id}>{agent.name}</option>
    {/each}
  </select>

  <!-- Clear button (shown when filters active) -->
  {#if hasActiveFilters}
    <button
      class="af-clear"
      onclick={clearAll}
      aria-label="Clear all filters"
      type="button"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      Clear
    </button>
  {/if}

  <!-- Connected indicator -->
  <div class="af-status" aria-label={activityStore.connected ? 'Live streaming connected' : 'Not connected'}>
    <span
      class="af-dot"
      class:af-dot--live={activityStore.connected}
      aria-hidden="true"
    ></span>
    <span class="af-status-text">{activityStore.connected ? 'Live' : 'Offline'}</span>
  </div>
</div>

<style>
  .af-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-surface);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  /* Search */
  .af-search-wrap {
    position: relative;
    flex: 1;
    min-width: 160px;
    max-width: 280px;
  }

  .af-search-icon {
    position: absolute;
    left: 9px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .af-search {
    width: 100%;
    height: 30px;
    padding: 0 10px 0 28px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 12px;
    outline: none;
    transition:
      border-color 120ms ease,
      background 120ms ease;
  }

  .af-search::placeholder {
    color: var(--text-muted);
  }

  .af-search:focus {
    border-color: rgba(59,130,246,0.4);
    background: rgba(59,130,246,0.05);
  }

  /* Remove default webkit search cancel */
  .af-search::-webkit-search-cancel-button {
    display: none;
  }

  /* Selects */
  .af-select {
    height: 30px;
    padding: 0 28px 0 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    transition: border-color 120ms ease;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .af-select:focus {
    border-color: rgba(59,130,246,0.4);
  }

  .af-select option {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  /* Clear button */
  .af-clear {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 10px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: var(--radius-sm);
    color: #fca5a5;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 120ms ease;
    flex-shrink: 0;
  }

  .af-clear:hover {
    background: rgba(239,68,68,0.15);
    border-color: rgba(239,68,68,0.35);
  }

  .af-clear:focus-visible {
    outline: 2px solid rgba(239,68,68,0.5);
    outline-offset: 2px;
  }

  /* Live status pill */
  .af-status {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .af-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-muted);
    flex-shrink: 0;
  }

  .af-dot--live {
    background: rgba(34, 197, 94, 0.75);
    box-shadow: 0 0 0 2px rgba(34,197,94,0.15);
    animation: af-pulse 2s ease-out infinite;
  }

  .af-status-text {
    font-size: 11px;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  @keyframes af-pulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.15); }
    50%       { box-shadow: 0 0 0 4px rgba(34,197,94,0.06); }
  }

  @media (prefers-reduced-motion: reduce) {
    .af-dot--live { animation: none; }
  }
</style>
