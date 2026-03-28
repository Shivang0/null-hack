<script lang="ts">
  import StatusDot from '$lib/components/shared/StatusDot.svelte';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';
  import Badge from '$lib/components/shared/Badge.svelte';
  import { dashboardStore } from '$lib/stores/dashboard.svelte';
  import { goto } from '$app/navigation';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const MAX_VISIBLE = 5;

  const visibleRuns = $derived(dashboardStore.liveRuns.slice(0, MAX_VISIBLE));
  const hasMore = $derived(dashboardStore.liveRuns.length > MAX_VISIBLE);
  const totalCount = $derived(dashboardStore.liveRuns.length);

  type RunStatus = 'running' | 'queued' | 'failed' | string;

  function statusToDot(status: RunStatus): 'online' | 'idle' | 'error' {
    if (status === 'running') return 'online';
    if (status === 'queued')  return 'idle';
    return 'error';
  }

  function fmtTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  }
</script>

<article class="lrw-card {className}" aria-label="Live runs">
  <header class="lrw-header">
    <span class="lrw-title">Live Runs</span>
    <Badge value={totalCount} variant={totalCount > 0 ? 'accent' : 'default'} size="sm" />
  </header>

  {#if visibleRuns.length === 0}
    <div class="lrw-empty" aria-live="polite">
      <svg
        class="lrw-empty-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M10 8l4 4-4 4" />
      </svg>
      <span>No active runs</span>
    </div>
  {:else}
    <ul class="lrw-list" role="list" aria-label="Active run list">
      {#each visibleRuns as run (run.id)}
        <li class="lrw-row">
          <StatusDot
            status={statusToDot(run.status)}
            pulse={run.status === 'running'}
            size="sm"
          />
          <span class="lrw-agent" title={run.agent_name}>{run.agent_name}</span>
          <span class="lrw-tokens" aria-label="{fmtTokens(run.tokens_used)} tokens used">
            {fmtTokens(run.tokens_used)} tok
          </span>
          <TimeAgo date={run.started_at} live short />
        </li>
      {/each}
    </ul>

    {#if hasMore}
      <button
        class="lrw-view-all"
        onclick={() => goto('/app/runs')}
        aria-label="View all {totalCount} runs"
      >
        View all →
      </button>
    {/if}
  {/if}
</article>

<style>
  .lrw-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .lrw-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .lrw-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.1px;
  }

  .lrw-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .lrw-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 36px;
    border-radius: var(--radius-sm);
    padding: 0 var(--space-2);
    transition: background var(--transition-fast) ease;
  }

  .lrw-row:hover {
    background: var(--bg-elevated);
  }

  .lrw-agent {
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--text-primary);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lrw-tokens {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-tertiary);
    white-space: nowrap;
  }

  .lrw-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-6) 0;
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--text-tertiary);
  }

  .lrw-empty-icon {
    color: var(--text-muted);
  }

  .lrw-view-all {
    align-self: flex-end;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--accent-primary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: opacity var(--transition-fast) ease;
  }

  .lrw-view-all:hover {
    opacity: 0.75;
  }

  .lrw-view-all:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }
</style>
