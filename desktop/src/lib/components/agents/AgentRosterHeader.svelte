<!-- src/lib/components/agents/AgentRosterHeader.svelte -->
<script lang="ts">
  import { agentsStore } from '$lib/stores/agents.svelte';
  import type { AgentStatus } from '$api/types';
  import type { AgentViewMode } from '$lib/stores/agents.svelte';

  interface Props {
    onHire: () => void;
  }

  let { onHire }: Props = $props();

  let searchValue = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    searchValue = val;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      agentsStore.searchQuery = val;
    }, 200);
  }

  const STATUS_OPTIONS: { value: AgentStatus | 'all'; label: string }[] = [
    { value: 'all',        label: 'All statuses' },
    { value: 'running',    label: 'Running' },
    { value: 'active',     label: 'Active' },
    { value: 'working',    label: 'Working' },
    { value: 'idle',       label: 'Idle' },
    { value: 'sleeping',   label: 'Sleeping' },
    { value: 'paused',     label: 'Paused' },
    { value: 'error',      label: 'Error' },
    { value: 'terminated', label: 'Terminated' },
  ];

  const VIEW_MODES: { mode: AgentViewMode; label: string; icon: string }[] = [
    {
      mode: 'grid',
      label: 'Grid view',
      icon: 'M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z',
    },
    {
      mode: 'org',
      label: 'Org chart view',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm7 8l2 2 4-4',
    },
    {
      mode: 'table',
      label: 'Table view',
      icon: 'M3 3h18v5H3V3zm0 7h18v5H3v-5zm0 7h18v5H3v-5z',
    },
  ];
</script>

<div class="arh-bar" role="toolbar" aria-label="Agent roster controls">
  <!-- View mode toggles -->
  <div class="arh-view-toggle" role="group" aria-label="View mode">
    {#each VIEW_MODES as vm}
      <button
        class="arh-view-btn"
        class:arh-view-btn--active={agentsStore.viewMode === vm.mode}
        onclick={() => agentsStore.setViewMode(vm.mode)}
        aria-label={vm.label}
        aria-pressed={agentsStore.viewMode === vm.mode}
        title={vm.label}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d={vm.icon} />
        </svg>
      </button>
    {/each}
  </div>

  <!-- Search -->
  <div class="arh-search-wrap">
    <svg class="arh-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      class="arh-search"
      type="search"
      placeholder="Search agents…"
      value={searchValue}
      oninput={handleSearchInput}
      aria-label="Search agents"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  <!-- Status filter -->
  <select
    class="arh-select"
    value={agentsStore.filterStatus}
    onchange={(e) => agentsStore.filterStatus = (e.target as HTMLSelectElement).value as AgentStatus | 'all'}
    aria-label="Filter by status"
  >
    {#each STATUS_OPTIONS as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>

  <div class="arh-spacer" aria-hidden="true"></div>

  <!-- Hire button -->
  <button
    class="arh-hire-btn"
    onclick={onHire}
    aria-label="Hire a new agent"
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
    Hire Agent
  </button>
</div>

<style>
  .arh-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  /* View toggle group */
  .arh-view-toggle {
    display: flex;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    overflow: hidden;
    flex-shrink: 0;
  }

  .arh-view-btn {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-right: 1px solid var(--border-default);
    color: var(--text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 120ms ease, color 120ms ease;
  }

  .arh-view-btn:last-child {
    border-right: none;
  }

  .arh-view-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-secondary);
  }

  .arh-view-btn--active {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  /* Search */
  .arh-search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .arh-search-icon {
    position: absolute;
    left: 9px;
    color: var(--text-tertiary);
    pointer-events: none;
  }

  .arh-search {
    height: 32px;
    padding: 0 10px 0 28px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 13px;
    font-family: var(--font-sans);
    width: 200px;
    outline: none;
    transition: border-color 120ms ease, width 200ms ease;
  }

  .arh-search::placeholder {
    color: var(--text-muted);
  }

  .arh-search:focus {
    border-color: var(--border-focus);
    width: 240px;
  }

  .arh-search::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }

  /* Status select */
  .arh-select {
    height: 32px;
    padding: 0 28px 0 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-secondary);
    font-size: 12px;
    font-family: var(--font-sans);
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    transition: border-color 120ms ease;
  }

  .arh-select:focus {
    border-color: var(--border-focus);
  }

  .arh-spacer {
    flex: 1;
  }

  /* Hire button */
  .arh-hire-btn {
    height: 32px;
    padding: 0 14px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(59, 130, 246, 0.4);
    background: rgba(59, 130, 246, 0.15);
    color: #93c5fd;
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 120ms ease, border-color 120ms ease;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .arh-hire-btn:hover {
    background: rgba(59, 130, 246, 0.25);
    border-color: rgba(59, 130, 246, 0.6);
    color: #bfdbfe;
  }

  .arh-hire-btn:active {
    transform: scale(0.98);
  }
</style>
