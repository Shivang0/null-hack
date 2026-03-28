<!-- src/lib/components/spawn/SpawnHistory.svelte -->
<script lang="ts">
  import type { SpawnInstance } from '$api/types';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';

  interface Props {
    instances: SpawnInstance[];
  }

  let { instances }: Props = $props();

  const sorted = $derived(
    [...instances].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    ),
  );

  function formatDuration(instance: SpawnInstance): string {
    if (!instance.completed_at) return '—';
    const ms = new Date(instance.completed_at).getTime() - new Date(instance.started_at).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
  }

  function formatTokens(instance: SpawnInstance): string {
    if (!instance.token_usage) return '—';
    const total = instance.token_usage.input + instance.token_usage.output;
    if (total === 0) return '—';
    return total < 1000 ? `${total}` : `${(total / 1000).toFixed(1)}K`;
  }

  function formatCost(cents: number | null): string {
    if (cents === null) return '—';
    if (cents === 0) return '$0.00';
    return `$${(cents / 100).toFixed(3)}`;
  }
</script>

<section class="sph-section" aria-label="Spawn history">
  <h2 class="sph-title">History</h2>

  {#if instances.length === 0}
    <EmptyState
      title="No spawn history"
      description="Completed spawn instances will appear here."
    />
  {:else}
    <div class="sph-table-wrap" role="region" aria-label="Spawn instance history table">
      <table class="sph-table">
        <thead>
          <tr class="sph-thead-row">
            <th class="sph-th sph-th--status" scope="col">
              <span class="sph-sr-only">Status</span>
            </th>
            <th class="sph-th" scope="col">Agent</th>
            <th class="sph-th sph-th--wide" scope="col">Task</th>
            <th class="sph-th sph-th--num" scope="col">Duration</th>
            <th class="sph-th sph-th--num" scope="col">Tokens</th>
            <th class="sph-th sph-th--num" scope="col">Cost</th>
            <th class="sph-th" scope="col">Started</th>
          </tr>
        </thead>
        <tbody>
          {#each sorted as instance (instance.id)}
            <tr class="sph-row">
              <!-- Status -->
              <td class="sph-td sph-td--status" aria-label="Status: {instance.status}">
                <span class="sph-dot sph-dot--{instance.status}" aria-hidden="true"></span>
              </td>
              <td class="sph-td sph-td--agent">{instance.agent_name}</td>
              <td class="sph-td sph-td--task">
                <span class="sph-task-text">{instance.task}</span>
              </td>
              <td class="sph-td sph-td--num sph-td--mono">{formatDuration(instance)}</td>
              <td class="sph-td sph-td--num sph-td--mono">{formatTokens(instance)}</td>
              <td class="sph-td sph-td--num sph-td--mono">{formatCost(instance.cost_cents)}</td>
              <td class="sph-td">
                <TimeAgo date={instance.started_at} />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  .sph-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sph-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
  }

  .sph-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .sph-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
  }

  .sph-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-sans);
    font-size: 12px;
  }

  .sph-thead-row {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-default);
  }

  .sph-th {
    padding: 8px 12px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  .sph-th--status {
    width: 28px;
    padding: 8px 8px 8px 12px;
  }

  .sph-th--wide {
    min-width: 200px;
  }

  .sph-th--num {
    text-align: right;
  }

  .sph-row {
    border-bottom: 1px solid var(--border-default);
    transition: background var(--transition-fast) ease;
  }

  .sph-row:last-child {
    border-bottom: none;
  }

  .sph-row:hover {
    background: var(--bg-surface);
  }

  .sph-td {
    padding: 8px 12px;
    color: var(--text-secondary);
    vertical-align: middle;
    white-space: nowrap;
  }

  .sph-td--status {
    width: 28px;
    padding: 8px 8px 8px 12px;
  }

  .sph-td--agent {
    color: var(--text-primary);
    font-weight: 500;
  }

  .sph-td--task {
    white-space: normal;
    max-width: 280px;
  }

  .sph-task-text {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .sph-td--num {
    text-align: right;
  }

  .sph-td--mono {
    font-family: var(--font-mono);
    font-size: 11px;
  }

  /* ── Status dot ── */
  .sph-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .sph-dot--running {
    background: rgba(34, 197, 94, 0.75);
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15);
  }

  .sph-dot--completed {
    background: var(--text-muted);
  }

  .sph-dot--failed {
    background: var(--accent-error);
  }
</style>
