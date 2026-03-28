<!-- src/lib/components/activity/ActivityFeed.svelte -->
<!-- Scrollable activity event list with auto-scroll and "scroll to latest" button -->
<script lang="ts">
  import { tick } from 'svelte';
  import { activityStore } from '$lib/stores/activity.svelte';
  import ActivityRow from './ActivityRow.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';

  // Scroll container ref
  let scrollEl = $state<HTMLElement | null>(null);
  let isAtBottom = $state(true);
  let prevEventCount = $state(0);

  const SCROLL_THRESHOLD = 80; // px from bottom to be considered "at bottom"

  function checkScrollPosition() {
    if (!scrollEl) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    isAtBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }

  function scrollToBottom() {
    if (!scrollEl) return;
    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
    isAtBottom = true;
  }

  // Auto-scroll when new events arrive and user is at bottom
  $effect(() => {
    const count = activityStore.filteredEvents.length;
    if (count > prevEventCount && isAtBottom) {
      prevEventCount = count;
      // Wait for DOM update then scroll
      void tick().then(() => {
        if (scrollEl && isAtBottom) {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        }
      });
    } else {
      prevEventCount = count;
    }
  });
</script>

<div class="afd-wrap">
  {#if activityStore.loading && activityStore.events.length === 0}
    <div class="afd-loading" role="status">
      <LoadingSpinner size="md" label="Loading activity..." />
    </div>
  {:else if activityStore.filteredEvents.length === 0}
    <EmptyState
      title={activityStore.searchQuery || activityStore.filterType !== 'all' || activityStore.filterLevel !== 'all' || activityStore.filterAgentId !== 'all'
        ? 'No events match your filters'
        : 'No activity yet'}
      description={activityStore.searchQuery || activityStore.filterType !== 'all' || activityStore.filterLevel !== 'all' || activityStore.filterAgentId !== 'all'
        ? 'Try adjusting your filters to see more events.'
        : 'Events will appear here as agents run tasks.'}
      icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  {:else}
    <div
      class="afd-list"
      role="list"
      aria-label="Activity events"
      aria-live="polite"
      aria-atomic="false"
      bind:this={scrollEl}
      onscroll={checkScrollPosition}
    >
      {#each activityStore.filteredEvents as event (event.id)}
        <ActivityRow {event} />
      {/each}
    </div>

    <!-- Scroll to latest button — shown when user has scrolled up -->
    {#if !isAtBottom}
      <button
        class="afd-scroll-btn"
        onclick={scrollToBottom}
        aria-label="Scroll to latest events"
        type="button"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
        Latest
      </button>
    {/if}
  {/if}
</div>

<style>
  .afd-wrap {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .afd-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    flex: 1;
  }

  .afd-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .afd-list::-webkit-scrollbar {
    width: 5px;
  }

  .afd-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .afd-list::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 3px;
  }

  .afd-list::-webkit-scrollbar-thumb:hover {
    background: var(--border-hover);
  }

  /* Scroll to latest floating button */
  .afd-scroll-btn {
    position: absolute;
    bottom: 16px;
    right: 20px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 12px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 9999px;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    transition: all 120ms ease;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .afd-scroll-btn:hover {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.3);
    color: #93c5fd;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  }

  .afd-scroll-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
