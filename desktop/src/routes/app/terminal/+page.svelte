<!-- src/routes/app/terminal/+page.svelte -->
<script lang="ts">
  import PageShell from '$lib/components/layout/PageShell.svelte';
</script>

<PageShell title="Terminal" subtitle="Embedded shell" noPadding={false}>
  <div class="trm-placeholder" role="status">
    <div class="trm-preview" aria-hidden="true">
      <span class="trm-prompt">nullhack@osa</span><span class="trm-path">:~$</span>
      <span class="trm-cursor"></span>
    </div>
    <h2 class="trm-title">Terminal</h2>
    <p class="trm-desc">
      An embedded terminal for direct agent interaction, command execution,
      and real-time log streaming from the OSA backend.
    </p>
    <div class="trm-notice">
      <span class="trm-notice-label">Backend required</span>
      Connect the NULLHACK backend to enable the terminal.
    </div>
    <ul class="trm-features" aria-label="Planned features">
      <li>WebSocket-backed interactive shell</li>
      <li>Agent-scoped command execution</li>
      <li>Real-time log tail and filtering</li>
      <li>Command history with search</li>
    </ul>
  </div>
</PageShell>

<style>
  .trm-placeholder {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 16px; min-height: 320px; text-align: center;
    padding: 40px;
  }
  .trm-preview {
    font-family: var(--font-mono); font-size: 14px; padding: 12px 20px;
    background: rgba(0,0,0,0.4); border: 1px solid var(--dbd); border-radius: 8px;
    display: flex; align-items: center; gap: 6px; opacity: 0.6;
  }
  .trm-prompt { color: rgba(255, 255, 255, 0.6); }
  .trm-path { color: #93c5fd; }
  .trm-cursor {
    width: 8px; height: 14px; background: var(--dt);
    animation: trm-blink 1.2s step-end infinite;
  }
  @keyframes trm-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  .trm-title { font-size: 18px; font-weight: 600; color: var(--dt); margin: 0; }
  .trm-desc { font-size: 13px; color: var(--dt3); max-width: 400px; margin: 0; line-height: 1.6; }
  .trm-notice {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-radius: 8px; font-size: 12px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.25);
    color: var(--dt2);
  }
  .trm-notice-label { font-weight: 600; color: #fbbf24; white-space: nowrap; }
  .trm-features {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 6px; align-items: center;
  }
  .trm-features li {
    font-size: 12px; color: var(--dt4);
    display: flex; align-items: center; gap: 6px;
  }
  .trm-features li::before { content: '—'; opacity: 0.4; }
</style>
