<!-- src/lib/components/activity/ActivityRow.svelte -->
<!-- Single activity event row with icon, agent, description, timestamp, expandable detail -->
<script lang="ts">
  import TimeAgo from '$lib/components/shared/TimeAgo.svelte';
  import type { ActivityEvent, ActivityEventType } from '$api/types';

  interface Props {
    event: ActivityEvent;
  }

  let { event }: Props = $props();

  let expanded = $state(false);

  // SVG path data for each event type icon
  const EVENT_ICONS: Record<ActivityEventType, { path: string; color: string }> = {
    agent_woke:             { path: 'M12 3v1m0 16v1m9-9h-1M4 12H3m3.22-5.78-.707-.707M18.364 5.636l-.707.707M5.636 18.364l-.707.707M18.364 18.364l-.707-.707M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z', color: '#eab308' },
    agent_slept:            { path: 'M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z', color: '#8b5cf6' },
    agent_error:            { path: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', color: '#ef4444' },
    heartbeat_started:      { path: 'M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z', color: '#3b82f6' },
    heartbeat_completed:    { path: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color: 'rgba(34, 197, 94, 0.7)' },
    heartbeat_failed:       { path: 'M10 14l2-2m0 0 2-2m-2 2-2-2m2 2 2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color: '#ef4444' },
    issue_created:          { path: 'M12 4v16m8-8H4', color: '#3b82f6' },
    issue_updated:          { path: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: '#06b6d4' },
    goal_completed:         { path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 0 0 .951-.69l1.519-4.674z', color: '#f59e0b' },
    budget_warning:         { path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color: '#f59e0b' },
    budget_exceeded:        { path: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color: '#ef4444' },
    session_started:        { path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: '#3b82f6' },
    session_completed:      { path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'rgba(34, 197, 94, 0.7)' },
    skill_triggered:        { path: 'M13 10V3L4 14h7v7l9-11h-7z', color: '#8b5cf6' },
    config_changed:         { path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', color: '#06b6d4' },
    deployment:             { path: 'M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v12', color: '#a78bfa' },
  };

  const LEVEL_BORDER: Record<string, string> = {
    info:    'transparent',
    success: 'rgba(34,197,94,0.15)',
    warning: 'rgba(234,179,8,0.25)',
    error:   'rgba(239,68,68,0.25)',
  };

  const icon = $derived(EVENT_ICONS[event.type] ?? { path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', color: '#666' });
  const hasDetail = $derived(!!event.detail);
  const borderColor = $derived(LEVEL_BORDER[event.level] ?? 'transparent');
</script>

<div
  class="ar-row"
  class:ar-row--expandable={hasDetail}
  class:ar-row--expanded={expanded}
  style="--ar-border: {borderColor}"
  role="listitem"
>
  <button
    class="ar-main"
    onclick={() => { if (hasDetail) expanded = !expanded; }}
    aria-expanded={hasDetail ? expanded : undefined}
    aria-label="{event.title}{event.agent_name ? ', by ' + event.agent_name : ''}"
    type="button"
  >
    <!-- Event type icon -->
    <span class="ar-icon" aria-hidden="true" style="color: {icon.color}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d={icon.path} />
      </svg>
    </span>

    <!-- Title + agent -->
    <span class="ar-body">
      <span class="ar-title">{event.title}</span>
      {#if event.agent_name}
        <span class="ar-agent">{event.agent_name}</span>
      {:else}
        <span class="ar-agent ar-agent--system">System</span>
      {/if}
    </span>

    <!-- Timestamp -->
    <span class="ar-time">
      <TimeAgo date={event.created_at} short />
    </span>

    <!-- Expand chevron -->
    {#if hasDetail}
      <span class="ar-chevron" class:ar-chevron--open={expanded} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    {/if}
  </button>

  <!-- Expandable detail section -->
  {#if expanded && hasDetail}
    <div class="ar-detail" role="region" aria-label="Event detail">
      <p class="ar-detail-text">{event.detail}</p>
    </div>
  {/if}
</div>

<style>
  .ar-row {
    border-bottom: 1px solid var(--border-default);
    border-left: 2px solid var(--ar-border, transparent);
    transition: border-color 120ms ease;
  }

  .ar-row--expandable .ar-main {
    cursor: pointer;
  }

  .ar-row--expanded {
    background: rgba(255,255,255,0.02);
  }

  .ar-main {
    display: grid;
    grid-template-columns: 24px 1fr auto auto;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 6px 12px 6px 14px;
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: default;
    transition: background 100ms ease;
  }

  .ar-row--expandable .ar-main:hover {
    background: rgba(255,255,255,0.03);
  }

  .ar-main:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: -2px;
  }

  .ar-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: rgba(255,255,255,0.04);
  }

  .ar-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .ar-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }

  .ar-agent {
    font-size: 11px;
    color: var(--text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ar-agent--system {
    font-style: italic;
  }

  .ar-time {
    flex-shrink: 0;
    text-align: right;
  }

  .ar-chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--text-tertiary);
    transition: transform 150ms ease;
  }

  .ar-chevron--open {
    transform: rotate(90deg);
  }

  .ar-detail {
    padding: 0 14px 10px 50px;
  }

  .ar-detail-text {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
    padding: 8px 10px;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    border: 1px solid var(--border-default);
  }
</style>
