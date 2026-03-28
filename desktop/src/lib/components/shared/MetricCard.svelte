<script lang="ts">
  interface Props {
    label: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'flat';
    trendValue?: string;
    icon?: string;
  }

  let { label, value, subtitle, trend, trendValue, icon }: Props = $props();
</script>

<div class="mc-card" aria-label="{label}: {value}">
  <div class="mc-header">
    <span class="mc-label">{label}</span>
    {#if icon}
      <span class="mc-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d={icon} />
        </svg>
      </span>
    {/if}
  </div>

  <div class="mc-value-row">
    <span class="mc-value">{value}</span>
    {#if trend}
      <span
        class="mc-trend mc-trend--{trend}"
        aria-label="Trend: {trend}{trendValue ? ` ${trendValue}` : ''}"
      >
        {#if trend === 'up'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        {:else if trend === 'down'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        {:else}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        {/if}
        {#if trendValue}
          <span class="mc-trend-value">{trendValue}</span>
        {/if}
      </span>
    {/if}
  </div>

  {#if subtitle}
    <span class="mc-subtitle">{subtitle}</span>
  {/if}
</div>

<style>
  .mc-card {
    min-width: 160px;
    padding: var(--space-4);
    border-radius: var(--radius-md);
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    transition:
      border-color var(--transition-fast) ease,
      transform var(--transition-fast) ease;
    cursor: default;
  }

  .mc-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-1px);
  }

  .mc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .mc-label {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }

  .mc-icon {
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }

  .mc-value-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .mc-value {
    font-family: var(--font-sans);
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }

  .mc-trend {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    padding: 2px 5px;
    border-radius: var(--radius-xs);
  }

  .mc-trend--up    { color: rgba(34, 197, 94, 0.7); background: rgba(34, 197, 94, 0.08); }
  .mc-trend--down  { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
  .mc-trend--flat  { color: var(--text-tertiary); background: rgba(255, 255, 255, 0.05); }

  .mc-trend-value {
    line-height: 1;
  }

  .mc-subtitle {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
  }
</style>
