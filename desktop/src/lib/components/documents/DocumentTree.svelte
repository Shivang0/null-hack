<!-- src/lib/components/documents/DocumentTree.svelte -->
<!-- Recursive file tree sidebar for documents -->
<script lang="ts">
  import type { DocumentTreeNode, Document } from '$api/types';
  import { documentsStore } from '$lib/stores/documents.svelte';

  interface Props {
    nodes: DocumentTreeNode[];
    depth?: number;
  }

  let { nodes, depth = 0 }: Props = $props();

  // Track expanded folders
  let expanded = $state<Record<string, boolean>>({});

  $effect(() => {
    // Expand root-level folders by default
    if (depth === 0) {
      for (const n of nodes) {
        if (n.type === 'directory' && !(n.path in expanded)) {
          expanded[n.path] = true;
        }
      }
    }
  });

  function toggleFolder(path: string) {
    expanded[path] = !expanded[path];
  }

  function selectFile(node: DocumentTreeNode) {
    const doc = documentsStore.getByPath(node.path);
    if (doc) {
      documentsStore.selectDocument(doc);
    } else {
      // Create a placeholder document from the node
      documentsStore.selectDocument({
        id: node.path,
        title: node.name,
        path: node.path,
        content: '',
        format: 'markdown',
        project_id: null,
        last_edited_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies Document);
    }
  }

  // File extension → icon path
  function fileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
      case 'mdx':
        return 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM6 2l2 2M14 2v6h6';
      case 'yaml':
      case 'yml':
      case 'json':
        return 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM12 18v-6M9 15l3 3 3-3';
      case 'txt':
        return 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5';
      default:
        return 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6';
    }
  }
</script>

<ul
  class="dt-list"
  role={depth === 0 ? 'tree' : 'group'}
  aria-label={depth === 0 ? 'Document tree' : undefined}
  style="--depth: {depth}"
>
  {#each nodes as node (node.path)}
    <li
      class="dt-node"
      role="treeitem"
      aria-expanded={node.type === 'directory' ? (expanded[node.path] ?? false) : undefined}
      aria-selected={node.type === 'file' && documentsStore.selected?.path === node.path}
    >
      {#if node.type === 'directory'}
        <button
          class="dt-item dt-item--dir"
          onclick={() => toggleFolder(node.path)}
          aria-label="{expanded[node.path] ? 'Collapse' : 'Expand'} folder {node.name}"
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            class="dt-chevron"
            class:dt-chevron--open={expanded[node.path]}
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            {#if expanded[node.path]}
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            {:else}
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            {/if}
          </svg>
          <span class="dt-name">{node.name}</span>
        </button>

        {#if expanded[node.path] && node.children && node.children.length > 0}
          <div class="dt-children">
            <svelte:self nodes={node.children} depth={depth + 1} />
          </div>
        {/if}
      {:else}
        <button
          class="dt-item dt-item--file"
          class:dt-item--active={documentsStore.selected?.path === node.path}
          onclick={() => selectFile(node)}
          aria-label="Open document {node.name}"
          type="button"
        >
          <span class="dt-indent" aria-hidden="true"></span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d={fileIcon(node.name)} />
          </svg>
          <span class="dt-name">{node.name}</span>
        </button>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .dt-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .dt-node {
    display: flex;
    flex-direction: column;
  }

  .dt-item {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 8px 0 calc(8px + var(--depth, 0) * 14px);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    border-radius: var(--radius-xs);
    text-align: left;
    width: 100%;
    transition: background 100ms, color 100ms;
  }

  .dt-item:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
  .dt-item:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: -1px; }

  .dt-item--dir { color: var(--text-secondary); }

  .dt-item--file { padding-left: calc(26px + var(--depth, 0) * 14px); }

  .dt-item--active {
    background: rgba(59,130,246,0.1);
    color: #93c5fd;
  }
  .dt-item--active:hover { background: rgba(59,130,246,0.14); }

  .dt-chevron {
    transform: rotate(0deg);
    transition: transform 150ms ease;
    flex-shrink: 0;
    color: var(--text-muted);
  }
  .dt-chevron--open { transform: rotate(90deg); }

  .dt-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .dt-indent {
    width: 2px;
    flex-shrink: 0;
  }

  .dt-children {
    padding-left: 14px;
    border-left: 1px solid var(--border-default);
    margin-left: 15px;
  }
</style>
