<!-- src/lib/components/agents/hire/AgentAdapterPicker.svelte -->
<script lang="ts">
  import type { AdapterType } from '$api/types';

  interface Props {
    adapter: AdapterType;
    onAdapter: (v: AdapterType) => void;
  }

  let { adapter, onAdapter }: Props = $props();

  const ADAPTERS: { value: AdapterType; label: string; description: string }[] = [
    { value: 'osa',         label: 'OSA',         description: 'Native OSA agent runtime' },
    { value: 'claude_code', label: 'Claude Code',  description: 'Anthropic Claude Code CLI' },
    { value: 'codex',       label: 'Codex',        description: 'OpenAI Codex adapter' },
    { value: 'openclaw',    label: 'OpenClaw',      description: 'OpenClaw coding agent' },
    { value: 'jidoclaw',    label: 'JidoClaw',      description: 'Elixir-native agent framework' },
    { value: 'hermes',      label: 'Hermes',        description: 'Fast message-passing runtime' },
    { value: 'bash',        label: 'Bash',          description: 'Shell command executor' },
    { value: 'http',        label: 'HTTP',          description: 'HTTP webhook adapter' },
    { value: 'custom',      label: 'Custom',        description: 'Custom adapter config' },
  ];
</script>

<section class="hap-section">
  <h3 class="hap-section-title">Adapter</h3>
  <div class="hap-grid" role="radiogroup" aria-label="Select adapter">
    {#each ADAPTERS as a}
      <label
        class="hap-card"
        class:hap-card--selected={adapter === a.value}
        aria-label="{a.label}: {a.description}"
      >
        <input
          type="radio"
          name="adapter"
          value={a.value}
          checked={adapter === a.value}
          onchange={() => onAdapter(a.value)}
          class="hap-radio-hidden"
          aria-label={a.label}
        />
        <span class="hap-name">{a.label}</span>
        <span class="hap-desc">{a.description}</span>
      </label>
    {/each}
  </div>
</section>

<style>
  .hap-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .hap-section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-tertiary);
    margin: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-default);
  }

  .hap-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .hap-card {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-default);
    background: var(--bg-surface);
    cursor: pointer;
    transition: all 120ms ease;
  }

  .hap-card:hover {
    border-color: var(--border-hover);
    background: var(--bg-elevated);
  }

  .hap-card--selected {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.1);
  }

  .hap-radio-hidden {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .hap-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .hap-desc {
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.3;
  }
</style>
