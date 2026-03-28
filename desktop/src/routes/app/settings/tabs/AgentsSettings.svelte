<!-- src/routes/app/settings/tabs/AgentsSettings.svelte -->
<script lang="ts">
  import { settingsStore } from '$lib/stores/settings.svelte';

  let defaultSystemPrompt = $state('');
</script>

<section class="stg-section">
  <h2 class="stg-section-title">Agents</h2>

  <div class="stg-card">
    <div class="stg-field">
      <label class="stg-label" for="auto-approve">Auto-Approve Budget Threshold</label>
      <p class="stg-desc">Automatically approve agent actions that cost less than this amount (in cents).</p>
      <div class="stg-input-group">
        <span class="stg-input-prefix">¢</span>
        <input
          id="auto-approve"
          class="stg-input stg-input--prefixed"
          type="number"
          min="0"
          max="10000"
          step="50"
          value={settingsStore.data.auto_approve_budget_under_cents}
          oninput={(e) => settingsStore.update('auto_approve_budget_under_cents', Number((e.target as HTMLInputElement).value))}
        />
      </div>
      <p class="stg-hint">Currently set to {(settingsStore.data.auto_approve_budget_under_cents / 100).toFixed(2)} USD per action.</p>
    </div>

    <div class="stg-sep"></div>

    <div class="stg-field">
      <label class="stg-label" for="max-agents">Max Concurrent Agents</label>
      <p class="stg-desc">Maximum number of agents that can run simultaneously across all sessions.</p>
      <input
        id="max-agents"
        class="stg-input"
        type="number"
        min="1"
        max="100"
        value={settingsStore.data.max_concurrent_agents}
        oninput={(e) => settingsStore.update('max_concurrent_agents', parseInt((e.target as HTMLInputElement).value) || 10)}
      />
    </div>

    <div class="stg-sep"></div>

    <div class="stg-field">
      <label class="stg-label" for="session-timeout">Session Timeout (minutes)</label>
      <p class="stg-desc">Idle sessions are automatically closed after this duration.</p>
      <input
        id="session-timeout"
        class="stg-input"
        type="number"
        min="5"
        max="1440"
        value={settingsStore.data.session_timeout_minutes}
        oninput={(e) => settingsStore.update('session_timeout_minutes', parseInt((e.target as HTMLInputElement).value) || 60)}
      />
    </div>

    <div class="stg-sep"></div>

    <div class="stg-field">
      <label class="stg-label" for="default-system-prompt">Default System Prompt</label>
      <p class="stg-desc">Injected into every new agent session unless overridden by the agent's own prompt.</p>
      <textarea
        id="default-system-prompt"
        class="stg-textarea"
        rows="6"
        placeholder="You are a helpful OSA agent..."
        bind:value={defaultSystemPrompt}
      ></textarea>
    </div>
  </div>
</section>

<style>
  .stg-section { max-width: 640px; }

  .stg-section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px;
  }

  .stg-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 4px 0;
    margin-top: 16px;
  }

  .stg-sep {
    height: 1px;
    background: var(--border-default);
    margin: 0;
  }

  .stg-field {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stg-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stg-desc {
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1.5;
  }

  .stg-hint {
    font-size: 11px;
    color: var(--text-muted);
  }

  .stg-input-group {
    display: flex;
    align-items: stretch;
  }

  .stg-input-prefix {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 10px;
    font-size: 13px;
    color: var(--text-tertiary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-right: none;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    flex-shrink: 0;
  }

  .stg-input {
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
    color: var(--text-primary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .stg-input:focus { border-color: var(--border-focus); }

  .stg-input--prefixed {
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  .stg-textarea {
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    font-family: var(--font-mono);
    color: var(--text-primary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    outline: none;
    resize: vertical;
    transition: border-color var(--transition-fast);
    line-height: 1.6;
  }

  .stg-textarea:focus { border-color: var(--border-focus); }
  .stg-textarea::placeholder { color: var(--text-muted); }
</style>
