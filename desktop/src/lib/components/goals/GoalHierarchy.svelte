<!-- src/lib/components/goals/GoalHierarchy.svelte -->
<!-- Recursive tree view for goal hierarchy -->
<script lang="ts">
  import type { GoalTreeNode } from '$api/types';
  import GoalCard from './GoalCard.svelte';
  import { goalsStore } from '$lib/stores/goals.svelte';

  interface Props {
    nodes: GoalTreeNode[];
    depth?: number;
  }

  let { nodes, depth = 0 }: Props = $props();

  // Per-node expand state — keyed by goal id
  let expanded = $state<Record<string, boolean>>({});

  function toggle(id: string) {
    expanded[id] = !(expanded[id] ?? true);
  }

  // Default all nodes expanded on first render
  $effect(() => {
    for (const n of nodes) {
      if (!(n.id in expanded)) {
        expanded[n.id] = true;
      }
    }
  });

  const MAX_VISUAL_DEPTH = 4;
</script>

<div class="gh-level" role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? 'Goals hierarchy' : undefined}>
  {#each nodes as node (node.id)}
    <div class="gh-node" style="--depth: {Math.min(depth, MAX_VISUAL_DEPTH)}" role="treeitem" aria-expanded={node.children.length > 0 ? expanded[node.id] ?? true : undefined}>
      {#if depth > 0}
        <div class="gh-connector" aria-hidden="true"></div>
      {/if}

      <div class="gh-item">
        {#if node.children.length > 0}
          <button
            class="gh-toggle"
            onclick={() => toggle(node.id)}
            aria-label="{expanded[node.id] ?? true ? 'Collapse' : 'Expand'} sub-goals for {node.title}"
            type="button"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              class:gh-toggle-icon--open={expanded[node.id] ?? true}
              class="gh-toggle-icon"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        {:else}
          <div class="gh-leaf-indicator" aria-hidden="true">
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
              <circle cx="4" cy="4" r="2.5" fill="currentColor" />
            </svg>
          </div>
        {/if}

        <div class="gh-card-wrap">
          <GoalCard goal={node} onSelect={(g) => goalsStore.selectGoal(g)} />
        </div>
      </div>

      {#if node.children.length > 0 && (expanded[node.id] ?? true) && depth < MAX_VISUAL_DEPTH}
        <div class="gh-children">
          <svelte:self nodes={node.children} depth={depth + 1} />
        </div>
      {:else if node.children.length > 0 && (expanded[node.id] ?? true) && depth >= MAX_VISUAL_DEPTH}
        <div class="gh-max-depth" role="note" aria-label="Maximum nesting depth reached">
          <span>{node.children.length} more sub-goals (max depth reached)</span>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .gh-level {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .gh-node {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
  }

  .gh-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  /* Connector line for non-root levels */
  .gh-connector {
    position: absolute;
    left: calc(var(--depth, 0) * 24px - 12px);
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--border-default);
    pointer-events: none;
  }

  .gh-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    border-radius: var(--radius-xs);
    margin-top: 12px;
    transition: color 100ms ease, background 100ms ease;
  }

  .gh-toggle:hover { background: rgba(255,255,255,0.06); color: var(--text-secondary); }
  .gh-toggle:focus-visible { outline: 2px solid var(--accent-primary); }

  .gh-toggle-icon {
    transform: rotate(0deg);
    transition: transform 200ms ease;
    flex-shrink: 0;
  }

  .gh-toggle-icon--open {
    transform: rotate(90deg);
  }

  .gh-leaf-indicator {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    margin-top: 12px;
  }

  .gh-card-wrap {
    flex: 1;
    min-width: 0;
  }

  .gh-children {
    padding-left: 26px;
    border-left: 1px solid var(--border-default);
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .gh-max-depth {
    padding-left: 26px;
    margin-left: 10px;
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
