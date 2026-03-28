<script lang="ts">
  interface Props {
    used: number;
    total: number;
    label?: string;
    showPct?: boolean;
  }

  let { used, total, label, showPct = true }: Props = $props();

  const pct = $derived(total > 0 ? Math.min((used / total) * 100, 100) : 0);

  const fillColor = $derived(
    pct >= 95 ? '#ef4444' :
    pct >= 80 ? '#eab308' :
    'var(--accent-primary)'
  );

  const fillStyle = $derived(
    pct >= 80
      ? `background: ${fillColor}`
      : `background: linear-gradient(90deg, var(--accent-primary), #60a5fa)`
  );

  const displayRight = $derived(
    showPct
      ? `${Math.round(pct)}%`
      : `${used.toLocaleString()} / ${total.toLocaleString()}`
  );
</script>

<div class="tb-wrap" role="meter" aria-valuenow={used} aria-valuemin={0} aria-valuemax={total} aria-label={label ?? 'Token usage'}>
  {#if label || showPct}
    <div class="tb-row">
      {#if label}
        <span class="tb-label">{label}</span>
      {:else}
        <span></span>
      {/if}
      <span class="tb-right">{displayRight}</span>
    </div>
  {/if}

  <div class="tb-track">
    <div class="tb-fill" style="{fillStyle}; width: {pct}%"></div>
  </div>
</div>

<style>
  .tb-wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
  }

  .tb-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .tb-label,
  .tb-right {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .tb-track {
    width: 100%;
    height: 6px;
    border-radius: 9999px;
    background: var(--bg-tertiary);
    overflow: hidden;
  }

  .tb-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 300ms ease;
    min-width: 0;
  }
</style>
