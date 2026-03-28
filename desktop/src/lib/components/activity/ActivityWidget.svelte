<!-- src/lib/components/activity/ActivityWidget.svelte -->
<!-- Floating bottom-right pill widget showing last 3 events with pulse on new events -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { activityStore } from '$lib/stores/activity.svelte';
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';

  let expanded = $state(false);
  let pulsing = $state(false);
  let prevCount = $state(activityStore.events.length);

  const recentEvents = $derived(activityStore.events.slice(0, 3));

  // Watch for new events and trigger pulse animation
  $effect(() => {
    const count = activityStore.events.length;
    if (count > prevCount) {
      prevCount = count;
      pulsing = true;
      const timer = setTimeout(() => { pulsing = false; }, 1500);
      return () => clearTimeout(timer);
    } else {
      prevCount = count;
    }
  });

  const LEVEL_COLORS: Record<string, string> = {
    info:    '#3b82f6',
    success: 'rgba(34, 197, 94, 0.7)',
    warning: '#f59e0b',
    error:   '#ef4444',
  };

  function handleViewAll() {
    expanded = false;
    void goto('/app/activity');
  }
</script>

<div class="aw-container">
  {#if expanded}
    <!-- Expanded panel -->
    <div class="aw-panel" role="region" aria-label="Recent activity">
      <div class="aw-panel-header">
        <span class="aw-panel-title">Recent Activity</span>
        <div class="aw-panel-actions">
          <button
            class="aw-panel-link"
            onclick={handleViewAll}
            type="button"
          >
            View all
          </button>
          <button
            class="aw-panel-close"
            onclick={() => { expanded = false; }}
            aria-label="Close activity panel"
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="aw-panel-list" role="list">
        {#if recentEvents.length === 0}
          <p class="aw-panel-empty">No recent events</p>
        {:else}
          {#each recentEvents as event (event.id)}
            <div class="aw-panel-row" role="listitem">
              <span
                class="aw-panel-dot"
                aria-hidden="true"
                style="background: {LEVEL_COLORS[event.level] ?? '#666'}"
              ></span>
              <span class="aw-panel-text">{event.title}</span>
              <span class="aw-panel-time">
                <TimeAgo date={event.created_at} short />
              </span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Pill trigger button -->
  <button
    class="aw-pill"
    class:aw-pill--pulse={pulsing}
    class:aw-pill--active={expanded}
    onclick={() => { expanded = !expanded; }}
    aria-label="Activity feed — {activityStore.events.length} events{activityStore.errorCount > 0 ? ', ' + activityStore.errorCount + ' errors' : ''}"
    aria-expanded={expanded}
    type="button"
  >
    <!-- Activity icon -->
    <span class="aw-pill-icon" aria-hidden="true">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    </span>

    <span class="aw-pill-label">Activity</span>

    <!-- Error badge -->
    {#if activityStore.errorCount > 0}
      <span class="aw-pill-badge" aria-hidden="true">{activityStore.errorCount}</span>
    {:else if activityStore.warningCount > 0}
      <span class="aw-pill-badge aw-pill-badge--warn" aria-hidden="true">{activityStore.warningCount}</span>
    {/if}

    <!-- Live dot -->
    {#if activityStore.connected}
      <span class="aw-pill-live" aria-hidden="true" title="Live"></span>
    {/if}
  </button>
</div>

<style>
  .aw-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    pointer-events: none;
  }

  .aw-container > * {
    pointer-events: auto;
  }

  /* Expanded panel */
  .aw-panel {
    width: 320px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset;
    overflow: hidden;
    animation: aw-panel-in 150ms ease;
  }

  @keyframes aw-panel-in {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .aw-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-default);
  }

  .aw-panel-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.2px;
  }

  .aw-panel-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .aw-panel-link {
    background: none;
    border: none;
    padding: 0;
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--accent-primary);
    cursor: pointer;
    transition: color 100ms ease;
  }

  .aw-panel-link:hover {
    color: #60a5fa;
  }

  .aw-panel-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: none;
    border: none;
    padding: 0;
    color: var(--text-tertiary);
    cursor: pointer;
    border-radius: 4px;
    transition: all 100ms ease;
  }

  .aw-panel-close:hover {
    background: rgba(255,255,255,0.06);
    color: var(--text-primary);
  }

  .aw-panel-list {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }

  .aw-panel-empty {
    padding: 16px 12px;
    font-size: 12px;
    color: var(--text-tertiary);
    text-align: center;
    margin: 0;
  }

  .aw-panel-row {
    display: grid;
    grid-template-columns: 8px 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-default);
    transition: background 100ms ease;
  }

  .aw-panel-row:last-child {
    border-bottom: none;
  }

  .aw-panel-row:hover {
    background: rgba(255,255,255,0.03);
  }

  .aw-panel-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .aw-panel-text {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .aw-panel-time {
    flex-shrink: 0;
  }

  /* Pill button */
  .aw-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 9999px;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: all 150ms ease;
    position: relative;
  }

  .aw-pill:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  }

  .aw-pill--active {
    border-color: rgba(59,130,246,0.3);
    background: rgba(59,130,246,0.08);
    color: #93c5fd;
  }

  .aw-pill:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .aw-pill-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* Error/warning badge */
  .aw-pill-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 9999px;
    background: rgba(239,68,68,0.2);
    color: #fca5a5;
    font-size: 10px;
    font-weight: 600;
    border: 1px solid rgba(239,68,68,0.3);
    line-height: 1;
  }

  .aw-pill-badge--warn {
    background: rgba(234,179,8,0.2);
    color: #fde047;
    border-color: rgba(234,179,8,0.3);
  }

  /* Live dot */
  .aw-pill-live {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(34, 197, 94, 0.75);
    flex-shrink: 0;
    animation: aw-live-pulse 2s ease-out infinite;
  }

  /* Pulse animation on new event */
  .aw-pill--pulse {
    animation: aw-pill-bounce 0.4s ease;
  }

  @keyframes aw-live-pulse {
    0%, 100% { box-shadow: 0 0 0 1px rgba(34,197,94,0.3); }
    50%       { box-shadow: 0 0 0 3px rgba(34,197,94,0.1); }
  }

  @keyframes aw-pill-bounce {
    0%   { transform: translateY(0); }
    30%  { transform: translateY(-4px); }
    60%  { transform: translateY(-1px); }
    100% { transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .aw-pill-live,
    .aw-pill--pulse { animation: none; }
    .aw-panel { animation: none; }
  }
</style>
