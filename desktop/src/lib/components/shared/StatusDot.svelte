<script lang="ts">
  interface Props {
    status?: 'online' | 'idle' | 'busy' | 'error' | 'offline' | 'sleeping';
    pulse?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }

  let { status = 'offline', pulse = false, size = 'md' }: Props = $props();

  const statusLabels: Record<string, string> = {
    online: 'Online',
    idle: 'Idle',
    busy: 'Busy',
    error: 'Error',
    offline: 'Offline',
    sleeping: 'Sleeping',
  };

  const label = $derived(statusLabels[status] ?? status);
</script>

<span
  class="status-dot status-dot--{status} status-dot--{size}"
  class:status-dot--pulse={pulse}
  aria-label={label}
  role="status"
  title={label}
></span>

<style>
  .status-dot {
    display: inline-block;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
  }

  /* Sizes */
  .status-dot--sm { width: 6px;  height: 6px; }
  .status-dot--md { width: 8px;  height: 8px; }
  .status-dot--lg { width: 10px; height: 10px; }

  /* Colors */
  .status-dot--online   { background: #22c55e; }
  .status-dot--idle     { background: #eab308; }
  .status-dot--busy     { background: #3b82f6; }
  .status-dot--error    { background: #ef4444; }
  .status-dot--offline  { background: #666666; }
  .status-dot--sleeping { background: #8b5cf6; }

  /* Pulse ring */
  .status-dot--pulse::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    animation: sd-pulse 1.8s ease-out infinite;
    opacity: 0;
  }

  .status-dot--pulse.status-dot--online::after   { border: 2px solid #22c55e; }
  .status-dot--pulse.status-dot--idle::after     { border: 2px solid #eab308; }
  .status-dot--pulse.status-dot--busy::after     { border: 2px solid #3b82f6; }
  .status-dot--pulse.status-dot--error::after    { border: 2px solid #ef4444; }
  .status-dot--pulse.status-dot--sleeping::after { border: 2px solid #8b5cf6; }

  @keyframes sd-pulse {
    0%   { transform: scale(0.8); opacity: 0.8; }
    70%  { transform: scale(2.0); opacity: 0; }
    100% { transform: scale(2.0); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .status-dot--pulse::after { animation: none; }
  }
</style>
