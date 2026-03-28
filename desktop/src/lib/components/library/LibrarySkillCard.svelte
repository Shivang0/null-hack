<!-- src/lib/components/library/LibrarySkillCard.svelte -->
<script lang="ts">
  import type { LibrarySkill } from '$lib/api/mock/library';

  interface Props {
    skill: LibrarySkill;
    onToggle?: (skill: LibrarySkill) => void;
  }

  let { skill, onToggle }: Props = $props();

  // Track toggle state independently — initialized once from prop
  // eslint-disable-next-line svelte/state_referenced_locally
  let enabled = $state<boolean>(skill.enabled);

  function handleToggle() {
    enabled = !enabled;
    onToggle?.({ ...skill, enabled });
  }

  function fmtCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }
</script>

<article class="lsc-card" aria-label={skill.name}>
  <!-- Header: name + visibility -->
  <div class="lsc-header">
    <div class="lsc-name">{skill.name}</div>
    <span class="lsc-visibility" aria-label="Visibility: {skill.visibility}">
      {#if skill.visibility === 'public'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      {:else if skill.visibility === 'unlisted'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      {:else}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      {/if}
    </span>
  </div>

  <!-- Category + source badges -->
  <div class="lsc-badges">
    <span class="lsc-cat-badge lsc-cat--{skill.category}">{skill.category}</span>
    {#if skill.isOfficial}
      <span class="lsc-source-badge lsc-source--official">official</span>
    {:else}
      <span class="lsc-source-badge lsc-source--community">community</span>
    {/if}
  </div>

  <!-- Description -->
  <p class="lsc-desc">{skill.description}</p>

  <!-- Tags -->
  <div class="lsc-tags">
    {#each skill.tags.slice(0, 3) as tag}
      <span class="lsc-tag">{tag}</span>
    {/each}
  </div>

  <!-- Stats + version -->
  <div class="lsc-stats">
    <span class="lsc-stat" aria-label="{fmtCount(skill.downloads)} downloads">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {fmtCount(skill.downloads)}
    </span>
    <span class="lsc-stat" aria-label="{fmtCount(skill.favorites)} favorites">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
      {fmtCount(skill.favorites)}
    </span>
    <span class="lsc-stat" aria-label="{fmtCount(skill.forks)} forks">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="6" cy="18" r="3"/>
        <circle cx="6" cy="6" r="3"/>
        <circle cx="18" cy="6" r="3"/>
        <path d="M6 9v6M18 9a9 9 0 01-9 9"/>
      </svg>
      {fmtCount(skill.forks)}
    </span>
    <span class="lsc-version">v{skill.version}</span>
  </div>

  <!-- Enable toggle -->
  <button
    class="lsc-toggle"
    class:lsc-toggle--on={enabled}
    onclick={handleToggle}
    aria-pressed={enabled}
    aria-label="{enabled ? 'Disable' : 'Enable'} {skill.name}"
    type="button"
  >
    {enabled ? 'Enabled' : 'Enable'}
  </button>
</article>

<style>
  .lsc-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(12px);
    transition:
      border-color 150ms ease,
      background 150ms ease,
      transform 150ms ease,
      box-shadow 150ms ease;
  }

  .lsc-card:hover {
    border-color: rgba(255, 255, 255, 0.13);
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 3px 16px rgba(0, 0, 0, 0.2);
  }

  /* Header */
  .lsc-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .lsc-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .lsc-visibility {
    color: var(--text-muted);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: 1px;
  }

  /* Badges */
  .lsc-badges {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .lsc-cat-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    text-transform: capitalize;
    letter-spacing: 0.02em;
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Category tints */
  .lsc-cat--development  { background: rgba(59, 130, 246, 0.10); color: #7ab3f8; border-color: rgba(59, 130, 246, 0.18); }
  .lsc-cat--ai-patterns  { background: rgba(168, 85, 247, 0.10); color: #c084fc; border-color: rgba(168, 85, 247, 0.18); }
  .lsc-cat--communication{ background: rgba(34, 197, 94, 0.08);  color: rgba(34, 197, 94, 0.6); border-color: rgba(34, 197, 94, 0.15); }
  .lsc-cat--analysis     { background: rgba(6, 182, 212, 0.10);  color: #22d3ee; border-color: rgba(6, 182, 212, 0.18); }
  .lsc-cat--automation   { background: rgba(249, 115, 22, 0.10); color: #fb923c; border-color: rgba(249, 115, 22, 0.18); }
  .lsc-cat--integration  { background: rgba(99, 102, 241, 0.10); color: #a5b4fc; border-color: rgba(99, 102, 241, 0.18); }
  .lsc-cat--security     { background: rgba(239, 68, 68, 0.10);  color: #f87171; border-color: rgba(239, 68, 68, 0.18); }
  .lsc-cat--media        { background: rgba(236, 72, 153, 0.10); color: #f472b6; border-color: rgba(236, 72, 153, 0.18); }
  .lsc-cat--finance      { background: rgba(234, 179, 8, 0.10);  color: #facc15; border-color: rgba(234, 179, 8, 0.18); }
  .lsc-cat--productivity { background: rgba(20, 184, 166, 0.10); color: #2dd4bf; border-color: rgba(20, 184, 166, 0.18); }
  .lsc-cat--learning     { background: rgba(251, 146, 60, 0.10); color: #fdba74; border-color: rgba(251, 146, 60, 0.18); }
  .lsc-cat--strategy     { background: rgba(16, 185, 129, 0.10); color: #34d399; border-color: rgba(16, 185, 129, 0.18); }
  .lsc-cat--workflow     { background: rgba(148, 163, 184, 0.10); color: #94a3b8; border-color: rgba(148, 163, 184, 0.18); }
  .lsc-cat--governance   { background: rgba(245, 158, 11, 0.10); color: #fcd34d; border-color: rgba(245, 158, 11, 0.18); }

  .lsc-source-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .lsc-source--official {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .lsc-source--community {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Description */
  .lsc-desc {
    font-size: 11px;
    color: var(--text-tertiary);
    line-height: 1.55;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Tags */
  .lsc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .lsc-tag {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-muted);
    border: 1px solid rgba(255, 255, 255, 0.06);
    text-transform: lowercase;
  }

  /* Stats */
  .lsc-stats {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: auto;
  }

  .lsc-stat {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  .lsc-version {
    margin-left: auto;
    font-size: 10px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  /* Toggle button */
  .lsc-toggle {
    align-self: flex-start;
    padding: 5px 11px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 150ms ease;
    margin-top: 2px;
  }

  .lsc-toggle:hover {
    border-color: rgba(255, 255, 255, 0.15);
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.04);
  }

  .lsc-toggle--on {
    background: rgba(34, 197, 94, 0.10);
    border-color: rgba(34, 197, 94, 0.25);
    color: rgba(34, 197, 94, 0.6);
  }

  .lsc-toggle--on:hover {
    background: rgba(239, 68, 68, 0.10);
    border-color: rgba(239, 68, 68, 0.25);
    color: #f87171;
  }

  .lsc-toggle:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
