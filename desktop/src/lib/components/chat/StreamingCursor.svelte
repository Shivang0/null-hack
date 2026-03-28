<!-- src/lib/components/chat/StreamingCursor.svelte -->
<!-- Blinking inline cursor shown while the assistant is generating -->
<script lang="ts">
  interface Props {
    color?: string;
  }

  let { color = 'var(--accent-primary)' }: Props = $props();
</script>

<span
  class="sc-cursor"
  style="background: {color};"
  aria-hidden="true"
></span>

<style>
  .sc-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    margin-left: 2px;
    vertical-align: text-bottom;
    border-radius: 1px;
    animation: sc-blink 0.9s step-start infinite;
  }

  @keyframes sc-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sc-cursor {
      animation: none;
      opacity: 0.7;
    }
  }
</style>
