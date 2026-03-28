<script lang="ts">
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';
  import { dashboardStore } from '$lib/stores/dashboard.svelte';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const MAX_EVENTS = 10;
  const events = $derived(dashboardStore.recentActivity.slice(0, MAX_EVENTS));

  type Level = 'info' | 'warning' | 'error' | 'success' | string;
  type EventType = string;

  interface DotConfig {
    color: string;
    pulse: boolean;
  }

  function levelToDot(level: Level): DotConfig {
    switch (level) {
      case 'info':    return { color: '#3b82f6', pulse: false };
      case 'warning': return { color: '#f59e0b', pulse: false };
      case 'error':   return { color: '#ef4444', pulse: true };
      case 'success': return { color: 'rgba(34, 197, 94, 0.7)', pulse: false };
      default:        return { color: '#666666', pulse: false };
    }
  }

  // Returns SVG path(s) for known event types
  function eventIconPath(type: EventType): string {
    switch (type) {
      case 'agent_spawned':
        // rocket
        return 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zm12-12a3 3 0 0 0-4.24 0L3 13.72V21h7.28l9.22-9.26a3 3 0 0 0 0-4.24l-3-3z';
      case 'heartbeat_completed':
        // check circle
        return 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3';
      case 'issue_created':
        // bug
        return 'M8 2h8M9 2v2.5M15 2v2.5M9 9h6M10 14h4M3 7l3 3M21 7l-3 3M6.6 18.4A6 6 0 0 0 12 20a6 6 0 0 0 5.4-1.6M5 11a7 7 0 0 0 14 0';
      case 'run_failed':
        // x circle
        return 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm3-13l-6 6m0-6l6 6';
      case 'budget_alert':
        // alert triangle
        return 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01';
      case 'agent_sleeping':
        // moon
        return 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';
      default:
        // activity pulse
        return 'M22 12h-4l-3 9L9 3l-3 9H2';
    }
  }

  let isRefreshing = $state(false);

  async function handleRefresh() {
    isRefreshing = true;
    try {
      await dashboardStore.fetch();
    } finally {
      isRefreshing = false;
    }
  }
</script>

<article class="raf-card {className}" aria-label="Recent activity feed">
  <header class="raf-header">
    <span class="raf-title">Recent Activity</span>
    <button
      class="raf-refresh"
      onclick={handleRefresh}
      disabled={isRefreshing || dashboardStore.isLoading}
      aria-label="Refresh activity feed"
    >
      <svg
        class="raf-refresh-icon"
        class:raf-spinning={isRefreshing}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M23 4v6h-6M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    </button>
  </header>

  <div class="raf-scroll" role="feed" aria-label="Activity events" aria-busy={dashboardStore.isLoading}>
    {#if events.length === 0}
      <div class="raf-empty" aria-live="polite">No recent activity</div>
    {:else}
      {#each events as event (event.id)}
        {@const dot = levelToDot(event.level)}
        <div class="raf-row" role="article" aria-label="{event.title}: {event.detail ?? ''}">
          <!-- Level dot -->
          <span
            class="raf-dot"
            class:raf-dot--pulse={dot.pulse}
            style="background: {dot.color}; --raf-dot-color: {dot.color}"
            aria-label="Level: {event.level}"
            role="img"
          ></span>

          <!-- Event type icon -->
          <svg
            class="raf-type-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path d={eventIconPath(event.type)} />
          </svg>

          <!-- Content -->
          <div class="raf-content">
            <span class="raf-event-title">{event.title}</span>
            {#if event.detail}
              <span class="raf-event-desc">{event.detail}</span>
            {/if}
            {#if event.agent_name}
              <span class="raf-agent-name">{event.agent_name}</span>
            {/if}
          </div>

          <!-- Time -->
          <div class="raf-time">
            <TimeAgo date={event.created_at} live short />
          </div>
        </div>
      {/each}
    {/if}
  </div>
</article>

<style>
  .raf-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .raf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .raf-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .raf-refresh {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    transition:
      background var(--transition-fast) ease,
      color var(--transition-fast) ease,
      border-color var(--transition-fast) ease;
  }

  .raf-refresh:hover:not(:disabled) {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border-color: var(--border-hover);
  }

  .raf-refresh:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .raf-refresh:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .raf-refresh-icon {
    flex-shrink: 0;
  }

  .raf-spinning {
    animation: raf-spin 0.75s linear infinite;
  }

  @keyframes raf-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .raf-spinning { animation: none; }
  }

  .raf-scroll {
    overflow-y: auto;
    max-height: 360px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    /* Thin scrollbar */
    scrollbar-width: thin;
    scrollbar-color: var(--border-default) transparent;
  }

  .raf-scroll::-webkit-scrollbar       { width: 4px; }
  .raf-scroll::-webkit-scrollbar-track { background: transparent; }
  .raf-scroll::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

  .raf-empty {
    padding: var(--space-6) 0;
    text-align: center;
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--text-tertiary);
  }

  .raf-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-2);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast) ease;
    min-height: 40px;
  }

  .raf-row:hover {
    background: var(--bg-elevated);
  }

  .raf-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
    position: relative;
  }

  .raf-dot--pulse::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 2px solid var(--raf-dot-color);
    animation: raf-pulse 1.8s ease-out infinite;
    opacity: 0;
  }

  @keyframes raf-pulse {
    0%   { transform: scale(0.8); opacity: 0.8; }
    70%  { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .raf-dot--pulse::after { animation: none; }
  }

  .raf-type-icon {
    color: var(--text-muted);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .raf-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .raf-event-title {
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .raf-event-desc {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .raf-agent-name {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent-primary);
    opacity: 0.8;
  }

  .raf-time {
    flex-shrink: 0;
    margin-top: 2px;
  }
</style>
