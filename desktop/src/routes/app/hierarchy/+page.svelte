<!-- src/routes/app/hierarchy/+page.svelte -->
<script lang="ts">
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import LoadingSpinner from '$lib/components/shared/LoadingSpinner.svelte';
  import { hierarchyStore } from '$lib/stores/hierarchy.svelte';
  import { organizationsStore } from '$lib/stores/organizations.svelte';
  import { agentsStore } from '$lib/stores/agents.svelte';
  import { teams as teamsApi } from '$api/client';
  import type {
    HierarchyTeamNode,
    HierarchyDepartmentNode,
    HierarchyDivisionNode,
    CanopyAgent,
  } from '$api/types';

  // ── Data fetch ───────────────────────────────────────────────────────────────

  $effect(() => {
    const org = organizationsStore.current;
    if (org) {
      void hierarchyStore.fetchTree(org.id);
      void agentsStore.fetchAgents();
    } else {
      void organizationsStore.fetchOrganizations();
    }
  });

  // ── Tree collapse state ──────────────────────────────────────────────────────

  let collapsedDivisions = $state<Set<string>>(new Set());
  let collapsedDepartments = $state<Set<string>>(new Set());

  function toggleDivision(id: string): void {
    const next = new Set(collapsedDivisions);
    if (next.has(id)) next.delete(id); else next.add(id);
    collapsedDivisions = next;
  }

  function toggleDepartment(id: string): void {
    const next = new Set(collapsedDepartments);
    if (next.has(id)) next.delete(id); else next.add(id);
    collapsedDepartments = next;
  }

  // ── Selection state ──────────────────────────────────────────────────────────

  let selectedType = $state<'division' | 'department' | 'team' | null>(null);
  let selectedId = $state<string | null>(null);

  function selectDivision(div: HierarchyDivisionNode): void {
    hierarchyStore.selectDivision(div);
    selectedType = 'division';
    selectedId = div.id;
  }

  function selectDepartment(dept: HierarchyDepartmentNode): void {
    hierarchyStore.selectDepartment(dept);
    selectedType = 'department';
    selectedId = dept.id;
  }

  function selectTeam(team: HierarchyTeamNode): void {
    hierarchyStore.selectTeam(team);
    selectedType = 'team';
    selectedId = team.id;
  }

  function clearSelection(): void {
    selectedType = null;
    selectedId = null;
    hierarchyStore.selectDivision(null);
    hierarchyStore.selectDepartment(null);
    hierarchyStore.selectTeam(null);
  }

  // ── Derived: resolved selected nodes from tree ───────────────────────────────

  let selectedDivisionNode = $derived(
    selectedType === 'division' && selectedId && hierarchyStore.tree
      ? hierarchyStore.tree.divisions.find((d) => d.id === selectedId) ?? null
      : null,
  );

  let selectedDepartmentNode = $derived(
    selectedType === 'department' && selectedId && hierarchyStore.tree
      ? hierarchyStore.tree.divisions
          .flatMap((d) => d.departments ?? [])
          .find((dept) => dept.id === selectedId) ?? null
      : null,
  );

  let selectedTeamNode = $derived(
    selectedType === 'team' && selectedId && hierarchyStore.tree
      ? hierarchyStore.tree.divisions
          .flatMap((d) => d.departments ?? [])
          .flatMap((dept) => dept.teams ?? [])
          .find((t) => t.id === selectedId) ?? null
      : null,
  );

  // Parent lookups for breadcrumb
  let teamParentDept = $derived(
    selectedTeamNode && hierarchyStore.tree
      ? hierarchyStore.tree.divisions
          .flatMap((d) => d.departments ?? [])
          .find((dept) => dept.teams?.some((t) => t.id === selectedTeamNode!.id)) ?? null
      : null,
  );

  let deptParentDiv = $derived(() => {
    const dept = selectedDepartmentNode ?? teamParentDept;
    if (!dept || !hierarchyStore.tree) return null;
    return hierarchyStore.tree.divisions.find((d) =>
      d.departments?.some((x) => x.id === dept.id),
    ) ?? null;
  });

  // ── Team members ─────────────────────────────────────────────────────────────

  let teamMembers = $state<Map<string, CanopyAgent[]>>(new Map());
  let loadingMembers = $state<string | null>(null);

  async function loadTeamMembers(teamId: string): Promise<void> {
    if (teamMembers.has(teamId)) return;
    loadingMembers = teamId;
    try {
      const agents = await teamsApi.agents(teamId);
      const next = new Map(teamMembers);
      next.set(teamId, agents);
      teamMembers = next;
    } catch {
      // silently fail
    } finally {
      loadingMembers = null;
    }
  }

  // Automatically load members when a team is selected
  $effect(() => {
    if (selectedType === 'team' && selectedId) {
      void loadTeamMembers(selectedId);
    }
  });

  // ── Add member dialog ────────────────────────────────────────────────────────

  let showAddMember = $state(false);
  let addMemberAgentId = $state('');
  let addMemberRole = $state<'member' | 'manager'>('member');
  let addingMember = $state(false);

  function openAddMember(): void {
    addMemberAgentId = '';
    addMemberRole = 'member';
    showAddMember = true;
  }

  async function handleAddMember(): Promise<void> {
    if (!selectedId || !addMemberAgentId) return;
    addingMember = true;
    const ok = await hierarchyStore.addTeamMember(selectedId, addMemberAgentId, addMemberRole);
    addingMember = false;
    if (ok) {
      showAddMember = false;
      // Refresh members
      const agents = await teamsApi.agents(selectedId);
      const next = new Map(teamMembers);
      next.set(selectedId, agents);
      teamMembers = next;
    }
  }

  async function removeMember(agentId: string): Promise<void> {
    if (!selectedId) return;
    const ok = await hierarchyStore.removeTeamMember(selectedId, agentId);
    if (ok) {
      const agents = await teamsApi.agents(selectedId);
      const next = new Map(teamMembers);
      next.set(selectedId, agents);
      teamMembers = next;
    }
  }

  // ── Add Division dialog ──────────────────────────────────────────────────────

  let showAddDivision = $state(false);
  let divName = $state('');
  let divSlug = $state('');
  let divDesc = $state('');
  let divCreating = $state(false);

  function slugify(s: string): string {
    return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function onDivNameInput(e: Event): void {
    divName = (e.target as HTMLInputElement).value;
    if (!divSlug || divSlug === slugify(divName.slice(0, -1))) {
      divSlug = slugify(divName);
    }
  }

  async function handleAddDivision(): Promise<void> {
    const org = organizationsStore.current;
    if (!org || !divName.trim()) return;
    divCreating = true;
    const result = await hierarchyStore.createDivision({
      name: divName.trim(),
      slug: divSlug.trim() || slugify(divName.trim()),
      description: divDesc.trim() || null,
      organization_id: org.id,
    });
    divCreating = false;
    if (result) {
      showAddDivision = false;
      divName = '';
      divSlug = '';
      divDesc = '';
      void hierarchyStore.fetchTree(org.id);
    }
  }

  // ── Utilities ────────────────────────────────────────────────────────────────

  function budgetLabel(cents: number | null): string {
    if (cents === null) return '';
    const k = Math.round(cents / 100);
    return k >= 1000 ? `$${(k / 1000).toFixed(0)}k/mo` : `$${k}/mo`;
  }

  function agentInitials(agent: CanopyAgent): string {
    const name = agent.display_name || agent.name;
    return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  }
</script>

<PageShell
  title="Organization"
  subtitle={organizationsStore.current?.name ?? 'No org selected'}
>
  {#snippet actions()}
    <button
      class="hc-btn hc-btn--primary"
      onclick={() => (showAddDivision = true)}
      aria-label="Add division"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Add Division
    </button>
  {/snippet}

  {#snippet children()}
    {#if hierarchyStore.loading && !hierarchyStore.tree}
      <div class="hc-loading" aria-label="Loading hierarchy" aria-live="polite">
        <LoadingSpinner size="md" />
        <span>Loading hierarchy…</span>
      </div>

    {:else if !organizationsStore.current}
      <div class="hc-empty" role="status">
        <div class="hc-empty-icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6l3-3 3 3M6 3v13M21 6l-3-3-3 3M18 3v13M3 21h18M3 17h6M15 17h6" />
          </svg>
        </div>
        <p class="hc-empty-text">No organization selected.</p>
        <p class="hc-empty-sub">Select or create an organization to view its hierarchy.</p>
      </div>

    {:else if !hierarchyStore.tree || hierarchyStore.tree.divisions.length === 0}
      <div class="hc-empty" role="status">
        <div class="hc-empty-icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6l3-3 3 3M6 3v13M21 6l-3-3-3 3M18 3v13M3 21h18M3 17h6M15 17h6" />
          </svg>
        </div>
        <p class="hc-empty-text">No hierarchy configured yet.</p>
        <p class="hc-empty-sub">Add your first division to start building the org structure.</p>
      </div>

    {:else}
      <!-- Two-panel layout -->
      <div class="hc-layout">

        <!-- Left: tree panel -->
        <div class="hc-panel-tree" role="tree" aria-label="Organization hierarchy">
          {#each hierarchyStore.tree.divisions as division (division.id)}
            {@const divExpanded = !collapsedDivisions.has(division.id)}

            <div class="hc-division" role="treeitem" aria-expanded={divExpanded} aria-selected={selectedType === 'division' && selectedId === division.id}>
              <div
                class="hc-node hc-node--division"
                class:hc-node--selected={selectedType === 'division' && selectedId === division.id}
              >
                <button
                  class="hc-chevron-btn"
                  onclick={() => toggleDivision(division.id)}
                  aria-label="{divExpanded ? 'Collapse' : 'Expand'} division {division.name}"
                >
                  <span class="hc-chevron" class:hc-chevron--collapsed={!divExpanded} aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                <button
                  class="hc-node-content"
                  onclick={() => selectDivision(division)}
                  aria-label="Select division {division.name}"
                >
                  <div class="hc-node-icon hc-node-icon--division" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </div>

                  <div class="hc-node-body">
                    <span class="hc-node-name">{division.name}</span>
                    {#if division.description}
                      <span class="hc-node-desc">{division.description}</span>
                    {/if}
                  </div>

                  <div class="hc-node-meta">
                    {#if division.budget_monthly_cents}
                      <span class="hc-chip hc-chip--blue">{budgetLabel(division.budget_monthly_cents)}</span>
                    {/if}
                    <span class="hc-chip hc-chip--count">{division.departments?.length ?? 0} depts</span>
                  </div>
                </button>
              </div>

              {#if divExpanded && division.departments?.length > 0}
                <div class="hc-children">
                  {#each division.departments as dept (dept.id)}
                    {@const deptExpanded = !collapsedDepartments.has(dept.id)}

                    <div class="hc-department" role="treeitem" aria-expanded={deptExpanded} aria-selected={selectedType === 'department' && selectedId === dept.id}>
                      <div
                        class="hc-node hc-node--department"
                        class:hc-node--selected={selectedType === 'department' && selectedId === dept.id}
                      >
                        <button
                          class="hc-chevron-btn"
                          onclick={() => toggleDepartment(dept.id)}
                          aria-label="{deptExpanded ? 'Collapse' : 'Expand'} department {dept.name}"
                        >
                          <span class="hc-chevron" class:hc-chevron--collapsed={!deptExpanded} aria-hidden="true">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </button>

                        <button
                          class="hc-node-content"
                          onclick={() => selectDepartment(dept)}
                          aria-label="Select department {dept.name}"
                        >
                          <div class="hc-node-icon hc-node-icon--department" aria-hidden="true">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                            </svg>
                          </div>

                          <div class="hc-node-body">
                            <span class="hc-node-name">{dept.name}</span>
                            {#if dept.description}
                              <span class="hc-node-desc">{dept.description}</span>
                            {/if}
                          </div>

                          <div class="hc-node-meta">
                            {#if dept.budget_monthly_cents}
                              <span class="hc-chip hc-chip--purple">{budgetLabel(dept.budget_monthly_cents)}</span>
                            {/if}
                            <span class="hc-chip hc-chip--count">{dept.teams?.length ?? 0} teams</span>
                          </div>
                        </button>
                      </div>

                      {#if deptExpanded && dept.teams?.length > 0}
                        <div class="hc-children">
                          {#each dept.teams as team (team.id)}
                            <div class="hc-team" role="treeitem" aria-selected={selectedType === 'team' && selectedId === team.id}>
                              <button
                                class="hc-node hc-node--team"
                                class:hc-node--selected={selectedType === 'team' && selectedId === team.id}
                                onclick={() => selectTeam(team)}
                                aria-label="Team: {team.name}"
                              >
                                <span class="hc-chevron-placeholder" aria-hidden="true"></span>

                                <div class="hc-node-icon hc-node-icon--team" aria-hidden="true">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                  </svg>
                                </div>

                                <div class="hc-node-body">
                                  <span class="hc-node-name">{team.name}</span>
                                  {#if team.description}
                                    <span class="hc-node-desc">{team.description}</span>
                                  {/if}
                                </div>

                                <div class="hc-node-meta">
                                  {#if team.budget_monthly_cents}
                                    <span class="hc-chip hc-chip--green">{budgetLabel(team.budget_monthly_cents)}</span>
                                  {/if}
                                  {#if team.agents?.length}
                                    <div class="hc-avatars" aria-label="{team.agents.length} agents">
                                      {#each team.agents.slice(0, 4) as agent (agent.id)}
                                        <span class="hc-avatar" title="{agent.display_name || agent.name}">{agentInitials(agent)}</span>
                                      {/each}
                                      {#if team.agents.length > 4}
                                        <span class="hc-avatar hc-avatar--more">+{team.agents.length - 4}</span>
                                      {/if}
                                    </div>
                                  {/if}
                                </div>
                              </button>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Right: detail panel -->
        {#if selectedType && selectedId}
          <div class="hc-panel-detail" aria-label="Detail panel">

            <!-- Division detail -->
            {#if selectedType === 'division' && selectedDivisionNode}
              {@const div = selectedDivisionNode}

              <!-- Breadcrumb -->
              <nav class="hc-breadcrumb" aria-label="Breadcrumb">
                <span class="hc-breadcrumb-item hc-breadcrumb-item--root">Organization</span>
                <span class="hc-breadcrumb-sep" aria-hidden="true">/</span>
                <span class="hc-breadcrumb-item hc-breadcrumb-item--current" aria-current="page">{div.name}</span>
              </nav>

              <!-- Header -->
              <header class="hc-detail-header">
                <div class="hc-detail-icon hc-detail-icon--division" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <div class="hc-detail-title-group">
                  <h2 class="hc-detail-name">{div.name}</h2>
                  <span class="hc-detail-slug">/{div.slug}</span>
                </div>
                <span class="hc-type-badge hc-type-badge--division">Division</span>
                <button class="hc-detail-close" onclick={clearSelection} aria-label="Close detail panel">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </header>

              <!-- Fields -->
              <div class="hc-detail-body">
                {#if div.description}
                  <p class="hc-detail-desc">{div.description}</p>
                {/if}

                <dl class="hc-dl">
                  {#if div.budget_monthly_cents}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Budget</dt>
                      <dd class="hc-dd">{budgetLabel(div.budget_monthly_cents)}</dd>
                    </div>
                  {/if}
                  {#if div.budget_enforcement}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Enforcement</dt>
                      <dd class="hc-dd"><span class="hc-badge hc-badge--{div.budget_enforcement}">{div.budget_enforcement}</span></dd>
                    </div>
                  {/if}
                  {#if div.operating_model}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Operating Model</dt>
                      <dd class="hc-dd">{div.operating_model}</dd>
                    </div>
                  {/if}
                  {#if div.mission}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Mission</dt>
                      <dd class="hc-dd">{div.mission}</dd>
                    </div>
                  {/if}
                  {#if div.coordination}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Coordination</dt>
                      <dd class="hc-dd">{div.coordination}</dd>
                    </div>
                  {/if}
                </dl>

                <!-- Child departments -->
                {#if div.departments?.length > 0}
                  <section class="hc-related" aria-label="Departments in {div.name}">
                    <h3 class="hc-related-title">
                      Departments
                      <span class="hc-related-count">{div.departments.length}</span>
                    </h3>
                    <ul class="hc-related-list" aria-label="Department list">
                      {#each div.departments as dept (dept.id)}
                        <li class="hc-related-item">
                          <button
                            class="hc-related-btn"
                            onclick={() => selectDepartment(dept)}
                            aria-label="Open department {dept.name}"
                          >
                            <div class="hc-related-icon hc-related-icon--dept" aria-hidden="true">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" />
                              </svg>
                            </div>
                            <span class="hc-related-name">{dept.name}</span>
                            <span class="hc-related-count-sm">{dept.teams?.length ?? 0} teams</span>
                            <svg class="hc-related-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>
                        </li>
                      {/each}
                    </ul>
                  </section>
                {/if}

                <a href="/app/divisions" class="hc-list-link" aria-label="View all divisions as list">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  View all divisions as list
                </a>
              </div>

            <!-- Department detail -->
            {:else if selectedType === 'department' && selectedDepartmentNode}
              {@const dept = selectedDepartmentNode}
              {@const parentDiv = deptParentDiv()}

              <!-- Breadcrumb -->
              <nav class="hc-breadcrumb" aria-label="Breadcrumb">
                <span class="hc-breadcrumb-item hc-breadcrumb-item--root">Organization</span>
                {#if parentDiv}
                  <span class="hc-breadcrumb-sep" aria-hidden="true">/</span>
                  <button
                    class="hc-breadcrumb-item hc-breadcrumb-item--link"
                    onclick={() => selectDivision(parentDiv)}
                    aria-label="Go to division {parentDiv.name}"
                  >{parentDiv.name}</button>
                {/if}
                <span class="hc-breadcrumb-sep" aria-hidden="true">/</span>
                <span class="hc-breadcrumb-item hc-breadcrumb-item--current" aria-current="page">{dept.name}</span>
              </nav>

              <!-- Header -->
              <header class="hc-detail-header">
                <div class="hc-detail-icon hc-detail-icon--department" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <div class="hc-detail-title-group">
                  <h2 class="hc-detail-name">{dept.name}</h2>
                  <span class="hc-detail-slug">/{dept.slug}</span>
                </div>
                <span class="hc-type-badge hc-type-badge--department">Department</span>
                <button class="hc-detail-close" onclick={clearSelection} aria-label="Close detail panel">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </header>

              <!-- Fields -->
              <div class="hc-detail-body">
                {#if dept.description}
                  <p class="hc-detail-desc">{dept.description}</p>
                {/if}

                <dl class="hc-dl">
                  {#if parentDiv}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Division</dt>
                      <dd class="hc-dd">
                        <button
                          class="hc-dd-link"
                          onclick={() => selectDivision(parentDiv)}
                          aria-label="Go to division {parentDiv.name}"
                        >{parentDiv.name}</button>
                      </dd>
                    </div>
                  {/if}
                  {#if dept.budget_monthly_cents}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Budget</dt>
                      <dd class="hc-dd">{budgetLabel(dept.budget_monthly_cents)}</dd>
                    </div>
                  {/if}
                  {#if dept.budget_enforcement}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Enforcement</dt>
                      <dd class="hc-dd"><span class="hc-badge hc-badge--{dept.budget_enforcement}">{dept.budget_enforcement}</span></dd>
                    </div>
                  {/if}
                  {#if dept.mission}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Mission</dt>
                      <dd class="hc-dd">{dept.mission}</dd>
                    </div>
                  {/if}
                  {#if dept.coordination}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Coordination</dt>
                      <dd class="hc-dd">{dept.coordination}</dd>
                    </div>
                  {/if}
                </dl>

                <!-- Child teams -->
                {#if dept.teams?.length > 0}
                  <section class="hc-related" aria-label="Teams in {dept.name}">
                    <h3 class="hc-related-title">
                      Teams
                      <span class="hc-related-count">{dept.teams.length}</span>
                    </h3>
                    <ul class="hc-related-list" aria-label="Team list">
                      {#each dept.teams as team (team.id)}
                        <li class="hc-related-item">
                          <button
                            class="hc-related-btn"
                            onclick={() => selectTeam(team)}
                            aria-label="Open team {team.name}"
                          >
                            <div class="hc-related-icon hc-related-icon--team" aria-hidden="true">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                              </svg>
                            </div>
                            <span class="hc-related-name">{team.name}</span>
                            {#if team.agents?.length}
                              <span class="hc-related-count-sm">{team.agents.length} agents</span>
                            {/if}
                            <svg class="hc-related-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>
                        </li>
                      {/each}
                    </ul>
                  </section>
                {/if}

                <a href="/app/departments" class="hc-list-link" aria-label="View all departments as list">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  View all departments as list
                </a>
              </div>

            <!-- Team detail -->
            {:else if selectedType === 'team' && selectedTeamNode}
              {@const team = selectedTeamNode}
              {@const parentDeptForTeam = teamParentDept}
              {@const parentDivForTeam = deptParentDiv()}
              {@const members = teamMembers.get(team.id) ?? []}
              {@const isLoadingMembers = loadingMembers === team.id}

              <!-- Breadcrumb -->
              <nav class="hc-breadcrumb" aria-label="Breadcrumb">
                <span class="hc-breadcrumb-item hc-breadcrumb-item--root">Organization</span>
                {#if parentDivForTeam}
                  <span class="hc-breadcrumb-sep" aria-hidden="true">/</span>
                  <button
                    class="hc-breadcrumb-item hc-breadcrumb-item--link"
                    onclick={() => selectDivision(parentDivForTeam)}
                    aria-label="Go to division {parentDivForTeam.name}"
                  >{parentDivForTeam.name}</button>
                {/if}
                {#if parentDeptForTeam}
                  <span class="hc-breadcrumb-sep" aria-hidden="true">/</span>
                  <button
                    class="hc-breadcrumb-item hc-breadcrumb-item--link"
                    onclick={() => selectDepartment(parentDeptForTeam)}
                    aria-label="Go to department {parentDeptForTeam.name}"
                  >{parentDeptForTeam.name}</button>
                {/if}
                <span class="hc-breadcrumb-sep" aria-hidden="true">/</span>
                <span class="hc-breadcrumb-item hc-breadcrumb-item--current" aria-current="page">{team.name}</span>
              </nav>

              <!-- Header -->
              <header class="hc-detail-header">
                <div class="hc-detail-icon hc-detail-icon--team" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div class="hc-detail-title-group">
                  <h2 class="hc-detail-name">{team.name}</h2>
                  <span class="hc-detail-slug">/{team.slug}</span>
                </div>
                <span class="hc-type-badge hc-type-badge--team">Team</span>
                <button class="hc-detail-close" onclick={clearSelection} aria-label="Close detail panel">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </header>

              <!-- Fields -->
              <div class="hc-detail-body">
                {#if team.description}
                  <p class="hc-detail-desc">{team.description}</p>
                {/if}

                <dl class="hc-dl">
                  {#if parentDeptForTeam}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Department</dt>
                      <dd class="hc-dd">
                        <button
                          class="hc-dd-link"
                          onclick={() => selectDepartment(parentDeptForTeam)}
                          aria-label="Go to department {parentDeptForTeam.name}"
                        >{parentDeptForTeam.name}</button>
                      </dd>
                    </div>
                  {/if}
                  {#if team.budget_monthly_cents}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Budget</dt>
                      <dd class="hc-dd">{budgetLabel(team.budget_monthly_cents)}</dd>
                    </div>
                  {/if}
                  {#if team.budget_enforcement}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Enforcement</dt>
                      <dd class="hc-dd"><span class="hc-badge hc-badge--{team.budget_enforcement}">{team.budget_enforcement}</span></dd>
                    </div>
                  {/if}
                  {#if team.mission}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Mission</dt>
                      <dd class="hc-dd">{team.mission}</dd>
                    </div>
                  {/if}
                  {#if team.coordination}
                    <div class="hc-dl-row">
                      <dt class="hc-dt">Coordination</dt>
                      <dd class="hc-dd">{team.coordination}</dd>
                    </div>
                  {/if}
                </dl>

                <!-- Members -->
                <section class="hc-related" aria-label="Members of {team.name}">
                  <div class="hc-related-header">
                    <h3 class="hc-related-title">
                      Members
                      {#if members.length > 0}
                        <span class="hc-related-count">{members.length}</span>
                      {/if}
                    </h3>
                    <button
                      class="hc-btn hc-btn--sm"
                      onclick={openAddMember}
                      aria-label="Add agent to team"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add
                    </button>
                  </div>

                  {#if isLoadingMembers}
                    <div class="hc-members-loading" aria-live="polite">
                      <LoadingSpinner size="sm" />
                      <span>Loading members…</span>
                    </div>
                  {:else if members.length === 0}
                    <p class="hc-members-empty">No members yet.</p>
                  {:else}
                    <ul class="hc-members-list" aria-label="Team members">
                      {#each members as agent (agent.id)}
                        <li class="hc-member-row">
                          <span class="hc-member-avatar" aria-hidden="true">{agentInitials(agent)}</span>
                          <div class="hc-member-info">
                            <span class="hc-member-name">{agent.display_name || agent.name}</span>
                            {#if agent.role}
                              <span class="hc-member-role">{agent.role}</span>
                            {/if}
                          </div>
                          <button
                            class="hc-btn-danger-ghost"
                            onclick={() => void removeMember(agent.id)}
                            aria-label="Remove {agent.display_name || agent.name} from team"
                            title="Remove from team"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </section>

                <a href="/app/teams" class="hc-list-link" aria-label="View all teams as list">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  View all teams as list
                </a>
              </div>
            {/if}

          </div>
        {:else}
          <!-- Placeholder when nothing selected -->
          <div class="hc-panel-empty" aria-live="polite" role="status">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 15l6 6m-11-4a7 7 0 110-14 7 7 0 010 14z" />
            </svg>
            <p class="hc-panel-empty-text">Select a node to view details</p>
            <p class="hc-panel-empty-sub">Click any division, department, or team in the tree.</p>
          </div>
        {/if}

      </div>
    {/if}
  {/snippet}
</PageShell>

<!-- Add Division dialog -->
{#if showAddDivision}
  <div class="hc-overlay" role="dialog" aria-modal="true" aria-label="Add division">
    <div class="hc-dialog">
      <header class="hc-dialog-header">
        <h2 class="hc-dialog-title">New Division</h2>
        <button class="hc-dialog-close" onclick={() => (showAddDivision = false)} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>
      <div class="hc-dialog-body">
        <label class="hc-field">
          <span class="hc-label">Name <span class="hc-required" aria-hidden="true">*</span></span>
          <input class="hc-input" type="text" placeholder="e.g. Engineering" value={divName} oninput={onDivNameInput} aria-required="true" />
        </label>
        <label class="hc-field">
          <span class="hc-label">Slug</span>
          <input class="hc-input" type="text" placeholder="auto-generated" bind:value={divSlug} />
        </label>
        <label class="hc-field">
          <span class="hc-label">Description</span>
          <textarea class="hc-input hc-textarea" placeholder="Optional…" bind:value={divDesc} rows={3}></textarea>
        </label>
      </div>
      <footer class="hc-dialog-footer">
        <button class="hc-btn hc-btn--ghost" onclick={() => (showAddDivision = false)}>Cancel</button>
        <button class="hc-btn hc-btn--primary" onclick={handleAddDivision} disabled={divCreating || !divName.trim()} aria-busy={divCreating}>
          {divCreating ? 'Creating…' : 'Create Division'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<!-- Add Member dialog -->
{#if showAddMember}
  <div class="hc-overlay" role="dialog" aria-modal="true" aria-label="Add team member">
    <div class="hc-dialog">
      <header class="hc-dialog-header">
        <h2 class="hc-dialog-title">Add Team Member</h2>
        <button class="hc-dialog-close" onclick={() => (showAddMember = false)} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>
      <div class="hc-dialog-body">
        <label class="hc-field">
          <span class="hc-label">Agent <span class="hc-required" aria-hidden="true">*</span></span>
          <select class="hc-input" bind:value={addMemberAgentId} aria-required="true" aria-label="Select agent">
            <option value="" disabled selected>Select an agent…</option>
            {#each agentsStore.agents as agent (agent.id)}
              <option value={agent.id}>{agent.display_name || agent.name} — {agent.role}</option>
            {/each}
          </select>
        </label>
        <label class="hc-field">
          <span class="hc-label">Role</span>
          <select class="hc-input" bind:value={addMemberRole} aria-label="Member role">
            <option value="member">Member</option>
            <option value="manager">Manager</option>
          </select>
        </label>
      </div>
      <footer class="hc-dialog-footer">
        <button class="hc-btn hc-btn--ghost" onclick={() => (showAddMember = false)}>Cancel</button>
        <button
          class="hc-btn hc-btn--primary"
          onclick={handleAddMember}
          disabled={addingMember || !addMemberAgentId}
          aria-busy={addingMember}
        >
          {addingMember ? 'Adding…' : 'Add Member'}
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  /* ── Loading & Empty ────────────────────────────────────────────────────── */
  .hc-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 200px;
    color: var(--text-tertiary);
    font-size: 13px;
  }

  .hc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 280px;
    text-align: center;
  }

  .hc-empty-icon {
    color: var(--text-tertiary);
    opacity: 0.4;
    margin-bottom: 4px;
  }

  .hc-empty-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0;
  }

  .hc-empty-sub {
    font-size: 13px;
    color: var(--text-tertiary);
    margin: 0;
    max-width: 320px;
  }

  /* ── Two-panel layout ───────────────────────────────────────────────────── */
  .hc-layout {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    min-height: 0;
  }

  .hc-panel-tree {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hc-panel-detail {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--border-default);
    border-radius: 12px;
    background: var(--bg-elevated);
    overflow: hidden;
  }

  .hc-panel-empty {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 24px;
    border: 1px dashed var(--border-default);
    border-radius: 12px;
    text-align: center;
    color: var(--text-tertiary);
    opacity: 0.6;
  }

  .hc-panel-empty-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 8px 0 0;
  }

  .hc-panel-empty-sub {
    font-size: 12px;
    color: var(--text-tertiary);
    margin: 0;
  }

  /* ── Responsive: stack on narrow viewports ──────────────────────────────── */
  @media (max-width: 860px) {
    .hc-layout {
      flex-direction: column;
    }

    .hc-panel-tree {
      width: 100%;
    }
  }

  /* ── Breadcrumb ─────────────────────────────────────────────────────────── */
  .hc-breadcrumb {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 16px 0;
    flex-wrap: wrap;
  }

  .hc-breadcrumb-item {
    font-size: 11px;
    color: var(--text-tertiary);
    white-space: nowrap;
  }

  .hc-breadcrumb-item--root {
    opacity: 0.7;
  }

  .hc-breadcrumb-item--link {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--accent-primary);
    padding: 0;
    font-size: 11px;
    font-family: inherit;
  }

  .hc-breadcrumb-item--link:hover {
    text-decoration: underline;
  }

  .hc-breadcrumb-item--current {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .hc-breadcrumb-sep {
    color: var(--text-tertiary);
    font-size: 11px;
    opacity: 0.5;
  }

  /* ── Detail header ──────────────────────────────────────────────────────── */
  .hc-detail-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--border-default);
  }

  .hc-detail-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .hc-detail-icon--division {
    background: color-mix(in srgb, #3b82f6 15%, transparent);
    color: #3b82f6;
  }

  .hc-detail-icon--department {
    background: color-mix(in srgb, #8b5cf6 15%, transparent);
    color: #8b5cf6;
  }

  .hc-detail-icon--team {
    background: color-mix(in srgb, #10b981 15%, transparent);
    color: #10b981;
  }

  .hc-detail-title-group {
    flex: 1;
    min-width: 0;
  }

  .hc-detail-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hc-detail-slug {
    font-size: 11px;
    color: var(--text-tertiary);
    font-family: var(--font-mono, monospace);
  }

  .hc-type-badge {
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  .hc-type-badge--division {
    background: color-mix(in srgb, #3b82f6 12%, transparent);
    color: #3b82f6;
    border: 1px solid color-mix(in srgb, #3b82f6 25%, transparent);
  }

  .hc-type-badge--department {
    background: color-mix(in srgb, #8b5cf6 12%, transparent);
    color: #8b5cf6;
    border: 1px solid color-mix(in srgb, #8b5cf6 25%, transparent);
  }

  .hc-type-badge--team {
    background: color-mix(in srgb, #10b981 12%, transparent);
    color: #10b981;
    border: 1px solid color-mix(in srgb, #10b981 25%, transparent);
  }

  .hc-detail-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    padding: 4px;
    border-radius: 4px;
    display: flex;
    flex-shrink: 0;
  }

  .hc-detail-close:hover {
    color: var(--text-primary);
    background: var(--bg-hover, var(--bg-elevated));
  }

  /* ── Detail body ────────────────────────────────────────────────────────── */
  .hc-detail-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .hc-detail-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  /* ── Definition list ────────────────────────────────────────────────────── */
  .hc-dl {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid var(--border-default);
    border-radius: 8px;
    overflow: hidden;
  }

  .hc-dl-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-default);
  }

  .hc-dl-row:last-child {
    border-bottom: none;
  }

  .hc-dt {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    width: 120px;
    flex-shrink: 0;
  }

  .hc-dd {
    font-size: 13px;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.5;
    flex: 1;
    min-width: 0;
  }

  .hc-dd-link {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--accent-primary);
    font-size: 13px;
    padding: 0;
    font-family: inherit;
  }

  .hc-dd-link:hover {
    text-decoration: underline;
  }

  .hc-badge {
    display: inline-flex;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .hc-badge--soft {
    background: color-mix(in srgb, #f59e0b 12%, transparent);
    color: #f59e0b;
  }

  .hc-badge--hard {
    background: color-mix(in srgb, #ef4444 12%, transparent);
    color: #ef4444;
  }

  /* ── Related entities section ───────────────────────────────────────────── */
  .hc-related {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .hc-related-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .hc-related-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
    margin: 0;
  }

  .hc-related-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 700;
    background: var(--bg-hover, var(--bg-elevated));
    border: 1px solid var(--border-default);
    color: var(--text-tertiary);
  }

  .hc-related-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .hc-related-item {
    display: flex;
  }

  .hc-related-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 7px;
    background: none;
    border: 1px solid var(--border-default);
    cursor: pointer;
    color: inherit;
    text-align: left;
    transition: background 0.1s, border-color 0.1s;
  }

  .hc-related-btn:hover {
    background: var(--bg-hover, color-mix(in srgb, var(--accent-primary) 5%, var(--bg-elevated)));
    border-color: var(--accent-primary);
  }

  .hc-related-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    flex-shrink: 0;
  }

  .hc-related-icon--dept {
    background: color-mix(in srgb, #8b5cf6 15%, transparent);
    color: #8b5cf6;
  }

  .hc-related-icon--team {
    background: color-mix(in srgb, #10b981 15%, transparent);
    color: #10b981;
  }

  .hc-related-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .hc-related-count-sm {
    font-size: 11px;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .hc-related-arrow {
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  /* ── Members list ───────────────────────────────────────────────────────── */
  .hc-members-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-tertiary);
    padding: 8px 0;
  }

  .hc-members-empty {
    font-size: 12px;
    color: var(--text-tertiary);
    margin: 0;
    padding: 4px 0;
  }

  .hc-members-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .hc-member-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 7px;
    border: 1px solid var(--border-default);
  }

  .hc-member-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: color-mix(in srgb, #10b981 20%, var(--bg-elevated));
    color: #10b981;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
    border: 1px solid var(--border-default);
  }

  .hc-member-info {
    flex: 1;
    min-width: 0;
  }

  .hc-member-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hc-member-role {
    font-size: 10px;
    color: var(--text-tertiary);
    text-transform: capitalize;
  }

  .hc-btn-danger-ghost {
    background: none;
    border: none;
    color: var(--text-tertiary);
    padding: 3px;
    border-radius: 4px;
    flex-shrink: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hc-btn-danger-ghost:hover {
    color: #ef4444;
    background: color-mix(in srgb, #ef4444 10%, transparent);
  }

  /* ── "View in list" link ────────────────────────────────────────────────── */
  .hc-list-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-tertiary);
    text-decoration: none;
    padding: 6px 0;
    transition: color 0.1s;
    align-self: flex-start;
  }

  .hc-list-link:hover {
    color: var(--accent-primary);
  }

  /* ── Action Button ──────────────────────────────────────────────────────── */
  .hc-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.12s, border-color 0.12s;
  }

  .hc-btn--primary {
    background: var(--accent-primary);
    color: #fff;
    border-color: var(--accent-primary);
  }

  .hc-btn--primary:hover {
    opacity: 0.88;
  }

  .hc-btn--primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hc-btn--ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: var(--border-default);
  }

  .hc-btn--ghost:hover {
    background: var(--bg-elevated);
  }

  .hc-btn--sm {
    padding: 4px 8px;
    font-size: 11px;
    border-radius: 5px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
  }

  .hc-btn--sm:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  /* ── Tree layout ────────────────────────────────────────────────────────── */
  .hc-children {
    padding-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
  }

  /* ── Node row ───────────────────────────────────────────────────────────── */
  .hc-node {
    display: flex;
    align-items: center;
    gap: 0;
    width: 100%;
    border-radius: 8px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    transition: background 0.1s, border-color 0.1s;
    overflow: hidden;
  }

  .hc-node:hover {
    border-color: var(--border-hover, var(--border-default));
  }

  .hc-node--selected {
    border-color: var(--accent-primary);
    background: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-elevated));
  }

  .hc-chevron-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    align-self: stretch;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    transition: color 0.1s;
  }

  .hc-chevron-btn:hover {
    color: var(--text-secondary);
    background: color-mix(in srgb, currentColor 6%, transparent);
  }

  .hc-node-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
  }

  .hc-node--division .hc-node-content {
    padding: 10px 12px 10px 0;
  }

  .hc-node--department .hc-node-content {
    padding: 8px 10px 8px 0;
  }

  .hc-node--team {
    cursor: pointer;
    border: none;
    padding: 7px 10px;
    text-align: left;
    color: inherit;
  }

  .hc-node--team:hover {
    background: var(--bg-hover, var(--bg-elevated));
  }

  .hc-chevron {
    display: flex;
    align-items: center;
    color: var(--text-tertiary);
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .hc-chevron--collapsed {
    transform: rotate(-90deg);
  }

  .hc-chevron-placeholder {
    width: 12px;
    flex-shrink: 0;
  }

  .hc-node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .hc-node-icon--division {
    background: color-mix(in srgb, #3b82f6 15%, transparent);
    color: #3b82f6;
  }

  .hc-node-icon--department {
    background: color-mix(in srgb, #8b5cf6 15%, transparent);
    color: #8b5cf6;
  }

  .hc-node-icon--team {
    background: color-mix(in srgb, #10b981 15%, transparent);
    color: #10b981;
  }

  .hc-node-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .hc-node-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hc-node-desc {
    font-size: 11px;
    color: var(--text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hc-node-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .hc-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid transparent;
  }

  .hc-chip--count {
    background: var(--bg-elevated);
    border-color: var(--border-default);
    color: var(--text-tertiary);
  }

  .hc-chip--blue {
    background: color-mix(in srgb, #3b82f6 12%, transparent);
    border-color: color-mix(in srgb, #3b82f6 30%, transparent);
    color: #3b82f6;
  }

  .hc-chip--purple {
    background: color-mix(in srgb, #8b5cf6 12%, transparent);
    border-color: color-mix(in srgb, #8b5cf6 30%, transparent);
    color: #8b5cf6;
  }

  .hc-chip--green {
    background: color-mix(in srgb, #10b981 12%, transparent);
    border-color: color-mix(in srgb, #10b981 30%, transparent);
    color: #10b981;
  }

  .hc-avatars {
    display: flex;
    align-items: center;
  }

  .hc-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 9px;
    font-weight: 600;
    background: var(--bg-elevated);
    border: 2px solid var(--border-default);
    color: var(--text-secondary);
    margin-left: -6px;
    flex-shrink: 0;
  }

  .hc-avatar:first-child {
    margin-left: 0;
  }

  .hc-avatar--more {
    background: var(--bg-hover, var(--bg-elevated));
    color: var(--text-tertiary);
    font-size: 8px;
  }

  /* ── Dialog ─────────────────────────────────────────────────────────────── */
  .hc-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .hc-dialog {
    background: var(--bg-surface, var(--bg-elevated));
    border: 1px solid var(--border-default);
    border-radius: 12px;
    width: 420px;
    max-width: calc(100vw - 32px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .hc-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-default);
  }

  .hc-dialog-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .hc-dialog-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    padding: 4px;
    border-radius: 4px;
    display: flex;
  }

  .hc-dialog-close:hover {
    color: var(--text-primary);
  }

  .hc-dialog-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .hc-dialog-footer {
    padding: 14px 20px;
    border-top: 1px solid var(--border-default);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .hc-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .hc-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .hc-required {
    color: var(--accent-primary);
  }

  .hc-input {
    padding: 8px 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 7px;
    font-size: 13px;
    color: var(--text-primary);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
  }

  .hc-input:focus {
    border-color: var(--accent-primary);
  }

  .hc-textarea {
    resize: vertical;
    min-height: 72px;
  }
</style>
