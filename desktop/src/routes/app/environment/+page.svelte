<!-- src/routes/app/environment/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { environmentStore } from '$lib/stores/environment.svelte';

  // Expanded card tracking
  let expandedAppId = $state<string | null>(null);

  onMount(() => {
    void environmentStore.fetchAll();
  });

  function toggleExpand(id: string) {
    expandedAppId = expandedAppId === id ? null : id;
  }

  const categoryEmoji: Record<string, string> = {
    development: '\u{1F4BB}',
    database: '\u{1F5C4}',
    automation: '\u{2699}',
    browser: '\u{1F310}',
    design: '\u{1F3A8}',
    communication: '\u{1F4AC}',
    other: '\u{1F4E6}',
  };

  const agentStatusColors: Record<string, string> = {
    running: '#4ade80',
    stopped: '#6b7280',
    building: '#f59e0b',
    error: '#f87171',
  };

  function cpuBarWidth(pct: number): string {
    return `${Math.min(100, Math.max(0, pct)).toFixed(1)}%`;
  }

  function memBarWidth(used: number, total: number): string {
    if (!total) return '0%';
    return `${Math.min(100, (used / total) * 100).toFixed(1)}%`;
  }
</script>

<PageShell
  title="Environment"
  subtitle="{environmentStore.runningCount} apps running · {environmentStore.agentAppCount} agent apps"
>
  {#if environmentStore.loading && environmentStore.apps.length === 0}
    <div class="env-loading" role="status" aria-live="polite">
      <div class="env-spinner"></div>
      <span>Scanning environment...</span>
    </div>
  {:else}

    <!-- ── Section 1: Detected Apps ────────────────────────────────────────── -->
    <section class="env-section" aria-labelledby="env-detected-heading">
      <div class="env-section-header">
        <h2 class="env-section-title" id="env-detected-heading">Detected Apps</h2>
        <span class="env-section-count">{environmentStore.apps.length}</span>
      </div>

      {#if environmentStore.apps.length === 0}
        <p class="env-empty">No apps detected on this machine.</p>
      {:else}
        <div class="env-app-grid" role="list">
          {#each environmentStore.apps as app (app.id)}
            <div
              class="env-app-card"
              class:env-app-card--running={app.status === 'running'}
              class:env-app-card--expanded={expandedAppId === app.id}
              role="listitem"
            >
              <div class="env-app-main">
                <span class="env-app-emoji" aria-hidden="true">{categoryEmoji[app.category] ?? '\u{1F4E6}'}</span>
                <div class="env-app-info">
                  <div class="env-app-name-row">
                    <div
                      class="env-status-dot"
                      class:env-status-dot--running={app.status === 'running'}
                      title={app.status}
                      role="img"
                      aria-label={app.status === 'running' ? 'Running' : 'Stopped'}
                    ></div>
                    <span class="env-app-name">{app.name}</span>
                  </div>
                  <div class="env-app-meta">
                    <code class="env-app-process">{app.process_name}</code>
                    {#if app.port}
                      <span class="env-app-port">:{app.port}</span>
                    {/if}
                    {#if app.pid}
                      <span class="env-app-pid">pid {app.pid}</span>
                    {/if}
                  </div>
                </div>
                <button
                  class="env-expand-btn"
                  onclick={() => toggleExpand(app.id)}
                  aria-expanded={expandedAppId === app.id}
                  aria-controls="env-app-detail-{app.id}"
                  aria-label="Toggle access panel for {app.name}"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="12"
                    height="12"
                    class="env-expand-icon"
                    class:env-expand-icon--open={expandedAppId === app.id}
                    aria-hidden="true"
                  >
                    <path d="M4 6l4 4 4-4"/>
                  </svg>
                </button>
              </div>

              {#if expandedAppId === app.id}
                <div class="env-app-detail" id="env-app-detail-{app.id}" role="region" aria-label="Access panel for {app.name}">
                  <p class="env-access-label">Agent access</p>
                  {#if app.agent_access.length === 0}
                    <p class="env-access-empty">No agents have access.</p>
                  {:else}
                    <ul class="env-access-list" role="list">
                      {#each app.agent_access as agentId (agentId)}
                        <li class="env-access-item">
                          <span class="env-agent-chip">{agentId}</span>
                          <button
                            class="env-revoke-btn"
                            onclick={() => environmentStore.revokeAccess(app.id, agentId)}
                            aria-label="Revoke access for {agentId}"
                          >
                            Revoke
                          </button>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                  <button
                    class="env-grant-btn"
                    onclick={() => environmentStore.grantAccess(app.id, 'agent-1')}
                  >
                    + Grant Access
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- ── Section 2: Agent-Built Apps ────────────────────────────────────── -->
    <section class="env-section" aria-labelledby="env-agentapps-heading">
      <div class="env-section-header">
        <h2 class="env-section-title" id="env-agentapps-heading">Agent-Built Apps</h2>
        <span class="env-section-count">{environmentStore.agentAppCount}</span>
      </div>

      {#if environmentStore.agentApps.length === 0}
        <p class="env-empty">No agent-built apps yet.</p>
      {:else}
        <div class="env-app-grid" role="list">
          {#each environmentStore.agentApps as app (app.id)}
            <div class="env-agentapp-card" role="listitem">
              <div class="env-agentapp-header">
                <span class="env-agentapp-name">{app.name}</span>
                <span
                  class="env-agentapp-status"
                  style="background: {agentStatusColors[app.status] ?? '#6b7280'}22; color: {agentStatusColors[app.status] ?? '#6b7280'};"
                >
                  {app.status}
                </span>
              </div>
              <div class="env-agentapp-meta">
                <span class="env-agentapp-by">Built by <strong>{app.agent_name}</strong></span>
                {#if app.template_source}
                  <span class="env-agentapp-template">from {app.template_source}</span>
                {/if}
              </div>
              {#if app.port || app.directory}
                <div class="env-agentapp-details">
                  {#if app.port}
                    <code class="env-agentapp-port">:{app.port}</code>
                  {/if}
                  {#if app.directory}
                    <code class="env-agentapp-dir">{app.directory}</code>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- ── Section 3: System Resources ───────────────────────────────────── -->
    <section class="env-section" aria-labelledby="env-resources-heading">
      <h2 class="env-section-title" id="env-resources-heading">System Resources</h2>

      {#if environmentStore.resources}
        {@const r = environmentStore.resources}
        <div class="env-resources-row">
          <div class="env-resource-stat">
            <span class="env-resource-label">CPU</span>
            <div class="env-resource-bar-wrap">
              <div class="env-resource-bar">
                <div class="env-resource-fill env-resource-fill--cpu" style="width: {cpuBarWidth(r.cpu_percent)}"></div>
              </div>
            </div>
            <span class="env-resource-value">{r.cpu_percent.toFixed(1)}%</span>
          </div>

          <div class="env-resource-stat">
            <span class="env-resource-label">Memory</span>
            <div class="env-resource-bar-wrap">
              <div class="env-resource-bar">
                <div class="env-resource-fill env-resource-fill--mem" style="width: {memBarWidth(r.memory_used_gb, r.memory_total_gb)}"></div>
              </div>
            </div>
            <span class="env-resource-value">{r.memory_used_gb.toFixed(1)} / {r.memory_total_gb.toFixed(0)} GB</span>
          </div>

          <div class="env-resource-stat env-resource-stat--plain">
            <span class="env-resource-label">Disk Free</span>
            <span class="env-resource-value">{r.disk_free_gb.toFixed(1)} / {r.disk_total_gb.toFixed(0)} GB</span>
          </div>

          <div class="env-resource-stat env-resource-stat--plain">
            <span class="env-resource-label">Network</span>
            <span class="env-resource-value">{r.network_connections} connections</span>
          </div>
        </div>
      {:else}
        <p class="env-empty">Resource data unavailable.</p>
      {/if}
    </section>

    <!-- ── Section 4: Capabilities ────────────────────────────────────────── -->
    <section class="env-section" aria-labelledby="env-capabilities-heading">
      <h2 class="env-section-title" id="env-capabilities-heading">Capabilities</h2>

      {#if environmentStore.capabilities.length === 0}
        <p class="env-empty">No capabilities detected.</p>
      {:else}
        <ul class="env-cap-list" role="list">
          {#each environmentStore.capabilities as cap (cap.id)}
            <li class="env-cap-row" role="listitem">
              <div
                class="env-cap-indicator"
                class:env-cap-indicator--on={cap.available}
                role="img"
                aria-label={cap.available ? 'Available' : 'Unavailable'}
              >
                {#if cap.available}
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="10" height="10" aria-hidden="true"><path d="M3 8l3.5 3.5L13 4"/></svg>
                {:else}
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="10" height="10" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                {/if}
              </div>
              <div class="env-cap-info">
                <span class="env-cap-name">{cap.name}</span>
                <span class="env-cap-details">{cap.details}</span>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

  {/if}
</PageShell>

<style>
  /* ─── Loading ──────────────────────────────────────────────────────────── */
  .env-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 200px;
    color: var(--dt3, #777);
    font-size: 13px;
  }
  .env-spinner {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--dbd, rgba(255, 255, 255, 0.1));
    border-top-color: var(--dt2, #aaa);
    animation: env-spin 0.8s linear infinite;
  }
  @keyframes env-spin {
    to { transform: rotate(360deg); }
  }

  /* ─── Section Layout ───────────────────────────────────────────────────── */
  .env-section {
    margin-bottom: 32px;
  }
  .env-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .env-section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--dt2, #aaa);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
  }
  .env-section-count {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 10px;
    background: var(--dbg3, rgba(255, 255, 255, 0.06));
    color: var(--dt3, #777);
  }
  .env-empty {
    font-size: 13px;
    color: var(--dt4, #555);
    margin: 0;
    padding: 12px 0;
  }

  /* ─── Detected App Grid ────────────────────────────────────────────────── */
  .env-app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
  }
  .env-app-card {
    border-radius: 10px;
    background: var(--dbg2, #141414);
    border: 1px solid var(--dbd, rgba(255, 255, 255, 0.06));
    overflow: hidden;
    transition: border-color 150ms;
  }
  .env-app-card--running {
    border-color: rgba(255, 255, 255, 0.1);
  }
  .env-app-card--expanded {
    border-color: rgba(59, 130, 246, 0.3);
  }
  .env-app-main {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
  }
  .env-app-emoji {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
  }
  .env-app-info {
    flex: 1;
    min-width: 0;
  }
  .env-app-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
  }
  .env-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--dt4, #555);
  }
  .env-status-dot--running {
    background: #4ade80;
    box-shadow: 0 0 5px rgba(74, 222, 128, 0.4);
  }
  .env-app-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--dt, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .env-app-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .env-app-process {
    font-size: 11px;
    color: var(--dt4, #555);
    font-family: monospace;
  }
  .env-app-port,
  .env-app-pid {
    font-size: 11px;
    color: var(--dt4, #555);
    font-family: monospace;
  }

  /* ─── Expand Button ────────────────────────────────────────────────────── */
  .env-expand-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--dt4, #555);
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 150ms, background 150ms;
  }
  .env-expand-btn:hover {
    color: var(--dt2, #aaa);
    background: var(--dbg3, rgba(255, 255, 255, 0.06));
  }
  .env-expand-icon {
    transition: transform 200ms;
  }
  .env-expand-icon--open {
    transform: rotate(180deg);
  }

  /* ─── App Detail Panel ─────────────────────────────────────────────────── */
  .env-app-detail {
    padding: 12px 14px 14px;
    border-top: 1px solid var(--dbd, rgba(255, 255, 255, 0.06));
    background: var(--dbg3, rgba(255, 255, 255, 0.02));
  }
  .env-access-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--dt4, #555);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 8px;
  }
  .env-access-empty {
    font-size: 12px;
    color: var(--dt4, #555);
    margin: 0 0 10px;
  }
  .env-access-list {
    list-style: none;
    padding: 0;
    margin: 0 0 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .env-access-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .env-agent-chip {
    font-size: 11px;
    font-family: monospace;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--dbg2, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--dbd, rgba(255, 255, 255, 0.08));
    color: var(--dt2, #aaa);
  }
  .env-revoke-btn {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid rgba(239, 68, 68, 0.25);
    background: transparent;
    color: #f87171;
    cursor: pointer;
    transition: background 150ms;
  }
  .env-revoke-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }
  .env-grant-btn {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--dbd, rgba(255, 255, 255, 0.08));
    background: transparent;
    color: var(--dt3, #777);
    cursor: pointer;
    transition: all 150ms;
  }
  .env-grant-btn:hover {
    background: var(--dbg2, rgba(255, 255, 255, 0.04));
    color: var(--dt, #fff);
  }

  /* ─── Agent-Built App Cards ────────────────────────────────────────────── */
  .env-agentapp-card {
    padding: 14px;
    border-radius: 10px;
    background: var(--dbg2, #141414);
    border: 1px solid var(--dbd, rgba(255, 255, 255, 0.06));
  }
  .env-agentapp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    gap: 8px;
  }
  .env-agentapp-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--dt, #fff);
  }
  .env-agentapp-status {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 7px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .env-agentapp-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .env-agentapp-by {
    font-size: 12px;
    color: var(--dt3, #777);
  }
  .env-agentapp-by strong {
    color: var(--dt2, #aaa);
  }
  .env-agentapp-template {
    font-size: 11px;
    color: var(--dt4, #555);
  }
  .env-agentapp-details {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .env-agentapp-port,
  .env-agentapp-dir {
    font-size: 11px;
    color: var(--dt4, #555);
    font-family: monospace;
  }

  /* ─── System Resources ─────────────────────────────────────────────────── */
  .env-resources-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }
  .env-resource-stat {
    padding: 14px;
    border-radius: 10px;
    background: var(--dbg2, #141414);
    border: 1px solid var(--dbd, rgba(255, 255, 255, 0.06));
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .env-resource-stat--plain {
    justify-content: center;
  }
  .env-resource-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--dt4, #555);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .env-resource-bar-wrap {
    flex: 1;
  }
  .env-resource-bar {
    height: 4px;
    border-radius: 2px;
    background: var(--dbg3, rgba(255, 255, 255, 0.06));
    overflow: hidden;
  }
  .env-resource-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 400ms ease;
  }
  .env-resource-fill--cpu {
    background: #3b82f6;
  }
  .env-resource-fill--mem {
    background: #8b5cf6;
  }
  .env-resource-value {
    font-size: 12px;
    font-weight: 500;
    color: var(--dt, #fff);
    font-variant-numeric: tabular-nums;
  }

  /* ─── Capabilities ─────────────────────────────────────────────────────── */
  .env-cap-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .env-cap-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    background: var(--dbg2, #141414);
    border: 1px solid var(--dbd, rgba(255, 255, 255, 0.06));
  }
  .env-cap-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(107, 114, 128, 0.15);
    color: #6b7280;
  }
  .env-cap-indicator--on {
    background: rgba(74, 222, 128, 0.15);
    color: #4ade80;
  }
  .env-cap-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .env-cap-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--dt, #fff);
  }
  .env-cap-details {
    font-size: 12px;
    color: var(--dt3, #777);
  }
</style>
