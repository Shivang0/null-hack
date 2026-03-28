// src/lib/stores/notifications.svelte.ts
import type {
  Notification,
  NotificationBadges,
  NotificationCategory,
  NotificationFilters,
} from "$api/types";
import { notifications as notificationsApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

const POLL_INTERVAL_MS = 30_000;

class NotificationsStore {
  notifications = $state<Notification[]>([]);
  badges = $state<NotificationBadges>({
    unread: 0,
    by_category: {},
    by_severity: {},
  });
  loading = $state(false);
  error = $state<string | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────

  unreadCount = $derived(
    this.notifications.filter((n) => !n.read_at && !n.dismissed_at).length,
  );

  criticalCount = $derived(
    this.notifications.filter(
      (n) => n.severity === "critical" && !n.read_at && !n.dismissed_at,
    ).length,
  );

  byCategory = $derived.by(() => {
    const map: Record<NotificationCategory, Notification[]> = {
      task: [],
      approval: [],
      alert: [],
      mention: [],
      system: [],
      budget: [],
      workflow: [],
    };
    for (const n of this.notifications) {
      if (!n.dismissed_at) {
        map[n.category].push(n);
      }
    }
    return map;
  });

  recentUnread = $derived(
    this.notifications
      .filter((n) => !n.read_at && !n.dismissed_at)
      .sort(
        (a, b) =>
          new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime(),
      )
      .slice(0, 5),
  );

  // ── Polling ──────────────────────────────────────────────────────────────────

  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  startPolling(): void {
    if (this._pollTimer !== null) return;
    this._pollTimer = setInterval(() => {
      void this.fetchBadges();
    }, POLL_INTERVAL_MS);
  }

  stopPolling(): void {
    if (this._pollTimer !== null) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────────

  async fetchNotifications(filters: NotificationFilters = {}): Promise<void> {
    this.loading = true;
    try {
      this.notifications = await notificationsApi.list(filters);
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load notifications", msg);
    } finally {
      this.loading = false;
    }
  }

  async fetchBadges(): Promise<void> {
    try {
      this.badges = await notificationsApi.badges();
    } catch {
      // Silent fail for badge polling — don't toast on every poll failure
    }
  }

  // ── Mutations ────────────────────────────────────────────────────────────────

  async markRead(id: string): Promise<void> {
    // Optimistic update
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
    );
    this.badges = {
      ...this.badges,
      unread: Math.max(0, this.badges.unread - 1),
    };

    try {
      await notificationsApi.markRead(id);
    } catch (e) {
      // Revert on failure
      await this.fetchNotifications();
      await this.fetchBadges();
      toastStore.error(
        "Failed to mark notification as read",
        (e as Error).message,
      );
    }
  }

  async markAllRead(category?: NotificationCategory): Promise<void> {
    // Optimistic update
    const now = new Date().toISOString();
    this.notifications = this.notifications.map((n) => {
      if (!n.read_at && (!category || n.category === category)) {
        return { ...n, read_at: now };
      }
      return n;
    });

    try {
      await notificationsApi.markAllRead(category);
      await this.fetchBadges();
    } catch (e) {
      await this.fetchNotifications();
      await this.fetchBadges();
      toastStore.error(
        "Failed to mark notifications as read",
        (e as Error).message,
      );
    }
  }

  async dismiss(id: string): Promise<void> {
    // Optimistic update
    const now = new Date().toISOString();
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, dismissed_at: now, read_at: n.read_at ?? now } : n,
    );

    try {
      await notificationsApi.dismiss(id);
      await this.fetchBadges();
    } catch (e) {
      await this.fetchNotifications();
      await this.fetchBadges();
      toastStore.error("Failed to dismiss notification", (e as Error).message);
    }
  }
}

export const notificationsStore = new NotificationsStore();
