<!-- src/lib/components/layout/ToastContainer.svelte -->
<script lang="ts">
  import { toastStore } from '$lib/stores/toasts.svelte';
  import ToastItem from './Toast.svelte';
</script>

<div
  class="tc-container"
  role="region"
  aria-label="Notifications"
>
  {#each toastStore.toasts as toast (toast.id)}
    <ToastItem {toast} />
  {/each}
</div>

<style>
  .tc-container {
    position: fixed;
    bottom: 24px;
    right: 20px;
    z-index: 600;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
</style>
