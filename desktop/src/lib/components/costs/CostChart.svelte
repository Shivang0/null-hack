<!-- src/lib/components/costs/CostChart.svelte -->
<script lang="ts">
  import { costsStore } from '$lib/stores/costs.svelte';
  import type { DailyCostPoint } from '$lib/stores/costs.svelte';

  const CHART_H = 120;
  const CHART_W = 600; // SVG viewBox width; scales with container
  const BAR_GAP = 2;

  let hoveredPoint = $state<DailyCostPoint | null>(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);

  const today = new Date().toISOString().slice(0, 10);

  const bars = $derived.by(() => {
    const points = costsStore.dailyTrend;
    if (!points.length) return [];
    const n = points.length;
    const barW = (CHART_W - BAR_GAP * (n - 1)) / n;
    const max = costsStore.maxDailyTrendCents || 1;

    return points.map((p, i) => ({
      ...p,
      x: i * (barW + BAR_GAP),
      w: barW,
      h: Math.max(2, (p.cost_cents / max) * CHART_H),
      isToday: p.date === today,
    }));
  });

  // Budget line Y position (daily budget)
  const budgetLineY = $derived.by(() => {
    const max = costsStore.maxDailyTrendCents || 1;
    const budget = costsStore.summary.daily_budget_cents;
    if (!budget) return null;
    return CHART_H - (Math.min(budget, max) / max) * CHART_H;
  });

  function fmtDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function fmtCents(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
  }

  function handleBarMouseEnter(e: MouseEvent, point: DailyCostPoint) {
    hoveredPoint = point;
    tooltipX = (e.target as SVGElement).getBoundingClientRect().left + 8;
    tooltipY = (e.target as SVGElement).getBoundingClientRect().top - 36;
  }

  function handleBarMouseLeave() {
    hoveredPoint = null;
  }
</script>

<article class="cc-panel" aria-label="30-day cost trend">
  <header class="cc-header">
    <span class="cc-title">Cost Trend</span>
    <span class="cc-subtitle">{costsStore.dateRange === '7d' ? '7' : costsStore.dateRange === '90d' ? '90' : '30'} days</span>
  </header>

  {#if costsStore.dailyTrend.length === 0}
    <div class="cc-empty" aria-live="polite">No trend data</div>
  {:else}
    <div class="cc-chart-wrap">
      <svg
        class="cc-svg"
        viewBox="0 0 {CHART_W} {CHART_H}"
        aria-label="Daily cost bar chart"
        role="img"
        preserveAspectRatio="none"
      >
        <!-- Budget limit line -->
        {#if budgetLineY !== null}
          <line
            class="cc-budget-line"
            x1="0"
            y1={budgetLineY}
            x2={CHART_W}
            y2={budgetLineY}
            aria-label="Daily budget limit"
          />
        {/if}

        <!-- Bars -->
        {#each bars as bar (bar.date)}
          <rect
            class="cc-bar"
            class:cc-bar--today={bar.isToday}
            x={bar.x}
            y={CHART_H - bar.h}
            width={bar.w}
            height={bar.h}
            rx="2"
            aria-hidden="true"
            onmouseenter={(e) => handleBarMouseEnter(e, bar)}
            onmouseleave={handleBarMouseLeave}
          />
        {/each}
      </svg>

      <!-- Tooltip (CSS-positioned, outside SVG to avoid clipping) -->
      {#if hoveredPoint}
        <div
          class="cc-tooltip"
          role="tooltip"
          style="position:fixed; left:{tooltipX}px; top:{tooltipY}px"
        >
          <strong>{fmtDate(hoveredPoint.date)}</strong>
          <span>{fmtCents(hoveredPoint.cost_cents)}</span>
        </div>
      {/if}
    </div>

    <!-- X-axis labels: first, middle, last -->
    {#if bars.length >= 3}
      {@const first = bars[0]}
      {@const mid = bars[Math.floor(bars.length / 2)]}
      <div class="cc-x-labels" aria-hidden="true">
        <span>{fmtDate(first.date)}</span>
        <span>{fmtDate(mid.date)}</span>
        <span>Today</span>
      </div>
    {/if}
  {/if}
</article>

<style>
  .cc-panel {
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

  .cc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cc-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .cc-subtitle {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .cc-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    font-size: 13px;
    color: var(--text-tertiary);
  }

  .cc-chart-wrap {
    position: relative;
    width: 100%;
  }

  .cc-svg {
    display: block;
    width: 100%;
    height: 120px;
    overflow: visible;
  }

  .cc-bar {
    fill: var(--accent-primary);
    opacity: 0.6;
    cursor: pointer;
    transition: opacity 120ms ease;
  }

  .cc-bar:hover,
  .cc-bar:focus {
    opacity: 1;
    outline: none;
  }

  .cc-bar--today {
    fill: var(--accent-primary);
    opacity: 1;
  }

  .cc-budget-line {
    stroke: var(--accent-warning);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.6;
    pointer-events: none;
  }

  .cc-tooltip {
    z-index: 200;
    background: var(--bg-tertiary, #1e1e1e);
    border: 1px solid var(--border-hover);
    border-radius: var(--radius-sm);
    padding: 4px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-primary);
    pointer-events: none;
    white-space: nowrap;
  }

  .cc-tooltip strong {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .cc-x-labels {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--text-tertiary);
    padding: 0 2px;
  }
</style>
