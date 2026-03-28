<!-- src/lib/components/office/Scene3D.svelte -->
<!-- The 3D scene: floor, walls, desks, agent characters, lighting -->
<script lang="ts">
  import { T } from '@threlte/core';
  import { OrbitControls, Text, Float } from '@threlte/extras';
  import type { CanopyAgent } from '$api/types';
  import AgentDesk3D from './AgentDesk3D.svelte';

  interface Props {
    agents: CanopyAgent[];
    selectedAgentId?: string | null;
    onAgentClick?: (agent: CanopyAgent) => void;
  }

  let { agents, selectedAgentId = null, onAgentClick }: Props = $props();

  // Hash function for deterministic positioning
  function djb2(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  // Map agent to 3D position on a 4x3 grid
  function agentPosition(agent: CanopyAgent): [number, number, number] {
    const hash = djb2(agent.id);
    const col = (hash % 4);
    const row = Math.floor((hash % 12) / 4);
    const x = (col - 1.5) * 3.5;
    const z = (row - 1) * 3.5;
    return [x, 0, z];
  }

  // Status to emissive color
  function statusEmissive(status: string): string {
    switch (status) {
      case 'running': return 'rgba(34, 197, 94, 0.7)';
      case 'idle': return '#6366f1';
      case 'sleeping': return '#334155';
      case 'paused': return '#f59e0b';
      case 'terminated': return '#ef4444';
      default: return '#64748b';
    }
  }
</script>

<!-- Camera -->
<T.PerspectiveCamera makeDefault position={[12, 10, 12]} fov={50}>
  <OrbitControls
    enableDamping
    dampingFactor={0.08}
    target={[0, 0, 0]}
    maxPolarAngle={Math.PI / 2.2}
    minDistance={5}
    maxDistance={30}
  />
</T.PerspectiveCamera>

<!-- Lighting -->
<T.AmbientLight intensity={0.3} color="#a0a0ff" />
<T.DirectionalLight position={[8, 12, 6]} intensity={0.7} color="#ffffff" castShadow />
<T.DirectionalLight position={[-6, 8, -4]} intensity={0.3} color="#6366f1" />
<T.PointLight position={[0, 6, 0]} intensity={0.5} color="#818cf8" distance={20} decay={2} />

<!-- Floor -->
<T.Mesh rotation.x={-Math.PI / 2} position.y={-0.01} receiveShadow>
  <T.PlaneGeometry args={[20, 16]} />
  <T.MeshStandardMaterial color="#12121e" roughness={0.9} metalness={0.1} />
</T.Mesh>

<!-- Floor grid lines -->
{#each Array(21) as _, i}
  <T.Mesh rotation.x={-Math.PI / 2} position={[-10 + i, 0, 0]}>
    <T.PlaneGeometry args={[0.02, 16]} />
    <T.MeshBasicMaterial color="#1e1e35" transparent opacity={0.3} />
  </T.Mesh>
{/each}
{#each Array(17) as _, i}
  <T.Mesh rotation.x={-Math.PI / 2} position={[0, 0, -8 + i]}>
    <T.PlaneGeometry args={[20, 0.02]} />
    <T.MeshBasicMaterial color="#1e1e35" transparent opacity={0.3} />
  </T.Mesh>
{/each}

<!-- Walls -->
<!-- Back wall -->
<T.Mesh position={[0, 1.5, -8]}>
  <T.BoxGeometry args={[20, 3, 0.15]} />
  <T.MeshStandardMaterial color="#1a1a30" roughness={0.8} />
</T.Mesh>
<!-- Left wall -->
<T.Mesh position={[-10, 1.5, 0]}>
  <T.BoxGeometry args={[0.15, 3, 16]} />
  <T.MeshStandardMaterial color="#1a1a30" roughness={0.8} />
</T.Mesh>
<!-- Right wall -->
<T.Mesh position={[10, 1.5, 0]}>
  <T.BoxGeometry args={[0.15, 3, 16]} />
  <T.MeshStandardMaterial color="#1a1a30" roughness={0.8} />
</T.Mesh>

<!-- Central divider (corridor representation) -->
<T.Mesh position={[0, 0.8, 0]}>
  <T.BoxGeometry args={[0.1, 1.6, 8]} />
  <T.MeshStandardMaterial color="#2a2a45" transparent opacity={0.5} />
</T.Mesh>

<!-- Zone labels floating above zones -->
<T.Group position={[-5, 2.8, -4]}>
  <Float speed={1} floatIntensity={0.3}>
    <Text text="DESK ZONE" fontSize={0.4} color="#4a4870" anchorX="center" anchorY="middle" />
  </Float>
</T.Group>
<T.Group position={[5, 2.8, -4]}>
  <Float speed={1} floatIntensity={0.3}>
    <Text text="MEETING" fontSize={0.4} color="#4a4870" anchorX="center" anchorY="middle" />
  </Float>
</T.Group>
<T.Group position={[-5, 2.8, 4]}>
  <Float speed={1} floatIntensity={0.3}>
    <Text text="HOT DESK" fontSize={0.4} color="#4a4870" anchorX="center" anchorY="middle" />
  </Float>
</T.Group>
<T.Group position={[5, 2.8, 4]}>
  <Float speed={1} floatIntensity={0.3}>
    <Text text="LOUNGE" fontSize={0.4} color="#4a4870" anchorX="center" anchorY="middle" />
  </Float>
</T.Group>

<!-- Meeting table (center-right zone) -->
<T.Mesh position={[5, 0.4, -4]} castShadow>
  <T.CylinderGeometry args={[1.5, 1.5, 0.12, 32]} />
  <T.MeshStandardMaterial color="#2d2a4a" roughness={0.6} metalness={0.3} />
</T.Mesh>
<T.Mesh position={[5, 0.2, -4]}>
  <T.CylinderGeometry args={[0.08, 0.08, 0.4, 8]} />
  <T.MeshStandardMaterial color="#1e1e35" />
</T.Mesh>

<!-- Lounge sofa (bottom-right) -->
<T.Mesh position={[5, 0.35, 4]} castShadow>
  <T.BoxGeometry args={[3, 0.7, 1.2]} />
  <T.MeshStandardMaterial color="#2d1b69" roughness={0.85} />
</T.Mesh>
<T.Mesh position={[5, 0.75, 4.5]}>
  <T.BoxGeometry args={[3, 0.5, 0.3]} />
  <T.MeshStandardMaterial color="#3b2480" roughness={0.85} />
</T.Mesh>

<!-- Agents at desks -->
{#each agents as agent (agent.id)}
  {@const pos = agentPosition(agent)}
  {@const isSelected = selectedAgentId === agent.id}
  {@const emissive = statusEmissive(agent.status)}
  <AgentDesk3D
    {agent}
    position={pos}
    selected={isSelected}
    {emissive}
    onclick={() => onAgentClick?.(agent)}
  />
{/each}

<!-- Fog for atmosphere -->
<T.FogExp2 color="#0a0a14" density={0.04} />
