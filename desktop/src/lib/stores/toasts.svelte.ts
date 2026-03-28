// src/lib/stores/toasts.svelte.ts

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;

class ToastStore {
  toasts: Toast[] = $state([]);
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  add(toast: Omit<Toast, "id">): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.duration ?? DEFAULT_DURATION;
    if (this.toasts.length >= MAX_TOASTS) this.dismiss(this.toasts[0].id);
    this.toasts = [...this.toasts, { ...toast, id, duration }];
    const timer = setTimeout(() => this.dismiss(id), duration);
    this.timers.set(id, timer);
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  info(title: string, message?: string, duration?: number): void {
    this.add({ type: "info", title, message, duration });
  }

  success(title: string, message?: string, duration?: number): void {
    this.add({ type: "success", title, message, duration });
  }

  warning(title: string, message?: string, duration?: number): void {
    this.add({ type: "warning", title, message, duration });
  }

  error(title: string, message?: string, duration?: number): void {
    this.add({ type: "error", title, message, duration });
  }
}

export const toastStore = new ToastStore();
