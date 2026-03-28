<!-- src/lib/components/costs/ModelDistribution.svelte -->
<script lang="ts">
  import { costsStore } from '$lib/stores/costs.svelte';

  // Palette of distinct colors for model segments
  const PALETTE = [
    '#3b82f6', // blue  — accent-primary
    '#a78bfa', // violet
    '#34d399', // emerald
    '#f59e0b', // amber
    '#f472b6', // pink
    '#60a5fa', // sky
    '#fb923c', // orange
  ];

  const CX = 60;
  const CY = 60;
  const R_OUTER = 52;
  const R_INNER = 34;

  interface Segment {
    model: string;
    cost_cents: number;
    token_usage: { input: number; output: number; cache_read?: number; cache_write?: number };
    request_count: number;
    percentage: number;
    color: string;
    startAngle: number;
    endAngle: number;
    path: string;
  }

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx: number, cy: number, rOut: number, rIn: number, startDeg: number, endDeg: number): string {
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    const o1 = polarToCartesian(cx, cy, rOut, startDeg);
    const o2 = polarToCartesian(cx, cy, rOut, endDeg);
    const i1 = polarToCartesian(cx, cy, rIn, endDeg);
    const i2 = polarToCartesian(cx, cy, rIn, startDeg);
    return [
      `M ${o1.x} ${o1.y}`,
      `A ${rOut} ${rOut} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
      `L ${i1.x} ${i1.y}`,
      `A ${rIn} ${rIn} 0 ${largeArc} 0 ${i2.x} ${i2.y}`,
      'Z',
    ].join(' ');
  }

  const segments = $derived.by((): Segment[] => {
    const models = costsStore.modelDistribution;
    if (!models.length) return [];
    let angle = 0;
    return models.map((m, i) => {
      const span = (m.percentage / 100) * 360;
      const start = angle;
      const end = angle + span;
      angle = end;
      return {
        ...m,
        color: PALETTE[i % PALETTE.length],
        startAngle: start,
        endAngle: end,
        path: arcPath(CX, CY, R_OUTER, R_INNER, start, end - 0.5), // small gap
      };
    });
  });

  function shortModel(name: string): string {
    // "claude-opus-4-6" → "Opus 4.6"
    return name
      .replace('claude-', '')
      .replace(/-(\d+)-(\d+)$/, ' $1.$2')
      .replace(/(^\w|-\w)/g, (c) => c.replace('-', ' ').toUpperCase());
  }

  function fmtTokens(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  function fmtCents(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
  }
</script>

<article class="md-panel" aria-label="Model distribution">
  <header class="md-header">
    <span class="md-title">Models</span>
  </header>

  {#if segments.length === 0}
    <div class="md-empty">No model data</div>
  {:else}
    <div class="md-body">
      <svg
        class="md-donut"
        viewBox="0 0 120 120"
        aria-label="Model cost distribution donut chart"
        role="img"
      >
        {#each segments as seg (seg.model)}
          <path
            class="md-segment"
            d={seg.path}
            fill={seg.color}
            aria-label="{shortModel(seg.model)}: {seg.percentage}%"
          />
        {/each}
        <!-- Center label -->
        <text class="md-center-label" x={CX} y={CY - 4} text-anchor="middle" dominant-baseline="middle">
          {segments.length}
        </text>
        <text class="md-center-sub" x={CX} y={CY + 10} text-anchor="middle" dominant-baseline="middle">
          models
        </text>
      </svg>

      <ul class="md-legend" aria-label="Model legend">
        {#each segments as seg (seg.model)}
          <li class="md-legend-item">
            <span class="md-dot" style="background: {seg.color}" aria-hidden="true"></span>
            <span class="md-model-name">{shortModel(seg.model)}</span>
            <span class="md-model-pct">{seg.percentage}%</span>
          </li>
        {/each}
      </ul>
    </div>

    <!-- Detail list -->
    <ul class="md-detail" aria-label="Model cost details">
      {#each segments as seg (seg.model)}
        <li class="md-detail-row">
          <span class="md-dot" style="background: {seg.color}" aria-hidden="true"></span>
          <span class="md-detail-name">{shortModel(seg.model)}</span>
          <span class="md-detail-tokens">{fmtTokens((seg.token_usage?.input ?? 0) + (seg.token_usage?.output ?? 0))} tok</span>
          <span class="md-detail-cost">{fmtCents(seg.cost_cents)}</span>
        </li>
      {/each}
    </ul>
  {/if}
</article>

<style>
  .md-panel {
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

  .md-header {
    display: flex;
    align-items: center;
  }

  .md-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .md-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    font-size: 13px;
    color: var(--text-tertiary);
  }

  .md-body {
    display: flex;
    gap: var(--space-4);
    align-items: center;
  }

  .md-donut {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .md-segment {
    opacity: 0.85;
    transition: opacity 120ms ease;
    cursor: default;
  }

  .md-segment:hover {
    opacity: 1;
  }

  .md-center-label {
    font-family: var(--font-sans);
    font-size: 18px;
    font-weight: 700;
    fill: var(--text-primary);
  }

  .md-center-sub {
    font-family: var(--font-sans);
    font-size: 9px;
    fill: var(--text-tertiary);
  }

  .md-legend {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .md-legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .md-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .md-model-name {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-model-pct {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .md-detail {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid var(--border-default);
    padding-top: var(--space-3);
  }

  .md-detail-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    font-family: var(--font-sans);
    font-size: 11px;
    border-bottom: 1px solid var(--border-default);
  }

  .md-detail-row:last-child {
    border-bottom: none;
  }

  .md-detail-name {
    flex: 1;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-detail-tokens {
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
    min-width: 60px;
    text-align: right;
  }

  .md-detail-cost {
    color: var(--text-primary);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    min-width: 48px;
    text-align: right;
  }
</style>
