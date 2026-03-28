// src/lib/stores/theme.svelte.ts
// Theme store — 5 themes: dark, glass, color, light, system

export type ThemeMode = "dark" | "glass" | "color" | "light" | "system";
export type ResolvedTheme = "dark" | "glass" | "color" | "light";

const STORAGE_KEY = "canopy-theme";

class ThemeStore {
  mode = $state<ThemeMode>("dark");
  resolved = $state<ResolvedTheme>("dark");

  #mediaQuery: MediaQueryList | null = null;

  constructor() {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (
      stored === "dark" ||
      stored === "glass" ||
      stored === "color" ||
      stored === "light" ||
      stored === "system"
    ) {
      this.mode = stored;
    }

    this.#mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.#mediaQuery.addEventListener("change", this.#onSystemChange);

    this.#resolve();
  }

  setMode(mode: ThemeMode): void {
    this.mode = mode;
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, mode);
    this.#resolve();
  }

  #onSystemChange = (): void => {
    if (this.mode === "system") this.#resolve();
  };

  #resolve(): void {
    if (this.mode === "system") {
      this.resolved = this.#mediaQuery?.matches ? "dark" : "light";
    } else {
      this.resolved = this.mode;
    }
    this.#applyToDOM();
  }

  #applyToDOM(): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", this.resolved);
    // color-scheme for native form controls
    root.style.colorScheme = this.resolved === "light" ? "light" : "dark";
    void this.#updateTauriTheme();
  }

  async #updateTauriTheme(): Promise<void> {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      await win.setTheme(this.resolved === "light" ? "light" : "dark");
    } catch {
      /* Not in Tauri */
    }
  }
}

export const themeStore = new ThemeStore();
