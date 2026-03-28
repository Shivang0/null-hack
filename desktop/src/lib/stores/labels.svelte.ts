// src/lib/stores/labels.svelte.ts
import type { Label, LabelCreateRequest } from "$api/types";
import { labels as labelsApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class LabelsStore {
  labels = $state<Label[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  totalCount = $derived(this.labels.length);

  async fetchLabels(params?: Record<string, string>): Promise<void> {
    this.loading = true;
    try {
      this.labels = await labelsApi.list(params);
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load labels", msg);
    } finally {
      this.loading = false;
    }
  }

  async createLabel(data: LabelCreateRequest): Promise<Label | null> {
    this.loading = true;
    try {
      const created = await labelsApi.create(data);
      this.labels = [...this.labels, created];
      this.error = null;
      toastStore.success("Label created", data.name);
      return created;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to create label", msg);
      return null;
    } finally {
      this.loading = false;
    }
  }

  async deleteLabel(id: string): Promise<void> {
    const previous = this.labels;
    this.labels = this.labels.filter((l) => l.id !== id);
    try {
      await labelsApi.delete(id);
      this.error = null;
      toastStore.success("Label deleted");
    } catch (e) {
      this.labels = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to delete label", msg);
    }
  }

  getById(id: string): Label | null {
    return this.labels.find((l) => l.id === id) ?? null;
  }

  getByName(name: string): Label | null {
    return this.labels.find((l) => l.name === name) ?? null;
  }
}

export const labelsStore = new LabelsStore();
