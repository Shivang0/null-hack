<!-- src/routes/app/organizations/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { organizationsStore } from '$lib/stores/organizations.svelte';

  onMount(() => {
    void organizationsStore.fetchOrganizations();
  });

  // Create form state
  let showForm = $state(false);
  let formName = $state('');
  let formDescription = $state('');
  let creating = $state(false);
  let formError = $state<string | null>(null);

  async function handleCreate() {
    if (!formName.trim()) return;
    creating = true;
    formError = null;
    const created = await organizationsStore.createOrganization({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    });
    creating = false;
    if (created) {
      resetForm();
    } else {
      formError = organizationsStore.error;
    }
  }

  function resetForm() {
    showForm = false;
    formName = '';
    formDescription = '';
    formError = null;
  }

  function formatBudget(cents: number | null): string {
    if (cents === null || cents === 0) return '—';
    const dollars = cents / 100;
    if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k/mo`;
    return `$${dollars.toFixed(0)}/mo`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function handleCardClick(id: string) {
    void organizationsStore.selectOrganization(id);
  }
</script>

<PageShell
  title="Organizations"
  badge={organizationsStore.totalCount > 0 ? organizationsStore.totalCount : undefined}
>
  {#snippet actions()}
    <button
      class="org-create-btn"
      onclick={() => (showForm = true)}
      type="button"
      aria-label="Create organization"
    >
      + New Organization
    </button>
  {/snippet}

  {#if organizationsStore.loading && organizationsStore.organizations.length === 0}
    <div class="org-loading" role="status" aria-live="polite">
      <div class="org-spinner" aria-hidden="true"></div>
      <span>Loading organizations…</span>
    </div>
  {:else if organizationsStore.error && organizationsStore.organizations.length === 0}
    <div class="org-error" role="alert">
      <p>Failed to load organizations: {organizationsStore.error}</p>
      <button onclick={() => void organizationsStore.fetchOrganizations()}>Retry</button>
    </div>
  {:else if organizationsStore.organizations.length === 0}
    <div class="org-empty" role="status">
      <p>No organizations yet.</p>
    </div>
  {:else}
    <div class="org-grid" role="list" aria-label="Organizations">
      {#each organizationsStore.organizations as org (org.id)}
        {@const isCurrent = organizationsStore.current?.id === org.id}
        <button
          class="org-card"
          class:org-card--current={isCurrent}
          role="listitem"
          onclick={() => handleCardClick(org.id)}
          aria-pressed={isCurrent}
          aria-label="Select organization {org.name}"
          type="button"
        >
          <!-- Header -->
          <div class="org-card-header">
            <div class="org-avatar" aria-hidden="true">
              {#if org.avatar_url}
                <img src={org.avatar_url} alt="" class="org-avatar-img" />
              {:else}
                <span class="org-avatar-initials">{org.name.slice(0, 2).toUpperCase()}</span>
              {/if}
            </div>
            <div class="org-header-text">
              <div class="org-name">
                {org.name}
                {#if isCurrent}
                  <span class="org-current-badge">Current</span>
                {/if}
              </div>
              <div class="org-slug">@{org.slug}</div>
            </div>
            <span class="org-plan org-plan--{org.plan}">{org.plan}</span>
          </div>

          <!-- Description -->
          {#if org.description}
            <p class="org-desc">{org.description}</p>
          {/if}

          <!-- Mission -->
          {#if org.mission}
            <p class="org-mission">{org.mission}</p>
          {/if}

          <!-- Footer stats -->
          <div class="org-footer">
            <div class="org-stat">
              <svg class="org-stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>{org.member_count} {org.member_count === 1 ? 'member' : 'members'}</span>
            </div>
            <div class="org-stat">
              <svg class="org-stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{org.agent_count} {org.agent_count === 1 ? 'agent' : 'agents'}</span>
            </div>
            <div class="org-stat">
              <svg class="org-stat-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              <span>{formatBudget(org.budget_monthly_cents)}</span>
            </div>
            <time class="org-created" datetime={org.created_at}>
              Since {formatDate(org.created_at)}
            </time>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</PageShell>

<!-- Create organization dialog -->
{#if showForm}
  <div
    class="org-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Create organization"
    onclick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
  >
    <div class="org-dialog">
      <h2 class="org-dialog-title">New Organization</h2>

      <div class="org-field">
        <label class="org-label" for="org-name-input">Name</label>
        <input
          id="org-name-input"
          class="org-input"
          type="text"
          placeholder="Acme Corp"
          bind:value={formName}
          autofocus
        />
      </div>

      <div class="org-field">
        <label class="org-label" for="org-desc-input">Description <span class="org-label-hint">(optional)</span></label>
        <textarea
          id="org-desc-input"
          class="org-textarea"
          rows={3}
          placeholder="What does this organization do?"
          bind:value={formDescription}
        ></textarea>
      </div>

      {#if formError}
        <p class="org-form-error" role="alert">{formError}</p>
      {/if}

      <div class="org-dialog-actions">
        <button class="org-btn-ghost" onclick={resetForm} disabled={creating}>Cancel</button>
        <button
          class="org-btn-primary"
          onclick={handleCreate}
          disabled={creating || !formName.trim()}
        >
          {creating ? 'Creating…' : 'Create Organization'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .org-create-btn {
    height: 28px; padding: 0 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
    background: #6366f1; border: none; color: white; cursor: pointer;
    transition: background 120ms ease; white-space: nowrap;
  }
  .org-create-btn:hover { background: #4f46e5; }

  /* States */
  .org-loading, .org-empty, .org-error {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 200px;
    color: var(--dt3); font-size: 13px;
  }
  .org-spinner {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid var(--dbd); border-top-color: var(--dt2);
    animation: org-spin 0.8s linear infinite;
  }
  @keyframes org-spin { to { transform: rotate(360deg); } }

  /* Grid */
  .org-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 12px; padding: 24px;
  }

  /* Card — button reset + card styles */
  .org-card {
    all: unset; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px;
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 10px;
    padding: 16px; cursor: pointer; text-align: left;
    transition: border-color 150ms ease, background 150ms ease;
  }
  .org-card:hover { border-color: var(--dbd2); background: var(--dbg3); }
  .org-card--current {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 1px rgba(99,102,241,0.25);
  }
  .org-card--current:hover { border-color: rgba(99,102,241,0.7); }

  /* Card header */
  .org-card-header {
    display: flex; align-items: center; gap: 10px;
  }
  .org-avatar {
    width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
    background: rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .org-avatar-img { width: 100%; height: 100%; object-fit: cover; }
  .org-avatar-initials { font-size: 13px; font-weight: 700; color: #a5b4fc; }
  .org-header-text { flex: 1; min-width: 0; }
  .org-name {
    font-size: 14px; font-weight: 600; color: var(--dt);
    display: flex; align-items: center; gap: 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .org-current-badge {
    font-size: 10px; padding: 1px 6px; border-radius: 4px;
    background: rgba(99,102,241,0.15); color: #a5b4fc; font-weight: 500; flex-shrink: 0;
  }
  .org-slug { font-size: 11px; color: var(--dt4); margin-top: 1px; }

  /* Plan badges */
  .org-plan { font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 500; flex-shrink: 0; }
  .org-plan--free       { background: var(--dbg3); color: var(--dt4); }
  .org-plan--pro        { background: rgba(99,102,241,0.12); color: #a5b4fc; }
  .org-plan--enterprise { background: rgba(251,191,36,0.12); color: #fbbf24; }

  /* Text blocks */
  .org-desc {
    font-size: 12px; color: var(--dt3); margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .org-mission {
    font-size: 11px; color: var(--dt4); margin: 0; font-style: italic;
    display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
  }

  /* Footer */
  .org-footer {
    display: flex; align-items: center; gap: 12px; margin-top: auto;
    border-top: 1px solid var(--dbd); padding-top: 10px;
  }
  .org-stat {
    display: flex; align-items: center; gap: 4px;
    font-size: 11px; color: var(--dt3);
  }
  .org-stat-icon { color: var(--dt4); }
  .org-created { font-size: 11px; color: var(--dt4); margin-left: auto; }

  /* Dialog */
  .org-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  .org-dialog {
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 12px;
    padding: 24px; width: 440px; max-width: calc(100vw - 40px);
    display: flex; flex-direction: column; gap: 16px;
  }
  .org-dialog-title { font-size: 16px; font-weight: 600; color: var(--dt); margin: 0; }
  .org-field { display: flex; flex-direction: column; gap: 6px; }
  .org-label { font-size: 12px; font-weight: 500; color: var(--dt2); }
  .org-label-hint { font-weight: 400; color: var(--dt4); }
  .org-input {
    height: 34px; padding: 0 10px; border-radius: 6px; font-size: 13px;
    background: var(--dbg3); border: 1px solid var(--dbd); color: var(--dt);
    width: 100%; box-sizing: border-box;
  }
  .org-input:focus { outline: none; border-color: #6366f1; }
  .org-textarea {
    padding: 8px 10px; border-radius: 6px; font-size: 13px;
    background: var(--dbg3); border: 1px solid var(--dbd); color: var(--dt);
    width: 100%; box-sizing: border-box; resize: vertical; line-height: 1.5;
  }
  .org-textarea:focus { outline: none; border-color: #6366f1; }
  .org-form-error { font-size: 12px; color: #fca5a5; margin: 0; }
  .org-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
  .org-btn-ghost, .org-btn-primary {
    padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 120ms ease;
  }
  .org-btn-ghost { background: transparent; border: 1px solid var(--dbd); color: var(--dt3); }
  .org-btn-ghost:hover:not(:disabled) { background: var(--dbg3); color: var(--dt2); }
  .org-btn-primary { background: #6366f1; border: none; color: #fff; }
  .org-btn-primary:hover:not(:disabled) { background: #4f46e5; }
  .org-btn-ghost:disabled, .org-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
