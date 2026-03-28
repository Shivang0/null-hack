<!-- src/lib/components/sessions/SessionCard.svelte -->
<!-- Session list card: agent, status, timing, token/cost stats, tool call badge -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Session } from '$lib/api/types';
  import StatusDot from '$lib/components/shared/StatusDot.svelte';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';

  interface Props {
    session: Session;
    selected?: boolean;
    onclick?: (session: Session) => void;
  }

  let { session, selected = false, onclick }: Props = $props();

  // Map session status → StatusDot variant
  const dotStatus = $derived.by((): 'online' | 'idle' | 'error' | 'offline' | 'busy' => {
    switch (session.status) {
      case 'active':    return 'busy';
      case 'completed': return 'online';
      case 'failed':    return 'error';
      default:          return 'offline';
    }
  });

  const statusLabel = $derived.by(() => {
    switch (session.status) {
      case 'active':    return 'Active';
      case 'completed': return 'Done';
      case 'failed':    return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return session.status;
    }
  });

  // Duration string
  const duration = $derived.by(() => {
    const start = new Date(session.started_at).getTime();
    const end = session.completed_at
      ? new Date(session.completed_at).getTime()
      : Date.now();
    const secs = Math.floor((end - start) / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ${secs % 60}s`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  });

  // Total token count
  const totalTokens = $derived(
    session.token_usage.input + session.token_usage.output
  );

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  }

  function formatCost(cents: number): string {
    if (cents === 0) return '$0.00';
    if (cents < 1) return '<$0.01';
    return `$${(cents / 100).toFixed(2)}`;
  }

  function handleClick() {
    if (onclick) {
      onclick(session);
    } else {
      void goto(`/app/sessions/${session.id}`);
    }
  }



  // Emoji avatar from agent name initial
  const avatarLetter = $derived(session.agent_name.charAt(0).toUpperCase());
</script>

<button
  class="sc-card"
  class:sc-card--selected={selected}
  class:sc-card--active={session.status === 'active'}
  class:sc-card--failed={session.status === 'failed'}
  onclick={handleClick}
  aria-label="Session: {session.title ?? session.id}, {statusLabel}"
  aria-pressed={selected}
  type="button"
>
  <!-- Header row -->
  <div class="sc-header">
    <div class="sc-agent">
      <span class="sc-avatar" aria-hidden="true">{avatarLetter}</span>
      <div class="sc-agent-info">
        <span class="sc-agent-name">{session.agent_name}</span>
        <span class="sc-title">{session.title ?? session.id}</span>
      </div>
    </div>
    <div class="sc-status" aria-label="Status: {statusLabel}">
      <StatusDot status={dotStatus} pulse={session.status === 'active'} size="sm" />
      <span class="sc-status-label sc-status-label--{session.status}">{statusLabel}</span>
    </div>
  </div>

  <!-- Stats row -->
  <div class="sc-stats" aria-label="Session statistics">
    <div class="sc-stat" title="Start time">
      <svg class="sc-stat-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <TimeAgo date={session.started_at} short />
    </div>
    <div class="sc-stat" title="Duration">
      <svg class="sc-stat-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M5 3l14 9-14 9V3z"/>
      </svg>
      <span>{duration}</span>
    </div>
    <div class="sc-stat" title="Messages">
      <svg class="sc-stat-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span>{session.message_count}</span>
    </div>
    <div class="sc-stat sc-stat--tokens" title="Total tokens">
      <svg class="sc-stat-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      <span>{formatTokens(totalTokens)}</span>
    </div>
    <div class="sc-cost" title="Cost">
      <span>{formatCost(session.cost_cents)}</span>
    </div>
  </div>
</button>

<style>
  .sc-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
    border-radius: var(--radius-md, 8px);
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    cursor: pointer;
    transition:
      border-color var(--transition-fast, 150ms) ease,
      background var(--transition-fast, 150ms) ease,
      transform var(--transition-fast, 150ms) ease;
    text-align: left;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .sc-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: transparent;
    transition: background var(--transition-fast, 150ms) ease;
  }

  .sc-card--active::before {
    background: #3b82f6;
  }

  .sc-card--failed::before {
    background: #ef4444;
  }

  .sc-card:hover {
    border-color: var(--border-hover);
    background: var(--bg-elevated);
    transform: translateY(-1px);
  }

  .sc-card--selected {
    border-color: rgba(59, 130, 246, 0.45);
    background: rgba(59, 130, 246, 0.06);
  }

  .sc-card--selected::before {
    background: #3b82f6;
  }

  /* Focus ring */
  .sc-card:focus-visible {
    outline: 2px solid rgba(59, 130, 246, 0.6);
    outline-offset: 1px;
  }

  /* Header */
  .sc-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .sc-agent {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }

  .sc-avatar {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #93c5fd;
    line-height: 1;
  }

  .sc-agent-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .sc-agent-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .sc-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sc-status {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }

  .sc-status-label {
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }

  .sc-status-label--active    { color: #60a5fa; }
  .sc-status-label--completed { color: rgba(34, 197, 94, 0.7); }
  .sc-status-label--failed    { color: #f87171; }
  .sc-status-label--cancelled { color: var(--text-tertiary); }

  /* Stats row */
  .sc-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .sc-stat {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: var(--text-tertiary);
    font-family: var(--font-sans);
  }

  .sc-stat-icon {
    flex-shrink: 0;
    color: var(--text-muted, #555);
  }

  .sc-stat--tokens {
    color: var(--text-secondary);
  }

  .sc-cost {
    margin-left: auto;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    font-family: var(--font-mono, ui-monospace, monospace);
  }
</style>
