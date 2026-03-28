<!-- src/lib/components/layout/SidebarSection.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { slide } from 'svelte/transition';

  interface Props {
    label: string;
    badge?: number;
    defaultOpen?: boolean;
    children: Snippet;
  }

  let { label, badge, defaultOpen = true, children }: Props = $props();

  let isOpen = $state(defaultOpen);
</script>

<div class="ss-section">
  <button
    class="ss-header"
    onclick={() => { isOpen = !isOpen; }}
    aria-expanded={isOpen}
    aria-label="Toggle {label} section"
  >
    <span class="ss-label">{label}</span>
    {#if badge !== undefined && badge > 0}
      <span class="ss-badge">{badge}</span>
    {/if}
    <span class="ss-chevron" class:open={isOpen} aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </span>
  </button>

  {#if isOpen}
    <div class="ss-content" transition:slide={{ duration: 160 }}>
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .ss-section {
    display: flex;
    flex-direction: column;
  }

  .ss-header {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 24px;
    padding: 0 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    border-radius: var(--radius-xs);
    transition: background 100ms ease;
  }

  .ss-header:hover {
    background: var(--bg-surface);
  }

  .ss-label {
    flex: 1;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .ss-badge {
    font-size: 10px;
    color: var(--text-tertiary);
  }

  .ss-chevron {
    flex-shrink: 0;
    color: var(--text-muted);
    display: flex;
    transition: transform 160ms ease;
  }

  .ss-chevron.open {
    transform: rotate(90deg);
  }

  .ss-content {
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
  }
</style>
