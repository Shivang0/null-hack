// src/lib/stores/users.svelte.ts
import type { User, UserRole } from "$api/types";
import { users as usersApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class UsersStore {
  users = $state<User[]>([]);
  selected = $state<User | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  // Filter state
  searchQuery = $state("");
  filterRole = $state<UserRole | "all">("all");

  // Derived
  totalCount = $derived(this.users.length);

  filteredUsers = $derived.by(() => {
    let result = this.users;
    if (this.filterRole !== "all") {
      result = result.filter((u) => u.role === this.filterRole);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    return result;
  });

  adminCount = $derived(this.users.filter((u) => u.role === "admin").length);

  async fetchUsers(): Promise<void> {
    this.loading = true;
    try {
      this.users = await usersApi.list();
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load users", msg);
    } finally {
      this.loading = false;
    }
  }

  async createUser(data: Partial<User>): Promise<User | null> {
    this.loading = true;
    try {
      const created = await usersApi.create(data);
      this.users = [created, ...this.users];
      this.error = null;
      toastStore.success("User created", created.name);
      return created;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to create user", msg);
      return null;
    } finally {
      this.loading = false;
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const previous = this.users;
    // Optimistic update
    this.users = this.users.map((u) => (u.id === id ? { ...u, ...data } : u));
    if (this.selected?.id === id) {
      this.selected = { ...this.selected, ...data };
    }
    try {
      const updated = await usersApi.update(id, data);
      this.users = this.users.map((u) => (u.id === id ? updated : u));
      if (this.selected?.id === id) this.selected = updated;
      this.error = null;
      return updated;
    } catch (e) {
      this.users = previous;
      if (this.selected?.id === id) {
        this.selected = previous.find((u) => u.id === id) ?? this.selected;
      }
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to update user", msg);
      return null;
    }
  }

  async deleteUser(id: string): Promise<void> {
    const previous = this.users;
    this.users = this.users.filter((u) => u.id !== id);
    if (this.selected?.id === id) this.selected = null;
    try {
      await usersApi.delete(id);
      this.error = null;
      toastStore.success("User deleted");
    } catch (e) {
      this.users = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to delete user", msg);
    }
  }

  selectUser(user: User | null): void {
    this.selected = user;
  }

  setSearch(q: string): void {
    this.searchQuery = q;
  }

  setRoleFilter(role: UserRole | "all"): void {
    this.filterRole = role;
  }

  getById(id: string): User | null {
    return this.users.find((u) => u.id === id) ?? null;
  }
}

export const usersStore = new UsersStore();
