<!-- src/lib/components/costs/AnomalyAlert.svelte -->
<script lang="ts">
  import { costsStore } from '$lib/stores/costs.svelte';

  interface Props {
    onDismiss?: () => void;
    onInvestigate?: () => void;
  }

  let { onDismiss, onInvestigate }: Props = $props();

  let dismissed = $state(false);

  const incident = $derived(costsStore.topAnomaly);
  const show = $derived(!dismissed && incident !== null);

  function fmtCents(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
  }

  function handleDismiss() {
    dismissed = true;
    onDismiss?.();
  }

  function handleInvestigate() {
    onInvestigate?.();
  }
</script>

{#if show && incident}
  <div class="aa-banner" role="alert" aria-live="assertive">
    <div class="aa-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>

    <div class="aa-body">
      <strong class="aa-title">Cost Anomaly Detected</strong>
      <span class="aa-msg">
        {incident.agent_name} spent {fmtCents(incident.amount_cents)} — exceeding the {fmtCents(incident.limit_cents)} limit.
        {incident.message}
      </span>
    </div>

    <div class="aa-actions">
      <button class="aa-btn aa-btn--investigate" onclick={handleInvestigate}>
        Investigate
      </button>
      <button class="aa-btn aa-btn--dismiss" onclick={handleDismiss} aria-label="Dismiss anomaly alert">
        Dismiss
      </button>
    </div>
  </div>
{/if}

<style>
  .aa-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-md);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .aa-icon {
    flex-shrink: 0;
    color: #f59e0b;
    margin-top: 1px;
  }

  .aa-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .aa-title {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    color: #f59e0b;
  }

  .aa-msg {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .aa-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .aa-btn {
    display: inline-flex;
    align-items: center;
    border-radius: var(--radius-sm);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
    transition: opacity 120ms ease;
    border: none;
  }

  .aa-btn:hover {
    opacity: 0.85;
  }

  .aa-btn--investigate {
    background: #f59e0b;
    color: #000;
  }

  .aa-btn--dismiss {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
  }

  .aa-btn--dismiss:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }
</style>
