<!-- src/lib/components/issues/IssueViewSwitcher.svelte -->
<!-- View mode toggle (Kanban/List/Table) + filters + search + new issue -->
<script lang="ts">
  import type { IssueStatus, IssuePriority } from '$api/types';
  import { issuesStore } from '$lib/stores/issues.svelte';
  import { agentsStore } from '$lib/stores/agents.svelte';

  type ViewMode = 'kanban' | 'list' | 'table';

  interface Props {
    viewMode: ViewMode;
    onViewChange: (mode: ViewMode) => void;
    onNewIssue: () => void;
  }

  let { viewMode, onViewChange, onNewIssue }: Props = $props();

  const STATUS_OPTIONS: { value: IssueStatus | 'all'; label: string }[] = [
    { value: 'all',         label: 'All Statuses' },
    { value: 'backlog',     label: 'Backlog'       },
    { value: 'todo',        label: 'Todo'          },
    { value: 'in_progress', label: 'In Progress'  },
    { value: 'in_review',   label: 'In Review'    },
    { value: 'done',        label: 'Done'          },
  ];

  const PRIORITY_OPTIONS: { value: IssuePriority | 'all'; label: string }[] = [
    { value: 'all',      label: 'All Priorities' },
    { value: 'low',      label: 'Low'            },
    { value: 'medium',   label: 'Medium'         },
    { value: 'high',     label: 'High'           },
    { value: 'critical', label: 'Critical'       },
  ];
</script>

<div class="ivs-bar" role="toolbar" aria-label="Issue view controls">
  <!-- View mode toggles -->
  <div class="ivs-view-group" role="group" aria-label="View mode">
    <button
      class="ivs-view-btn"
      class:ivs-view-btn--active={viewMode === 'kanban'}
      onclick={() => onViewChange('kanban')}
      aria-label="Kanban view"
      aria-pressed={viewMode === 'kanban'}
      type="button"
      title="Kanban view"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="10" y="3" width="5" height="14" rx="1" />
        <rect x="17" y="3" width="5" height="10" rx="1" />
      </svg>
    </button>
    <button
      class="ivs-view-btn"
      class:ivs-view-btn--active={viewMode === 'list'}
      onclick={() => onViewChange('list')}
      aria-label="List view"
      aria-pressed={viewMode === 'list'}
      type="button"
      title="List view"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    </button>
    <button
      class="ivs-view-btn"
      class:ivs-view-btn--active={viewMode === 'table'}
      onclick={() => onViewChange('table')}
      aria-label="Table view"
      aria-pressed={viewMode === 'table'}
      type="button"
      title="Table view"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M3 3h18v4H3zM3 11h18v4H3zM3 19h18v4H3z" />
      </svg>
    </button>
  </div>

  <div class="ivs-sep" aria-hidden="true"></div>

  <!-- Search -->
  <label class="ivs-search-wrap" for="ivs-search">
    <svg class="ivs-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
    <input
      id="ivs-search"
      class="ivs-search"
      type="search"
      placeholder="Search issues..."
      bind:value={issuesStore.searchQuery}
      aria-label="Search issues"
    />
  </label>

  <!-- Status filter -->
  <select
    class="ivs-filter"
    bind:value={issuesStore.filterStatus}
    aria-label="Filter by status"
  >
    {#each STATUS_OPTIONS as opt (opt.value)}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>

  <!-- Priority filter -->
  <select
    class="ivs-filter"
    bind:value={issuesStore.filterPriority}
    aria-label="Filter by priority"
  >
    {#each PRIORITY_OPTIONS as opt (opt.value)}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>

  <!-- Assignee filter -->
  <select
    class="ivs-filter"
    bind:value={issuesStore.filterAssignee}
    aria-label="Filter by assignee"
  >
    <option value="all">All Assignees</option>
    {#each agentsStore.agents as agent (agent.id)}
      <option value={agent.id}>{agent.display_name}</option>
    {/each}
  </select>

  <div class="ivs-spacer" aria-hidden="true"></div>

  <!-- New Issue button -->
  <button
    class="ivs-new-btn"
    onclick={onNewIssue}
    aria-label="Create new issue"
    type="button"
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
    New Issue
  </button>
</div>

<style>
  .ivs-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .ivs-view-group {
    display: flex;
    align-items: center;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 2px;
    gap: 2px;
  }

  .ivs-view-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    border-radius: var(--radius-xs);
    cursor: pointer;
    transition: background 100ms ease, color 100ms ease;
  }

  .ivs-view-btn:hover { background: rgba(255,255,255,0.06); color: var(--text-secondary); }
  .ivs-view-btn--active { background: rgba(255,255,255,0.1); color: var(--text-primary); }
  .ivs-view-btn:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 1px; }

  .ivs-sep {
    width: 1px;
    height: 20px;
    background: var(--border-default);
    flex-shrink: 0;
  }

  .ivs-search-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 0 10px;
    height: 30px;
    transition: border-color 150ms ease;
    cursor: text;
  }

  .ivs-search-wrap:focus-within {
    border-color: var(--border-focus);
  }

  .ivs-search-icon { color: var(--text-muted); flex-shrink: 0; }

  .ivs-search {
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 12px;
    outline: none;
    width: 160px;
    font-family: inherit;
  }

  .ivs-search::placeholder { color: var(--text-muted); }

  .ivs-filter {
    height: 30px;
    padding: 0 8px 0 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 150ms ease;
  }

  .ivs-filter:hover { border-color: var(--border-hover); }
  .ivs-filter:focus-visible { outline: 2px solid var(--accent-primary); }

  .ivs-spacer { flex: 1; }

  .ivs-new-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    background: var(--accent-primary);
    border: none;
    border-radius: var(--radius-sm);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity 150ms ease;
  }

  .ivs-new-btn:hover { opacity: 0.9; }
  .ivs-new-btn:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
</style>
