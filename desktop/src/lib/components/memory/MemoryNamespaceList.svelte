<!-- src/lib/components/memory/MemoryNamespaceList.svelte -->
<script lang="ts">
  import type { MemoryNamespace } from '$api/types';

  interface Props {
    namespaces: MemoryNamespace[];
    active: string;
    searchQuery: string;
    totalCount: number;
    loading?: boolean;
    onSelect: (ns: string) => void;
    onSearch: (q: string) => void;
  }

  let {
    namespaces,
    active,
    searchQuery,
    totalCount,
    loading = false,
    onSelect,
    onSearch,
  }: Props = $props();

  const NS_ICONS: Record<string, string> = {
    agent_context:
      'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v10m0 0h10m-10 0H5m0 0v6a2 2 0 002 2h10a2 2 0 002-2v-6M5 13h14',
    knowledge_graph:
      'M4 7a3 3 0 100-6 3 3 0 000 6zm16 0a3 3 0 100-6 3 3 0 000 6zM12 21a3 3 0 100-6 3 3 0 000 6zM4 7v10m16-10v10M4 17a8 8 0 0116 0',
    session_memory:
      'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  };

  const NS_COLORS: Record<string, string> = {
    agent_context: 'ns-color--blue',
    knowledge_graph: 'ns-color--purple',
    session_memory: 'ns-color--teal',
  };

  function getIcon(ns: string): string {
    return (
      NS_ICONS[ns] ??
      'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    );
  }

  function getColor(ns: string): string {
    return NS_COLORS[ns] ?? 'ns-color--default';
  }

  function formatLabel(ns: string): string {
    return ns
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  let searchInput = $state('');

  $effect(() => {
    // Keep local input in sync when the parent resets the query externally
    searchInput = searchQuery;
  });

  function handleSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    searchInput = val;
    onSearch(val);
  }

  function clearSearch() {
    searchInput = '';
    onSearch('');
  }
</script>

<aside class="mnl-sidebar" aria-label="Memory namespaces">
  <!-- Search -->
  <div class="mnl-search-wrap">
    <div class="mnl-search">
      <svg
        class="mnl-search-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        class="mnl-search-input"
        type="search"
        placeholder="Search memory..."
        value={searchInput}
        oninput={handleSearchInput}
        aria-label="Search memory entries"
        autocomplete="off"
        spellcheck="false"
      />
      {#if searchInput}
        <button
          class="mnl-search-clear"
          onclick={clearSearch}
          aria-label="Clear search"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Namespace list -->
  <nav class="mnl-nav" aria-label="Filter by namespace">
    <ul class="mnl-list" role="listbox" aria-label="Namespaces">
      <!-- All -->
      <li role="none">
        <button
          class="mnl-item"
          class:mnl-item--active={active === 'all'}
          role="option"
          aria-selected={active === 'all'}
          onclick={() => onSelect('all')}
        >
          <span class="mnl-item-icon mnl-color--all" aria-hidden="true">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
            >
              <path
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </span>
          <span class="mnl-item-label">All namespaces</span>
          <span class="mnl-item-count">{totalCount}</span>
        </button>
      </li>

      {#each namespaces as ns (ns.name)}
        <li role="none">
          <button
            class="mnl-item"
            class:mnl-item--active={active === ns.name}
            role="option"
            aria-selected={active === ns.name}
            onclick={() => onSelect(ns.name)}
          >
            <span
              class="mnl-item-icon {getColor(ns.name)}"
              aria-hidden="true"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
              >
                <path d={getIcon(ns.name)} />
              </svg>
            </span>
            <span class="mnl-item-label" title={ns.name}>
              {formatLabel(ns.name)}
            </span>
            <span class="mnl-item-count">{ns.count}</span>
          </button>
        </li>
      {/each}

      {#if loading && namespaces.length === 0}
        {#each [1, 2, 3] as i (i)}
          <li class="mnl-skeleton" aria-hidden="true">
            <span class="mnl-skeleton-icon"></span>
            <span class="mnl-skeleton-text"></span>
          </li>
        {/each}
      {/if}
    </ul>
  </nav>
</aside>

<style>
  .mnl-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-surface);
    border-right: 1px solid var(--border-default);
    overflow: hidden;
  }

  /* ── Search ─────────────────────────────────────────────────────────────── */
  .mnl-search-wrap {
    padding: 12px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .mnl-search {
    position: relative;
    display: flex;
    align-items: center;
  }

  .mnl-search-icon {
    position: absolute;
    left: 9px;
    color: var(--text-muted);
    pointer-events: none;
    flex-shrink: 0;
  }

  .mnl-search-input {
    width: 100%;
    height: 30px;
    padding: 0 28px 0 30px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 12px;
    outline: none;
    transition: border-color 120ms ease;
  }

  .mnl-search-input::placeholder {
    color: var(--text-muted);
  }

  .mnl-search-input:focus {
    border-color: var(--accent-primary);
  }

  /* Remove default browser search clear button */
  .mnl-search-input::-webkit-search-cancel-button {
    display: none;
  }

  .mnl-search-clear {
    position: absolute;
    right: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    border-radius: 2px;
    transition: color 120ms ease;
  }

  .mnl-search-clear:hover {
    color: var(--text-secondary);
  }

  /* ── Nav ────────────────────────────────────────────────────────────────── */
  .mnl-nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .mnl-nav::-webkit-scrollbar {
    width: 4px;
  }

  .mnl-nav::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 2px;
  }

  .mnl-list {
    list-style: none;
    margin: 0;
    padding: 0 6px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  /* ── Item ───────────────────────────────────────────────────────────────── */
  .mnl-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 32px;
    padding: 0 8px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 400;
    cursor: pointer;
    text-align: left;
    transition:
      background 100ms ease,
      color 100ms ease;
  }

  .mnl-item:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .mnl-item--active {
    background: rgba(59, 130, 246, 0.12);
    color: var(--text-primary);
    font-weight: 500;
  }

  .mnl-item--active:hover {
    background: rgba(59, 130, 246, 0.18);
  }

  .mnl-item:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: -2px;
  }

  /* ── Icon ───────────────────────────────────────────────────────────────── */
  .mnl-item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .mnl-color--all {
    color: var(--text-tertiary);
    background: var(--bg-elevated);
  }

  .mnl-color--blue {
    color: #60a5fa;
    background: rgba(59, 130, 246, 0.12);
  }

  .mnl-color--purple {
    color: #c084fc;
    background: rgba(192, 132, 252, 0.12);
  }

  .mnl-color--teal {
    color: rgba(52, 211, 153, 0.7);
    background: rgba(52, 211, 153, 0.08);
  }

  .mnl-color--default {
    color: var(--text-tertiary);
    background: var(--bg-elevated);
  }

  .mnl-item--active .mnl-color--all {
    color: #93c5fd;
    background: rgba(59, 130, 246, 0.2);
  }

  /* ── Label + count ──────────────────────────────────────────────────────── */
  .mnl-item-label {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mnl-item-count {
    flex-shrink: 0;
    min-width: 18px;
    height: 16px;
    padding: 0 5px;
    border-radius: 8px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-tertiary);
    font-size: 10px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    font-variant-numeric: tabular-nums;
  }

  .mnl-item--active .mnl-item-count {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
    color: #93c5fd;
  }

  /* ── Skeletons ──────────────────────────────────────────────────────────── */
  .mnl-skeleton {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    height: 32px;
  }

  .mnl-skeleton-icon {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: var(--bg-elevated);
    animation: mnl-pulse 1.5s ease-in-out infinite;
  }

  .mnl-skeleton-text {
    flex: 1;
    height: 10px;
    border-radius: 3px;
    background: var(--bg-elevated);
    animation: mnl-pulse 1.5s ease-in-out infinite;
  }

  @keyframes mnl-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
</style>
