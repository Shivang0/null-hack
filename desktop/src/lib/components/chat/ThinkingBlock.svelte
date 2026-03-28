<!-- src/lib/components/chat/ThinkingBlock.svelte -->
<!-- Collapsible block showing the assistant's extended thinking trace -->
<script lang="ts">
  interface Props {
    thinking: string;
    isStreaming?: boolean;
  }

  let { thinking, isStreaming = false }: Props = $props();

  let expanded = $state(false);

  const preview = $derived(
    thinking.length > 120 ? thinking.slice(0, 120).trimEnd() + '…' : thinking
  );
</script>

<div class="tb-wrap" class:tb-wrap--streaming={isStreaming}>
  <button
    class="tb-toggle"
    onclick={() => (expanded = !expanded)}
    aria-expanded={expanded}
    aria-label="{expanded ? 'Collapse' : 'Expand'} thinking"
  >
    <!-- Brain icon -->
    <svg class="tb-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M9.5 2a2.5 2.5 0 015 0v.5a2.5 2.5 0 01-5 0V2z"/>
      <path d="M12 2.5V5m0 0a7 7 0 110 14m0-14a7 7 0 110 14M12 19v2.5"/>
    </svg>
    <span class="tb-label">
      {#if isStreaming}Thinking…{:else}Thinking{/if}
    </span>
    <svg
      class="tb-chevron"
      class:tb-chevron--open={expanded}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>

  {#if expanded}
    <div class="tb-content" role="region" aria-label="Thinking content">
      <p class="tb-text">{thinking}</p>
    </div>
  {:else}
    <p class="tb-preview" aria-hidden="true">{preview}</p>
  {/if}
</div>

<style>
  .tb-wrap {
    border-radius: var(--radius-md);
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.2);
    overflow: hidden;
    margin: 4px 0 8px;
  }

  .tb-wrap--streaming {
    border-color: rgba(139, 92, 246, 0.35);
    animation: tb-pulse 2s ease-in-out infinite;
  }

  @keyframes tb-pulse {
    0%, 100% { border-color: rgba(139, 92, 246, 0.2); }
    50%       { border-color: rgba(139, 92, 246, 0.45); }
  }

  .tb-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: #a78bfa;
  }

  .tb-toggle:hover {
    background: rgba(139, 92, 246, 0.06);
  }

  .tb-icon {
    flex-shrink: 0;
    color: #a78bfa;
  }

  .tb-label {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    color: #a78bfa;
    letter-spacing: 0.02em;
    flex: 1;
  }

  .tb-chevron {
    flex-shrink: 0;
    transition: transform 0.2s ease;
    color: #a78bfa;
    opacity: 0.7;
  }

  .tb-chevron--open {
    transform: rotate(180deg);
  }

  .tb-content {
    padding: 0 12px 10px;
  }

  .tb-text {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 12px;
    line-height: 1.65;
    color: rgba(167, 139, 250, 0.85);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tb-preview {
    margin: 0;
    padding: 0 12px 8px;
    font-family: var(--font-sans);
    font-size: 12px;
    line-height: 1.5;
    color: rgba(167, 139, 250, 0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (prefers-reduced-motion: reduce) {
    .tb-wrap--streaming { animation: none; }
  }
</style>
