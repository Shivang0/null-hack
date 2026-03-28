<!-- src/lib/components/costs/AgentCostBreakdown.svelte -->
<script lang="ts">
  import { costsStore } from '$lib/stores/costs.svelte';
  import type { AgentCostBreakdown } from '$api/types';

  type SortKey = 'cost_cents' | 'run_count' | 'token_usage' | 'percentage';
  type SortDir = 'asc' | 'desc';

  let sortKey = $state<SortKey>('cost_cents');
  let sortDir = $state<SortDir>('desc');
  let showAll = $state(false);

  const PAGE_SIZE = 10;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      sortKey = key;
      sortDir = 'desc';
    }
  }

  function totalTokens(a: AgentCostBreakdown): number {
    return (a.token_usage?.input ?? 0) + (a.token_usage?.output ?? 0);
  }

  const sorted = $derived.by(() => {
    return [...costsStore.agentBreakdown].sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === 'cost_cents') { av = a.cost_cents; bv = b.cost_cents; }
      else if (sortKey === 'run_count') { av = a.run_count; bv = b.run_count; }
      else if (sortKey === 'token_usage') { av = totalTokens(a); bv = totalTokens(b); }
      else { av = a.percentage; bv = b.percentage; }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  });

  const visible = $derived(showAll ? sorted : sorted.slice(0, PAGE_SIZE));

  const maxCost = $derived(
    sorted.reduce((m, a) => Math.max(m, a.cost_cents), 0) || 1
  );

  function fmtTokens(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  function fmtCents(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
  }

  function sortLabel(key: SortKey): string {
    if (sortKey !== key) return '';
    return sortDir === 'desc' ? '↓' : '↑';
  }
</script>

<article class="acb-panel" aria-label="Agent cost breakdown">
  <header class="acb-header">
    <span class="acb-title">Agent Breakdown</span>
    <span class="acb-count">{costsStore.agentBreakdown.length} agents</span>
  </header>

  {#if costsStore.agentBreakdown.length === 0}
    <div class="acb-empty">No agent cost data</div>
  {:else}
    <div class="acb-table-wrap" role="region" aria-label="Agent costs table">
      <table class="acb-table">
        <thead>
          <tr>
            <th class="acb-th acb-th--agent">Agent</th>
            <th
              class="acb-th acb-th--num"
              aria-sort={sortKey === 'run_count' ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}
            >
              <button class="acb-sort-btn" onclick={() => toggleSort('run_count')}>
                Sessions {sortLabel('run_count')}
              </button>
            </th>
            <th
              class="acb-th acb-th--num"
              aria-sort={sortKey === 'token_usage' ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}
            >
              <button class="acb-sort-btn" onclick={() => toggleSort('token_usage')}>
                Tokens {sortLabel('token_usage')}
              </button>
            </th>
            <th
              class="acb-th acb-th--num"
              aria-sort={sortKey === 'cost_cents' ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}
            >
              <button class="acb-sort-btn" onclick={() => toggleSort('cost_cents')}>
                Cost {sortLabel('cost_cents')}
              </button>
            </th>
            <th
              class="acb-th acb-th--pct"
              aria-sort={sortKey === 'percentage' ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}
            >
              <button class="acb-sort-btn" onclick={() => toggleSort('percentage')}>
                % {sortLabel('percentage')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each visible as agent (agent.agent_id)}
            {@const barPct = (agent.cost_cents / maxCost) * 100}
            <tr class="acb-row">
              <td class="acb-td acb-td--agent">
                <span class="acb-agent-name">{agent.agent_name}</span>
                <!-- Relative bar -->
                <div class="acb-bar-wrap" aria-hidden="true">
                  <div class="acb-bar-fill" style="width: {barPct}%"></div>
                </div>
              </td>
              <td class="acb-td acb-td--num">{agent.run_count}</td>
              <td class="acb-td acb-td--num">
                <span class="acb-token-in" aria-label="Input tokens">{fmtTokens(agent.token_usage?.input ?? 0)}</span>
                <span class="acb-sep">/</span>
                <span class="acb-token-out" aria-label="Output tokens">{fmtTokens(agent.token_usage?.output ?? 0)}</span>
              </td>
              <td class="acb-td acb-td--num acb-td--cost">{fmtCents(agent.cost_cents)}</td>
              <td class="acb-td acb-td--pct">{agent.percentage}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if sorted.length > PAGE_SIZE}
      <button
        class="acb-expander"
        onclick={() => showAll = !showAll}
        aria-expanded={showAll}
      >
        {showAll ? `Show top ${PAGE_SIZE}` : `Show all ${sorted.length} agents`}
      </button>
    {/if}
  {/if}
</article>

<style>
  .acb-panel {
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

  .acb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .acb-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .acb-count {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .acb-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    font-size: 13px;
    color: var(--text-tertiary);
  }

  .acb-table-wrap {
    overflow-x: auto;
  }

  .acb-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-sans);
    font-size: 12px;
  }

  .acb-th {
    padding: var(--space-2) var(--space-2);
    text-align: left;
    color: var(--text-tertiary);
    font-weight: 500;
    font-size: 11px;
    letter-spacing: 0.3px;
    border-bottom: 1px solid var(--border-default);
    white-space: nowrap;
  }

  .acb-th--num,
  .acb-td--num {
    text-align: right;
  }

  .acb-th--pct,
  .acb-td--pct {
    text-align: right;
    width: 52px;
  }

  .acb-sort-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3px;
    padding: 0;
    transition: color 120ms ease;
  }

  .acb-sort-btn:hover {
    color: var(--text-primary);
  }

  .acb-row {
    border-bottom: 1px solid var(--border-default);
    transition: background 120ms ease;
  }

  .acb-row:last-child {
    border-bottom: none;
  }

  .acb-row:hover {
    background: var(--bg-elevated);
  }

  .acb-td {
    padding: var(--space-2) var(--space-2);
    color: var(--text-secondary);
    vertical-align: middle;
  }

  .acb-td--agent {
    min-width: 140px;
  }

  .acb-td--cost {
    color: var(--text-primary);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .acb-agent-name {
    display: block;
    color: var(--text-primary);
    font-weight: 500;
    margin-bottom: 3px;
  }

  .acb-bar-wrap {
    height: 3px;
    background: var(--bg-tertiary);
    border-radius: 9999px;
    overflow: hidden;
    width: 100%;
    max-width: 200px;
  }

  .acb-bar-fill {
    height: 100%;
    background: var(--accent-primary);
    border-radius: 9999px;
    opacity: 0.7;
    transition: width 300ms ease;
  }

  .acb-token-in { color: var(--text-secondary); }
  .acb-token-out { color: var(--text-tertiary); }
  .acb-sep { color: var(--text-muted); margin: 0 2px; }

  .acb-expander {
    align-self: flex-start;
    background: none;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
    transition: border-color 120ms ease, color 120ms ease;
  }

  .acb-expander:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }
</style>
