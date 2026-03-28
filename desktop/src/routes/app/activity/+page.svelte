<!-- src/routes/app/activity/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import ActivityFeed from '$lib/components/activity/ActivityFeed.svelte';
  import ActivityFilters from '$lib/components/activity/ActivityFilters.svelte';
  import { activityStore } from '$lib/stores/activity.svelte';

  onMount(() => {
    void activityStore.fetchRecent(100);
    activityStore.subscribe();
    return () => activityStore.unsubscribe();
  });
</script>

<PageShell
  title="Activity"
  subtitle="Live event stream"
  badge={activityStore.filteredEvents.length > 0 ? activityStore.filteredEvents.length : undefined}
  noPadding
>
  {#snippet actions()}
    {#if activityStore.errorCount > 0}
      <span class="act-error-badge" aria-label="{activityStore.errorCount} errors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        {activityStore.errorCount} error{activityStore.errorCount === 1 ? '' : 's'}
      </span>
    {/if}

    <button
      class="act-refresh-btn"
      onclick={() => void activityStore.fetchRecent(100)}
      aria-label="Refresh activity"
      type="button"
      disabled={activityStore.loading}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        class:act-spinning={activityStore.loading}
        aria-hidden="true"
      >
        <path d="M1 4v6h6M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      Refresh
    </button>
  {/snippet}

  <div class="act-layout">
    <ActivityFilters />
    <ActivityFeed />
  </div>
</PageShell>

<style>
  .act-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* Error badge in header actions */
  .act-error-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: var(--radius-sm);
    color: #fca5a5;
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-sans);
  }

  .act-refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 120ms ease;
  }

  .act-refresh-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.07);
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .act-refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .act-refresh-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .act-spinning {
    animation: act-spin 0.7s linear infinite;
  }

  @keyframes act-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .act-spinning { animation: none; }
  }
</style>
