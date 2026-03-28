<!-- src/lib/components/spawn/SpawnPresets.svelte -->
<script lang="ts">
  interface Preset {
    id: string;
    label: string;
    icon: string;
    task: string;
    model?: string;
  }

  interface Props {
    onSelect: (preset: { task: string; model?: string }) => void;
  }

  let { onSelect }: Props = $props();

  const PRESETS: Preset[] = [
    {
      id: 'code-review',
      label: 'Code Review',
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      task: 'Review the recent code changes in this repository. Identify bugs, security issues, performance problems, and opportunities for improvement. Provide a structured report.',
    },
    {
      id: 'bug-fix',
      label: 'Bug Fix',
      icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4m0 4h.01',
      task: 'Investigate and fix the reported bug. Reproduce the issue, identify the root cause, implement a minimal fix, and add a regression test.',
    },
    {
      id: 'research',
      label: 'Research',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      task: 'Research the following topic and produce a comprehensive summary with key findings, best practices, and actionable recommendations:',
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      task: 'Generate comprehensive documentation for the codebase. Include API docs, usage examples, architecture overview, and setup instructions in Markdown format.',
    },
  ];

  let activeId = $state<string | null>(null);

  function handleSelect(preset: Preset) {
    activeId = preset.id;
    onSelect({ task: preset.task, model: preset.model });
  }
</script>

<div class="spp-root" role="group" aria-label="Spawn presets">
  <p class="spp-title">Quick presets</p>
  <div class="spp-grid">
    {#each PRESETS as preset (preset.id)}
      <button
        class="spp-card"
        class:spp-card--active={activeId === preset.id}
        onclick={() => handleSelect(preset)}
        aria-pressed={activeId === preset.id}
        aria-label="Apply {preset.label} preset"
        type="button"
      >
        <span class="spp-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d={preset.icon} />
          </svg>
        </span>
        <span class="spp-label">{preset.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .spp-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .spp-title {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .spp-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .spp-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    padding: 12px 8px;
    border-radius: var(--radius-md);
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      background var(--transition-fast) ease,
      border-color var(--transition-fast) ease,
      color var(--transition-fast) ease,
      transform var(--transition-fast) ease;
    text-align: center;
  }

  .spp-card:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-primary);
    transform: translateY(-1px);
  }

  .spp-card--active {
    background: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.4);
    color: #60a5fa;
  }

  .spp-card:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .spp-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    flex-shrink: 0;
  }

  .spp-card--active .spp-icon {
    background: rgba(59, 130, 246, 0.15);
  }

  .spp-label {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
  }
</style>
