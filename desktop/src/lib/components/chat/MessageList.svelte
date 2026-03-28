<!-- src/lib/components/chat/MessageList.svelte -->
<!-- Scrollable list of messages. Auto-scrolls to bottom on new messages. -->
<script lang="ts">
  import MessageBubble from './MessageBubble.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import { chatStore } from '$lib/stores/chat.svelte';

  let container = $state<HTMLDivElement | null>(null);

  const allMessages = $derived([
    ...chatStore.messages,
    ...(chatStore.pendingUserMessage ? [chatStore.pendingUserMessage] : []),
  ]);

  // Scroll to bottom whenever messages grow
  $effect(() => {
    if (allMessages.length && container) {
      container.scrollTop = container.scrollHeight;
    }
  });

  // Determine whether the last message is a streaming assistant turn
  const lastIdx = $derived(allMessages.length - 1);
</script>

<div class="ml-wrap" bind:this={container} role="log" aria-label="Chat messages" aria-live="polite">
  {#if chatStore.isLoadingMessages}
    <div class="ml-loading">
      <LoadingSpinner size="md" label="Loading messages" />
    </div>
  {:else if allMessages.length === 0 && !chatStore.isStreaming}
    <div class="ml-empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/>
      </svg>
      <p>Start a conversation</p>
    </div>
  {:else}
    {#each allMessages as msg, i (msg.id)}
      <div class="ml-row ml-row--{msg.role}">
        <MessageBubble
          message={msg}
          isStreaming={chatStore.isStreaming && i === lastIdx && msg.role !== 'user'}
          thinkingText={chatStore.isStreaming && i === lastIdx && msg.role !== 'user'
            ? chatStore.streaming.thinkingBuffer
            : undefined}
          liveText={chatStore.isStreaming && i === lastIdx && msg.role !== 'user'
            ? chatStore.streaming.textBuffer
            : undefined}
        />
      </div>
    {/each}

    <!-- Streaming assistant turn (before message is finalized) -->
    {#if chatStore.isStreaming && (chatStore.streaming.textBuffer || chatStore.streaming.thinkingBuffer || chatStore.streaming.toolCalls.length > 0) && !chatStore.pendingUserMessage}
      <!-- Covered by the live props above; this guards the empty-buffer case -->
    {/if}
  {/if}
</div>

<style>
  .ml-wrap {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
  }

  /* Custom scrollbar */
  .ml-wrap::-webkit-scrollbar {
    width: 4px;
  }
  .ml-wrap::-webkit-scrollbar-track {
    background: transparent;
  }
  .ml-wrap::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  .ml-wrap::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .ml-row {
    display: flex;
    width: 100%;
  }

  .ml-row--user {
    justify-content: flex-end;
  }

  .ml-row--assistant,
  .ml-row--system,
  .ml-row--tool {
    justify-content: flex-start;
  }

  .ml-loading,
  .ml-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--text-tertiary);
    font-family: var(--font-sans);
    font-size: 13px;
  }

  .ml-empty svg {
    opacity: 0.35;
  }

  .ml-empty p {
    margin: 0;
    color: var(--text-tertiary);
  }
</style>
