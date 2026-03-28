<!-- src/lib/components/memory/MemoryEntryList.svelte -->
<script lang="ts">
  import type { MemoryEntry } from '$api/types';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';

  interface Props {
    entries: MemoryEntry[];
    selected: MemoryEntry | null;
    loading?: boolean;
    totalCount: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onSelect: (entry: MemoryEntry) => void;
    onNextPage: () => void;
    onPrevPage: () => void;
  }

  let {
    entries,
    selected,
    loading = false,
    totalCount,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    onSelect,
    onNextPage,
    onPrevPage,
  }: Props = $props();

  const NS_BADGES: Record<string, string> = {
    agent_context: 'mel-ns--blue',
    knowledge_graph: 'mel-ns--purple',
    session_memory: 'mel-ns--teal',
  };

  function nsBadgeClass(ns: string): string {
    return NS_BADGES[ns] ?? 'mel-ns--default';
  }

  function nsLabel(ns: string): string {
    const short: Record<string, string> = {
      agent_context: 'ctx',
      knowledge_graph: 'kg',
      session_memory: 'sess',
    };
    return short[ns] ?? ns.split('_')[0];
  }

  function previewValue(value: string, type: 'string' | 'json'): string {
    if (type === 'json') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return `[${parsed.length} items]`;
        }
        if (typeof parsed === 'object' && parsed !== null) {
          const keys = Object.keys(parsed);
          return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''}}`;
        }
      } catch {
        // fall through
      }
    }
    return value.length > 80 ? value.slice(0, 80) + '…' : value;
  }
</script>

<section class="mel-section" aria-label="Memory entries">
  {#if loading && entries.length === 0}
    <ul class="mel-list" aria-label="Loading entries">
      {#each [1, 2, 3, 4, 5, 6] as i (i)}
        <li class="mel-skeleton-item" aria-hidden="true">
          <div class="mel-skeleton-top">
            <span class="mel-skeleton-key"></span>
            <span class="mel-skeleton-badge"></span>
          </div>
          <span class="mel-skeleton-preview"></span>
        </li>
      {/each}
    </ul>
  {:else if entries.length === 0}
    <EmptyState
      title="No entries found"
      description="Try a different namespace or search query."
      icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  {:else}
    <ul class="mel-list" role="listbox" aria-label="Memory entries">
      {#each entries as entry (entry.id)}
        <li role="none">
          <button
            class="mel-item"
            class:mel-item--active={selected?.id === entry.id}
            role="option"
            aria-selected={selected?.id === entry.id}
            onclick={() => onSelect(entry)}
          >
            <div class="mel-item-top">
              <span class="mel-item-key" title={entry.key}>{entry.key}</span>
              <div class="mel-item-meta">
                <span class="mel-ns-badge {nsBadgeClass(entry.namespace)}">
                  {nsLabel(entry.namespace)}
                </span>
                {#if entry.value_type === 'json'}
                  <span class="mel-type-badge">JSON</span>
                {/if}
              </div>
            </div>

            <p class="mel-item-preview">
              {previewValue(entry.value, entry.value_type)}
            </p>

            <div class="mel-item-footer">
              <span class="mel-item-agent">{entry.metadata?.agent ?? '—'}</span>
              {#if entry.metadata?.updated_at}
                <TimeAgo date={entry.metadata.updated_at} short />
              {/if}
            </div>
          </button>
        </li>
      {/each}
    </ul>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="mel-pagination" role="navigation" aria-label="Pagination">
        <button
          class="mel-pg-btn"
          onclick={onPrevPage}
          disabled={!hasPrevPage}
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span class="mel-pg-label">
          {page} / {totalPages}
          <span class="mel-pg-total">({totalCount})</span>
        </span>
        <button
          class="mel-pg-btn"
          onclick={onNextPage}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    {/if}
  {/if}
</section>

<style>
  .mel-section {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* ── List ───────────────────────────────────────────────────────────────── */
  .mel-list {
    flex: 1;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mel-list::-webkit-scrollbar {
    width: 4px;
  }

  .mel-list::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 2px;
  }

  /* ── Entry item ─────────────────────────────────────────────────────────── */
  .mel-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: 9px 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    text-align: left;
    cursor: pointer;
    transition:
      background 100ms ease,
      border-color 100ms ease;
    font-family: var(--font-sans);
  }

  .mel-item:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
  }

  .mel-item--active {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .mel-item--active:hover {
    background: rgba(59, 130, 246, 0.14);
  }

  .mel-item:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: -2px;
  }

  /* ── Top row ────────────────────────────────────────────────────────────── */
  .mel-item-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
  }

  .mel-item-key {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
    font-family: var(--font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .mel-item-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  /* ── Preview ────────────────────────────────────────────────────────────── */
  .mel-item-preview {
    font-size: 11px;
    color: var(--text-tertiary);
    line-height: 1.4;
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-all;
  }

  /* ── Footer ─────────────────────────────────────────────────────────────── */
  .mel-item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }

  .mel-item-agent {
    font-size: 10px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Namespace badge ────────────────────────────────────────────────────── */
  .mel-ns-badge {
    display: inline-flex;
    align-items: center;
    height: 14px;
    padding: 0 4px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .mel-ns--blue {
    background: rgba(59, 130, 246, 0.15);
    color: #93c5fd;
  }

  .mel-ns--purple {
    background: rgba(192, 132, 252, 0.15);
    color: #d8b4fe;
  }

  .mel-ns--teal {
    background: rgba(52, 211, 153, 0.15);
    color: #6ee7b7;
  }

  .mel-ns--default {
    background: var(--bg-elevated);
    color: var(--text-muted);
  }

  .mel-type-badge {
    display: inline-flex;
    align-items: center;
    height: 14px;
    padding: 0 4px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.3px;
    background: rgba(251, 191, 36, 0.12);
    color: #fcd34d;
  }

  /* ── Pagination ─────────────────────────────────────────────────────────── */
  .mel-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 12px;
    border-top: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .mel-pg-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    transition: all 100ms ease;
  }

  .mel-pg-btn:hover:not(:disabled) {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .mel-pg-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .mel-pg-label {
    font-size: 11px;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .mel-pg-total {
    color: var(--text-muted);
    font-size: 10px;
  }

  /* ── Skeletons ──────────────────────────────────────────────────────────── */
  .mel-skeleton-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 9px 10px;
    border-radius: var(--radius-sm);
  }

  .mel-skeleton-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .mel-skeleton-key {
    height: 10px;
    width: 55%;
    background: var(--bg-elevated);
    border-radius: 3px;
    animation: mel-pulse 1.5s ease-in-out infinite;
  }

  .mel-skeleton-badge {
    height: 14px;
    width: 28px;
    background: var(--bg-elevated);
    border-radius: 3px;
    animation: mel-pulse 1.5s ease-in-out infinite;
  }

  .mel-skeleton-preview {
    height: 9px;
    width: 80%;
    background: var(--bg-elevated);
    border-radius: 3px;
    animation: mel-pulse 1.5s ease-in-out infinite;
    animation-delay: 0.1s;
  }

  @keyframes mel-pulse {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.7; }
  }
</style>
