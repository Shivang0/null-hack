<!-- src/lib/components/office/AgentDesk3D.svelte -->
<!-- Individual agent desk + character in 3D space -->
<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { Text, Float } from '@threlte/extras';
  import type { CanopyAgent } from '$api/types';

  interface Props {
    agent: CanopyAgent;
    position: [number, number, number];
    selected: boolean;
    emissive: string;
    onclick: () => void;
  }

  let { agent, position, selected, emissive, onclick }: Props = $props();

  // Deterministic color from agent id
  function agentColor(id: string): string {
    let hash = 5381;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash + id.charCodeAt(i)) >>> 0;
    }
    const hue = hash % 360;
    return `hsl(${hue}, 50%, 45%)`;
  }

  // Breathing / working animation
  let bobY = $state(0);
  const isActive = $derived(agent.status === 'running' || agent.status === 'idle');

  useTask(() => {
    if (isActive) {
      bobY = Math.sin(Date.now() * 0.003) * 0.05;
    } else {
      bobY = 0;
    }
  });

  const color = agentColor(agent.id);
  const label = agent.display_name || agent.name;
  const shortLabel = label.length > 10 ? label.slice(0, 10) + '...' : label;
</script>

<T.Group position.x={position[0]} position.y={position[1]} position.z={position[2]}>
  <!-- Desk surface -->
  <T.Mesh position.y={0.45} castShadow>
    <T.BoxGeometry args={[1.8, 0.08, 0.9]} />
    <T.MeshStandardMaterial color="#2d2a4a" roughness={0.7} metalness={0.2} />
  </T.Mesh>

  <!-- Desk legs -->
  {#each [[-0.8, 0.22, -0.35], [0.8, 0.22, -0.35], [-0.8, 0.22, 0.35], [0.8, 0.22, 0.35]] as leg}
    <T.Mesh position={leg as [number, number, number]}>
      <T.CylinderGeometry args={[0.03, 0.03, 0.44, 6]} />
      <T.MeshStandardMaterial color="#1e1e35" />
    </T.Mesh>
  {/each}

  <!-- Monitor on desk -->
  <T.Mesh position={[0, 0.7, -0.25]}>
    <T.BoxGeometry args={[0.6, 0.4, 0.03]} />
    <T.MeshStandardMaterial
      color={agent.status === 'running' ? '#0a1628' : '#0a0a14'}
      emissive={agent.status === 'running' ? emissive : '#000000'}
      emissiveIntensity={agent.status === 'running' ? 0.3 : 0}
    />
  </T.Mesh>
  <!-- Monitor stand -->
  <T.Mesh position={[0, 0.52, -0.25]}>
    <T.CylinderGeometry args={[0.04, 0.06, 0.08, 8]} />
    <T.MeshStandardMaterial color="#1e1e35" />
  </T.Mesh>

  <!-- Chair -->
  <T.Mesh position={[0, 0.35, 0.6]}>
    <T.BoxGeometry args={[0.5, 0.06, 0.5]} />
    <T.MeshStandardMaterial color="#1a1a30" roughness={0.9} />
  </T.Mesh>
  <!-- Chair back -->
  <T.Mesh position={[0, 0.6, 0.82]}>
    <T.BoxGeometry args={[0.5, 0.45, 0.06]} />
    <T.MeshStandardMaterial color="#1a1a30" roughness={0.9} />
  </T.Mesh>

  <!-- Agent character (stylized capsule) -->
  <T.Group position={[0, 0.9 + bobY, 0.6]}>
    <!-- Body -->
    <T.Mesh castShadow onclick={onclick}>
      <T.CapsuleGeometry args={[0.18, 0.35, 4, 12]} />
      <T.MeshStandardMaterial
        {color}
        roughness={0.6}
        metalness={0.1}
        emissive={selected ? '#6366f1' : emissive}
        emissiveIntensity={selected ? 0.5 : (agent.status === 'running' ? 0.3 : 0.05)}
      />
    </T.Mesh>

    <!-- Head -->
    <T.Mesh position.y={0.38} castShadow onclick={onclick}>
      <T.SphereGeometry args={[0.15, 16, 12]} />
      <T.MeshStandardMaterial
        color="#e8d5c4"
        roughness={0.8}
        emissive={selected ? '#6366f1' : '#000000'}
        emissiveIntensity={selected ? 0.3 : 0}
      />
    </T.Mesh>

    <!-- Status ring (glowing torus around the agent) -->
    {#if agent.status === 'running' || selected}
      <T.Mesh position.y={-0.1} rotation.x={Math.PI / 2}>
        <T.TorusGeometry args={[0.35, 0.02, 8, 32]} />
        <T.MeshBasicMaterial
          color={selected ? '#6366f1' : emissive}
          transparent
          opacity={0.6}
        />
      </T.Mesh>
    {/if}

    <!-- Selection glow -->
    {#if selected}
      <T.PointLight position.y={0.5} intensity={1} color="#6366f1" distance={3} decay={2} />
    {/if}
  </T.Group>

  <!-- Agent name label floating above -->
  <T.Group position={[0, 1.8, 0.6]}>
    <Float speed={2} floatIntensity={0.15}>
      <Text
        text={shortLabel}
        fontSize={0.15}
        color={selected ? '#a5b4fc' : '#8888a0'}
        anchorX="center"
        anchorY="middle"
      />
    </Float>
  </T.Group>

  <!-- Status label -->
  <T.Group position={[0, 1.6, 0.6]}>
    <Text
      text={agent.status}
      fontSize={0.1}
      color={emissive}
      anchorX="center"
      anchorY="middle"
    />
  </T.Group>

  <!-- Current task speech bubble (if running) -->
  {#if agent.status === 'running' && agent.current_task}
    <T.Group position={[0, 2.1, 0.6]}>
      <Float speed={3} floatIntensity={0.2}>
        <Text
          text={agent.current_task.slice(0, 30)}
          fontSize={0.08}
          color="rgba(34, 197, 94, 0.7)"
          anchorX="center"
          anchorY="middle"
        />
      </Float>
    </T.Group>
  {/if}
</T.Group>
