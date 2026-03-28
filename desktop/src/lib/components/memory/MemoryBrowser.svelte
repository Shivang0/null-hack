<!-- src/lib/components/memory/MemoryBrowser.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { memoryStore } from '$lib/stores/memory.svelte';
  import MemoryNamespaceList from './MemoryNamespaceList.svelte';
  import MemoryEntryList from './MemoryEntryList.svelte';
  import MemoryEntryDetail from './MemoryEntryDetail.svelte';

  // ── Responsive collapse ───────────────────────────────────────────────────
  let sidebarCollapsed = $state(false);
  let windowWidth = $state(1200);

  $effect(() => {
    sidebarCollapsed = windowWidth < 768;
  });

  function handleResize() {
    windowWidth = window.innerWidth;
  }

  onMount(() => {
    windowWidth = window.innerWidth;
    window.addEventListener('resize', handleResize);
    void memoryStore.fetch();
    return () => window.removeEventListener('resize', handleResize);
  });

  // ── Namespace selection ───────────────────────────────────────────────────
  async function handleNamespaceSelect(ns: string) {
    memoryStore.setActiveNamespace(ns);
    // When using mock, filtered entries are derived — no extra fetch needed.
    // If backend is wired: await memoryStore.getByNamespace(ns);
  }

  // ── Search ────────────────────────────────────────────────────────────────
  let searchDebounce: ReturnType<typeof setTimeout>;

  function handleSearch(q: string) {
    memoryStore.setSearch(q);
    clearTimeout(searchDebounce);
    if (q.trim().length > 1) {
      searchDebounce = setTimeout(() => {
        void memoryStore.search(q);
      }, 350);
    } else if (!q.trim()) {
      void memoryStore.fetch();
    }
  }

  // ── Update / delete ───────────────────────────────────────────────────────
  async function handleUpdate(
    id: string,
    patch: { key?: string; value?: string; value_type?: 'string' | 'json' },
  ) {
    await memoryStore.update(id, patch);
  }

  async function handleDelete(id: string) {
    await memoryStore.delete(id);
  }

  // ── Toggle sidebar on small screens ──────────────────────────────────────
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
  }

  // Close detail on small screens when navigating
  function handleEntrySelect(entry: import('$api/types').MemoryEntry) {
    memoryStore.selectEntry(entry);
    if (windowWidth < 768) {
      sidebarCollapsed = true;
    }
  }
</script>

<div class="mb-root" class:mb-root--small={windowWidth < 768}>
  <!-- Sidebar toggle (small screens) -->
  {#if windowWidth < 768}
    <div class="mb-mobile-bar">
      <button
        class="mb-toggle-btn"
        onclick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Show namespaces' : 'Hide namespaces'}
        aria-expanded={!sidebarCollapsed}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          {#if sidebarCollapsed}
            <path d="M4 6h16M4 12h16M4 18h16" />
          {:else}
            <path d="M6 18L18 6M6 6l12 12" />
          {/if}
        </svg>
        {sidebarCollapsed ? 'Namespaces' : 'Close'}
      </button>
      {#if memoryStore.selected && sidebarCollapsed}
        <button
          class="mb-back-btn"
          onclick={() => memoryStore.selectEntry(null)}
          aria-label="Back to list"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
      {/if}
    </div>
  {/if}

  <div class="mb-layout">
    <!-- Left sidebar: namespaces + search -->
    <div
      class="mb-sidebar"
      class:mb-sidebar--collapsed={sidebarCollapsed}
      aria-hidden={sidebarCollapsed}
    >
      <MemoryNamespaceList
        namespaces={memoryStore.namespaces}
        active={memoryStore.activeNamespace}
        searchQuery={memoryStore.searchQuery}
        totalCount={memoryStore.totalCount}
        loading={memoryStore.loading}
        onSelect={handleNamespaceSelect}
        onSearch={handleSearch}
      />
    </div>

    <!-- Center: entry list -->
    <div
      class="mb-list-pane"
      class:mb-list-pane--hidden={windowWidth < 768 && memoryStore.selected !== null && sidebarCollapsed}
    >
      <MemoryEntryList
        entries={memoryStore.paginatedEntries}
        selected={memoryStore.selected}
        loading={memoryStore.loading}
        totalCount={memoryStore.totalCount}
        page={memoryStore.page}
        totalPages={memoryStore.totalPages}
        hasNextPage={memoryStore.hasNextPage}
        hasPrevPage={memoryStore.hasPrevPage}
        onSelect={handleEntrySelect}
        onNextPage={() => memoryStore.nextPage()}
        onPrevPage={() => memoryStore.prevPage()}
      />
    </div>

    <!-- Right: detail panel -->
    <div
      class="mb-detail-pane"
      class:mb-detail-pane--empty={memoryStore.selected === null}
      class:mb-detail-pane--visible={memoryStore.selected !== null}
    >
      {#if memoryStore.selected}
        <MemoryEntryDetail
          entry={memoryStore.selected}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      {:else}
        <div class="mb-empty-detail" aria-label="No entry selected">
          <div class="mb-empty-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <p class="mb-empty-text">Select an entry to inspect</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Error banner -->
  {#if memoryStore.error}
    <div class="mb-error-bar" role="alert">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {memoryStore.error}
      <button
        class="mb-error-close"
        onclick={() => { memoryStore.error = null; }}
        aria-label="Dismiss error"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/if}
</div>

<style>
  .mb-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  /* ── Mobile top bar ─────────────────────────────────────────────────────── */
  .mb-mobile-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
    background: var(--bg-surface);
  }

  .mb-toggle-btn,
  .mb-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 100ms ease;
  }

  .mb-toggle-btn:hover,
  .mb-back-btn:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  /* ── Layout ─────────────────────────────────────────────────────────────── */
  .mb-layout {
    display: grid;
    grid-template-columns: 200px 280px 1fr;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  /* ── Sidebar ────────────────────────────────────────────────────────────── */
  .mb-sidebar {
    overflow: hidden;
    border-right: 1px solid var(--border-default);
    transition: width 200ms ease, opacity 200ms ease;
  }

  .mb-sidebar--collapsed {
    width: 0;
    opacity: 0;
    pointer-events: none;
    border-right: none;
  }

  /* ── Entry list pane ────────────────────────────────────────────────────── */
  .mb-list-pane {
    overflow: hidden;
    border-right: 1px solid var(--border-default);
    background: var(--bg-base);
  }

  .mb-list-pane--hidden {
    display: none;
  }

  /* ── Detail pane ────────────────────────────────────────────────────────── */
  .mb-detail-pane {
    overflow: hidden;
    background: var(--bg-surface);
  }

  .mb-detail-pane--empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mb-empty-detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 20px;
    text-align: center;
  }

  .mb-empty-icon {
    color: var(--text-muted);
    opacity: 0.4;
  }

  .mb-empty-text {
    font-size: 13px;
    color: var(--text-tertiary);
    margin: 0;
  }

  /* ── Error bar ──────────────────────────────────────────────────────────── */
  .mb-error-bar {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-sm);
    color: #fca5a5;
    font-size: 12px;
    font-family: var(--font-sans);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 10;
    white-space: nowrap;
    max-width: calc(100% - 48px);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mb-error-close {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #fca5a5;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    flex-shrink: 0;
  }

  .mb-error-close:hover {
    color: #fee2e2;
  }

  /* ── Responsive overrides ───────────────────────────────────────────────── */
  .mb-root--small .mb-layout {
    grid-template-columns: 0 1fr 1fr;
  }

  @media (max-width: 1024px) {
    .mb-layout {
      grid-template-columns: 180px 240px 1fr;
    }
  }

  @media (max-width: 768px) {
    .mb-layout {
      display: flex;
      flex-direction: column;
    }

    .mb-sidebar {
      flex-shrink: 0;
      max-height: 280px;
    }

    .mb-sidebar--collapsed {
      max-height: 0;
    }

    .mb-list-pane {
      flex: 1;
      min-height: 0;
    }

    .mb-detail-pane {
      position: absolute;
      inset: 0;
      z-index: 5;
    }

    .mb-detail-pane:not(.mb-detail-pane--visible) {
      display: none;
    }
  }
</style>
