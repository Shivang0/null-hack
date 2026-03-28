<script lang="ts">
  interface Props {
    value: string | number;
    variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'accent';
    size?: 'sm' | 'md';
  }

  let { value, variant = 'default', size = 'md' }: Props = $props();
</script>

<span
  class="badge badge--{variant} badge--{size}"
  aria-label="{variant} badge: {value}"
>
  {value}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    font-family: var(--font-sans);
    font-weight: 600;
    white-space: nowrap;
    line-height: 1;
    padding: 0 6px;
  }

  /* Sizes */
  .badge--sm {
    height: 18px;
    min-width: 18px;
    font-size: 10px;
    padding: 0 5px;
  }

  .badge--md {
    height: 22px;
    min-width: 22px;
    font-size: 11px;
    padding: 0 7px;
  }

  /* Variants */
  .badge--default {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .badge--info {
    background: rgba(59, 130, 246, 0.15);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.25);
  }

  .badge--success {
    background: rgba(34, 197, 94, 0.08);
    color: rgba(34, 197, 94, 0.7);
    border: 1px solid rgba(34, 197, 94, 0.15);
  }

  .badge--warning {
    background: rgba(234, 179, 8, 0.15);
    color: #fde047;
    border: 1px solid rgba(234, 179, 8, 0.25);
  }

  .badge--error {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .badge--accent {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.35);
  }
</style>
