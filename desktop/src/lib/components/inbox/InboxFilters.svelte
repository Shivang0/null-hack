<!-- src/lib/components/inbox/InboxFilters.svelte -->
<!-- Filter bar for inbox: type, status, and mark-all-read -->
<script lang="ts">
  import type { InboxItemType, InboxItemStatus } from '$api/types';
  import { inboxStore } from '$lib/stores/inbox.svelte';

  const TYPE_FILTERS: { value: InboxItemType | 'all'; label: string }[] = [
    { value: 'all',            label: 'All'            },
    { value: 'approval',       label: 'Approvals'      },
    { value: 'alert',          label: 'Alerts'         },
    { value: 'mention',        label: 'Mentions'       },
    { value: 'failure',        label: 'Failures'       },
    { value: 'report',         label: 'Reports'        },
    { value: 'budget_warning', label: 'Budget'         },
  ];

  const STATUS_FILTERS: { value: InboxItemStatus | 'all'; label: string }[] = [
    { value: 'all',    label: 'All'    },
    { value: 'unread', label: 'Unread' },
    { value: 'read',   label: 'Read'   },
  ];
</script>

<div class="inf-bar" role="toolbar" aria-label="Inbox filter controls">
  <!-- Type filter pills -->
  <nav class="inf-types" role="group" aria-label="Filter by type">
    {#each TYPE_FILTERS as f (f.value)}
      <button
        class="inf-pill"
        class:inf-pill--active={inboxStore.filterType === f.value}
        onclick={() => { inboxStore.filterType = f.value; }}
        aria-label="Show {f.label}"
        aria-pressed={inboxStore.filterType === f.value}
        type="button"
      >
        {f.label}
        {#if f.value !== 'all'}
          {@const count = inboxStore.items.filter(i => i.type === f.value && i.status === 'unread').length}
          {#if count > 0}
            <span class="inf-count" aria-label="{count} unread">{count}</span>
          {/if}
        {:else}
          {#if inboxStore.unreadCount > 0}
            <span class="inf-count" aria-label="{inboxStore.unreadCount} unread">{inboxStore.unreadCount}</span>
          {/if}
        {/if}
      </button>
    {/each}
  </nav>

  <div class="inf-spacer" aria-hidden="true"></div>

  <!-- Status filter -->
  <select
    class="inf-select"
    bind:value={inboxStore.filterStatus}
    aria-label="Filter by read status"
  >
    {#each STATUS_FILTERS as f (f.value)}
      <option value={f.value}>{f.label}</option>
    {/each}
  </select>

  <!-- Mark all read -->
  {#if inboxStore.unreadCount > 0}
    <button
      class="inf-mark-all"
      onclick={() => inboxStore.markAllRead()}
      aria-label="Mark all {inboxStore.unreadCount} items as read"
      type="button"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      Mark all read
    </button>
  {/if}
</div>

<style>
  .inf-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 0 12px 0;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .inf-types {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .inf-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid var(--border-default);
    border-radius: 9999px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background 100ms, border-color 100ms, color 100ms;
    white-space: nowrap;
  }

  .inf-pill:hover {
    background: rgba(255,255,255,0.06);
    border-color: var(--border-hover);
  }

  .inf-pill--active {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.35);
    color: #93c5fd;
  }

  .inf-pill:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 1px;
  }

  .inf-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 9999px;
    background: var(--accent-primary);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
  }

  .inf-spacer { flex: 1; }

  .inf-select {
    height: 28px;
    padding: 0 8px 0 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 150ms ease;
  }
  .inf-select:hover { border-color: var(--border-hover); }
  .inf-select:focus-visible { outline: 2px solid var(--accent-primary); }

  .inf-mark-all {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: background 100ms, color 100ms;
    white-space: nowrap;
  }
  .inf-mark-all:hover { background: rgba(59,130,246,0.08); color: #93c5fd; border-color: rgba(59,130,246,0.25); }
  .inf-mark-all:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 1px; }
</style>
