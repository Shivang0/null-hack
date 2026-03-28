<!-- src/routes/app/integrations/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { integrationsStore } from '$lib/stores/integrations.svelte';
  import { detectAdapters, installAdapter, checkAdapterHealth } from '$lib/services/adapters';
  import type { AdapterStatus } from '$lib/services/adapters';
  import { getProviderCredentials } from '$lib/services/credentials';
  import { checkOsaHealth, findOsaPort, setupOsa } from '$lib/services/osa';
  import type { OsaHealth, OsaSetupStep } from '$lib/services/osa';
  import { isTauri } from '$lib/utils/platform';

  let adapters = $state<AdapterStatus[]>([]);
  let adapterLoading = $state(true);
  let installingId = $state<string | null>(null);
  let installOutput = $state<string | null>(null);
  let providerSlug = $state<string | null>(null);
  let activeTab = $state<'adapters' | 'integrations'>('adapters');

  // OSA setup state
  let osaHealth = $state<OsaHealth | null>(null);
  let osaPort = $state<number | null>(null);
  let osaSetupSteps = $state<OsaSetupStep[]>([]);
  let osaSetupRunning = $state(false);
  let osaElixirInstalled = $state<boolean | null>(null);
  let osaFound = $state<boolean | null>(null);

  onMount(async () => {
    const [, creds,] = await Promise.all([
      loadAdapters(),
      getProviderCredentials(),
      checkOsa(),
    ]);
    if (creds) providerSlug = creds.slug;
    // Re-check OSA after adapters load (for elixir/osa detection via adapter list)
    await checkOsa();
    void integrationsStore.fetchIntegrations();
  });

  async function loadAdapters() {
    adapterLoading = true;
    try {
      adapters = await detectAdapters();
    } catch {
      adapters = [];
    }
    adapterLoading = false;
  }

  async function handleInstall(id: string) {
    installingId = id;
    installOutput = null;
    try {
      const result = await installAdapter(id);
      installOutput = result.success ? 'Installed successfully' : result.output;
      await loadAdapters();
    } catch (e) {
      installOutput = (e as Error).message;
    }
    installingId = null;
  }

  async function handleHealthCheck(id: string) {
    const result = await checkAdapterHealth(id);
    const idx = adapters.findIndex(a => a.id === id);
    if (idx >= 0) {
      adapters[idx] = { ...adapters[idx], running: result.healthy };
      adapters = [...adapters];
    }
  }

  const installedCount = $derived(adapters.filter(a => a.installed).length);
  const runningCount = $derived(adapters.filter(a => a.running).length);

  // ── OSA Setup ─────────────────────────────────────────────────────────────

  async function checkOsa() {
    osaHealth = await checkOsaHealth();
    osaPort = await findOsaPort();

    // Derive elixir/osa status from adapter detection
    const osaAdapter = adapters.find(a => a.id === 'osa');
    if (osaAdapter) {
      osaElixirInstalled = osaAdapter.installed || osaAdapter.running;
      osaFound = osaAdapter.installed;
    } else {
      // If adapters haven't loaded yet, just check health
      osaElixirInstalled = null;
      osaFound = null;
    }
  }

  async function runOsaSetup() {
    osaSetupRunning = true;
    osaSetupSteps = [];
    try {
      osaSetupSteps = await setupOsa();
      // Derive statuses from setup results
      const elixirStep = osaSetupSteps.find(s => s.step === 'elixir');
      if (elixirStep) osaElixirInstalled = elixirStep.success;
      const locateStep = osaSetupSteps.find(s => s.step === 'locate');
      if (locateStep) osaFound = locateStep.success;
    } catch (e) {
      osaSetupSteps = [{ step: 'error', success: false, message: String(e) }];
    }
    osaSetupRunning = false;
    await checkOsa();
    await loadAdapters();
  }

  async function locateOsa() {
    if (!isTauri()) return;
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({ directory: true, title: 'Locate OSA Directory' });
    if (selected && typeof selected === 'string') {
      osaSetupRunning = true;
      osaSetupSteps = [];
      try {
        osaSetupSteps = await setupOsa(selected);
      } catch (e) {
        osaSetupSteps = [{ step: 'error', success: false, message: String(e) }];
      }
      osaSetupRunning = false;
      await checkOsa();
      await loadAdapters();
    }
  }
</script>

<PageShell
  title="Integrations"
  subtitle="{installedCount} adapters installed, {runningCount} running"
>
  <div class="int-tabs">
    <button
      class="int-tab"
      class:int-tab--active={activeTab === 'adapters'}
      onclick={() => activeTab = 'adapters'}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>
      Adapters
      <span class="int-tab-count">{adapters.length}</span>
    </button>
    <button
      class="int-tab"
      class:int-tab--active={activeTab === 'integrations'}
      onclick={() => activeTab = 'integrations'}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l2.5 2.5"/></svg>
      Services
      <span class="int-tab-count">{integrationsStore.connectedCount}</span>
    </button>
  </div>

  {#if activeTab === 'adapters'}
    <!-- Adapter Detection & Management -->
    {#if adapterLoading}
      <div class="int-loading" role="status">
        <div class="int-spinner"></div>
        <span>Detecting installed adapters...</span>
      </div>
    {:else}
      <div class="int-section-header">
        <p class="int-section-desc">Adapters determine how your agents execute tasks. Install and connect the ones you need.</p>
        <button class="int-refresh" onclick={loadAdapters} aria-label="Re-scan adapters">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M2 8a6 6 0 0111.3-2.7M14 8a6 6 0 01-11.3 2.7"/><path d="M14 2v4h-4M2 14v-4h4"/></svg>
          Re-scan
        </button>
      </div>

      {#if installOutput}
        <div class="int-toast" role="status">
          <span>{installOutput}</span>
          <button onclick={() => installOutput = null} aria-label="Dismiss">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
      {/if}

      <!-- OSA Quick Setup -->
      {#if osaHealth}
        <div class="osa-connected" role="status">
          <div class="osa-connected-left">
            <div class="osa-dot osa-dot--live"></div>
            <strong class="osa-label">OSA</strong>
            {#if osaHealth.version}
              <span class="osa-ver">v{osaHealth.version}</span>
            {/if}
            <span class="osa-port">port {osaPort}</span>
          </div>
          <span class="osa-badge-running">Running</span>
        </div>
      {:else}
        <div class="osa-setup" role="region" aria-label="OSA Setup">
          <div class="osa-setup-top">
            <div class="osa-setup-info">
              <strong class="osa-setup-title">Set up OSA</strong>
              <p class="osa-setup-desc">The recommended agent runtime. Let's get it running.</p>
            </div>
          </div>

          {#if osaSetupSteps.length > 0}
            <div class="osa-steps">
              {#each osaSetupSteps as step (step.step + step.message)}
                <div class="osa-step" class:osa-step--ok={step.success} class:osa-step--fail={!step.success}>
                  <span class="osa-step-icon">{step.success ? '\u2713' : '\u2717'}</span>
                  <span class="osa-step-label">{step.step}</span>
                  <span class="osa-step-msg">{step.message}</span>
                </div>
              {/each}
            </div>
          {/if}

          <div class="osa-setup-actions">
            {#if osaElixirInstalled === false}
              <p class="osa-hint">Install Elixir first: <code>brew install elixir</code></p>
            {:else if osaFound === false}
              <button class="adp-btn adp-btn--secondary" onclick={locateOsa} disabled={osaSetupRunning}>
                Locate OSA Directory
              </button>
              <p class="osa-hint">Or: <code>git clone https://github.com/Miosa-osa/OptimalSystemAgent</code></p>
            {:else}
              <button class="adp-btn adp-btn--primary" onclick={runOsaSetup} disabled={osaSetupRunning}>
                {#if osaSetupRunning}
                  <div class="int-spinner int-spinner--sm"></div>
                  Setting up...
                {:else}
                  Auto-Setup OSA
                {/if}
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <div class="adp-grid" role="list">
        {#each adapters as adapter (adapter.id)}
          <div class="adp-card" class:adp-card--installed={adapter.installed} class:adp-card--running={adapter.running} role="listitem">
            <div class="adp-header">
              <div class="adp-status-dot" class:adp-status-dot--running={adapter.running} class:adp-status-dot--installed={adapter.installed && !adapter.running} title={adapter.running ? 'Running' : adapter.installed ? 'Installed' : 'Not installed'}></div>
              <span class="adp-name">{adapter.name}</span>
              {#if adapter.version}
                <span class="adp-version">v{adapter.version}</span>
              {/if}
            </div>

            {#if adapter.path}
              <div class="adp-path">{adapter.path}</div>
            {/if}

            <div class="adp-status-text">
              {#if adapter.running}
                <span class="adp-badge adp-badge--running">Connected</span>
              {:else if adapter.installed}
                <span class="adp-badge adp-badge--installed">Installed</span>
              {:else}
                <span class="adp-badge adp-badge--missing">Not installed</span>
              {/if}
            </div>

            <div class="adp-actions">
              {#if !adapter.installed}
                {#if installingId === adapter.id}
                  <button class="adp-btn adp-btn--primary" disabled>
                    <div class="int-spinner int-spinner--sm"></div>
                    Installing...
                  </button>
                {:else if adapter.installHint === 'Already installed' || adapter.installHint === 'No installation needed'}
                  <span class="adp-hint">Built-in</span>
                {:else}
                  <button class="adp-btn adp-btn--primary" onclick={() => handleInstall(adapter.id)}>
                    Install
                  </button>
                  <span class="adp-hint">{adapter.installHint}</span>
                {/if}
              {:else if !adapter.running}
                <button class="adp-btn adp-btn--secondary" onclick={() => handleHealthCheck(adapter.id)}>
                  Check Connection
                </button>
              {:else}
                <span class="adp-hint adp-hint--connected">Ready to use</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if providerSlug}
        <div class="int-provider-status">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3l2 1.5"/></svg>
          <span>LLM Provider: <strong>{providerSlug}</strong> (configured in onboarding)</span>
        </div>
      {/if}
    {/if}

  {:else}
    <!-- Services / Generic Integrations -->
    {#if integrationsStore.loading && integrationsStore.integrations.length === 0}
      <div class="int-loading" role="status">
        <div class="int-spinner"></div>
        <span>Loading integrations...</span>
      </div>
    {:else if integrationsStore.integrations.length === 0}
      <div class="int-empty" role="status">
        <p>No service integrations configured yet.</p>
      </div>
    {:else}
      <div class="int-grid" role="list">
        {#each integrationsStore.integrations as integration (integration.id)}
          <div class="int-card" role="listitem">
            {#if integration.icon_url}
              <img class="int-icon" src={integration.icon_url} alt="{integration.name} icon" />
            {/if}
            <div class="int-info">
              <div class="int-name">{integration.name}</div>
              <div class="int-provider">{integration.provider}</div>
            </div>
            <span class="int-status int-status--{integration.status}">{integration.status}</span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</PageShell>

<style>
  /* ─── Tabs ─────────────────────────────────────────────────────────────── */
  .int-tabs {
    display: flex; gap: 2px; padding: 0 24px;
    border-bottom: 1px solid var(--dbd, rgba(255,255,255,0.08));
    margin-bottom: 16px;
  }
  .int-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px; border: none; background: none;
    color: var(--dt3, #777); font-size: 13px; font-weight: 500;
    cursor: pointer; border-bottom: 2px solid transparent;
    transition: color 150ms, border-color 150ms;
  }
  .int-tab:hover { color: var(--dt2, #aaa); }
  .int-tab--active {
    color: var(--dt, #fff);
    border-bottom-color: #3b82f6;
  }
  .int-tab-count {
    font-size: 11px; padding: 1px 6px; border-radius: 10px;
    background: var(--dbg3, rgba(255,255,255,0.06)); color: var(--dt3, #777);
  }

  /* ─── Section Header ───────────────────────────────────────────────────── */
  .int-section-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px 12px; gap: 12px;
  }
  .int-section-desc { font-size: 13px; color: var(--dt3, #777); margin: 0; }
  .int-refresh {
    display: flex; align-items: center; gap: 4px;
    padding: 5px 10px; border-radius: 6px; border: 1px solid var(--dbd, rgba(255,255,255,0.08));
    background: transparent; color: var(--dt3, #777); font-size: 12px;
    cursor: pointer; transition: all 150ms;
  }
  .int-refresh:hover { background: var(--dbg2, rgba(255,255,255,0.04)); color: var(--dt2, #aaa); }

  /* ─── Toast ────────────────────────────────────────────────────────────── */
  .int-toast {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 16px; margin: 0 24px 12px; border-radius: 8px;
    background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 12px; color: var(--dt2, #aaa);
  }
  .int-toast button { background: none; border: none; color: inherit; cursor: pointer; padding: 2px; }

  /* ─── Adapter Grid ─────────────────────────────────────────────────────── */
  .adp-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px; padding: 0 24px 24px;
  }
  .adp-card {
    padding: 16px; border-radius: 10px;
    background: var(--dbg2, #141414); border: 1px solid var(--dbd, rgba(255,255,255,0.06));
    transition: border-color 200ms;
  }
  .adp-card--running { border-color: rgba(59, 130, 246, 0.25); }
  .adp-card--installed { border-color: rgba(59, 130, 246, 0.2); }

  .adp-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .adp-status-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    background: var(--dt4, #555);
  }
  .adp-status-dot--running { background: #4ade80; box-shadow: 0 0 6px rgba(74, 222, 128, 0.4); }
  .adp-status-dot--installed { background: #3b82f6; }
  .adp-name { font-size: 14px; font-weight: 600; color: var(--dt, #fff); }
  .adp-version { font-size: 11px; color: var(--dt3, #777); margin-left: auto; }
  .adp-path { font-size: 11px; color: var(--dt4, #555); font-family: monospace; margin-bottom: 8px; }

  .adp-status-text { margin-bottom: 10px; }
  .adp-badge {
    font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500;
  }
  .adp-badge--running { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); }
  .adp-badge--installed { background: rgba(59, 130, 246, 0.12); color: #93c5fd; }
  .adp-badge--missing { background: transparent; color: rgba(255, 255, 255, 0.35); }

  .adp-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .adp-btn {
    padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 500;
    cursor: pointer; border: none; transition: all 150ms;
    display: inline-flex; align-items: center; gap: 4px;
    position: relative; overflow: hidden;
  }
  .adp-btn--primary {
    background: linear-gradient(180deg, #1a1a1a 0%, #000000 100%);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.1) inset, 0 4px 16px 0 rgba(0, 0, 0, 0.3);
  }
  .adp-btn--primary::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
    border-radius: 9999px 9999px 0 0;
    pointer-events: none;
  }
  .adp-btn--primary:hover {
    transform: translateY(-1px);
    background: linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%);
  }
  .adp-btn--primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .adp-btn--secondary {
    background: transparent; color: var(--dt2, #aaa);
    border: 1px solid var(--dbd, rgba(255,255,255,0.1));
  }
  .adp-btn--secondary:hover { background: var(--dbg3, rgba(255,255,255,0.04)); }
  .adp-hint { font-size: 11px; color: var(--dt4, #555); font-family: monospace; }
  .adp-hint--connected { color: rgba(255, 255, 255, 0.5); font-family: inherit; }

  /* ─── Provider Status ──────────────────────────────────────────────────── */
  .int-provider-status {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; margin: 0 24px 24px; border-radius: 8px;
    background: var(--dbg2, #141414); border: 1px solid var(--dbd, rgba(255,255,255,0.06));
    font-size: 12px; color: var(--dt3, #777);
  }
  .int-provider-status strong { color: var(--dt, #fff); }

  /* ─── Shared ───────────────────────────────────────────────────────────── */
  .int-loading, .int-empty, .int-error {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 200px;
    color: var(--dt3, #777); font-size: 13px;
  }
  .int-spinner {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid var(--dbd, rgba(255,255,255,0.1));
    border-top-color: var(--dt2, #aaa);
    animation: spin 0.8s linear infinite;
  }
  .int-spinner--sm { width: 14px; height: 14px; border-width: 1.5px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .int-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px; padding: 0 24px 24px;
  }
  .int-card {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 16px; border-radius: 10px;
    background: var(--dbg2, #141414); border: 1px solid var(--dbd, rgba(255,255,255,0.06));
  }
  .int-icon { width: 32px; height: 32px; border-radius: 6px; object-fit: contain; flex-shrink: 0; }
  .int-info { flex: 1; min-width: 0; }
  .int-name { font-size: 14px; font-weight: 500; color: var(--dt, #fff); margin-bottom: 2px; }
  .int-provider { font-size: 12px; color: var(--dt3, #777); }
  .int-status { font-size: 11px; padding: 2px 8px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; }
  .int-status--connected { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); }
  .int-status--disconnected { background: var(--dbg3, rgba(255,255,255,0.04)); color: var(--dt3, #777); }
  .int-status--error { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }

  /* ─── OSA Connected Banner ──────────────────────────────────────────────── */
  .osa-connected {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; margin: 0 24px 16px; border-radius: 10px;
    background: var(--dbg2, #141414);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .osa-connected-left { display: flex; align-items: center; gap: 8px; }
  .osa-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    background: var(--dt4, #555);
  }
  .osa-dot--live {
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.5);
    animation: osa-pulse 2s ease-in-out infinite;
  }
  @keyframes osa-pulse {
    0%, 100% { box-shadow: 0 0 6px rgba(74, 222, 128, 0.5); }
    50% { box-shadow: 0 0 12px rgba(74, 222, 128, 0.8); }
  }
  .osa-label { font-size: 13px; color: var(--dt, #fff); font-weight: 600; }
  .osa-ver { font-size: 12px; color: var(--dt3, #777); }
  .osa-port { font-size: 11px; color: var(--dt4, #555); font-family: monospace; }
  .osa-badge-running {
    font-size: 11px; padding: 2px 10px; border-radius: 9999px; font-weight: 500;
    background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* ─── OSA Setup Card ────────────────────────────────────────────────────── */
  .osa-setup {
    margin: 0 24px 16px; padding: 20px; border-radius: 12px;
    background: var(--dbg2, #141414);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
  }
  .osa-setup-top { margin-bottom: 16px; }
  .osa-setup-title { font-size: 15px; color: var(--dt, #fff); display: block; margin-bottom: 4px; }
  .osa-setup-desc { font-size: 13px; color: var(--dt3, #777); margin: 0; }
  .osa-setup-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .osa-hint { font-size: 12px; color: var(--dt4, #555); margin: 0; }
  .osa-hint code {
    font-size: 11px; padding: 2px 6px; border-radius: 4px;
    background: var(--dbg3, rgba(255,255,255,0.06)); color: var(--dt2, #aaa);
  }

  /* ─── OSA Setup Steps ───────────────────────────────────────────────────── */
  .osa-steps { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .osa-step {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--dt3, #777);
  }
  .osa-step-icon { font-size: 13px; width: 16px; text-align: center; flex-shrink: 0; }
  .osa-step--ok .osa-step-icon { color: #4ade80; }
  .osa-step--fail .osa-step-icon { color: #f87171; }
  .osa-step-label {
    font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;
    width: 48px; flex-shrink: 0; color: var(--dt4, #555);
  }
  .osa-step-msg { color: var(--dt2, #aaa); }
</style>
