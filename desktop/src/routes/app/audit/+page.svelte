<!-- src/routes/app/audit/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { auditStore } from '$lib/stores/audit.svelte';

  onMount(() => {
    void auditStore.fetchEntries(true);
  });
</script>

<PageShell title="Audit Log" badge={auditStore.totalCount > 0 ? auditStore.totalCount : undefined}>
  {#snippet actions()}
    <input
      class="aud-search"
      type="search"
      placeholder="Search audit log…"
      value={auditStore.searchQuery}
      oninput={(e) => auditStore.setSearch((e.target as HTMLInputElement).value)}
      aria-label="Search audit log"
    />
  {/snippet}

  {#if auditStore.loading && auditStore.entries.length === 0}
    <div class="aud-loading" role="status" aria-live="polite">
      <div class="aud-spinner" aria-hidden="true"></div>
      <span>Loading audit log…</span>
    </div>
  {:else if auditStore.error && auditStore.entries.length === 0}
    <div class="aud-error" role="alert">
      <p>Failed to load audit log: {auditStore.error}</p>
      <button onclick={() => void auditStore.fetchEntries(true)}>Retry</button>
    </div>
  {:else if auditStore.filteredEntries.length === 0}
    <div class="aud-empty" role="status">
      <p>{auditStore.searchQuery ? 'No entries match your search.' : 'No audit entries yet.'}</p>
    </div>
  {:else}
    <div class="aud-table" role="table" aria-label="Audit log">
      <div class="aud-thead" role="rowgroup">
        <div class="aud-tr aud-tr--head" role="row">
          <div class="aud-th" role="columnheader">Time</div>
          <div class="aud-th" role="columnheader">Actor</div>
          <div class="aud-th" role="columnheader">Action</div>
          <div class="aud-th" role="columnheader">Entity</div>
          <div class="aud-th" role="columnheader">IP</div>
        </div>
      </div>
      <div class="aud-tbody" role="rowgroup">
        {#each auditStore.filteredEntries as entry (entry.id)}
          <div class="aud-tr" role="row">
            <div class="aud-td" role="cell">
              <span class="aud-time">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
            <div class="aud-td" role="cell">
              <span class="aud-actor">{entry.actor}</span>
              <span class="aud-actor-type">{entry.actor_type}</span>
            </div>
            <div class="aud-td" role="cell">
              <span class="aud-action">{entry.action}</span>
            </div>
            <div class="aud-td" role="cell">
              <span class="aud-entity">{entry.entity_type}</span>
              <span class="aud-entity-id">{entry.entity_id}</span>
            </div>
            <div class="aud-td" role="cell">
              <span class="aud-ip">{entry.ip_address ?? '—'}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    {#if auditStore.hasMore}
      <div class="aud-load-more">
        <button
          class="aud-load-btn"
          onclick={() => void auditStore.fetchEntries(false)}
          disabled={auditStore.loading}
          aria-label="Load more audit entries"
        >
          {auditStore.loading ? 'Loading…' : 'Load more'}
        </button>
      </div>
    {/if}
  {/if}
</PageShell>

<style>
  .aud-search {
    height: 28px; padding: 0 10px; border-radius: 6px; font-size: 12px;
    background: var(--dbg2); border: 1px solid var(--dbd); color: var(--dt); min-width: 200px;
  }
  .aud-search:focus { outline: none; border-color: #6366f1; }
  .aud-loading, .aud-empty, .aud-error {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 200px;
    color: var(--dt3); font-size: 13px;
  }
  .aud-spinner {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid var(--dbd); border-top-color: var(--dt2);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .aud-table { padding: 0 24px 24px; width: 100%; }
  .aud-tr { display: grid; grid-template-columns: 160px 160px 1fr 160px 120px; gap: 0; }
  .aud-tr--head { padding: 8px 12px; }
  .aud-th { font-size: 11px; font-weight: 500; color: var(--dt3); text-transform: uppercase; letter-spacing: 0.05em; }
  .aud-tbody .aud-tr {
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 6px;
    margin-bottom: 4px; padding: 10px 12px; align-items: start;
  }
  .aud-tbody .aud-tr:hover { background: var(--dbg3); }
  .aud-td { font-size: 12px; color: var(--dt2); display: flex; flex-direction: column; gap: 2px; }
  .aud-time { font-size: 11px; color: var(--dt4); }
  .aud-actor { color: var(--dt); font-weight: 500; }
  .aud-actor-type { font-size: 10px; color: var(--dt4); text-transform: uppercase; }
  .aud-action { color: var(--dt); font-family: var(--font-mono); }
  .aud-entity { color: var(--dt3); font-size: 11px; }
  .aud-entity-id { font-size: 10px; color: var(--dt4); font-family: var(--font-mono); }
  .aud-ip { font-size: 11px; color: var(--dt4); font-family: var(--font-mono); }
  .aud-load-more { padding: 0 24px 24px; display: flex; justify-content: center; }
  .aud-load-btn {
    padding: 8px 20px; border-radius: 6px; font-size: 13px; cursor: pointer;
    border: 1px solid var(--dbd); background: var(--dbg2); color: var(--dt2);
    transition: all 120ms ease;
  }
  .aud-load-btn:hover:not(:disabled) { background: var(--dbg3); border-color: var(--dbd2); }
  .aud-load-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
