<script lang="ts">
  import type { TeamTemplate, AgentTemplateData } from '$lib/stores/onboarding.svelte';

  const TEAM_TEMPLATES: { id: TeamTemplate; name: string; description: string; count: number }[] = [
    { id: 'solo',     name: 'Solo Developer',  description: '1 general-purpose agent',          count: 1 },
    { id: 'dev-team', name: 'Dev Team',         description: '4 specialised agents',             count: 4 },
    { id: 'research', name: 'Research Lab',     description: '3 research & writing agents',      count: 3 },
    { id: 'custom',   name: 'Custom',           description: 'Start with an empty roster',       count: 0 },
  ];

  const TEMPLATE_AGENTS: Record<TeamTemplate, AgentTemplateData[]> = {
    solo: [
      { id: 'main-agent', name: 'Main Agent', emoji: 'bot', role: 'engineer', adapter: 'osa', skills: ['code', 'debug', 'test'], system_prompt: 'You are a skilled software engineer...' },
    ],
    'dev-team': [
      { id: 'orchestrator',    name: 'Orchestrator',    emoji: 'brain',  role: 'orchestrator', adapter: 'osa', skills: ['delegate', 'plan'],              system_prompt: 'You coordinate a development team...' },
      { id: 'code-worker',     name: 'Code Worker',     emoji: 'code',   role: 'developer',    adapter: 'osa', skills: ['code', 'debug'],                 system_prompt: 'You are a focused code implementation specialist...' },
      { id: 'research-worker', name: 'Research Worker', emoji: 'search', role: 'researcher',   adapter: 'osa', skills: ['web_search', 'analyze'],         system_prompt: 'You research solutions, APIs, and best practices...' },
      { id: 'qa-agent',        name: 'QA Agent',        emoji: 'shield', role: 'engineer',     adapter: 'osa', skills: ['test', 'validate'],              system_prompt: 'You ensure code quality through testing...' },
    ],
    research: [
      { id: 'lead-researcher', name: 'Lead Researcher', emoji: 'search', role: 'researcher', adapter: 'osa', skills: ['web_search', 'analyze', 'summarize'], system_prompt: 'You lead research investigations...' },
      { id: 'data-analyst',    name: 'Data Analyst',    emoji: 'chart',  role: 'researcher', adapter: 'osa', skills: ['analyze', 'visualize'],              system_prompt: 'You analyze data and produce insights...' },
      { id: 'writer',          name: 'Writer',          emoji: 'pen',    role: 'writer',     adapter: 'osa', skills: ['write', 'edit', 'format'],            system_prompt: 'You produce clear, well-structured written content...' },
    ],
    custom: [],
  };

  interface Props {
    teamTemplate: TeamTemplate;
  }

  let { teamTemplate = $bindable() }: Props = $props();

  const teamAgents = $derived(TEMPLATE_AGENTS[teamTemplate]);
</script>

<div class="ob-step">
  <div class="ob-step-icon">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
      <circle cx="7" cy="7" r="3"/>
      <circle cx="13" cy="7" r="3"/>
      <path d="M1 17c0-3.314 2.686-6 6-6M13 11c3.314 0 6 2.686 6 6"/>
      <path d="M7 11c3.314 0 6 2.686 6 6H1c0-3.314 2.686-6 6-6z"/>
    </svg>
  </div>
  <h1 class="ob-title">Team Template</h1>
  <p class="ob-subtitle">Bootstrap your agent roster</p>

  <div class="ob-templates">
    {#each TEAM_TEMPLATES as t}
      <button
        class="ob-template-card"
        class:ob-template-card--selected={teamTemplate === t.id}
        onclick={() => teamTemplate = t.id}
      >
        <div class="ob-template-header">
          <span class="ob-template-name">{t.name}</span>
          <span class="ob-template-count">
            {t.count === 0 ? 'Empty' : t.count === 1 ? '1 agent' : `${t.count} agents`}
          </span>
        </div>
        <p class="ob-template-desc">{t.description}</p>
      </button>
    {/each}
  </div>

  {#if teamAgents.length > 0}
    <div class="ob-agent-preview">
      <p class="ob-label">AGENTS IN THIS TEMPLATE</p>
      <ul class="ob-agent-list">
        {#each teamAgents as agent}
          <li class="ob-agent-item">
            <span class="ob-agent-dot"></span>
            <span class="ob-agent-name">{agent.name}</span>
            <span class="ob-agent-role">{agent.role}</span>
            <span class="ob-agent-skills">{agent.skills.join(', ')}</span>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <div class="ob-agent-preview ob-agent-preview--empty">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M10 5v10M5 10h10"/></svg>
      <p>You'll add agents after launch</p>
    </div>
  {/if}
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

  .ob-label {
    display: block;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.35);
    margin-bottom: 0.375rem;
    text-align: left;
  }

  .ob-templates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    width: 100%;
    margin-bottom: 1.25rem;
  }

  .ob-template-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 10px;
    padding: 0.875rem 1rem;
    text-align: left;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease;
  }

  .ob-template-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .ob-template-card--selected {
    background: rgba(59, 130, 246, 0.07);
    border-color: rgba(59, 130, 246, 0.4);
  }

  .ob-template-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .ob-template-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #e0e0e0;
  }

  .ob-template-count {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.35);
  }

  .ob-template-desc {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }

  .ob-agent-preview {
    width: 100%;
    text-align: left;
  }

  .ob-agent-preview--empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.8125rem;
    gap: 0.5rem;
  }

  .ob-agent-list {
    list-style: none;
    padding: 0;
    margin: 0.375rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .ob-agent-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 7px;
    padding: 0.5rem 0.75rem;
  }

  .ob-agent-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3b82f6;
    flex-shrink: 0;
  }

  .ob-agent-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #d0d0d0;
    min-width: 110px;
  }

  .ob-agent-role {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.35);
    min-width: 80px;
  }

  .ob-agent-skills {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.25);
    font-family: 'SF Mono', monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
