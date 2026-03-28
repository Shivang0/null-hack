<!-- src/routes/app/plugins/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { pluginsStore } from '$lib/stores/plugins.svelte';
  import { plugins as pluginsApi } from '$lib/api/client';
  import type { PluginStatus } from '$lib/api/types';

  onMount(() => {
    void pluginsStore.fetchPlugins();
  });

  // Search state
  let search = $state('');
  let filteredPlugins = $derived(
    search.trim()
      ? pluginsStore.plugins.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase()),
        )
      : pluginsStore.plugins,
  );

  // Logs drawer state
  let logsPluginId = $state<string | null>(null);
  let logsPluginName = $state('');

  function openLogs(id: string, name: string) {
    logsPluginId = id;
    logsPluginName = name;
    void pluginsStore.fetchLogs(id);
  }

  function closeLogs() {
    logsPluginId = null;
    logsPluginName = '';
  }

  // Create form state
  let showForm = $state(false);
  let formName = $state('');
  let formVersion = $state('');
  let formDescription = $state('');
  let formConfig = $state('{}');
  let creating = $state(false);
  let formError = $state<string | null>(null);
  let configError = $state<string | null>(null);

  function validateConfig(): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(formConfig.trim() || '{}') as Record<string, unknown>;
      configError = null;
      return parsed;
    } catch {
      configError = 'Invalid JSON';
      return null;
    }
  }

  async function handleCreate() {
    if (!formName.trim()) return;
    const config = validateConfig();
    if (!config) return;
    creating = true;
    formError = null;
    try {
      const created = await pluginsApi.create({
        name: formName.trim(),
        version: formVersion.trim() || '1.0.0',
        description: formDescription.trim(),
        config,
        enabled: false,
        status: 'inactive' as PluginStatus,
      });
      pluginsStore.plugins = [created, ...pluginsStore.plugins];
      resetForm();
    } catch (e) {
      formError = (e as Error).message;
    } finally {
      creating = false;
    }
  }

  function resetForm() {
    showForm = false;
    formName = '';
    formVersion = '';
    formDescription = '';
    formConfig = '{}';
    formError = null;
    configError = null;
  }

  function formatStatus(status: PluginStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
</script>

<PageShell
  title="Plugins"
  subtitle="{pluginsStore.activeCount} active"
  badge={pluginsStore.totalCount > 0 ? pluginsStore.totalCount : undefined}
>
  {#snippet actions()}
    <div class="pl-header-actions">
      <div class="pl-search-wrap">
        <svg class="pl-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          class="pl-search"
          type="search"
          placeholder="Filter plugins…"
          bind:value={search}
          aria-label="Filter plugins"
        />
      </div>
      <button
        class="pl-create-btn"
        onclick={() => (showForm = true)}
        type="button"
        aria-label="Install plugin"
      >
        + Install Plugin
      </button>
    </div>
  {/snippet}

  {#if pluginsStore.loading && pluginsStore.plugins.length === 0}
    <div class="pl-loading" role="status" aria-live="polite">
      <div class="pl-spinner" aria-hidden="true"></div>
      <span>Loading plugins…</span>
    </div>
  {:else if pluginsStore.error && pluginsStore.plugins.length === 0}
    <div class="pl-error" role="alert">
      <p>Failed to load plugins: {pluginsStore.error}</p>
      <button onclick={() => void pluginsStore.fetchPlugins()}>Retry</button>
    </div>
  {:else if filteredPlugins.length === 0}
    <div class="pl-empty" role="status">
      {#if search.trim()}
        <p>No plugins match "{search}".</p>
      {:else}
        <p>No plugins installed yet.</p>
      {/if}
    </div>
  {:else}
    <div class="pl-grid" role="list" aria-label="Plugins">
      {#each filteredPlugins as plugin (plugin.id)}
        <div class="pl-card" role="listitem">
          <!-- Card header -->
          <div class="pl-card-header">
            <div class="pl-card-meta">
              <span class="pl-dot" class:pl-dot--on={plugin.enabled} aria-hidden="true"></span>
              <div>
                <div class="pl-name">{plugin.name}</div>
                <div class="pl-version">v{plugin.version} &middot; {plugin.author}</div>
              </div>
            </div>
            <span class="pl-status pl-status--{plugin.status}">{formatStatus(plugin.status)}</span>
          </div>

          <!-- Description -->
          <p class="pl-desc">{plugin.description || 'No description.'}</p>

          <!-- Capabilities -->
          {#if plugin.capabilities.length > 0}
            <div class="pl-caps">
              {#each plugin.capabilities.slice(0, 4) as cap}
                <span class="pl-cap">{cap}</span>
              {/each}
              {#if plugin.capabilities.length > 4}
                <span class="pl-cap-more">+{plugin.capabilities.length - 4}</span>
              {/if}
            </div>
          {/if}

          <!-- Card footer actions -->
          <div class="pl-card-actions">
            <button
              class="pl-btn-toggle"
              class:pl-btn-toggle--on={plugin.enabled}
              onclick={() => void pluginsStore.togglePlugin(plugin.id)}
              aria-label="{plugin.enabled ? 'Disable' : 'Enable'} plugin {plugin.name}"
              type="button"
            >
              {plugin.enabled ? 'Disable' : 'Enable'}
            </button>
            <button
              class="pl-btn-logs"
              onclick={() => openLogs(plugin.id, plugin.name)}
              aria-label="View logs for {plugin.name}"
              type="button"
            >
              Logs
            </button>
            <button
              class="pl-btn-delete"
              onclick={() => void pluginsStore.deletePlugin(plugin.id)}
              aria-label="Delete plugin {plugin.name}"
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</PageShell>

<!-- Install plugin dialog -->
{#if showForm}
  <div
    class="pl-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Install plugin"
    onclick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
  >
    <div class="pl-dialog">
      <h2 class="pl-dialog-title">Install Plugin</h2>

      <div class="pl-field">
        <label class="pl-label" for="pl-name-input">Name</label>
        <input
          id="pl-name-input"
          class="pl-input"
          type="text"
          placeholder="my-plugin"
          bind:value={formName}
          autofocus
        />
      </div>

      <div class="pl-field">
        <label class="pl-label" for="pl-version-input">Version <span class="pl-label-hint">(optional, defaults to 1.0.0)</span></label>
        <input
          id="pl-version-input"
          class="pl-input"
          type="text"
          placeholder="1.0.0"
          bind:value={formVersion}
        />
      </div>

      <div class="pl-field">
        <label class="pl-label" for="pl-desc-input">Description <span class="pl-label-hint">(optional)</span></label>
        <input
          id="pl-desc-input"
          class="pl-input"
          type="text"
          placeholder="What does this plugin do?"
          bind:value={formDescription}
        />
      </div>

      <div class="pl-field">
        <label class="pl-label" for="pl-config-input">Config <span class="pl-label-hint">(JSON)</span></label>
        <textarea
          id="pl-config-input"
          class="pl-textarea"
          rows={4}
          placeholder="{'{}' as string}"
          bind:value={formConfig}
          spellcheck={false}
        ></textarea>
        {#if configError}
          <span class="pl-field-error" role="alert">{configError}</span>
        {/if}
      </div>

      {#if formError}
        <p class="pl-form-error" role="alert">{formError}</p>
      {/if}

      <div class="pl-dialog-actions">
        <button class="pl-btn-ghost" onclick={resetForm} disabled={creating}>Cancel</button>
        <button
          class="pl-btn-primary"
          onclick={handleCreate}
          disabled={creating || !formName.trim()}
        >
          {creating ? 'Installing…' : 'Install Plugin'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Logs drawer -->
{#if logsPluginId}
  <div
    class="pl-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Plugin logs"
    onclick={(e) => { if (e.target === e.currentTarget) closeLogs(); }}
  >
    <div class="pl-dialog pl-dialog--wide">
      <div class="pl-dialog-header">
        <h2 class="pl-dialog-title">Logs — {logsPluginName}</h2>
        <button class="pl-btn-ghost pl-btn-close" onclick={closeLogs} aria-label="Close logs">
          ✕
        </button>
      </div>

      {#if pluginsStore.loading}
        <div class="pl-logs-loading" role="status">Loading logs…</div>
      {:else if pluginsStore.logs.length === 0}
        <div class="pl-logs-empty">No logs found for this plugin.</div>
      {:else}
        <div class="pl-logs" role="log" aria-live="polite">
          {#each pluginsStore.logs as log (log.id)}
            <div class="pl-log-entry pl-log-entry--{log.level}">
              <span class="pl-log-level">{log.level.toUpperCase()}</span>
              <span class="pl-log-msg">{log.message}</span>
              <span class="pl-log-time">{new Date(log.created_at).toLocaleTimeString()}</span>
            </div>
          {/each}
        </div>
      {/if}

      <div class="pl-dialog-actions">
        <button class="pl-btn-ghost" onclick={closeLogs}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .pl-header-actions {
    display: flex; align-items: center; gap: 8px;
  }
  .pl-search-wrap {
    position: relative; display: flex; align-items: center;
  }
  .pl-search-icon {
    position: absolute; left: 8px; color: var(--dt4); pointer-events: none;
  }
  .pl-search {
    height: 28px; padding: 0 10px 0 26px; border-radius: 6px; font-size: 12px;
    background: var(--dbg3); border: 1px solid var(--dbd); color: var(--dt);
    width: 160px; box-sizing: border-box;
  }
  .pl-search:focus { outline: none; border-color: #6366f1; }

  .pl-create-btn {
    height: 28px; padding: 0 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
    background: #6366f1; border: none; color: white; cursor: pointer;
    transition: background 120ms ease; white-space: nowrap;
  }
  .pl-create-btn:hover { background: #4f46e5; }

  /* States */
  .pl-loading, .pl-empty, .pl-error {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 200px;
    color: var(--dt3); font-size: 13px;
  }
  .pl-spinner {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid var(--dbd); border-top-color: var(--dt2);
    animation: pl-spin 0.8s linear infinite;
  }
  @keyframes pl-spin { to { transform: rotate(360deg); } }

  /* Grid */
  .pl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px; padding: 24px;
  }

  /* Card */
  .pl-card {
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 10px;
    padding: 16px; display: flex; flex-direction: column; gap: 10px;
  }
  .pl-card-header {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
  }
  .pl-card-meta {
    display: flex; align-items: center; gap: 10px;
  }
  .pl-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    background: var(--dbd2);
  }
  .pl-dot--on { background: #4ade80; }
  .pl-name { font-size: 14px; font-weight: 600; color: var(--dt); }
  .pl-version { font-size: 11px; color: var(--dt4); font-family: var(--font-mono); margin-top: 1px; }

  /* Status badges */
  .pl-status { font-size: 11px; padding: 2px 8px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; }
  .pl-status--active   { background: rgba(34,197,94,0.12);  color: rgba(134,239,172,0.8); }
  .pl-status--inactive { background: var(--dbg3);            color: var(--dt4); }
  .pl-status--error    { background: rgba(239,68,68,0.12);   color: #fca5a5; }
  .pl-status--installing { background: rgba(251,191,36,0.12); color: #fbbf24; }

  /* Description */
  .pl-desc {
    font-size: 12px; color: var(--dt3); margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  /* Capabilities */
  .pl-caps { display: flex; gap: 4px; flex-wrap: wrap; }
  .pl-cap { font-size: 10px; padding: 1px 6px; border-radius: 4px; background: var(--dbg3); color: var(--dt3); }
  .pl-cap-more { font-size: 10px; color: var(--dt4); align-self: center; }

  /* Card actions */
  .pl-card-actions { display: flex; gap: 6px; margin-top: auto; }
  .pl-btn-toggle, .pl-btn-logs, .pl-btn-delete {
    padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 500;
    cursor: pointer; border: 1px solid var(--dbd); background: transparent;
    color: var(--dt3); transition: all 120ms ease;
  }
  .pl-btn-toggle:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.4); color: #a5b4fc; }
  .pl-btn-toggle--on { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); color: #a5b4fc; }
  .pl-btn-toggle--on:hover { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
  .pl-btn-logs:hover { background: var(--dbg3); border-color: var(--dbd2); color: var(--dt2); }
  .pl-btn-delete:hover { border-color: rgba(239,68,68,0.4); color: #fca5a5; background: rgba(239,68,68,0.08); }

  /* Dialog / Overlay */
  .pl-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  .pl-dialog {
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 12px;
    padding: 24px; width: 440px; max-width: calc(100vw - 40px);
    display: flex; flex-direction: column; gap: 16px;
    max-height: calc(100vh - 80px); overflow-y: auto;
  }
  .pl-dialog--wide { width: 600px; }
  .pl-dialog-header {
    display: flex; align-items: center; justify-content: space-between;
  }
  .pl-dialog-title { font-size: 16px; font-weight: 600; color: var(--dt); margin: 0; }
  .pl-field { display: flex; flex-direction: column; gap: 6px; }
  .pl-label { font-size: 12px; font-weight: 500; color: var(--dt2); }
  .pl-label-hint { font-weight: 400; color: var(--dt4); }
  .pl-input {
    height: 34px; padding: 0 10px; border-radius: 6px; font-size: 13px;
    background: var(--dbg3); border: 1px solid var(--dbd); color: var(--dt);
    width: 100%; box-sizing: border-box;
  }
  .pl-input:focus { outline: none; border-color: #6366f1; }
  .pl-textarea {
    padding: 8px 10px; border-radius: 6px; font-size: 12px; font-family: var(--font-mono);
    background: var(--dbg3); border: 1px solid var(--dbd); color: var(--dt);
    width: 100%; box-sizing: border-box; resize: vertical; line-height: 1.5;
  }
  .pl-textarea:focus { outline: none; border-color: #6366f1; }
  .pl-field-error { font-size: 11px; color: #fca5a5; }
  .pl-form-error { font-size: 12px; color: #fca5a5; margin: 0; }
  .pl-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
  .pl-btn-close { padding: 4px 8px; }
  .pl-btn-ghost, .pl-btn-primary {
    padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 120ms ease;
  }
  .pl-btn-ghost { background: transparent; border: 1px solid var(--dbd); color: var(--dt3); }
  .pl-btn-ghost:hover:not(:disabled) { background: var(--dbg3); color: var(--dt2); }
  .pl-btn-primary { background: #6366f1; border: none; color: #fff; }
  .pl-btn-primary:hover:not(:disabled) { background: #4f46e5; }
  .pl-btn-ghost:disabled, .pl-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Logs */
  .pl-logs-loading, .pl-logs-empty {
    font-size: 13px; color: var(--dt3); padding: 16px 0; text-align: center;
  }
  .pl-logs {
    display: flex; flex-direction: column; gap: 4px;
    max-height: 360px; overflow-y: auto;
    background: var(--dbg3); border: 1px solid var(--dbd); border-radius: 6px; padding: 8px;
  }
  .pl-log-entry {
    display: flex; align-items: baseline; gap: 8px; font-size: 11px;
    font-family: var(--font-mono); padding: 3px 4px; border-radius: 3px;
  }
  .pl-log-entry--debug   { color: var(--dt4); }
  .pl-log-entry--info    { color: var(--dt2); }
  .pl-log-entry--warning { color: #fbbf24; }
  .pl-log-entry--error   { color: #fca5a5; background: rgba(239,68,68,0.06); }
  .pl-log-level { font-weight: 700; min-width: 48px; }
  .pl-log-msg   { flex: 1; word-break: break-all; }
  .pl-log-time  { color: var(--dt4); white-space: nowrap; }
</style>
