<script lang="ts">
  import '../app.css';
  import { isTauri, isMacOS } from '$lib/utils/platform';
  let { children } = $props();
</script>

{#if isTauri() && isMacOS()}
  <div
    class="global-drag-region"
    data-tauri-drag-region
    aria-hidden="true"
  ></div>
{/if}

{@render children()}

<style>
  .global-drag-region {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 28px;
    z-index: 99999;
    -webkit-app-region: drag;
    app-region: drag;
  }
</style>
