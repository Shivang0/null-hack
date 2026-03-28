<!-- src/lib/components/schedules/CronEditor.svelte -->
<script lang="ts">
  // Presets defined inline — CRON_PRESETS from the store are used by ScheduleForm

  interface Props {
    value: string;
    onchange?: (value: string) => void;
    onPreview?: (nextRuns: string[]) => void;
  }

  let { value = $bindable('0 * * * *'), onchange, onPreview }: Props = $props();

  // Parse cron into 5 parts
  let parts = $state<string[]>(['0', '*', '*', '*', '*']);

  $effect(() => {
    const split = value.trim().split(/\s+/);
    if (split.length === 5) {
      parts = split;
    }
  });

  function updatePart(index: number, val: string) {
    const next = [...parts];
    next[index] = val;
    parts = next;
    const newCron = next.join(' ');
    value = newCron;
    onchange?.(newCron);
    computePreview(newCron);
  }

  function applyPreset(cron: string) {
    value = cron;
    onchange?.(cron);
    const split = cron.trim().split(/\s+/);
    if (split.length === 5) parts = split;
    computePreview(cron);
  }

  function handleRawInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    value = raw;
    onchange?.(raw);
    const split = raw.trim().split(/\s+/);
    if (split.length === 5) parts = split;
    computePreview(raw);
  }

  // ── Cron description ──────────────────────────────────────────────────────

  function describe(cron: string): string {
    const p = cron.trim().split(/\s+/);
    if (p.length !== 5) return 'Invalid cron expression';
    const [min, hour, dom, , dow] = p;

    if (cron === '* * * * *') return 'Every minute';
    if (min.startsWith('*/') && hour === '*' && dom === '*' && dow === '*') {
      return `Every ${min.slice(2)} minutes`;
    }
    if (min === '0' && hour.startsWith('*/') && dom === '*' && dow === '*') {
      return `Every ${hour.slice(2)} hours`;
    }
    if (min === '0' && hour === '*' && dom === '*' && dow === '*') {
      return 'Every hour';
    }
    if (min === '0' && dom === '*' && dow === '*') {
      return `Daily at ${hour.padStart(2, '0')}:00 UTC`;
    }
    if (min === '0' && dom === '*' && dow === '1-5') {
      return `Weekdays at ${hour.padStart(2, '0')}:00 UTC`;
    }
    if (min === '0' && dom === '*' && dow !== '*') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNames = dow
        .split(',')
        .map((d) => days[parseInt(d)] ?? d)
        .join(', ');
      return `${dayNames} at ${hour.padStart(2, '0')}:00 UTC`;
    }
    return cron;
  }

  // ── Next runs preview ─────────────────────────────────────────────────────

  function computePreview(cron: string) {
    if (!onPreview) return;
    const next = getNextRuns(cron, 5);
    onPreview(next);
  }

  function getNextRuns(cron: string, count: number): string[] {
    // Simple approximation — generates ~5 upcoming ISO strings
    // A real implementation would use a cron-parser library
    const p = cron.trim().split(/\s+/);
    if (p.length !== 5) return [];

    const results: string[] = [];
    let d = new Date();
    d.setSeconds(0, 0);
    d = new Date(d.getTime() + 60_000); // start from next minute

    let attempts = 0;
    while (results.length < count && attempts < 1440) {
      if (matchesCron(p, d)) {
        results.push(d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }));
      }
      d = new Date(d.getTime() + 60_000);
      attempts++;
    }
    return results;
  }

  function matchesCron(parts: string[], d: Date): boolean {
    const [min, hour, dom, month, dow] = parts;
    return (
      matchField(min, d.getMinutes(), 0, 59) &&
      matchField(hour, d.getHours(), 0, 23) &&
      matchField(dom, d.getDate(), 1, 31) &&
      matchField(month, d.getMonth() + 1, 1, 12) &&
      matchField(dow, d.getDay(), 0, 6)
    );
  }

  function matchField(expr: string, val: number, _min: number, _max: number): boolean {
    if (expr === '*') return true;
    if (expr.startsWith('*/')) {
      const step = parseInt(expr.slice(2));
      return !isNaN(step) && val % step === 0;
    }
    if (expr.includes('-')) {
      const [lo, hi] = expr.split('-').map(Number);
      return val >= lo && val <= hi;
    }
    if (expr.includes(',')) {
      return expr.split(',').map(Number).includes(val);
    }
    return parseInt(expr) === val;
  }

  const description = $derived(describe(value));

  // Validate: 5 space-separated tokens
  const isValid = $derived(/^(\S+\s+){4}\S+$/.test(value.trim()));

  // Preset labels (compact)
  const COMPACT_PRESETS = [
    { label: 'Every hour', cron: '0 * * * *' },
    { label: 'Every 4h',   cron: '0 */4 * * *' },
    { label: 'Daily 9am',  cron: '0 9 * * *' },
    { label: 'Weekdays',   cron: '0 9 * * 1-5' },
    { label: 'Weekly Mon', cron: '0 9 * * 1' },
  ];

  const nextRunsList = $state<string[]>([]);

  $effect(() => {
    const runs = getNextRuns(value, 5);
    nextRunsList.splice(0, nextRunsList.length, ...runs);
  });

  const FIELD_LABELS = ['Minute', 'Hour', 'Day', 'Month', 'Weekday'];
  const FIELD_PLACEHOLDERS = ['0-59', '0-23', '1-31', '1-12', '0-6'];
</script>

<div class="ce-root" aria-label="Cron expression editor">
  <!-- Preset row -->
  <div class="ce-presets" role="group" aria-label="Cron presets">
    {#each COMPACT_PRESETS as p (p.cron)}
      <button
        class="ce-preset"
        class:ce-preset--active={value === p.cron}
        onclick={() => applyPreset(p.cron)}
        aria-pressed={value === p.cron}
        type="button"
      >
        {p.label}
      </button>
    {/each}
  </div>

  <!-- Field row -->
  <div class="ce-fields" role="group" aria-label="Cron fields">
    {#each FIELD_LABELS as label, i (label)}
      <div class="ce-field">
        <label class="ce-field-label" for="cron-field-{i}">{label}</label>
        <input
          id="cron-field-{i}"
          class="ce-field-input"
          type="text"
          value={parts[i] ?? '*'}
          placeholder={FIELD_PLACEHOLDERS[i]}
          aria-label="{label} field"
          oninput={(e) => updatePart(i, (e.target as HTMLInputElement).value)}
        />
      </div>
    {/each}
  </div>

  <!-- Raw input -->
  <div class="ce-raw">
    <label class="ce-raw-label" for="cron-raw">Raw cron</label>
    <input
      id="cron-raw"
      class="ce-raw-input"
      class:ce-raw-input--invalid={!isValid}
      type="text"
      {value}
      placeholder="* * * * *"
      aria-label="Raw cron expression"
      aria-invalid={!isValid}
      oninput={handleRawInput}
    />
  </div>

  <!-- Description -->
  <p class="ce-description" aria-live="polite">
    <span class="ce-description-label">Runs:</span>
    {description}
  </p>

  <!-- Next runs -->
  {#if nextRunsList.length > 0}
    <div class="ce-next-runs" aria-label="Next scheduled runs">
      <p class="ce-next-runs-title">Next 5 runs</p>
      <ol class="ce-next-runs-list">
        {#each nextRunsList as run, i (i)}
          <li class="ce-next-runs-item">{run}</li>
        {/each}
      </ol>
    </div>
  {/if}
</div>

<style>
  .ce-root {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Presets ── */
  .ce-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .ce-preset {
    padding: 4px 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--transition-fast) ease,
      border-color var(--transition-fast) ease,
      color var(--transition-fast) ease;
  }

  .ce-preset:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .ce-preset--active {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
    color: #60a5fa;
  }

  .ce-preset:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  /* ── Fields ── */
  .ce-fields {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }

  .ce-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ce-field-label {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 500;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ce-field-input {
    width: 100%;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 12px;
    text-align: center;
    transition: border-color var(--transition-fast) ease;
  }

  .ce-field-input:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  /* ── Raw input ── */
  .ce-raw {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ce-raw-label {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .ce-raw-input {
    width: 100%;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 13px;
    transition: border-color var(--transition-fast) ease;
  }

  .ce-raw-input:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .ce-raw-input--invalid {
    border-color: var(--accent-error);
  }

  /* ── Description ── */
  .ce-description {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
  }

  .ce-description-label {
    color: var(--text-tertiary);
    margin-right: 4px;
  }

  /* ── Next runs ── */
  .ce-next-runs {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
  }

  .ce-next-runs-title {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 6px;
  }

  .ce-next-runs-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .ce-next-runs-item {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
  }
</style>
