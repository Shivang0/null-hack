<!-- src/lib/components/schedules/ScheduleTimeline.svelte -->
<script lang="ts">
  import type { Schedule } from '$api/types';

  interface Props {
    schedules: Schedule[];
  }

  let { schedules }: Props = $props();

  const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

  // Convert an ISO timestamp to a fraction (0–1) along the 24h axis
  function toFraction(iso: string): number {
    const d = new Date(iso);
    return (d.getHours() * 60 + d.getMinutes()) / (24 * 60);
  }

  // Current time fraction
  let nowFraction = $state(0);

  function computeNow() {
    const d = new Date();
    nowFraction = (d.getHours() * 60 + d.getMinutes()) / (24 * 60);
  }

  let timer: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    computeNow();
    timer = setInterval(computeNow, 60_000);
    return () => {
      if (timer !== null) clearInterval(timer);
    };
  });

  // Build dot data from schedules with a next_run_at
  const dots = $derived(
    schedules
      .filter((s) => s.next_run_at !== null)
      .map((s) => ({
        id: s.id,
        name: s.agent_name,
        fraction: toFraction(s.next_run_at!),
        enabled: s.enabled,
        time: new Date(s.next_run_at!).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
  );

  let hoveredId = $state<string | null>(null);
</script>

<section class="stl-wrap" aria-label="24-hour schedule timeline">
  <div class="stl-track" role="img" aria-label="Timeline showing scheduled runs over 24 hours">
    <!-- Track bar -->
    <div class="stl-bar" aria-hidden="true"></div>

    <!-- Current time indicator -->
    <div
      class="stl-now"
      style="left: {nowFraction * 100}%"
      aria-label="Current time"
      role="presentation"
    ></div>

    <!-- Schedule dots -->
    {#each dots as dot (dot.id)}
      <button
        class="stl-dot"
        class:stl-dot--enabled={dot.enabled}
        class:stl-dot--disabled={!dot.enabled}
        style="left: {dot.fraction * 100}%"
        onmouseenter={() => (hoveredId = dot.id)}
        onmouseleave={() => (hoveredId = null)}
        onfocus={() => (hoveredId = dot.id)}
        onblur={() => (hoveredId = null)}
        aria-label="{dot.name} — next run at {dot.time}"
        type="button"
      >
        {#if hoveredId === dot.id}
          <div class="stl-tooltip" role="tooltip">
            <span class="stl-tooltip-name">{dot.name}</span>
            <span class="stl-tooltip-time">{dot.time}</span>
          </div>
        {/if}
      </button>
    {/each}

    <!-- Hour labels -->
    <div class="stl-labels" aria-hidden="true">
      {#each HOUR_LABELS as h (h)}
        <span
          class="stl-label"
          style="left: {(h / 24) * 100}%"
        >{h}</span>
      {/each}
    </div>
  </div>

  {#if schedules.length === 0}
    <p class="stl-empty">No schedules to display</p>
  {/if}
</section>

<style>
  .stl-wrap {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 16px 20px 28px;
    position: relative;
  }

  .stl-track {
    position: relative;
    height: 32px;
    margin: 0 8px;
  }

  .stl-bar {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--border-default);
    border-radius: 1px;
    transform: translateY(-50%);
  }

  /* Current time line */
  .stl-now {
    position: absolute;
    top: 6px;
    bottom: 6px;
    width: 2px;
    background: var(--accent-error);
    border-radius: 1px;
    transform: translateX(-50%);
    z-index: 2;
  }

  /* Dots */
  .stl-dot {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid transparent;
    cursor: pointer;
    z-index: 3;
    transition: transform var(--transition-fast) ease;
    padding: 0;
  }

  .stl-dot:hover,
  .stl-dot:focus-visible {
    transform: translate(-50%, -50%) scale(1.4);
    outline: none;
  }

  .stl-dot:focus-visible {
    box-shadow: 0 0 0 2px var(--accent-primary);
  }

  .stl-dot--enabled {
    background: var(--accent-primary);
    border-color: rgba(59, 130, 246, 0.4);
  }

  .stl-dot--disabled {
    background: var(--text-muted);
    border-color: var(--border-default);
  }

  /* Tooltip */
  .stl-tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 5px 8px;
    white-space: nowrap;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: var(--shadow-md);
    z-index: var(--z-tooltip);
  }

  .stl-tooltip-name {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .stl-tooltip-time {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
  }

  /* Hour labels */
  .stl-labels {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    height: 16px;
  }

  .stl-label {
    position: absolute;
    transform: translateX(-50%);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    user-select: none;
  }

  .stl-empty {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
    margin: 8px 0 0;
  }
</style>
