<!-- src/lib/components/schedules/ScheduleCard.svelte -->
<script lang="ts">
  import type { Schedule } from '$api/types';
  import StatusDot from '$lib/components/shared/StatusDot.svelte';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';
  import Badge from '$lib/components/shared/Badge.svelte';
  import { schedulesStore } from '$lib/stores/schedules.svelte';

  interface Props {
    schedule: Schedule;
    onEdit?: (schedule: Schedule) => void;
  }

  let { schedule, onEdit }: Props = $props();

  let expanded = $state(false);
  let toggling = $state(false);

  async function handleToggle() {
    toggling = true;
    await schedulesStore.toggleSchedule(schedule.id);
    toggling = false;
  }

  const lastRunVariant = $derived(
    schedule.last_run_status === 'succeeded'
      ? ('success' as const)
      : schedule.last_run_status === 'failed'
        ? ('error' as const)
        : ('default' as const),
  );

  const lastRunLabel = $derived(
    schedule.last_run_status === 'succeeded'
      ? 'succeeded'
      : schedule.last_run_status === 'failed'
        ? 'failed'
        : 'no runs',
  );

  const statusDotStatus = $derived(
    schedule.enabled ? ('online' as const) : ('offline' as const),
  );
</script>

<article
  class="sc-card"
  class:sc-card--expanded={expanded}
  aria-label="Schedule: {schedule.agent_name}"
>
  <div class="sc-header">
    <div class="sc-title-row">
      <StatusDot status={statusDotStatus} size="sm" />
      <span class="sc-agent">{schedule.agent_name}</span>
      {#if schedule.run_count > 0}
        <Badge value={schedule.run_count} variant="default" size="sm" />
      {/if}
    </div>
    <button
      class="sc-expand-btn"
      onclick={() => (expanded = !expanded)}
      aria-expanded={expanded}
      aria-label={expanded ? 'Collapse schedule details' : 'Expand schedule details'}
      type="button"
    >
      <svg
        class="sc-chevron"
        class:sc-chevron--open={expanded}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  </div>

  <p class="sc-cron">{schedule.human_readable}</p>

  <div class="sc-row">
    <div class="sc-meta">
      <span class="sc-meta-label">Next run</span>
      {#if schedule.next_run_at}
        <TimeAgo date={schedule.next_run_at} />
      {:else}
        <span class="sc-meta-value sc-meta-value--muted">—</span>
      {/if}
    </div>

    <div class="sc-meta">
      <span class="sc-meta-label">Last run</span>
      {#if schedule.last_run_at}
        <Badge value={lastRunLabel} variant={lastRunVariant} size="sm" />
        <TimeAgo date={schedule.last_run_at} short />
      {:else}
        <span class="sc-meta-value sc-meta-value--muted">never</span>
      {/if}
    </div>
  </div>

  <!-- Toggle -->
  <div class="sc-toggle-row">
    <span class="sc-toggle-label">{schedule.enabled ? 'Enabled' : 'Disabled'}</span>
    <button
      class="sc-toggle"
      class:sc-toggle--on={schedule.enabled}
      onclick={handleToggle}
      disabled={toggling}
      aria-label={schedule.enabled ? 'Disable schedule' : 'Enable schedule'}
      aria-pressed={schedule.enabled}
      type="button"
    >
      <span class="sc-toggle-thumb"></span>
    </button>
  </div>

  <!-- Expanded section -->
  {#if expanded}
    <div class="sc-expanded" aria-label="Schedule details">
      {#if schedule.context}
        <div class="sc-context">
          <p class="sc-context-label">Context</p>
          <p class="sc-context-text">{schedule.context}</p>
        </div>
      {/if}

      <div class="sc-actions">
        <button
          class="sc-btn sc-btn--secondary"
          onclick={() => onEdit?.(schedule)}
          aria-label="Edit schedule"
          type="button"
        >
          Edit
        </button>
        <button
          class="sc-btn sc-btn--ghost"
          onclick={() => void schedulesStore.triggerNow(schedule.id)}
          aria-label="Trigger schedule now"
          type="button"
        >
          Run now
        </button>
        <button
          class="sc-btn sc-btn--danger"
          onclick={() => void schedulesStore.deleteSchedule(schedule.id)}
          aria-label="Delete schedule"
          type="button"
        >
          Delete
        </button>
      </div>
    </div>
  {/if}
</article>

<style>
  .sc-card {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color var(--transition-fast) ease;
  }

  .sc-card:hover {
    border-color: var(--border-hover);
  }

  /* ── Header ── */
  .sc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .sc-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .sc-agent {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sc-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-xs);
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    flex-shrink: 0;
    transition: color var(--transition-fast) ease, background var(--transition-fast) ease;
    padding: 0;
  }

  .sc-expand-btn:hover {
    color: var(--text-secondary);
    background: var(--bg-elevated);
  }

  .sc-expand-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .sc-chevron {
    transition: transform var(--transition-normal) ease;
  }

  .sc-chevron--open {
    transform: rotate(180deg);
  }

  /* ── Cron description ── */
  .sc-cron {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
  }

  /* ── Meta row ── */
  .sc-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .sc-meta {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .sc-meta-label {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .sc-meta-value {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-secondary);
  }

  .sc-meta-value--muted {
    color: var(--text-muted);
  }

  /* ── Toggle ── */
  .sc-toggle-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sc-toggle-label {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-tertiary);
    flex: 1;
  }

  .sc-toggle {
    position: relative;
    width: 32px;
    height: 18px;
    border-radius: 9px;
    border: none;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    cursor: pointer;
    transition: background var(--transition-fast) ease, border-color var(--transition-fast) ease;
    padding: 0;
    flex-shrink: 0;
  }

  .sc-toggle--on {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .sc-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sc-toggle:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .sc-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--text-muted);
    transition: transform var(--transition-fast) ease, background var(--transition-fast) ease;
  }

  .sc-toggle--on .sc-toggle-thumb {
    transform: translateX(14px);
    background: var(--accent-primary);
  }

  /* ── Expanded ── */
  .sc-expanded {
    border-top: 1px solid var(--border-default);
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sc-context {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sc-context-label {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .sc-context-text {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .sc-actions {
    display: flex;
    gap: 6px;
  }

  .sc-btn {
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--transition-fast) ease,
      border-color var(--transition-fast) ease,
      color var(--transition-fast) ease;
  }

  .sc-btn--secondary {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
  }

  .sc-btn--secondary:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }

  .sc-btn--ghost {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-tertiary);
  }

  .sc-btn--ghost:hover {
    color: var(--text-secondary);
    border-color: var(--border-default);
  }

  .sc-btn--danger {
    background: transparent;
    border: 1px solid transparent;
    color: var(--accent-error, #ef4444);
    margin-left: auto;
  }

  .sc-btn--danger:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .sc-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
