<!-- src/lib/components/layout/CommandPalette.svelte -->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { paletteStore } from '$lib/stores/palette.svelte';

  // ─── Local state ─────────────────────────────────────────────────────────────
  let inputEl = $state<HTMLInputElement | null>(null);
  let selectedIndex = $state(0);

  // ─── Result type ─────────────────────────────────────────────────────────────
  interface ResultItem {
    id: string;
    name: string;
    description?: string;
    shortcut?: string;
    icon?: string;
    type: string;
    action: () => void;
  }

  // ─── Merged results list ──────────────────────────────────────────────────────
  const allResults = $derived.by((): ResultItem[] => {
    const items: ResultItem[] = [];

    for (const cmd of paletteStore.filteredCommands) {
      items.push({
        id: cmd.id,
        name: cmd.name,
        description: cmd.description,
        shortcut: cmd.shortcut,
        icon: cmd.icon,
        type: 'Command',
        action: cmd.action,
      });
    }

    if (paletteStore.query) {
      const q = paletteStore.query.toLowerCase();
      for (const source of paletteStore.searchSources) {
        const matching = source.items().filter((item) =>
          item.name.toLowerCase().includes(q),
        );
        for (const item of matching.slice(0, 5)) {
          items.push({
            id: `${source.type}-${item.id}`,
            name: item.name,
            description: item.description,
            type: source.type,
            action: () => source.action(item),
          });
        }
      }
    }

    return items;
  });

  // Reset selection cursor whenever the result set changes
  $effect(() => {
    // Track allResults length + query to trigger reset
    void allResults.length;
    void paletteStore.query;
    selectedIndex = 0;
  });

  // Focus input whenever palette opens
  $effect(() => {
    if (paletteStore.isOpen) {
      // rAF ensures the DOM is mounted before we focus
      requestAnimationFrame(() => inputEl?.focus());
    }
  });

  // ─── Keyboard navigation ─────────────────────────────────────────────────────
  function handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        paletteStore.close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, allResults.length - 1);
        scrollSelectedIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollSelectedIntoView();
        break;
      case 'Enter': {
        e.preventDefault();
        const item = allResults[selectedIndex];
        if (item) {
          item.action();
          paletteStore.close();
        }
        break;
      }
    }
  }

  function execute(index: number): void {
    allResults[index]?.action();
    paletteStore.close();
  }

  // Keep the selected row visible as the user arrows through the list
  function scrollSelectedIntoView(): void {
    // Use rAF so selectedIndex has propagated to the DOM class before we scroll
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('.cp-result--selected');
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  // Close when clicking the overlay backdrop
  function handleBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('cp-overlay')) {
      paletteStore.close();
    }
  }
</script>

{#if paletteStore.isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="cp-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Command palette"
    tabindex="-1"
    transition:fade={{ duration: 150 }}
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
  >
    <div
      class="cp-card"
      in:fly={{ y: -12, duration: 200, easing: cubicOut }}
      out:fly={{ y: -8, duration: 120, easing: cubicOut }}
    >
      <!-- ── Search row ──────────────────────────────────────────────────────── -->
      <div class="cp-search-row" role="search">
        <svg
          class="cp-search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        <input
          bind:this={inputEl}
          bind:value={paletteStore.query}
          class="cp-input"
          type="text"
          placeholder="Search commands, agents, issues..."
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={allResults.length > 0}
          aria-controls="cp-results"
          aria-activedescendant={allResults[selectedIndex]
            ? `cp-result-${allResults[selectedIndex].id}`
            : undefined}
        />

        {#if paletteStore.query}
          <button
            class="cp-clear"
            onclick={() => { paletteStore.query = ''; inputEl?.focus(); }}
            aria-label="Clear search"
            tabindex="-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- ── Divider ─────────────────────────────────────────────────────────── -->
      <div class="cp-divider" role="separator" aria-hidden="true"></div>

      <!-- ── Results ────────────────────────────────────────────────────────── -->
      <ul
        id="cp-results"
        class="cp-results"
        role="listbox"
        aria-label="Command results"
      >
        {#if allResults.length === 0}
          <li class="cp-empty" role="option" aria-selected="false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="cp-empty-icon">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span>No results for <em class="cp-empty-query">"{paletteStore.query || 'your search'}"</em></span>
          </li>
        {:else}
          {#each allResults as item, i (item.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <li
              id="cp-result-{item.id}"
              class="cp-result {i === selectedIndex ? 'cp-result--selected' : ''}"
              role="option"
              aria-selected={i === selectedIndex}
              onclick={() => execute(i)}
              onmouseenter={() => { selectedIndex = i; }}
            >
              <!-- Type badge -->
              <span class="cp-type-badge" aria-label="Type: {item.type}">{item.type}</span>

              <!-- Name + description -->
              <span class="cp-result-body">
                <span class="cp-result-name">{item.name}</span>
                {#if item.description}
                  <span class="cp-result-desc">{item.description}</span>
                {/if}
              </span>

              <!-- Shortcut -->
              {#if item.shortcut}
                <span class="cp-shortcut" aria-label="Shortcut: {item.shortcut}">{item.shortcut}</span>
              {/if}
            </li>
          {/each}
        {/if}
      </ul>

      <!-- ── Footer hint ─────────────────────────────────────────────────────── -->
      <div class="cp-footer" role="status" aria-live="polite" aria-atomic="true">
        <span class="cp-hint"><kbd>↑↓</kbd> navigate</span>
        <span class="cp-hint"><kbd>↵</kbd> select</span>
        <span class="cp-hint"><kbd>Esc</kbd> close</span>
        {#if allResults.length > 0}
          <span class="cp-count">{allResults.length} result{allResults.length === 1 ? '' : 's'}</span>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* ── Overlay ──────────────────────────────────────────────────────────────── */
  .cp-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 20vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  /* ── Palette card ─────────────────────────────────────────────────────────── */
  .cp-card {
    width: 100%;
    max-width: 560px;
    margin: 0 16px;
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--border-default);
    box-shadow:
      0 24px 64px rgba(0, 0, 0, 0.6),
      0 4px 16px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  /* ── Search row ───────────────────────────────────────────────────────────── */
  .cp-search-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    height: 48px;
  }

  .cp-search-icon {
    flex-shrink: 0;
    color: var(--text-tertiary);
  }

  .cp-input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--text-primary);
    caret-color: var(--accent-primary);
  }

  .cp-input::placeholder {
    color: var(--text-tertiary);
  }

  .cp-clear {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: var(--bg-elevated);
    border-radius: var(--radius-xs);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: color var(--transition-fast) ease, background var(--transition-fast) ease;
  }

  .cp-clear:hover {
    color: var(--text-primary);
    background: var(--border-hover);
  }

  /* ── Divider ──────────────────────────────────────────────────────────────── */
  .cp-divider {
    height: 1px;
    background: var(--border-default);
    margin: 0;
  }

  /* ── Results list ─────────────────────────────────────────────────────────── */
  .cp-results {
    list-style: none;
    max-height: 360px;
    overflow-y: auto;
    padding: 4px 0;
    scroll-padding: 4px;
  }

  /* ── Empty state ──────────────────────────────────────────────────────────── */
  .cp-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 16px;
    font-size: 13px;
    color: var(--text-tertiary);
    text-align: center;
  }

  .cp-empty-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .cp-empty-query {
    font-style: normal;
    color: var(--text-secondary);
  }

  /* ── Result row ───────────────────────────────────────────────────────────── */
  .cp-result {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 12px;
    cursor: pointer;
    border-left: 2px solid transparent;
    transition:
      background var(--transition-fast) ease,
      border-color var(--transition-fast) ease;
  }

  .cp-result:hover,
  .cp-result--selected {
    background: var(--bg-elevated);
  }

  .cp-result--selected {
    border-left-color: var(--accent-primary);
  }

  /* ── Type badge ───────────────────────────────────────────────────────────── */
  .cp-type-badge {
    flex-shrink: 0;
    width: 56px;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
    padding-right: 4px;
  }

  .cp-result--selected .cp-type-badge {
    color: var(--text-tertiary);
  }

  /* ── Name + description ───────────────────────────────────────────────────── */
  .cp-result-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-width: 0;
    gap: 1px;
    padding: 6px 0;
  }

  .cp-result-name {
    font-size: 14px;
    font-weight: 450;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  .cp-result--selected .cp-result-name {
    color: #ffffff;
  }

  .cp-result-desc {
    font-size: 12px;
    color: var(--text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  /* ── Keyboard shortcut ────────────────────────────────────────────────────── */
  .cp-shortcut {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-xs);
    padding: 2px 5px;
    white-space: nowrap;
    transition: color var(--transition-fast) ease, background var(--transition-fast) ease;
  }

  .cp-result--selected .cp-shortcut {
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--border-hover);
  }

  /* ── Footer ───────────────────────────────────────────────────────────────── */
  .cp-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 32px;
    padding: 0 14px;
    border-top: 1px solid var(--border-default);
    background: rgba(0, 0, 0, 0.15);
  }

  .cp-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .cp-hint kbd {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 3px;
    padding: 1px 4px;
    line-height: 1.4;
  }

  .cp-count {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-muted);
  }
</style>
