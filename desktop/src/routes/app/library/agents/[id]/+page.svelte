<!-- src/routes/app/library/agents/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import {
    getLibraryAgentDetail,
    type LibraryAgent,
  } from '$lib/api/mock/library';

  const id = $derived(page.params.id ?? '');
  const agent = $derived<LibraryAgent | null>(id ? getLibraryAgentDetail(id) : null);

  // Configuration state
  let budget = $state(0);
  let adapter = $state('osa');

  $effect(() => {
    if (agent) budget = agent.budget;
  });

  const ADAPTERS = ['osa', 'claude_code', 'cursor', 'windsurf', 'aider', 'custom'];

  function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }

  function potencyLabel(p: number): string {
    if (p >= 90) return 'Elite';
    if (p >= 75) return 'Advanced';
    if (p >= 50) return 'Intermediate';
    return 'Starter';
  }

  function potencyColor(p: number): string {
    if (p >= 90) return '#a78bfa';
    if (p >= 75) return '#60a5fa';
    if (p >= 50) return 'rgba(52, 211, 153, 0.6)';
    return '#94a3b8';
  }
</script>

<svelte:head>
  <title>{agent ? `${agent.name} — Library — NULLHACK` : 'Agent — Library — NULLHACK'}</title>
</svelte:head>

<PageShell title={agent?.name ?? 'Agent'} subtitle={agent ? agent.category : undefined}>
  {#if !agent}
    <div class="lda-not-found" role="main">
      <span class="lda-not-found-icon" aria-hidden="true">🔍</span>
      <p class="lda-not-found-text">Agent not found.</p>
      <button
        class="lda-back-btn"
        onclick={() => goto('/app/library')}
        aria-label="Go back to library"
      >
        ← Back to library
      </button>
    </div>
  {:else}
    <div class="lda-page">

      <!-- Top bar -->
      <div class="lda-topbar">
        <button
          class="lda-back"
          onclick={() => goto('/app/library')}
          aria-label="Back to library"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Library
        </button>
        <span class="lda-breadcrumb-sep" aria-hidden="true">/</span>
        <span class="lda-breadcrumb-cur">Agents</span>
      </div>

      <!-- Two-column layout -->
      <div class="lda-layout">

        <!-- LEFT: Hero + content -->
        <div class="lda-main">

          <!-- Hero -->
          <div class="lda-hero">
            <span class="lda-hero-emoji" aria-hidden="true">{agent.emoji}</span>
            <div class="lda-hero-meta">
              <div class="lda-hero-badges">
                {#if agent.isOfficial}
                  <span class="lda-badge lda-badge--official" aria-label="Official agent">Official</span>
                {/if}
                <span class="lda-badge lda-badge--category">{agent.category}</span>
                <span class="lda-badge lda-badge--visibility" aria-label="Visibility: {agent.visibility}">{agent.visibility}</span>
              </div>
              <h1 class="lda-hero-name">{agent.name}</h1>
              <p class="lda-hero-role">{agent.role}</p>
            </div>
          </div>

          <!-- Description -->
          <section class="lda-card" aria-label="Agent description">
            <h2 class="lda-card-title">About</h2>
            <p class="lda-description">{agent.description}</p>
          </section>

          <!-- Stats grid -->
          <section class="lda-card" aria-label="Agent statistics">
            <h2 class="lda-card-title">Stats</h2>
            <div class="lda-stats-grid" role="list">
              <div class="lda-stat" role="listitem">
                <span class="lda-stat-icon" aria-hidden="true">⬇</span>
                <span class="lda-stat-value">{formatNumber(agent.downloads)}</span>
                <span class="lda-stat-label">Downloads</span>
              </div>
              <div class="lda-stat" role="listitem">
                <span class="lda-stat-icon" aria-hidden="true">★</span>
                <span class="lda-stat-value">{formatNumber(agent.favorites)}</span>
                <span class="lda-stat-label">Favorites</span>
              </div>
              <div class="lda-stat" role="listitem">
                <span class="lda-stat-icon" aria-hidden="true">⑂</span>
                <span class="lda-stat-value">{formatNumber(agent.forks)}</span>
                <span class="lda-stat-label">Forks</span>
              </div>
              <div class="lda-stat" role="listitem">
                <span class="lda-stat-icon" aria-hidden="true">◆</span>
                <span class="lda-stat-value">{agent.rating.toFixed(1)}</span>
                <span class="lda-stat-label">Rating</span>
              </div>
              <div class="lda-stat" role="listitem">
                <span
                  class="lda-stat-icon"
                  aria-hidden="true"
                  style="color: {potencyColor(agent.potency)}"
                >⚡</span>
                <span class="lda-stat-value" style="color: {potencyColor(agent.potency)}">
                  {agent.potency}
                </span>
                <span class="lda-stat-label">{potencyLabel(agent.potency)}</span>
              </div>
              <div class="lda-stat" role="listitem">
                <span class="lda-stat-icon" aria-hidden="true">v</span>
                <span class="lda-stat-value">{agent.version}</span>
                <span class="lda-stat-label">Version</span>
              </div>
            </div>
          </section>

          <!-- Tags -->
          {#if agent.tags.length > 0}
            <section class="lda-card" aria-label="Agent tags">
              <h2 class="lda-card-title">Tags</h2>
              <div class="lda-tags" role="list" aria-label="Tags">
                {#each agent.tags as tag}
                  <span class="lda-tag" role="listitem">{tag}</span>
                {/each}
              </div>
            </section>
          {/if}

        </div>

        <!-- RIGHT: Configuration panel -->
        <aside class="lda-sidebar" aria-label="Configuration panel">
          <div class="lda-panel">
            <h2 class="lda-panel-title">Configuration</h2>

            <div class="lda-field">
              <label class="lda-label" for="lda-budget">Budget (tokens)</label>
              <input
                id="lda-budget"
                class="lda-input"
                type="number"
                min="0"
                step="1000"
                bind:value={budget}
                aria-label="Token budget"
              />
            </div>

            <div class="lda-field">
              <label class="lda-label" for="lda-adapter">Adapter</label>
              <select
                id="lda-adapter"
                class="lda-select"
                bind:value={adapter}
                aria-label="Adapter selection"
              >
                {#each ADAPTERS as a}
                  <option value={a}>{a}</option>
                {/each}
              </select>
            </div>

            <div class="lda-panel-meta">
              <div class="lda-meta-row">
                <span class="lda-meta-label">Default adapter</span>
                <span class="lda-meta-value">{agent.adapter}</span>
              </div>
              <div class="lda-meta-row">
                <span class="lda-meta-label">Default budget</span>
                <span class="lda-meta-value">{formatNumber(agent.budget)} tokens</span>
              </div>
              <div class="lda-meta-row">
                <span class="lda-meta-label">Added</span>
                <span class="lda-meta-value">{agent.added_at}</span>
              </div>
            </div>

            <button
              class="lda-import-btn"
              onclick={() => {/* import handler */}}
              aria-label="Import {agent.name} to workspace"
            >
              Import to Workspace
            </button>
          </div>
        </aside>

      </div>
    </div>
  {/if}
</PageShell>

<style>
  /* Not found */
  .lda-not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 100%;
    color: var(--text-tertiary);
    font-size: 13px;
  }

  .lda-not-found-icon {
    font-size: 40px;
    opacity: 0.4;
  }

  .lda-not-found-text {
    margin: 0;
  }

  .lda-back-btn {
    height: 32px;
    padding: 0 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 120ms ease;
  }

  .lda-back-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  /* Page wrapper */
  .lda-page {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 100%;
  }

  /* Top bar */
  .lda-topbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 24px 0;
  }

  .lda-back {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border-radius: var(--radius-xs);
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-tertiary);
    font-size: 12px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 120ms ease;
  }

  .lda-back:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .lda-breadcrumb-sep {
    color: var(--text-muted);
    font-size: 12px;
  }

  .lda-breadcrumb-cur {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* Two-column layout */
  .lda-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    padding: 24px;
    align-items: start;
  }

  .lda-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  /* Hero */
  .lda-hero {
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }

  .lda-hero-emoji {
    font-size: 56px;
    line-height: 1;
    flex-shrink: 0;
  }

  .lda-hero-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding-top: 4px;
  }

  .lda-hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .lda-hero-name {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
  }

  .lda-hero-role {
    font-size: 13px;
    color: var(--text-tertiary);
    margin: 0;
  }

  /* Badges */
  .lda-badge {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
    white-space: nowrap;
  }

  .lda-badge--official {
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.3);
    color: #fbbf24;
  }

  .lda-badge--category {
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
  }

  .lda-badge--visibility {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-tertiary);
    text-transform: capitalize;
  }

  /* Cards */
  .lda-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 16px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .lda-card-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-tertiary);
    margin: 0 0 12px 0;
  }

  .lda-description {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
  }

  /* Stats grid */
  .lda-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .lda-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
  }

  .lda-stat-icon {
    font-size: 16px;
    color: var(--text-muted);
  }

  .lda-stat-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .lda-stat-label {
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
  }

  /* Tags */
  .lda-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .lda-tag {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: var(--radius-xs);
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.2);
    font-size: 12px;
    color: #a5b4fc;
    font-family: var(--font-mono);
  }

  /* Sidebar panel */
  .lda-sidebar {
    position: sticky;
    top: 24px;
  }

  .lda-panel {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 20px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .lda-panel-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .lda-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lda-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--text-tertiary);
  }

  .lda-input,
  .lda-select {
    height: 34px;
    padding: 0 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 13px;
    font-family: var(--font-sans);
    width: 100%;
    box-sizing: border-box;
    transition: border-color 120ms ease;
    outline: none;
  }

  .lda-input:focus,
  .lda-select:focus {
    border-color: var(--accent-primary);
  }

  .lda-select {
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }

  .lda-panel-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
  }

  .lda-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .lda-meta-label {
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .lda-meta-value {
    font-size: 12px;
    color: var(--text-secondary);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lda-import-btn {
    height: 38px;
    width: 100%;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 120ms ease;
  }

  .lda-import-btn:hover {
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(99, 102, 241, 0.6);
    color: #c7d2fe;
  }

  .lda-import-btn:active {
    background: rgba(99, 102, 241, 0.3);
  }
</style>
