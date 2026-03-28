<!-- src/lib/components/office/DeskZone.svelte -->
<!-- A named zone within the 2D floor plan, containing agent avatars and furniture -->
<script lang="ts">
  import type { CanopyAgent } from '$api/types';
  import AgentAvatar from './AgentAvatar.svelte';

  type ZoneType = 'desk' | 'meeting' | 'lounge' | 'hotdesk';

  interface Props {
    name: string;
    zoneType: ZoneType;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    agents: CanopyAgent[];
    selectedAgentId?: string | null;
    onAgentClick?: (agent: CanopyAgent) => void;
  }

  let {
    name,
    zoneType,
    x, y, width, height,
    fill,
    agents,
    selectedAgentId = null,
    onAgentClick,
  }: Props = $props();

  // Grid slot positions within the zone (relative to zone origin)
  // 4 columns × 3 rows = 12 slots per zone
  const COLS = 4;
  const ROWS = 3;
  const SLOT_W = $derived(Math.floor(width / COLS));
  const SLOT_H = $derived(Math.floor(height / ROWS));

  function agentSlotX(index: number): number {
    const col = index % COLS;
    return x + SLOT_W * col + Math.floor(SLOT_W / 2);
  }

  function agentSlotY(index: number): number {
    const row = Math.floor(index / COLS);
    return y + SLOT_H * row + Math.floor(SLOT_H / 2) + 10;
  }

  // Subtle grid line opacity
  const gridOpacity = 0.04;
</script>

<g class="dz-zone" role="region" aria-label="{name} zone">
  <!-- Zone background -->
  <rect
    {x}
    {y}
    {width}
    {height}
    fill={fill}
    rx="4"
    ry="4"
  />

  <!-- Grid lines within zone (very subtle) -->
  {#each Array(COLS - 1) as _, i}
    <line
      x1={x + SLOT_W * (i + 1)}
      y1={y + 4}
      x2={x + SLOT_W * (i + 1)}
      y2={y + height - 4}
      stroke="#8888bb"
      stroke-width="0.5"
      opacity={gridOpacity}
    />
  {/each}
  {#each Array(ROWS - 1) as _, i}
    <line
      x1={x + 4}
      y1={y + SLOT_H * (i + 1)}
      x2={x + width - 4}
      y2={y + SLOT_H * (i + 1)}
      stroke="#8888bb"
      stroke-width="0.5"
      opacity={gridOpacity}
    />
  {/each}

  <!-- Zone border -->
  <rect
    {x}
    {y}
    {width}
    {height}
    fill="none"
    stroke="#2a2848"
    stroke-width="1"
    rx="4"
    ry="4"
  />

  <!-- Zone label -->
  <text
    x={x + 10}
    y={y + 16}
    font-size="9"
    font-weight="600"
    fill="#4a4870"
    font-family="system-ui, sans-serif"
    letter-spacing="1"
  >{name.toUpperCase()}</text>

  <!-- Furniture decorations -->
  {#if zoneType === 'desk'}
    <!-- Desk rows (behind agents) -->
    {#each Array(ROWS) as _, row}
      {#each Array(COLS) as _, col}
        {@const fx = x + col * SLOT_W + 6}
        {@const fy = y + row * SLOT_H + 24}
        <rect x={fx} y={fy} width={SLOT_W - 12} height={SLOT_H - 20}
          rx="2" fill="#1c1a30" stroke="#252340" stroke-width="0.5" opacity="0.5" />
      {/each}
    {/each}
  {:else if zoneType === 'meeting'}
    <!-- Central meeting table (rounded rect) -->
    {@const tx = x + width * 0.15}
    {@const ty = y + height * 0.25}
    {@const tw = width * 0.7}
    {@const th = height * 0.5}
    <rect x={tx} y={ty} width={tw} height={th} rx="12" ry="12"
      fill="#1c1a30" stroke="#2d2a48" stroke-width="1.5" />
    <!-- Table surface highlight -->
    <rect x={tx + 4} y={ty + 4} width={tw - 8} height={th - 8} rx="9" ry="9"
      fill="none" stroke="#3a3860" stroke-width="0.5" opacity="0.5" />
    <!-- Chairs around table (small circles) -->
    {#each [0.2, 0.4, 0.6, 0.8] as cx_pct}
      <circle cx={tx + tw * cx_pct} cy={ty - 8} r="5" fill="#252340" />
      <circle cx={tx + tw * cx_pct} cy={ty + th + 8} r="5" fill="#252340" />
    {/each}
  {:else if zoneType === 'lounge'}
    <!-- Sofa shape (left side) -->
    {@const sx = x + 12}
    {@const sy = y + height * 0.55}
    <rect x={sx} y={sy} width={width * 0.3} height={height * 0.3} rx="8"
      fill="#1e1c36" stroke="#2d2a48" stroke-width="1" />
    <!-- Sofa arm left -->
    <rect x={sx} y={sy - 4} width="8" height={height * 0.3 + 4} rx="4"
      fill="#252340" />
    <!-- Plant circles -->
    <circle cx={x + width - 20} cy={y + height - 22} r="10"
      fill="#14532d" stroke="#166534" stroke-width="1" opacity="0.6" />
    <circle cx={x + width - 20} cy={y + height - 22} r="6"
      fill="rgba(34, 197, 94, 0.4)" opacity="0.6" />
    <!-- Small side table -->
    <circle cx={x + 16 + width * 0.3 + 14} cy={sy + height * 0.15} r="9"
      fill="#1c1a30" stroke="#2d2a48" stroke-width="1" />
  {:else if zoneType === 'hotdesk'}
    <!-- Smaller, compact desks layout -->
    {#each Array(ROWS) as _, row}
      {#each Array(COLS) as _, col}
        {@const fx = x + col * SLOT_W + 8}
        {@const fy = y + row * SLOT_H + 26}
        <rect x={fx} y={fy} width={SLOT_W - 16} height={SLOT_H - 24}
          rx="2" fill="#1c1a30" stroke="#252340" stroke-width="0.5" opacity="0.4" />
      {/each}
    {/each}
  {/if}

  <!-- Agent avatars -->
  {#each agents.slice(0, COLS * ROWS) as agent, i (agent.id)}
    <AgentAvatar
      {agent}
      x={agentSlotX(i)}
      y={agentSlotY(i)}
      selected={agent.id === selectedAgentId}
      onclick={onAgentClick}
    />
  {/each}

  <!-- Overflow indicator if more agents than slots -->
  {#if agents.length > COLS * ROWS}
    <text
      x={x + width - 8}
      y={y + height - 8}
      text-anchor="end"
      font-size="9"
      fill="#6366f1"
      font-family="system-ui, sans-serif"
    >+{agents.length - COLS * ROWS} more</text>
  {/if}
</g>
