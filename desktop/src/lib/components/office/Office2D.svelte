<!-- src/lib/components/office/Office2D.svelte -->
<!-- SVG isometric-style floor plan with four zones and agent avatars -->
<script lang="ts">
  import type { CanopyAgent } from '$api/types';
  import DeskZone from './DeskZone.svelte';

  interface Props {
    agents: CanopyAgent[];
    selectedAgentId?: string | null;
    onAgentClick?: (agent: CanopyAgent) => void;
  }

  let { agents, selectedAgentId = null, onAgentClick }: Props = $props();

  // ViewBox: 1200 × 700
  const VW = 1200;
  const VH = 700;

  // Corridor dimensions
  const CORRIDOR_W = 30;
  const CORRIDOR_MAIN_X = VW * 0.52; // vertical corridor x
  const CORRIDOR_MAIN_Y = VH * 0.5;  // horizontal corridor y

  // Zone layout
  const PADDING = 12;
  const ZONE_TL = { x: PADDING, y: PADDING, w: CORRIDOR_MAIN_X - PADDING - CORRIDOR_W / 2, h: CORRIDOR_MAIN_Y - PADDING - CORRIDOR_W / 2 };
  const ZONE_TR = { x: CORRIDOR_MAIN_X + CORRIDOR_W / 2, y: PADDING, w: VW - (CORRIDOR_MAIN_X + CORRIDOR_W / 2) - PADDING, h: CORRIDOR_MAIN_Y - PADDING - CORRIDOR_W / 2 };
  const ZONE_BL = { x: PADDING, y: CORRIDOR_MAIN_Y + CORRIDOR_W / 2, w: CORRIDOR_MAIN_X - PADDING - CORRIDOR_W / 2, h: VH - (CORRIDOR_MAIN_Y + CORRIDOR_W / 2) - PADDING };
  const ZONE_BR = { x: CORRIDOR_MAIN_X + CORRIDOR_W / 2, y: CORRIDOR_MAIN_Y + CORRIDOR_W / 2, w: VW - (CORRIDOR_MAIN_X + CORRIDOR_W / 2) - PADDING, h: VH - (CORRIDOR_MAIN_Y + CORRIDOR_W / 2) - PADDING };

  // Deterministic hash to assign agents to zones
  function djb2(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  // Zone assignment: sub-agents (role contains 'sub' or name contains 'sub') → hotdesk
  // running agents → desk zone for visibility
  // rest distributed by hash
  function assignZone(agent: CanopyAgent): 'desk' | 'meeting' | 'lounge' | 'hotdesk' {
    const roleLower = agent.role.toLowerCase();
    const nameLower = agent.name.toLowerCase();
    if (roleLower.includes('sub') || nameLower.includes('sub') || roleLower.includes('worker')) {
      return 'hotdesk';
    }
    const h = djb2(agent.id) % 4;
    if (h === 0) return 'desk';
    if (h === 1) return 'meeting';
    if (h === 2) return 'lounge';
    return 'hotdesk';
  }

  const deskAgents    = $derived(agents.filter(a => assignZone(a) === 'desk'));
  const meetingAgents = $derived(agents.filter(a => assignZone(a) === 'meeting'));
  const loungeAgents  = $derived(agents.filter(a => assignZone(a) === 'lounge'));
  const hotdeskAgents = $derived(agents.filter(a => assignZone(a) === 'hotdesk'));

  // Collaboration lines between running agents that share zones
  const collabPairs = $derived.by(() => {
    const running = agents.filter(a => a.status === 'running');
    const pairs: Array<{ a: CanopyAgent; b: CanopyAgent }> = [];
    for (let i = 0; i < running.length; i++) {
      for (let j = i + 1; j < running.length; j++) {
        if (assignZone(running[i]) === assignZone(running[j])) {
          pairs.push({ a: running[i], b: running[j] });
        }
      }
    }
    return pairs.slice(0, 8); // cap for performance
  });

  // Get approximate SVG center of an agent for collab lines
  function agentCenter(agent: CanopyAgent): { x: number; y: number } {
    const zone = assignZone(agent);
    const COLS = 4;
    const allInZone =
      zone === 'desk' ? deskAgents :
      zone === 'meeting' ? meetingAgents :
      zone === 'lounge' ? loungeAgents : hotdeskAgents;
    const idx = allInZone.indexOf(agent);
    const zDef =
      zone === 'desk' ? ZONE_TL :
      zone === 'meeting' ? ZONE_TR :
      zone === 'lounge' ? ZONE_BR : ZONE_BL;
    const SLOT_W = Math.floor(zDef.w / COLS);
    const SLOT_H = Math.floor(zDef.h / 3);
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    return {
      x: zDef.x + SLOT_W * col + Math.floor(SLOT_W / 2),
      y: zDef.y + SLOT_H * row + Math.floor(SLOT_H / 2) + 10,
    };
  }

  // Tile pattern id
  const tilePatternId = 'oa-corridor-tile';
</script>

<svg
  class="o2d-canvas"
  viewBox="0 0 {VW} {VH}"
  preserveAspectRatio="xMidYMid meet"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Virtual office floor plan"
>
  <defs>
    <!-- Corridor tile pattern -->
    <pattern id={tilePatternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#15152a" />
      <rect x="0" y="0" width="10" height="10" fill="#161628" />
      <rect x="10" y="10" width="10" height="10" fill="#161628" />
    </pattern>

    <!-- Gradient for inner avatar shadow -->
    <radialGradient id="oa-avatar-inner" cx="35%" cy="35%" r="60%">
      <stop offset="0%" stop-color="white" stop-opacity="0.2" />
      <stop offset="100%" stop-color="black" stop-opacity="0.3" />
    </radialGradient>

    <!-- Floor ambient gradient -->
    <radialGradient id="oa-floor-ambient" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1e1e35" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0d0d1a" stop-opacity="0" />
    </radialGradient>

    <!-- Collab line animation -->
    <style>
      .o2d-collab-line {
        stroke-dasharray: 6 4;
        animation: o2d-dash 1.8s linear infinite;
      }
      @keyframes o2d-dash {
        to { stroke-dashoffset: -20; }
      }
      @media (prefers-reduced-motion: reduce) {
        .o2d-collab-line { animation: none; }
      }
    </style>
  </defs>

  <!-- Office background -->
  <rect width={VW} height={VH} fill="#13121f" />

  <!-- Ambient floor glow -->
  <rect width={VW} height={VH} fill="url(#oa-floor-ambient)" />

  <!-- Horizontal corridor -->
  <rect
    x="0"
    y={CORRIDOR_MAIN_Y - CORRIDOR_W / 2}
    width={VW}
    height={CORRIDOR_W}
    fill="url(#{tilePatternId})"
  />
  <!-- Corridor border lines -->
  <line x1="0" y1={CORRIDOR_MAIN_Y - CORRIDOR_W / 2} x2={VW} y2={CORRIDOR_MAIN_Y - CORRIDOR_W / 2}
    stroke="#1e1e38" stroke-width="1" />
  <line x1="0" y1={CORRIDOR_MAIN_Y + CORRIDOR_W / 2} x2={VW} y2={CORRIDOR_MAIN_Y + CORRIDOR_W / 2}
    stroke="#1e1e38" stroke-width="1" />

  <!-- Vertical corridor -->
  <rect
    x={CORRIDOR_MAIN_X - CORRIDOR_W / 2}
    y="0"
    width={CORRIDOR_W}
    height={VH}
    fill="url(#{tilePatternId})"
  />
  <!-- Vertical corridor border lines -->
  <line x1={CORRIDOR_MAIN_X - CORRIDOR_W / 2} y1="0" x2={CORRIDOR_MAIN_X - CORRIDOR_W / 2} y2={VH}
    stroke="#1e1e38" stroke-width="1" />
  <line x1={CORRIDOR_MAIN_X + CORRIDOR_W / 2} y1="0" x2={CORRIDOR_MAIN_X + CORRIDOR_W / 2} y2={VH}
    stroke="#1e1e38" stroke-width="1" />

  <!-- Corridor intersection highlight -->
  <rect
    x={CORRIDOR_MAIN_X - CORRIDOR_W / 2}
    y={CORRIDOR_MAIN_Y - CORRIDOR_W / 2}
    width={CORRIDOR_W}
    height={CORRIDOR_W}
    fill="#17172e"
  />

  <!-- Four zones -->
  <DeskZone
    name="Desk Zone"
    zoneType="desk"
    x={ZONE_TL.x}
    y={ZONE_TL.y}
    width={ZONE_TL.w}
    height={ZONE_TL.h}
    fill="#1e1e35"
    agents={deskAgents}
    {selectedAgentId}
    onAgentClick={onAgentClick}
  />

  <DeskZone
    name="Meeting"
    zoneType="meeting"
    x={ZONE_TR.x}
    y={ZONE_TR.y}
    width={ZONE_TR.w}
    height={ZONE_TR.h}
    fill="#1a1e32"
    agents={meetingAgents}
    {selectedAgentId}
    onAgentClick={onAgentClick}
  />

  <DeskZone
    name="Hot Desk"
    zoneType="hotdesk"
    x={ZONE_BL.x}
    y={ZONE_BL.y}
    width={ZONE_BL.w}
    height={ZONE_BL.h}
    fill="#1c1a34"
    agents={hotdeskAgents}
    {selectedAgentId}
    onAgentClick={onAgentClick}
  />

  <DeskZone
    name="Lounge"
    zoneType="lounge"
    x={ZONE_BR.x}
    y={ZONE_BR.y}
    width={ZONE_BR.w}
    height={ZONE_BR.h}
    fill="#181c30"
    agents={loungeAgents}
    {selectedAgentId}
    onAgentClick={onAgentClick}
  />

  <!-- Collaboration lines between running agents in same zone -->
  {#each collabPairs as pair (`${pair.a.id}-${pair.b.id}`)}
    {@const ca = agentCenter(pair.a)}
    {@const cb = agentCenter(pair.b)}
    <line
      x1={ca.x}
      y1={ca.y}
      x2={cb.x}
      y2={cb.y}
      stroke="rgba(34, 197, 94, 0.7)"
      stroke-width="1"
      opacity="0.3"
      class="o2d-collab-line"
    />
  {/each}

  <!-- Empty state overlay when no agents -->
  {#if agents.length === 0}
    <rect width={VW} height={VH} fill="rgba(0,0,0,0.5)" />
    <text
      x={VW / 2}
      y={VH / 2 - 12}
      text-anchor="middle"
      font-size="16"
      fill="#4a4870"
      font-family="system-ui, sans-serif"
      font-weight="600"
    >No agents in the office</text>
    <text
      x={VW / 2}
      y={VH / 2 + 12}
      text-anchor="middle"
      font-size="12"
      fill="#3a3860"
      font-family="system-ui, sans-serif"
    >Hire agents to see them appear here</text>
  {/if}
</svg>

<style>
  .o2d-canvas {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 8px;
  }
</style>
