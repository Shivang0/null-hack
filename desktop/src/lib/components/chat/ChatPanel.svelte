<!-- src/lib/components/chat/ChatPanel.svelte -->
<!-- Floating right-side chat panel. Fly-in from right. Resizable. -->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { chatStore } from '$lib/stores/chat.svelte';
  import ChatHeader from './ChatHeader.svelte';
  import MessageList from './MessageList.svelte';
  import ChatInput from './ChatInput.svelte';
  import AgentSelector from './AgentSelector.svelte';

  let selectedAgentId = $state<string | undefined>(undefined);

  // Resize state
  let panelWidth = $state(400);
  let isResizing = $state(false);
  let resizeStartX = 0;
  let resizeStartWidth = 0;

  function startResize(e: MouseEvent): void {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartWidth = panelWidth;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent): void {
    if (!isResizing) return;
    const delta = resizeStartX - e.clientX;
    panelWidth = Math.max(300, Math.min(700, resizeStartWidth + delta));
  }

  function stopResize(): void {
    isResizing = false;
  }

  async function handleSend(text: string): Promise<void> {
    await chatStore.sendMessage(text, selectedAgentId || undefined);
  }
</script>

<svelte:window
  onmousemove={onMouseMove}
  onmouseup={stopResize}
/>

{#if chatStore.isPanelOpen}
  <div
    class="cp-panel"
    style="width: {panelWidth}px;"
    class:cp-panel--resizing={isResizing}
    transition:fly={{ x: panelWidth, duration: 280, opacity: 1 }}
    role="complementary"
    aria-label="Chat panel"
  >
    <!-- Drag handle on left edge — uses slider role for a11y compliance -->
    <div
      class="cp-resize-handle"
      role="slider"
      aria-label="Panel width"
      aria-orientation="vertical"
      aria-valuenow={panelWidth}
      aria-valuemin={300}
      aria-valuemax={700}
      tabindex={0}
      onmousedown={startResize}
      onkeydown={(e) => {
        if (e.key === 'ArrowLeft') panelWidth = Math.max(300, panelWidth - 20);
        if (e.key === 'ArrowRight') panelWidth = Math.min(700, panelWidth + 20);
      }}
    ></div>

    <!-- Header -->
    <ChatHeader />

    <!-- Messages -->
    <MessageList />

    <!-- Footer: agent selector + input -->
    <div class="cp-footer">
      <div class="cp-footer-tools">
        <AgentSelector
          selected={selectedAgentId}
          onSelect={(id) => { selectedAgentId = id || undefined; }}
        />
        {#if chatStore.error}
          <span class="cp-error" role="alert">{chatStore.error}</span>
        {/if}
      </div>
      <ChatInput
        isStreaming={chatStore.isStreaming}
        disabled={false}
        onSend={handleSend}
        onCancel={() => chatStore.cancelGeneration()}
      />
    </div>
  </div>
{/if}

<style>
  .cp-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    background: var(--glass-bg, rgba(20, 20, 22, 0.92));
    border-left: 1px solid var(--border-default);
    backdrop-filter: var(--glass-blur);
    z-index: 200;
    min-width: 300px;
    max-width: 700px;
    overflow: hidden;
    box-shadow: -4px 0 32px rgba(0, 0, 0, 0.3);
  }

  .cp-panel--resizing {
    user-select: none;
  }

  .cp-resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5px;
    cursor: ew-resize;
    background: transparent;
    transition: background 0.15s ease;
    z-index: 10;
  }

  .cp-resize-handle:hover {
    background: rgba(59, 130, 246, 0.3);
  }

  .cp-footer {
    flex-shrink: 0;
    border-top: 1px solid var(--border-default);
    background: rgba(0, 0, 0, 0.15);
  }

  .cp-footer-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px 0;
    flex-wrap: wrap;
  }

  .cp-error {
    font-family: var(--font-sans);
    font-size: 11px;
    color: #fca5a5;
    flex: 1;
  }
</style>
