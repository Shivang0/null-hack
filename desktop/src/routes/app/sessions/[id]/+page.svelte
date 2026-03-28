<!-- src/routes/app/sessions/[id]/+page.svelte -->
<!-- Session detail: overview header + execution workspace (transcript + tool outputs) -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import SessionOverview from '$lib/components/sessions/SessionOverview.svelte';
  import ExecutionWorkspace from '$lib/components/sessions/ExecutionWorkspace.svelte';
  import SessionContinuity from '$lib/components/sessions/SessionContinuity.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import { sessionsStore } from '$lib/stores/sessions.svelte';
  import { toastStore } from '$lib/stores/toasts.svelte';

  const sessionId = $derived($page.params.id);

  onMount(async () => {
    if (!sessionId) return;
    // Reset chain when entering a new session detail view
    sessionsStore.chain = null;
    await sessionsStore.fetchById(sessionId);
    await sessionsStore.fetchTranscript(sessionId);

    // Start live stream if the session is active
    if (sessionsStore.selectedSession?.status === 'active') {
      sessionsStore.startLiveStream(sessionId);
    }
  });

  onDestroy(() => {
    sessionsStore.stopLiveStream();
    sessionsStore.chain = null;
  });

  async function handleReplay() {
    if (!sessionsStore.selectedSession) return;
    // Re-fetch transcript to "replay" the session from the beginning
    await sessionsStore.fetchTranscript(sessionsStore.selectedSession.id);
    if (sessionsStore.selectedSession.status === 'active') {
      sessionsStore.startLiveStream(sessionsStore.selectedSession.id);
    }
    toastStore.success('Replaying session', 'Transcript reloaded from the beginning.');
  }

  function handleExport() {
    if (!sessionsStore.selectedSession) return;
    const text = sessionsStore.transcript
      .map((m) => `[${m.role.toUpperCase()}] ${m.timestamp}\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionsStore.selectedSession.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<PageShell title="Session Detail">
  {#snippet actions()}
    <button
      class="sdp-back-btn"
      onclick={() => goto('/app/sessions')}
      aria-label="Back to sessions list"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Sessions
    </button>
  {/snippet}

  {#snippet children()}
    {#if sessionsStore.loading && !sessionsStore.selectedSession}
      <div class="sdp-loading" aria-label="Loading session" aria-live="polite">
        <LoadingSpinner size="md" />
        <span>Loading session…</span>
      </div>
    {:else if !sessionsStore.selectedSession}
      <div class="sdp-notfound" role="status">
        <p class="sdp-notfound-text">Session not found</p>
        <button class="sdp-back-link" onclick={() => goto('/app/sessions')}>
          Back to sessions
        </button>
      </div>
    {:else}
      <div class="sdp-layout">
        <!-- Overview header -->
        <SessionOverview
          session={sessionsStore.selectedSession}
          onReplay={handleReplay}
          onExport={handleExport}
        />

        <!-- Continuity panel -->
        <SessionContinuity
          session={sessionsStore.selectedSession}
          chain={sessionsStore.chain}
          chainLoading={sessionsStore.chainLoading}
          onCompact={() => sessionsStore.compactSession(sessionsStore.selectedSession!.id)}
          onLoadChain={() => sessionsStore.fetchChain(sessionsStore.selectedSession!.id)}
        />

        <!-- Execution workspace (transcript + tool outputs) -->
        <div class="sdp-workspace">
          <ExecutionWorkspace
            session={sessionsStore.selectedSession}
            messages={sessionsStore.transcript}
            transcriptLoading={sessionsStore.transcriptLoading}
            isLive={sessionsStore.isLive}
          />
        </div>
      </div>
    {/if}
  {/snippet}
</PageShell>

<style>
  /* Override PageShell padding — workspace owns its own layout */
  :global(.ps-content:has(.sdp-layout)) {
    padding: 0;
    overflow-y: auto;
  }

  .sdp-layout {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .sdp-workspace {
    flex: 1;
    min-height: 0;
  }

  /* Back button */
  .sdp-back-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: var(--radius-sm, 6px);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-sans);
    transition:
      border-color var(--transition-fast, 150ms) ease,
      color var(--transition-fast, 150ms) ease;
  }

  .sdp-back-btn:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .sdp-back-btn:focus-visible {
    outline: 2px solid rgba(59, 130, 246, 0.5);
    outline-offset: 1px;
  }

  /* Loading state */
  .sdp-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 240px;
    color: var(--text-tertiary);
    font-size: 13px;
  }

  /* Not found */
  .sdp-notfound {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 240px;
  }

  .sdp-notfound-text {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .sdp-back-link {
    padding: 6px 14px;
    border-radius: var(--radius-sm, 6px);
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    font-family: var(--font-sans);
    transition: border-color var(--transition-fast, 150ms) ease;
  }

  .sdp-back-link:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }
</style>
