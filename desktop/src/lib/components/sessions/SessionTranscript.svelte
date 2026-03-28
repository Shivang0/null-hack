<!-- src/lib/components/sessions/SessionTranscript.svelte -->
<!-- Full session transcript viewer with live streaming, search, and auto-scroll -->
<script lang="ts">
  import { tick } from 'svelte';
  import type { Message } from '$lib/api/types';
  import MessageBubble from '$lib/components/chat/MessageBubble.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import StreamingCursor from '$lib/components/chat/StreamingCursor.svelte';

  interface Props {
    messages: Message[];
    loading?: boolean;
    isLive?: boolean;
    sessionTitle?: string;
  }

  let { messages, loading = false, isLive = false, sessionTitle }: Props = $props();

  let scrollEl = $state<HTMLDivElement | null>(null);
  let searchQuery = $state('');
  let autoScroll = $state(true);
  let userScrolledUp = $state(false);

  // Filtered messages for search
  const filteredMessages = $derived.by(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.tool_calls?.some(
          (tc) =>
            tc.name.toLowerCase().includes(q) ||
            JSON.stringify(tc.input).toLowerCase().includes(q),
        ),
    );
  });

  const matchCount = $derived(
    searchQuery.trim() ? filteredMessages.length : 0
  );

  // Auto-scroll to bottom when messages change and live + not user-scrolled
  $effect(() => {
    // Track messages.length as dependency
    void messages.length;
    if (autoScroll && !userScrolledUp && scrollEl) {
      tick().then(() => {
        scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
      });
    }
  });

  function handleScroll() {
    if (!scrollEl) return;
    const distFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    userScrolledUp = distFromBottom > 80;
    autoScroll = !userScrolledUp;
  }

  function scrollToBottom() {
    scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
    userScrolledUp = false;
    autoScroll = true;
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
</script>

<div class="st-root">
  <!-- Toolbar -->
  <div class="st-toolbar">
    <div class="st-title-row">
      <span class="st-title">
        {sessionTitle ?? 'Transcript'}
      </span>
      {#if isLive}
        <span class="st-live-badge" aria-label="Live session">
          <span class="st-live-dot" aria-hidden="true"></span>
          Live
        </span>
      {/if}
      <span class="st-count">{messages.length} msg{messages.length !== 1 ? 's' : ''}</span>
    </div>

    <!-- Search -->
    <label class="st-search" aria-label="Search transcript">
      <svg class="st-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="search"
        class="st-search-input"
        placeholder="Search transcript…"
        bind:value={searchQuery}
        aria-label="Search within transcript"
      />
      {#if matchCount > 0}
        <span class="st-search-count" aria-live="polite">{matchCount}</span>
      {/if}
    </label>
  </div>

  <!-- Message list -->
  <div
    class="st-messages"
    bind:this={scrollEl}
    onscroll={handleScroll}
    role="log"
    aria-label="Session transcript"
    aria-live={isLive ? 'polite' : 'off'}
    aria-atomic="false"
  >
    {#if loading}
      <div class="st-loading" aria-label="Loading transcript" aria-live="polite">
        <LoadingSpinner size="sm" />
        <span>Loading transcript…</span>
      </div>
    {:else if filteredMessages.length === 0}
      <div class="st-empty" role="status">
        {#if searchQuery.trim()}
          <p class="st-empty-text">No messages match "<strong>{searchQuery}</strong>"</p>
        {:else}
          <p class="st-empty-text">No messages yet</p>
        {/if}
      </div>
      {#if isLive}
        <div class="st-live-indicator" aria-label="Waiting for response">
          <span class="st-live-agent-dot" aria-hidden="true"></span>
          <span class="st-live-text">NULLHACK is responding</span>
          <StreamingCursor />
        </div>
      {/if}
    {:else}
      {#each filteredMessages as message (message.id)}
        <div
          class="st-message-wrap"
          class:st-message-wrap--user={message.role === 'user'}
          class:st-message-wrap--system={message.role === 'system'}
        >
          <!-- Timestamp -->
          <time
            class="st-ts"
            class:st-ts--right={message.role === 'user'}
            datetime={message.timestamp}
            aria-label="Message at {formatTime(message.timestamp)}"
          >
            {formatTime(message.timestamp)}
          </time>
          <MessageBubble {message} />
        </div>
      {/each}

      {#if isLive}
        <div class="st-live-indicator" aria-label="Waiting for response">
          <span class="st-live-agent-dot" aria-hidden="true"></span>
          <span class="st-live-text">NULLHACK is responding</span>
          <StreamingCursor />
        </div>
      {/if}
    {/if}
  </div>

  <!-- Scroll-to-bottom FAB -->
  {#if userScrolledUp && messages.length > 0}
    <button
      class="st-scroll-fab"
      onclick={scrollToBottom}
      aria-label="Scroll to latest message"
      title="Scroll to bottom"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  {/if}
</div>

<style>
  .st-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  /* Toolbar */
  .st-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .st-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .st-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .st-live-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.25);
    font-size: 10.5px;
    font-weight: 600;
    color: #60a5fa;
    white-space: nowrap;
  }

  .st-live-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #60a5fa;
    animation: st-pulse 1.5s ease-in-out infinite;
  }

  @keyframes st-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .st-count {
    font-size: 11px;
    color: var(--text-muted, #555);
    white-space: nowrap;
  }

  /* Search */
  .st-search {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm, 6px);
    padding: 4px 9px;
    transition: border-color var(--transition-fast, 150ms) ease;
  }

  .st-search:focus-within {
    border-color: var(--border-hover);
  }

  .st-search-icon {
    color: var(--text-muted, #555);
    flex-shrink: 0;
  }

  .st-search-input {
    background: transparent;
    border: none;
    outline: none;
    font-size: 12px;
    color: var(--text-primary);
    font-family: var(--font-sans);
    width: 160px;
  }

  .st-search-input::placeholder {
    color: var(--text-muted, #555);
  }

  .st-search-count {
    padding: 1px 5px;
    border-radius: 9px;
    background: rgba(59, 130, 246, 0.15);
    font-size: 10px;
    font-weight: 600;
    color: #93c5fd;
  }

  /* Message list */
  .st-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .st-messages::-webkit-scrollbar { width: 4px; }
  .st-messages::-webkit-scrollbar-track { background: transparent; }
  .st-messages::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }
  .st-messages::-webkit-scrollbar-thumb:hover { background: var(--border-hover); }

  /* Message wrapper */
  .st-message-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 8px;
  }

  .st-message-wrap--user {
    align-items: flex-end;
  }

  .st-message-wrap--system {
    align-items: center;
  }

  /* Timestamp */
  .st-ts {
    font-size: 10px;
    color: var(--text-muted, #555);
    font-family: var(--font-mono, ui-monospace, monospace);
    padding: 0 2px;
    margin-bottom: 1px;
  }

  .st-ts--right {
    text-align: right;
  }

  /* Loading */
  .st-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex: 1;
    min-height: 200px;
    color: var(--text-tertiary);
    font-size: 12.5px;
  }

  /* Empty */
  .st-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 200px;
  }

  .st-empty-text {
    margin: 0;
    font-size: 13px;
    color: var(--text-tertiary);
  }

  /* Live responding indicator */
  .st-live-indicator {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 10px;
    margin-top: 4px;
  }

  .st-live-agent-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.5);
    animation: st-pulse 1.2s ease-in-out infinite;
  }

  .st-live-text {
    font-size: 12px;
    color: var(--text-tertiary);
    font-style: italic;
  }

  /* Scroll FAB */
  .st-scroll-fab {
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-elevated);
    border: 1px solid var(--border-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    transition: border-color var(--transition-fast, 150ms) ease, transform var(--transition-fast, 150ms) ease;
  }

  .st-scroll-fab:hover {
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
    color: var(--text-primary);
  }

  .st-scroll-fab:focus-visible {
    outline: 2px solid rgba(59, 130, 246, 0.5);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .st-live-dot,
    .st-live-agent-dot { animation: none; }
  }
</style>
