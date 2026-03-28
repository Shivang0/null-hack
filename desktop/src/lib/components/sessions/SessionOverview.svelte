<!-- src/lib/components/sessions/SessionOverview.svelte -->
<!-- Session detail header: agent info, model, timing, token breakdown, cost, actions -->
<script lang="ts">
  import type { Session } from '$lib/api/types';
  import StatusDot from '$lib/components/shared/StatusDot.svelte';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';

  interface Props {
    session: Session;
    onReplay?: (session: Session) => void;
    onExport?: (session: Session) => void;
  }

  let { session, onReplay, onExport }: Props = $props();

  // Dot status mapping
  const dotStatus = $derived.by((): 'online' | 'idle' | 'error' | 'offline' | 'busy' => {
    switch (session.status) {
      case 'active':    return 'busy';
      case 'completed': return 'online';
      case 'failed':    return 'error';
      default:          return 'offline';
    }
  });

  // Duration
  const duration = $derived.by(() => {
    const start = new Date(session.started_at).getTime();
    const end = session.completed_at
      ? new Date(session.completed_at).getTime()
      : Date.now();
    const ms = end - start;
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ${secs % 60}s`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  });

  // Token totals
  const totalTokens = $derived(
    session.token_usage.input + session.token_usage.output
  );
  const inputPct = $derived(totalTokens > 0 ? (session.token_usage.input / totalTokens) * 100 : 0);
  const outputPct = $derived(totalTokens > 0 ? (session.token_usage.output / totalTokens) * 100 : 0);
  const cachePct = $derived(totalTokens > 0 ? (session.token_usage.cache_read / totalTokens) * 100 : 0);
  const cacheHitRate = $derived.by(() => {
    const reads = session.token_usage.cache_read;
    const total = session.token_usage.input;
    if (total === 0) return 0;
    return Math.round((reads / total) * 100);
  });

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }

  function formatCost(cents: number): string {
    if (cents === 0) return '$0.00';
    if (cents < 1) return '<$0.01';
    return `$${(cents / 100).toFixed(4)}`;
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const statusLabel = $derived.by(() => {
    switch (session.status) {
      case 'active':    return 'Active';
      case 'completed': return 'Completed';
      case 'failed':    return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return session.status;
    }
  });
</script>

<div class="so-root">
  <!-- Title row -->
  <div class="so-title-row">
    <div class="so-title-group">
      <div class="so-avatar" aria-hidden="true">
        {session.agent_name.charAt(0).toUpperCase()}
      </div>
      <div class="so-title-text">
        <h2 class="so-title">{session.title ?? session.id}</h2>
        <div class="so-meta">
          <span class="so-agent">{session.agent_name}</span>
          <span class="so-sep" aria-hidden="true">·</span>
          <span class="so-id" title="Session ID">{session.id}</span>
        </div>
      </div>
    </div>
    <div class="so-status-badge so-status-badge--{session.status}" aria-label="Status: {statusLabel}">
      <StatusDot status={dotStatus} pulse={session.status === 'active'} size="sm" />
      <span>{statusLabel}</span>
    </div>
  </div>

  <!-- Metric grid -->
  <div class="so-metrics" role="list" aria-label="Session metrics">
    <!-- Timing -->
    <div class="so-metric" role="listitem">
      <span class="so-metric-label">Started</span>
      <span class="so-metric-value">
        <time datetime={session.started_at}>{formatTime(session.started_at)}</time>
      </span>
      <span class="so-metric-sub"><TimeAgo date={session.started_at} /></span>
    </div>

    {#if session.completed_at}
      <div class="so-metric" role="listitem">
        <span class="so-metric-label">Completed</span>
        <span class="so-metric-value">
          <time datetime={session.completed_at}>{formatTime(session.completed_at)}</time>
        </span>
        <span class="so-metric-sub"><TimeAgo date={session.completed_at} /></span>
      </div>
    {/if}

    <div class="so-metric" role="listitem">
      <span class="so-metric-label">Duration</span>
      <span class="so-metric-value">{duration}</span>
      <span class="so-metric-sub">{session.message_count} messages</span>
    </div>

    <!-- Token breakdown -->
    <div class="so-metric so-metric--tokens" role="listitem">
      <span class="so-metric-label">Tokens</span>
      <span class="so-metric-value so-metric-value--accent">{formatTokens(totalTokens)}</span>
      <div class="so-token-breakdown" aria-label="Token breakdown">
        <span class="so-token-row">
          <span class="so-token-dot so-token-dot--input" aria-hidden="true"></span>
          <span class="so-token-key">In</span>
          <span class="so-token-val">{formatTokens(session.token_usage.input)}</span>
        </span>
        <span class="so-token-row">
          <span class="so-token-dot so-token-dot--output" aria-hidden="true"></span>
          <span class="so-token-key">Out</span>
          <span class="so-token-val">{formatTokens(session.token_usage.output)}</span>
        </span>
        <span class="so-token-row">
          <span class="so-token-dot so-token-dot--cache" aria-hidden="true"></span>
          <span class="so-token-key">Cache</span>
          <span class="so-token-val">{formatTokens(session.token_usage.cache_read)} ({cacheHitRate}%)</span>
        </span>
      </div>
    </div>

    <!-- Cost -->
    <div class="so-metric" role="listitem">
      <span class="so-metric-label">Cost</span>
      <span class="so-metric-value so-metric-value--cost">{formatCost(session.cost_cents)}</span>
      {#if session.token_usage.cache_read > 0 && session.token_usage.input > 0}
        <span class="so-metric-sub so-metric-sub--saving">
          ~{formatCost(Math.round(session.cost_cents * (session.token_usage.cache_read / session.token_usage.input) * 0.9))} saved via cache
        </span>
      {/if}
    </div>
  </div>

  <!-- Token bar -->
  <div class="so-token-bar-wrap" aria-label="Token distribution">
    <div
      class="so-token-bar"
      role="img"
      aria-label="Input {inputPct.toFixed(0)}%, output {outputPct.toFixed(0)}%, cache {cachePct.toFixed(0)}%"
    >
      <div
        class="so-token-seg so-token-seg--input"
        style="width: {inputPct}%"
        title="Input: {formatTokens(session.token_usage.input)}"
      ></div>
      <div
        class="so-token-seg so-token-seg--output"
        style="width: {outputPct}%"
        title="Output: {formatTokens(session.token_usage.output)}"
      ></div>
      <div
        class="so-token-seg so-token-seg--cache"
        style="width: {cachePct}%"
        title="Cache read: {formatTokens(session.token_usage.cache_read)}"
      ></div>
    </div>
    <div class="so-token-bar-legend" aria-hidden="true">
      <span><span class="so-legend-dot so-legend-dot--input"></span>Input</span>
      <span><span class="so-legend-dot so-legend-dot--output"></span>Output</span>
      <span><span class="so-legend-dot so-legend-dot--cache"></span>Cache</span>
    </div>
  </div>

  <!-- Actions -->
  {#if onReplay || onExport}
    <div class="so-actions">
      {#if onReplay}
        <button
          class="so-btn so-btn--secondary"
          onclick={() => onReplay?.(session)}
          aria-label="Replay session"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
          </svg>
          Replay
        </button>
      {/if}
      {#if onExport}
        <button
          class="so-btn so-btn--secondary"
          onclick={() => onExport?.(session)}
          aria-label="Export session transcript"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .so-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 24px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-default);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    flex-shrink: 0;
  }

  /* Title row */
  .so-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .so-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  .so-avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #93c5fd;
  }

  .so-title-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .so-title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .so-meta {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .so-agent {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .so-sep {
    color: var(--text-muted, #555);
    font-size: 12px;
  }

  .so-id {
    font-size: 11px;
    font-family: var(--font-mono, ui-monospace, monospace);
    color: var(--text-muted, #555);
  }

  /* Status badge */
  .so-status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: var(--radius-md, 8px);
    font-size: 12px;
    font-weight: 600;
    border: 1px solid transparent;
    flex-shrink: 0;
  }

  .so-status-badge--active    {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.25);
    color: #60a5fa;
  }
  .so-status-badge--completed {
    background: rgba(34, 197, 94, 0.08);
    border-color: rgba(34, 197, 94, 0.15);
    color: rgba(34, 197, 94, 0.7);
  }
  .so-status-badge--failed {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  .so-status-badge--cancelled {
    background: var(--bg-elevated);
    border-color: var(--border-default);
    color: var(--text-tertiary);
  }

  /* Metrics grid */
  .so-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .so-metric {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 100px;
  }

  .so-metric--tokens {
    min-width: 160px;
  }

  .so-metric-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted, #555);
  }

  .so-metric-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
    font-family: var(--font-sans);
  }

  .so-metric-value--accent {
    color: #93c5fd;
  }

  .so-metric-value--cost {
    color: rgba(34, 197, 94, 0.7);
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .so-metric-sub {
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .so-metric-sub--saving {
    color: rgba(34, 197, 94, 0.65);
  }

  /* Token breakdown */
  .so-token-breakdown {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
  }

  .so-token-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
  }

  .so-token-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .so-token-dot--input  { background: #60a5fa; }
  .so-token-dot--output { background: #a78bfa; }
  .so-token-dot--cache  { background: rgba(34, 197, 94, 0.6); }

  .so-token-key {
    color: var(--text-tertiary);
    width: 32px;
  }

  .so-token-val {
    color: var(--text-secondary);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 10.5px;
  }

  /* Token bar */
  .so-token-bar-wrap {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .so-token-bar {
    display: flex;
    height: 4px;
    border-radius: 2px;
    overflow: hidden;
    background: var(--bg-elevated);
  }

  .so-token-seg--input  { background: #60a5fa; }
  .so-token-seg--output { background: #a78bfa; }
  .so-token-seg--cache  { background: rgba(34, 197, 94, 0.6); }

  .so-token-bar-legend {
    display: flex;
    gap: 12px;
  }

  .so-token-bar-legend span {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: var(--text-muted, #555);
  }

  .so-legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .so-legend-dot--input  { background: #60a5fa; }
  .so-legend-dot--output { background: #a78bfa; }
  .so-legend-dot--cache  { background: rgba(34, 197, 94, 0.6); }

  /* Actions */
  .so-actions {
    display: flex;
    gap: 8px;
  }

  .so-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-sm, 6px);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--transition-fast, 150ms) ease,
      border-color var(--transition-fast, 150ms) ease;
    font-family: var(--font-sans);
  }

  .so-btn--secondary {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
  }

  .so-btn--secondary:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .so-btn:focus-visible {
    outline: 2px solid rgba(59, 130, 246, 0.5);
    outline-offset: 1px;
  }
</style>
