<!-- src/lib/components/layout/PageShell.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    actions?: Snippet;
    badge?: string | number;
    /** Remove default padding and overflow scroll — use for full-bleed content like feeds and terminals */
    noPadding?: boolean;
    children?: Snippet;
  }

  let { title, subtitle, actions, badge, noPadding = false, children }: Props = $props();
</script>

<div class="ps-shell">
  <header class="ps-header">
    <div class="ps-title-group">
      <h1 class="ps-title">{title}</h1>
      {#if subtitle}
        <span class="ps-sep" aria-hidden="true">·</span>
        <span class="ps-subtitle">{subtitle}</span>
      {/if}
      {#if badge !== undefined && badge !== null && badge !== ''}
        <span class="ps-badge">{badge}</span>
      {/if}
    </div>
    {#if actions}
      <div class="ps-actions">
        {@render actions()}
      </div>
    {/if}
  </header>
  <div class="ps-content" class:ps-content--no-padding={noPadding}>
    {#if children}{@render children()}{/if}
  </div>
</div>

<style>
  .ps-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .ps-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 52px;
    min-height: 52px;
    padding: 0 24px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
    gap: 12px;
  }

  .ps-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .ps-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    white-space: nowrap;
  }

  .ps-sep {
    color: var(--text-tertiary);
    font-size: 14px;
    flex-shrink: 0;
  }

  .ps-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ps-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 500;
    flex-shrink: 0;
  }

  .ps-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .ps-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }

  .ps-content--no-padding {
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .ps-content::-webkit-scrollbar {
    width: 6px;
  }

  .ps-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .ps-content::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 3px;
  }

  .ps-content::-webkit-scrollbar-thumb:hover {
    background: var(--border-hover);
  }
</style>
