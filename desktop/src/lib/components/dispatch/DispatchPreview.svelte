<!-- src/lib/components/dispatch/DispatchPreview.svelte -->
<!-- Self-contained dispatch preview: describe a task to see which adapter would be selected -->
<script lang="ts">
  import { dispatch as dispatchApi } from '$api/client';
  import type { DispatchPreview as DispatchPreviewType } from '$api/types';

  let description = $state('');
  let loading = $state(false);
  let result = $state<DispatchPreviewType | null>(null);
  let error = $state<string | null>(null);

  // Map adapter IDs to display labels
  const ADAPTER_LABELS: Record<string, string> = {
    osa: 'OSA',
    claude_code: 'Claude Code',
    'claude-code': 'Claude Code',
    codex: 'Codex',
    hermes: 'Hermes',
    bash: 'Bash',
    http: 'HTTP',
    cursor: 'Cursor',
    gemini: 'Gemini',
    openclaw: 'OpenClaw',
    jidoclaw: 'JidoClaw',
    custom: 'Custom',
  };

  const ADAPTER_COLORS: Record<string, string> = {
    osa: '#6366f1',
    claude_code: '#f59e0b',
    'claude-code': '#f59e0b',
    codex: '#10b981',
    hermes: '#3b82f6',
    bash: '#8b5cf6',
    http: '#64748b',
    cursor: '#0ea5e9',
    gemini: '#ec4899',
  };

  function adapterLabel(id: string): string {
    return ADAPTER_LABELS[id] ?? id;
  }

  function adapterColor(id: string): string {
    return ADAPTER_COLORS[id] ?? 'var(--text-tertiary)';
  }

  function confidencePct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function confidenceClass(value: number): string {
    if (value >= 0.85) return 'dp-conf-high';
    if (value >= 0.65) return 'dp-conf-mid';
    return 'dp-conf-low';
  }

  async function handlePreview() {
    const q = description.trim();
    if (!q) return;
    loading = true;
    error = null;
    result = null;
    try {
      result = await dispatchApi.preview(q);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      void handlePreview();
    }
  }
</script>

<div class="dp-root">
  <div class="dp-header">
    <span class="dp-title">Dispatch Preview</span>
    <span class="dp-hint">See which adapter would handle a task</span>
  </div>

  <div class="dp-input-row">
    <input
      class="dp-input"
      type="text"
      placeholder="Describe a task, e.g. 'refactor the auth module'…"
      bind:value={description}
      onkeydown={handleKeydown}
      aria-label="Task description for dispatch preview"
      disabled={loading}
    />
    <button
      class="dp-btn"
      onclick={handlePreview}
      disabled={loading || !description.trim()}
      aria-label="Preview dispatch routing"
    >
      {#if loading}
        <span class="dp-spinner" aria-hidden="true"></span>
        Analyzing…
      {:else}
        Preview
      {/if}
    </button>
  </div>

  {#if error}
    <p class="dp-error" role="alert">{error}</p>
  {/if}

  {#if result}
    <div class="dp-result" aria-live="polite">
      <!-- Primary recommendation -->
      <div class="dp-rec">
        <div class="dp-rec-top">
          <span
            class="dp-adapter-badge"
            style="background: {adapterColor(result.recommended_adapter)}22; color: {adapterColor(result.recommended_adapter)}; border-color: {adapterColor(result.recommended_adapter)}44"
          >
            {adapterLabel(result.recommended_adapter)}
          </span>
          <div class="dp-conf-wrap" aria-label="Confidence {confidencePct(result.confidence)}">
            <div class="dp-conf-bar">
              <div
                class="dp-conf-fill {confidenceClass(result.confidence)}"
                style="width: {confidencePct(result.confidence)}"
              ></div>
            </div>
            <span class="dp-conf-label">{confidencePct(result.confidence)}</span>
          </div>
        </div>
        <p class="dp-reason">{result.reason}</p>
      </div>

      <!-- Alternatives -->
      {#if result.alternatives.length > 0}
        <div class="dp-alts">
          <span class="dp-alts-label">Alternatives</span>
          <ul class="dp-alts-list" aria-label="Alternative adapters">
            {#each result.alternatives as alt (alt.adapter)}
              <li class="dp-alt-item">
                <span
                  class="dp-adapter-badge dp-adapter-badge--sm"
                  style="background: {adapterColor(alt.adapter)}18; color: {adapterColor(alt.adapter)}; border-color: {adapterColor(alt.adapter)}33"
                >
                  {adapterLabel(alt.adapter)}
                </span>
                <span class="dp-alt-reason">{alt.reason}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dp-root {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dp-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dp-title {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }

  .dp-hint {
    font-size: 12px;
    color: var(--text-quaternary, var(--text-tertiary));
  }

  .dp-input-row {
    display: flex;
    gap: 8px;
  }

  .dp-input {
    flex: 1;
    height: 34px;
    padding: 0 10px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--border-default);
    background: var(--bg-input, var(--bg-elevated));
    color: var(--text-primary);
    font-size: 13px;
    font-family: var(--font-sans);
    outline: none;
    transition: border-color var(--transition-fast, 150ms) ease;
  }

  .dp-input::placeholder {
    color: var(--text-quaternary, var(--text-tertiary));
  }

  .dp-input:focus {
    border-color: var(--border-focus, rgba(99, 102, 241, 0.6));
  }

  .dp-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .dp-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid var(--border-default);
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    white-space: nowrap;
    transition:
      background var(--transition-fast, 150ms) ease,
      border-color var(--transition-fast, 150ms) ease;
  }

  .dp-btn:hover:not(:disabled) {
    background: var(--bg-hover, var(--bg-elevated));
    border-color: var(--border-hover);
  }

  .dp-btn:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.5);
    outline-offset: 1px;
  }

  .dp-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* Spinner */
  .dp-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-default);
    border-top-color: var(--text-secondary);
    border-radius: 50%;
    animation: dp-spin 0.6s linear infinite;
    flex-shrink: 0;
  }

  @keyframes dp-spin {
    to { transform: rotate(360deg); }
  }

  /* Error */
  .dp-error {
    margin: 0;
    padding: 8px 10px;
    border-radius: var(--radius-sm, 6px);
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    font-size: 12.5px;
  }

  /* Result panel */
  .dp-result {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-radius: var(--radius-md, 8px);
    border: 1px solid var(--border-default);
    background: var(--bg-elevated);
  }

  /* Primary recommendation */
  .dp-rec {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dp-rec-top {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dp-adapter-badge {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border-radius: 11px;
    border: 1px solid;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .dp-adapter-badge--sm {
    height: 20px;
    font-size: 11px;
    flex-shrink: 0;
  }

  /* Confidence bar */
  .dp-conf-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }

  .dp-conf-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: var(--bg-muted, var(--bg-base));
    overflow: hidden;
  }

  .dp-conf-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .dp-conf-high { background: #10b981; }
  .dp-conf-mid  { background: #f59e0b; }
  .dp-conf-low  { background: #ef4444; }

  .dp-conf-label {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 32px;
    text-align: right;
  }

  .dp-reason {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  /* Alternatives */
  .dp-alts {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--border-subtle, var(--border-default));
  }

  .dp-alts-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }

  .dp-alts-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dp-alt-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .dp-alt-reason {
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1.45;
    padding-top: 2px;
  }
</style>
