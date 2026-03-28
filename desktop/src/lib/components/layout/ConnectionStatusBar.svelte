<!-- src/lib/components/layout/ConnectionStatusBar.svelte -->
<script lang="ts">
  import { connectionStore } from '$lib/stores/connection.svelte';

  const STATUS_CONFIG = {
    connecting:   { label: 'Connecting…',  cls: 'dot-connecting' },
    reconnecting: { label: 'Reconnecting', cls: 'dot-reconnecting' },
    disconnected: { label: 'Disconnected', cls: 'dot-disconnected' },
  } as const;

  let status    = $derived(connectionStore.status);
  let attempts  = $derived(connectionStore.reconnectAttempts);
  let queueSize = $derived(connectionStore.offlineQueueSize);
  let health    = $derived(connectionStore.health);

  // Only show the bar for problem states — connected and mock are invisible
  let showBar = $derived(status === 'connecting' || status === 'reconnecting' || status === 'disconnected');
  let config  = $derived(STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.disconnected);
</script>

{#if showBar}
  <div class="csb-bar" role="status" aria-live="polite">
    <span class="csb-dot {config.cls}" aria-hidden="true"></span>
    <span class="csb-label">{config.label}</span>

    {#if status === 'reconnecting' && attempts > 0}
      <span class="csb-detail">attempt {attempts}</span>
    {/if}
    {#if queueSize > 0}
      <span class="csb-queue">{queueSize} queued</span>
    {/if}
    {#if health?.status === 'degraded'}
      <span class="csb-warn">degraded</span>
    {/if}
  </div>
{/if}

<style>
  .csb-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    font-size: 11px;
    color: var(--text-tertiary, rgba(255,255,255,0.45));
  }

  .csb-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .csb-label {
    color: var(--text-tertiary, rgba(255,255,255,0.45));
  }

  .csb-detail,
  .csb-queue,
  .csb-warn {
    color: var(--text-muted, rgba(255,255,255,0.25));
  }

  .dot-connecting {
    background: #3b82f6;
    animation: csb-pulse 1.4s ease-in-out infinite;
  }

  .dot-reconnecting {
    background: #eab308;
    animation: csb-pulse 1s ease-in-out infinite;
  }

  .dot-disconnected {
    background: #ef4444;
  }

  @keyframes csb-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
</style>
