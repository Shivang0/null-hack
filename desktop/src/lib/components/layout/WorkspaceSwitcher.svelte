<!-- src/lib/components/layout/WorkspaceSwitcher.svelte -->
<script lang="ts">
  import { workspaceStore } from '$lib/stores/workspace.svelte';
  import { toastStore } from '$lib/stores/toasts.svelte';
  import { isTauri } from '$lib/utils/platform';

  let isOpen = $state(false);
  let isCreating = $state(false);
  let newName = $state('');
  let triggerEl = $state<HTMLButtonElement | null>(null);
  let panelEl = $state<HTMLDivElement | null>(null);

  let active = $derived(workspaceStore.activeWorkspace);
  let workspaces = $derived(workspaceStore.workspaces);

  function toggle() {
    isOpen = !isOpen;
    if (!isOpen) isCreating = false;
  }

  async function selectWorkspace(id: string) {
    await workspaceStore.setActiveWorkspace(id);
    await workspaceStore.watchActive();
    isOpen = false;
  }

  async function submitCreate() {
    const name = newName.trim();
    if (!name) return;
    await workspaceStore.createWorkspace(name);
    isCreating = false;
    newName = '';
    isOpen = false;
  }

  /** Open Workspace — pick a folder with .canopy/ in it */
  async function openWorkspace() {
    isOpen = false;
    if (!isTauri()) return;
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false, title: 'Open Workspace' });
      if (!selected || typeof selected !== 'string') return;

      const scanned = await workspaceStore.scanWorkspace(selected);
      if (!scanned) {
        toastStore.error('Not a workspace', 'No .canopy/ directory found.');
        return;
      }
      const wsEntry = {
        id: crypto.randomUUID(),
        path: selected,
        name: scanned.name || selected.split('/').pop() || 'Workspace',
        addedAt: new Date().toISOString(),
      };
      workspaceStore.addWorkspace(wsEntry);
      await workspaceStore.setActiveWorkspace(wsEntry.id);
      await workspaceStore.watchActive();
      toastStore.success('Workspace opened', `Loaded ${scanned.agents.length} agents`);
    } catch (e) {
      toastStore.error('Failed to open workspace', String(e));
    }
  }

  /** Create Workspace — pick a folder, scaffold .canopy/ */
  async function createWorkspace() {
    isOpen = false;
    if (!isTauri()) return;
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false, title: 'Create Workspace' });
      if (!selected || typeof selected !== 'string') return;

      const wsName = selected.split('/').pop() || 'New Workspace';
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('scaffold_canopy_dir', {
        path: selected,
        name: wsName,
        description: null,
        agents: [],
      });

      const wsEntry = {
        id: crypto.randomUUID(),
        path: selected,
        name: wsName,
        addedAt: new Date().toISOString(),
      };
      workspaceStore.addWorkspace(wsEntry);
      await workspaceStore.setActiveWorkspace(wsEntry.id);
      await workspaceStore.watchActive();
      toastStore.success('Workspace created', `${wsName} is ready`);
    } catch (e) {
      toastStore.error('Failed to create workspace', String(e));
    }
  }

  function handleCreateKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); void submitCreate(); }
    if (e.key === 'Escape') { isCreating = false; }
  }

  function handleClickOutside(e: MouseEvent) {
    if (!isOpen) return;
    const target = e.target as Node;
    if (!triggerEl?.contains(target) && !panelEl?.contains(target)) {
      isOpen = false;
      isCreating = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="ws-root">
  <button
    bind:this={triggerEl}
    class="ws-trigger"
    onclick={toggle}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label="Switch workspace"
  >
    <span class="ws-trigger-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    </span>
    <span class="ws-trigger-name">{active?.name ?? 'No Workspace'}</span>
    <span class="ws-chevron" class:open={isOpen} aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 9l-7 7-7-7" />
      </svg>
    </span>
  </button>

  {#if isOpen}
    <div
      bind:this={panelEl}
      class="ws-panel"
      role="listbox"
      aria-label="Workspaces"
    >
      {#if workspaces.length > 0}
        <div class="ws-list">
          {#each workspaces as ws (ws.id)}
            <button
              class="ws-item"
              class:active={ws.id === active?.id}
              onclick={() => selectWorkspace(ws.id)}
              role="option"
              aria-selected={ws.id === active?.id}
            >
              <span class="ws-item-name">{ws.name}</span>
              <span class="ws-item-path">{ws.path}</span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="ws-empty">No workspaces</div>
      {/if}

      <div class="ws-actions">
        {#if isCreating}
          <div class="ws-create-form">
            <input
              class="ws-create-input"
              type="text"
              placeholder="Workspace name…"
              bind:value={newName}
              onkeydown={handleCreateKeydown}
              autofocus
            />
            <button class="ws-create-btn" onclick={submitCreate} disabled={!newName.trim()}>
              Create
            </button>
          </div>
        {:else}
          <button class="ws-action-item" onclick={openWorkspace}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
            Open Workspace…
          </button>
          <button class="ws-action-item" onclick={createWorkspace}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Workspace
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .ws-root {
    position: relative;
  }

  .ws-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-xs);
    font-size: 13px;
    text-align: left;
    transition: background 120ms ease, color 120ms ease;
  }

  .ws-trigger:hover {
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  .ws-trigger-icon {
    flex-shrink: 0;
    color: var(--text-tertiary);
    display: flex;
  }

  .ws-trigger-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .ws-chevron {
    flex-shrink: 0;
    color: var(--text-tertiary);
    display: flex;
    transition: transform 160ms ease;
  }

  .ws-chevron.open {
    transform: rotate(180deg);
  }

  .ws-panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 200;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  .ws-list {
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: 200px;
    overflow-y: auto;
  }

  .ws-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    border-radius: var(--radius-xs);
    text-align: left;
    transition: background 100ms ease;
  }

  .ws-item:hover {
    background: var(--bg-surface);
  }

  .ws-item.active {
    background: var(--bg-elevated);
  }

  .ws-item-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .ws-item-path {
    font-size: 11px;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .ws-empty {
    padding: 12px 8px;
    font-size: 12px;
    color: var(--text-tertiary);
    text-align: center;
  }

  .ws-actions {
    border-top: 1px solid var(--border-default);
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .ws-action-item {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-xs);
    font-size: 12px;
    text-align: left;
    transition: background 100ms ease, color 100ms ease;
  }

  .ws-action-item:hover {
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  .ws-create-form {
    display: flex;
    gap: 4px;
    padding: 4px;
  }

  .ws-create-input {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 12px;
    outline: none;
  }

  .ws-create-input:focus {
    border-color: var(--border-active, #3b82f6);
  }

  .ws-create-btn {
    padding: 5px 10px;
    border: none;
    border-radius: var(--radius-xs);
    background: var(--accent-primary, #3b82f6);
    color: #fff;
    font-size: 12px;
    cursor: pointer;
  }

  .ws-create-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
