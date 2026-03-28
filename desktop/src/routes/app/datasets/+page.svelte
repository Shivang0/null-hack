<!-- src/routes/app/datasets/+page.svelte -->
<script lang="ts">
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import { datasetsStore } from '$lib/stores/datasets.svelte';
  import { workspaceStore } from '$lib/stores/workspace.svelte';
  import { agentsStore } from '$lib/stores/agents.svelte';
  import type { Dataset, DatasetSourceType } from '$api/types';

  // ── Filter + search state ──────────────────────────────────────────────────

  type SourceFilter = 'all' | DatasetSourceType;
  let activeFilter = $state<SourceFilter>('all');
  let searchQuery = $state('');

  // ── Create dialog state ────────────────────────────────────────────────────

  let createOpen = $state(false);
  let newName = $state('');
  let newDescription = $state('');
  let newSourceType = $state<DatasetSourceType>('upload');
  let newFormat = $state<Dataset['format']>('csv');
  let creating = $state(false);

  // ── Derived filtered list ──────────────────────────────────────────────────

  const filteredDatasets = $derived(() => {
    let list = datasetsStore.datasets;
    if (activeFilter !== 'all') {
      list = list.filter((d) => d.source_type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  });

  // ── Load on mount ─────────────────────────────────────────────────────────

  $effect(() => {
    const wsId = workspaceStore.activeWorkspaceId ?? undefined;
    void datasetsStore.fetchDatasets(wsId);
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function selectDataset(ds: Dataset) {
    datasetsStore.selectDataset(ds);
  }

  function closeDetail() {
    datasetsStore.selectDataset(null);
  }

  function openCreate() {
    newName = '';
    newDescription = '';
    newSourceType = 'upload';
    newFormat = 'csv';
    createOpen = true;
  }

  function closeCreate() {
    createOpen = false;
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    creating = true;
    const slug = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await datasetsStore.createDataset({
      name: newName.trim(),
      slug,
      description: newDescription.trim() || undefined,
      source_type: newSourceType,
      format: newFormat,
      workspace_id: workspaceStore.activeWorkspaceId ?? undefined,
    });
    creating = false;
    closeCreate();
  }

  async function handleRefresh(ds: Dataset) {
    await datasetsStore.refreshDataset(ds.id);
  }

  async function handleDelete(ds: Dataset) {
    await datasetsStore.deleteDataset(ds.id);
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  }

  function formatRows(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  }

  function formatTotalRows(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }

  function formatRelativeTime(iso: string | null): string {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function sourceLabel(t: DatasetSourceType): string {
    const map: Record<DatasetSourceType, string> = {
      upload: 'Upload',
      api: 'API',
      database: 'Database',
      agent_generated: 'Agent',
      stream: 'Stream',
    };
    return map[t] ?? t;
  }

  function formatLabel(f: Dataset['format']): string {
    return f.toUpperCase();
  }

  function agentName(agentId: string): string {
    const agent = agentsStore.agents.find((a) => a.id === agentId);
    return agent?.display_name ?? agent?.name ?? agentId.slice(0, 12);
  }

  // Source filter pills config
  const filterPills: Array<{ value: SourceFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'upload', label: 'Upload' },
    { value: 'api', label: 'API' },
    { value: 'database', label: 'Database' },
    { value: 'agent_generated', label: 'Agent Generated' },
    { value: 'stream', label: 'Stream' },
  ];
</script>

<PageShell title="Datasets" badge={datasetsStore.totalCount || undefined}>
  {#snippet actions()}
    <button
      class="ds-new-btn"
      onclick={openCreate}
      aria-label="Register new dataset"
      type="button"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      New Dataset
    </button>
  {/snippet}

  {#if datasetsStore.loading && datasetsStore.datasets.length === 0}
    <div class="ds-loading" aria-label="Loading datasets">
      <LoadingSpinner label="Loading datasets…" />
    </div>
  {:else}
    <!-- Stats row -->
    <div class="ds-stats" role="region" aria-label="Dataset statistics">
      <div class="ds-stat">
        <span class="ds-stat-value">{datasetsStore.totalCount}</span>
        <span class="ds-stat-label">Datasets</span>
      </div>
      <div class="ds-stat-divider" aria-hidden="true"></div>
      <div class="ds-stat">
        <span class="ds-stat-value">{formatTotalRows(datasetsStore.totalRows)}</span>
        <span class="ds-stat-label">Total Rows</span>
      </div>
      <div class="ds-stat-divider" aria-hidden="true"></div>
      <div class="ds-stat">
        <span class="ds-stat-value">{formatBytes(datasetsStore.totalSize)}</span>
        <span class="ds-stat-label">Total Size</span>
      </div>
      <div class="ds-stat-divider" aria-hidden="true"></div>
      <div class="ds-stat">
        <span class="ds-stat-value">{datasetsStore.activeCount}</span>
        <span class="ds-stat-label">Active</span>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="ds-filter-bar" role="toolbar" aria-label="Filter datasets">
      <div class="ds-pills" role="group" aria-label="Filter by source type">
        {#each filterPills as pill (pill.value)}
          <button
            class="ds-pill"
            class:ds-pill--active={activeFilter === pill.value}
            onclick={() => { activeFilter = pill.value; }}
            type="button"
            aria-pressed={activeFilter === pill.value}
          >
            {pill.label}
            {#if pill.value !== 'all' && datasetsStore.bySourceType[pill.value]}
              <span class="ds-pill-count">{datasetsStore.bySourceType[pill.value]}</span>
            {/if}
          </button>
        {/each}
      </div>
      <div class="ds-search-wrap">
        <svg class="ds-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          class="ds-search"
          type="search"
          placeholder="Search datasets…"
          bind:value={searchQuery}
          aria-label="Search datasets"
        />
      </div>
    </div>

    <!-- Two-panel layout: catalog + detail -->
    <div class="ds-layout">
      <!-- LEFT: catalog grid -->
      <div class="ds-catalog" role="list" aria-label="Datasets catalog">
        {#if filteredDatasets().length === 0}
          <div class="ds-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.657-4.03 3-9 3s-9-1.343-9-3" />
              <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
            </svg>
            <p class="ds-empty-title">No datasets found</p>
            <p class="ds-empty-sub">
              {searchQuery ? 'Try a different search.' : 'Register a dataset to get started.'}
            </p>
          </div>
        {:else}
          {#each filteredDatasets() as ds (ds.id)}
            <button
              class="ds-card"
              class:ds-card--selected={datasetsStore.selectedDataset?.id === ds.id}
              onclick={() => selectDataset(ds)}
              type="button"
              role="listitem"
              aria-pressed={datasetsStore.selectedDataset?.id === ds.id}
            >
              <!-- Card header -->
              <div class="ds-card-header">
                <div class="ds-card-title-row">
                  <span class="ds-card-name">{ds.name}</span>
                  <span class="ds-status-dot ds-status-dot--{ds.status}" aria-label="Status: {ds.status}"></span>
                </div>
                <div class="ds-badges">
                  <span class="ds-badge ds-badge--source ds-badge--{ds.source_type}">
                    {sourceLabel(ds.source_type)}
                  </span>
                  <span class="ds-badge ds-badge--format">
                    {formatLabel(ds.format)}
                  </span>
                </div>
              </div>

              <!-- Description -->
              {#if ds.description}
                <p class="ds-card-desc">{ds.description}</p>
              {/if}

              <!-- Stats row -->
              <div class="ds-card-stats">
                <span class="ds-card-stat">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  {formatRows(ds.row_count)} rows
                </span>
                <span class="ds-card-stat">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                  </svg>
                  {formatBytes(ds.size_bytes)}
                </span>
              </div>

              <!-- Schema column preview -->
              {#if ds.schema_definition?.columns?.length}
                <div class="ds-schema-preview" aria-label="Column types">
                  {#each ds.schema_definition.columns.slice(0, 4) as col (col.name)}
                    <span class="ds-col-pill" title="{col.name}: {col.type}">{col.name}</span>
                  {/each}
                  {#if ds.schema_definition.columns.length > 4}
                    <span class="ds-col-more">+{ds.schema_definition.columns.length - 4}</span>
                  {/if}
                </div>
              {/if}

              <!-- Tags -->
              {#if ds.tags.length > 0}
                <div class="ds-tag-row">
                  {#each ds.tags.slice(0, 4) as tag (tag)}
                    <span class="ds-tag">{tag}</span>
                  {/each}
                </div>
              {/if}

              <!-- Footer -->
              <div class="ds-card-footer">
                <span class="ds-card-refreshed">
                  {formatRelativeTime(ds.last_refreshed_at)}
                </span>
                <span class="ds-status-label ds-status-label--{ds.status}">
                  {ds.status}
                </span>
              </div>
            </button>
          {/each}
        {/if}
      </div>

      <!-- RIGHT: detail panel -->
      <div class="ds-detail">
        {#if !datasetsStore.selectedDataset}
          <div class="ds-detail-empty">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.657-4.03 3-9 3s-9-1.343-9-3" />
              <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
            </svg>
            <p>Select a dataset to inspect it</p>
          </div>
        {:else}
          {@const ds = datasetsStore.selectedDataset}
          <div class="ds-detail-inner">
            <!-- Detail header -->
            <div class="ds-detail-header">
              <div class="ds-detail-title-row">
                <h2 class="ds-detail-title">{ds.name}</h2>
                <button
                  class="ds-close-btn"
                  onclick={closeDetail}
                  type="button"
                  aria-label="Close detail panel"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="ds-detail-meta">
                <span class="ds-badge ds-badge--source ds-badge--{ds.source_type}">{sourceLabel(ds.source_type)}</span>
                <span class="ds-badge ds-badge--format">{formatLabel(ds.format)}</span>
                <span class="ds-status-label ds-status-label--{ds.status}">{ds.status}</span>
              </div>
              {#if ds.description}
                <p class="ds-detail-desc">{ds.description}</p>
              {/if}
              <div class="ds-detail-kv">
                <div class="ds-kv">
                  <span class="ds-kv-key">Rows</span>
                  <span class="ds-kv-value">{ds.row_count.toLocaleString()}</span>
                </div>
                <div class="ds-kv">
                  <span class="ds-kv-key">Size</span>
                  <span class="ds-kv-value">{formatBytes(ds.size_bytes)}</span>
                </div>
                <div class="ds-kv">
                  <span class="ds-kv-key">Last refresh</span>
                  <span class="ds-kv-value">{formatRelativeTime(ds.last_refreshed_at)}</span>
                </div>
                {#if ds.refresh_schedule}
                  <div class="ds-kv">
                    <span class="ds-kv-key">Schedule</span>
                    <span class="ds-kv-value ds-kv-code">{ds.refresh_schedule}</span>
                  </div>
                {/if}
              </div>
              <div class="ds-detail-actions">
                <button
                  class="ds-btn ds-btn--primary"
                  onclick={() => handleRefresh(ds)}
                  type="button"
                  aria-label="Refresh dataset"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button
                  class="ds-btn ds-btn--danger"
                  onclick={() => handleDelete(ds)}
                  type="button"
                  aria-label="Delete dataset"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Schema table -->
            {#if ds.schema_definition?.columns?.length}
              <section class="ds-section" aria-labelledby="ds-schema-heading">
                <h3 id="ds-schema-heading" class="ds-section-title">Schema</h3>
                <div class="ds-schema-table-wrap">
                  <table class="ds-schema-table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Nullable</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each ds.schema_definition.columns as col (col.name)}
                        <tr>
                          <td class="ds-col-name">{col.name}</td>
                          <td><span class="ds-type-badge">{col.type}</span></td>
                          <td class="ds-nullable">{col.nullable ? 'Yes' : 'No'}</td>
                          <td class="ds-col-desc">{col.description ?? '—'}</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </section>
            {/if}

            <!-- Data preview -->
            <section class="ds-section" aria-labelledby="ds-preview-heading">
              <h3 id="ds-preview-heading" class="ds-section-title">
                Preview
                <span class="ds-section-sub">(first {Math.min(datasetsStore.preview.length, 10)} rows)</span>
              </h3>
              {#if datasetsStore.previewLoading}
                <div class="ds-preview-loading">
                  <LoadingSpinner label="Loading preview…" />
                </div>
              {:else if datasetsStore.preview.length === 0}
                <p class="ds-preview-empty">No preview data available.</p>
              {:else}
                {@const cols = ds.schema_definition?.columns ?? []}
                {@const rows = datasetsStore.preview.slice(0, 10)}
                <div class="ds-preview-wrap">
                  <table class="ds-preview-table">
                    <thead>
                      <tr>
                        {#each cols as col (col.name)}
                          <th>{col.name}</th>
                        {/each}
                      </tr>
                    </thead>
                    <tbody>
                      {#each rows as row, i (i)}
                        <tr>
                          {#each cols as col (col.name)}
                            <td>{row[col.name] ?? '—'}</td>
                          {/each}
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                <p class="ds-preview-count">
                  Showing {rows.length} of {datasetsStore.previewTotal.toLocaleString()} rows
                </p>
              {/if}
            </section>

            <!-- Access control -->
            <section class="ds-section" aria-labelledby="ds-access-heading">
              <h3 id="ds-access-heading" class="ds-section-title">Agent Access</h3>
              {#if ds.access_agents.length === 0}
                <p class="ds-access-empty">No agents have been granted access.</p>
              {:else}
                <ul class="ds-access-list">
                  {#each ds.access_agents as agentId (agentId)}
                    <li class="ds-access-item">
                      <span class="ds-access-agent">
                        <span class="ds-access-dot" aria-hidden="true"></span>
                        {agentName(agentId)}
                      </span>
                      <button
                        class="ds-access-revoke"
                        onclick={() => datasetsStore.revokeAccess(ds.id, agentId)}
                        type="button"
                        aria-label="Revoke access for {agentName(agentId)}"
                      >
                        Revoke
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>

            <!-- Tags -->
            {#if ds.tags.length > 0}
              <section class="ds-section" aria-labelledby="ds-tags-heading">
                <h3 id="ds-tags-heading" class="ds-section-title">Tags</h3>
                <div class="ds-tag-row">
                  {#each ds.tags as tag (tag)}
                    <span class="ds-tag">{tag}</span>
                  {/each}
                </div>
              </section>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</PageShell>

<!-- Create Dataset Dialog -->
{#if createOpen}
  <div
    class="ds-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ds-create-title"
  >
    <div class="ds-modal" onclick={(e) => e.stopPropagation()}>
      <div class="ds-modal-header">
        <h2 id="ds-create-title" class="ds-modal-title">New Dataset</h2>
        <button
          class="ds-modal-close"
          onclick={closeCreate}
          type="button"
          aria-label="Close dialog"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="ds-modal-body">
        <div class="ds-field">
          <label class="ds-label" for="ds-new-name">Name</label>
          <input
            id="ds-new-name"
            class="ds-input"
            type="text"
            placeholder="e.g. Customer Interactions"
            bind:value={newName}
            onkeydown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          />
        </div>

        <div class="ds-field">
          <label class="ds-label" for="ds-new-desc">Description</label>
          <textarea
            id="ds-new-desc"
            class="ds-input ds-textarea"
            placeholder="What does this dataset contain?"
            bind:value={newDescription}
            rows="2"
          ></textarea>
        </div>

        <div class="ds-field-row">
          <div class="ds-field">
            <label class="ds-label" for="ds-new-source">Source Type</label>
            <select id="ds-new-source" class="ds-input ds-select" bind:value={newSourceType}>
              <option value="upload">Upload</option>
              <option value="api">API</option>
              <option value="database">Database</option>
              <option value="agent_generated">Agent Generated</option>
              <option value="stream">Stream</option>
            </select>
          </div>

          <div class="ds-field">
            <label class="ds-label" for="ds-new-format">Format</label>
            <select id="ds-new-format" class="ds-input ds-select" bind:value={newFormat}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="parquet">Parquet</option>
              <option value="sql">SQL</option>
              <option value="api">API</option>
            </select>
          </div>
        </div>
      </div>

      <div class="ds-modal-footer">
        <button class="ds-btn" onclick={closeCreate} type="button">Cancel</button>
        <button
          class="ds-btn ds-btn--primary"
          onclick={handleCreate}
          disabled={!newName.trim() || creating}
          type="button"
        >
          {creating ? 'Creating…' : 'Create dataset'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
/* ── Loading ─────────────────────────────────────────────────────────────── */
.ds-loading {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

/* ── Stats row ───────────────────────────────────────────────────────────── */
.ds-stats {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  margin-bottom: 0.875rem;
  flex-shrink: 0;
}

.ds-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  flex: 1;
}

.ds-stat-value {
  font-size: 1.0625rem;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  line-height: 1;
}

.ds-stat-label {
  font-size: 0.6875rem;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ds-stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(255,255,255,0.07);
  flex-shrink: 0;
  margin: 0 1rem;
}

/* ── Filter bar ──────────────────────────────────────────────────────────── */
.ds-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.ds-pills {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.ds-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.3rem 0.625rem;
  border-radius: 99px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  white-space: nowrap;
}

.ds-pill:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.7);
}

.ds-pill--active {
  background: rgba(99,102,241,0.18);
  border-color: rgba(99,102,241,0.4);
  color: #a5b4fc;
}

.ds-pill-count {
  font-size: 0.625rem;
  background: rgba(255,255,255,0.1);
  border-radius: 99px;
  padding: 0 0.35rem;
  line-height: 1.6;
}

.ds-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 0.3rem 0.625rem;
  margin-left: auto;
}

.ds-search-icon {
  color: rgba(255,255,255,0.3);
  flex-shrink: 0;
}

.ds-search {
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255,255,255,0.85);
  font-size: 0.75rem;
  width: 180px;
}

.ds-search::placeholder {
  color: rgba(255,255,255,0.3);
}

/* ── Two-panel layout ────────────────────────────────────────────────────── */
.ds-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  flex: 1;
}

/* ── Catalog ─────────────────────────────────────────────────────────────── */
.ds-catalog {
  overflow-y: auto;
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.625rem;
  align-content: start;
  border-right: 1px solid rgba(255,255,255,0.07);
}

.ds-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem;
  color: rgba(255,255,255,0.35);
  text-align: center;
}

.ds-empty-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  margin: 0;
}

.ds-empty-sub {
  font-size: 0.75rem;
  margin: 0;
}

/* ── Dataset card ────────────────────────────────────────────────────────── */
.ds-card {
  width: 100%;
  text-align: left;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 0.875rem;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  color: rgba(255,255,255,0.85);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ds-card:hover {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.12);
}

.ds-card--selected {
  background: rgba(99,102,241,0.1);
  border-color: rgba(99,102,241,0.35);
}

.ds-card-header {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.ds-card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.ds-card-name {
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ds-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ds-status-dot--active     { background: #4ade80; box-shadow: 0 0 4px rgba(74,222,128,0.4); }
.ds-status-dot--processing { background: #60a5fa; box-shadow: 0 0 4px rgba(96,165,250,0.4); }
.ds-status-dot--stale      { background: #fbbf24; }
.ds-status-dot--archived   { background: rgba(255,255,255,0.2); }

.ds-badges {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.ds-badge {
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.15em 0.45em;
  border-radius: 4px;
}

.ds-badge--format {
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.5);
}

.ds-badge--source.ds-badge--upload         { background: rgba(99,102,241,0.15); color: #a5b4fc; }
.ds-badge--source.ds-badge--api            { background: rgba(34,197,94,0.12);  color: #4ade80; }
.ds-badge--source.ds-badge--database       { background: rgba(251,191,36,0.12); color: #fbbf24; }
.ds-badge--source.ds-badge--agent_generated { background: rgba(168,85,247,0.15); color: #c084fc; }
.ds-badge--source.ds-badge--stream         { background: rgba(59,130,246,0.15); color: #60a5fa; }

.ds-card-desc {
  font-size: 0.6875rem;
  color: rgba(255,255,255,0.45);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.ds-card-stats {
  display: flex;
  gap: 0.75rem;
}

.ds-card-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: rgba(255,255,255,0.4);
}

.ds-schema-preview {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.ds-col-pill {
  font-size: 0.5625rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px;
  padding: 0.1em 0.4em;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.ds-col-more {
  font-size: 0.5625rem;
  color: rgba(255,255,255,0.3);
  padding: 0.1em 0.25em;
  align-self: center;
}

.ds-tag-row {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.ds-tag {
  font-size: 0.5625rem;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2);
  color: #a5b4fc;
  border-radius: 4px;
  padding: 0.1em 0.4em;
}

.ds-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.125rem;
}

.ds-card-refreshed {
  font-size: 0.625rem;
  color: rgba(255,255,255,0.3);
}

.ds-status-label {
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ds-status-label--active     { color: #4ade80; }
.ds-status-label--processing { color: #60a5fa; }
.ds-status-label--stale      { color: #fbbf24; }
.ds-status-label--archived   { color: rgba(255,255,255,0.3); }

/* ── Detail panel ────────────────────────────────────────────────────────── */
.ds-detail {
  overflow-y: auto;
  background: rgba(255,255,255,0.01);
}

.ds-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 100%;
  color: rgba(255,255,255,0.3);
  font-size: 0.8125rem;
  padding: 3rem;
  text-align: center;
}

.ds-detail-inner {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
}

.ds-detail-header {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.ds-detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.ds-detail-title {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  margin: 0;
}

.ds-close-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.12s;
}

.ds-close-btn:hover {
  color: rgba(255,255,255,0.6);
}

.ds-detail-meta {
  display: flex;
  gap: 0.375rem;
  align-items: center;
  flex-wrap: wrap;
}

.ds-detail-desc {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.5);
  margin: 0;
  line-height: 1.5;
}

.ds-detail-kv {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem 1rem;
}

.ds-kv {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.ds-kv-key {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255,255,255,0.35);
}

.ds-kv-value {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.75);
}

.ds-kv-code {
  font-family: monospace;
  font-size: 0.6875rem;
  color: #a5b4fc;
}

.ds-detail-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.125rem;
}

/* ── Sections ────────────────────────────────────────────────────────────── */
.ds-section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 1rem;
}

.ds-section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(255,255,255,0.4);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ds-section-sub {
  font-size: 0.625rem;
  color: rgba(255,255,255,0.25);
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
}

/* ── Schema table ────────────────────────────────────────────────────────── */
.ds-schema-table-wrap {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.07);
}

.ds-schema-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.6875rem;
}

.ds-schema-table th {
  text-align: left;
  padding: 0.4rem 0.625rem;
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.ds-schema-table td {
  padding: 0.375rem 0.625rem;
  color: rgba(255,255,255,0.7);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.ds-schema-table tr:last-child td {
  border-bottom: none;
}

.ds-col-name {
  font-weight: 600;
  color: rgba(255,255,255,0.85);
}

.ds-type-badge {
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(99,102,241,0.12);
  color: #a5b4fc;
  padding: 0.1em 0.4em;
  border-radius: 4px;
}

.ds-nullable {
  color: rgba(255,255,255,0.4);
}

.ds-col-desc {
  color: rgba(255,255,255,0.4);
  max-width: 180px;
}

/* ── Preview table ───────────────────────────────────────────────────────── */
.ds-preview-loading {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}

.ds-preview-empty {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.35);
  margin: 0;
}

.ds-preview-wrap {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.07);
  max-height: 200px;
  overflow-y: auto;
}

.ds-preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.6875rem;
}

.ds-preview-table th {
  text-align: left;
  padding: 0.35rem 0.5rem;
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  position: sticky;
  top: 0;
  white-space: nowrap;
}

.ds-preview-table td {
  padding: 0.3rem 0.5rem;
  color: rgba(255,255,255,0.65);
  border-bottom: 1px solid rgba(255,255,255,0.03);
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ds-preview-table tr:last-child td {
  border-bottom: none;
}

.ds-preview-count {
  font-size: 0.6rem;
  color: rgba(255,255,255,0.3);
  margin: 0;
}

/* ── Access control ──────────────────────────────────────────────────────── */
.ds-access-empty {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.35);
  margin: 0;
}

.ds-access-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ds-access-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.5rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px;
}

.ds-access-agent {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.75);
}

.ds-access-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}

.ds-access-revoke {
  font-size: 0.625rem;
  color: #f87171;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.15rem 0.375rem;
  border-radius: 4px;
  transition: background 0.12s;
}

.ds-access-revoke:hover {
  background: rgba(248,113,113,0.1);
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.ds-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.ds-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.16);
}

.ds-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ds-btn--primary {
  background: rgba(99,102,241,0.2);
  border-color: rgba(99,102,241,0.4);
  color: #a5b4fc;
}

.ds-btn--primary:hover:not(:disabled) {
  background: rgba(99,102,241,0.3);
}

.ds-btn--danger {
  color: #f87171;
  border-color: rgba(248,113,113,0.2);
}

.ds-btn--danger:hover:not(:disabled) {
  background: rgba(248,113,113,0.08);
}

.ds-new-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(99,102,241,0.35);
  background: rgba(99,102,241,0.12);
  color: #a5b4fc;
  cursor: pointer;
  transition: background 0.12s;
}

.ds-new-btn:hover {
  background: rgba(99,102,241,0.22);
}

/* ── Modal ───────────────────────────────────────────────────────────────── */
.ds-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(2px);
}

.ds-modal {
  background: var(--color-surface-elevated, #1a1d2e);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  width: 440px;
  max-width: calc(100vw - 2rem);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
}

.ds-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.875rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.ds-modal-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  margin: 0;
}

.ds-modal-close {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.12s;
  display: flex;
  align-items: center;
}

.ds-modal-close:hover {
  color: rgba(255,255,255,0.7);
}

.ds-modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ds-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.ds-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
}

.ds-field-row {
  display: flex;
  gap: 0.75rem;
}

.ds-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
}

.ds-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: rgba(255,255,255,0.85);
  font-size: 0.8125rem;
  padding: 0.5rem 0.75rem;
  width: 100%;
  outline: none;
  transition: border-color 0.12s;
  box-sizing: border-box;
}

.ds-input:focus {
  border-color: rgba(99,102,241,0.5);
}

.ds-textarea {
  resize: vertical;
  min-height: 56px;
}

.ds-select {
  appearance: none;
  cursor: pointer;
}
</style>
