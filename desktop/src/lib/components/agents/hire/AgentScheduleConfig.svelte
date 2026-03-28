<!-- src/lib/components/agents/hire/AgentScheduleConfig.svelte -->
<script lang="ts">
  interface Props {
    cronExpr: string;
    onCronExpr: (v: string) => void;
  }

  let { cronExpr, onCronExpr }: Props = $props();

  const CRON_PRESETS = [
    { label: 'Every hour',    cron: '0 * * * *'   },
    { label: 'Every 6 hours', cron: '0 */6 * * *' },
    { label: 'Daily 9am',     cron: '0 9 * * *'   },
    { label: 'Weekdays 9am',  cron: '0 9 * * 1-5' },
    { label: 'Weekly Monday', cron: '0 9 * * 1'   },
  ];
</script>

<section class="hsc-section">
  <h3 class="hsc-section-title">Schedule</h3>

  <div class="hsc-field">
    <label class="hsc-label" for="hsc-cron">Cron expression</label>
    <input
      id="hsc-cron"
      class="hsc-input hsc-input--mono"
      type="text"
      value={cronExpr}
      oninput={(e) => onCronExpr((e.target as HTMLInputElement).value)}
      placeholder="0 9 * * 1-5"
      autocomplete="off"
      aria-describedby="hsc-cron-hint"
    />
    <span id="hsc-cron-hint" class="hsc-hint">Leave empty for no schedule</span>
  </div>

  <div class="hsc-presets" role="group" aria-label="Cron presets">
    {#each CRON_PRESETS as preset}
      <button
        type="button"
        class="hsc-preset-btn"
        class:hsc-preset-btn--active={cronExpr === preset.cron}
        onclick={() => onCronExpr(preset.cron)}
        aria-label="Set schedule to {preset.label}"
        aria-pressed={cronExpr === preset.cron}
      >
        {preset.label}
      </button>
    {/each}
  </div>
</section>

<style>
  .hsc-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .hsc-section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-tertiary);
    margin: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-default);
  }

  .hsc-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .hsc-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .hsc-hint {
    font-size: 11px;
    color: var(--text-muted);
  }

  .hsc-input {
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

  .hsc-input:focus {
    border-color: var(--border-focus);
  }

  .hsc-input--mono {
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .hsc-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .hsc-preset-btn {
    height: 26px;
    padding: 0 10px;
    border-radius: var(--radius-xs);
    border: 1px solid var(--border-default);
    background: transparent;
    color: var(--text-secondary);
    font-size: 11px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 100ms ease;
  }

  .hsc-preset-btn:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .hsc-preset-btn--active {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
    color: #93c5fd;
  }
</style>
