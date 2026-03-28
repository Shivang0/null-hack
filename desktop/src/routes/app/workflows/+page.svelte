<!-- src/routes/app/workflows/+page.svelte -->
<script lang="ts">
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import { workflowsStore } from '$lib/stores/workflows.svelte';
  import { workspaceStore } from '$lib/stores/workspace.svelte';
  import type { Workflow, WorkflowStep } from '$api/types';

  // Dialog state
  let createOpen = $state(false);
  let addStepOpen = $state(false);

  // Create form state
  let newName = $state('');
  let newDescription = $state('');
  let newTriggerType = $state<Workflow['trigger_type']>('manual');
  let creating = $state(false);

  // Add step form state
  let stepName = $state('');
  let stepType = $state<WorkflowStep['step_type']>('agent_task');
  let addingStep = $state(false);

  function openCreate() {
    newName = '';
    newDescription = '';
    newTriggerType = 'manual';
    createOpen = true;
  }

  function closeCreate() {
    createOpen = false;
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    creating = true;
    const slug = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await workflowsStore.createWorkflow({
      name: newName.trim(),
      slug,
      description: newDescription.trim() || undefined,
      trigger_type: newTriggerType,
      workspace_id: workspaceStore.activeWorkspaceId ?? undefined,
    });
    creating = false;
    closeCreate();
  }

  function selectWorkflow(wf: Workflow) {
    workflowsStore.selectWorkflow(wf);
    // Eagerly load steps and runs
    void workflowsStore.fetchSteps(wf.id);
    void workflowsStore.fetchRuns(wf.id);
  }

  function openAddStep() {
    stepName = '';
    stepType = 'agent_task';
    addStepOpen = true;
  }

  function closeAddStep() {
    addStepOpen = false;
  }

  async function handleAddStep() {
    const wf = workflowsStore.selectedWorkflow;
    if (!wf || !stepName.trim()) return;
    const currentSteps = workflowsStore.steps[wf.id] ?? wf.steps;
    const nextPosition = currentSteps.length + 1;
    addingStep = true;
    await workflowsStore.addStep(wf.id, {
      name: stepName.trim(),
      step_type: stepType,
      position: nextPosition,
    });
    addingStep = false;
    closeAddStep();
  }

  async function handleTrigger(wf: Workflow) {
    await workflowsStore.triggerRun(wf.id);
  }

  async function handleDeleteWorkflow(wf: Workflow) {
    await workflowsStore.deleteWorkflow(wf.id);
  }

  async function handleRemoveStep(workflowId: string, stepId: string) {
    await workflowsStore.removeStep(workflowId, stepId);
  }

  function statusLabel(status: Workflow['status']): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function triggerLabel(t: Workflow['trigger_type']): string {
    const map: Record<string, string> = {
      manual: 'Manual',
      schedule: 'Schedule',
      webhook: 'Webhook',
      event: 'Event',
    };
    return map[t] ?? t;
  }

  function stepTypeLabel(t: WorkflowStep['step_type']): string {
    const map: Record<string, string> = {
      agent_task: 'Agent Task',
      condition: 'Condition',
      delay: 'Delay',
      webhook: 'Webhook',
      transform: 'Transform',
    };
    return map[t] ?? t;
  }

  function formatRelativeTime(iso: string | null): string {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const selectedSteps = $derived(
    workflowsStore.selectedWorkflow
      ? (workflowsStore.steps[workflowsStore.selectedWorkflow.id] ??
          workflowsStore.selectedWorkflow.steps)
      : [],
  );

  const selectedRuns = $derived(
    workflowsStore.selectedWorkflow
      ? (workflowsStore.runs[workflowsStore.selectedWorkflow.id] ?? [])
      : [],
  );

  $effect(() => {
    const wsId = workspaceStore.activeWorkspaceId ?? undefined;
    void workflowsStore.fetchWorkflows(wsId);
  });
</script>

<PageShell title="Workflows" badge={workflowsStore.totalCount || undefined}>
  {#snippet actions()}
    <button
      class="wf-new-btn"
      onclick={openCreate}
      aria-label="Create new workflow"
      type="button"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      New workflow
    </button>
  {/snippet}

  {#if workflowsStore.loading && workflowsStore.workflows.length === 0}
    <div class="wf-loading" aria-label="Loading workflows">
      <LoadingSpinner label="Loading workflows…" />
    </div>
  {:else}
    <div class="wf-layout">
      <!-- LEFT: Workflow list -->
      <div class="wf-list" role="list" aria-label="Workflows">
        {#if workflowsStore.workflows.length === 0}
          <div class="wf-empty">
            <p class="wf-empty-title">No workflows yet</p>
            <p class="wf-empty-sub">Create your first multi-agent pipeline.</p>
          </div>
        {:else}
          {#each workflowsStore.workflows as wf (wf.id)}
            <button
              class="wf-card"
              class:wf-card--selected={workflowsStore.selectedWorkflow?.id === wf.id}
              onclick={() => selectWorkflow(wf)}
              type="button"
              aria-pressed={workflowsStore.selectedWorkflow?.id === wf.id}
              role="listitem"
            >
              <div class="wf-card-header">
                <span class="wf-card-name">{wf.name}</span>
                <span class="wf-badge wf-badge--{wf.status}">{statusLabel(wf.status)}</span>
              </div>
              {#if wf.description}
                <p class="wf-card-desc">{wf.description}</p>
              {/if}
              <div class="wf-card-meta">
                <span class="wf-meta-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {wf.step_count} {wf.step_count === 1 ? 'step' : 'steps'}
                </span>
                <span class="wf-meta-item">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {triggerLabel(wf.trigger_type)}
                </span>
                <span class="wf-meta-item wf-meta-item--muted">
                  {formatRelativeTime(wf.last_run_at)}
                </span>
              </div>
            </button>
          {/each}
        {/if}
      </div>

      <!-- RIGHT: Workflow detail -->
      <div class="wf-detail">
        {#if !workflowsStore.selectedWorkflow}
          <div class="wf-detail-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M3.75 12h16.5m-16.5 0a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5h16.5a1.5 1.5 0 011.5 1.5v4.5a1.5 1.5 0 01-1.5 1.5m-16.5 0a1.5 1.5 0 00-1.5 1.5V18a1.5 1.5 0 001.5 1.5h16.5a1.5 1.5 0 001.5-1.5v-4.5a1.5 1.5 0 00-1.5-1.5" />
            </svg>
            <p>Select a workflow to view its pipeline</p>
          </div>
        {:else}
          {@const wf = workflowsStore.selectedWorkflow}
          <div class="wf-detail-header">
            <div class="wf-detail-title-row">
              <h2 class="wf-detail-title">{wf.name}</h2>
              <span class="wf-badge wf-badge--{wf.status}">{statusLabel(wf.status)}</span>
            </div>
            {#if wf.description}
              <p class="wf-detail-desc">{wf.description}</p>
            {/if}
            <div class="wf-detail-actions">
              <button
                class="wf-btn wf-btn--primary"
                onclick={() => handleTrigger(wf)}
                type="button"
                aria-label="Trigger workflow run"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run now
              </button>
              <button
                class="wf-btn"
                onclick={openAddStep}
                type="button"
                aria-label="Add step to workflow"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add step
              </button>
              <button
                class="wf-btn wf-btn--danger"
                onclick={() => handleDeleteWorkflow(wf)}
                type="button"
                aria-label="Delete workflow"
              >
                Delete
              </button>
            </div>
          </div>

          <!-- Pipeline steps -->
          <div class="wf-pipeline" aria-label="Pipeline steps">
            {#if selectedSteps.length === 0}
              <p class="wf-pipeline-empty">No steps yet. Add a step to build your pipeline.</p>
            {:else}
              {#each selectedSteps as step, i (step.id)}
                <div class="wf-step">
                  <div class="wf-step-connector">
                    <div class="wf-step-index" aria-label="Step {step.position}">
                      {step.position}
                    </div>
                    {#if i < selectedSteps.length - 1}
                      <div class="wf-step-arrow" aria-hidden="true">
                        <svg width="12" height="24" viewBox="0 0 12 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <line x1="6" y1="0" x2="6" y2="16" />
                          <path d="M2 12l4 6 4-6" />
                        </svg>
                      </div>
                    {/if}
                  </div>

                  <div class="wf-step-card">
                    <div class="wf-step-header">
                      <div class="wf-step-agent">
                        {#if step.agent_emoji}
                          <span class="wf-step-emoji" aria-hidden="true">{step.agent_emoji}</span>
                        {:else}
                          <span class="wf-step-emoji wf-step-emoji--default" aria-hidden="true">⚡</span>
                        {/if}
                        <div class="wf-step-info">
                          <span class="wf-step-name">{step.name}</span>
                          {#if step.agent_name}
                            <span class="wf-step-agent-name">{step.agent_name}</span>
                          {/if}
                        </div>
                      </div>
                      <div class="wf-step-right">
                        <span class="wf-step-type-badge">{stepTypeLabel(step.step_type)}</span>
                        <button
                          class="wf-step-remove"
                          onclick={() => handleRemoveStep(wf.id, step.id)}
                          type="button"
                          aria-label="Remove step {step.name}"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {#if step.config?.prompt}
                      <p class="wf-step-prompt">{step.config.prompt as string}</p>
                    {/if}
                    <div class="wf-step-meta">
                      <span>Timeout: {step.timeout_seconds}s</span>
                      {#if step.retry_count > 0}
                        <span>Retries: {step.retry_count}</span>
                      {/if}
                      <span>On failure: {step.on_failure}</span>
                    </div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <!-- Recent runs -->
          {#if selectedRuns.length > 0}
            <div class="wf-runs">
              <h3 class="wf-runs-title">Recent Runs</h3>
              {#each selectedRuns.slice(0, 5) as run (run.id)}
                <div class="wf-run-row">
                  <span class="wf-run-status wf-run-status--{run.status}">{run.status}</span>
                  <span class="wf-run-trigger">{run.trigger_event ?? 'manual'}</span>
                  <span class="wf-run-time">{formatRelativeTime(run.started_at)}</span>
                  {#if run.error}
                    <span class="wf-run-error">{run.error}</span>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</PageShell>

<!-- Create Workflow Dialog -->
{#if createOpen}
  <div
    class="wf-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="wf-create-title"
  >
    <div class="wf-modal" onclick={(e) => e.stopPropagation()}>
      <div class="wf-modal-header">
        <h2 id="wf-create-title" class="wf-modal-title">New Workflow</h2>
        <button
          class="wf-modal-close"
          onclick={closeCreate}
          type="button"
          aria-label="Close dialog"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="wf-modal-body">
        <div class="wf-field">
          <label class="wf-label" for="wf-name">Name</label>
          <input
            id="wf-name"
            class="wf-input"
            type="text"
            placeholder="e.g. Content Pipeline"
            bind:value={newName}
            onkeydown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          />
        </div>

        <div class="wf-field">
          <label class="wf-label" for="wf-desc">Description</label>
          <textarea
            id="wf-desc"
            class="wf-input wf-textarea"
            placeholder="What does this workflow do?"
            bind:value={newDescription}
            rows="2"
          ></textarea>
        </div>

        <div class="wf-field">
          <label class="wf-label" for="wf-trigger">Trigger Type</label>
          <select id="wf-trigger" class="wf-input wf-select" bind:value={newTriggerType}>
            <option value="manual">Manual</option>
            <option value="schedule">Schedule</option>
            <option value="webhook">Webhook</option>
            <option value="event">Event</option>
          </select>
        </div>
      </div>

      <div class="wf-modal-footer">
        <button class="wf-btn" onclick={closeCreate} type="button">Cancel</button>
        <button
          class="wf-btn wf-btn--primary"
          onclick={handleCreate}
          disabled={!newName.trim() || creating}
          type="button"
        >
          {creating ? 'Creating…' : 'Create workflow'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Add Step Dialog -->
{#if addStepOpen}
  <div
    class="wf-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="wf-addstep-title"
  >
    <div class="wf-modal" onclick={(e) => e.stopPropagation()}>
      <div class="wf-modal-header">
        <h2 id="wf-addstep-title" class="wf-modal-title">Add Step</h2>
        <button
          class="wf-modal-close"
          onclick={closeAddStep}
          type="button"
          aria-label="Close dialog"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="wf-modal-body">
        <div class="wf-field">
          <label class="wf-label" for="wf-step-name">Step Name</label>
          <input
            id="wf-step-name"
            class="wf-input"
            type="text"
            placeholder="e.g. Draft Content Brief"
            bind:value={stepName}
            onkeydown={(e) => { if (e.key === 'Enter') handleAddStep(); }}
          />
        </div>

        <div class="wf-field">
          <label class="wf-label" for="wf-step-type">Step Type</label>
          <select id="wf-step-type" class="wf-input wf-select" bind:value={stepType}>
            <option value="agent_task">Agent Task</option>
            <option value="condition">Condition</option>
            <option value="delay">Delay</option>
            <option value="webhook">Webhook</option>
            <option value="transform">Transform</option>
          </select>
        </div>
      </div>

      <div class="wf-modal-footer">
        <button class="wf-btn" onclick={closeAddStep} type="button">Cancel</button>
        <button
          class="wf-btn wf-btn--primary"
          onclick={handleAddStep}
          disabled={!stepName.trim() || addingStep}
          type="button"
        >
          {addingStep ? 'Adding…' : 'Add step'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.wf-loading {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.wf-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* ── List panel ─────────────────────────────────────────────────────────── */
.wf-list {
  border-right: 1px solid var(--color-border, rgba(255,255,255,0.07));
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.wf-empty {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--color-text-muted, rgba(255,255,255,0.4));
}

.wf-empty-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--color-text, rgba(255,255,255,0.8));
}

.wf-empty-sub {
  font-size: 0.75rem;
}

.wf-card {
  width: 100%;
  text-align: left;
  background: transparent;
  border: 1px solid var(--color-border, rgba(255,255,255,0.07));
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  color: var(--color-text, rgba(255,255,255,0.85));
}

.wf-card:hover {
  background: var(--color-surface-hover, rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.12);
}

.wf-card--selected {
  background: var(--color-surface-active, rgba(99,102,241,0.12));
  border-color: rgba(99,102,241,0.4);
}

.wf-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.wf-card-name {
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf-card-desc {
  font-size: 0.6875rem;
  color: var(--color-text-muted, rgba(255,255,255,0.45));
  margin: 0 0 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wf-card-meta {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.wf-meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted, rgba(255,255,255,0.45));
}

.wf-meta-item--muted {
  margin-left: auto;
}

/* ── Status badges ──────────────────────────────────────────────────────── */
.wf-badge {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.15em 0.5em;
  border-radius: 99px;
  flex-shrink: 0;
}

.wf-badge--active {
  background: rgba(34,197,94,0.15);
  color: #4ade80;
}

.wf-badge--draft {
  background: rgba(148,163,184,0.12);
  color: rgba(255,255,255,0.5);
}

.wf-badge--paused {
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
}

.wf-badge--archived {
  background: rgba(100,116,139,0.15);
  color: rgba(255,255,255,0.35);
}

/* ── Detail panel ───────────────────────────────────────────────────────── */
.wf-detail {
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.wf-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 100%;
  color: var(--color-text-muted, rgba(255,255,255,0.35));
  font-size: 0.8125rem;
  text-align: center;
  padding: 3rem;
}

.wf-detail-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.wf-detail-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wf-detail-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text, rgba(255,255,255,0.9));
  margin: 0;
}

.wf-detail-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted, rgba(255,255,255,0.5));
  margin: 0;
  line-height: 1.5;
}

.wf-detail-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
}

/* ── Buttons ────────────────────────────────────────────────────────────── */
.wf-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--color-border, rgba(255,255,255,0.1));
  background: transparent;
  color: var(--color-text, rgba(255,255,255,0.7));
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.wf-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.16);
}

.wf-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.wf-btn--primary {
  background: rgba(99,102,241,0.2);
  border-color: rgba(99,102,241,0.4);
  color: #a5b4fc;
}

.wf-btn--primary:hover:not(:disabled) {
  background: rgba(99,102,241,0.3);
}

.wf-btn--danger {
  color: #f87171;
  border-color: rgba(248,113,113,0.2);
}

.wf-btn--danger:hover:not(:disabled) {
  background: rgba(248,113,113,0.08);
}

.wf-new-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(99,102,241,0.35);
  background: rgba(99,102,241,0.12);
  color: #a5b4fc;
  cursor: pointer;
  transition: background 0.15s;
}

.wf-new-btn:hover {
  background: rgba(99,102,241,0.22);
}

/* ── Pipeline ───────────────────────────────────────────────────────────── */
.wf-pipeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.wf-pipeline-empty {
  font-size: 0.75rem;
  color: var(--color-text-muted, rgba(255,255,255,0.4));
  padding: 1rem 0;
}

.wf-step {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.wf-step-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 28px;
}

.wf-step-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(99,102,241,0.18);
  border: 1px solid rgba(99,102,241,0.35);
  color: #a5b4fc;
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wf-step-arrow {
  color: var(--color-border, rgba(255,255,255,0.2));
  display: flex;
  justify-content: center;
  margin: 0;
}

.wf-step-card {
  flex: 1;
  background: var(--color-surface, rgba(255,255,255,0.03));
  border: 1px solid var(--color-border, rgba(255,255,255,0.07));
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.wf-step-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.wf-step-agent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.wf-step-emoji {
  font-size: 1.125rem;
  line-height: 1;
  flex-shrink: 0;
}

.wf-step-emoji--default {
  opacity: 0.5;
}

.wf-step-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.wf-step-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text, rgba(255,255,255,0.85));
}

.wf-step-agent-name {
  font-size: 0.6875rem;
  color: var(--color-text-muted, rgba(255,255,255,0.45));
}

.wf-step-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.wf-step-type-badge {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15em 0.5em;
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.5);
}

.wf-step-remove {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.25);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
}

.wf-step-remove:hover {
  color: #f87171;
  background: rgba(248,113,113,0.08);
}

.wf-step-prompt {
  font-size: 0.6875rem;
  color: rgba(255,255,255,0.45);
  line-height: 1.5;
  margin: 0 0 0.375rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wf-step-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.625rem;
  color: rgba(255,255,255,0.3);
}

/* ── Runs ───────────────────────────────────────────────────────────────── */
.wf-runs {
  border-top: 1px solid var(--color-border, rgba(255,255,255,0.07));
  padding-top: 1rem;
}

.wf-runs-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.75rem;
}

.wf-run-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 0.6875rem;
}

.wf-run-status {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  padding: 0.1em 0.4em;
  border-radius: 4px;
}

.wf-run-status--pending  { background: rgba(148,163,184,0.12); color: rgba(255,255,255,0.5); }
.wf-run-status--running  { background: rgba(59,130,246,0.15);  color: #60a5fa; }
.wf-run-status--completed { background: rgba(34,197,94,0.12); color: #4ade80; }
.wf-run-status--failed   { background: rgba(248,113,113,0.12); color: #f87171; }
.wf-run-status--cancelled { background: rgba(100,116,139,0.12); color: rgba(255,255,255,0.35); }

.wf-run-trigger {
  color: rgba(255,255,255,0.4);
}

.wf-run-time {
  margin-left: auto;
  color: rgba(255,255,255,0.3);
}

.wf-run-error {
  color: #f87171;
  font-size: 0.625rem;
  truncate: true;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* ── Modal ──────────────────────────────────────────────────────────────── */
.wf-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(2px);
}

.wf-modal {
  background: var(--color-surface-elevated, #1a1d2e);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  width: 420px;
  max-width: calc(100vw - 2rem);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
}

.wf-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.875rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.wf-modal-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text, rgba(255,255,255,0.9));
  margin: 0;
}

.wf-modal-close {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.15s;
  display: flex;
  align-items: center;
}

.wf-modal-close:hover {
  color: rgba(255,255,255,0.7);
}

.wf-modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wf-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.wf-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.wf-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
}

.wf-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: rgba(255,255,255,0.85);
  font-size: 0.8125rem;
  padding: 0.5rem 0.75rem;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.wf-input:focus {
  border-color: rgba(99,102,241,0.5);
}

.wf-textarea {
  resize: vertical;
  min-height: 60px;
}

.wf-select {
  appearance: none;
  cursor: pointer;
}
</style>
