<!-- src/lib/components/library/LibraryTemplateCard.svelte -->
<script lang="ts">
  import type { LibraryTemplate } from '$lib/api/mock/library';

  interface Props {
    template: LibraryTemplate;
    onCreate?: (template: LibraryTemplate) => void;
  }

  let { template, onCreate }: Props = $props();

  let loading = $state(false);

  const SIZE_LABELS: Record<string, string> = {
    micro:      'Solo / 1-2 people',
    small:      'Small team / 5-15',
    full:       'Scale-up / department',
    enterprise: 'Enterprise / multi-team',
  };

  function handleCreate() {
    loading = true;
    onCreate?.(template);
    setTimeout(() => { loading = false; }, 1500);
  }

  function fmtCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }
</script>

<article class="ltc-card ltc-card--{template.size}" aria-label="{template.name} template">
  <!-- Top: emoji + name -->
  <div class="ltc-top">
    <span class="ltc-emoji" aria-hidden="true">{template.emoji}</span>
    <div class="ltc-name-wrap">
      <div class="ltc-name">{template.name}</div>
      <div class="ltc-badges">
        <span class="ltc-size-badge ltc-size--{template.size}">{template.size}</span>
        {#if template.isOfficial}
          <span class="ltc-source-badge ltc-source--official">official</span>
        {:else}
          <span class="ltc-source-badge ltc-source--community">community</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Description -->
  <p class="ltc-desc">{template.description}</p>

  <!-- Tags -->
  <div class="ltc-tags">
    {#each template.tags.slice(0, 3) as tag}
      <span class="ltc-tag">{tag}</span>
    {/each}
  </div>

  <!-- Sizing context -->
  <div class="ltc-meta">
    <span class="ltc-for">{SIZE_LABELS[template.size] ?? template.size}</span>
    <span class="ltc-agent-count">~{template.agent_count} agents</span>
  </div>

  <!-- Engagement stats -->
  <div class="ltc-stats">
    <span class="ltc-stat" aria-label="{fmtCount(template.downloads)} downloads">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {fmtCount(template.downloads)}
    </span>
    <span class="ltc-stat" aria-label="{fmtCount(template.favorites)} favorites">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
      {fmtCount(template.favorites)}
    </span>
    <span class="ltc-stat" aria-label="{fmtCount(template.forks)} forks">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="6" cy="18" r="3"/>
        <circle cx="6" cy="6" r="3"/>
        <circle cx="18" cy="6" r="3"/>
        <path d="M6 9v6M18 9a9 9 0 01-9 9"/>
      </svg>
      {fmtCount(template.forks)}
    </span>
    <span class="ltc-version">v{template.version}</span>
  </div>

  <!-- CTA -->
  <button
    class="ltc-btn"
    class:ltc-btn--loading={loading}
    onclick={handleCreate}
    aria-label="Create workspace from {template.name} template"
    disabled={loading}
    type="button"
  >
    {loading ? 'Creating workspace…' : 'Create Workspace'}
  </button>
</article>

<style>
  .ltc-card {
    display: flex;
    flex-direction: column;
    gap: 11px;
    padding: 20px;
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(12px);
    transition:
      border-color 150ms ease,
      transform 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease;
  }

  /* Size-specific accent borders */
  .ltc-card--micro      { border-color: rgba(34, 197, 94, 0.15); }
  .ltc-card--small      { border-color: rgba(59, 130, 246, 0.15); }
  .ltc-card--full       { border-color: rgba(168, 85, 247, 0.15); }
  .ltc-card--enterprise { border-color: rgba(249, 115, 22, 0.15); }

  .ltc-card:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 6px 28px rgba(0, 0, 0, 0.26), 0 0 0 1px rgba(255, 255, 255, 0.07);
  }

  .ltc-card--micro:hover      { border-color: rgba(34, 197, 94, 0.30); }
  .ltc-card--small:hover      { border-color: rgba(59, 130, 246, 0.30); }
  .ltc-card--full:hover       { border-color: rgba(168, 85, 247, 0.30); }
  .ltc-card--enterprise:hover { border-color: rgba(249, 115, 22, 0.30); }

  /* Top row */
  .ltc-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .ltc-emoji {
    font-size: 30px;
    line-height: 1;
    flex-shrink: 0;
  }

  .ltc-name-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ltc-name {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }

  .ltc-badges {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .ltc-size-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    text-transform: capitalize;
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .ltc-size--micro      { background: rgba(34, 197, 94, 0.08); color: rgba(34, 197, 94, 0.6); border-color: rgba(34, 197, 94, 0.15); }
  .ltc-size--small      { background: rgba(59, 130, 246, 0.10); color: #7ab3f8; border-color: rgba(59, 130, 246, 0.20); }
  .ltc-size--full       { background: rgba(168, 85, 247, 0.10); color: #c084fc; border-color: rgba(168, 85, 247, 0.20); }
  .ltc-size--enterprise { background: rgba(249, 115, 22, 0.10); color: #fb923c; border-color: rgba(249, 115, 22, 0.20); }

  .ltc-source-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .ltc-source--official {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .ltc-source--community {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Description */
  .ltc-desc {
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
  .ltc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .ltc-tag {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.07);
    text-transform: lowercase;
  }

  /* Sizing meta */
  .ltc-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 11px;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .ltc-for {
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .ltc-agent-count {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  /* Stats row */
  .ltc-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
  }

  .ltc-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .ltc-version {
    margin-left: auto;
    font-size: 10px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  /* CTA */
  .ltc-btn {
    padding: 9px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms ease;
    width: 100%;
    margin-top: 2px;
  }

  .ltc-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    color: var(--text-primary);
  }

  .ltc-card--micro .ltc-btn:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.08);
    border-color: rgba(34, 197, 94, 0.20);
    color: rgba(34, 197, 94, 0.6);
  }

  .ltc-card--small .ltc-btn:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.10);
    border-color: rgba(59, 130, 246, 0.30);
    color: #7ab3f8;
  }

  .ltc-card--full .ltc-btn:hover:not(:disabled) {
    background: rgba(168, 85, 247, 0.10);
    border-color: rgba(168, 85, 247, 0.30);
    color: #c084fc;
  }

  .ltc-card--enterprise .ltc-btn:hover:not(:disabled) {
    background: rgba(249, 115, 22, 0.10);
    border-color: rgba(249, 115, 22, 0.30);
    color: #fb923c;
  }

  .ltc-btn--loading {
    opacity: 0.7;
    cursor: wait;
  }

  .ltc-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
