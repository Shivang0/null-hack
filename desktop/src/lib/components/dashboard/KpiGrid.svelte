<script lang="ts">
  import MetricCard from '$lib/components/shared/MetricCard.svelte';
  import { dashboardStore } from '$lib/stores/dashboard.svelte';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  // SVG path data for icons
  const ICON_USERS     = 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4a3 3 0 1 0 0-6 3 3 0 0 0 0 6m4 10v-2a4 4 0 0 0-3-3.87';
  const ICON_PLAY      = 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM10 8l6 4-6 4V8z';
  const ICON_TRIANGLE  = 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01';
  const ICON_CURRENCY  = 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6';

  const activeAgentsTrend = $derived(
    (dashboardStore.kpis?.active_agents ?? 0) > (dashboardStore.kpis?.total_agents ?? 0) / 2
      ? ('up' as const)
      : ('down' as const)
  );

  const liveRunsTrend = $derived(
    (dashboardStore.kpis?.live_runs ?? 0) > 0 ? ('up' as const) : ('flat' as const)
  );

  const budgetTrend = $derived(
    (dashboardStore.kpis?.budget_remaining_pct ?? 100) < 50 ? ('down' as const) : ('flat' as const)
  );
</script>

<section class="kg-grid {className}" aria-label="Key performance indicators">
  {#if dashboardStore.isLoading}
    {#each { length: 4 } as _, i (i)}
      <div class="kg-skeleton" aria-hidden="true"></div>
    {/each}
  {:else}
    <MetricCard
      label="Active Agents"
      value={dashboardStore.kpis?.active_agents ?? 0}
      subtitle="of {dashboardStore.kpis?.total_agents ?? 0} total"
      trend={activeAgentsTrend}
      icon={ICON_USERS}
    />
    <MetricCard
      label="Live Runs"
      value={dashboardStore.kpis?.live_runs ?? 0}
      trend={liveRunsTrend}
      icon={ICON_PLAY}
    />
    <MetricCard
      label="Open Issues"
      value={dashboardStore.kpis?.open_issues ?? 0}
      icon={ICON_TRIANGLE}
    />
    <MetricCard
      label="Budget Remaining"
      value="{dashboardStore.kpis?.budget_remaining_pct ?? 0}%"
      trend={budgetTrend}
      icon={ICON_CURRENCY}
    />
  {/if}
</section>

<style>
  .kg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-4);
  }

  .kg-skeleton {
    min-height: 96px;
    border-radius: var(--radius-md);
    background: linear-gradient(
      90deg,
      var(--bg-surface) 0%,
      var(--bg-elevated) 50%,
      var(--bg-surface) 100%
    );
    background-size: 200% 100%;
    animation: kg-shimmer 1.6s ease-in-out infinite;
    border: 1px solid var(--border-default);
  }

  @keyframes kg-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .kg-skeleton { animation: none; }
  }
</style>
