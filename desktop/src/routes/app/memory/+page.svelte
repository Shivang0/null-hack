<!-- src/routes/app/memory/+page.svelte — Knowledge Browser -->
<script lang="ts">
  import PageShell from '$lib/components/layout/PageShell.svelte';
  import { memoryStore, CATEGORY_META } from '$lib/stores/memory.svelte';
  import type { KnowledgeEntry, KnowledgeCategory } from '$lib/stores/memory.svelte';
  import { workspaceStore } from '$lib/stores/workspace.svelte';

  // Re-fetch on workspace switch
  $effect(() => {
    void workspaceStore.activeWorkspaceId;
    void memoryStore.fetch();
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  }

  function truncate(str: string, len: number): string {
    return str.length > len ? str.slice(0, len) + '…' : str;
  }

  function confidencePct(c: number): string {
    return `${Math.round(c * 100)}%`;
  }

  function confidenceColor(c: number): string {
    if (c >= 0.95) return '#34d399';
    if (c >= 0.8) return '#60a5fa';
    if (c >= 0.6) return '#f59e0b';
    return '#f87171';
  }

  // ── Category tabs ──────────────────────────────────────────────────────────
  const ALL_CATS: Array<{ id: KnowledgeCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'fact', label: 'Facts' },
    { id: 'procedure', label: 'Procedures' },
    { id: 'preference', label: 'Preferences' },
    { id: 'observation', label: 'Observations' },
    { id: 'decision', label: 'Decisions' },
    { id: 'context', label: 'Context' },
  ];

  // ── Stats bar data ─────────────────────────────────────────────────────────
  const STAT_CATS: KnowledgeCategory[] = ['fact', 'procedure', 'preference', 'observation', 'decision', 'context'];

  // ── Graph layout ───────────────────────────────────────────────────────────
  // Group nodes by category, positioned in a 3-col grid of category clusters
  const GRAPH_COLS = 3;

  interface GraphNode {
    entry: KnowledgeEntry;
    x: number;
    y: number;
    cx: number; // center x
    cy: number; // center y
  }

  const NODE_W = 160;
  const NODE_H = 52;
  const COL_W = 200;
  const ROW_H = 70;
  const CLUSTER_PAD_X = 20;
  const CLUSTER_PAD_Y = 36;
  const CLUSTER_GAP_X = 240;
  const CLUSTER_GAP_Y = 20;

  const graphLayout = $derived.by((): { nodes: GraphNode[]; svgW: number; svgH: number } => {
    const entries = memoryStore.filteredEntries;
    const byCat = new Map<KnowledgeCategory, KnowledgeEntry[]>();
    for (const e of entries) {
      const arr = byCat.get(e.category) ?? [];
      arr.push(e);
      byCat.set(e.category, arr);
    }

    const catOrder: KnowledgeCategory[] = ['fact', 'procedure', 'preference', 'observation', 'decision', 'context'];
    const activeCats = catOrder.filter((c) => byCat.has(c));

    const nodes: GraphNode[] = [];
    const clusterOrigins: Map<KnowledgeCategory, { ox: number; oy: number; cols: number }> = new Map();

    // Place clusters in a GRAPH_COLS grid
    activeCats.forEach((cat, clusterIdx) => {
      const catEntries = byCat.get(cat)!;
      const cols = Math.min(GRAPH_COLS, catEntries.length);
      const rows = Math.ceil(catEntries.length / cols);
      const clusterH = rows * ROW_H + CLUSTER_PAD_Y * 2;

      const gridCol = clusterIdx % GRAPH_COLS;
      const gridRow = Math.floor(clusterIdx / GRAPH_COLS);
      const ox = gridCol * (CLUSTER_GAP_X + NODE_W) + (gridCol > 0 ? gridCol * 20 : 0);
      const oy = gridRow * (clusterH + CLUSTER_GAP_Y);

      clusterOrigins.set(cat, { ox, oy, cols });

      catEntries.forEach((entry, i) => {
        const localCol = i % cols;
        const localRow = Math.floor(i / cols);
        const x = ox + CLUSTER_PAD_X + localCol * COL_W;
        const y = oy + CLUSTER_PAD_Y + localRow * ROW_H;
        nodes.push({ entry, x, y, cx: x + NODE_W / 2, cy: y + NODE_H / 2 });
      });
    });

    const svgW = Math.max(600, GRAPH_COLS * (CLUSTER_GAP_X + NODE_W) + 80);
    const maxY = nodes.reduce((m, n) => Math.max(m, n.y + NODE_H), 0);
    const svgH = maxY + 60;

    return { nodes, svgW, svgH };
  });

  // Build SVG edges between related entries
  const graphEdges = $derived.by((): Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> => {
    const { nodes } = graphLayout;
    const nodeMap = new Map(nodes.map((n) => [n.entry.id, n]));
    const seen = new Set<string>();
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];

    for (const node of nodes) {
      for (const relId of node.entry.related_entries) {
        const target = nodeMap.get(relId);
        if (!target) continue;
        const key = [node.entry.id, relId].sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ x1: node.cx, y1: node.cy, x2: target.cx, y2: target.cy, key });
      }
    }
    return edges;
  });

  // ── Detail panel ───────────────────────────────────────────────────────────
  function selectEntry(entry: KnowledgeEntry) {
    memoryStore.selectEntry(entry);
  }

  function clearSelection() {
    memoryStore.selectEntry(null);
  }

  async function handleDelete(id: string) {
    await memoryStore.deleteEntry(id);
  }

  // Parse JSON value for display
  function prettyValue(entry: KnowledgeEntry): string {
    if (entry.value_type === 'json') {
      try {
        return JSON.stringify(JSON.parse(entry.value), null, 2);
      } catch {
        return entry.value;
      }
    }
    return entry.value;
  }
</script>

<PageShell
  title="Memory"
  subtitle="Knowledge Browser"
  badge={memoryStore.totalCount > 0 ? memoryStore.totalCount : undefined}
  noPadding
>
  {#snippet actions()}
    <!-- View toggle -->
    <div class="kb-view-toggle" role="group" aria-label="View mode">
      <button
        class="kb-view-btn"
        class:kb-view-btn--active={memoryStore.viewMode === 'list'}
        onclick={() => memoryStore.setViewMode('list')}
        aria-pressed={memoryStore.viewMode === 'list'}
        title="List view"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        List
      </button>
      <button
        class="kb-view-btn"
        class:kb-view-btn--active={memoryStore.viewMode === 'graph'}
        onclick={() => memoryStore.setViewMode('graph')}
        aria-pressed={memoryStore.viewMode === 'graph'}
        title="Graph view"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Graph
      </button>
    </div>

    <button
      class="kb-refresh-btn"
      onclick={() => void memoryStore.fetch()}
      disabled={memoryStore.loading}
      aria-label="Refresh knowledge entries"
    >
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        class:kb-spinning={memoryStore.loading}
        aria-hidden="true"
      >
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
      </svg>
      Refresh
    </button>
  {/snippet}

  <div class="kb-shell">

    <!-- ── Toolbar: search + category tabs ──────────────────────────────── -->
    <div class="kb-toolbar">
      <div class="kb-search-wrap">
        <svg class="kb-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="kb-search"
          type="search"
          placeholder="Search keys, values, agents, tags…"
          value={memoryStore.searchQuery}
          oninput={(e) => memoryStore.setSearch((e.currentTarget as HTMLInputElement).value)}
          aria-label="Search knowledge entries"
        />
        {#if memoryStore.isSearching}
          <span class="kb-search-spinner" aria-hidden="true"></span>
        {/if}
      </div>

      <nav class="kb-cats" aria-label="Category filter">
        {#each ALL_CATS as cat (cat.id)}
          {@const count = cat.id === 'all'
            ? memoryStore.knowledgeEntries.length
            : (memoryStore.byCategory.get(cat.id) ?? 0)}
          <button
            class="kb-cat-tab"
            class:kb-cat-tab--active={memoryStore.activeCategory === cat.id}
            onclick={() => memoryStore.setActiveCategory(cat.id)}
            aria-pressed={memoryStore.activeCategory === cat.id}
            style={cat.id !== 'all' && memoryStore.activeCategory === cat.id
              ? `color: ${CATEGORY_META[cat.id].color}; border-color: ${CATEGORY_META[cat.id].color}; background: ${CATEGORY_META[cat.id].bg};`
              : ''}
          >
            {cat.label}
            {#if count > 0}
              <span class="kb-cat-count">{count}</span>
            {/if}
          </button>
        {/each}
      </nav>
    </div>

    <!-- ── Stats row ─────────────────────────────────────────────────────── -->
    <div class="kb-stats">
      <div class="kb-stat">
        <span class="kb-stat-val">{memoryStore.knowledgeEntries.length}</span>
        <span class="kb-stat-lbl">Total entries</span>
      </div>
      <div class="kb-stat-sep" aria-hidden="true"></div>

      {#each STAT_CATS as cat (cat)}
        {@const c = memoryStore.byCategory.get(cat) ?? 0}
        {#if c > 0}
          <span
            class="kb-stat-pill"
            style="color: {CATEGORY_META[cat].color}; background: {CATEGORY_META[cat].bg}; border-color: {CATEGORY_META[cat].border};"
          >
            {c} {CATEGORY_META[cat].label}
          </span>
        {/if}
      {/each}

      <div class="kb-stat-sep" aria-hidden="true"></div>
      <div class="kb-stat">
        <span class="kb-stat-val" style="color: {confidenceColor(memoryStore.avgConfidence)}">
          {confidencePct(memoryStore.avgConfidence)}
        </span>
        <span class="kb-stat-lbl">Avg confidence</span>
      </div>
    </div>

    <!-- ── Main content area ─────────────────────────────────────────────── -->
    <div class="kb-main" class:kb-main--with-detail={!!memoryStore.selected}>

      <!-- List / Graph viewport -->
      <div class="kb-viewport">

        {#if memoryStore.loading && memoryStore.entries.length === 0}
          <!-- Loading skeleton -->
          <div class="kb-skeletons" aria-busy="true" aria-label="Loading entries">
            {#each [1,2,3,4,5] as i (i)}
              <div class="kb-skeleton"></div>
            {/each}
          </div>

        {:else if memoryStore.error}
          <div class="kb-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>{memoryStore.error}</p>
          </div>

        {:else if memoryStore.filteredEntries.length === 0}
          <div class="kb-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            </svg>
            <p>No entries match your filter.</p>
          </div>

        {:else if memoryStore.viewMode === 'list'}
          <!-- ── List view ──────────────────────────────────────────────── -->
          <div class="kb-list" role="list">
            {#each memoryStore.paginatedEntries as entry (entry.id)}
              {@const meta = CATEGORY_META[entry.category]}
              <button
                class="kb-card"
                class:kb-card--selected={memoryStore.selected?.id === entry.id}
                onclick={() => selectEntry(entry)}
                aria-selected={memoryStore.selected?.id === entry.id}
                role="listitem"
              >
                <!-- Category badge + key -->
                <div class="kb-card-header">
                  <span
                    class="kb-badge"
                    style="color: {meta.color}; background: {meta.bg}; border-color: {meta.border};"
                  >
                    {meta.label}
                  </span>
                  <span class="kb-card-key">{entry.key}</span>
                  <span class="kb-card-agent">{entry.agent_name}</span>
                </div>

                <!-- Value preview (2 lines) -->
                <p class="kb-card-value">{truncate(entry.value.replace(/\s+/g, ' '), 120)}</p>

                <!-- Confidence bar -->
                <div class="kb-card-meta">
                  <div class="kb-conf-bar" title="Confidence: {confidencePct(entry.confidence)}">
                    <div
                      class="kb-conf-fill"
                      style="width: {confidencePct(entry.confidence)}; background: {confidenceColor(entry.confidence)};"
                    ></div>
                  </div>
                  <span class="kb-conf-label">{confidencePct(entry.confidence)}</span>

                  <!-- Tags -->
                  <div class="kb-tags">
                    {#each entry.tags.slice(0, 3) as tag (tag)}
                      <span class="kb-tag">{tag}</span>
                    {/each}
                    {#if entry.tags.length > 3}
                      <span class="kb-tag kb-tag--more">+{entry.tags.length - 3}</span>
                    {/if}
                  </div>

                  <span class="kb-card-access" title="Access count">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {entry.access_count}
                  </span>
                  <time class="kb-card-time" datetime={entry.updated_at}>{formatRelative(entry.updated_at)}</time>
                </div>
              </button>
            {/each}
          </div>

          <!-- Pagination -->
          {#if memoryStore.totalPages > 1}
            <div class="kb-pagination">
              <button
                class="kb-page-btn"
                onclick={() => memoryStore.prevPage()}
                disabled={!memoryStore.hasPrevPage}
                aria-label="Previous page"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span class="kb-page-info">
                {memoryStore.page} / {memoryStore.totalPages}
              </span>
              <button
                class="kb-page-btn"
                onclick={() => memoryStore.nextPage()}
                disabled={!memoryStore.hasNextPage}
                aria-label="Next page"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          {/if}

        {:else}
          <!-- ── Graph view ─────────────────────────────────────────────── -->
          <div class="kb-graph-wrap">
            <!-- Category legend -->
            <div class="kb-graph-legend">
              {#each STAT_CATS as cat (cat)}
                {@const c = memoryStore.byCategory.get(cat) ?? 0}
                {#if c > 0}
                  <span class="kb-legend-item">
                    <span class="kb-legend-dot" style="background: {CATEGORY_META[cat].color};"></span>
                    {CATEGORY_META[cat].label}
                  </span>
                {/if}
              {/each}
            </div>

            <div class="kb-graph-scroll">
              <svg
                class="kb-graph-svg"
                width={graphLayout.svgW}
                height={graphLayout.svgH}
                aria-label="Knowledge graph"
                role="img"
              >
                <!-- Edges -->
                {#each graphEdges as edge (edge.key)}
                  <line
                    x1={edge.x1} y1={edge.y1}
                    x2={edge.x2} y2={edge.y2}
                    class="kb-edge"
                  />
                {/each}

                <!-- Nodes -->
                {#each graphLayout.nodes as node (node.entry.id)}
                  {@const meta = CATEGORY_META[node.entry.category]}
                  {@const isSelected = memoryStore.selected?.id === node.entry.id}
                  <g
                    class="kb-graph-node"
                    class:kb-graph-node--selected={isSelected}
                    transform="translate({node.x},{node.y})"
                    role="button"
                    tabindex="0"
                    aria-label={node.entry.key}
                    aria-pressed={isSelected}
                    onclick={() => selectEntry(node.entry)}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectEntry(node.entry); } }}
                  >
                    <!-- Node background -->
                    <rect
                      width={NODE_W} height={NODE_H}
                      rx="6"
                      fill={meta.bg}
                      stroke={isSelected ? meta.color : meta.border}
                      stroke-width={isSelected ? 2 : 1}
                    />
                    <!-- Category dot -->
                    <circle cx="12" cy="14" r="4" fill={meta.color} />
                    <!-- Key text -->
                    <text
                      x="22" y="16"
                      class="kb-node-key"
                      fill="var(--text-primary)"
                    >
                      {truncate(node.entry.key.split('.').pop() ?? node.entry.key, 16)}
                    </text>
                    <!-- Agent text -->
                    <text
                      x="22" y="32"
                      class="kb-node-agent"
                      fill="var(--text-tertiary)"
                    >
                      {truncate(node.entry.agent_name, 18)}
                    </text>
                    <!-- Confidence -->
                    <text
                      x={NODE_W - 8} y="16"
                      class="kb-node-conf"
                      fill={confidenceColor(node.entry.confidence)}
                      text-anchor="end"
                    >
                      {confidencePct(node.entry.confidence)}
                    </text>
                  </g>
                {/each}
              </svg>
            </div>
          </div>
        {/if}
      </div>

      <!-- ── Detail panel ──────────────────────────────────────────────────── -->
      {#if memoryStore.selected}
        {@const sel = memoryStore.selected}
        {@const meta = CATEGORY_META[sel.category]}
        {@const related = memoryStore.getRelated(sel.id)}

        <aside class="kb-detail" aria-label="Entry detail">
          <!-- Header -->
          <div class="kb-detail-header">
            <div class="kb-detail-title-row">
              <span
                class="kb-badge kb-badge--lg"
                style="color: {meta.color}; background: {meta.bg}; border-color: {meta.border};"
              >
                {meta.label}
              </span>
              <button
                class="kb-detail-close"
                onclick={clearSelection}
                aria-label="Close detail panel"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <h2 class="kb-detail-key">{sel.key}</h2>
            <p class="kb-detail-agent">{sel.agent_name} · {formatRelative(sel.updated_at)}</p>
          </div>

          <!-- Full value -->
          <div class="kb-detail-section">
            <h3 class="kb-detail-section-title">Value</h3>
            <pre class="kb-detail-value"><code>{prettyValue(sel)}</code></pre>
          </div>

          <!-- Metadata grid -->
          <div class="kb-detail-section">
            <h3 class="kb-detail-section-title">Metadata</h3>
            <dl class="kb-detail-meta">
              <div class="kb-meta-row">
                <dt>Confidence</dt>
                <dd>
                  <div class="kb-conf-bar kb-conf-bar--wide">
                    <div
                      class="kb-conf-fill"
                      style="width: {confidencePct(sel.confidence)}; background: {confidenceColor(sel.confidence)};"
                    ></div>
                  </div>
                  <span style="color: {confidenceColor(sel.confidence)}; font-weight: 600;">{confidencePct(sel.confidence)}</span>
                </dd>
              </div>
              <div class="kb-meta-row">
                <dt>Source</dt>
                <dd class="kb-meta-mono">{sel.source}</dd>
              </div>
              <div class="kb-meta-row">
                <dt>Namespace</dt>
                <dd class="kb-meta-mono">{sel.namespace}</dd>
              </div>
              <div class="kb-meta-row">
                <dt>Access count</dt>
                <dd>{sel.access_count.toLocaleString()}</dd>
              </div>
              <div class="kb-meta-row">
                <dt>Created</dt>
                <dd><time datetime={sel.created_at}>{formatRelative(sel.created_at)}</time></dd>
              </div>
              <div class="kb-meta-row">
                <dt>Updated</dt>
                <dd><time datetime={sel.updated_at}>{formatRelative(sel.updated_at)}</time></dd>
              </div>
            </dl>
          </div>

          <!-- Tags -->
          {#if sel.tags.length > 0}
            <div class="kb-detail-section">
              <h3 class="kb-detail-section-title">Tags</h3>
              <div class="kb-tags kb-tags--wrap">
                {#each sel.tags as tag (tag)}
                  <span class="kb-tag">{tag}</span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Related entries -->
          {#if related.length > 0}
            <div class="kb-detail-section">
              <h3 class="kb-detail-section-title">Related ({related.length})</h3>
              <ul class="kb-related-list">
                {#each related as rel (rel.id)}
                  {@const relMeta = CATEGORY_META[rel.category]}
                  <li>
                    <button
                      class="kb-related-item"
                      onclick={() => selectEntry(rel)}
                      aria-label="View related entry: {rel.key}"
                    >
                      <span
                        class="kb-badge"
                        style="color: {relMeta.color}; background: {relMeta.bg}; border-color: {relMeta.border};"
                      >
                        {relMeta.label}
                      </span>
                      <span class="kb-related-key">{rel.key}</span>
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Delete -->
          <div class="kb-detail-actions">
            <button
              class="kb-delete-btn"
              onclick={() => handleDelete(sel.id)}
              aria-label="Delete entry: {sel.key}"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
              Delete entry
            </button>
          </div>
        </aside>
      {/if}

    </div><!-- end kb-main -->
  </div><!-- end kb-shell -->
</PageShell>

<style>
  /* ── Shell layout ─────────────────────────────────────────────────────────── */
  .kb-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* ── Toolbar ──────────────────────────────────────────────────────────────── */
  .kb-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px 0;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .kb-search-wrap {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 360px;
  }

  .kb-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    pointer-events: none;
  }

  .kb-search {
    width: 100%;
    height: 32px;
    padding: 0 32px 0 32px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 12px;
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .kb-search::placeholder {
    color: var(--text-tertiary);
  }

  .kb-search:focus {
    border-color: var(--border-focus);
  }

  .kb-search-spinner {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-default);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: kb-spin 600ms linear infinite;
  }

  .kb-cats {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .kb-cat-tab {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-xs);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .kb-cat-tab:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .kb-cat-tab--active {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .kb-cat-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--bg-elevated);
    border-radius: var(--radius-full);
    font-size: 10px;
    color: var(--text-tertiary);
  }

  /* ── Stats row ────────────────────────────────────────────────────────────── */
  .kb-stats {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .kb-stat {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }

  .kb-stat-val {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .kb-stat-lbl {
    font-size: 11px;
    color: var(--text-tertiary);
  }

  .kb-stat-sep {
    width: 1px;
    height: 14px;
    background: var(--border-default);
    flex-shrink: 0;
  }

  .kb-stat-pill {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    border: 1px solid;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }

  /* ── Main split ───────────────────────────────────────────────────────────── */
  .kb-main {
    display: flex;
    flex: 1;
    overflow: hidden;
    gap: 0;
  }

  .kb-viewport {
    flex: 1;
    overflow-y: auto;
    padding: 12px 20px 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--border-default) transparent;
  }

  .kb-viewport::-webkit-scrollbar { width: 5px; }
  .kb-viewport::-webkit-scrollbar-track { background: transparent; }
  .kb-viewport::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }

  /* ── Skeletons ────────────────────────────────────────────────────────────── */
  .kb-skeletons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .kb-skeleton {
    height: 84px;
    border-radius: var(--radius-sm);
    background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-tertiary) 50%, var(--bg-elevated) 75%);
    background-size: 200% 100%;
    animation: kb-shimmer 1.4s ease infinite;
  }

  /* ── Empty / error state ──────────────────────────────────────────────────── */
  .kb-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 200px;
    color: var(--text-tertiary);
    font-size: 13px;
  }

  .kb-empty svg {
    opacity: 0.4;
  }

  /* ── List view ────────────────────────────────────────────────────────────── */
  .kb-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .kb-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 12px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    text-align: left;
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .kb-card:hover {
    border-color: var(--border-hover);
    background: rgba(255,255,255,0.05);
  }

  .kb-card--selected {
    border-color: var(--accent-primary);
    background: rgba(59,130,246,0.06);
  }

  .kb-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .kb-card-key {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    font-family: var(--font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .kb-card-agent {
    font-size: 11px;
    color: var(--text-tertiary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .kb-card-value {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin: 0;
  }

  .kb-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* ── Confidence bar ───────────────────────────────────────────────────────── */
  .kb-conf-bar {
    width: 48px;
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .kb-conf-bar--wide {
    flex: 1;
    height: 5px;
  }

  .kb-conf-fill {
    height: 100%;
    border-radius: 2px;
    transition: width var(--transition-normal);
  }

  .kb-conf-label {
    font-size: 10px;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  /* ── Tags ─────────────────────────────────────────────────────────────────── */
  .kb-tags {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .kb-tags--wrap {
    flex-wrap: wrap;
    overflow: visible;
  }

  .kb-tag {
    display: inline-flex;
    align-items: center;
    height: 16px;
    padding: 0 6px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    font-size: 10px;
    color: var(--text-tertiary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .kb-tag--more {
    color: var(--text-muted);
  }

  .kb-card-access {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .kb-card-time {
    font-size: 11px;
    color: var(--text-tertiary);
    flex-shrink: 0;
    margin-left: auto;
  }

  /* ── Pagination ───────────────────────────────────────────────────────────── */
  .kb-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px 0 4px;
  }

  .kb-page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .kb-page-btn:hover:not(:disabled) {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .kb-page-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .kb-page-info {
    font-size: 12px;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  /* ── Graph view ───────────────────────────────────────────────────────────── */
  .kb-graph-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .kb-graph-legend {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .kb-legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-secondary);
  }

  .kb-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .kb-graph-scroll {
    overflow-x: auto;
    overflow-y: auto;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    scrollbar-width: thin;
    scrollbar-color: var(--border-default) transparent;
  }

  .kb-graph-svg {
    display: block;
  }

  .kb-edge {
    stroke: var(--border-hover);
    stroke-width: 1;
    stroke-dasharray: 4 3;
    opacity: 0.5;
  }

  .kb-graph-node {
    cursor: pointer;
    outline: none;
  }

  .kb-graph-node:focus rect {
    stroke-width: 2;
  }

  :global(.kb-graph-node--selected rect) {
    filter: drop-shadow(0 0 6px rgba(59,130,246,0.4));
  }

  .kb-node-key {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    dominant-baseline: middle;
  }

  .kb-node-agent {
    font-family: var(--font-sans);
    font-size: 9px;
    dominant-baseline: middle;
  }

  .kb-node-conf {
    font-family: var(--font-sans);
    font-size: 9px;
    font-weight: 600;
    dominant-baseline: middle;
  }

  /* ── Detail panel ─────────────────────────────────────────────────────────── */
  .kb-detail {
    width: 340px;
    flex-shrink: 0;
    border-left: 1px solid var(--border-default);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-default) transparent;
  }

  .kb-detail::-webkit-scrollbar { width: 5px; }
  .kb-detail::-webkit-scrollbar-track { background: transparent; }
  .kb-detail::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }

  .kb-detail-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .kb-detail-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .kb-detail-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-xs);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .kb-detail-close:hover {
    background: var(--bg-elevated);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .kb-detail-key {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px;
    word-break: break-all;
  }

  .kb-detail-agent {
    font-size: 11px;
    color: var(--text-tertiary);
    margin: 0;
  }

  .kb-detail-section {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-default);
  }

  .kb-detail-section:last-of-type {
    border-bottom: none;
  }

  .kb-detail-section-title {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 10px;
  }

  .kb-detail-value {
    margin: 0;
    padding: 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
  }

  /* ── Metadata dl ──────────────────────────────────────────────────────────── */
  .kb-detail-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
  }

  .kb-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .kb-meta-row dt {
    font-size: 11px;
    color: var(--text-tertiary);
    width: 90px;
    flex-shrink: 0;
  }

  .kb-meta-row dd {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
    flex: 1;
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kb-meta-mono {
    font-family: var(--font-mono);
    font-size: 11px !important;
  }

  /* ── Related entries ──────────────────────────────────────────────────────── */
  .kb-related-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .kb-related-item {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 7px 8px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .kb-related-item:hover {
    background: var(--bg-elevated);
    border-color: var(--border-hover);
  }

  .kb-related-key {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Badge ────────────────────────────────────────────────────────────────── */
  .kb-badge {
    display: inline-flex;
    align-items: center;
    height: 18px;
    padding: 0 7px;
    border: 1px solid;
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .kb-badge--lg {
    height: 22px;
    padding: 0 9px;
    font-size: 11px;
  }

  /* ── Delete ───────────────────────────────────────────────────────────────── */
  .kb-detail-actions {
    padding: 14px 16px;
    border-top: 1px solid var(--border-default);
    margin-top: auto;
    flex-shrink: 0;
  }

  .kb-delete-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: var(--radius-xs);
    color: #fca5a5;
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .kb-delete-btn:hover {
    background: rgba(239,68,68,0.15);
    border-color: rgba(239,68,68,0.4);
    color: #f87171;
  }

  /* ── Header action buttons ────────────────────────────────────────────────── */
  .kb-view-toggle {
    display: flex;
    align-items: center;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    overflow: hidden;
  }

  .kb-view-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 9px;
    background: transparent;
    border: none;
    border-right: 1px solid var(--border-default);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .kb-view-btn:last-child {
    border-right: none;
  }

  .kb-view-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .kb-view-btn--active {
    background: rgba(59,130,246,0.15);
    color: #60a5fa;
  }

  .kb-refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .kb-refresh-btn:hover:not(:disabled) {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .kb-refresh-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* ── Animations ───────────────────────────────────────────────────────────── */
  @keyframes kb-spin {
    from { transform: translateY(-50%) rotate(0deg); }
    to   { transform: translateY(-50%) rotate(360deg); }
  }

  .kb-spinning {
    animation: kb-spin-simple 600ms linear infinite;
  }

  @keyframes kb-spin-simple {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @keyframes kb-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
