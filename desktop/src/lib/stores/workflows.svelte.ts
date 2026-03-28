// src/lib/stores/workflows.svelte.ts
import type {
  Workflow,
  WorkflowStep,
  WorkflowRun,
  WorkflowCreateRequest,
} from "$api/types";
import { workflows as workflowsApi } from "$api/client";
import { toastStore } from "./toasts.svelte";

class WorkflowsStore {
  workflows = $state<Workflow[]>([]);
  selectedWorkflow = $state<Workflow | null>(null);
  runs = $state<Record<string, WorkflowRun[]>>({});
  steps = $state<Record<string, WorkflowStep[]>>({});
  loading = $state(false);
  error = $state<string | null>(null);

  activeCount = $derived(
    this.workflows.filter((w) => w.status === "active").length,
  );
  draftCount = $derived(
    this.workflows.filter((w) => w.status === "draft").length,
  );
  totalCount = $derived(this.workflows.length);

  async fetchWorkflows(workspaceId?: string): Promise<void> {
    this.loading = true;
    try {
      this.workflows = await workflowsApi.list(workspaceId);
      if (this.selectedWorkflow) {
        const refreshed = this.workflows.find(
          (w) => w.id === this.selectedWorkflow!.id,
        );
        this.selectedWorkflow = refreshed ?? null;
      }
      this.error = null;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to load workflows", msg);
    } finally {
      this.loading = false;
    }
  }

  async fetchWorkflow(id: string): Promise<Workflow | null> {
    try {
      const workflow = await workflowsApi.get(id);
      this.workflows = this.workflows.map((w) => (w.id === id ? workflow : w));
      if (this.selectedWorkflow?.id === id) {
        this.selectedWorkflow = workflow;
      }
      return workflow;
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to load workflow", msg);
      return null;
    }
  }

  async createWorkflow(data: WorkflowCreateRequest): Promise<Workflow | null> {
    this.loading = true;
    try {
      const created = await workflowsApi.create(data);
      this.workflows = [created, ...this.workflows];
      this.error = null;
      toastStore.success("Workflow created", created.name);
      return created;
    } catch (e) {
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to create workflow", msg);
      return null;
    } finally {
      this.loading = false;
    }
  }

  async updateWorkflow(
    id: string,
    data: Partial<WorkflowCreateRequest>,
  ): Promise<Workflow | null> {
    const previous = this.workflows;
    try {
      const updated = await workflowsApi.update(id, data);
      this.workflows = this.workflows.map((w) => (w.id === id ? updated : w));
      if (this.selectedWorkflow?.id === id) {
        this.selectedWorkflow = updated;
      }
      this.error = null;
      return updated;
    } catch (e) {
      this.workflows = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to update workflow", msg);
      return null;
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    const previous = this.workflows;
    this.workflows = this.workflows.filter((w) => w.id !== id);
    if (this.selectedWorkflow?.id === id) {
      this.selectedWorkflow = null;
    }
    try {
      await workflowsApi.delete(id);
      this.error = null;
      toastStore.success("Workflow deleted");
    } catch (e) {
      this.workflows = previous;
      const msg = (e as Error).message;
      this.error = msg;
      toastStore.error("Failed to delete workflow", msg);
    }
  }

  async fetchSteps(workflowId: string): Promise<WorkflowStep[]> {
    try {
      const fetched = await workflowsApi.fetchSteps(workflowId);
      this.steps = { ...this.steps, [workflowId]: fetched };
      return fetched;
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to load steps", msg);
      return [];
    }
  }

  async addStep(
    workflowId: string,
    body: Partial<WorkflowStep>,
  ): Promise<WorkflowStep | null> {
    try {
      const step = await workflowsApi.addStep(workflowId, body);
      const existing = this.steps[workflowId] ?? [];
      this.steps = {
        ...this.steps,
        [workflowId]: [...existing, step].sort(
          (a, b) => a.position - b.position,
        ),
      };
      // Refresh workflow step_count
      this.workflows = this.workflows.map((w) =>
        w.id === workflowId ? { ...w, step_count: w.step_count + 1 } : w,
      );
      toastStore.success("Step added");
      return step;
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to add step", msg);
      return null;
    }
  }

  async removeStep(workflowId: string, stepId: string): Promise<void> {
    const previousSteps = this.steps[workflowId] ?? [];
    this.steps = {
      ...this.steps,
      [workflowId]: previousSteps.filter((s) => s.id !== stepId),
    };
    try {
      await workflowsApi.removeStep(workflowId, stepId);
      this.workflows = this.workflows.map((w) =>
        w.id === workflowId
          ? { ...w, step_count: Math.max(0, w.step_count - 1) }
          : w,
      );
      toastStore.success("Step removed");
    } catch (e) {
      this.steps = { ...this.steps, [workflowId]: previousSteps };
      const msg = (e as Error).message;
      toastStore.error("Failed to remove step", msg);
    }
  }

  async fetchRuns(workflowId: string): Promise<WorkflowRun[]> {
    try {
      const fetched = await workflowsApi.fetchRuns(workflowId);
      this.runs = { ...this.runs, [workflowId]: fetched };
      return fetched;
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to load runs", msg);
      return [];
    }
  }

  async triggerRun(
    workflowId: string,
    input?: Record<string, unknown>,
  ): Promise<WorkflowRun | null> {
    try {
      const run = await workflowsApi.triggerRun(workflowId, input);
      if (this.runs[workflowId]) {
        this.runs = {
          ...this.runs,
          [workflowId]: [run, ...this.runs[workflowId]],
        };
      }
      toastStore.success("Workflow triggered", "Run started.");
      return run;
    } catch (e) {
      const msg = (e as Error).message;
      toastStore.error("Failed to trigger workflow", msg);
      return null;
    }
  }

  selectWorkflow(workflow: Workflow | null): void {
    this.selectedWorkflow = workflow;
  }
}

export const workflowsStore = new WorkflowsStore();
