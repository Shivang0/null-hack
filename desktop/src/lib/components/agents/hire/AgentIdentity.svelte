<!-- src/lib/components/agents/hire/AgentIdentity.svelte -->
<script lang="ts">
  interface Props {
    name: string;
    displayName: string;
    emoji: string;
    role: string;
    errors: Record<string, string>;
    onName: (v: string) => void;
    onDisplayName: (v: string) => void;
    onEmoji: (v: string) => void;
    onRole: (v: string) => void;
  }

  let {
    name,
    displayName,
    emoji,
    role,
    errors,
    onName,
    onDisplayName,
    onEmoji,
    onRole,
  }: Props = $props();

  const EMOJIS = [
    '🤖','🔍','📝','🏗️','🔮','🛡️','📬','⚒️','🎨','🌐',
    '🧠','⚡','🔬','📊','🎯','🚀','🌿','🦅','🔧','💡',
  ];
</script>

<section class="hid-section">
  <h3 class="hid-section-title">Identity</h3>

  <!-- Emoji picker -->
  <div class="hid-field">
    <label class="hid-label" for="hid-emoji-display">Avatar</label>
    <div class="hid-emoji-grid" role="group" aria-label="Choose avatar emoji">
      {#each EMOJIS as em}
        <button
          type="button"
          class="hid-emoji-btn"
          class:hid-emoji-btn--selected={emoji === em}
          onclick={() => onEmoji(em)}
          aria-label="Use {em} as avatar"
          aria-pressed={emoji === em}
        >{em}</button>
      {/each}
    </div>
    <span id="hid-emoji-display" class="hid-hint" aria-live="polite">Selected: {emoji}</span>
  </div>

  <div class="hid-row">
    <div class="hid-field">
      <label class="hid-label" for="hid-name">Name <span class="hid-required">*</span></label>
      <input
        id="hid-name"
        class="hid-input"
        class:hid-input--error={errors.name}
        type="text"
        value={name}
        oninput={(e) => onName((e.target as HTMLInputElement).value)}
        placeholder="scout"
        autocomplete="off"
        aria-describedby={errors.name ? 'hid-name-error' : undefined}
        aria-required="true"
      />
      {#if errors.name}
        <span id="hid-name-error" class="hid-error" role="alert">{errors.name}</span>
      {/if}
    </div>

    <div class="hid-field">
      <label class="hid-label" for="hid-display-name">Display Name <span class="hid-required">*</span></label>
      <input
        id="hid-display-name"
        class="hid-input"
        class:hid-input--error={errors.displayName}
        type="text"
        value={displayName}
        oninput={(e) => onDisplayName((e.target as HTMLInputElement).value)}
        placeholder="Scout"
        autocomplete="off"
        aria-describedby={errors.displayName ? 'hid-display-name-error' : undefined}
        aria-required="true"
      />
      {#if errors.displayName}
        <span id="hid-display-name-error" class="hid-error" role="alert">{errors.displayName}</span>
      {/if}
    </div>
  </div>

  <div class="hid-field">
    <label class="hid-label" for="hid-role">Role <span class="hid-required">*</span></label>
    <input
      id="hid-role"
      class="hid-input"
      class:hid-input--error={errors.role}
      type="text"
      value={role}
      oninput={(e) => onRole((e.target as HTMLInputElement).value)}
      placeholder="Security Analyst"
      autocomplete="off"
      aria-describedby={errors.role ? 'hid-role-error' : undefined}
      aria-required="true"
    />
    {#if errors.role}
      <span id="hid-role-error" class="hid-error" role="alert">{errors.role}</span>
    {/if}
  </div>
</section>

<style>
  .hid-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .hid-section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-tertiary);
    margin: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-default);
  }

  .hid-row {
    display: flex;
    gap: 12px;
  }

  .hid-row .hid-field {
    flex: 1;
  }

  .hid-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .hid-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .hid-required {
    color: var(--accent-error);
  }

  .hid-hint {
    font-size: 11px;
    color: var(--text-muted);
  }

  .hid-error {
    font-size: 11px;
    color: var(--accent-error);
  }

  .hid-input {
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

  .hid-input:focus {
    border-color: var(--border-focus);
  }

  .hid-input--error {
    border-color: var(--accent-error);
  }

  .hid-emoji-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .hid-emoji-btn {
    width: 34px;
    height: 34px;
    font-size: 18px;
    border-radius: var(--radius-xs);
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 100ms ease;
  }

  .hid-emoji-btn:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
  }

  .hid-emoji-btn--selected {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
  }
</style>
