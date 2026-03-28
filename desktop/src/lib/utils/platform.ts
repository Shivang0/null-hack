export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__,
  );
}

export function isMacOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toLowerCase().includes("mac");
}

export function isWindows(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toLowerCase().includes("win");
}

export function isLinux(): boolean {
  if (typeof navigator === "undefined") return false;
  const p = navigator.platform.toLowerCase();
  return p.includes("linux") || p.includes("x11");
}
