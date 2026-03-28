<!-- src/routes/app/settings/tabs/NotificationsSettings.svelte -->
<script lang="ts">
  import { settingsStore } from '$lib/stores/settings.svelte';

  let notifyBudget = $state(true);
  let notifyAgentError = $state(true);
  let notifyHeartbeat = $state(false);
  let notifyInbox = $state(true);
</script>

<section class="stg-section">
  <h2 class="stg-section-title">Notifications</h2>

  <div class="stg-card">
    <div class="stg-field stg-field--row">
      <div class="stg-field-text">
        <label class="stg-label" for="notifications-enabled">Enable Notifications</label>
        <p class="stg-desc">Show desktop notifications for agent events and system alerts.</p>
      </div>
      <label class="stg-toggle" aria-label="Enable notifications">
        <input
          id="notifications-enabled"
          type="checkbox"
          checked={settingsStore.data.notifications_enabled}
          onchange={(e) => settingsStore.update('notifications_enabled', (e.target as HTMLInputElement).checked)}
        />
        <span class="stg-toggle-track">
          <span class="stg-toggle-thumb"></span>
        </span>
      </label>
    </div>
  </div>

  {#if settingsStore.data.notifications_enabled}
    <div class="stg-card stg-card--mt">
      <p class="stg-card-header">Notification Types</p>

      <div class="stg-check-list">
        <label class="stg-check-row">
          <input type="checkbox" class="stg-checkbox" bind:checked={notifyBudget} />
          <div class="stg-check-text">
            <span class="stg-check-label">Budget warnings</span>
            <span class="stg-check-desc">Alert when nearing or exceeding spend limits.</span>
          </div>
        </label>

        <label class="stg-check-row">
          <input type="checkbox" class="stg-checkbox" bind:checked={notifyAgentError} />
          <div class="stg-check-text">
            <span class="stg-check-label">Agent errors</span>
            <span class="stg-check-desc">Notify when an agent fails or enters error state.</span>
          </div>
        </label>

        <label class="stg-check-row">
          <input type="checkbox" class="stg-checkbox" bind:checked={notifyHeartbeat} />
          <div class="stg-check-text">
            <span class="stg-check-label">Heartbeat completions</span>
            <span class="stg-check-desc">Notify on each scheduled heartbeat run completion.</span>
          </div>
        </label>

        <label class="stg-check-row">
          <input type="checkbox" class="stg-checkbox" bind:checked={notifyInbox} />
          <div class="stg-check-text">
            <span class="stg-check-label">Inbox approvals</span>
            <span class="stg-check-desc">Notify when an agent requests human approval.</span>
          </div>
        </label>
      </div>
    </div>
  {/if}
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

  .stg-card--mt { margin-top: 12px; }

  .stg-card-header {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 12px 16px 4px;
  }

  .stg-field {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stg-field--row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .stg-field-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
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

  .stg-toggle {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .stg-toggle input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .stg-toggle-track {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .stg-toggle input:checked ~ .stg-toggle-track {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .stg-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: var(--text-tertiary);
    border-radius: 50%;
    transition: transform var(--transition-fast), background var(--transition-fast);
  }

  .stg-toggle input:checked ~ .stg-toggle-track .stg-toggle-thumb {
    transform: translateX(16px);
    background: #fff;
  }

  .stg-check-list {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }

  .stg-check-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .stg-check-row:hover { background: var(--bg-elevated); }

  .stg-checkbox {
    width: 15px;
    height: 15px;
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: var(--accent-primary);
    cursor: pointer;
  }

  .stg-check-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stg-check-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .stg-check-desc {
    font-size: 12px;
    color: var(--text-tertiary);
  }
</style>
