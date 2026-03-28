<!-- src/lib/components/library/LibraryOperationCard.svelte -->
<script lang="ts">
  import type { LibraryOperation } from '$lib/api/mock/library';

  interface Props {
    operation: LibraryOperation;
    onUse?: (operation: LibraryOperation) => void;
  }

  let { operation, onUse }: Props = $props();

  let loading = $state(false);

  function handleUse() {
    loading = true;
    onUse?.(operation);
    setTimeout(() => { loading = false; }, 1500);
  }

  function fmtCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }
</script>

<article class="loc-card" aria-label={operation.name}>
  <!-- Header: emoji + name -->
  <div class="loc-header">
    <span class="loc-emoji" aria-hidden="true">{operation.emoji}</span>
    <div class="loc-title-wrap">
      <div class="loc-name">{operation.name}</div>
      <div class="loc-badges">
        <span class="loc-cat-badge loc-cat--{operation.category}">{operation.category}</span>
        {#if operation.isOfficial}
          <span class="loc-source-badge loc-source--official">official</span>
        {:else}
          <span class="loc-source-badge loc-source--community">community</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Description -->
  <p class="loc-desc">{operation.description}</p>

  <!-- Tags -->
  <div class="loc-tags">
    {#each operation.tags.slice(0, 3) as tag}
      <span class="loc-tag">{tag}</span>
    {/each}
  </div>

  <!-- Composition stats -->
  <div class="loc-composition">
    <div class="loc-comp-stat">
      <span class="loc-comp-value">{operation.agent_count}</span>
      <span class="loc-comp-label">agents</span>
    </div>
    <span class="loc-comp-sep" aria-hidden="true">·</span>
    <div class="loc-comp-stat">
      <span class="loc-comp-value">{operation.skill_count}</span>
      <span class="loc-comp-label">skills</span>
    </div>
  </div>

  <!-- Engagement stats row -->
  <div class="loc-stats">
    <span class="loc-stat" aria-label="{fmtCount(operation.downloads)} downloads">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {fmtCount(operation.downloads)}
    </span>
    <span class="loc-stat" aria-label="{fmtCount(operation.favorites)} favorites">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
      {fmtCount(operation.favorites)}
    </span>
    <span class="loc-stat" aria-label="{fmtCount(operation.forks)} forks">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="6" cy="18" r="3"/>
        <circle cx="6" cy="6" r="3"/>
        <circle cx="18" cy="6" r="3"/>
        <path d="M6 9v6M18 9a9 9 0 01-9 9"/>
      </svg>
      {fmtCount(operation.forks)}
    </span>
    <span class="loc-version">v{operation.version}</span>
  </div>

  <!-- CTA -->
  <button
    class="loc-btn"
    class:loc-btn--loading={loading}
    onclick={handleUse}
    aria-label="Deploy {operation.name}"
    disabled={loading}
    type="button"
  >
    {loading ? 'Creating…' : 'Use Template'}
  </button>
</article>

<style>
  .loc-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(16px);
    transition:
      border-color 150ms ease,
      transform 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease;
  }

  .loc-card:hover {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 6px 32px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.07);
  }

  /* Header */
  .loc-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .loc-emoji {
    font-size: 34px;
    line-height: 1;
    flex-shrink: 0;
  }

  .loc-title-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .loc-name {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }

  .loc-badges {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .loc-cat-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    text-transform: capitalize;
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.08);
    align-self: flex-start;
  }

  .loc-cat--engineering  { background: rgba(59, 130, 246, 0.12); color: #7ab3f8; border-color: rgba(59, 130, 246, 0.2); }
  .loc-cat--sales        { background: rgba(34, 197, 94, 0.08);  color: rgba(34, 197, 94, 0.6); border-color: rgba(34, 197, 94, 0.15); }
  .loc-cat--marketing    { background: rgba(249, 115, 22, 0.12); color: #fb923c; border-color: rgba(249, 115, 22, 0.2); }
  .loc-cat--productivity { background: rgba(168, 85, 247, 0.12); color: #c084fc; border-color: rgba(168, 85, 247, 0.2); }
  .loc-cat--executive    { background: rgba(255, 255, 255, 0.08); color: #e2e8f0; border-color: rgba(255, 255, 255, 0.15); }

  .loc-source-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .loc-source--official {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .loc-source--community {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Description */
  .loc-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Tags */
  .loc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .loc-tag {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.07);
    text-transform: lowercase;
  }

  /* Composition */
  .loc-composition {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .loc-comp-stat {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .loc-comp-value {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .loc-comp-label {
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .loc-comp-sep {
    color: var(--text-muted);
    font-size: 14px;
  }

  /* Stats row */
  .loc-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
  }

  .loc-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .loc-version {
    margin-left: auto;
    font-size: 10px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  /* CTA */
  .loc-btn {
    padding: 9px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.10);
    color: #7ab3f8;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms ease;
    align-self: flex-start;
  }

  .loc-btn:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.45);
    color: #bfdbfe;
  }

  .loc-btn--loading {
    opacity: 0.7;
    cursor: wait;
  }

  .loc-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
