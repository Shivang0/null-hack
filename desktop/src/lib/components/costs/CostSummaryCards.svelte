<!-- src/lib/components/costs/CostSummaryCards.svelte -->
<script lang="ts">
  import BudgetBar from '$lib/components/shared/BudgetBar.svelte';
  import { costsStore } from '$lib/stores/costs.svelte';

  // Dollar formatter
  function fmt(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
  }

  const ICON_CALENDAR = 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z';
  const ICON_WEEK     = 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0-1 0h2M15 11H9m6 4H9';
  const ICON_MONTH    = 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';

  const weekTrend = $derived.by(() => {
    // Compare this week vs. the equivalent 7-day window last week
    // We only have totals, so we derive a directional signal from daily vs weekly average
    const dailyAvg = costsStore.summary.week_cents / 7;
    if (costsStore.summary.today_cents > dailyAvg * 1.1) return 'up' as const;
    if (costsStore.summary.today_cents < dailyAvg * 0.9) return 'down' as const;
    return 'flat' as const;
  });

  const dailyColor = $derived(
    costsStore.dailyUsagePct >= 80 ? 'danger' :
    costsStore.dailyUsagePct >= 60 ? 'warning' : 'safe'
  );

  const monthlyColor = $derived(
    costsStore.monthlyUsagePct >= 80 ? 'danger' :
    costsStore.monthlyUsagePct >= 60 ? 'warning' : 'safe'
  );
</script>

<div class="csc-grid" aria-label="Cost summary">
  <!-- Today -->
  <article class="csc-card csc-card--{dailyColor}">
    <div class="csc-header">
      <span class="csc-label">Today's Spend</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d={ICON_CALENDAR} />
      </svg>
    </div>
    <div class="csc-value">{fmt(costsStore.summary.today_cents)}</div>
    <div class="csc-bar">
      <BudgetBar
        spent={costsStore.todayDollars}
        limit={costsStore.dailyBudgetDollars}
        currency="$"
        warningPct={80}
        label="Daily limit"
      />
    </div>
    <span class="csc-remaining">
      {fmt(costsStore.summary.daily_remaining_cents)} remaining
    </span>
  </article>

  <!-- This week -->
  <article class="csc-card">
    <div class="csc-header">
      <span class="csc-label">This Week</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d={ICON_WEEK} />
      </svg>
    </div>
    <div class="csc-value-row">
      <span class="csc-value">{fmt(costsStore.summary.week_cents)}</span>
      <span class="csc-trend csc-trend--{weekTrend}" aria-label="Trend: {weekTrend}">
        {#if weekTrend === 'up'}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 15l-6-6-6 6" /></svg>
        {:else if weekTrend === 'down'}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        {:else}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14" /></svg>
        {/if}
      </span>
    </div>
    <span class="csc-sub">7-day rolling total</span>
  </article>

  <!-- This month -->
  <article class="csc-card csc-card--{monthlyColor}">
    <div class="csc-header">
      <span class="csc-label">This Month</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d={ICON_MONTH} />
      </svg>
    </div>
    <div class="csc-value">{fmt(costsStore.summary.month_cents)}</div>
    <div class="csc-bar">
      <BudgetBar
        spent={costsStore.monthDollars}
        limit={costsStore.monthlyBudgetDollars}
        currency="$"
        warningPct={80}
        label="Monthly budget"
      />
    </div>
    <span class="csc-remaining">
      {fmt(costsStore.summary.monthly_remaining_cents)} remaining
    </span>
  </article>
</div>

<style>
  .csc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  }

  @media (max-width: 720px) {
    .csc-grid {
      grid-template-columns: 1fr;
    }
  }

  .csc-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    transition: border-color var(--transition-fast, 150ms) ease,
                transform var(--transition-fast, 150ms) ease;
  }

  .csc-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-1px);
  }

  .csc-card--warning {
    border-color: rgba(245, 158, 11, 0.3);
  }

  .csc-card--danger {
    border-color: rgba(239, 68, 68, 0.3);
  }

  .csc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-tertiary);
  }

  .csc-label {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }

  .csc-value {
    font-family: var(--font-sans);
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
    letter-spacing: -0.5px;
  }

  .csc-value-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .csc-trend {
    display: inline-flex;
    align-items: center;
    padding: 2px 5px;
    border-radius: var(--radius-xs);
    font-size: 10px;
    font-weight: 600;
  }

  .csc-trend--up   { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
  .csc-trend--down { color: rgba(34, 197, 94, 0.7); background: rgba(34, 197, 94, 0.08); }
  .csc-trend--flat { color: var(--text-tertiary); background: rgba(255,255,255,0.05); }

  .csc-bar {
    width: 100%;
  }

  .csc-sub,
  .csc-remaining {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
  }
</style>
