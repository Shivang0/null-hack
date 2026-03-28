// src/lib/services/credentials.ts
import { isTauri } from "$lib/utils/platform";

export interface ProviderCredentials {
  slug: string;
  apiKey: string;
}

export async function getProviderCredentials(): Promise<ProviderCredentials | null> {
  if (!isTauri()) {
    // Browser fallback — read from localStorage
    const slug = localStorage.getItem("canopy-provider-slug");
    const key = slug ? localStorage.getItem(`canopy-provider-${slug}`) : null;
    if (slug && key) return { slug, apiKey: key };
    return null;
  }

  try {
    const { Store } = await import("@tauri-apps/plugin-store");
    const store = await Store.load("credentials.json");
    return (await store.get<ProviderCredentials>("provider")) ?? null;
  } catch {
    return null;
  }
}

export async function setProviderCredentials(
  creds: ProviderCredentials,
): Promise<void> {
  if (!isTauri()) {
    localStorage.setItem("canopy-provider-slug", creds.slug);
    localStorage.setItem(`canopy-provider-${creds.slug}`, creds.apiKey);
    return;
  }

  try {
    const { Store } = await import("@tauri-apps/plugin-store");
    const store = await Store.load("credentials.json");
    await store.set("provider", creds);
    await store.save();
  } catch {
    // Fallback to localStorage
    localStorage.setItem("canopy-provider-slug", creds.slug);
    localStorage.setItem(`canopy-provider-${creds.slug}`, creds.apiKey);
  }
}
