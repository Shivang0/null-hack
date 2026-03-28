<!-- src/routes/app/access/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { accessStore } from '$lib/stores/access.svelte';
  import type { UserRole } from '$api/types';

  onMount(() => {
    void accessStore.fetchAssignments();
  });

  const ROLE_FILTERS: { value: UserRole | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' },
  ];

  // Assign form state
  let showForm = $state(false);
  let formUserId = $state('');
  let formUserName = $state('');
  let formUserEmail = $state('');
  let formRole = $state<UserRole>('member');
  let formEntityType = $state<'global' | 'organization' | 'project'>('global');
  let formEntityId = $state('');
  let assigning = $state(false);
  let formError = $state<string | null>(null);

  // Revoke confirmation
  let confirmRevokeId = $state<string | null>(null);

  async function handleAssign() {
    if (!formUserName.trim()) return;
    assigning = true;
    formError = null;
    const created = await accessStore.assignRole({
      user_id: formUserId.trim() || undefined,
      user_name: formUserName.trim(),
      user_email: formUserEmail.trim() || undefined,
      role: formRole,
      entity_type: formEntityType,
      entity_id: formEntityId.trim() || null,
    });
    assigning = false;
    if (created) {
      resetForm();
    } else {
      formError = accessStore.error;
    }
  }

  function resetForm() {
    showForm = false;
    formUserId = '';
    formUserName = '';
    formUserEmail = '';
    formRole = 'member';
    formEntityType = 'global';
    formEntityId = '';
    formError = null;
  }

  async function handleRevoke(id: string) {
    if (confirmRevokeId !== id) {
      confirmRevokeId = id;
      return;
    }
    confirmRevokeId = null;
    await accessStore.revokeRole(id);
  }

  function roleClass(role: UserRole): string {
    return { admin: 'ac-role--admin', member: 'ac-role--member', viewer: 'ac-role--viewer' }[role];
  }

  function scopeLabel(entityType: string, entityId: string | null): string {
    if (entityType === 'global') return 'Global';
    if (!entityId) return entityType;
    return `${entityType} / ${entityId}`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
</script>

<PageShell
  title="Access Control"
  subtitle="Role-based access assignments"
  badge={accessStore.totalCount > 0 ? accessStore.totalCount : undefined}
>
  {#snippet actions()}
    <div class="ac-filter-group" role="group" aria-label="Filter by role">
      {#each ROLE_FILTERS as opt (opt.value)}
        <button
          class="ac-filter-btn"
          class:ac-filter-btn--active={accessStore.filterRole === opt.value}
          onclick={() => accessStore.setRoleFilter(opt.value)}
          aria-pressed={accessStore.filterRole === opt.value}
          type="button"
        >
          {opt.label}
          {#if opt.value === 'admin' && accessStore.adminCount > 0}
            <span class="ac-filter-count">{accessStore.adminCount}</span>
          {:else if opt.value === 'member' && accessStore.memberCount > 0}
            <span class="ac-filter-count">{accessStore.memberCount}</span>
          {:else if opt.value === 'viewer' && accessStore.viewerCount > 0}
            <span class="ac-filter-count">{accessStore.viewerCount}</span>
          {/if}
        </button>
      {/each}
    </div>
    <button
      class="ac-assign-btn"
      onclick={() => showForm = true}
      type="button"
      aria-label="Assign role"
    >
      + Assign Role
    </button>
  {/snippet}

  {#if accessStore.loading && accessStore.assignments.length === 0}
    <div class="ac-loading" role="status" aria-live="polite">
      <div class="ac-spinner" aria-hidden="true"></div>
      <span>Loading access assignments…</span>
    </div>
  {:else if accessStore.error && accessStore.assignments.length === 0}
    <div class="ac-empty" role="alert">
      <p>Failed to load assignments: {accessStore.error}</p>
      <button class="ac-retry-btn" onclick={() => void accessStore.fetchAssignments()}>Retry</button>
    </div>
  {:else if accessStore.filteredAssignments.length === 0}
    <div class="ac-empty" role="status">
      <p>{accessStore.filterRole !== 'all'
        ? `No ${accessStore.filterRole} assignments.`
        : 'No role assignments yet.'}</p>
    </div>
  {:else}
    <div class="ac-list" role="list" aria-label="Role assignments">
      {#each accessStore.filteredAssignments as assignment (assignment.id)}
        <div class="ac-row" role="listitem">
          <div class="ac-avatar" aria-hidden="true">
            {assignment.user_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
          </div>
          <div class="ac-info">
            <div class="ac-name">{assignment.user_name}</div>
            <div class="ac-email">{assignment.user_email}</div>
          </div>
          <span class="ac-role {roleClass(assignment.role)}" aria-label="Role: {assignment.role}">
            {assignment.role}
          </span>
          <div class="ac-scope">
            <span class="ac-scope-tag">
              {scopeLabel(assignment.entity_type, assignment.entity_id)}
            </span>
          </div>
          <div class="ac-dates">
            <div class="ac-granted-label">Granted</div>
            <time class="ac-granted-date" datetime={assignment.created_at}>
              {formatDate(assignment.created_at)}
            </time>
          </div>
          <button
            class="ac-revoke-btn"
            class:ac-revoke-btn--confirm={confirmRevokeId === assignment.id}
            onclick={() => void handleRevoke(assignment.id)}
            aria-label={confirmRevokeId === assignment.id
              ? 'Confirm revoke'
              : `Revoke role for ${assignment.user_name}`}
            type="button"
          >
            {confirmRevokeId === assignment.id ? 'Confirm?' : 'Revoke'}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</PageShell>

<!-- Assign Role dialog -->
{#if showForm}
  <div
    class="ac-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Assign role"
    onclick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
  >
    <div class="ac-dialog">
      <h2 class="ac-dialog-title">Assign Role</h2>

      <div class="ac-field">
        <label class="ac-label" for="ac-username-input">Name</label>
        <input
          id="ac-username-input"
          class="ac-input"
          type="text"
          placeholder="User or agent name"
          bind:value={formUserName}
          autofocus
        />
      </div>

      <div class="ac-field">
        <label class="ac-label" for="ac-email-input">
          Email <span class="ac-label-hint">(optional)</span>
        </label>
        <input
          id="ac-email-input"
          class="ac-input"
          type="email"
          placeholder="user@example.com"
          bind:value={formUserEmail}
        />
      </div>

      <div class="ac-field">
        <label class="ac-label" for="ac-role-select">Role</label>
        <select id="ac-role-select" class="ac-input ac-select" bind:value={formRole}>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <div class="ac-field">
        <label class="ac-label" for="ac-scope-select">Scope</label>
        <select id="ac-scope-select" class="ac-input ac-select" bind:value={formEntityType}>
          <option value="global">Global</option>
          <option value="organization">Organization</option>
          <option value="project">Project</option>
        </select>
      </div>

      {#if formEntityType !== 'global'}
        <div class="ac-field">
          <label class="ac-label" for="ac-entityid-input">
            {formEntityType === 'organization' ? 'Organization' : 'Project'} ID
          </label>
          <input
            id="ac-entityid-input"
            class="ac-input"
            type="text"
            placeholder="ID of the {formEntityType}"
            bind:value={formEntityId}
          />
        </div>
      {/if}

      {#if formError}
        <p class="ac-form-error" role="alert">{formError}</p>
      {/if}

      <div class="ac-dialog-actions">
        <button class="ac-btn-ghost" onclick={resetForm} disabled={assigning} type="button">Cancel</button>
        <button
          class="ac-btn-primary"
          onclick={handleAssign}
          disabled={assigning || !formUserName.trim()}
          type="button"
        >
          {assigning ? 'Assigning…' : 'Assign Role'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .ac-filter-group {
    display: flex; align-items: center; gap: 2px;
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 8px; padding: 2px;
  }
  .ac-filter-btn {
    background: none; border: none; border-radius: 6px; color: var(--dt3);
    font-size: 12px; font-weight: 500; padding: 3px 10px; cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    transition: background 120ms ease, color 120ms ease;
  }
  .ac-filter-btn:hover { color: var(--dt2); background: rgba(255,255,255,0.05); }
  .ac-filter-btn--active { background: var(--dbg3); color: var(--dt); border: 1px solid var(--dbd); }
  .ac-filter-count {
    font-size: 10px; padding: 0 4px; border-radius: 3px;
    background: var(--dbg3); color: var(--dt4);
  }
  .ac-filter-btn--active .ac-filter-count { background: rgba(255,255,255,0.08); color: var(--dt3); }

  .ac-assign-btn {
    height: 28px; padding: 0 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
    background: #6366f1; border: none; color: white; cursor: pointer; transition: background 120ms ease;
  }
  .ac-assign-btn:hover { background: #4f46e5; }

  .ac-loading, .ac-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px; height: 240px;
    color: var(--dt3); font-size: 13px;
  }
  .ac-spinner {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid var(--dbd); border-top-color: var(--dt2);
    animation: ac-spin 0.8s linear infinite;
  }
  @keyframes ac-spin { to { transform: rotate(360deg); } }
  .ac-retry-btn {
    padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer;
    border: 1px solid var(--dbd); background: var(--dbg2); color: var(--dt2);
  }

  .ac-list { display: flex; flex-direction: column; gap: 4px; padding: 24px; }
  .ac-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 16px; border-radius: 8px;
    background: var(--dbg2); border: 1px solid var(--dbd);
    transition: background 120ms ease;
  }
  .ac-row:hover { background: var(--dbg3); }

  .ac-avatar {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    background: color-mix(in srgb, #6366f1 18%, var(--dbg3));
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: #a5b4fc;
  }

  .ac-info { flex: 1; min-width: 0; }
  .ac-name { font-size: 13px; font-weight: 500; color: var(--dt); }
  .ac-email { font-size: 11px; color: var(--dt3); }

  .ac-role {
    font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 4px;
    text-transform: capitalize; flex-shrink: 0;
  }
  .ac-role--admin { background: color-mix(in srgb, #ef4444 15%, transparent); color: #fca5a5; }
  .ac-role--member { background: color-mix(in srgb, #6366f1 15%, transparent); color: #a5b4fc; }
  .ac-role--viewer { background: var(--dbg3); color: var(--dt3); }

  .ac-scope { flex-shrink: 0; }
  .ac-scope-tag {
    font-size: 10px; padding: 2px 7px; border-radius: 4px;
    background: var(--dbg3); border: 1px solid var(--dbd); color: var(--dt4);
    text-transform: capitalize;
  }

  .ac-dates { min-width: 90px; flex-shrink: 0; }
  .ac-granted-label { font-size: 10px; color: var(--dt4); }
  .ac-granted-date { font-size: 11px; color: var(--dt3); }

  .ac-revoke-btn {
    padding: 5px 10px; border-radius: 5px; font-size: 11px; font-weight: 500;
    cursor: pointer; border: 1px solid var(--dbd); background: transparent;
    color: var(--dt3); transition: all 120ms ease; flex-shrink: 0; white-space: nowrap;
  }
  .ac-revoke-btn:hover { border-color: rgba(239,68,68,0.4); color: #fca5a5; background: rgba(239,68,68,0.08); }
  .ac-revoke-btn--confirm { border-color: rgba(239,68,68,0.6); color: #fca5a5; background: rgba(239,68,68,0.12); }

  /* Dialog */
  .ac-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  .ac-dialog {
    background: var(--dbg2); border: 1px solid var(--dbd); border-radius: 12px;
    padding: 24px; width: 440px; max-width: calc(100vw - 40px);
    display: flex; flex-direction: column; gap: 16px;
  }
  .ac-dialog-title { font-size: 16px; font-weight: 600; color: var(--dt); margin: 0; }
  .ac-field { display: flex; flex-direction: column; gap: 6px; }
  .ac-label { font-size: 12px; font-weight: 500; color: var(--dt2); }
  .ac-label-hint { font-weight: 400; color: var(--dt4); }
  .ac-input {
    height: 34px; padding: 0 10px; border-radius: 6px; font-size: 13px;
    background: var(--dbg3); border: 1px solid var(--dbd); color: var(--dt);
    width: 100%; box-sizing: border-box;
  }
  .ac-select { appearance: none; cursor: pointer; }
  .ac-input:focus { outline: none; border-color: #6366f1; }
  .ac-form-error { font-size: 12px; color: #fca5a5; margin: 0; }
  .ac-dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
  .ac-btn-ghost, .ac-btn-primary {
    padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 120ms ease;
  }
  .ac-btn-ghost { background: transparent; border: 1px solid var(--dbd); color: var(--dt3); }
  .ac-btn-ghost:hover:not(:disabled) { background: var(--dbg3); color: var(--dt2); }
  .ac-btn-primary { background: #6366f1; border: none; color: #fff; }
  .ac-btn-primary:hover:not(:disabled) { background: #4f46e5; }
  .ac-btn-ghost:disabled, .ac-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
