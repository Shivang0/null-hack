<script lang="ts">
  interface Props {
    miosaCloud: boolean;
  }

  let { miosaCloud = $bindable() }: Props = $props();
</script>

<div class="ob-step">
  <div class="ob-step-icon">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
      <path d="M5 10a5 5 0 0110 0"/>
      <path d="M3 14a7 7 0 0114 0"/>
      <circle cx="10" cy="17" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  </div>
  <h1 class="ob-title">MIOSA Cloud</h1>
  <p class="ob-subtitle">Sandboxed compute for your agents</p>

  <div class="ob-cloud-card">
    <div class="ob-cloud-body">
      <div class="ob-cloud-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
          <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/>
          <path d="M12 22V12M21 7l-9 5M3 7l9 5"/>
        </svg>
      </div>
      <div class="ob-cloud-text">
        <h3 class="ob-cloud-title">Firecracker microVM Sandboxing</h3>
        <p class="ob-cloud-desc">Each agent task runs in an isolated Firecracker microVM — sub-second startup, full Linux, zero host access. Safe computer use, file operations, and code execution without risk.</p>
        <ul class="ob-cloud-features">
          <li>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M3 8l3 3 7-7"/></svg>
            Isolated microVM per task
          </li>
          <li>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M3 8l3 3 7-7"/></svg>
            125ms cold start
          </li>
          <li>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M3 8l3 3 7-7"/></svg>
            Safe computer use &amp; file ops
          </li>
          <li>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><path d="M3 8l3 3 7-7"/></svg>
            Pay-per-second billing
          </li>
        </ul>
      </div>
    </div>

    <div class="ob-toggle-row">
      <div class="ob-toggle-info">
        <span class="ob-toggle-label">Enable MIOSA Cloud sandboxing</span>
        <span class="ob-toggle-hint">Can be changed later in Settings</span>
      </div>
      <button
        class="ob-toggle"
        class:ob-toggle--on={miosaCloud}
        onclick={() => miosaCloud = !miosaCloud}
        role="switch"
        aria-checked={miosaCloud}
        aria-label="Enable MIOSA Cloud sandboxing"
      >
        <span class="ob-toggle-thumb"></span>
      </button>
    </div>
  </div>
</div>

<style>
  .ob-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
    gap: 0;
  }

  .ob-step-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 auto 1.25rem;
  }

  .ob-title {
    font-size: 1.625rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 0.375rem;
    letter-spacing: -0.02em;
  }

  .ob-subtitle {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0 0 1.75rem;
  }

  .ob-cloud-card {
    width: 100%;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    overflow: hidden;
  }

  .ob-cloud-body {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .ob-cloud-icon {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 2px;
  }

  .ob-cloud-text {
    flex: 1;
    text-align: left;
  }

  .ob-cloud-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0 0 0.5rem;
  }

  .ob-cloud-desc {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0 0 0.875rem;
    line-height: 1.6;
  }

  .ob-cloud-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .ob-cloud-features li {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .ob-cloud-features li :global(svg) {
    color: #3b82f6;
    flex-shrink: 0;
  }

  .ob-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
  }

  .ob-toggle-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ob-toggle-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #d0d0d0;
  }

  .ob-toggle-hint {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.3);
  }

  .ob-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.12);
    cursor: pointer;
    transition: background 200ms ease, border-color 200ms ease;
    flex-shrink: 0;
  }

  .ob-toggle--on {
    background: #3b82f6;
    border-color: rgba(59, 130, 246, 0.6);
  }

  .ob-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transition: transform 200ms ease, background 200ms ease;
    pointer-events: none;
  }

  .ob-toggle--on .ob-toggle-thumb {
    transform: translateX(20px);
    background: #ffffff;
  }
</style>
