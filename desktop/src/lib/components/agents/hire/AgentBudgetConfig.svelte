<!-- src/lib/components/agents/hire/AgentBudgetConfig.svelte -->
<script lang="ts">
  interface Props {
    dailyLimitDollars: string;
    monthlyLimitDollars: string;
    warningThreshold: number;
    hardStop: boolean;
    onDailyLimit: (v: string) => void;
    onMonthlyLimit: (v: string) => void;
    onWarningThreshold: (v: number) => void;
    onHardStop: (v: boolean) => void;
  }

  let {
    dailyLimitDollars,
    monthlyLimitDollars,
    warningThreshold,
    hardStop,
    onDailyLimit,
    onMonthlyLimit,
    onWarningThreshold,
    onHardStop,
  }: Props = $props();
</script>

<section class="hbc-section">
  <h3 class="hbc-section-title">Budget</h3>

  <div class="hbc-row">
    <div class="hbc-field">
      <label class="hbc-label" for="hbc-daily">Daily limit ($)</label>
      <input
        id="hbc-daily"
        class="hbc-input"
        type="number"
        min="0"
        step="0.01"
        value={dailyLimitDollars}
        oninput={(e) => onDailyLimit((e.target as HTMLInputElement).value)}
        aria-label="Daily spending limit in dollars"
      />
    </div>
    <div class="hbc-field">
      <label class="hbc-label" for="hbc-monthly">Monthly limit ($)</label>
      <input
        id="hbc-monthly"
        class="hbc-input"
        type="number"
        min="0"
        step="0.01"
        value={monthlyLimitDollars}
        oninput={(e) => onMonthlyLimit((e.target as HTMLInputElement).value)}
        aria-label="Monthly spending limit in dollars"
      />
    </div>
  </div>

  <div class="hbc-field">
    <label class="hbc-label" for="hbc-warning">
      Warning threshold: {warningThreshold}%
    </label>
    <input
      id="hbc-warning"
      class="hbc-slider"
      type="range"
      min="50"
      max="95"
      step="5"
      value={warningThreshold}
      oninput={(e) => onWarningThreshold(Number((e.target as HTMLInputElement).value))}
      aria-label="Warning threshold percentage"
      aria-valuemin="50"
      aria-valuemax="95"
      aria-valuenow={warningThreshold}
      aria-valuetext="{warningThreshold}%"
    />
  </div>

  <label class="hbc-toggle-row">
    <span class="hbc-label">Hard stop at limit</span>
    <input
      type="checkbox"
      class="hbc-checkbox"
      checked={hardStop}
      onchange={(e) => onHardStop((e.target as HTMLInputElement).checked)}
      aria-label="Enable hard stop when budget limit is reached"
    />
    <span class="hbc-toggle-hint">Agent stops immediately when budget is exhausted</span>
  </label>
</section>

<style>
  .hbc-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .hbc-section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-tertiary);
    margin: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-default);
  }

  .hbc-row {
    display: flex;
    gap: 12px;
  }

  .hbc-row .hbc-field {
    flex: 1;
  }

  .hbc-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .hbc-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .hbc-input {
    height: 34px;
    padding: 0 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 13px;
    font-family: var(--font-sans);
    outline: none;
    transition: border-color 120ms ease;
  }

  .hbc-input:focus {
    border-color: var(--border-focus);
  }

  .hbc-slider {
    width: 100%;
    height: 4px;
    accent-color: var(--accent-primary);
    cursor: pointer;
  }

  .hbc-checkbox {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--accent-primary);
    flex-shrink: 0;
  }

  .hbc-toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .hbc-toggle-hint {
    font-size: 11px;
    color: var(--text-muted);
  }
</style>
