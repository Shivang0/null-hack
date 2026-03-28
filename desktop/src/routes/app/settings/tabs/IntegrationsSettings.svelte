<!-- src/routes/app/settings/tabs/IntegrationsSettings.svelte -->
<script lang="ts">
  const INTEGRATIONS = [
    { name: 'GitHub',   desc: 'Push commits, open PRs, manage issues.',        status: 'disconnected', icon: '⬡' },
    { name: 'Linear',   desc: 'Sync issues and projects bidirectionally.',      status: 'disconnected', icon: '◈' },
    { name: 'Slack',    desc: 'Send notifications and receive commands.',       status: 'disconnected', icon: '◎' },
    { name: 'Notion',   desc: 'Read and write documents and databases.',        status: 'disconnected', icon: '⬢' },
    { name: 'Jira',     desc: 'Sync issues from Atlassian Jira projects.',     status: 'disconnected', icon: '◇' },
    { name: 'Datadog',  desc: 'Ingest metrics and alert events.',              status: 'disconnected', icon: '⬡' },
  ] as const;
</script>

<section class="stg-section">
  <h2 class="stg-section-title">Integrations</h2>
  <p class="stg-section-desc">Connect external services to extend agent capabilities.</p>

  <div class="stg-integration-list">
    {#each INTEGRATIONS as int (int.name)}
      <div class="stg-int-card">
        <div class="stg-int-icon" aria-hidden="true">{int.icon}</div>
        <div class="stg-int-body">
          <span class="stg-int-name">{int.name}</span>
          <span class="stg-int-desc">{int.desc}</span>
        </div>
        <div class="stg-int-status">
          <span class="stg-int-dot stg-int-dot--{int.status}"></span>
          <span class="stg-int-label">{int.status}</span>
        </div>
        <button class="stg-int-btn" aria-label="Connect {int.name}">Connect</button>
      </div>
    {/each}
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

  .stg-section-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0 0 16px;
  }

  .stg-integration-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  .stg-int-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    transition: border-color var(--transition-fast);
  }

  .stg-int-card:hover { border-color: var(--border-hover); }

  .stg-int-icon {
    font-size: 18px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  .stg-int-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stg-int-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .stg-int-desc {
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .stg-int-status {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .stg-int-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .stg-int-dot--connected    { background: var(--accent-success); }
  .stg-int-dot--disconnected { background: var(--text-muted); }
  .stg-int-dot--error        { background: var(--accent-error); }

  .stg-int-label {
    font-size: 12px;
    color: var(--text-tertiary);
    text-transform: capitalize;
  }

  .stg-int-btn {
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--accent-primary);
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: var(--radius-sm);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast);
  }

  .stg-int-btn:hover { background: rgba(59, 130, 246, 0.15); }
</style>
