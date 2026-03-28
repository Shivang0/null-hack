<!-- src/lib/components/logs/LogFilters.svelte -->
<!-- Filter toolbar for the log viewer -->
<script lang="ts">
  import type { LogLevel } from '$lib/stores/logs.svelte';
  import { logsStore } from '$lib/stores/logs.svelte';

  // Debounce search input 300ms
  let searchRaw = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleSearch(value: string) {
    searchRaw = value;
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      logsStore.setSearch(value);
    }, 300);
  }

  const LEVELS: { level: LogLevel; label: string; title: string }[] = [
    { level: 'debug', label: 'DBG', title: 'Debug' },
    { level: 'info',  label: 'INF', title: 'Info' },
    { level: 'warn',  label: 'WRN', title: 'Warning' },
    { level: 'error', label: 'ERR', title: 'Error' },
    { level: 'fatal', label: 'FTL', title: 'Fatal' },
  ];

  function isActive(level: LogLevel): boolean {
    return logsStore.filterLevels.has(level);
  }

  function hasActiveFilters(): boolean {
    return (
      logsStore.filterLevels.size > 0 ||
      logsStore.filterSource !== 'all' ||
      logsStore.filterAgent !== 'all' ||
      logsStore.searchQuery.length > 0
    );
  }

  function clearAll() {
    searchRaw = '';
    logsStore.clearFilters();
  }
</script>

<div class="lf-bar" role="toolbar" aria-label="Log filters">
  <!-- Level toggles -->
  <div class="lf-levels" role="group" aria-label="Filter by log level">
    {#each LEVELS as { level, label, title }}
      <button
        class="lf-level lf-level--{level}"
        class:lf-level--active={isActive(level)}
        onclick={() => logsStore.toggleLevel(level)}
        aria-label="Toggle {title} logs"
        aria-pressed={isActive(level)}
        title="{title} logs"
      >
        {label}
      </button>
    {/each}
  </div>

  <div class="lf-sep" aria-hidden="true"></div>

  <!-- Source dropdown -->
  <div class="lf-select-wrap">
    <label class="lf-select-label" for="lf-source">Source</label>
    <select
      id="lf-source"
      class="lf-select"
      value={logsStore.filterSource}
      onchange={(e) => logsStore.setSource(e.currentTarget.value)}
      aria-label="Filter by source"
    >
      <option value="all">All sources</option>
      {#each logsStore.sources as source}
        <option value={source}>{source}</option>
      {/each}
    </select>
  </div>

  <!-- Agent dropdown -->
  {#if logsStore.agents.length > 0}
    <div class="lf-select-wrap">
      <label class="lf-select-label" for="lf-agent">Agent</label>
      <select
        id="lf-agent"
        class="lf-select"
        value={logsStore.filterAgent}
        onchange={(e) => logsStore.setAgent(e.currentTarget.value)}
        aria-label="Filter by agent"
      >
        <option value="all">All agents</option>
        {#each logsStore.agents as agent}
          <option value={agent}>{agent}</option>
        {/each}
      </select>
    </div>
  {/if}

  <!-- Search -->
  <div class="lf-search-wrap">
    <svg class="lf-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
    </svg>
    <input
      type="search"
      class="lf-search"
      placeholder="Search logs..."
      value={searchRaw}
      oninput={(e) => handleSearch(e.currentTarget.value)}
      aria-label="Search log messages"
    />
    {#if searchRaw}
      <button
        class="lf-search-clear"
        onclick={() => { searchRaw = ''; logsStore.setSearch(''); }}
        aria-label="Clear search"
      >×</button>
    {/if}
  </div>

  <div class="lf-spacer" aria-hidden="true"></div>

  <!-- Entry count -->
  <span class="lf-count" aria-live="polite" aria-label="Showing {logsStore.filteredEntries.length} of {logsStore.stats.total} entries">
    {logsStore.filteredEntries.length.toLocaleString()}
    {#if logsStore.filteredEntries.length !== logsStore.stats.total}
      <span class="lf-count-total">/ {logsStore.stats.total.toLocaleString()}</span>
    {/if}
  </span>

  {#if hasActiveFilters()}
    <button
      class="lf-clear-btn"
      onclick={clearAll}
      aria-label="Clear all filters"
    >
      Clear
    </button>
  {/if}

  <div class="lf-sep" aria-hidden="true"></div>

  <!-- Stream pause/resume -->
  <button
    class="lf-stream-btn"
    class:lf-stream-btn--paused={logsStore.isPaused}
    onclick={() => logsStore.togglePause()}
    aria-label={logsStore.isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
    title={logsStore.isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
  >
    {#if logsStore.isPaused}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <polygon points="5,3 19,12 5,21"/>
      </svg>
      Resume
    {:else}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
      </svg>
      Pause
    {/if}
  </button>

  <!-- Live indicator -->
  <div
    class="lf-live"
    class:lf-live--connected={logsStore.connected}
    class:lf-live--paused={logsStore.isPaused}
    title={logsStore.connected ? 'Streaming live' : 'Disconnected'}
    aria-label={logsStore.connected ? 'Live stream connected' : 'Stream disconnected'}
    role="status"
  >
    <span class="lf-live-dot" aria-hidden="true"></span>
    {logsStore.isPaused ? 'Paused' : logsStore.connected ? 'Live' : 'Off'}
  </div>
</div>

<style>
  .lf-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    height: 44px;
    min-height: 44px;
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-secondary);
    flex-shrink: 0;
    overflow-x: auto;
  }

  .lf-bar::-webkit-scrollbar {
    height: 0;
  }

  /* ── Level toggles ──────────────────────────────────────────────── */
  .lf-levels {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .lf-level {
    height: 22px;
    padding: 0 7px;
    border-radius: 4px;
    border: 1px solid transparent;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: all 100ms ease;
    opacity: 0.45;
  }

  .lf-level--active {
    opacity: 1;
  }

  .lf-level--debug {
    color: #9ca3af;
    border-color: rgba(156, 163, 175, 0.2);
    background: rgba(156, 163, 175, 0.06);
  }

  .lf-level--debug.lf-level--active,
  .lf-level--debug:hover {
    background: rgba(156, 163, 175, 0.14);
    border-color: rgba(156, 163, 175, 0.35);
    opacity: 1;
  }

  .lf-level--info {
    color: #93c5fd;
    border-color: rgba(59, 130, 246, 0.2);
    background: rgba(59, 130, 246, 0.06);
  }

  .lf-level--info.lf-level--active,
  .lf-level--info:hover {
    background: rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.4);
    opacity: 1;
  }

  .lf-level--warn {
    color: #fde047;
    border-color: rgba(234, 179, 8, 0.2);
    background: rgba(234, 179, 8, 0.06);
  }

  .lf-level--warn.lf-level--active,
  .lf-level--warn:hover {
    background: rgba(234, 179, 8, 0.15);
    border-color: rgba(234, 179, 8, 0.4);
    opacity: 1;
  }

  .lf-level--error {
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.06);
  }

  .lf-level--error.lf-level--active,
  .lf-level--error:hover {
    background: rgba(239, 68, 68, 0.16);
    border-color: rgba(239, 68, 68, 0.4);
    opacity: 1;
  }

  .lf-level--fatal {
    color: #ff6b6b;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
  }

  .lf-level--fatal.lf-level--active,
  .lf-level--fatal:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    opacity: 1;
  }

  /* ── Separator ──────────────────────────────────────────────────── */
  .lf-sep {
    width: 1px;
    height: 20px;
    background: var(--border-default);
    flex-shrink: 0;
  }

  /* ── Dropdowns ──────────────────────────────────────────────────── */
  .lf-select-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }

  .lf-select-label {
    font-size: 11px;
    color: var(--text-tertiary);
    font-family: var(--font-sans);
    white-space: nowrap;
  }

  .lf-select {
    height: 26px;
    padding: 0 24px 0 8px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-secondary);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    outline: none;
    transition: border-color 100ms ease;
    max-width: 140px;
  }

  .lf-select:hover,
  .lf-select:focus {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  /* ── Search ─────────────────────────────────────────────────────── */
  .lf-search-wrap {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 160px;
  }

  .lf-search-icon {
    position: absolute;
    left: 8px;
    color: var(--text-muted);
    pointer-events: none;
  }

  .lf-search {
    width: 100%;
    height: 26px;
    padding: 0 28px 0 28px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 12px;
    font-family: var(--font-sans);
    outline: none;
    transition: border-color 100ms ease;
  }

  .lf-search::placeholder {
    color: var(--text-muted);
  }

  .lf-search:focus {
    border-color: var(--accent-primary);
  }

  /* Remove default search input X in WebKit */
  .lf-search::-webkit-search-cancel-button {
    display: none;
  }

  .lf-search-clear {
    position: absolute;
    right: 6px;
    width: 16px;
    height: 16px;
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 2px;
  }

  .lf-search-clear:hover {
    color: var(--text-secondary);
  }

  /* ── Spacer ─────────────────────────────────────────────────────── */
  .lf-spacer {
    flex: 1;
  }

  /* ── Entry count ─────────────────────────────────────────────────── */
  .lf-count {
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-secondary);
    white-space: nowrap;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .lf-count-total {
    color: var(--text-muted);
  }

  /* ── Clear button ────────────────────────────────────────────────── */
  .lf-clear-btn {
    height: 24px;
    padding: 0 9px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-tertiary);
    font-size: 11px;
    font-family: var(--font-sans);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 100ms ease;
    white-space: nowrap;
  }

  .lf-clear-btn:hover {
    border-color: var(--border-hover);
    color: var(--text-secondary);
    background: var(--bg-elevated);
  }

  /* ── Stream pause button ─────────────────────────────────────────── */
  .lf-stream-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 10px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-tertiary);
    font-size: 11px;
    font-family: var(--font-sans);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 100ms ease;
    white-space: nowrap;
  }

  .lf-stream-btn:hover {
    border-color: var(--border-hover);
    color: var(--text-secondary);
    background: var(--bg-elevated);
  }

  .lf-stream-btn--paused {
    color: #93c5fd;
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.08);
  }

  .lf-stream-btn--paused:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.45);
  }

  /* ── Live indicator ──────────────────────────────────────────────── */
  .lf-live {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-family: var(--font-sans);
    color: var(--text-muted);
    flex-shrink: 0;
    white-space: nowrap;
  }

  .lf-live--connected {
    color: rgba(34, 197, 94, 0.7);
  }

  .lf-live--paused {
    color: #fde047;
  }

  .lf-live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  .lf-live--connected .lf-live-dot {
    animation: lf-pulse 2s ease-in-out infinite;
  }

  @keyframes lf-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
</style>
