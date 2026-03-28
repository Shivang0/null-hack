<!-- src/routes/app/execution-workspaces/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { executionWorkspacesStore } from '$lib/stores/execution-workspaces.svelte';

  onMount(() => {
    void executionWorkspacesStore.fetchWorkspaces();
  });

  // Create form state
  let showForm = $state(false);
  let formAgentId = $state('');
  let formDirectory = $state('');
  let creating = $state(false);
  let formError = $state<string | null>(null);

  // Delete confirmation
  let confirmDeleteId = $state<string | null>(null);

  async function handleCreate() {
    creating = true;
    formError = null;
    const ok = await executionWorkspacesStore.createWorkspace({
      agent_id: formAgentId.trim() || undefined,
      directory: formDirectory.trim() || undefined,
    });
    creating = false;
    if (ok) {
      resetForm();
    } else {
      formError = executionWorkspacesStore.error;
    }
  }

  function resetForm() {
    showForm = false;
    formAgentId = '';
    formDirectory = '';
    formError = null;
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      confirmDeleteId = id;
      return;
    }
    confirmDeleteId = null;
    await executionWorkspacesStore.deleteWorkspace(id);
  }

  function statusClass(status: string): string {
    return {
      active:   'ew-status--active',
      idle:     'ew-status--idle',
      archived: 'ew-status--archived',
    }[status] ?? 'ew-status--idle';
  }

  function statusLabel(status: string): string {
    return { active: 'Active', idle: 'Idle', archived: 'Archived' }[status] ?? status;
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }

  function shortId(id: string): string {
    return id.split('-')[0] ?? id.slice(0, 8);
  }
</script>

<PageShell
  title="Execution Workspaces"
  subtitle="Sandboxed git workspaces for agent tasks"
  badge={executionWorkspacesStore.totalCount > 0 ? executionWorkspacesStore.totalCount : undefined}
>
  {#snippet actions()}
    <button
      class="ew-create-btn"
      onclick={() => showForm = true}
      type="button"
      aria-label="Create execution workspace"
    >
      + Create Workspace
    </button>
  {/snippet}

  {#if executionWorkspacesStore.loading && executionWorkspacesStore.workspaces.length === 0}
    <div class="ew-loading" role="status" aria-live="polite">
      <div class="ew-spinner" aria-hidden="true"></div>
      <span>Loading workspaces…</span>
    </div>
  {:else if executionWorkspacesStore.error && executionWorkspacesStore.workspaces.length === 0}
    <div class="ew-empty" role="alert">
      <p>Failed to load workspaces: {executionWorkspacesStore.error}</p>
      <button class="ew-retry-btn" onclick={() => void executionWorkspacesStore.fetchWorkspaces()}>Retry</button>
    </div>
  {:else if executionWorkspacesStore.workspaces.length === 0}
    <div class="ew-empty" role="status">
      <svg class="ew-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
      <p>No execution workspaces yet.</p>
      <button class="ew-create-btn" onclick={() => showForm = true}>Create first workspace</button>
    </div>
  {:else}
    <div class="ew-grid" role="list" aria-label="Execution workspaces">
      {#each executionWorkspacesStore.workspaces as ws (ws.id)}
        <div class="ew-card" role="listitem">
          <div class="ew-card-header">
            <div class="ew-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <span class="ew-status {statusClass(ws.status)}" aria-label="Status: {statusLabel(ws.status)}">
              <span class="ew-status-dot" aria-hidden="true"></span>
              {statusLabel(ws.status)}
            </span>
          </div>

          <div class="ew-card-body">
            <div class="ew-id" title={ws.id}>{shortId(ws.id)}</div>
            {#if ws.directory}
              <div class="ew-dir" title={ws.directory}>{ws.directory}</div>
            {/if}
            {#if ws.agent_id}
              <div class="ew-agent">
                <span class="ew-agent-label">Agent</span>
                <span class="ew-agent-id" title={ws.agent_id}>{shortId(ws.agent_id)}</span>
              </div>
            {/if}
          </div>

          <div class="ew-card-meta">
            <div class="ew-meta-row">
              <span class="ew-meta-label">Files</span>
              <span class="ew-meta-val">{ws.file_count.toLocaleString()}</span>
            </div>
            <div class="ew-meta-row">
              <span class="ew-meta-label">Size</span>
              <span class="ew-meta-val">{formatBytes(ws.size_bytes)}</span>
            </div>
            <div class="ew-meta-row">
              <span class="ew-meta-label">Created</span>
              <time class="ew-meta-val" datetime={ws.created_at}>{formatDate(ws.created_at)}</time>
            </div>
          </div>

          <div class="ew-card-footer">
            <button
              class="ew-delete-btn"
              class:ew-delete-btn--confirm={confirmDeleteId === ws.id}
              onclick={() => void handleDelete(ws.id)}
              aria-label={confirmDeleteId === ws.id ? 'Confirm delete' : `Delete workspace ${shortId(ws.id)}`}
              type="button"
            >
              {confirmDeleteId === ws.id ? 'Confirm delete?' : 'Delete'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</PageShell>

<!-- Create Workspace dialog -->
{#if showForm}
  <div
    class="ew-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Create execution workspace"
    onclick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
  >
    <div class="ew-dialog">
      <h2 class="ew-dialog-title">New Execution Workspace</h2>

      <div class="ew-field">
        <label class="ew-label" for="ew-agent-input">
          Agent ID <span class="ew-label-hint">(optional)</span>
        </label>
        <input
          id="ew-agent-input"
          class="ew-input"
          type="text"
          placeholder="Agent UUID to associate"
          bind:value={formAgentId}
          autofocus
        />
      </div>

      <div class="ew-field">
        <label class="ew-label" for="ew-dir-input">
          Directory <span class="ew-label-hint">(optional)</span>
        </label>
        <input
          id="ew-dir-input"
          class="ew-input"
          type="text"
          placeholder="/workspace/my-task"
          bind:value={formDirectory}
        />
      </div>

      {#if formError}
        <p class="ew-form-error" role="alert">{formError}</p>
      {/if}

      <div class="ew-dialog-actions">
        <button class="ew-btn-ghost" onclick={resetForm} disabled={creating} type="button">Cancel</button>
        <button
          class="ew-btn-primary"
          onclick={handleCreate}
          disabled={creating}
          type="button"
        >
          {creating ? 'Creating…' : 'Create Workspace'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .ew-create-btn {
    height: 28px; padding: 0 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
    background: #6366f1; border: none; color: white; cursor: pointer; transition: background 120ms ease;
  }
  .ew-create-btn:hover { background: #4f46e5; }

  .ew-loading, .ew-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 240px;
    color: var(--dt3); font-size: 13px;
  }
  .ew-empty-icon { width: 32px; height: 32px; color: var(--dt4); }
  .ew-spinner {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid var(--dbd); border-top-color: var(--dt2);
    animation: ew-spin 0.8s linear infinite;
  }
  @keyframes ew-spin { to { transform: rotate(360deg); } }
  .ew-retry-btn {
    padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer;
    border: 1px solid var(--dbd); background: var(--dbg2); color: var(--dt2);
  }

  .ew-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    padding: 24px;
  }

  .ew-card {
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 10px;
    padding: 16px; display: flex; flex-direction: column; gap: 12px;
    transition: border-color 120ms ease, background 120ms ease;
  }
  .ew-card:hover { background: var(--dbg3); border-color: var(--dbd2); }

  .ew-card-header {
    display: flex; align-items: center; justify-content: space-between;
  }
  .ew-card-icon {
    width: 28px; height: 28px; border-radius: 6px;
    background: color-mix(in srgb, #6366f1 12%, var(--dbg3));
    display: flex; align-items: center; justify-content: center; color: #a5b4fc;
  }

  .ew-status {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 4px;
  }
  .ew-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .ew-status--active {
    background: rgba(34,197,94,0.12); color: rgba(134,239,172,0.9);
  }
  .ew-status--active .ew-status-dot { background: rgba(134,239,172,0.9); }
  .ew-status--idle {
    background: rgba(234,179,8,0.12); color: rgba(253,224,71,0.9);
  }
  .ew-status--idle .ew-status-dot { background: rgba(253,224,71,0.9); }
  .ew-status--archived {
    background: var(--dbg3); color: var(--dt4);
  }
  .ew-status--archived .ew-status-dot { background: var(--dt4); }

  .ew-card-body { display: flex; flex-direction: column; gap: 4px; }
  .ew-id {
    font-size: 13px; font-weight: 600; color: var(--dt); font-family: var(--font-mono);
  }
  .ew-dir {
    font-size: 11px; color: var(--dt3); font-family: var(--font-mono);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ew-agent { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
  .ew-agent-label { font-size: 10px; color: var(--dt4); }
  .ew-agent-id { font-size: 11px; color: var(--dt3); font-family: var(--font-mono); }

  .ew-card-meta { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--dbd); padding-top: 10px; }
  .ew-meta-row { display: flex; justify-content: space-between; }
  .ew-meta-label { font-size: 10px; color: var(--dt4); }
  .ew-meta-val { font-size: 11px; color: var(--dt3); }

  .ew-card-footer { display: flex; justify-content: flex-end; }
  .ew-delete-btn {
    padding: 5px 10px; border-radius: 5px; font-size: 11px; font-weight: 500;
    cursor: pointer; border: 1px solid var(--dbd); background: transparent;
    color: var(--dt3); transition: all 120ms ease; white-space: nowrap;
  }
  .ew-delete-btn:hover { border-color: rgba(239,68,68,0.4); color: #fca5a5; background: rgba(239,68,68,0.08); }
  .ew-delete-btn--confirm { border-color: rgba(239,68,68,0.6); color: #fca5a5; background: rgba(239,68,68,0.12); }

  /* Dialog */
  .ew-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  .ew-dialog {
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 12px;
    padding: 24px; width: 420px; max-width: calc(100vw - 40px);
    display: flex; flex-direction: column; gap: 16px;
  }
  .ew-dialog-title { font-size: 16px; font-weight: 600; color: var(--dt); margin: 0; }
  .ew-field { display: flex; flex-direction: column; gap: 6px; }
  .ew-label { font-size: 12px; font-weight: 500; color: var(--dt2); }
  .ew-label-hint { font-weight: 400; color: var(--dt4); }
  .ew-input {
    height: 34px; padding: 0 10px; border-radius: 6px; font-size: 13px;
    background: var(--dbg3); border: 1px solid var(--dbd); color: var(--dt);
    width: 100%; box-sizing: border-box;
  }
  .ew-input:focus { outline: none; border-color: #6366f1; }
  .ew-form-error { font-size: 12px; color: #fca5a5; margin: 0; }
  .ew-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
  .ew-btn-ghost, .ew-btn-primary {
    padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 120ms ease;
  }
  .ew-btn-ghost { background: transparent; border: 1px solid var(--dbd); color: var(--dt3); }
  .ew-btn-ghost:hover:not(:disabled) { background: var(--dbg3); color: var(--dt2); }
  .ew-btn-primary { background: #6366f1; border: none; color: #fff; }
  .ew-btn-primary:hover:not(:disabled) { background: #4f46e5; }
  .ew-btn-ghost:disabled, .ew-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
