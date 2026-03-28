<script lang="ts">
  import type { AdapterType } from '$lib/stores/onboarding.svelte';

  interface AdapterDef {
    id: AdapterType;
    name: string;
    description: string;
    recommended?: boolean;
    useLogoImg?: boolean;
  }

  const ADAPTERS: AdapterDef[] = [
    { id: 'osa',         name: 'OSA',           description: 'Elixir/OTP agent runtime by MIOSA — full orchestration, tools, budgets', recommended: true, useLogoImg: true },
    { id: 'claude-code', name: 'Claude Code',   description: "Anthropic's CLI coding agent — terminal-based pair programming" },
    { id: 'codex',       name: 'Codex',         description: "OpenAI's autonomous coding agent" },
    { id: 'openclaw',    name: 'OpenClaw',      description: 'Open-source multi-agent coordination framework' },
    { id: 'jidoclaw',    name: 'JidoClaw',      description: 'Elixir-native agent framework — lightweight, composable workflows' },
    { id: 'hermes',      name: 'Hermes Agent',  description: 'Fast message-passing agent runtime for real-time systems' },
    { id: 'bash',        name: 'Bash',          description: 'Simple shell script executor — run commands directly' },
    { id: 'http',        name: 'HTTP',          description: 'Generic HTTP/REST adapter — connect any API endpoint' },
  ];

  interface Props {
    selectedAdapter: AdapterType;
  }

  let { selectedAdapter = $bindable() }: Props = $props();
</script>

<div class="ob-step">
  <div class="ob-step-icon">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
      <rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/>
      <rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/>
    </svg>
  </div>
  <h1 class="ob-title">Execution Adapter</h1>
  <p class="ob-subtitle">How your agents run</p>
  <div class="ob-adapters">
    {#each ADAPTERS as a}
      <button
        class="ob-adapter-card"
        class:ob-adapter-card--selected={selectedAdapter === a.id}
        onclick={() => selectedAdapter = a.id}
      >
        <div class="ob-adapter-header">
          <span class="ob-adapter-icon">
            {#if a.useLogoImg}
              <img src="/OSAIconLogo.png" alt="OSA" width="18" height="18" style="border-radius:3px;object-fit:contain;" />
            {:else if a.id === 'claude-code'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M6 7l-4 3 4 3M14 7l4 3-4 3M12 5l-4 10"/></svg>
            {:else if a.id === 'codex'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3" y="5" width="14" height="10" rx="2"/><path d="M7 9l2 2-2 2M11 13h2"/></svg>
            {:else if a.id === 'openclaw'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M6 6l4-3 4 3M6 14l4 3 4-3M3 10h14M10 3v14"/><circle cx="10" cy="10" r="2"/></svg>
            {:else if a.id === 'jidoclaw'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M10 3l7 4v6l-7 4-7-4V7z"/></svg>
            {:else if a.id === 'hermes'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 10h3l2-4 2 8 2-6 2 2h3"/></svg>
            {:else if a.id === 'bash'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M6 8l3 2-3 2M11 12h3"/></svg>
            {:else if a.id === 'http'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="10" cy="10" r="7.5"/><path d="M10 2.5c0 0-3.5 3.5-3.5 7.5s3.5 7.5 3.5 7.5M10 2.5c0 0 3.5 3.5 3.5 7.5S10 17.5 10 17.5M2.5 10h15"/></svg>
            {:else}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="10" cy="10" r="7.5"/></svg>
            {/if}
          </span>
          <span class="ob-adapter-name">{a.name}</span>
          {#if a.recommended}
            <span class="ob-badge ob-badge--accent">Recommended</span>
          {/if}
        </div>
        <p class="ob-adapter-desc">{a.description}</p>
      </button>
    {/each}
  </div>
</div>

<style>
  .ob-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
    gap: 0;
  }

  .ob-step-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 auto 1.25rem;
  }

  .ob-title {
    font-size: 1.625rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 0.375rem;
    letter-spacing: -0.02em;
  }

  .ob-subtitle {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0 0 1.75rem;
  }

  .ob-adapters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    width: 100%;
  }

  .ob-adapter-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 10px;
    padding: 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .ob-adapter-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .ob-adapter-card--selected {
    background: rgba(59, 130, 246, 0.07);
    border-color: rgba(59, 130, 246, 0.4);
  }

  .ob-adapter-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ob-adapter-icon {
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .ob-adapter-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #e0e0e0;
    flex: 1;
  }

  .ob-adapter-desc {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.35);
    margin: 0;
    line-height: 1.4;
  }

  .ob-badge {
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 1px 6px;
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.12);
    white-space: nowrap;
  }

  .ob-badge--accent {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.25);
  }
</style>
