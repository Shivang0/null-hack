<!-- src/routes/app/documents/+page.svelte -->
<script lang="ts">
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import DocumentTree from '$lib/components/documents/DocumentTree.svelte';
  import DocumentViewer from '$lib/components/documents/DocumentViewer.svelte';
  import { documentsStore } from '$lib/stores/documents.svelte';
  import { workspaceStore } from '$lib/stores/workspace.svelte';

  // Re-fetch whenever the active workspace changes (covers initial mount too).
  // Referencing activeWorkspaceId registers it as a reactive dependency so the
  // effect re-runs on every workspace switch.
  $effect(() => {
    void workspaceStore.activeWorkspaceId;
    void documentsStore.fetchDocuments();
  });

  // New document form state
  let showForm = $state(false);
  let formPath = $state('');
  let formContent = $state('');
  let creating = $state(false);
  let formError = $state<string | null>(null);

  async function handleCreate() {
    if (!formPath.trim()) return;
    creating = true;
    formError = null;
    try {
      await documentsStore.createDocument({
        title: formPath.trim().split('/').pop() ?? formPath.trim(),
        path: formPath.trim(),
        content: formContent,
      });
      resetForm();
    } catch (err) {
      formError = (err as Error).message;
    } finally {
      creating = false;
    }
  }

  function resetForm() {
    showForm = false;
    formPath = '';
    formContent = '';
    formError = null;
  }
</script>

<PageShell title="Documents" badge={documentsStore.documents.length > 0 ? documentsStore.documents.length : undefined}>
  {#snippet actions()}
    <button
      class="dp-create-btn"
      onclick={() => showForm = true}
      type="button"
      aria-label="Create document"
    >
      + New Document
    </button>
  {/snippet}
  <div class="dp-layout">
    <!-- Left: file tree -->
    <aside class="dp-sidebar" aria-label="Document tree navigation" role="navigation">
      {#if documentsStore.loading}
        <div class="dp-loading" role="status" aria-label="Loading documents">
          <div class="dp-spinner" aria-hidden="true"></div>
        </div>
      {:else if documentsStore.tree.length === 0}
        <div class="dp-empty-tree" role="status">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <p>No documents</p>
        </div>
      {:else}
        <DocumentTree nodes={documentsStore.tree} />
      {/if}
    </aside>

    <!-- Right: viewer -->
    <main class="dp-main" id="document-content" aria-label="Document content">
      {#if documentsStore.selected}
        <DocumentViewer document={documentsStore.selected} />
      {:else}
        <div class="dp-no-selection" role="status">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
          <h3>No document selected</h3>
          <p>Select a file from the tree to view its contents.</p>
        </div>
      {/if}
    </main>
  </div>
</PageShell>

{#if showForm}
  <div
    class="dp-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Create document"
    onclick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
  >
    <div class="dp-dialog">
      <h2 class="dp-dialog-title">New Document</h2>

      <div class="dp-field">
        <label class="dp-label" for="dp-path-input">Path</label>
        <input
          id="dp-path-input"
          class="dp-input"
          type="text"
          placeholder="e.g. docs/readme.md"
          bind:value={formPath}
          autofocus
        />
      </div>

      <div class="dp-field">
        <label class="dp-label" for="dp-content-input">Content</label>
        <textarea
          id="dp-content-input"
          class="dp-textarea"
          placeholder="Document content…"
          bind:value={formContent}
          rows={8}
        ></textarea>
      </div>

      {#if formError}
        <p class="dp-form-error" role="alert">{formError}</p>
      {/if}

      <div class="dp-dialog-actions">
        <button class="dp-btn-ghost" onclick={resetForm} disabled={creating}>Cancel</button>
        <button
          class="dp-btn-primary"
          onclick={handleCreate}
          disabled={creating || !formPath.trim()}
        >
          {creating ? 'Creating…' : 'Create Document'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dp-layout {
    display: flex;
    height: 100%;
    gap: 0;
    overflow: hidden;
  }

  .dp-sidebar {
    width: 240px;
    min-width: 180px;
    flex-shrink: 0;
    border-right: 1px solid var(--border-default);
    overflow-y: auto;
    padding: 8px 6px;
    background: var(--bg-secondary);
  }

  .dp-sidebar::-webkit-scrollbar { width: 4px; }
  .dp-sidebar::-webkit-scrollbar-track { background: transparent; }
  .dp-sidebar::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

  .dp-main {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  .dp-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
  }

  .dp-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-default);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: dp-spin 0.7s linear infinite;
  }

  @keyframes dp-spin { to { transform: rotate(360deg); } }

  .dp-empty-tree {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 140px;
    color: var(--text-muted);
    text-align: center;
  }

  .dp-empty-tree p {
    font-size: 12px;
    margin: 0;
  }

  .dp-no-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex: 1;
    color: var(--text-tertiary);
    text-align: center;
    padding: 24px;
  }

  .dp-no-selection svg { color: var(--text-muted); margin-bottom: 4px; }

  .dp-no-selection h3 {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0;
  }

  .dp-no-selection p {
    font-size: 13px;
    color: var(--text-tertiary);
    margin: 0;
    max-width: 280px;
  }

  /* Create button */
  .dp-create-btn {
    height: 28px; padding: 0 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
    background: #6366f1; border: none; color: white; cursor: pointer; transition: background 120ms ease;
  }
  .dp-create-btn:hover { background: #4f46e5; }

  /* Dialog */
  .dp-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  .dp-dialog {
    background: var(--bg-tertiary, var(--dbg2)); border: 1px solid var(--border-default, var(--dbd)); border-radius: 12px;
    padding: 24px; width: 480px; max-width: calc(100vw - 40px);
    display: flex; flex-direction: column; gap: 16px;
  }
  .dp-dialog-title { font-size: 16px; font-weight: 600; color: var(--text-primary, var(--dt)); margin: 0; }
  .dp-field { display: flex; flex-direction: column; gap: 6px; }
  .dp-label { font-size: 12px; font-weight: 500; color: var(--text-secondary, var(--dt2)); }
  .dp-input {
    height: 34px; padding: 0 10px; border-radius: 6px; font-size: 13px;
    background: var(--bg-elevated, var(--dbg3)); border: 1px solid var(--border-default, var(--dbd)); color: var(--text-primary, var(--dt));
    width: 100%; box-sizing: border-box;
  }
  .dp-input:focus { outline: none; border-color: #6366f1; }
  .dp-textarea {
    padding: 8px 10px; border-radius: 6px; font-size: 13px; font-family: var(--font-mono, monospace);
    background: var(--bg-elevated, var(--dbg3)); border: 1px solid var(--border-default, var(--dbd)); color: var(--text-primary, var(--dt));
    width: 100%; box-sizing: border-box; resize: vertical; min-height: 120px; line-height: 1.5;
  }
  .dp-textarea:focus { outline: none; border-color: #6366f1; }
  .dp-form-error { font-size: 12px; color: #fca5a5; margin: 0; }
  .dp-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
  .dp-btn-ghost, .dp-btn-primary {
    padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 120ms ease;
  }
  .dp-btn-ghost { background: transparent; border: 1px solid var(--border-default, var(--dbd)); color: var(--text-tertiary, var(--dt3)); }
  .dp-btn-ghost:hover:not(:disabled) { background: var(--bg-elevated, var(--dbg3)); color: var(--text-secondary, var(--dt2)); }
  .dp-btn-primary { background: #6366f1; border: none; color: #fff; }
  .dp-btn-primary:hover:not(:disabled) { background: #4f46e5; }
  .dp-btn-ghost:disabled, .dp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
