<!-- src/lib/components/sessions/SessionContinuity.svelte -->
<!-- Session continuity panel: context summary, handoff notes, and chain timeline -->
<script lang="ts">
  import type { Session, SessionChain } from '$api/types';

  interface Props {
    session: Session;
    chain: SessionChain | null;
    chainLoading: boolean;
    onCompact: () => void;
    onLoadChain: () => void;
  }

  let { session, chain, chainLoading, onCompact, onLoadChain }: Props = $props();

  let expanded = $state(false);

  function toggle() {
    expanded = !expanded;
    if (expanded && !chain && !chainLoading) {
      onLoadChain();
    }
  }

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }

  function formatCost(cents: number): string {
    if (cents === 0) return '$0.00';
    if (cents < 100) return `$0.${String(cents).padStart(2, '0')}`;
    return `$${(cents / 100).toFixed(2)}`;
  }

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const statusColor: Record<string, string> = {
    active: '#10b981',
    completed: '#6366f1',
    failed: '#ef4444',
    cancelled: '#94a3b8',
  };
</script>

<div class="sc-root">
  <!-- Collapsible header -->
  <button
    class="sc-toggle"
    onclick={toggle}
    aria-expanded={expanded}
    aria-controls="sc-panel"
  >
    <span class="sc-toggle-icon" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        {#if expanded}
          <polyline points="18 15 12 9 6 15"/>
        {:else}
          <polyline points="6 9 12 15 18 9"/>
        {/if}
      </svg>
    </span>
    <span class="sc-toggle-label">Continuity</span>
    {#if chain}
      <span class="sc-badge">{chain.sessions.length} sessions</span>
    {/if}
    <span class="sc-actions" onclick={(e) => e.stopPropagation()} role="presentation">
      {#if session.status === 'active'}
        <button
          class="sc-compact-btn"
          onclick={onCompact}
          aria-label="Compact this session — save a context summary"
          title="Save context summary and start a new chained session"
        >
          Compact
        </button>
      {/if}
    </span>
  </button>

  {#if expanded}
    <div class="sc-panel" id="sc-panel" role="region" aria-label="Session continuity">
      {#if chainLoading}
        <div class="sc-loading" aria-busy="true" aria-label="Loading session chain">
          <span class="sc-spinner" aria-hidden="true"></span>
          <span>Loading chain…</span>
        </div>
      {:else if !chain}
        <p class="sc-empty">No chain data available.</p>
      {:else}
        <!-- Totals bar -->
        <div class="sc-totals">
          <span class="sc-total-item">
            <span class="sc-total-label">Total tokens</span>
            <span class="sc-total-value">{formatTokens(chain.total_tokens)}</span>
          </span>
          <span class="sc-sep" aria-hidden="true">·</span>
          <span class="sc-total-item">
            <span class="sc-total-label">Total cost</span>
            <span class="sc-total-value">{formatCost(chain.total_cost_cents)}</span>
          </span>
          <span class="sc-sep" aria-hidden="true">·</span>
          <span class="sc-total-item">
            <span class="sc-total-label">Sessions</span>
            <span class="sc-total-value">{chain.sessions.length}</span>
          </span>
        </div>

        <!-- Chain timeline -->
        <ol class="sc-timeline" aria-label="Session chain timeline">
          {#each chain.sessions as entry, i (entry.id)}
            <li class="sc-entry">
              <!-- Connector line -->
              <div class="sc-connector" aria-hidden="true">
                <div
                  class="sc-node"
                  style="background: {statusColor[entry.status] ?? '#94a3b8'}"
                  title="Status: {entry.status}"
                ></div>
                {#if i < chain.sessions.length - 1}
                  <div class="sc-line"></div>
                {/if}
              </div>

              <!-- Entry content -->
              <div class="sc-entry-body">
                <div class="sc-entry-header">
                  <span class="sc-seq">#{entry.sequence_number}</span>
                  <span
                    class="sc-status-badge"
                    style="color: {statusColor[entry.status] ?? '#94a3b8'}"
                  >
                    {entry.status}
                  </span>
                  <span class="sc-tokens">{formatTokens(entry.total_tokens)} tokens</span>
                  <span class="sc-time">{relativeTime(entry.started_at)}</span>
                </div>

                {#if entry.context_summary}
                  <div class="sc-field">
                    <span class="sc-field-label">Summary</span>
                    <p class="sc-field-text">{entry.context_summary}</p>
                  </div>
                {/if}

                {#if entry.handoff_notes}
                  <div class="sc-field">
                    <span class="sc-field-label">Handoff notes</span>
                    <p class="sc-field-text sc-field-text--notes">{entry.handoff_notes}</p>
                  </div>
                {/if}

                {#if entry.compaction_reason}
                  <div class="sc-compaction-reason" aria-label="Compaction reason: {entry.compaction_reason}">
                    <span class="sc-compaction-icon" aria-hidden="true">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="7 13 12 8 17 13"/><polyline points="7 19 12 14 17 19"/>
                      </svg>
                    </span>
                    Compacted: {entry.compaction_reason.replace(/_/g, ' ')}
                  </div>
                {/if}

                {#if entry.status === 'active' && !entry.context_summary}
                  <p class="sc-active-hint">Current session — no summary yet.</p>
                {/if}
              </div>
            </li>
          {/each}
        </ol>
      {/if}
    </div>
  {/if}
</div>

<style>
  .sc-root {
    border-top: 1px solid var(--border-subtle, var(--border-default));
  }

  /* Toggle button */
  .sc-toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 8px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    text-align: left;
    color: var(--text-secondary);
    transition: background var(--transition-fast, 150ms) ease;
  }

  .sc-toggle:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.03));
  }

  .sc-toggle:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.5);
    outline-offset: -2px;
  }

  .sc-toggle-icon {
    display: flex;
    align-items: center;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .sc-toggle-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }

  .sc-badge {
    display: inline-flex;
    align-items: center;
    height: 18px;
    padding: 0 6px;
    border-radius: 9px;
    background: var(--bg-muted, rgba(99, 102, 241, 0.12));
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 500;
  }

  .sc-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .sc-compact-btn {
    height: 24px;
    padding: 0 10px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-secondary);
    font-size: 11.5px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    transition:
      background var(--transition-fast, 150ms) ease,
      border-color var(--transition-fast, 150ms) ease;
  }

  .sc-compact-btn:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .sc-compact-btn:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.5);
    outline-offset: 1px;
  }

  /* Panel */
  .sc-panel {
    padding: 12px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sc-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-tertiary);
    font-size: 13px;
  }

  .sc-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid var(--border-default);
    border-top-color: var(--text-secondary);
    border-radius: 50%;
    animation: sc-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes sc-spin {
    to { transform: rotate(360deg); }
  }

  .sc-empty {
    margin: 0;
    font-size: 13px;
    color: var(--text-tertiary);
  }

  /* Totals */
  .sc-totals {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: var(--radius-sm, 6px);
    background: var(--bg-muted, var(--bg-base));
    border: 1px solid var(--border-subtle, var(--border-default));
  }

  .sc-total-item {
    display: flex;
    gap: 4px;
    align-items: baseline;
  }

  .sc-total-label {
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .sc-total-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .sc-sep {
    color: var(--border-default);
    font-size: 12px;
  }

  /* Timeline */
  .sc-timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .sc-entry {
    display: flex;
    gap: 10px;
  }

  /* Connector */
  .sc-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .sc-node {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .sc-line {
    width: 2px;
    flex: 1;
    min-height: 12px;
    background: var(--border-default);
    margin: 3px 0;
  }

  /* Entry body */
  .sc-entry-body {
    flex: 1;
    padding-bottom: 14px;
    min-width: 0;
  }

  .sc-entry-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .sc-seq {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .sc-status-badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: capitalize;
  }

  .sc-tokens {
    font-size: 11px;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .sc-time {
    font-size: 11px;
    color: var(--text-quaternary, var(--text-tertiary));
    margin-left: auto;
  }

  /* Fields */
  .sc-field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-bottom: 6px;
  }

  .sc-field-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }

  .sc-field-text {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--text-secondary);
  }

  .sc-field-text--notes {
    color: var(--text-tertiary);
    font-style: italic;
  }

  /* Compaction reason */
  .sc-compaction-reason {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-tertiary);
    margin-top: 4px;
  }

  .sc-compaction-icon {
    display: flex;
    align-items: center;
    opacity: 0.7;
  }

  .sc-active-hint {
    margin: 0;
    font-size: 12px;
    color: var(--text-quaternary, var(--text-tertiary));
    font-style: italic;
  }
</style>
