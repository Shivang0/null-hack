<!-- src/lib/components/logs/LogViewer.svelte -->
<!-- Virtual-scrolled log viewer with auto-scroll and jump-to-latest -->
<script lang="ts">
  import { tick } from 'svelte';
  import { logsStore } from '$lib/stores/logs.svelte';
  import LogEntry from './LogEntry.svelte';

  // ── Virtual scroll config ────────────────────────────────────────
  const ROW_HEIGHT = 26; // px per collapsed row
  const OVERSCAN   = 8;  // extra rows rendered above/below viewport

  // ── DOM refs ─────────────────────────────────────────────────────
  let scrollEl = $state<HTMLElement | null>(null);

  // ── Scroll state ─────────────────────────────────────────────────
  let scrollTop  = $state(0);
  let clientHeight = $state(0);

  // Track whether user has scrolled away from bottom
  let userScrolledUp = $state(false);
  let isScrollingProgrammatically = false;

  // ── Expanded rows ─────────────────────────────────────────────────
  let expandedIds = $state<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedIds = next;
  }

  // ── Entries (newest first → display reversed for log convention) ──
  // The store keeps newest-first. We display oldest-first (bottom = newest).
  let displayEntries = $derived([...logsStore.filteredEntries].reverse());

  // ── Virtual window ────────────────────────────────────────────────
  // Because expanded rows vary in height, we use a simplified approach:
  // render a fixed-height phantom div for total height, and absolutely
  // position a window of rows. Expanded rows push everything down via
  // a height offset map.
  //
  // For simplicity (and since most rows are 26px), we compute start/end
  // purely on ROW_HEIGHT and only render expanded rows with their full height.

  let totalHeight = $derived(displayEntries.length * ROW_HEIGHT);

  let startIdx = $derived(
    Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  );

  let endIdx = $derived(
    Math.min(
      displayEntries.length,
      Math.ceil((scrollTop + clientHeight) / ROW_HEIGHT) + OVERSCAN
    )
  );

  let visibleEntries = $derived(
    displayEntries.slice(startIdx, endIdx)
  );

  let offsetTop = $derived(startIdx * ROW_HEIGHT);

  // ── Auto-scroll to bottom ─────────────────────────────────────────
  $effect(() => {
    // Access length to make this effect reactive to new entries
    if (displayEntries.length >= 0 && !logsStore.isPaused && !userScrolledUp && scrollEl) {
      scrollToBottom();
    }
  });

  async function scrollToBottom() {
    await tick();
    if (!scrollEl) return;
    isScrollingProgrammatically = true;
    scrollEl.scrollTop = scrollEl.scrollHeight;
    // Reset flag after the scroll event fires
    requestAnimationFrame(() => {
      isScrollingProgrammatically = false;
    });
  }

  function jumpToLatest() {
    userScrolledUp = false;
    logsStore.isPaused = false;
    void scrollToBottom();
  }

  function handleScroll() {
    if (!scrollEl) return;
    scrollTop = scrollEl.scrollTop;
    clientHeight = scrollEl.clientHeight;

    if (isScrollingProgrammatically) return;

    const atBottom =
      scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 32;

    if (atBottom) {
      userScrolledUp = false;
    } else {
      userScrolledUp = true;
    }
  }

  function handleResize(node: HTMLElement) {
    const ro = new ResizeObserver(() => {
      if (scrollEl) clientHeight = scrollEl.clientHeight;
    });
    ro.observe(node);
    clientHeight = node.clientHeight;
    return {
      destroy() { ro.disconnect(); }
    };
  }

  // Show "jump to latest" when paused or scrolled up and there are entries
  let showJumpBtn = $derived(
    (userScrolledUp || logsStore.isPaused) && displayEntries.length > 0
  );
</script>

<div
  class="lv-wrap"
  use:handleResize
>
  {#if displayEntries.length === 0}
    <div class="lv-empty" role="status">
      {#if logsStore.loading}
        <span class="lv-empty-text">Loading logs...</span>
      {:else if logsStore.error}
        <span class="lv-empty-text lv-empty-text--error">{logsStore.error}</span>
      {:else}
        <span class="lv-empty-text">No log entries match the current filters.</span>
      {/if}
    </div>
  {:else}
    <!-- Column header -->
    <div class="lv-header" aria-hidden="true">
      <span class="lv-hcol lv-hcol--lineno">#</span>
      <span class="lv-hcol lv-hcol--time">Time</span>
      <span class="lv-hcol lv-hcol--level">Lvl</span>
      <span class="lv-hcol lv-hcol--source">Source</span>
      <span class="lv-hcol lv-hcol--msg">Message</span>
    </div>

    <!-- Scroll container -->
    <div
      class="lv-scroll"
      bind:this={scrollEl}
      onscroll={handleScroll}
      role="log"
      aria-label="Log entries"
      aria-live="polite"
      aria-atomic="false"
    >
      <!-- Phantom div that makes the scrollbar represent true total height -->
      <div class="lv-phantom" style:height="{totalHeight}px" aria-hidden="true"></div>

      <!-- Visible window, absolutely positioned -->
      <div
        class="lv-window"
        style:transform="translateY({offsetTop}px)"
      >
        {#each visibleEntries as entry, i (entry.id)}
          <LogEntry
            {entry}
            lineNumber={startIdx + i + 1}
            isExpanded={expandedIds.has(entry.id)}
            onToggle={() => toggleExpanded(entry.id)}
          />
        {/each}
      </div>
    </div>
  {/if}

  <!-- Jump to latest floating button -->
  {#if showJumpBtn}
    <button
      class="lv-jump-btn"
      onclick={jumpToLatest}
      aria-label="Jump to latest log entry"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
      Jump to latest
    </button>
  {/if}
</div>

<style>
  /* ── Outer container ─────────────────────────────────────────────── */
  .lv-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    background: #0d0d0d;
    overflow: hidden;
  }

  /* ── Empty state ─────────────────────────────────────────────────── */
  .lv-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px;
  }

  .lv-empty-text {
    font-size: 13px;
    color: var(--text-tertiary);
    font-family: var(--font-mono);
  }

  .lv-empty-text--error {
    color: #fca5a5;
  }

  /* ── Column header ───────────────────────────────────────────────── */
  .lv-header {
    display: grid;
    grid-template-columns: 48px 80px 36px 120px 1fr;
    gap: 8px;
    padding: 4px 12px;
    border-bottom: 1px solid var(--border-default);
    background: rgba(0, 0, 0, 0.4);
    flex-shrink: 0;
  }

  .lv-hcol {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--text-muted);
    font-family: var(--font-sans);
    user-select: none;
  }

  .lv-hcol--lineno { text-align: right; }

  /* ── Scroll container ────────────────────────────────────────────── */
  .lv-scroll {
    position: relative;
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    /* Custom dark scrollbar */
  }

  .lv-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .lv-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .lv-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .lv-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  /* ── Virtual scroll phantom + window ────────────────────────────── */
  .lv-phantom {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    pointer-events: none;
  }

  .lv-window {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    will-change: transform;
  }

  /* ── Jump to latest button ───────────────────────────────────────── */
  .lv-jump-btn {
    position: absolute;
    bottom: 16px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: var(--radius-full);
    border: 1px solid rgba(59, 130, 246, 0.4);
    background: rgba(59, 130, 246, 0.18);
    color: #93c5fd;
    font-size: 12px;
    font-family: var(--font-sans);
    font-weight: 500;
    cursor: pointer;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    transition: all 120ms ease;
    z-index: 10;
  }

  .lv-jump-btn:hover {
    background: rgba(59, 130, 246, 0.28);
    border-color: rgba(59, 130, 246, 0.6);
    color: #bfdbfe;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  }
</style>
