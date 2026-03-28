<!-- src/lib/components/chat/ChatHeader.svelte -->
<!-- Panel header: agent name, session title, session switcher, new session button -->
<script lang="ts">
  import { chatStore } from '$lib/stores/chat.svelte';
  import type { Session } from '$lib/api/types';

  let isSwitcherOpen = $state(false);
  let switcherEl = $state<HTMLDivElement | null>(null);

  const title = $derived(
    chatStore.currentSession?.title ??
    chatStore.currentSession?.agent_name ??
    'New Chat'
  );

  const agentName = $derived(
    chatStore.currentSession?.agent_name ?? 'NULLHACK'
  );

  async function newSession(): Promise<void> {
    isSwitcherOpen = false;
    await chatStore.createSession();
  }

  async function switchSession(session: Session): Promise<void> {
    isSwitcherOpen = false;
    await chatStore.loadSession(session.id);
  }

  // Close switcher on outside click
  function handleOutside(e: MouseEvent): void {
    if (switcherEl && !switcherEl.contains(e.target as Node)) {
      isSwitcherOpen = false;
    }
  }

  $effect(() => {
    if (isSwitcherOpen) {
      chatStore.listSessions();
      window.addEventListener('mousedown', handleOutside);
      return () => window.removeEventListener('mousedown', handleOutside);
    }
  });
</script>

<header class="ch-wrap">
  <div class="ch-main">
    <!-- Session switcher trigger -->
    <div class="ch-switcher" bind:this={switcherEl}>
      <button
        class="ch-title-btn"
        onclick={() => (isSwitcherOpen = !isSwitcherOpen)}
        aria-haspopup="listbox"
        aria-expanded={isSwitcherOpen}
        aria-label="Switch session: {title}"
      >
        <div class="ch-info">
          <span class="ch-agent">{agentName}</span>
          <span class="ch-title">{title}</span>
        </div>
        <svg
          class="ch-chevron"
          class:ch-chevron--open={isSwitcherOpen}
          width="12" height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {#if isSwitcherOpen}
        <div class="ch-dropdown" role="listbox" aria-label="Sessions">
          <button class="ch-new-btn" onclick={newSession}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Session
          </button>

          {#if chatStore.isLoadingSessions}
            <p class="ch-loading">Loading…</p>
          {:else if chatStore.sessions.length === 0}
            <p class="ch-empty">No sessions yet</p>
          {:else}
            <div class="ch-divider" role="separator"></div>
            {#each chatStore.sessions as session (session.id)}
              <button
                class="ch-session-item"
                class:ch-session-item--active={chatStore.currentSession?.id === session.id}
                role="option"
                aria-selected={chatStore.currentSession?.id === session.id}
                onclick={() => switchSession(session)}
              >
                <span class="ch-session-name">
                  {session.title ?? session.agent_name ?? 'Untitled'}
                </span>
                <span class="ch-session-meta">
                  {session.message_count} msg
                </span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Close button -->
  <button
    class="ch-close"
    onclick={() => chatStore.closePanel()}
    aria-label="Close chat panel"
    title="Close (⌘/)"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
</header>

<style>
  .ch-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .ch-main {
    flex: 1;
    min-width: 0;
    position: relative;
  }

  .ch-switcher {
    position: relative;
  }

  .ch-title-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 3px 6px 3px 0;
    border-radius: var(--radius-sm);
    transition: background 0.15s ease;
    max-width: 240px;
  }

  .ch-title-btn:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .ch-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    min-width: 0;
  }

  .ch-agent {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    line-height: 1;
  }

  .ch-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .ch-chevron {
    flex-shrink: 0;
    color: var(--text-tertiary);
    transition: transform 0.2s ease;
  }

  .ch-chevron--open {
    transform: rotate(180deg);
  }

  /* Dropdown */
  .ch-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 260px;
    border-radius: var(--radius-md);
    background: var(--glass-bg, rgba(20, 20, 22, 0.97));
    border: 1px solid var(--border-default);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    backdrop-filter: var(--glass-blur);
    overflow: hidden;
    z-index: 100;
    padding: 4px 0;
  }

  .ch-new-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 9px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 12.5px;
    font-weight: 500;
    color: var(--accent-primary, #3b82f6);
    text-align: left;
    transition: background 0.12s ease;
  }

  .ch-new-btn:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .ch-divider {
    height: 1px;
    background: var(--border-default);
    margin: 2px 0;
  }

  .ch-session-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.12s ease;
  }

  .ch-session-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .ch-session-item--active {
    background: rgba(59, 130, 246, 0.1);
  }

  .ch-session-name {
    flex: 1;
    font-family: var(--font-sans);
    font-size: 12.5px;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ch-session-meta {
    font-family: var(--font-sans);
    font-size: 10.5px;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .ch-loading,
  .ch-empty {
    margin: 0;
    padding: 10px 14px;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-tertiary);
  }

  /* Close button */
  .ch-close {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    transition: background 0.15s ease, color 0.15s ease;
  }

  .ch-close:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-primary);
  }
</style>
