<!-- src/lib/components/costs/CacheSavings.svelte -->
<script lang="ts">
  import { costsStore } from '$lib/stores/costs.svelte';

  function fmtCents(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
  }

  function fmtTokens(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  // Estimate tokens saved: cache_savings_cents at ~$0.03/1K tokens cached read price
  // This is a display heuristic — real data would come from the API
  const estimatedTokensSaved = $derived(
    Math.round((costsStore.summary.cache_savings_cents / 0.03) * 1000)
  );

  const trend = $derived<'up' | 'flat'>(
    costsStore.cacheSavingsPct >= 20 ? 'up' : 'flat'
  );
</script>

<article class="cs-panel" aria-label="Cache savings">
  <header class="cs-header">
    <span class="cs-title">Cache Savings</span>
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
      style="color: var(--accent-success)"
    >
      <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  </header>

  <div class="cs-big" aria-label="Cache savings percentage: {costsStore.cacheSavingsPct}%">
    <span class="cs-pct">{costsStore.cacheSavingsPct}%</span>
    <span
      class="cs-trend cs-trend--{trend}"
      aria-label="Trend: {trend}"
    >
      {#if trend === 'up'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      {:else}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      {/if}
    </span>
  </div>

  <p class="cs-label">of prompt tokens served from cache</p>

  <div class="cs-stats" role="list">
    <div class="cs-stat" role="listitem" aria-label="Tokens saved: {fmtTokens(estimatedTokensSaved)}">
      <span class="cs-stat-value">{fmtTokens(estimatedTokensSaved)}</span>
      <span class="cs-stat-label">tokens saved</span>
    </div>
    <div class="cs-divider" aria-hidden="true"></div>
    <div class="cs-stat" role="listitem" aria-label="Estimated savings: {fmtCents(costsStore.summary.cache_savings_cents)}">
      <span class="cs-stat-value cs-stat-value--green">{fmtCents(costsStore.summary.cache_savings_cents)}</span>
      <span class="cs-stat-label">est. saved</span>
    </div>
  </div>
</article>

<style>
  .cs-panel {
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

  .cs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cs-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .cs-big {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .cs-pct {
    font-family: var(--font-sans);
    font-size: 36px;
    font-weight: 800;
    color: var(--accent-success);
    line-height: 1;
    letter-spacing: -1px;
  }

  .cs-trend {
    display: inline-flex;
    align-items: center;
    padding: 3px 6px;
    border-radius: var(--radius-xs);
  }

  .cs-trend--up   { color: rgba(34, 197, 94, 0.7); background: rgba(34, 197, 94, 0.08); }
  .cs-trend--flat { color: var(--text-tertiary); background: rgba(255,255,255,0.05); }

  .cs-label {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .cs-stats {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-2);
    border-top: 1px solid var(--border-default);
  }

  .cs-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cs-stat-value {
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .cs-stat-value--green {
    color: var(--accent-success);
  }

  .cs-stat-label {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 500;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .cs-divider {
    width: 1px;
    height: 30px;
    background: var(--border-default);
  }
</style>
