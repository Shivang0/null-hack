<!-- src/routes/app/sessions/+page.svelte -->
<!-- Sessions observability page: session list + log viewer, tab-switched via ?view= -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import SessionList from '$lib/components/sessions/SessionList.svelte';
  import LogFilters from '$lib/components/logs/LogFilters.svelte';
  import LogViewer from '$lib/components/logs/LogViewer.svelte';
  import { sessionsStore } from '$lib/stores/sessions.svelte';
  import { workspaceStore } from '$lib/stores/workspace.svelte';
  import { logsStore } from '$lib/stores/logs.svelte';
  import type { Session } from '$api/types';

  // ── Tab state — driven by ?view= query param ─────────────────────────────
  type SessionsView = 'sessions' | 'logs';

  let activeView = $derived.by<SessionsView>(() => {
    const v = $page.url.searchParams.get('view');
    if (v === 'logs') return 'logs';
    return 'sessions';
  });

  function setView(view: SessionsView) {
    const url = new URL($page.url);
    if (view === 'sessions') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', view);
    }
    void goto(url.toString(), { replaceState: true, keepFocus: true });
  }

  // ── Fetch sessions on mount / workspace change ───────────────────────────
  $effect(() => {
    const wsId = workspaceStore.activeWorkspaceId ?? undefined;
    void sessionsStore.fetch(wsId);
  });

  // ── Start/stop log streaming when the logs tab is active ─────────────────
  $effect(() => {
    if (activeView === 'logs') {
      void logsStore.fetch({ limit: 200 });
      logsStore.startStreaming();
    } else {
      logsStore.stopStreaming();
    }
  });

  onDestroy(() => {
    logsStore.stopStreaming();
  });

  function handleSelect(session: Session) {
    void goto(`/app/sessions/${session.id}`);
  }

  // ── Level stat pills (replicates lp-summary from logs page) ─────────────
  const LEVEL_COLORS: Record<string, string> = {
    debug: '#9ca3af',
    info:  '#93c5fd',
    warn:  '#fde047',
    error: '#fca5a5',
    fatal: '#ff6b6b',
  };

  // ── Tab definitions ──────────────────────────────────────────────────────
  const VIEWS: { id: SessionsView; label: string }[] = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'logs',     label: 'Logs' },
  ];
</script>

<PageShell
  title={activeView === 'logs' ? 'Logs' : 'Sessions'}
  subtitle={activeView === 'sessions' ? `${sessionsStore.activeCount} active` : undefined}
  badge={activeView === 'sessions' ? sessionsStore.totalCount : (logsStore.stats.total || undefined)}
>
  {#snippet actions()}
    <!-- Tab bar -->
    <nav class="sl-tab-bar" aria-label="Sessions sections">
      {#each VIEWS as v (v.id)}
        <button
          class="sl-tab"
          class:sl-tab--active={activeView === v.id}
          onclick={() => setView(v.id)}
          type="button"
          aria-current={activeView === v.id ? 'page' : undefined}
        >
          {v.label}
        </button>
      {/each}
    </nav>

    <!-- Log-specific header controls (level pills + clear) -->
    {#if activeView === 'logs'}
      <div class="sl-log-summary" role="status" aria-label="Log level summary">
        {#each Object.entries(logsStore.stats) as [level, count]}
          {#if level !== 'total' && level !== 'warning' && count > 0}
            <span
              class="sl-log-stat"
              style:color={LEVEL_COLORS[level] ?? 'var(--text-tertiary)'}
              title="{count} {level} entries"
              aria-label="{count} {level} log entries"
            >
              <span class="sl-log-stat-dot" style:background={LEVEL_COLORS[level] ?? 'currentColor'} aria-hidden="true"></span>
              {(count as number).toLocaleString()}
            </span>
          {/if}
        {/each}
      </div>
      <button
        class="sl-log-clear-btn"
        onclick={() => logsStore.clear()}
        aria-label="Clear log buffer"
        title="Clear log buffer"
      >
        Clear
      </button>
    {/if}
  {/snippet}

  {#snippet children()}
    <!-- ── Sessions view ──────────────────────────────────────────────── -->
    {#if activeView === 'sessions'}
      <div class="sl-layout">
        <SessionList
          sessions={sessionsStore.pagedSessions}
          loading={sessionsStore.loading}
          totalCount={sessionsStore.filteredSessions.length}
          page={sessionsStore.page}
          totalPages={sessionsStore.totalPages}
          searchValue={sessionsStore.filters.search}
          statusFilter={sessionsStore.filters.status}
          sortKey={sessionsStore.filters.sort}
          sortDir={sessionsStore.filters.sortDir}
          agentOptions={sessionsStore.agentOptions}
          agentFilter={sessionsStore.filters.agentId}
          onSearch={(q) => sessionsStore.setSearch(q)}
          onStatusFilter={(s) => sessionsStore.setStatusFilter(s)}
          onAgentFilter={(id) => sessionsStore.setAgentFilter(id)}
          onSort={(key) => sessionsStore.setSort(key)}
          onPageChange={(p) => sessionsStore.setPage(p)}
          onSelect={handleSelect}
        />
      </div>

    <!-- ── Logs view ──────────────────────────────────────────────────── -->
    {:else}
      <div class="sl-log-body">
        <LogFilters />
        <LogViewer />
      </div>
    {/if}
  {/snippet}
</PageShell>

<style>
  /* ── Tab bar (mirrors ib-tab-bar pattern from Inbox) ──────────────────── */
  .sl-tab-bar {
    display: flex;
    gap: 2px;
  }

  .sl-tab {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 10px;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 500;
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-family: var(--font-sans);
    transition: background 100ms ease, color 100ms ease, border-color 100ms ease;
  }

  .sl-tab:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-color: var(--border-default);
  }

  .sl-tab--active {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  /* ── Sessions layout ───────────────────────────────────────────────────── */
  .sl-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* Negative margin to let SessionList own its scroll and toolbar */
    margin: -20px -24px;
  }

  /* ── Log view layout ───────────────────────────────────────────────────── */
  .sl-log-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    /* Negative margin — log viewer needs full bleed (matches lp-body pattern) */
    margin: -20px -24px;
  }

  /* ── Log header: level summary pills ──────────────────────────────────── */
  .sl-log-summary {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .sl-log-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .sl-log-stat-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Log header: clear button ──────────────────────────────────────────── */
  .sl-log-clear-btn {
    height: 26px;
    padding: 0 10px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-tertiary);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 100ms ease;
  }

  .sl-log-clear-btn:hover {
    border-color: rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.08);
  }
</style>
