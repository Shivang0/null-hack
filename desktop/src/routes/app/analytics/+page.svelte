<!-- src/routes/app/analytics/+page.svelte -->
<script lang="ts">
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { analyticsStore } from '$lib/stores/analytics.svelte';

  type Period = '7d' | '30d' | '90d';

  const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
  ];

  $effect(() => {
    void analyticsStore.fetchAnalytics(analyticsStore.period);
  });

  function setPeriod(p: Period) {
    void analyticsStore.fetchAnalytics(p);
  }

  function formatCents(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  function successRateClass(rate: number): string {
    if (rate >= 0.95) return 'an-rate--high';
    if (rate >= 0.85) return 'an-rate--mid';
    return 'an-rate--low';
  }

  // Bar chart helpers — normalise values to max height
  function barHeights<T>(items: T[], getValue: (item: T) => number, maxPx = 80): number[] {
    const max = Math.max(...items.map(getValue), 1);
    return items.map((item) => Math.max(2, Math.round((getValue(item) / max) * maxPx)));
  }
</script>

<PageShell title="Analytics" subtitle="Observe">
  {#snippet actions()}
    <div class="an-period-tabs" role="group" aria-label="Analytics period">
      {#each PERIOD_OPTIONS as opt (opt.value)}
        <button
          class="an-period-btn"
          class:an-period-btn--active={analyticsStore.period === opt.value}
          onclick={() => setPeriod(opt.value)}
          aria-pressed={analyticsStore.period === opt.value}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  {/snippet}

  {#if analyticsStore.isLoading}
    <div class="an-loading" aria-live="polite" aria-busy="true">
      <div class="an-spinner" aria-hidden="true"></div>
      <span>Loading analytics…</span>
    </div>
  {:else if analyticsStore.error}
    <div class="an-error" role="alert">
      <p>Failed to load analytics: {analyticsStore.error}</p>
      <button onclick={() => void analyticsStore.fetchAnalytics(analyticsStore.period)}>
        Retry
      </button>
    </div>
  {:else if analyticsStore.data}
    {@const { totals, trends, agent_metrics, team_metrics } = analyticsStore.data}

    <!-- KPI Row -->
    <div class="an-kpi-row" aria-label="Key performance indicators">
      <div class="an-kpi-card">
        <span class="an-kpi-label">Total Sessions</span>
        <span class="an-kpi-value">{totals.total_sessions.toLocaleString()}</span>
      </div>
      <div class="an-kpi-card">
        <span class="an-kpi-label">Success Rate</span>
        <span class="an-kpi-value an-kpi-value--success">
          {(totals.avg_success_rate * 100).toFixed(1)}%
        </span>
      </div>
      <div class="an-kpi-card">
        <span class="an-kpi-label">Total Cost</span>
        <span class="an-kpi-value">{formatCents(totals.total_cost_cents)}</span>
      </div>
      <div class="an-kpi-card">
        <span class="an-kpi-label">Tasks Completed</span>
        <span class="an-kpi-value">{totals.total_tasks.toLocaleString()}</span>
      </div>
      <div class="an-kpi-card">
        <span class="an-kpi-label">Active Agents</span>
        <span class="an-kpi-value">{totals.active_agents}</span>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="an-charts-grid">
      <!-- Sessions Trend -->
      <section class="an-chart-card" aria-label="Sessions trend">
        <h2 class="an-chart-title">Sessions by Day</h2>
        {#if trends.sessions_by_day.length > 0}
          {@const heights = barHeights(trends.sessions_by_day, (d) => d.count)}
          <div class="an-bar-chart" role="img" aria-label="Bar chart of sessions per day">
            {#each trends.sessions_by_day as day, i (day.date)}
              <div class="an-bar-col">
                <div
                  class="an-bar"
                  style="height: {heights[i]}px"
                  title="{day.date}: {day.count} sessions"
                ></div>
              </div>
            {/each}
          </div>
          <div class="an-chart-axis">
            <span>{trends.sessions_by_day[0]?.date?.slice(5) ?? ''}</span>
            <span>{trends.sessions_by_day[Math.floor(trends.sessions_by_day.length / 2)]?.date?.slice(5) ?? ''}</span>
            <span>{trends.sessions_by_day[trends.sessions_by_day.length - 1]?.date?.slice(5) ?? ''}</span>
          </div>
        {:else}
          <p class="an-chart-empty">No data for this period.</p>
        {/if}
      </section>

      <!-- Cost Trend -->
      <section class="an-chart-card" aria-label="Cost trend">
        <h2 class="an-chart-title">Cost by Day</h2>
        {#if trends.costs_by_day.length > 0}
          {@const heights = barHeights(trends.costs_by_day, (d) => d.cents)}
          <div class="an-bar-chart" role="img" aria-label="Bar chart of costs per day">
            {#each trends.costs_by_day as day, i (day.date)}
              <div class="an-bar-col">
                <div
                  class="an-bar an-bar--cost"
                  style="height: {heights[i]}px"
                  title="{day.date}: {formatCents(day.cents)}"
                ></div>
              </div>
            {/each}
          </div>
          <div class="an-chart-axis">
            <span>{trends.costs_by_day[0]?.date?.slice(5) ?? ''}</span>
            <span>{trends.costs_by_day[Math.floor(trends.costs_by_day.length / 2)]?.date?.slice(5) ?? ''}</span>
            <span>{trends.costs_by_day[trends.costs_by_day.length - 1]?.date?.slice(5) ?? ''}</span>
          </div>
        {:else}
          <p class="an-chart-empty">No data for this period.</p>
        {/if}
      </section>
    </div>

    <!-- Agent Leaderboard -->
    <section class="an-section" aria-label="Agent leaderboard">
      <h2 class="an-section-title">Agent Leaderboard</h2>
      {#if agent_metrics.length > 0}
        <div class="an-table-wrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="an-th an-th--num" scope="col">Rank</th>
                <th class="an-th" scope="col">Agent</th>
                <th class="an-th an-th--num" scope="col">Sessions</th>
                <th class="an-th an-th--num" scope="col">Success Rate</th>
                <th class="an-th an-th--num" scope="col">Avg Duration</th>
                <th class="an-th an-th--num" scope="col">Cost</th>
                <th class="an-th an-th--num" scope="col">Tasks/Day</th>
              </tr>
            </thead>
            <tbody>
              {#each [...agent_metrics].sort((a, b) => b.success_rate - a.success_rate) as agent, idx (agent.agent_id)}
                <tr class="an-tr">
                  <td class="an-td an-td--num an-td--rank">
                    {#if idx === 0}
                      <span class="an-rank an-rank--gold" aria-label="1st place">1</span>
                    {:else if idx === 1}
                      <span class="an-rank an-rank--silver" aria-label="2nd place">2</span>
                    {:else if idx === 2}
                      <span class="an-rank an-rank--bronze" aria-label="3rd place">3</span>
                    {:else}
                      <span class="an-rank">{idx + 1}</span>
                    {/if}
                  </td>
                  <td class="an-td an-td--agent">
                    <span class="an-agent-dot" aria-hidden="true"></span>
                    {agent.agent_name}
                  </td>
                  <td class="an-td an-td--num">{agent.total_sessions.toLocaleString()}</td>
                  <td class="an-td an-td--num">
                    <span class="an-rate {successRateClass(agent.success_rate)}">
                      {(agent.success_rate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td class="an-td an-td--num">{formatDuration(agent.avg_duration_seconds)}</td>
                  <td class="an-td an-td--num">{formatCents(agent.total_cost_cents)}</td>
                  <td class="an-td an-td--num">{agent.tasks_per_day}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="an-empty">No agent data for this period.</p>
      {/if}
    </section>

    <!-- Team Performance -->
    <section class="an-section" aria-label="Team performance">
      <h2 class="an-section-title">Team Performance</h2>
      {#if team_metrics.length > 0}
        <div class="an-team-grid">
          {#each team_metrics as team (team.team_id)}
            <div class="an-team-card">
              <div class="an-team-header">
                <span class="an-team-name">{team.team_name}</span>
                <span class="an-team-badge">{team.agent_count} agent{team.agent_count !== 1 ? 's' : ''}</span>
              </div>
              <div class="an-team-stats">
                <div class="an-team-stat">
                  <span class="an-team-stat-label">Sessions</span>
                  <span class="an-team-stat-value">{team.total_sessions.toLocaleString()}</span>
                </div>
                <div class="an-team-stat">
                  <span class="an-team-stat-label">Success</span>
                  <span class="an-team-stat-value an-rate {successRateClass(team.success_rate)}">
                    {(team.success_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div class="an-team-stat">
                  <span class="an-team-stat-label">Cost</span>
                  <span class="an-team-stat-value">{formatCents(team.total_cost_cents)}</span>
                </div>
              </div>
              <!-- Success rate bar -->
              <div class="an-team-bar-track" aria-hidden="true">
                <div
                  class="an-team-bar-fill {successRateClass(team.success_rate)}"
                  style="width: {(team.success_rate * 100).toFixed(1)}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="an-empty">No team data for this period.</p>
      {/if}
    </section>
  {/if}
</PageShell>

<style>
  /* ── Period selector ─────────────────────────────────────────────── */
  .an-period-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 2px;
  }

  .an-period-btn {
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--text-tertiary);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    padding: 3px 10px;
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease;
    white-space: nowrap;
  }

  .an-period-btn:hover {
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.05);
  }

  .an-period-btn--active {
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
  }

  /* ── Loading / Error states ──────────────────────────────────────── */
  .an-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 48px 0;
    color: var(--text-tertiary);
    font-size: 13px;
    justify-content: center;
  }

  .an-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-default);
    border-top-color: var(--text-secondary);
    border-radius: 50%;
    animation: an-spin 0.7s linear infinite;
  }

  @keyframes an-spin {
    to { transform: rotate(360deg); }
  }

  .an-error {
    padding: 32px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .an-error button {
    margin-top: 12px;
    padding: 6px 16px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    color: var(--text-primary);
    font-size: 12px;
    cursor: pointer;
  }

  /* ── KPI row ─────────────────────────────────────────────────────── */
  .an-kpi-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  @media (max-width: 900px) {
    .an-kpi-row { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 600px) {
    .an-kpi-row { grid-template-columns: repeat(2, 1fr); }
  }

  .an-kpi-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .an-kpi-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .an-kpi-value {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .an-kpi-value--success {
    color: #3fb950;
  }

  /* ── Charts ──────────────────────────────────────────────────────── */
  .an-charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (max-width: 700px) {
    .an-charts-grid { grid-template-columns: 1fr; }
  }

  .an-chart-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 16px;
  }

  .an-chart-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0 0 14px 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .an-bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 88px;
    overflow: hidden;
  }

  .an-bar-col {
    flex: 1;
    display: flex;
    align-items: flex-end;
  }

  .an-bar {
    width: 100%;
    background: var(--accent-primary, #58a6ff);
    border-radius: 2px 2px 0 0;
    opacity: 0.7;
    transition: opacity 100ms;
  }

  .an-bar:hover {
    opacity: 1;
  }

  .an-bar--cost {
    background: var(--accent-warning, #e3b341);
  }

  .an-chart-axis {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 10px;
    color: var(--text-quaternary, var(--text-tertiary));
  }

  .an-chart-empty {
    color: var(--text-tertiary);
    font-size: 12px;
    text-align: center;
    padding: 24px 0;
    margin: 0;
  }

  /* ── Sections ────────────────────────────────────────────────────── */
  .an-section {
    margin-bottom: 24px;
  }

  .an-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 12px 0;
  }

  .an-empty {
    color: var(--text-tertiary);
    font-size: 13px;
    padding: 24px 0;
    margin: 0;
  }

  /* ── Agent leaderboard table ─────────────────────────────────────── */
  .an-table-wrap {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .an-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .an-th {
    padding: 8px 12px;
    background: var(--bg-surface);
    color: var(--text-tertiary);
    font-weight: 500;
    text-align: left;
    border-bottom: 1px solid var(--border-default);
    white-space: nowrap;
  }

  .an-th--num {
    text-align: right;
  }

  .an-tr:not(:last-child) {
    border-bottom: 1px solid var(--border-subtle, var(--border-default));
  }

  .an-tr:hover {
    background: var(--bg-surface);
  }

  .an-td {
    padding: 9px 12px;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    vertical-align: middle;
  }

  .an-td--num {
    text-align: right;
    color: var(--text-secondary);
  }

  .an-td--rank {
    width: 50px;
  }

  .an-td--agent {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 500;
  }

  .an-agent-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-tertiary);
    flex-shrink: 0;
  }

  .an-rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 600;
    background: var(--bg-surface);
    color: var(--text-tertiary);
  }

  .an-rank--gold {
    background: rgba(210, 167, 0, 0.18);
    color: #d2a700;
  }

  .an-rank--silver {
    background: rgba(139, 148, 158, 0.18);
    color: #8b949e;
  }

  .an-rank--bronze {
    background: rgba(197, 118, 68, 0.18);
    color: #c57644;
  }

  /* ── Success rate badges ──────────────────────────────────────────── */
  .an-rate {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
  }

  .an-rate--high {
    background: rgba(63, 185, 80, 0.15);
    color: #3fb950;
  }

  .an-rate--mid {
    background: rgba(227, 179, 65, 0.15);
    color: #e3b341;
  }

  .an-rate--low {
    background: rgba(248, 81, 73, 0.15);
    color: #f85149;
  }

  /* ── Team grid ───────────────────────────────────────────────────── */
  .an-team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }

  .an-team-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
  }

  .an-team-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .an-team-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .an-team-badge {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-tertiary);
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: 9999px;
    padding: 1px 8px;
  }

  .an-team-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 10px;
  }

  .an-team-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .an-team-stat-label {
    font-size: 10px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .an-team-stat-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .an-team-bar-track {
    height: 4px;
    background: var(--border-default);
    border-radius: 2px;
    overflow: hidden;
  }

  .an-team-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 400ms ease;
  }

  .an-team-bar-fill.an-rate--high { background: #3fb950; }
  .an-team-bar-fill.an-rate--mid  { background: #e3b341; }
  .an-team-bar-fill.an-rate--low  { background: #f85149; }
</style>
