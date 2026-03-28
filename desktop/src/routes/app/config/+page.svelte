<!-- src/routes/app/config/+page.svelte -->
<!-- Configuration has moved to Settings. This page redirects automatically. -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/app/settings', { replaceState: true });
  });
</script>

<div class="cfg-redirect">
  Redirecting to Settings…
</div>

<style>
  .cfg-redirect {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    font-size: 13px;
    color: var(--dt3);
  }
</style>
