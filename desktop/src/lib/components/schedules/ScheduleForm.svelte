<!-- src/lib/components/schedules/ScheduleForm.svelte -->
<script lang="ts">
  import type { Schedule } from '$api/types';
  import CronEditor from './CronEditor.svelte';
  import { agentsStore } from '$lib/stores/agents.svelte';

  interface Props {
    schedule?: Schedule;
    onSubmit: (data: { agent_id: string; cron: string; context: string; enabled: boolean }) => void;
    onCancel: () => void;
  }

  let { schedule, onSubmit, onCancel }: Props = $props();

  let agentId = $state('');
  let cron = $state('0 * * * *');
  let context = $state('');
  let enabled = $state(true);
  let submitting = $state(false);

  // Sync form fields whenever the schedule prop changes (e.g. when modal opens with a different schedule)
  $effect(() => {
    agentId = schedule?.agent_id ?? '';
    cron = schedule?.cron ?? '0 * * * *';
    context = schedule?.context ?? '';
    enabled = schedule?.enabled ?? true;
  });

  const isEdit = $derived(schedule !== undefined);

  const agents = $derived(agentsStore.agents);

  const canSubmit = $derived(agentId.length > 0 && cron.length > 0);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    submitting = true;
    try {
      await onSubmit({ agent_id: agentId, cron, context, enabled });
    } finally {
      submitting = false;
    }
  }
</script>

<form
  class="sf-form"
  onsubmit={handleSubmit}
  aria-label={isEdit ? 'Edit schedule' : 'Create schedule'}
  novalidate
>
  <!-- Agent picker -->
  <div class="sf-field">
    <label class="sf-label" for="sf-agent">Agent <span class="sf-required" aria-hidden="true">*</span></label>
    <select
      id="sf-agent"
      class="sf-select"
      bind:value={agentId}
      required
      aria-required="true"
      aria-label="Select agent"
    >
      <option value="" disabled>Choose an agent…</option>
      {#each agents as agent (agent.id)}
        <option value={agent.id}>{agent.display_name || agent.name}</option>
      {/each}
    </select>
  </div>

  <!-- Cron editor -->
  <div class="sf-field">
    <p class="sf-label">Schedule <span class="sf-required" aria-hidden="true">*</span></p>
    <CronEditor bind:value={cron} />
  </div>

  <!-- Context textarea -->
  <div class="sf-field">
    <label class="sf-label" for="sf-context">Instructions</label>
    <textarea
      id="sf-context"
      class="sf-textarea"
      bind:value={context}
      placeholder="What should the agent do when this schedule fires?"
      rows="3"
      aria-label="Agent instructions for this schedule"
    ></textarea>
  </div>

  <!-- Enabled toggle -->
  <div class="sf-field sf-field--inline">
    <label class="sf-label" for="sf-enabled">Enable on create</label>
    <button
      id="sf-enabled"
      type="button"
      class="sf-toggle"
      class:sf-toggle--on={enabled}
      onclick={() => (enabled = !enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? 'Schedule is enabled' : 'Schedule is disabled'}
    >
      <span class="sf-toggle-thumb"></span>
    </button>
  </div>

  <!-- Actions -->
  <div class="sf-actions">
    <button
      class="sf-btn sf-btn--ghost"
      type="button"
      onclick={onCancel}
      aria-label="Cancel"
    >
      Cancel
    </button>
    <button
      class="sf-btn sf-btn--primary"
      type="submit"
      disabled={!canSubmit || submitting}
      aria-label={isEdit ? 'Save changes' : 'Create schedule'}
    >
      {#if submitting}
        Saving…
      {:else if isEdit}
        Save changes
      {:else}
        Create schedule
      {/if}
    </button>
  </div>
</form>

<style>
  .sf-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* ── Fields ── */
  .sf-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .sf-field--inline {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .sf-label {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0;
  }

  .sf-required {
    color: var(--accent-error);
    margin-left: 2px;
  }

  /* ── Select ── */
  .sf-select {
    appearance: none;
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 13px;
    cursor: pointer;
    transition: border-color var(--transition-fast) ease;
  }

  .sf-select:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .sf-select option {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  /* ── Textarea ── */
  .sf-textarea {
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 13px;
    resize: vertical;
    min-height: 72px;
    transition: border-color var(--transition-fast) ease;
  }

  .sf-textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .sf-textarea::placeholder {
    color: var(--text-muted);
  }

  /* ── Toggle ── */
  .sf-toggle {
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 10px;
    border: 1px solid var(--border-default);
    background: var(--bg-elevated);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast) ease, border-color var(--transition-fast) ease;
    padding: 0;
  }

  .sf-toggle--on {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .sf-toggle:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .sf-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--text-muted);
    transition: transform var(--transition-fast) ease, background var(--transition-fast) ease;
  }

  .sf-toggle--on .sf-toggle-thumb {
    transform: translateX(16px);
    background: var(--accent-primary);
  }

  /* ── Actions ── */
  .sf-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 4px;
  }

  .sf-btn {
    padding: 7px 16px;
    border-radius: var(--radius-sm);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--transition-fast) ease,
      border-color var(--transition-fast) ease,
      color var(--transition-fast) ease,
      opacity var(--transition-fast) ease;
  }

  .sf-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .sf-btn--primary {
    background: var(--accent-primary);
    border: 1px solid transparent;
    color: #fff;
  }

  .sf-btn--primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .sf-btn--ghost {
    background: transparent;
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
  }

  .sf-btn--ghost:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .sf-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
