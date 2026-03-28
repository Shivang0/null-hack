// src/lib/stores/datasets.svelte.ts
import type {
  Dataset,
  DatasetCreateRequest,
  DatasetPreviewRow,
} from "$api/types";
import { datasets as datasetsApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class DatasetsStore {
  datasets = $state<Dataset[]>([]);
  preview = $state<DatasetPreviewRow[]>([]);
  previewTotal = $state(0);
  selectedDataset = $state<Dataset | null>(null);
  loading = $state(false);
  previewLoading = $state(false);
  error = $state<string | null>(null);

  // Derived stats
  bySourceType = $derived(
    this.datasets.reduce(
      (acc, d) => {
        acc[d.source_type] = (acc[d.source_type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  totalRows = $derived(this.datasets.reduce((sum, d) => sum + d.row_count, 0));

  totalSize = $derived(this.datasets.reduce((sum, d) => sum + d.size_bytes, 0));

  activeCount = $derived(
    this.datasets.filter((d) => d.status === "active").length,
  );

  totalCount = $derived(this.datasets.length);

  async fetchDatasets(
    workspaceId?: string,
    sourceType?: string,
  ): Promise<void> {
    this.loading = true;
    try {
      this.datasets = await datasetsApi.list(workspaceId, sourceType);
      if (this.selectedDataset) {
        const refreshed = this.datasets.find(
          (d) => d.id === this.selectedDataset!.id,
        );
        this.selectedDataset = refreshed ?? null;
      }
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load datasets", msg);
    } finally {
      this.loading = false;
    }
  }

  async fetchPreview(id: string): Promise<void> {
    this.previewLoading = true;
    this.preview = [];
    try {
      const result = await datasetsApi.preview(id);
      this.preview = result.rows ?? [];
      this.previewTotal = result.total ?? 0;
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to load preview", msg);
    } finally {
      this.previewLoading = false;
    }
  }

  async createDataset(data: DatasetCreateRequest): Promise<Dataset | null> {
    this.loading = true;
    try {
      const created = await datasetsApi.create(data);
      this.datasets = [created, ...this.datasets];
      this.error = null;
      toastStore.success("Dataset created", created.name);
      return created;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to create dataset", msg);
      return null;
    } finally {
      this.loading = false;
    }
  }

  async updateDataset(
    id: string,
    data: Partial<DatasetCreateRequest>,
  ): Promise<Dataset | null> {
    const previous = this.datasets;
    try {
      const updated = await datasetsApi.update(id, data);
      this.datasets = this.datasets.map((d) => (d.id === id ? updated : d));
      if (this.selectedDataset?.id === id) {
        this.selectedDataset = updated;
      }
      this.error = null;
      return updated;
    } catch (e) {
      this.datasets = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to update dataset", msg);
      return null;
    }
  }

  async deleteDataset(id: string): Promise<void> {
    const previous = this.datasets;
    this.datasets = this.datasets.filter((d) => d.id !== id);
    if (this.selectedDataset?.id === id) {
      this.selectedDataset = null;
    }
    try {
      await datasetsApi.remove(id);
      this.error = null;
      toastStore.success("Dataset deleted");
    } catch (e) {
      this.datasets = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to delete dataset", msg);
    }
  }

  async refreshDataset(id: string): Promise<void> {
    try {
      const updated = await datasetsApi.refresh(id);
      this.datasets = this.datasets.map((d) => (d.id === id ? updated : d));
      if (this.selectedDataset?.id === id) {
        this.selectedDataset = updated;
      }
      toastStore.success("Refresh triggered", "Dataset is updating.");
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to trigger refresh", msg);
    }
  }

  async grantAccess(datasetId: string, agentId: string): Promise<void> {
    try {
      const updated = await datasetsApi.grantAccess(datasetId, agentId);
      this.datasets = this.datasets.map((d) =>
        d.id === datasetId ? updated : d,
      );
      if (this.selectedDataset?.id === datasetId) {
        this.selectedDataset = updated;
      }
      toastStore.success("Access granted");
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to grant access", msg);
    }
  }

  async revokeAccess(datasetId: string, agentId: string): Promise<void> {
    try {
      const updated = await datasetsApi.revokeAccess(datasetId, agentId);
      this.datasets = this.datasets.map((d) =>
        d.id === datasetId ? updated : d,
      );
      if (this.selectedDataset?.id === datasetId) {
        this.selectedDataset = updated;
      }
      toastStore.success("Access revoked");
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to revoke access", msg);
    }
  }

  selectDataset(dataset: Dataset | null): void {
    this.selectedDataset = dataset;
    this.preview = [];
    this.previewTotal = 0;
    if (dataset) {
      void this.fetchPreview(dataset.id);
    }
  }
}

export const datasetsStore = new DatasetsStore();
