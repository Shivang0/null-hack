<!-- src/lib/components/chat/ToolCall.svelte -->
<!-- Expandable tool call card showing name, input JSON, and optional result -->
<script lang="ts">
  import type { ToolCallRef } from '$lib/api/types';

  interface Props {
    tool: ToolCallRef;
    result?: string;
    isError?: boolean;
    isPending?: boolean;
  }

  let { tool, result, isError = false, isPending = false }: Props = $props();

  let expanded = $state(false);

  const inputJson = $derived.by(() => {
    try {
      return JSON.stringify(tool.input, null, 2);
    } catch {
      return String(tool.input);
    }
  });

  const statusLabel = $derived(
    isPending ? 'running' : isError ? 'error' : result !== undefined ? 'done' : 'queued'
  );
</script>

<div class="tc-wrap tc-wrap--{statusLabel}">
  <button
    class="tc-header"
    onclick={() => (expanded = !expanded)}
    aria-expanded={expanded}
    aria-label="{expanded ? 'Collapse' : 'Expand'} tool call: {tool.name}"
  >
    <!-- Tool icon -->
    <svg class="tc-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
    <span class="tc-name">{tool.name}</span>
    <span class="tc-status tc-status--{statusLabel}" aria-label="Status: {statusLabel}">
      {#if isPending}
        <span class="tc-spinner" aria-hidden="true"></span>
      {:else if statusLabel === 'done'}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      {:else if statusLabel === 'error'}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      {/if}
    </span>
    <svg
      class="tc-chevron"
      class:tc-chevron--open={expanded}
      width="12" height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>

  {#if expanded}
    <div class="tc-body">
      <div class="tc-section">
        <p class="tc-section-label">Input</p>
        <pre class="tc-json">{inputJson}</pre>
      </div>
      {#if result !== undefined}
        <div class="tc-section tc-section--result" class:tc-section--error={isError}>
          <p class="tc-section-label">{isError ? 'Error' : 'Result'}</p>
          <pre class="tc-json tc-json--result">{result}</pre>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tc-wrap {
    border-radius: var(--radius-sm);
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    overflow: hidden;
    margin: 4px 0;
    font-size: 12px;
  }

  .tc-wrap--running {
    border-color: rgba(245, 158, 11, 0.3);
  }

  .tc-wrap--error {
    border-color: rgba(239, 68, 68, 0.3);
  }

  .tc-wrap--done {
    border-color: rgba(34, 197, 94, 0.2);
  }

  .tc-header {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 7px 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .tc-header:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .tc-icon {
    flex-shrink: 0;
    color: var(--text-tertiary);
  }

  .tc-name {
    flex: 1;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tc-status {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .tc-status--done { color: rgba(34, 197, 94, 0.7); }
  .tc-status--error { color: #fca5a5; }
  .tc-status--running { color: #fde047; }

  .tc-spinner {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1.5px solid rgba(245, 158, 11, 0.3);
    border-top-color: #fde047;
    animation: tc-spin 0.7s linear infinite;
  }

  @keyframes tc-spin { to { transform: rotate(360deg); } }

  .tc-chevron {
    flex-shrink: 0;
    color: var(--text-tertiary);
    transition: transform 0.2s ease;
  }

  .tc-chevron--open {
    transform: rotate(180deg);
  }

  .tc-body {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tc-section-label {
    margin: 0 0 4px;
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
  }

  .tc-json {
    margin: 0;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--text-secondary);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 240px;
    overflow-y: auto;
  }

  .tc-json--result {
    color: var(--text-primary);
  }

  .tc-section--error .tc-json--result {
    color: #fca5a5;
  }

  @media (prefers-reduced-motion: reduce) {
    .tc-spinner { animation: none; opacity: 0.7; }
  }
</style>
