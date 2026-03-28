<!-- src/lib/components/schedules/RunHistory.svelte -->
<script lang="ts">
  import type { HeartbeatRun } from '$api/types';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';

  interface Props {
    runs: HeartbeatRun[];
  }

  let { runs }: Props = $props();

  const sorted = $derived(
    [...runs].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    ),
  );

  function formatDuration(ms: number | null): string {
    if (ms === null) return '—';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
  }

  function formatCost(cents: number | null): string {
    if (cents === null) return '—';
    if (cents < 1) return '<$0.01';
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatTokens(run: HeartbeatRun): string {
    if (!run.token_usage) return '—';
    const total = run.token_usage.input + run.token_usage.output;
    if (total < 1000) return `${total}`;
    return `${(total / 1000).toFixed(1)}K`;
  }

  const ICON_CHECK = 'M20 6L9 17l-5-5';
  const ICON_X = 'M18 6L6 18M6 6l12 12';
  const ICON_CLOCK = 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-14v4l3 3';
</script>

<section class="rh-section" aria-label="Run history">
  {#if runs.length === 0}
    <EmptyState
      title="No runs yet"
      description="Runs will appear here after the schedule fires."
    />
  {:else}
    <div class="rh-table-wrap" role="region" aria-label="Heartbeat run history table">
      <table class="rh-table" aria-label="Run history">
        <thead>
          <tr class="rh-thead-row">
            <th class="rh-th rh-th--status" scope="col" aria-label="Status">
              <span class="rh-sr-only">Status</span>
            </th>
            <th class="rh-th" scope="col">Agent</th>
            <th class="rh-th" scope="col">Trigger</th>
            <th class="rh-th rh-th--num" scope="col">Duration</th>
            <th class="rh-th rh-th--num" scope="col">Tokens</th>
            <th class="rh-th rh-th--num" scope="col">Cost</th>
            <th class="rh-th" scope="col">Started</th>
          </tr>
        </thead>
        <tbody>
          {#each sorted as run (run.id)}
            <tr class="rh-row rh-row--{run.status}">
              <!-- Status icon -->
              <td class="rh-td rh-td--status" aria-label="Status: {run.status}">
                {#if run.status === 'succeeded'}
                  <span class="rh-status-icon rh-status-icon--success" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d={ICON_CHECK} />
                    </svg>
                  </span>
                {:else if run.status === 'failed' || run.status === 'timed_out'}
                  <span class="rh-status-icon rh-status-icon--error" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d={ICON_X} />
                    </svg>
                  </span>
                {:else if run.status === 'running'}
                  <span class="rh-status-icon rh-status-icon--running" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d={ICON_CLOCK} />
                    </svg>
                  </span>
                {:else}
                  <span class="rh-status-icon rh-status-icon--pending" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </span>
                {/if}
              </td>
              <td class="rh-td rh-td--agent">{run.agent_name}</td>
              <td class="rh-td">
                <span class="rh-trigger rh-trigger--{run.trigger}">{run.trigger}</span>
              </td>
              <td class="rh-td rh-td--num rh-td--mono">{formatDuration(run.duration_ms)}</td>
              <td class="rh-td rh-td--num rh-td--mono">{formatTokens(run)}</td>
              <td class="rh-td rh-td--num rh-td--mono">{formatCost(run.cost_cents)}</td>
              <td class="rh-td">
                <TimeAgo date={run.started_at} />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  .rh-section {
    width: 100%;
  }

  .rh-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .rh-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
  }

  .rh-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-sans);
    font-size: 12px;
  }

  .rh-thead-row {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-default);
  }

  .rh-th {
    padding: 8px 12px;
    text-align: left;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  .rh-th--status {
    width: 28px;
    padding: 8px 8px 8px 12px;
  }

  .rh-th--num {
    text-align: right;
  }

  .rh-row {
    border-bottom: 1px solid var(--border-default);
    transition: background var(--transition-fast) ease;
  }

  .rh-row:last-child {
    border-bottom: none;
  }

  .rh-row:hover {
    background: var(--bg-surface);
  }

  .rh-td {
    padding: 8px 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    vertical-align: middle;
  }

  .rh-td--status {
    padding: 8px 8px 8px 12px;
    width: 28px;
  }

  .rh-td--agent {
    color: var(--text-primary);
    font-weight: 500;
  }

  .rh-td--num {
    text-align: right;
  }

  .rh-td--mono {
    font-family: var(--font-mono);
    font-size: 11px;
  }

  /* ── Status icons ── */
  .rh-status-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  .rh-status-icon--success {
    background: rgba(34, 197, 94, 0.1);
    color: rgba(34, 197, 94, 0.65);
  }

  .rh-status-icon--error {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  .rh-status-icon--running {
    background: rgba(234, 179, 8, 0.15);
    color: #fde047;
    animation: rh-spin 1.2s linear infinite;
  }

  .rh-status-icon--pending {
    background: rgba(148, 163, 184, 0.1);
    color: var(--text-muted);
  }

  @keyframes rh-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .rh-status-icon--running { animation: none; }
  }

  /* ── Trigger badge ── */
  .rh-trigger {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 500;
    text-transform: capitalize;
    border: 1px solid transparent;
  }

  .rh-trigger--schedule {
    background: rgba(59, 130, 246, 0.1);
    color: #93c5fd;
    border-color: rgba(59, 130, 246, 0.2);
  }

  .rh-trigger--manual {
    background: rgba(168, 85, 247, 0.1);
    color: #c4b5fd;
    border-color: rgba(168, 85, 247, 0.2);
  }

  .rh-trigger--event {
    background: rgba(34, 197, 94, 0.07);
    color: rgba(34, 197, 94, 0.6);
    border-color: rgba(34, 197, 94, 0.15);
  }
</style>
