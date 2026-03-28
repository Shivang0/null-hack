<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api/client";

  interface Engagement {
    id: string;
    client_name: string;
    client_email: string | null;
    engagement_type: string;
    status: string;
    scope: string | null;
    risk_level: string | null;
    findings_count: number;
    started_at: string | null;
    completed_at: string | null;
    workspace_id: string;
    inserted_at: string;
  }

  let engagements: Engagement[] = $state([]);
  let loading = $state(true);
  let error = $state("");
  let showForm = $state(false);

  let form = $state({
    client_name: "",
    client_email: "",
    engagement_type: "pentest",
    scope: ""
  });

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    scoping: "Scoping",
    in_progress: "In Progress",
    reporting: "Reporting",
    delivered: "Delivered",
    closed: "Closed"
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-zinc-700 text-zinc-300",
    scoping: "bg-blue-900 text-blue-300",
    in_progress: "bg-amber-900 text-amber-300",
    reporting: "bg-purple-900 text-purple-300",
    delivered: "bg-green-900 text-green-300",
    closed: "bg-zinc-800 text-zinc-500"
  };

  async function loadEngagements() {
    try {
      loading = true;
      const res = await api.get("/engagements");
      engagements = res.engagements ?? [];
    } catch (e: any) {
      error = e.message ?? "Failed to load engagements";
    } finally {
      loading = false;
    }
  }

  async function submitIntake() {
    if (!form.client_name || !form.engagement_type) return;
    try {
      await api.post("/engagements", form);
      showForm = false;
      form = { client_name: "", client_email: "", engagement_type: "pentest", scope: "" };
      await loadEngagements();
    } catch (e: any) {
      error = e.message ?? "Submission failed";
    }
  }

  async function downloadReport(reportId: string, format = "csv") {
    const url = `/api/v1/reports/${reportId}/export?format=${format}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${reportId}.${format}`;
    link.click();
  }

  onMount(loadEngagements);
</script>
<div class="flex flex-col h-full bg-zinc-950 text-zinc-100">
  <header class="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
    <div>
      <h1 class="text-lg font-semibold">Client Engagements</h1>
      <p class="text-xs text-zinc-500 mt-0.5">Track your security engagements and download reports</p>
    </div>
    <button
      onclick={() => showForm = !showForm}
      class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
    >
      {showForm ? "Cancel" : "New Engagement"}
    </button>
  </header>

  {#if error}
    <div class="mx-6 mt-4 p-3 rounded bg-red-950 border border-red-800 text-red-300 text-sm">
      {error}
    </div>
  {/if}

  {#if showForm}
    <div class="mx-6 mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
      <h2 class="text-sm font-semibold mb-4">Intake Request</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-zinc-400">Client Name *</label>
          <input
            type="text"
            bind:value={form.client_name}
            placeholder="Organization name"
            class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-zinc-400">Contact Email</label>
          <input
            type="email"
            bind:value={form.client_email}
            placeholder="client@example.com"
            class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-zinc-400">Engagement Type *</label>
          <select
            bind:value={form.engagement_type}
            class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="pentest">Penetration Test</option>
            <option value="audit">Security Audit</option>
            <option value="compliance">Compliance Assessment</option>
            <option value="incident_response">Incident Response</option>
          </select>
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-xs text-zinc-400">Scope</label>
          <textarea
            bind:value={form.scope}
            placeholder="Describe the systems, applications, or environments to assess..."
            rows={3}
            class="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button
          onclick={submitIntake}
          disabled={!form.client_name}
          class="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          Submit Request
        </button>
      </div>
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto px-6 py-4">
    {#if loading}
      <div class="flex items-center justify-center h-32 text-zinc-500 text-sm">Loading engagements...</div>
    {:else if engagements.length === 0}
      <div class="flex flex-col items-center justify-center h-32 text-zinc-500">
        <p class="text-sm">No engagements yet</p>
        <p class="text-xs mt-1">Click New Engagement to submit an intake request</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each engagements as eng (eng.id)}
          <div class="p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{eng.client_name}</span>
                  <span class="text-xs text-zinc-500 capitalize">{eng.engagement_type.replace("_", " ")}</span>
                </div>
                {#if eng.scope}
                  <p class="text-xs text-zinc-400 mt-1 truncate">{eng.scope}</p>
                {/if}
                <div class="flex items-center gap-3 mt-2">
                  <span class="text-xs text-zinc-500">
                    {new Date(eng.inserted_at).toLocaleDateString()}
                  </span>
                  {#if eng.risk_level}
                    <span class="text-xs text-zinc-400 capitalize">
                      Risk: {eng.risk_level}
                    </span>
                  {/if}
                  {#if eng.findings_count > 0}
                    <span class="text-xs text-zinc-400">
                      {eng.findings_count} finding{eng.findings_count === 1 ? "" : "s"}
                    </span>
                  {/if}
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[eng.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                  {STATUS_LABELS[eng.status] ?? eng.status}
                </span>
                {#if eng.status === "delivered" || eng.status === "reporting"}
                  <button
                    onclick={() => downloadReport(eng.id)}
                    class="px-2 py-0.5 rounded border border-zinc-700 hover:border-zinc-500 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Download Report
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
