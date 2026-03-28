<!-- src/lib/components/chat/DelegationIndicator.svelte -->
<!-- Small pill indicating this message was delegated to a specific agent -->
<script lang="ts">
  interface Props {
    agentName: string;
    agentEmoji?: string;
  }

  let { agentName, agentEmoji }: Props = $props();
</script>

<span class="di-pill" aria-label="Delegated to {agentName}">
  {#if agentEmoji}
    <span class="di-emoji" aria-hidden="true">{agentEmoji}</span>
  {/if}
  <svg class="di-arrow" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
  <span class="di-name">{agentName}</span>
</span>

<style>
  .di-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px 2px 6px;
    border-radius: 9999px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.22);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    color: #93c5fd;
    white-space: nowrap;
  }

  .di-emoji {
    font-size: 12px;
    line-height: 1;
  }

  .di-arrow {
    flex-shrink: 0;
    opacity: 0.75;
  }

  .di-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
