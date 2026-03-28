<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  // Auth bypassed — go straight to /app
  onMount(async () => {
    if (!browser) return;
    // Clear stale workspace data from previous DB sessions
    // so syncFromBackend picks up the fresh backend state
    const staleKeys = Object.keys(localStorage).filter(
      k => k.startsWith('canopy-workspaces') || k.startsWith('canopy-mock-')
    );
    staleKeys.forEach(k => localStorage.removeItem(k));
    // Mark onboarding as complete so layout doesn't redirect back
    localStorage.setItem('canopy-onboarding-complete', 'true');
    localStorage.setItem('canopy-onboarding', JSON.stringify({ completed: true }));
    goto('/app', { replaceState: true });
  });
</script>
