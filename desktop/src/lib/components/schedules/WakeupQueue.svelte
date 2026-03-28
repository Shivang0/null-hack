<!-- src/lib/components/schedules/WakeupQueue.svelte -->
<script lang="ts">
  import type { HeartbeatRun } from '$api/types';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';

  interface Props {
    runs: HeartbeatRun[];
  }

  let { runs }: Props = $props();

  const pending = $derived(
    runs.filter((r) => r.status === 'pending'),
  );

  // No per-run cancel endpoint exists in the current API surface,
  // so the cancel button is a placeholder for future integration.
  function handleCancel(run: HeartbeatRun) {
    // TODO: wire up cancel API when available
    console.warn('Cancel not yet implemented for run', run.id);
  }
</script>

<section class="wq-section" aria-label="Wake-up queue">
  <h2 class="wq-title">Wake-up queue</h2>

  {#if pending.length === 0}
    <EmptyState
      title="No pending wake-ups"
      description="Queued schedule runs will appear here."
    />
  {:else}
    <ul class="wq-list" role="list">
      {#each pending as run (run.id)}
        <li class="wq-item">
          <div class="wq-info">
            <span class="wq-agent">{run.agent_name}</span>
            <span class="wq-time">
              Scheduled <TimeAgo date={run.started_at} />
            </span>
          </div>
          <button
            class="wq-cancel"
            onclick={() => handleCancel(run)}
            aria-label="Cancel wake-up for {run.agent_name}"
            type="button"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .wq-section {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .wq-title {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .wq-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .wq-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    gap: 8px;
  }

  .wq-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .wq-agent {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wq-time {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .wq-cancel {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--radius-xs);
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition: color var(--transition-fast) ease, background var(--transition-fast) ease;
    padding: 0;
  }

  .wq-cancel:hover {
    color: var(--accent-error);
    background: rgba(239, 68, 68, 0.1);
  }

  .wq-cancel:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
