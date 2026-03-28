<!-- src/lib/components/chat/ChatInput.svelte -->
<!-- Glass-surface textarea with auto-resize, Enter-to-send, stop-generation button -->
<script lang="ts">
  interface Props {
    disabled?: boolean;
    onSend: (text: string) => void;
    onCancel?: () => void;
    placeholder?: string;
    isStreaming?: boolean;
  }

  let {
    disabled = false,
    onSend,
    onCancel,
    placeholder = 'Message NULLHACK…',
    isStreaming = false,
  }: Props = $props();

  let value = $state('');
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  const canSend = $derived(value.trim().length > 0 && !disabled && !isStreaming);

  function autoResize(): void {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 180) + 'px';
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function send(): void {
    const text = value.trim();
    if (!text || disabled || isStreaming) return;
    onSend(text);
    value = '';
    if (textareaEl) {
      textareaEl.style.height = 'auto';
      textareaEl.focus();
    }
  }

  function handleStop(): void {
    onCancel?.();
  }
</script>

<div class="ci-wrap">
  <div class="ci-surface" class:ci-surface--disabled={disabled && !isStreaming}>
    <textarea
      bind:this={textareaEl}
      bind:value
      oninput={autoResize}
      onkeydown={handleKeydown}
      {placeholder}
      disabled={disabled && !isStreaming}
      rows={1}
      aria-label="Message input"
      aria-multiline="true"
      class="ci-textarea"
    ></textarea>

    <div class="ci-actions">
      {#if isStreaming}
        <!-- Stop generation -->
        <button
          class="ci-btn ci-btn--stop"
          onclick={handleStop}
          aria-label="Stop generation"
          title="Stop generation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        </button>
      {:else}
        <!-- Send -->
        <button
          class="ci-btn ci-btn--send"
          onclick={send}
          disabled={!canSend}
          aria-label="Send message"
          title="Send message (Enter)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <p class="ci-hint" aria-hidden="true">Enter to send · Shift+Enter for newline</p>
</div>

<style>
  .ci-wrap {
    padding: 10px 14px 8px;
    border-top: 1px solid var(--border-default);
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .ci-surface {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: var(--glass-bg, rgba(28, 28, 30, 0.8));
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 9px 12px;
    transition: border-color 0.15s ease;
  }

  .ci-surface:focus-within {
    border-color: rgba(59, 130, 246, 0.4);
  }

  .ci-surface--disabled {
    opacity: 0.45;
    pointer-events: none;
  }

  .ci-textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-family: var(--font-sans);
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--text-primary);
    caret-color: var(--accent-primary, #3b82f6);
    overflow: hidden;
    min-height: 21px;
    max-height: 180px;
  }

  .ci-textarea::placeholder {
    color: var(--text-tertiary);
  }

  .ci-textarea:disabled {
    cursor: not-allowed;
  }

  .ci-actions {
    flex-shrink: 0;
    margin-bottom: 1px;
  }

  .ci-btn {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, opacity 0.15s ease;
  }

  .ci-btn--send {
    background: var(--accent-primary, #3b82f6);
    color: #fff;
  }

  .ci-btn--send:hover:not(:disabled) {
    background: #2563eb;
  }

  .ci-btn--send:disabled {
    background: rgba(59, 130, 246, 0.25);
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
  }

  .ci-btn--stop {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
    animation: ci-pulse 1.5s ease-in-out infinite;
  }

  .ci-btn--stop:hover {
    background: rgba(239, 68, 68, 0.25);
  }

  @keyframes ci-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.65; }
  }

  .ci-hint {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--text-muted, #404040);
    text-align: right;
    padding-right: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .ci-btn--stop { animation: none; }
  }
</style>
