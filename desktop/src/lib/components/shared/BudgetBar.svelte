<script lang="ts">
  interface Props {
    spent: number;
    limit: number;
    currency?: string;
    warningPct?: number;
    label?: string;
  }

  let { spent, limit, currency = '$', warningPct = 80, label }: Props = $props();

  const pct = $derived(limit > 0 ? (spent / limit) * 100 : 0);
  const clampedPct = $derived(Math.min(pct, 100));
  const isOver = $derived(pct > 100);
  const isWarning = $derived(pct >= warningPct && pct <= 100);

  const fillColor = $derived(
    isOver     ? '#ef4444' :
    isWarning  ? '#eab308' :
    'var(--accent-primary)'
  );

  const warningTickPct = $derived(warningPct);

  function fmt(n: number): string {
    return n.toFixed(2);
  }
</script>

<div
  class="bb-wrap"
  role="meter"
  aria-valuenow={spent}
  aria-valuemin={0}
  aria-valuemax={limit}
  aria-label={label ?? 'Budget usage'}
>
  <div class="bb-row">
    {#if label}
      <span class="bb-label">{label}</span>
    {:else}
      <span></span>
    {/if}
    <span class="bb-amounts" class:bb-amounts--over={isOver}>
      {#if isOver}
        Over budget
      {:else}
        {currency}{fmt(spent)} / {currency}{fmt(limit)}
      {/if}
    </span>
  </div>

  <div class="bb-track">
    <div
      class="bb-fill"
      style="width: {clampedPct}%; background: {fillColor}"
    ></div>

    <!-- Warning threshold tick -->
    <div
      class="bb-tick"
      style="left: {warningTickPct}%"
      aria-hidden="true"
    ></div>

    <!-- 100% tick -->
    <div
      class="bb-tick"
      style="left: 100%"
      aria-hidden="true"
    ></div>
  </div>
</div>

<style>
  .bb-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
  }

  .bb-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .bb-label,
  .bb-amounts {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .bb-amounts--over {
    color: #ef4444;
    font-weight: 600;
  }

  .bb-track {
    position: relative;
    width: 100%;
    height: 6px;
    border-radius: 9999px;
    background: var(--bg-tertiary);
    overflow: visible;
  }

  .bb-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 9999px;
    transition: width 300ms ease, background 300ms ease;
    min-width: 0;
    overflow: hidden;
  }

  .bb-tick {
    position: absolute;
    top: -2px;
    width: 2px;
    height: 10px;
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-50%);
    border-radius: 1px;
    pointer-events: none;
  }
</style>
