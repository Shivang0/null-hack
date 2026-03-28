<!-- src/lib/components/spawn/ActiveInstances.svelte -->
<script lang="ts">
  import type { SpawnInstance } from '$api/types';
  import StatusDot from '$lib/components/shared/StatusDot.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';

  interface Props {
    instances: SpawnInstance[];
    onCancel?: (id: string) => void;
  }

  let { instances, onCancel }: Props = $props();

  function elapsedLabel(started: string): string {
    const ms = now - new Date(started).getTime();
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
    return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
  }

  function tokenTotal(instance: SpawnInstance): number {
    if (!instance.token_usage) return 0;
    return instance.token_usage.input + instance.token_usage.output;
  }

  function dotStatus(status: SpawnInstance['status']): 'online' | 'idle' | 'error' {
    if (status === 'running') return 'online';
    if (status === 'completed') return 'idle';
    return 'error';
  }

  let now = $state(Date.now());
  let timer: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    const hasRunning = instances.some((i) => i.status === 'running');
    if (hasRunning && timer === null) {
      timer = setInterval(() => (now = Date.now()), 1000);
    } else if (!hasRunning && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    return () => {
      if (timer !== null) { clearInterval(timer); timer = null; }
    };
  });
</script>

<section class="ai-section" aria-label="Active spawn instances">
  <h2 class="ai-title">
    Active
    {#if instances.length > 0}
      <span class="ai-count" aria-label="{instances.length} active">{instances.length}</span>
    {/if}
  </h2>

  {#if instances.length === 0}
    <EmptyState
      title="No active instances"
      description="Spawned agents will appear here while running."
    />
  {:else}
    <ul class="ai-list" role="list">
      {#each instances as instance (instance.id)}
        <li class="ai-item">
          <div class="ai-item-header">
            <StatusDot
              status={dotStatus(instance.status)}
              pulse={instance.status === 'running'}
              size="sm"
            />
            <span class="ai-agent">{instance.agent_name}</span>
            <span class="ai-status ai-status--{instance.status}">{instance.status}</span>
          </div>

          <p class="ai-task">{instance.task}</p>

          <div class="ai-metrics">
            {#if instance.status === 'running'}
              <span class="ai-metric">
                <span class="ai-metric-label">Elapsed</span>
                <span class="ai-metric-value ai-metric-value--mono">
                  {elapsedLabel(instance.started_at)}
                </span>
              </span>
            {/if}
            {#if tokenTotal(instance) > 0}
              <span class="ai-metric">
                <span class="ai-metric-label">Tokens</span>
                <span class="ai-metric-value ai-metric-value--mono">
                  {tokenTotal(instance).toLocaleString()}
                </span>
              </span>
            {/if}
            {#if instance.cost_cents !== null}
              <span class="ai-metric">
                <span class="ai-metric-label">Cost</span>
                <span class="ai-metric-value ai-metric-value--mono">
                  ${(instance.cost_cents / 100).toFixed(3)}
                </span>
              </span>
            {/if}
          </div>

          {#if instance.status === 'running' && onCancel}
            <button
              class="ai-cancel"
              onclick={() => onCancel!(instance.id)}
              aria-label="Cancel spawn instance for {instance.agent_name}"
              type="button"
            >
              Cancel
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .ai-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ai-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
  }

  .ai-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.35);
    color: #60a5fa;
    font-size: 10px;
    font-weight: 600;
  }

  .ai-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ai-item {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ai-item-header {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .ai-agent {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ai-status {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    text-transform: capitalize;
    border: 1px solid transparent;
    flex-shrink: 0;
  }

  .ai-status--running {
    background: rgba(34, 197, 94, 0.08);
    color: rgba(34, 197, 94, 0.7);
    border-color: rgba(34, 197, 94, 0.18);
  }

  .ai-status--completed {
    background: rgba(148, 163, 184, 0.08);
    color: var(--text-tertiary);
    border-color: var(--border-default);
  }

  .ai-status--failed {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.25);
  }

  .ai-task {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ai-metrics {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ai-metric {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ai-metric-label {
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ai-metric-value {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-secondary);
  }

  .ai-metric-value--mono {
    font-family: var(--font-mono);
  }

  .ai-cancel {
    align-self: flex-start;
    padding: 4px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.08);
    color: #f87171;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--transition-fast) ease,
      border-color var(--transition-fast) ease;
  }

  .ai-cancel:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .ai-cancel:focus-visible {
    outline: 2px solid var(--accent-error);
    outline-offset: 2px;
  }
</style>
