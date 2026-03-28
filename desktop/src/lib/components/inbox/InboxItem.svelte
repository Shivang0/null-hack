<!-- src/lib/components/inbox/InboxItem.svelte -->
<!-- Single inbox notification item -->
<script lang="ts">
  import type { InboxItem, InboxAction } from '$api/types';
  import { inboxStore } from '$lib/stores/inbox.svelte';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';

  interface Props {
    item: InboxItem;
    onAction?: (itemId: string, actionId: string) => void;
  }

  let { item, onAction }: Props = $props();

  // SVG icon paths per type
  const TYPE_ICONS: Record<string, { path: string; color: string }> = {
    approval: {
      path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      color: '#3b82f6',
    },
    alert: {
      path: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
      color: '#f59e0b',
    },
    mention: {
      path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
      color: '#8b5cf6',
    },
    failure: {
      path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: '#ef4444',
    },
    report: {
      path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'rgba(34, 197, 94, 0.7)',
    },
    budget_warning: {
      path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: '#f97316',
    },
  };

  const ACTION_VARIANTS: Record<string, string> = {
    approve:     '#e2e8f0',
    reject:      '#ef4444',
    acknowledge: '#3b82f6',
    snooze:      '#f59e0b',
    navigate:    '#a0a0a0',
  };

  let typeIcon = $derived(TYPE_ICONS[item.type] ?? TYPE_ICONS.alert);
  let isUnread = $derived(item.status === 'unread');
  let isActioned = $derived(item.status === 'actioned' || item.status === 'dismissed');

  function handleClick() {
    inboxStore.selectItem(item);
  }

  function handleAction(action: InboxAction, e: MouseEvent) {
    e.stopPropagation();
    onAction?.(item.id, action.id);
    inboxStore.performAction(item.id, action.id);
  }
</script>

<article
  class="ii-item"
  class:ii-item--unread={isUnread}
  class:ii-item--actioned={isActioned}
  class:ii-item--selected={inboxStore.selected?.id === item.id}
  onclick={handleClick}
  onkeydown={(e) => e.key === 'Enter' && handleClick()}
  tabindex="0"
  role="button"
  aria-label="{item.type} notification: {item.title}{isUnread ? ' (unread)' : ''}"
  aria-pressed={inboxStore.selected?.id === item.id}
>
  <!-- Type icon -->
  <div
    class="ii-icon"
    style="background: {typeIcon.color}18; color: {typeIcon.color}"
    aria-hidden="true"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
      <path d={typeIcon.path} />
    </svg>
  </div>

  <!-- Content -->
  <div class="ii-body">
    <div class="ii-header">
      <span class="ii-title" class:ii-title--unread={isUnread}>{item.title}</span>
      <TimeAgo date={item.created_at} />
    </div>

    <p class="ii-text">{item.body}</p>

    {#if item.source_agent}
      <div class="ii-source" aria-label="From {item.source_agent}">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        {item.source_agent}
      </div>
    {/if}

    <!-- Actions -->
    {#if item.actions.length > 0 && !isActioned}
      <div class="ii-actions" role="group" aria-label="Actions for {item.title}">
        {#each item.actions as action (action.id)}
          <button
            class="ii-action-btn"
            style="color: {ACTION_VARIANTS[action.type] ?? '#a0a0a0'}"
            onclick={(e) => handleAction(action, e)}
            aria-label="{action.label} for {item.title}"
            type="button"
          >
            {action.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Unread indicator -->
  {#if isUnread}
    <div class="ii-unread-dot" aria-hidden="true" title="Unread"></div>
  {/if}
</article>

<style>
  .ii-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-default);
    cursor: pointer;
    transition: background 100ms ease;
    position: relative;
  }

  .ii-item:hover { background: rgba(255,255,255,0.03); }

  .ii-item--selected { background: rgba(59,130,246,0.06); }

  .ii-item--actioned {
    opacity: 0.55;
  }

  .ii-item:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: -2px;
  }

  .ii-icon {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .ii-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ii-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .ii-title {
    font-size: 13px;
    font-weight: 400;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .ii-title--unread {
    font-weight: 600;
    color: var(--text-primary);
  }

  .ii-text {
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1.5;
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .ii-source {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .ii-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .ii-action-btn {
    font-size: 11px;
    font-weight: 600;
    font-family: inherit;
    background: none;
    border: none;
    padding: 3px 8px;
    border-radius: var(--radius-xs);
    cursor: pointer;
    background: rgba(255,255,255,0.06);
    transition: background 100ms ease, opacity 100ms ease;
  }
  .ii-action-btn:hover { background: rgba(255,255,255,0.1); }
  .ii-action-btn:focus-visible { outline: 2px solid var(--accent-primary); }

  .ii-unread-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-primary);
    flex-shrink: 0;
    margin-top: 6px;
  }
</style>
