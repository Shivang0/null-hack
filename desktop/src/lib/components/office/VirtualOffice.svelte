<!-- src/lib/components/office/VirtualOffice.svelte -->
<!-- Container: switches Pixel / 3D mode, renders detail panel -->
<script lang="ts">
  import type { CanopyAgent } from '$api/types';
  import PixelOffice from './pixel/PixelOffice.svelte';
  import Office3D from './Office3D.svelte';
  import OfficeDetailPanel from './OfficeDetailPanel.svelte';

  interface Props {
    agents: CanopyAgent[];
    viewMode?: '2d' | '3d';
    onViewModeChange?: (mode: '2d' | '3d') => void;
  }

  let { agents, viewMode = '2d', onViewModeChange }: Props = $props();
  let selectedAgent = $state<CanopyAgent | null>(null);

  function handleAgentClick(agent: CanopyAgent) {
    selectedAgent = selectedAgent?.id === agent.id ? null : agent;
  }

  function handleClosePanel() {
    selectedAgent = null;
  }

  function toggleMode() {
    const next = viewMode === '2d' ? '3d' : '2d';
    onViewModeChange?.(next);
  }
</script>

<div class="vo-container" class:vo-panel-open={selectedAgent !== null}>
  {#if viewMode === '2d'}
    <!-- Pixel Art office — has its own toolbar, sidebar, minimap -->
    <div class="vo-pixel-wrap">
      <PixelOffice
        {agents}
        selectedAgentId={selectedAgent?.id ?? null}
        onAgentClick={handleAgentClick}
      />
      <!-- Floating mode toggle -->
      <div class="vo-mode-float">
        <button class="vo-mode-btn vo-mode-btn--active" onclick={toggleMode}>Pixel</button>
        <button class="vo-mode-btn" onclick={toggleMode}>3D</button>
      </div>
    </div>
  {:else}
    <!-- 3D mode with outer toolbar -->
    <div class="vo-toolbar">
      <div class="vo-stats">
        <span class="vo-stat">
          <span class="vo-dot vo-dot--active"></span>
          {agents.filter(a => a.status === 'running' || a.status === 'idle').length} active
        </span>
        <span class="vo-stat">
          {agents.length} total
        </span>
      </div>
      <div class="vo-mode-toggle" role="group" aria-label="View mode">
        <button class="vo-mode-btn" onclick={toggleMode}>Pixel</button>
        <button class="vo-mode-btn vo-mode-btn--active" onclick={toggleMode}>3D</button>
      </div>
    </div>
    <div class="vo-canvas">
      <Office3D
        {agents}
        selectedAgentId={selectedAgent?.id ?? null}
        onAgentClick={handleAgentClick}
      />
    </div>
  {/if}

  {#if selectedAgent}
    <OfficeDetailPanel agent={selectedAgent} onclose={handleClosePanel} />
  {/if}
</div>

<style>
  .vo-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  .vo-pixel-wrap {
    flex: 1;
    min-height: 0;
    position: relative;
  }
  .vo-mode-float {
    position: absolute;
    top: 6px;
    right: 50%;
    transform: translateX(50%);
    display: flex;
    gap: 2px;
    background: rgba(10, 10, 20, 0.85);
    border-radius: 6px;
    padding: 2px;
    z-index: 20;
    border: 1px solid #1e1e35;
  }
  .vo-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--dbd, #2a2a3e);
    background: var(--dbg, #12121e);
    flex-shrink: 0;
  }
  .vo-stats {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--dt3, #8888a0);
  }
  .vo-stat {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .vo-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #64748b;
  }
  .vo-dot--active { background: rgba(34, 197, 94, 0.7); }
  .vo-mode-toggle {
    display: flex;
    gap: 2px;
    background: var(--dbg2, #1a1a2e);
    border-radius: 6px;
    padding: 2px;
  }
  .vo-mode-btn {
    padding: 4px 12px;
    border: none;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    background: transparent;
    color: var(--dt4, #666680);
    cursor: pointer;
    transition: all 120ms ease;
  }
  .vo-mode-btn--active {
    background: #6366f1;
    color: white;
  }
  .vo-mode-btn:hover:not(.vo-mode-btn--active) {
    color: var(--dt2, #aaaacc);
  }
  .vo-canvas {
    flex: 1;
    min-height: 0;
    background: #0f0f1a;
  }
  .vo-panel-open .vo-canvas,
  .vo-panel-open .vo-pixel-wrap {
    margin-right: 320px;
  }
</style>
