<!-- src/lib/components/inbox/InboxFeed.svelte -->
<!-- Scrollable inbox feed grouped by date -->
<script lang="ts">
  import type { InboxItem as InboxItemType } from '$api/types';
  import { inboxStore } from '$lib/stores/inbox.svelte';
  import InboxItem from './InboxItem.svelte';

  interface DateGroup {
    label: string;
    items: InboxItemType[];
  }

  // Group items by relative date
  let groups = $derived.by((): DateGroup[] => {
    const items = inboxStore.filteredItems;
    if (items.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    const buckets: Record<string, InboxItemType[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': [],
    };

    for (const item of items) {
      const t = new Date(item.created_at).getTime();
      if (t >= today) buckets['Today'].push(item);
      else if (t >= yesterday) buckets['Yesterday'].push(item);
      else if (t >= weekAgo) buckets['This Week'].push(item);
      else buckets['Older'].push(item);
    }

    return Object.entries(buckets)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => ({ label, items }));
  });
</script>

<div class="ifd-feed" role="feed" aria-label="Inbox notifications" aria-busy={inboxStore.loading}>
  {#if inboxStore.loading && inboxStore.items.length === 0}
    <div class="ifd-loading" role="status" aria-label="Loading inbox">
      <div class="ifd-spinner" aria-hidden="true"></div>
      <span>Loading…</span>
    </div>
  {:else if groups.length === 0}
    <div class="ifd-empty" role="status">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" class="ifd-empty-icon" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.22 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.22z" />
      </svg>
      <p>All caught up</p>
      <span>No notifications match your current filters.</span>
    </div>
  {:else}
    {#each groups as group (group.label)}
      <section class="ifd-group" aria-label="{group.label} notifications">
        <div class="ifd-group-label" role="separator" aria-label={group.label}>
          {group.label}
        </div>
        {#each group.items as item (item.id)}
          <InboxItem {item} />
        {/each}
      </section>
    {/each}
  {/if}
</div>

<style>
  .ifd-feed {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .ifd-feed::-webkit-scrollbar { width: 6px; }
  .ifd-feed::-webkit-scrollbar-track { background: transparent; }
  .ifd-feed::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }

  .ifd-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 200px;
    color: var(--text-tertiary);
    font-size: 13px;
  }

  .ifd-spinner {
    width: 22px;
    height: 22px;
    border: 2px solid var(--border-default);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: ifd-spin 0.7s linear infinite;
  }

  @keyframes ifd-spin { to { transform: rotate(360deg); } }

  .ifd-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 280px;
    text-align: center;
    padding: 0 24px;
  }

  .ifd-empty-icon { color: var(--text-muted); margin-bottom: 6px; }

  .ifd-empty p {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0;
  }

  .ifd-empty span {
    font-size: 12px;
    color: var(--text-tertiary);
    max-width: 260px;
  }

  .ifd-group {
    display: flex;
    flex-direction: column;
  }

  .ifd-group-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 10px 14px 6px;
    background: var(--bg-secondary);
    position: sticky;
    top: 0;
    z-index: 1;
    border-bottom: 1px solid var(--border-default);
  }
</style>
