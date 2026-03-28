<!-- src/lib/components/logs/LogEntry.svelte -->
<!-- Single log line: compact row + expandable detail panel -->
<script lang="ts">
  import type { LogEntryEx, LogLevel } from '$lib/stores/logs.svelte';

  interface Props {
    entry: LogEntryEx;
    lineNumber: number;
    isExpanded?: boolean;
    onToggle?: () => void;
  }

  let { entry, lineNumber, isExpanded = false, onToggle }: Props = $props();

  // Format timestamp: HH:MM:SS.mmm
  function formatTime(iso: string): string {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  }

  // Full ISO date for expanded view
  function formatFullTime(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  function levelClass(level: LogLevel): string {
    switch (level) {
      case 'debug':   return 'le-lvl--debug';
      case 'info':    return 'le-lvl--info';
      case 'warn':
      case 'warning': return 'le-lvl--warn';
      case 'error':   return 'le-lvl--error';
      case 'fatal':   return 'le-lvl--fatal';
      default:        return 'le-lvl--debug';
    }
  }

  function levelLabel(level: LogLevel): string {
    switch (level) {
      case 'debug':   return 'DBG';
      case 'info':    return 'INF';
      case 'warn':
      case 'warning': return 'WRN';
      case 'error':   return 'ERR';
      case 'fatal':   return 'FTL';
      default:        return '---';
    }
  }

  function rowClass(level: LogLevel): string {
    const base = 'le-row';
    switch (level) {
      case 'error': return `${base} le-row--error`;
      case 'fatal': return `${base} le-row--fatal`;
      case 'warn':
      case 'warning': return `${base} le-row--warn`;
      default: return base;
    }
  }

  let metaJson = $derived(() => {
    try {
      return Object.keys(entry.metadata).length > 0
        ? JSON.stringify(entry.metadata, null, 2)
        : null;
    } catch {
      return null;
    }
  });

  function copyEntry() {
    const text = JSON.stringify(entry, null, 2);
    void navigator.clipboard.writeText(text);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle?.();
    }
  }
</script>

<div class="le-wrap" class:le-wrap--expanded={isExpanded}>
  <!-- Compact row -->
  <div
    class={rowClass(entry.level)}
    onclick={onToggle}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-expanded={isExpanded}
    aria-label="Log entry: {entry.level} — {entry.message}"
  >
    <span class="le-lineno" aria-hidden="true">{lineNumber}</span>
    <span class="le-time" aria-label="Timestamp">{formatTime(entry.created_at)}</span>
    <span class={`le-lvl ${levelClass(entry.level)}`} aria-label="Level: {entry.level}">
      {levelLabel(entry.level)}
    </span>
    <span class="le-source" title={entry.source}>{entry.source}</span>
    <span class="le-msg">{entry.message}</span>
    <span class="le-chevron" aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
  </div>

  <!-- Expanded detail -->
  {#if isExpanded}
    <div class="le-detail" role="region" aria-label="Log entry detail">
      <div class="le-detail-row">
        <span class="le-detail-label">Timestamp</span>
        <span class="le-detail-value le-mono">{formatFullTime(entry.created_at)}</span>
      </div>
      <div class="le-detail-row">
        <span class="le-detail-label">Source</span>
        <span class="le-detail-value le-mono">{entry.source}</span>
      </div>
      {#if entry.agent_name}
        <div class="le-detail-row">
          <span class="le-detail-label">Agent</span>
          <span class="le-detail-value">{entry.agent_name}</span>
        </div>
      {/if}
      <div class="le-detail-row le-detail-row--full">
        <span class="le-detail-label">Message</span>
        <pre class="le-detail-pre">{entry.message}</pre>
      </div>
      {#if entry.stack_trace}
        <div class="le-detail-row le-detail-row--full">
          <span class="le-detail-label le-detail-label--error">Stack Trace</span>
          <pre class="le-detail-pre le-detail-pre--error">{entry.stack_trace}</pre>
        </div>
      {/if}
      {#if metaJson()}
        <div class="le-detail-row le-detail-row--full">
          <span class="le-detail-label">Metadata</span>
          <pre class="le-detail-pre le-detail-pre--meta">{metaJson()}</pre>
        </div>
      {/if}
      <div class="le-detail-actions">
        <button
          class="le-copy-btn"
          onclick={copyEntry}
          aria-label="Copy full log entry as JSON"
        >
          Copy JSON
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ── Wrapper ─────────────────────────────────────────────────────── */
  .le-wrap {
    border-bottom: 1px solid transparent;
  }

  .le-wrap--expanded {
    border-bottom: 1px solid var(--border-default);
    background: rgba(255, 255, 255, 0.02);
  }

  /* ── Compact row ─────────────────────────────────────────────────── */
  .le-row {
    display: grid;
    grid-template-columns: 48px 80px 36px 120px 1fr 16px;
    align-items: center;
    gap: 8px;
    padding: 3px 12px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 20px;
    color: var(--text-secondary);
    transition: background 80ms ease;
    outline: none;
  }

  .le-row:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .le-row:focus-visible {
    outline: 1px solid var(--accent-primary);
    outline-offset: -1px;
  }

  /* Level-tinted row backgrounds */
  .le-row--warn {
    background: rgba(234, 179, 8, 0.03);
  }

  .le-row--warn:hover {
    background: rgba(234, 179, 8, 0.06);
  }

  .le-row--error {
    background: rgba(239, 68, 68, 0.04);
  }

  .le-row--error:hover {
    background: rgba(239, 68, 68, 0.07);
  }

  .le-row--fatal {
    background: rgba(239, 68, 68, 0.08);
  }

  .le-row--fatal:hover {
    background: rgba(239, 68, 68, 0.12);
  }

  /* ── Row cells ───────────────────────────────────────────────────── */
  .le-lineno {
    color: var(--text-muted);
    text-align: right;
    font-size: 11px;
    user-select: none;
    flex-shrink: 0;
  }

  .le-time {
    color: var(--text-tertiary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Level badge */
  .le-lvl {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 16px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3px;
    flex-shrink: 0;
  }

  .le-lvl--debug {
    background: rgba(156, 163, 175, 0.12);
    color: #9ca3af;
    border: 1px solid rgba(156, 163, 175, 0.2);
  }

  .le-lvl--info {
    background: rgba(59, 130, 246, 0.12);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.25);
  }

  .le-lvl--warn {
    background: rgba(234, 179, 8, 0.12);
    color: #fde047;
    border: 1px solid rgba(234, 179, 8, 0.25);
  }

  .le-lvl--error {
    background: rgba(239, 68, 68, 0.12);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .le-lvl--fatal {
    background: rgba(239, 68, 68, 0.2);
    color: #ff6b6b;
    border: 1px solid rgba(239, 68, 68, 0.4);
    font-weight: 900;
  }

  .le-source {
    color: var(--text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px;
  }

  .le-msg {
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
  }

  .le-chevron {
    color: var(--text-muted);
    font-size: 10px;
    user-select: none;
  }

  /* ── Expanded detail ─────────────────────────────────────────────── */
  .le-detail {
    padding: 10px 12px 10px 68px;
    border-top: 1px solid var(--border-default);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .le-detail-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    font-size: 12px;
  }

  .le-detail-row--full {
    flex-direction: column;
    gap: 4px;
  }

  .le-detail-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--text-tertiary);
    min-width: 80px;
    flex-shrink: 0;
  }

  .le-detail-label--error {
    color: #fca5a5;
  }

  .le-detail-value {
    color: var(--text-secondary);
  }

  .le-mono {
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .le-detail-pre {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--text-secondary);
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    padding: 8px 10px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 240px;
    overflow-y: auto;
  }

  .le-detail-pre--error {
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.2);
  }

  .le-detail-pre--meta {
    color: #93c5fd;
  }

  .le-detail-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 4px;
  }

  .le-copy-btn {
    height: 24px;
    padding: 0 10px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-tertiary);
    font-size: 11px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 100ms ease;
  }

  .le-copy-btn:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-secondary);
  }
</style>
