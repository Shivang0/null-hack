<!-- src/lib/components/chat/AgentSelector.svelte -->
<!-- Compact agent picker for routing a chat message to a specific agent -->
<script lang="ts">
  import { agents as agentsApi } from '$lib/api/client';
  import type { CanopyAgent } from '$lib/api/types';

  interface Props {
    selected?: string;
    onSelect: (agentId: string) => void;
  }

  let { selected, onSelect }: Props = $props();

  let agentList = $state<CanopyAgent[]>([]);
  let isOpen = $state(false);
  let isLoading = $state(false);
  let containerEl = $state<HTMLDivElement | null>(null);

  const selectedAgent = $derived(
    agentList.find((a) => a.id === selected) ?? null
  );

  const displayLabel = $derived(
    selectedAgent
      ? `${selectedAgent.avatar_emoji} ${selectedAgent.display_name}`
      : 'Default Agent'
  );

  async function loadAgents(): Promise<void> {
    if (agentList.length > 0) return;
    isLoading = true;
    try {
      agentList = await agentsApi.list();
    } catch {
      // Non-fatal — show empty list
    } finally {
      isLoading = false;
    }
  }

  function toggle(): void {
    if (!isOpen) loadAgents();
    isOpen = !isOpen;
  }

  function select(agentId: string): void {
    onSelect(agentId);
    isOpen = false;
  }

  // Close on outside click
  function handleOutside(e: MouseEvent): void {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      isOpen = false;
    }
  }

  $effect(() => {
    if (isOpen) {
      window.addEventListener('mousedown', handleOutside);
      return () => window.removeEventListener('mousedown', handleOutside);
    }
  });
</script>

<div class="as-wrap" bind:this={containerEl}>
  <button
    class="as-trigger"
    onclick={toggle}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label="Select agent: {displayLabel}"
  >
    <span class="as-label">{displayLabel}</span>
    <svg
      class="as-chevron"
      class:as-chevron--open={isOpen}
      width="11" height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>

  {#if isOpen}
    <div class="as-dropdown" role="listbox" aria-label="Available agents">
      {#if isLoading}
        <p class="as-empty">Loading agents…</p>
      {:else if agentList.length === 0}
        <p class="as-empty">No agents configured</p>
      {:else}
        <!-- Default option -->
        <button
          class="as-option"
          class:as-option--active={!selected}
          role="option"
          aria-selected={!selected}
          onclick={() => select('')}
        >
          <span class="as-emoji">🤖</span>
          <span class="as-name">Default Agent</span>
        </button>
        {#each agentList as agent (agent.id)}
          <button
            class="as-option"
            class:as-option--active={selected === agent.id}
            role="option"
            aria-selected={selected === agent.id}
            onclick={() => select(agent.id)}
          >
            <span class="as-emoji">{agent.avatar_emoji}</span>
            <span class="as-name">{agent.display_name}</span>
            <span class="as-role">{agent.role}</span>
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .as-wrap {
    position: relative;
    display: inline-block;
  }

  .as-trigger {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 9px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: rgba(255, 255, 255, 0.04);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    transition: border-color 0.15s ease, background 0.15s ease;
    white-space: nowrap;
  }

  .as-trigger:hover {
    border-color: var(--border-hover);
    background: rgba(255, 255, 255, 0.07);
  }

  .as-label {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .as-chevron {
    flex-shrink: 0;
    transition: transform 0.2s ease;
    opacity: 0.6;
  }

  .as-chevron--open {
    transform: rotate(180deg);
  }

  .as-dropdown {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    min-width: 200px;
    border-radius: var(--radius-md);
    background: var(--glass-bg, rgba(28, 28, 30, 0.95));
    border: 1px solid var(--border-default);
    box-shadow: var(--glass-shadow);
    backdrop-filter: var(--glass-blur);
    overflow: hidden;
    z-index: 50;
  }

  .as-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.12s ease;
  }

  .as-option:hover {
    background: rgba(255, 255, 255, 0.07);
  }

  .as-option--active {
    background: rgba(59, 130, 246, 0.12);
  }

  .as-emoji {
    font-size: 14px;
    flex-shrink: 0;
    line-height: 1;
  }

  .as-name {
    flex: 1;
    font-family: var(--font-sans);
    font-size: 12.5px;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .as-role {
    font-family: var(--font-sans);
    font-size: 10.5px;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .as-empty {
    margin: 0;
    padding: 12px;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-tertiary);
    text-align: center;
  }
</style>
