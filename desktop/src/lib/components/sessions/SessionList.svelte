<!-- src/lib/components/sessions/SessionList.svelte -->
<!-- Scrollable sessions list with search, filters, sort, and pagination -->
<script lang="ts">
  import type { Session } from '$lib/api/types';
  import type { SessionSortKey, SessionStatusFilter } from '$lib/stores/sessions.svelte';
  import SessionCard from './SessionCard.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';

  interface Props {
    sessions: Session[];
    loading?: boolean;
    totalCount?: number;
    page?: number;
    totalPages?: number;
    searchValue?: string;
    statusFilter?: SessionStatusFilter;
    sortKey?: SessionSortKey;
    sortDir?: 'asc' | 'desc';
    agentOptions?: Array<{ id: string; name: string }>;
    agentFilter?: string | null;
    selectedId?: string | null;
    onSearch?: (q: string) => void;
    onStatusFilter?: (s: SessionStatusFilter) => void;
    onAgentFilter?: (id: string | null) => void;
    onSort?: (key: SessionSortKey) => void;
    onPageChange?: (p: number) => void;
    onSelect?: (session: Session) => void;
  }

  let {
    sessions,
    loading = false,
    totalCount = 0,
    page = 1,
    totalPages = 1,
    searchValue = '',
    statusFilter = 'all',
    sortKey = 'date',
    sortDir = 'desc',
    agentOptions = [],
    agentFilter = null,
    selectedId = null,
    onSearch,
    onStatusFilter,
    onAgentFilter,
    onSort,
    onPageChange,
    onSelect,
  }: Props = $props();

  // Debounce search — local state, synced from prop via effect
  let searchInput = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Keep searchInput in sync with searchValue prop (handles external resets)
  $effect(() => {
    const incoming = searchValue;
    if (incoming !== searchInput) searchInput = incoming;
  });

  function handleSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    searchInput = val;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onSearch?.(val);
    }, 300);
  }

  const statusOptions: Array<{ value: SessionStatusFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Done' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const sortOptions: Array<{ value: SessionSortKey; label: string }> = [
    { value: 'date', label: 'Date' },
    { value: 'duration', label: 'Duration' },
    { value: 'cost', label: 'Cost' },
    { value: 'tokens', label: 'Tokens' },
  ];
</script>

<div class="sl-root">
  <!-- Toolbar -->
  <div class="sl-toolbar" role="toolbar" aria-label="Session filters">
    <!-- Search -->
    <label class="sl-search" aria-label="Search sessions">
      <svg class="sl-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="search"
        class="sl-search-input"
        placeholder="Search sessions…"
        value={searchInput}
        oninput={handleSearchInput}
        aria-label="Search sessions"
      />
    </label>

    <!-- Status filter -->
    <div class="sl-filter-group" role="group" aria-label="Status filter">
      {#each statusOptions as opt (opt.value)}
        <button
          class="sl-pill"
          class:sl-pill--active={statusFilter === opt.value}
          onclick={() => onStatusFilter?.(opt.value)}
          aria-pressed={statusFilter === opt.value}
        >
          {opt.label}
        </button>
      {/each}
    </div>

    <!-- Agent filter -->
    {#if agentOptions.length > 0}
      <select
        class="sl-select"
        value={agentFilter ?? ''}
        onchange={(e) => {
          const v = (e.target as HTMLSelectElement).value;
          onAgentFilter?.(v || null);
        }}
        aria-label="Filter by agent"
      >
        <option value="">All agents</option>
        {#each agentOptions as opt (opt.id)}
          <option value={opt.id}>{opt.name}</option>
        {/each}
      </select>
    {/if}

    <!-- Sort -->
    <div class="sl-sort" role="group" aria-label="Sort sessions">
      <span class="sl-sort-label">Sort:</span>
      {#each sortOptions as opt (opt.value)}
        <button
          class="sl-sort-btn"
          class:sl-sort-btn--active={sortKey === opt.value}
          onclick={() => onSort?.(opt.value)}
          aria-pressed={sortKey === opt.value}
          aria-label="Sort by {opt.label}{sortKey === opt.value ? ` (${sortDir})` : ''}"
        >
          {opt.label}
          {#if sortKey === opt.value}
            <svg
              width="9" height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              aria-hidden="true"
              style="transform: rotate({sortDir === 'asc' ? '180deg' : '0deg'})"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Count line -->
  <div class="sl-meta" aria-live="polite" aria-atomic="true">
    {#if loading}
      <span class="sl-meta-text">Loading…</span>
    {:else}
      <span class="sl-meta-text">{sessions.length} of {totalCount} session{totalCount !== 1 ? 's' : ''}</span>
    {/if}
  </div>

  <!-- List -->
  <div class="sl-list" role="list" aria-label="Sessions">
    {#if loading && sessions.length === 0}
      <div class="sl-loading" aria-label="Loading sessions" aria-live="polite">
        <LoadingSpinner size="sm" />
        <span>Loading sessions…</span>
      </div>
    {:else if sessions.length === 0}
      <div class="sl-empty" role="status" aria-live="polite">
        <svg class="sl-empty-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <p class="sl-empty-text">No sessions found</p>
        <p class="sl-empty-sub">Try adjusting your filters</p>
      </div>
    {:else}
      {#each sessions as session (session.id)}
        <div role="listitem">
          <SessionCard
            {session}
            selected={selectedId === session.id}
            onclick={onSelect}
          />
        </div>
      {/each}
    {/if}
  </div>

  <!-- Pagination -->
  {#if totalPages > 1}
    <nav class="sl-pagination" aria-label="Session list pagination">
      <button
        class="sl-page-btn"
        onclick={() => onPageChange?.(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="sl-page-info">Page {page} of {totalPages}</span>
      <button
        class="sl-page-btn"
        onclick={() => onPageChange?.(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </nav>
  {/if}
</div>

<style>
  .sl-root {
    display: flex;
    flex-direction: column;
    gap: 0;
    height: 100%;
  }

  /* Toolbar */
  .sl-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-default);
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  /* Search */
  .sl-search {
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 1;
    min-width: 160px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm, 6px);
    padding: 5px 10px;
    transition: border-color var(--transition-fast, 150ms) ease;
  }

  .sl-search:focus-within {
    border-color: var(--border-hover);
  }

  .sl-search-icon {
    color: var(--text-muted, #555);
    flex-shrink: 0;
  }

  .sl-search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 12.5px;
    color: var(--text-primary);
    font-family: var(--font-sans);
  }

  .sl-search-input::placeholder {
    color: var(--text-muted, #555);
  }

  /* Filter pills */
  .sl-filter-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .sl-pill {
    padding: 4px 9px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 500;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    transition:
      color var(--transition-fast, 150ms) ease,
      background var(--transition-fast, 150ms) ease,
      border-color var(--transition-fast, 150ms) ease;
  }

  .sl-pill:hover {
    color: var(--text-secondary);
    background: var(--bg-elevated);
  }

  .sl-pill--active {
    background: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.3);
    color: #93c5fd;
  }

  /* Agent select */
  .sl-select {
    padding: 5px 8px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm, 6px);
    color: var(--text-secondary);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
  }

  .sl-select:focus {
    outline: 1px solid rgba(59, 130, 246, 0.5);
    border-color: rgba(59, 130, 246, 0.3);
  }

  /* Sort */
  .sl-sort {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }

  .sl-sort-label {
    font-size: 11px;
    color: var(--text-muted, #555);
    font-family: var(--font-sans);
    white-space: nowrap;
  }

  .sl-sort-btn {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 3px 7px;
    border-radius: var(--radius-xs, 4px);
    font-size: 11.5px;
    font-weight: 500;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: color var(--transition-fast, 150ms) ease, background var(--transition-fast, 150ms) ease;
  }

  .sl-sort-btn:hover {
    color: var(--text-secondary);
    background: var(--bg-elevated);
  }

  .sl-sort-btn--active {
    color: var(--text-primary);
    background: var(--bg-elevated);
    border-color: var(--border-default);
  }

  /* Meta */
  .sl-meta {
    padding: 6px 16px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .sl-meta-text {
    font-size: 11px;
    color: var(--text-muted, #555);
    font-family: var(--font-sans);
  }

  /* List */
  .sl-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
  }

  .sl-list::-webkit-scrollbar { width: 4px; }
  .sl-list::-webkit-scrollbar-track { background: transparent; }
  .sl-list::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }
  .sl-list::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }

  /* Loading state */
  .sl-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 160px;
    color: var(--text-tertiary);
    font-size: 12.5px;
  }

  /* Empty state */
  .sl-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 200px;
  }

  .sl-empty-icon {
    color: var(--text-muted, #555);
    opacity: 0.5;
  }

  .sl-empty-text {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .sl-empty-sub {
    margin: 0;
    font-size: 12px;
    color: var(--text-tertiary);
  }

  /* Pagination */
  .sl-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 10px 16px;
    border-top: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .sl-page-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm, 6px);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    cursor: pointer;
    transition: border-color var(--transition-fast, 150ms) ease, color var(--transition-fast, 150ms) ease;
  }

  .sl-page-btn:hover:not(:disabled) {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .sl-page-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .sl-page-info {
    font-size: 12px;
    color: var(--text-tertiary);
    font-family: var(--font-sans);
  }
</style>
