<!-- src/lib/components/office/Office3D.svelte -->
<!-- 3D Virtual Office with Threlte (Three.js for Svelte) -->
<script lang="ts">
  import { Canvas } from '@threlte/core';
  import type { CanopyAgent } from '$api/types';
  import Scene3D from './Scene3D.svelte';

  interface Props {
    agents: CanopyAgent[];
    selectedAgentId?: string | null;
    onAgentClick?: (agent: CanopyAgent) => void;
  }

  let { agents, selectedAgentId = null, onAgentClick }: Props = $props();
</script>

<div class="o3d-container">
  <Canvas>
    <Scene3D {agents} {selectedAgentId} {onAgentClick} />
  </Canvas>
</div>

<style>
  .o3d-container {
    width: 100%;
    height: 100%;
    min-height: 500px;
    background: #0a0a14;
  }
</style>
