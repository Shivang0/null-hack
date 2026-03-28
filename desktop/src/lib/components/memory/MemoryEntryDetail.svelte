<!-- src/lib/components/memory/MemoryEntryDetail.svelte -->
<script lang="ts">
  import type { MemoryEntry } from '$api/types';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';

  interface Props {
    entry: MemoryEntry;
    onUpdate: (id: string, patch: { key?: string; value?: string; value_type?: 'string' | 'json' }) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
  }

  let { entry, onUpdate, onDelete }: Props = $props();

  let isEditing = $state(false);
  let confirmDelete = $state(false);
  let saving = $state(false);
  let deleting = $state(false);

  let editKey = $state('');
  let editValue = $state('');
  let editType = $state<'string' | 'json'>('string');

  // Sync fields when entry changes (e.g. namespace switch)
  $effect(() => {
    editKey = entry.key;
    editValue = entry.value;
    editType = entry.value_type;
    isEditing = false;
    confirmDelete = false;
  });

  function startEdit() {
    editKey = entry.key;
    editValue = entry.value;
    editType = entry.value_type;
    isEditing = true;
  }

  function cancelEdit() {
    isEditing = false;
    confirmDelete = false;
  }

  async function saveEdit() {
    saving = true;
    try {
      await onUpdate(entry.id, {
        key: editKey,
        value: editValue,
        value_type: editType,
      });
      isEditing = false;
    } finally {
      saving = false;
    }
  }

  async function confirmAndDelete() {
    if (!confirmDelete) {
      confirmDelete = true;
      return;
    }
    deleting = true;
    try {
      await onDelete(entry.id);
    } finally {
      deleting = false;
      confirmDelete = false;
    }
  }

  function cancelDelete() {
    confirmDelete = false;
  }

  function formatJson(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  function isValidJson(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  let jsonParseError = $derived(
    editType === 'json' && editValue.trim() !== '' && !isValidJson(editValue),
  );

  const NS_COLORS: Record<string, string> = {
    agent_context: 'med-ns--blue',
    knowledge_graph: 'med-ns--purple',
    session_memory: 'med-ns--teal',
  };

  function nsClass(ns: string): string {
    return NS_COLORS[ns] ?? 'med-ns--default';
  }

  function formatAccessCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }
</script>

<article class="med-panel" aria-label="Memory entry detail">
  <!-- Header -->
  <header class="med-header">
    <div class="med-header-top">
      <h2 class="med-key" title={entry.key}>{entry.key}</h2>
      <div class="med-header-actions">
        {#if !isEditing}
          <button
            class="med-btn med-btn--ghost"
            onclick={startEdit}
            aria-label="Edit entry"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>

          {#if confirmDelete}
            <button
              class="med-btn med-btn--ghost"
              onclick={cancelDelete}
              aria-label="Cancel delete"
            >
              Cancel
            </button>
            <button
              class="med-btn med-btn--danger"
              onclick={confirmAndDelete}
              disabled={deleting}
              aria-label="Confirm delete entry"
            >
              {deleting ? 'Deleting…' : 'Confirm delete'}
            </button>
          {:else}
            <button
              class="med-btn med-btn--ghost med-btn--danger-ghost"
              onclick={confirmAndDelete}
              aria-label="Delete entry"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
              Delete
            </button>
          {/if}
        {:else}
          <button
            class="med-btn med-btn--ghost"
            onclick={cancelEdit}
            aria-label="Cancel edit"
          >
            Cancel
          </button>
          <button
            class="med-btn med-btn--primary"
            onclick={saveEdit}
            disabled={saving || jsonParseError}
            aria-label="Save entry"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        {/if}
      </div>
    </div>

    <div class="med-meta-row">
      <span class="med-ns-badge {nsClass(entry.namespace)}">{entry.namespace}</span>
      {#if entry.value_type === 'json'}
        <span class="med-type-badge">JSON</span>
      {:else}
        <span class="med-type-badge med-type-badge--string">string</span>
      {/if}
    </div>
  </header>

  <div class="med-body">
    <!-- Key edit -->
    {#if isEditing}
      <div class="med-field">
        <label class="med-label" for="med-edit-key">Key</label>
        <input
          id="med-edit-key"
          class="med-input"
          type="text"
          bind:value={editKey}
          placeholder="namespace.key.path"
          spellcheck="false"
          autocomplete="off"
        />
      </div>
    {/if}

    <!-- Value -->
    <div class="med-field">
      {#if isEditing}
        <div class="med-field-header">
          <label class="med-label" for="med-edit-value">Value</label>
          <div class="med-type-toggle" role="group" aria-label="Value type">
            <button
              class="med-type-btn"
              class:med-type-btn--active={editType === 'string'}
              onclick={() => (editType = 'string')}
              type="button"
            >
              string
            </button>
            <button
              class="med-type-btn"
              class:med-type-btn--active={editType === 'json'}
              onclick={() => (editType = 'json')}
              type="button"
            >
              JSON
            </button>
          </div>
        </div>
        <textarea
          id="med-edit-value"
          class="med-textarea"
          class:med-textarea--error={jsonParseError}
          bind:value={editValue}
          rows="10"
          placeholder={editType === 'json' ? '{ "key": "value" }' : 'Enter value…'}
          spellcheck="false"
          autocomplete="off"
        ></textarea>
        {#if jsonParseError}
          <p class="med-error-msg" role="alert">Invalid JSON — fix syntax before saving.</p>
        {/if}
      {:else}
        <div class="med-value-header">
          <span class="med-label">Value</span>
          {#if entry.value_type === 'json'}
            <span class="med-value-hint">formatted</span>
          {/if}
        </div>
        {#if entry.value_type === 'json'}
          <div class="med-code-wrap" role="region" aria-label="JSON value">
            <pre class="med-code-block">{formatJson(entry.value)}</pre>
          </div>
        {:else}
          <p class="med-text-value">{entry.value}</p>
        {/if}
      {/if}
    </div>

    <!-- Metadata -->
    <div class="med-meta-section">
      <h3 class="med-section-title">Metadata</h3>
      <dl class="med-dl">
        <div class="med-dl-row">
          <dt>Agent</dt>
          <dd>{entry.metadata?.agent ?? '—'}</dd>
        </div>
        <div class="med-dl-row">
          <dt>Namespace</dt>
          <dd>{entry.namespace}</dd>
        </div>
        <div class="med-dl-row">
          <dt>Access count</dt>
          <dd>{formatAccessCount(entry.metadata?.access_count ?? 0)}</dd>
        </div>
        {#if entry.metadata?.ttl_seconds != null}
          <div class="med-dl-row">
            <dt>TTL</dt>
            <dd>{entry.metadata.ttl_seconds}s</dd>
          </div>
        {/if}
        <div class="med-dl-row">
          <dt>Created</dt>
          <dd>
            {#if entry.metadata?.created_at}
              <TimeAgo date={entry.metadata.created_at} />
            {:else}
              —
            {/if}
          </dd>
        </div>
        <div class="med-dl-row">
          <dt>Updated</dt>
          <dd>
            {#if entry.metadata?.updated_at}
              <TimeAgo date={entry.metadata.updated_at} />
            {:else}
              —
            {/if}
          </dd>
        </div>
        <div class="med-dl-row">
          <dt>ID</dt>
          <dd class="med-dl-mono">{entry.id}</dd>
        </div>
      </dl>
    </div>
  </div>
</article>

<style>
  .med-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--bg-surface);
  }

  /* ── Header ─────────────────────────────────────────────────────────────── */
  .med-header {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .med-header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .med-key {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    font-family: var(--font-mono);
    margin: 0;
    word-break: break-all;
    line-height: 1.4;
    flex: 1;
    min-width: 0;
  }

  .med-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .med-meta-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── Buttons ────────────────────────────────────────────────────────────── */
  .med-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 9px;
    border-radius: var(--radius-xs);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 100ms ease;
    white-space: nowrap;
  }

  .med-btn--ghost {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
  }

  .med-btn--ghost:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .med-btn--primary {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #93c5fd;
  }

  .med-btn--primary:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.6);
    color: #bfdbfe;
  }

  .med-btn--primary:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .med-btn--danger-ghost:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .med-btn--danger {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
  }

  .med-btn--danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.25);
  }

  .med-btn--danger:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* ── Badges ─────────────────────────────────────────────────────────────── */
  .med-ns-badge {
    display: inline-flex;
    align-items: center;
    height: 18px;
    padding: 0 7px;
    border-radius: 9px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2px;
    font-family: var(--font-mono);
  }

  .med-ns--blue { background: rgba(59,130,246,0.12); color: #93c5fd; }
  .med-ns--purple { background: rgba(192,132,252,0.12); color: #d8b4fe; }
  .med-ns--teal { background: rgba(52,211,153,0.12); color: #6ee7b7; }
  .med-ns--default { background: var(--bg-elevated); color: var(--text-muted); }

  .med-type-badge {
    display: inline-flex;
    align-items: center;
    height: 16px;
    padding: 0 5px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
    background: rgba(251, 191, 36, 0.1);
    color: #fcd34d;
    font-family: var(--font-mono);
  }

  .med-type-badge--string {
    background: rgba(148, 163, 184, 0.1);
    color: var(--text-muted);
  }

  /* ── Body ───────────────────────────────────────────────────────────────── */
  .med-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .med-body::-webkit-scrollbar { width: 4px; }
  .med-body::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

  /* ── Field ──────────────────────────────────────────────────────────────── */
  .med-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .med-field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .med-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-tertiary);
  }

  .med-value-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .med-value-hint {
    font-size: 10px;
    color: var(--text-muted);
  }

  /* ── Inputs ─────────────────────────────────────────────────────────────── */
  .med-input {
    height: 30px;
    padding: 0 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 12px;
    outline: none;
    transition: border-color 120ms ease;
    width: 100%;
  }

  .med-input:focus {
    border-color: var(--accent-primary);
  }

  .med-textarea {
    padding: 8px 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    outline: none;
    resize: vertical;
    transition: border-color 120ms ease;
    width: 100%;
    box-sizing: border-box;
  }

  .med-textarea:focus {
    border-color: var(--accent-primary);
  }

  .med-textarea--error {
    border-color: rgba(239, 68, 68, 0.5);
  }

  .med-error-msg {
    font-size: 11px;
    color: #fca5a5;
    margin: 0;
  }

  /* ── Type toggle ────────────────────────────────────────────────────────── */
  .med-type-toggle {
    display: flex;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    overflow: hidden;
  }

  .med-type-btn {
    height: 22px;
    padding: 0 8px;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 100ms ease;
  }

  .med-type-btn:not(:first-child) {
    border-left: 1px solid var(--border-default);
  }

  .med-type-btn--active {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  /* ── Value display ──────────────────────────────────────────────────────── */
  .med-code-block {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.6;
    color: var(--text-primary);
    overflow-x: auto;
    white-space: pre;
    margin: 0;
    max-height: 280px;
    overflow-y: auto;
  }

  .med-code-wrap {
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .med-code-block::-webkit-scrollbar { width: 4px; height: 4px; }
  .med-code-block::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

  .med-text-value {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    font-family: var(--font-sans);
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-primary);
    margin: 0;
    word-break: break-word;
    white-space: pre-wrap;
  }

  /* ── Metadata section ───────────────────────────────────────────────────── */
  .med-meta-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .med-section-title {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-tertiary);
    margin: 0;
  }

  .med-dl {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .med-dl-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 6px 12px;
    border-bottom: 1px solid var(--border-default);
  }

  .med-dl-row:last-child {
    border-bottom: none;
  }

  .med-dl dt {
    font-size: 11px;
    color: var(--text-tertiary);
    font-weight: 500;
    width: 90px;
    flex-shrink: 0;
  }

  .med-dl dd {
    font-size: 11px;
    color: var(--text-secondary);
    margin: 0;
    word-break: break-all;
  }

  .med-dl-mono {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
  }
</style>
