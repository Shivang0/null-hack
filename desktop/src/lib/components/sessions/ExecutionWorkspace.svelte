<!-- src/lib/components/sessions/ExecutionWorkspace.svelte -->
<!-- Split-pane execution viewer: transcript left, tool outputs/file changes right -->
<script lang="ts">
  import type { Session, Message } from '$lib/api/types';
  import SessionTranscript from './SessionTranscript.svelte';

  interface ToolOutput {
    tool_use_id: string;
    tool_name: string;
    result: string;
    is_error: boolean;
    timestamp: string;
  }

  interface Props {
    session: Session;
    messages: Message[];
    transcriptLoading?: boolean;
    isLive?: boolean;
  }

  let { session, messages, transcriptLoading = false, isLive = false }: Props = $props();

  // Active right-panel tab
  type RightTab = 'outputs' | 'files' | 'terminal';
  let activeTab = $state<RightTab>('outputs');

  // Draggable split pane
  let splitPct = $state(50); // percentage for left panel
  let isDragging = $state(false);
  let containerEl = $state<HTMLDivElement | null>(null);

  function startDrag(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging || !containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const raw = ((e.clientX - rect.left) / rect.width) * 100;
    splitPct = Math.min(75, Math.max(25, raw));
  }

  function stopDrag() {
    isDragging = false;
  }

  // Extract tool outputs from messages
  const toolOutputs = $derived.by((): ToolOutput[] => {
    const outputs: ToolOutput[] = [];
    for (const msg of messages) {
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          outputs.push({
            tool_use_id: tc.id,
            tool_name: tc.name,
            result: JSON.stringify(tc.input, null, 2),
            is_error: false,
            timestamp: msg.timestamp,
          });
        }
      }
    }
    return outputs;
  });

  // Extract file path mentions from tool call inputs (heuristic)
  const fileMentions = $derived.by((): string[] => {
    const seen = new Set<string>();
    for (const msg of messages) {
      if (!msg.tool_calls) continue;
      for (const tc of msg.tool_calls) {
        const str = JSON.stringify(tc.input);
        const matches = str.match(/["']([^"']+\.[a-zA-Z]{1,6})["']/g) ?? [];
        for (const m of matches) {
          const path = m.replace(/^["']|["']$/g, '');
          if (path.includes('/') || path.includes('.')) {
            seen.add(path);
          }
        }
      }
    }
    return Array.from(seen).slice(0, 20);
  });

  // Format tool name for display
  function fmtToolName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // Tabs config
  const tabs: Array<{ id: RightTab; label: string; count?: number }> = $derived([
    { id: 'outputs', label: 'Tool Outputs', count: toolOutputs.length },
    { id: 'files', label: 'Files', count: fileMentions.length },
    { id: 'terminal', label: 'Terminal' },
  ]);
</script>

<svelte:window
  onmousemove={onMouseMove}
  onmouseup={stopDrag}
  ontouchend={stopDrag}
/>

<div
  class="ew-root"
  bind:this={containerEl}
  class:ew-root--dragging={isDragging}
>
  <!-- Left: Transcript -->
  <div
    class="ew-panel ew-panel--left"
    style="width: {splitPct}%"
    aria-label="Session transcript"
  >
    <SessionTranscript
      {messages}
      loading={transcriptLoading}
      {isLive}
      sessionTitle={session.title ?? session.id}
    />
  </div>

  <!-- Drag handle — role="separator" with aria-valuenow is the WAI-ARIA splitter pattern -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_no_noninteractive_tabindex -->
  <div
    class="ew-divider"
    onmousedown={startDrag}
    ontouchstart={startDrag}
    role="separator"
    aria-orientation="vertical"
    aria-label="Resize panels"
    aria-valuenow={splitPct}
    aria-valuemin={25}
    aria-valuemax={75}
    tabindex="0"
    onkeydown={(e) => {
      if (e.key === 'ArrowLeft') splitPct = Math.max(25, splitPct - 2);
      if (e.key === 'ArrowRight') splitPct = Math.min(75, splitPct + 2);
    }}
  >
    <span class="ew-divider-grip" aria-hidden="true">
      <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
        <circle cx="2" cy="3" r="1.2"/>
        <circle cx="2" cy="8" r="1.2"/>
        <circle cx="2" cy="13" r="1.2"/>
      </svg>
    </span>
  </div>

  <!-- Right: Tool outputs / files / terminal -->
  <div class="ew-panel ew-panel--right" aria-label="Execution outputs">
    <!-- Tab bar -->
    <div class="ew-tabs" role="tablist" aria-label="Output panels">
      {#each tabs as tab (tab.id)}
        <button
          class="ew-tab"
          class:ew-tab--active={activeTab === tab.id}
          onclick={() => (activeTab = tab.id)}
          role="tab"
          id="ew-tab-{tab.id}"
          aria-selected={activeTab === tab.id}
          aria-controls="ew-panel-{tab.id}"
        >
          {tab.label}
          {#if tab.count !== undefined && tab.count > 0}
            <span class="ew-tab-badge" aria-label="{tab.count} items">{tab.count}</span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Panel content -->
    <div class="ew-tab-content">
      {#if activeTab === 'outputs'}
        <div
          class="ew-outputs"
          id="ew-panel-outputs"
          role="tabpanel"
          aria-labelledby="ew-tab-outputs"
        >
          {#if toolOutputs.length === 0}
            <div class="ew-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
              <p>No tool calls in this session</p>
            </div>
          {:else}
            {#each toolOutputs as output (output.tool_use_id)}
              <div class="ew-output-item" class:ew-output-item--error={output.is_error}>
                <div class="ew-output-header">
                  <svg class="ew-tool-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                  </svg>
                  <span class="ew-tool-name">{fmtToolName(output.tool_name)}</span>
                  <time class="ew-tool-time">{formatTime(output.timestamp)}</time>
                </div>
                <pre class="ew-tool-result">{output.result}</pre>
              </div>
            {/each}
          {/if}
        </div>

      {:else if activeTab === 'files'}
        <div
          class="ew-files"
          id="ew-panel-files"
          role="tabpanel"
          aria-labelledby="ew-tab-files"
        >
          {#if fileMentions.length === 0}
            <div class="ew-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>No file activity detected</p>
            </div>
          {:else}
            <div class="ew-file-list" role="list">
              {#each fileMentions as path (path)}
                <div class="ew-file-item" role="listitem">
                  <svg class="ew-file-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span class="ew-file-path" title={path}>{path}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>

      {:else if activeTab === 'terminal'}
        <div
          class="ew-terminal"
          id="ew-panel-terminal"
          role="tabpanel"
          aria-labelledby="ew-tab-terminal"
        >
          <div class="ew-terminal-content" role="log" aria-label="Terminal output" aria-live="off">
            {#each messages as msg (msg.id)}
              {#if msg.tool_calls}
                {#each msg.tool_calls as tc (tc.id)}
                  {#if tc.name === 'bash' || tc.name === 'execute' || tc.name === 'shell'}
                    <div class="ew-terminal-entry">
                      <span class="ew-term-prompt" aria-hidden="true">$ </span>
                      <span class="ew-term-cmd">{(tc.input as Record<string,string>).command ?? JSON.stringify(tc.input)}</span>
                    </div>
                  {/if}
                {/each}
              {/if}
            {/each}
            {#if messages.every((m) => !m.tool_calls?.some((tc) => ['bash', 'execute', 'shell'].includes(tc.name)))}
              <div class="ew-empty ew-empty--terminal">
                <span class="ew-term-prompt" aria-hidden="true">$</span>
                <span>No shell commands in this session</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .ew-root {
    display: flex;
    height: 100%;
    overflow: hidden;
    user-select: none;
  }

  .ew-root--dragging {
    cursor: col-resize;
  }

  /* Panels */
  .ew-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }

  .ew-panel--left {
    border-right: none;
    min-width: 0;
  }

  .ew-panel--right {
    flex: 1;
    min-width: 0;
    border-left: 1px solid var(--border-default);
  }

  /* Drag divider */
  .ew-divider {
    width: 6px;
    background: var(--bg-surface);
    border-left: 1px solid var(--border-default);
    border-right: 1px solid var(--border-default);
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background var(--transition-fast, 150ms) ease;
  }

  .ew-divider:hover,
  .ew-divider:focus-visible {
    background: var(--bg-elevated);
    outline: none;
  }

  .ew-divider-grip {
    color: var(--text-muted, #555);
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  /* Tab bar */
  .ew-tabs {
    display: flex;
    align-items: center;
    padding: 0 12px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
    height: 38px;
    gap: 2px;
  }

  .ew-tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-tertiary);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition:
      color var(--transition-fast, 150ms) ease,
      border-color var(--transition-fast, 150ms) ease;
    font-family: var(--font-sans);
    margin-bottom: -1px;
  }

  .ew-tab:hover {
    color: var(--text-secondary);
  }

  .ew-tab--active {
    color: var(--text-primary);
    border-bottom-color: #3b82f6;
  }

  .ew-tab-badge {
    padding: 1px 5px;
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.12);
    font-size: 10px;
    font-weight: 600;
    color: #93c5fd;
  }

  /* Tab panels */
  .ew-tab-content {
    flex: 1;
    overflow: hidden;
  }

  .ew-outputs,
  .ew-files,
  .ew-terminal {
    height: 100%;
    overflow-y: auto;
    padding: 12px;
  }

  .ew-outputs::-webkit-scrollbar,
  .ew-files::-webkit-scrollbar,
  .ew-terminal::-webkit-scrollbar { width: 4px; }
  .ew-outputs::-webkit-scrollbar-track,
  .ew-files::-webkit-scrollbar-track,
  .ew-terminal::-webkit-scrollbar-track { background: transparent; }
  .ew-outputs::-webkit-scrollbar-thumb,
  .ew-files::-webkit-scrollbar-thumb,
  .ew-terminal::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

  /* Empty state */
  .ew-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 100%;
    min-height: 160px;
    color: var(--text-muted, #555);
    font-size: 12.5px;
  }

  .ew-empty--terminal {
    flex-direction: row;
  }

  /* Tool output item */
  .ew-output-item {
    margin-bottom: 10px;
    border-radius: var(--radius-sm, 6px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
    overflow: hidden;
  }

  .ew-output-item--error {
    border-color: rgba(239, 68, 68, 0.2);
  }

  .ew-output-header {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.02);
  }

  .ew-tool-icon {
    flex-shrink: 0;
    color: var(--text-muted, #555);
  }

  .ew-tool-name {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    font-family: var(--font-mono, ui-monospace, monospace);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ew-tool-time {
    font-size: 10px;
    font-family: var(--font-mono, ui-monospace, monospace);
    color: var(--text-muted, #555);
    flex-shrink: 0;
  }

  .ew-tool-result {
    margin: 0;
    padding: 8px 10px;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--text-secondary);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
  }

  /* File list */
  .ew-file-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .ew-file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: var(--radius-xs, 4px);
    transition: background var(--transition-fast, 150ms) ease;
  }

  .ew-file-item:hover {
    background: var(--bg-elevated);
  }

  .ew-file-icon {
    flex-shrink: 0;
    color: var(--text-tertiary);
  }

  .ew-file-path {
    font-size: 12px;
    font-family: var(--font-mono, ui-monospace, monospace);
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Terminal */
  .ew-terminal-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .ew-terminal-entry {
    display: flex;
    gap: 4px;
    font-size: 12px;
    line-height: 1.5;
  }

  .ew-term-prompt {
    color: rgba(34, 197, 94, 0.7);
    flex-shrink: 0;
    user-select: none;
  }

  .ew-term-cmd {
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
