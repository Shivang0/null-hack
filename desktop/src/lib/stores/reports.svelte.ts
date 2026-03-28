// src/lib/stores/reports.svelte.ts
import { reports as reportsApi } from "$api/client";
import type { Report, ReportCreateRequest, ReportType } from "$api/types";

class ReportsStore {
  reports = $state<Report[]>([]);
  activeReport = $state<Report | null>(null);
  generating = $state(false);
  loading = $state(false);
  error = $state<string | null>(null);

  byType = $derived(
    this.reports.reduce<Record<string, Report[]>>(
      (acc, r) => {
        const list = acc[r.report_type] ?? [];
        list.push(r);
        acc[r.report_type] = list;
        return acc;
      },
      {} as Record<string, Report[]>,
    ),
  );

  scheduledReports = $derived(
    this.reports.filter((r) => r.schedule !== null && r.status !== "archived"),
  );

  recentReports = $derived(
    [...this.reports]
      .filter((r) => r.last_generated_at !== null)
      .sort(
        (a, b) =>
          new Date(b.last_generated_at!).getTime() -
          new Date(a.last_generated_at!).getTime(),
      )
      .slice(0, 5),
  );

  async fetchReports(params?: { report_type?: ReportType }): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.reports = await reportsApi.list(params);
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.loading = false;
    }
  }

  async fetchReport(id: string): Promise<void> {
    this.error = null;
    try {
      const report = await reportsApi.get(id);
      this.activeReport = report;
      // Keep the list in sync
      const idx = this.reports.findIndex((r) => r.id === id);
      if (idx !== -1) {
        this.reports[idx] = report;
      }
    } catch (e) {
      this.error = (e as Error).message;
    }
  }

  async createReport(body: ReportCreateRequest): Promise<Report | null> {
    this.error = null;
    try {
      const report = await reportsApi.create(body);
      this.reports = [report, ...this.reports];
      this.activeReport = report;
      return report;
    } catch (e) {
      this.error = (e as Error).message;
      return null;
    }
  }

  async updateReport(
    id: string,
    body: Partial<ReportCreateRequest>,
  ): Promise<Report | null> {
    this.error = null;
    try {
      const report = await reportsApi.update(id, body);
      this.reports = this.reports.map((r) => (r.id === id ? report : r));
      if (this.activeReport?.id === id) {
        this.activeReport = report;
      }
      return report;
    } catch (e) {
      this.error = (e as Error).message;
      return null;
    }
  }

  async deleteReport(id: string): Promise<boolean> {
    this.error = null;
    try {
      await reportsApi.remove(id);
      this.reports = this.reports.filter((r) => r.id !== id);
      if (this.activeReport?.id === id) {
        this.activeReport = this.reports[0] ?? null;
      }
      return true;
    } catch (e) {
      this.error = (e as Error).message;
      return false;
    }
  }

  async generateReport(id: string): Promise<Report | null> {
    this.generating = true;
    this.error = null;
    try {
      const report = await reportsApi.generate(id);
      this.reports = this.reports.map((r) => (r.id === id ? report : r));
      if (this.activeReport?.id === id) {
        this.activeReport = report;
      }
      return report;
    } catch (e) {
      this.error = (e as Error).message;
      return null;
    } finally {
      this.generating = false;
    }
  }

  async exportReport(id: string, format = "csv"): Promise<void> {
    this.error = null;
    try {
      // In mock mode this returns the CSV string; in real mode it returns a Blob
      const data = await reportsApi.exportReport(id, format);
      const report = this.reports.find((r) => r.id === id);
      const filename = `${report?.name ?? "report"}.${format}`;

      let blob: Blob;
      if (typeof data === "string") {
        blob = new Blob([data as string], { type: "text/csv" });
      } else if (data instanceof Blob) {
        blob = data;
      } else {
        // JSON fallback (mock export of non-CSV formats)
        blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      this.error = (e as Error).message;
    }
  }

  setActive(report: Report | null): void {
    this.activeReport = report;
  }
}

export const reportsStore = new ReportsStore();
export type { Report, ReportType, ReportCreateRequest };
