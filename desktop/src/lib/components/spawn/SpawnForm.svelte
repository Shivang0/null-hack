<!-- src/lib/components/spawn/SpawnForm.svelte -->
<script lang="ts">
  import { agentsStore } from '$lib/stores/agents.svelte';

  interface Props {
    onSubmit: (data: { agent_id: string; task: string; model?: string }) => Promise<void>;
    prefill?: { agent_id?: string; task?: string; model?: string };
  }

  let { onSubmit, prefill = {} }: Props = $props();

  let agentId = $state('');
  let task = $state('');
  let model = $state('');

  // Sync when prefill prop changes
  $effect(() => {
    if (prefill.agent_id !== undefined) agentId = prefill.agent_id;
    if (prefill.task !== undefined) task = prefill.task;
    if (prefill.model !== undefined) model = prefill.model;
  });
  let submitting = $state(false);

  const agents = $derived(agentsStore.agents);
  const canSubmit = $derived(agentId.length > 0 && task.trim().length > 0);

  // Allow parent to imperatively prefill (e.g. from preset click)
  export function applyPrefill(data: { agent_id?: string; task?: string; model?: string }) {
    if (data.agent_id !== undefined) agentId = data.agent_id;
    if (data.task !== undefined) task = data.task;
    if (data.model !== undefined) model = data.model;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    submitting = true;
    try {
      await onSubmit({
        agent_id: agentId,
        task: task.trim(),
        model: model.trim() || undefined,
      });
      // Clear after successful submit
      task = '';
      model = '';
    } finally {
      submitting = false;
    }
  }
</script>

<form
  class="spf-form"
  onsubmit={handleSubmit}
  aria-label="Spawn agent task"
  novalidate
>
  <!-- Agent selector -->
  <div class="spf-field">
    <label class="spf-label" for="spf-agent">
      Agent <span class="spf-required" aria-hidden="true">*</span>
    </label>
    <select
      id="spf-agent"
      class="spf-select"
      bind:value={agentId}
      required
      aria-required="true"
      aria-label="Select agent to spawn"
    >
      <option value="" disabled>Choose an agent…</option>
      {#each agents as agent (agent.id)}
        <option value={agent.id}>{agent.display_name || agent.name}</option>
      {/each}
    </select>
  </div>

  <!-- Task description -->
  <div class="spf-field">
    <label class="spf-label" for="spf-task">
      Task <span class="spf-required" aria-hidden="true">*</span>
    </label>
    <textarea
      id="spf-task"
      class="spf-textarea"
      bind:value={task}
      placeholder="Describe what the agent should do…"
      rows="4"
      required
      aria-required="true"
      aria-label="Task description"
    ></textarea>
  </div>

  <!-- Model override -->
  <div class="spf-field">
    <label class="spf-label" for="spf-model">Model override <span class="spf-optional">(optional)</span></label>
    <input
      id="spf-model"
      class="spf-input"
      type="text"
      bind:value={model}
      placeholder="e.g. claude-opus-4-5 (defaults to agent setting)"
      aria-label="Optional model override"
    />
  </div>

  <button
    class="spf-submit"
    type="submit"
    disabled={!canSubmit || submitting}
    aria-label="Spawn agent"
  >
    {#if submitting}
      <span class="spf-spinner" aria-hidden="true"></span>
      Spawning…
    {:else}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      Spawn
    {/if}
  </button>
</form>

<style>
  .spf-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .spf-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .spf-label {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .spf-required {
    color: var(--accent-error);
    margin-left: 2px;
  }

  .spf-optional {
    color: var(--text-muted);
    font-weight: 400;
  }

  .spf-select,
  .spf-input {
    appearance: none;
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 13px;
    transition: border-color var(--transition-fast) ease;
  }

  .spf-select:focus,
  .spf-input:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .spf-select option {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .spf-input::placeholder {
    color: var(--text-muted);
    font-size: 12px;
  }

  .spf-textarea {
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 13px;
    resize: vertical;
    min-height: 96px;
    transition: border-color var(--transition-fast) ease;
  }

  .spf-textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .spf-textarea::placeholder {
    color: var(--text-muted);
  }

  .spf-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 20px;
    border-radius: var(--radius-sm);
    border: none;
    background: var(--accent-primary);
    color: #fff;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast) ease, opacity var(--transition-fast) ease;
    width: 100%;
  }

  .spf-submit:hover:not(:disabled) {
    background: #2563eb;
  }

  .spf-submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .spf-submit:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 3px;
  }

  .spf-spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    animation: spf-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spf-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .spf-spinner { animation: none; }
  }
</style>
