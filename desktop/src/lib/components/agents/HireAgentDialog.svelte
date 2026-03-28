<!-- src/lib/components/agents/HireAgentDialog.svelte -->
<script lang="ts">
  import { agentsStore } from '$lib/stores/agents.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import type { AgentCreateRequest, AdapterType } from '$api/types';
  import AgentIdentity from './hire/AgentIdentity.svelte';
  import AgentAdapterPicker from './hire/AgentAdapterPicker.svelte';
  import AgentModelConfig from './hire/AgentModelConfig.svelte';
  import AgentBudgetConfig from './hire/AgentBudgetConfig.svelte';
  import AgentScheduleConfig from './hire/AgentScheduleConfig.svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  // Form state
  let name = $state('');
  let displayName = $state('');
  let emoji = $state('🤖');
  let role = $state('');
  let adapter = $state<AdapterType>(settingsStore.data.default_adapter ?? 'osa');
  let model = $state('claude-sonnet-4-6');
  let systemPrompt = $state('');
  let selectedSkills = $state<string[]>([]);
  let dailyLimitDollars = $state('10.00');
  let monthlyLimitDollars = $state('100.00');
  let warningThreshold = $state(80);
  let hardStop = $state(true);
  let cronExpr = $state('');
  let isSubmitting = $state(false);
  let errors = $state<Record<string, string>>({});

  function toggleSkill(skill: string) {
    if (selectedSkills.includes(skill)) {
      selectedSkills = selectedSkills.filter((s) => s !== skill);
    } else {
      selectedSkills = [...selectedSkills, skill];
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    else if (!/^[a-z0-9-_]+$/.test(name.trim())) e.name = 'Use lowercase letters, numbers, hyphens, underscores';
    if (!displayName.trim()) e.displayName = 'Display name is required';
    if (!role.trim()) e.role = 'Role is required';
    if (!model.trim()) e.model = 'Model is required';
    errors = e;
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!validate()) return;

    isSubmitting = true;
    const req: AgentCreateRequest = {
      name: name.trim(),
      display_name: displayName.trim(),
      avatar_emoji: emoji,
      role: role.trim(),
      adapter,
      model: model.trim(),
      system_prompt: systemPrompt.trim() || undefined,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      budget_policy: {
        daily_limit_cents: Math.round(parseFloat(dailyLimitDollars) * 100),
        monthly_limit_cents: Math.round(parseFloat(monthlyLimitDollars) * 100),
        warning_threshold: warningThreshold / 100,
        hard_stop: hardStop,
      },
      schedule: cronExpr.trim() ? { cron: cronExpr.trim(), enabled: true } : undefined,
    };

    const created = await agentsStore.createAgent(req);
    isSubmitting = false;
    if (created) {
      resetForm();
      onClose();
    }
  }

  function resetForm() {
    name = '';
    displayName = '';
    emoji = '🤖';
    role = '';
    adapter = settingsStore.data.default_adapter ?? 'osa';
    model = 'claude-sonnet-4-6';
    systemPrompt = '';
    selectedSkills = [];
    dailyLimitDollars = '10.00';
    monthlyLimitDollars = '100.00';
    warningThreshold = 80;
    hardStop = true;
    cronExpr = '';
    errors = {};
  }

  function handleBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('had-overlay')) onClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="had-overlay"
    onclick={handleBackdrop}
    onkeydown={handleKeyDown}
    role="dialog"
    aria-modal="true"
    aria-label="Hire a new agent"
    tabindex="-1"
  >
    <div class="had-modal">
      <header class="had-header">
        <h2 class="had-title">Hire Agent</h2>
        <button class="had-close" onclick={onClose} aria-label="Close dialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <form class="had-form" onsubmit={handleSubmit} novalidate>
        <div class="had-body">
          <AgentIdentity
            {name}
            {displayName}
            {emoji}
            {role}
            {errors}
            onName={(v) => (name = v)}
            onDisplayName={(v) => (displayName = v)}
            onEmoji={(v) => (emoji = v)}
            onRole={(v) => (role = v)}
          />

          <AgentAdapterPicker
            {adapter}
            onAdapter={(v) => (adapter = v)}
          />

          <AgentModelConfig
            {model}
            {systemPrompt}
            {selectedSkills}
            {displayName}
            {errors}
            onModel={(v) => (model = v)}
            onSystemPrompt={(v) => (systemPrompt = v)}
            onToggleSkill={toggleSkill}
          />

          <AgentBudgetConfig
            {dailyLimitDollars}
            {monthlyLimitDollars}
            {warningThreshold}
            {hardStop}
            onDailyLimit={(v) => (dailyLimitDollars = v)}
            onMonthlyLimit={(v) => (monthlyLimitDollars = v)}
            onWarningThreshold={(v) => (warningThreshold = v)}
            onHardStop={(v) => (hardStop = v)}
          />

          <AgentScheduleConfig
            {cronExpr}
            onCronExpr={(v) => (cronExpr = v)}
          />
        </div>

        <footer class="had-footer">
          <button
            type="button"
            class="had-btn had-btn--secondary"
            onclick={onClose}
            aria-label="Cancel and close dialog"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="had-btn had-btn--primary"
            disabled={isSubmitting}
            aria-label="Hire agent"
            aria-busy={isSubmitting}
          >
            {#if isSubmitting}
              <span class="had-spinner" aria-hidden="true"></span>
              Hiring…
            {:else}
              Hire Agent
            {/if}
          </button>
        </footer>
      </form>
    </div>
  </div>
{/if}

<style>
  .had-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .had-modal {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 640px;
    max-height: 90dvh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .had-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .had-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .had-close {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-xs);
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 120ms ease;
  }

  .had-close:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .had-form {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .had-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .had-body::-webkit-scrollbar {
    width: 5px;
  }

  .had-body::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 3px;
  }

  .had-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 20px;
    border-top: 1px solid var(--border-default);
    flex-shrink: 0;
    background: var(--bg-secondary);
  }

  .had-btn {
    height: 34px;
    padding: 0 16px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 120ms ease;
    border: 1px solid transparent;
  }

  .had-btn--secondary {
    background: transparent;
    border-color: var(--border-default);
    color: var(--text-secondary);
  }

  .had-btn--secondary:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .had-btn--primary {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
    color: #93c5fd;
  }

  .had-btn--primary:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.7);
    color: #bfdbfe;
  }

  .had-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .had-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(147, 197, 253, 0.3);
    border-top-color: #93c5fd;
    border-radius: 50%;
    animation: had-spin 0.7s linear infinite;
  }

  @keyframes had-spin {
    to { transform: rotate(360deg); }
  }
</style>
