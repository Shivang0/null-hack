<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
  }

  let { size = 'md', label }: Props = $props();

  const ariaLabel = $derived(label ?? 'Loading');
</script>

<div class="ls-wrap" role="status" aria-label={ariaLabel}>
  <div class="ls-spinner ls-spinner--{size}" aria-hidden="true"></div>
  {#if label}
    <span class="ls-label">{label}</span>
  {/if}
</div>

<style>
  .ls-wrap {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  .ls-spinner {
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-top-color: var(--accent-primary);
    animation: ls-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .ls-spinner--sm { width: 16px; height: 16px; }
  .ls-spinner--md { width: 24px; height: 24px; }
  .ls-spinner--lg { width: 32px; height: 32px; }

  .ls-label {
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1.4;
  }

  @keyframes ls-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .ls-spinner {
      animation: none;
      opacity: 0.7;
    }
  }
</style>
