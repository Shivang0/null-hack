<!-- src/routes/app/settings/tabs/AppearanceSettings.svelte -->
<script lang="ts">
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { themeStore, type ThemeMode } from '$lib/stores/theme.svelte';

  const THEMES: { id: ThemeMode; label: string; bg: string; accent: string; surface: string }[] = [
    { id: 'dark',   label: 'Dark',   bg: '#0a0a0a',              accent: '#3b82f6', surface: '#1a1a1a' },
    { id: 'glass',  label: 'Glass',  bg: 'rgba(10,10,14,0.6)',   accent: '#8b5cf6', surface: 'rgba(255,255,255,0.06)' },
    { id: 'color',  label: 'Color',  bg: '#050510',              accent: '#3b82f6', surface: 'rgba(59,130,246,0.08)' },
    { id: 'light',  label: 'Light',  bg: '#fafafa',              accent: '#3b82f6', surface: '#ffffff' },
    { id: 'system', label: 'System', bg: 'linear-gradient(135deg,#0a0a0a 50%,#fafafa 50%)', accent: '#3b82f6', surface: '#888' },
  ];

  function handleThemeSelect(mode: ThemeMode) {
    themeStore.setMode(mode);
    settingsStore.update('theme', mode);
  }
</script>

<section class="stg-section">
  <h2 class="stg-section-title">Appearance</h2>

  <div class="stg-card">
    <div class="stg-field">
      <span class="stg-label">Theme</span>
      <p class="stg-desc">Choose your interface theme.</p>
      <div class="stg-theme-grid" role="radiogroup" aria-label="Theme selection">
        {#each THEMES as theme (theme.id)}
          {@const isActive = themeStore.mode === theme.id}
          <button
            class="stg-theme-card"
            class:stg-theme-card--active={isActive}
            onclick={() => handleThemeSelect(theme.id)}
            role="radio"
            aria-checked={isActive}
            aria-label="{theme.label} theme"
          >
            <div class="stg-theme-swatch" style="background: {theme.bg};">
              <div class="stg-theme-swatch-inner" style="background: {theme.surface}; border-color: {theme.accent}33;"></div>
              <div class="stg-theme-dot" style="background: {theme.accent};"></div>
            </div>
            <span class="stg-theme-name">{theme.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="stg-sep"></div>

    <div class="stg-field">
      <label class="stg-label" for="font-size">
        Font Size
        <span class="stg-value-badge">{settingsStore.data.font_size}px</span>
      </label>
      <p class="stg-desc">Base font size for the interface (12–20px).</p>
      <input
        id="font-size"
        class="stg-slider"
        type="range"
        min="12"
        max="20"
        step="1"
        value={settingsStore.data.font_size}
        oninput={(e) => settingsStore.update('font_size', Number((e.target as HTMLInputElement).value))}
      />
      <div class="stg-slider-labels">
        <span>12px</span>
        <span>20px</span>
      </div>
    </div>

    <div class="stg-sep"></div>

    <div class="stg-field stg-field--row">
      <div class="stg-field-text">
        <label class="stg-label" for="sidebar-collapsed">Sidebar Collapsed by Default</label>
        <p class="stg-desc">Start with the sidebar in collapsed state on launch.</p>
      </div>
      <label class="stg-toggle" aria-label="Sidebar collapsed by default">
        <input
          id="sidebar-collapsed"
          type="checkbox"
          checked={settingsStore.data.sidebar_default_collapsed}
          onchange={(e) => settingsStore.update('sidebar_default_collapsed', (e.target as HTMLInputElement).checked)}
        />
        <span class="stg-toggle-track">
          <span class="stg-toggle-thumb"></span>
        </span>
      </label>
    </div>
  </div>
</section>

<style>
  .stg-section { max-width: 640px; }

  .stg-section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px;
  }

  .stg-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 4px 0;
    margin-top: 16px;
  }

  .stg-sep {
    height: 1px;
    background: var(--border-default);
    margin: 0;
  }

  .stg-field {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stg-field--row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .stg-field-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .stg-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stg-desc {
    font-size: 12px;
    color: var(--text-tertiary);
    line-height: 1.5;
  }

  .stg-value-badge {
    font-size: 11px;
    font-weight: 500;
    color: var(--accent-primary);
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: var(--radius-full);
    padding: 1px 7px;
  }

  .stg-slider {
    width: 100%;
    height: 4px;
    appearance: none;
    background: var(--border-default);
    border-radius: var(--radius-full);
    outline: none;
    cursor: pointer;
    accent-color: var(--accent-primary);
  }

  .stg-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-primary);
    cursor: pointer;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    transition: box-shadow var(--transition-fast);
  }

  .stg-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.25);
  }

  .stg-slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .stg-toggle {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .stg-toggle input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .stg-toggle-track {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .stg-toggle input:checked ~ .stg-toggle-track {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  .stg-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: var(--text-tertiary);
    border-radius: 50%;
    transition: transform var(--transition-fast), background var(--transition-fast);
  }

  .stg-toggle input:checked ~ .stg-toggle-track .stg-toggle-thumb {
    transform: translateX(16px);
    background: #fff;
  }

  /* Theme Picker */

  .stg-theme-grid {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .stg-theme-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0;
    background: transparent;
    border: 2px solid var(--border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color var(--transition-fast), transform var(--transition-fast);
    overflow: hidden;
    width: 96px;
  }

  .stg-theme-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-1px);
  }

  .stg-theme-card--active { border-color: var(--accent-primary); }

  .stg-theme-swatch {
    position: relative;
    width: 100%;
    height: 52px;
    overflow: hidden;
  }

  .stg-theme-swatch-inner {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 0;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    border: 1px solid;
  }

  .stg-theme-dot {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .stg-theme-name {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    padding: 0 8px 8px;
  }

  .stg-theme-card--active .stg-theme-name { color: var(--accent-primary); }
</style>
