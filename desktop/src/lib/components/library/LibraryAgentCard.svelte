<!-- src/lib/components/library/LibraryAgentCard.svelte -->
<script lang="ts">
  import type { LibraryAgent } from '$lib/api/mock/library';

  interface Props {
    agent: LibraryAgent;
    onAdd?: (agent: LibraryAgent) => void;
  }

  let { agent, onAdd }: Props = $props();

  let added = $state(false);

  function handleAdd() {
    added = true;
    onAdd?.(agent);
    setTimeout(() => { added = false; }, 2000);
  }

  function fmtCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  let potencyColor = $derived(
    agent.potency >= 75 ? 'var(--lac-potency-high)' :
    agent.potency >= 50 ? 'var(--lac-potency-mid)' :
    'var(--lac-potency-low)'
  );
</script>

<article class="lac-card" aria-label={agent.name}>
  <!-- Top row: emoji + name + visibility icon -->
  <div class="lac-top">
    <span class="lac-emoji" aria-hidden="true">{agent.emoji}</span>
    <div class="lac-name-wrap">
      <div class="lac-name">{agent.name}</div>
      <div class="lac-badges">
        <span class="lac-role-badge">{agent.category}</span>
        {#if agent.isOfficial}
          <span class="lac-source-badge lac-source-badge--official">official</span>
        {:else}
          <span class="lac-source-badge lac-source-badge--community">community</span>
        {/if}
      </div>
    </div>
    <span class="lac-visibility" aria-label="Visibility: {agent.visibility}">
      {#if agent.visibility === 'public'}
        <!-- eye -->
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      {:else if agent.visibility === 'unlisted'}
        <!-- eye-off -->
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      {:else}
        <!-- lock -->
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      {/if}
    </span>
  </div>

  <!-- Potency bar -->
  <div class="lac-potency-wrap" aria-label="Potency {agent.potency}/100">
    <div class="lac-potency-track">
      <div
        class="lac-potency-fill"
        style="width: {agent.potency}%; background: {potencyColor};"
      ></div>
    </div>
    <span class="lac-potency-label">{agent.potency}</span>
  </div>

  <!-- Description -->
  <p class="lac-desc">{agent.description}</p>

  <!-- Tags -->
  <div class="lac-tags" aria-label="Tags">
    {#each agent.tags.slice(0, 3) as tag}
      <span class="lac-tag">{tag}</span>
    {/each}
  </div>

  <!-- Stats row -->
  <div class="lac-stats">
    <!-- downloads -->
    <span class="lac-stat" aria-label="{fmtCount(agent.downloads)} downloads">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {fmtCount(agent.downloads)}
    </span>
    <!-- favorites -->
    <span class="lac-stat" aria-label="{fmtCount(agent.favorites)} favorites">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
      {fmtCount(agent.favorites)}
    </span>
    <!-- forks -->
    <span class="lac-stat" aria-label="{fmtCount(agent.forks)} forks">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="6" cy="18" r="3"/>
        <circle cx="6" cy="6" r="3"/>
        <circle cx="18" cy="6" r="3"/>
        <path d="M6 9v6M18 9a9 9 0 01-9 9"/>
      </svg>
      {fmtCount(agent.forks)}
    </span>
    <!-- rating -->
    <span class="lac-stat" aria-label="Rating {agent.rating}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      {agent.rating}
    </span>
    <!-- version -->
    <span class="lac-version">v{agent.version}</span>
  </div>

  <!-- CTA button -->
  <button
    class="lac-btn"
    class:lac-btn--added={added}
    onclick={handleAdd}
    aria-label="{added ? 'Added' : 'Add'} {agent.name} to workspace"
    type="button"
  >
    {added ? '✓ Added' : 'Add to Workspace'}
  </button>
</article>

<style>
  .lac-card {
    --lac-potency-high: rgba(34, 197, 94, 0.9);
    --lac-potency-mid: rgba(234, 179, 8, 0.9);
    --lac-potency-low: rgba(249, 115, 22, 0.9);

    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(12px);
    transition:
      border-color 150ms ease,
      transform 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease;
    cursor: default;
  }

  .lac-card:hover {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.06);
  }

  /* Top row */
  .lac-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .lac-emoji {
    font-size: 26px;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .lac-name-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .lac-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lac-badges {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .lac-role-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    text-transform: capitalize;
    letter-spacing: 0.02em;
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.09);
  }

  .lac-source-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .lac-source-badge--official {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .lac-source-badge--community {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .lac-visibility {
    flex-shrink: 0;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    margin-top: 3px;
  }

  /* Potency bar */
  .lac-potency-wrap {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .lac-potency-track {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.07);
    overflow: hidden;
  }

  .lac-potency-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 300ms ease;
  }

  .lac-potency-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    width: 20px;
    text-align: right;
  }

  /* Description */
  .lac-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.55;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Tags */
  .lac-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .lac-tag {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.07);
    text-transform: lowercase;
  }

  /* Stats row */
  .lac-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    padding-top: 2px;
  }

  .lac-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .lac-version {
    margin-left: auto;
    font-size: 10px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  /* CTA */
  .lac-btn {
    width: 100%;
    padding: 7px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 150ms ease;
    white-space: nowrap;
  }

  .lac-btn:hover {
    background: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.3);
    color: #7ab3f8;
  }

  .lac-btn--added {
    background: rgba(34, 197, 94, 0.08);
    border-color: rgba(34, 197, 94, 0.22);
    color: rgba(34, 197, 94, 0.6);
  }

  .lac-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
