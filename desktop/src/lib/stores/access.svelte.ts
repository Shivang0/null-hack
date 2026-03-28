// src/lib/stores/access.svelte.ts
import type { RoleAssignment, UserRole } from "$api/types";
import { access as accessApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class AccessStore {
  assignments = $state<RoleAssignment[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  totalCount = $derived(this.assignments.length);

  adminCount = $derived(
    this.assignments.filter((a) => a.role === "admin").length,
  );
  memberCount = $derived(
    this.assignments.filter((a) => a.role === "member").length,
  );
  viewerCount = $derived(
    this.assignments.filter((a) => a.role === "viewer").length,
  );

  filterRole = $state<UserRole | "all">("all");

  filteredAssignments = $derived(
    this.filterRole === "all"
      ? this.assignments
      : this.assignments.filter((a) => a.role === this.filterRole),
  );

  setRoleFilter(role: UserRole | "all"): void {
    this.filterRole = role;
  }

  async fetchAssignments(): Promise<void> {
    this.loading = true;
    try {
      this.assignments = await accessApi.list();
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load access assignments", msg);
    } finally {
      this.loading = false;
    }
  }

  async assignRole(
    data: Partial<RoleAssignment>,
  ): Promise<RoleAssignment | null> {
    this.loading = true;
    try {
      const created = await accessApi.assign(data);
      this.assignments = [created, ...this.assignments];
      this.error = null;
      toastStore.success(
        "Role assigned",
        `${data.user_name ?? "User"} → ${data.role}`,
      );
      return created;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to assign role", msg);
      return null;
    } finally {
      this.loading = false;
    }
  }

  async revokeRole(id: string): Promise<void> {
    const previous = this.assignments;
    const target = this.assignments.find((a) => a.id === id);
    this.assignments = this.assignments.filter((a) => a.id !== id);
    try {
      await accessApi.revoke(id);
      this.error = null;
      toastStore.success("Role revoked", target?.user_name ?? "");
    } catch (e) {
      this.assignments = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to revoke role", msg);
    }
  }

  getById(id: string): RoleAssignment | null {
    return this.assignments.find((a) => a.id === id) ?? null;
  }
}

export const accessStore = new AccessStore();
