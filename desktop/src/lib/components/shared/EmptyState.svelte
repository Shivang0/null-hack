<script lang="ts">
  interface Props {
    title: string;
    description?: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
  }

  let { title, description, icon, actionLabel, onAction }: Props = $props();
</script>

<div class="es-wrap" role="region" aria-label={title}>
  {#if icon}
    <div class="es-icon" aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25">
        <path d={icon} />
      </svg>
    </div>
  {:else}
    <div class="es-icon es-icon--default" aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25">
        <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    </div>
  {/if}

  <div class="es-text">
    <h3 class="es-title">{title}</h3>
    {#if description}
      <p class="es-description">{description}</p>
    {/if}
  </div>

  {#if actionLabel && onAction}
    <button
      class="es-action"
      onclick={onAction}
      aria-label={actionLabel}
    >
      {actionLabel}
    </button>
  {/if}
</div>

<style>
  .es-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    padding: var(--space-10) var(--space-6);
    text-align: center;
    width: 100%;
  }

  .es-icon {
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
  }

  .es-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  .es-title {
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .es-description {
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--text-tertiary);
    max-width: 320px;
    margin: 0;
    line-height: 1.6;
  }

  .es-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--accent-primary);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--transition-fast) ease,
      border-color var(--transition-fast) ease,
      color var(--transition-fast) ease;
    text-decoration: none;
  }

  .es-action:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }

  .es-action:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
