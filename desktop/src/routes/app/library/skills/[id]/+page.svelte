<!-- src/routes/app/library/skills/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import {
    getLibrarySkillDetail,
    type LibrarySkill,
  } from '$lib/api/mock/library';

  const id = $derived(page.params.id ?? '');
  const skill = $derived<LibrarySkill | null>(id ? getLibrarySkillDetail(id) : null);

  // Configuration state
  let enabled = $state(false);

  $effect(() => {
    if (skill) enabled = skill.enabled;
  });

  function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }

  function categoryColor(cat: string): string {
    const map: Record<string, string> = {
      'ai-patterns': '#a78bfa',
      'development': '#60a5fa',
      'communication': 'rgba(52, 211, 153, 0.6)',
      'analysis': '#fb923c',
      'automation': '#f472b6',
      'integration': '#38bdf8',
      'security': '#f87171',
      'media': '#facc15',
      'finance': 'rgba(34, 197, 94, 0.6)',
      'productivity': '#20d9d2',
      'processing': '#818cf8',
      'search': '#fb7185',
      'strategy': '#c084fc',
      'workflow': '#22d3ee',
      'workspace': '#67e8f9',
      'governance': '#fda4af',
      'learning': '#fcd34d',
      'agent': '#93c5fd',
    };
    return map[cat] ?? '#94a3b8';
  }
</script>

<svelte:head>
  <title>{skill ? `${skill.name} — Library — NULLHACK` : 'Skill — Library — NULLHACK'}</title>
</svelte:head>

<PageShell title={skill?.name ?? 'Skill'} subtitle={skill ? skill.category : undefined}>
  {#if !skill}
    <div class="lds-not-found" role="main">
      <span class="lds-not-found-icon" aria-hidden="true">🔍</span>
      <p class="lds-not-found-text">Skill not found.</p>
      <button
        class="lds-back-btn"
        onclick={() => goto('/app/library')}
        aria-label="Go back to library"
      >
        ← Back to library
      </button>
    </div>
  {:else}
    <div class="lds-page">

      <!-- Top bar -->
      <div class="lds-topbar">
        <button
          class="lds-back"
          onclick={() => goto('/app/library')}
          aria-label="Back to library"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Library
        </button>
        <span class="lds-breadcrumb-sep" aria-hidden="true">/</span>
        <span class="lds-breadcrumb-cur">Skills</span>
      </div>

      <!-- Two-column layout -->
      <div class="lds-layout">

        <!-- LEFT: content -->
        <div class="lds-main">

          <!-- Hero -->
          <div class="lds-hero">
            <div class="lds-hero-icon" aria-hidden="true" style="color: {categoryColor(skill.category)}">⚡</div>
            <div class="lds-hero-meta">
              <div class="lds-hero-badges">
                {#if skill.isOfficial}
                  <span class="lds-badge lds-badge--official" aria-label="Official skill">Official</span>
                {/if}
                <span
                  class="lds-badge lds-badge--category"
                  style="
                    background: {categoryColor(skill.category)}1a;
                    border-color: {categoryColor(skill.category)}40;
                    color: {categoryColor(skill.category)};
                  "
                  aria-label="Category: {skill.category}"
                >{skill.category}</span>
                <span class="lds-badge lds-badge--visibility">{skill.visibility}</span>
              </div>
              <h1 class="lds-hero-name">{skill.name}</h1>
            </div>
          </div>

          <!-- Description -->
          <section class="lds-card" aria-label="Skill description">
            <h2 class="lds-card-title">About</h2>
            <p class="lds-description">{skill.description}</p>
          </section>

          <!-- Stats grid -->
          <section class="lds-card" aria-label="Skill statistics">
            <h2 class="lds-card-title">Stats</h2>
            <div class="lds-stats-grid" role="list">
              <div class="lds-stat" role="listitem">
                <span class="lds-stat-icon" aria-hidden="true">⬇</span>
                <span class="lds-stat-value">{formatNumber(skill.downloads)}</span>
                <span class="lds-stat-label">Downloads</span>
              </div>
              <div class="lds-stat" role="listitem">
                <span class="lds-stat-icon" aria-hidden="true">★</span>
                <span class="lds-stat-value">{formatNumber(skill.favorites)}</span>
                <span class="lds-stat-label">Favorites</span>
              </div>
              <div class="lds-stat" role="listitem">
                <span class="lds-stat-icon" aria-hidden="true">⑂</span>
                <span class="lds-stat-value">{formatNumber(skill.forks)}</span>
                <span class="lds-stat-label">Forks</span>
              </div>
              <div class="lds-stat" role="listitem">
                <span class="lds-stat-icon" aria-hidden="true">v</span>
                <span class="lds-stat-value">{skill.version}</span>
                <span class="lds-stat-label">Version</span>
              </div>
            </div>
          </section>

          <!-- Tags -->
          {#if skill.tags.length > 0}
            <section class="lds-card" aria-label="Skill tags">
              <h2 class="lds-card-title">Tags</h2>
              <div class="lds-tags" role="list" aria-label="Tags">
                {#each skill.tags as tag}
                  <span class="lds-tag" role="listitem">{tag}</span>
                {/each}
              </div>
            </section>
          {/if}

        </div>

        <!-- RIGHT: Configuration panel -->
        <aside class="lds-sidebar" aria-label="Configuration panel">
          <div class="lds-panel">
            <h2 class="lds-panel-title">Configuration</h2>

            <div class="lds-field">
              <span class="lds-label" id="lds-enable-label">Enable on import</span>
              <button
                class="lds-toggle"
                class:lds-toggle--on={enabled}
                onclick={() => enabled = !enabled}
                role="switch"
                aria-checked={enabled}
                aria-labelledby="lds-enable-label"
              >
                <span class="lds-toggle-thumb"></span>
              </button>
            </div>

            <div class="lds-panel-meta">
              <div class="lds-meta-row">
                <span class="lds-meta-label">Category</span>
                <span class="lds-meta-value">{skill.category}</span>
              </div>
              <div class="lds-meta-row">
                <span class="lds-meta-label">Version</span>
                <span class="lds-meta-value">{skill.version}</span>
              </div>
              <div class="lds-meta-row">
                <span class="lds-meta-label">Added</span>
                <span class="lds-meta-value">{skill.added_at}</span>
              </div>
              <div class="lds-meta-row">
                <span class="lds-meta-label">Default state</span>
                <span class="lds-meta-value">{skill.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <button
              class="lds-import-btn"
              onclick={() => {/* import handler */}}
              aria-label="Import {skill.name} to workspace"
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
  .lds-not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 100%;
    color: var(--text-tertiary);
    font-size: 13px;
  }

  .lds-not-found-icon {
    font-size: 40px;
    opacity: 0.4;
  }

  .lds-not-found-text {
    margin: 0;
  }

  .lds-back-btn {
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

  .lds-back-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  /* Page wrapper */
  .lds-page {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 100%;
  }

  /* Top bar */
  .lds-topbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 24px 0;
  }

  .lds-back {
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

  .lds-back:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .lds-breadcrumb-sep {
    color: var(--text-muted);
    font-size: 12px;
  }

  .lds-breadcrumb-cur {
    font-size: 12px;
    color: var(--text-secondary);
  }

  /* Two-column layout */
  .lds-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    padding: 24px;
    align-items: start;
  }

  .lds-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  /* Hero */
  .lds-hero {
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }

  .lds-hero-icon {
    font-size: 52px;
    line-height: 1;
    flex-shrink: 0;
  }

  .lds-hero-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding-top: 4px;
  }

  .lds-hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .lds-hero-name {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
  }

  /* Badges */
  .lds-badge {
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

  .lds-badge--official {
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.3);
    color: #fbbf24;
  }

  .lds-badge--category {
    border: 1px solid transparent;
  }

  .lds-badge--visibility {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-tertiary);
    text-transform: capitalize;
  }

  /* Cards */
  .lds-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 16px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .lds-card-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-tertiary);
    margin: 0 0 12px 0;
  }

  .lds-description {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
  }

  /* Stats grid */
  .lds-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .lds-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
  }

  .lds-stat-icon {
    font-size: 16px;
    color: var(--text-muted);
  }

  .lds-stat-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .lds-stat-label {
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
  }

  /* Tags */
  .lds-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .lds-tag {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: var(--radius-xs);
    background: rgba(34, 211, 238, 0.08);
    border: 1px solid rgba(34, 211, 238, 0.2);
    font-size: 12px;
    color: #67e8f9;
    font-family: var(--font-mono);
  }

  /* Sidebar */
  .lds-sidebar {
    position: sticky;
    top: 24px;
  }

  .lds-panel {
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

  .lds-panel-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .lds-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .lds-label {
    font-size: 13px;
    color: var(--text-secondary);
  }

  /* Toggle */
  .lds-toggle {
    width: 40px;
    height: 22px;
    border-radius: 11px;
    border: 1px solid var(--border-default);
    background: var(--bg-secondary);
    cursor: pointer;
    position: relative;
    transition: all 150ms ease;
    flex-shrink: 0;
    padding: 0;
  }

  .lds-toggle--on {
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.25);
  }

  .lds-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--text-muted);
    transition: transform 150ms ease, background 150ms ease;
  }

  .lds-toggle--on .lds-toggle-thumb {
    transform: translateX(18px);
    background: rgba(34, 197, 94, 0.7);
  }

  .lds-panel-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
  }

  .lds-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .lds-meta-label {
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .lds-meta-value {
    font-size: 12px;
    color: var(--text-secondary);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lds-import-btn {
    height: 38px;
    width: 100%;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(34, 211, 238, 0.3);
    background: rgba(34, 211, 238, 0.1);
    color: #67e8f9;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 120ms ease;
  }

  .lds-import-btn:hover {
    background: rgba(34, 211, 238, 0.18);
    border-color: rgba(34, 211, 238, 0.5);
    color: #a5f3fc;
  }

  .lds-import-btn:active {
    background: rgba(34, 211, 238, 0.24);
  }
</style>
