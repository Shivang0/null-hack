// src/lib/api/mock/reports.ts
// Mock data for the Reports feature

export interface MockReport {
  id: string;
  name: string;
  description: string | null;
  report_type:
    | "agent_performance"
    | "cost_analysis"
    | "task_summary"
    | "workflow_audit"
    | "custom";
  config: Record<string, unknown>;
  schedule: string | null;
  last_generated_at: string | null;
  format: "table" | "chart" | "pdf" | "csv";
  status: "active" | "generating" | "archived";
  cached_result: CachedResult | null;
  tags: string[];
  workspace_id: string | null;
  created_by_id: string | null;
  inserted_at: string;
  updated_at: string;
}

export interface CachedResult {
  summary: Record<string, unknown>;
  columns: string[];
  rows: (string | number)[][];
  chart_data?: ChartPoint[];
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

const BASE_DATE = "2026-03-24T00:00:00Z";

const mockReportsData: MockReport[] = [
  {
    id: "rpt-001",
    name: "Weekly Agent Performance",
    description:
      "Tracks success rates, task throughput, and cost efficiency for all active agents over the past week.",
    report_type: "agent_performance",
    config: {
      date_range: "7d",
      agents: "all",
      metrics: ["success_rate", "task_count", "avg_duration", "cost"],
      group_by: "agent",
    },
    schedule: "0 6 * * 1",
    last_generated_at: "2026-03-24T06:00:00Z",
    format: "table",
    status: "active",
    cached_result: {
      summary: {
        total_agents: 8,
        avg_success_rate: 0.934,
        total_tasks: 312,
        period: "7d",
        generated_at: "2026-03-24T06:00:00Z",
      },
      columns: ["Agent", "Tasks", "Success Rate", "Avg Duration", "Cost"],
      rows: [
        ["Orchestrator Prime", 87, "97.7%", "2m 08s", "$1.24"],
        ["Research Agent", 74, "95.9%", "3m 42s", "$1.98"],
        ["Code Writer", 61, "91.8%", "5m 29s", "$2.61"],
        ["Data Analyst", 52, "90.4%", "3m 58s", "$2.03"],
        ["Content Agent", 38, "88.1%", "2m 47s", "$0.94"],
      ],
      chart_data: [
        { label: "Orchestrator Prime", value: 97.7 },
        { label: "Research Agent", value: 95.9 },
        { label: "Code Writer", value: 91.8 },
        { label: "Data Analyst", value: 90.4 },
        { label: "Content Agent", value: 88.1 },
      ],
    },
    tags: ["performance", "weekly"],
    workspace_id: "ws-default",
    created_by_id: "user-001",
    inserted_at: "2026-02-01T10:00:00Z",
    updated_at: BASE_DATE,
  },

  {
    id: "rpt-002",
    name: "Monthly Cost Report",
    description:
      "Full breakdown of LLM API costs by agent, model, and day for the current month. Includes budget variance analysis.",
    report_type: "cost_analysis",
    config: {
      date_range: "30d",
      group_by: "agent",
      include_models: true,
      budget_comparison: true,
    },
    schedule: "0 0 1 * *",
    last_generated_at: "2026-03-01T00:00:00Z",
    format: "chart",
    status: "active",
    cached_result: {
      summary: {
        total_cost_cents: 412_890,
        budget_cents: 500_000,
        variance_pct: -17.4,
        top_consumer: "Code Writer",
        period: "March 2026",
      },
      columns: ["Agent", "Tokens (M)", "Cost", "% of Total", "vs Budget"],
      rows: [
        ["Code Writer", "4.12", "$96.14", "23.3%", "-$8.86"],
        ["Research Agent", "3.87", "$81.27", "19.7%", "-$18.73"],
        ["Data Analyst", "3.44", "$72.18", "17.5%", "-$27.82"],
        ["Orchestrator Prime", "2.91", "$60.33", "14.6%", "+$10.33"],
        ["Content Agent", "2.18", "$45.22", "11.0%", "-$4.78"],
      ],
      chart_data: [
        { label: "Code Writer", value: 96.14 },
        { label: "Research Agent", value: 81.27 },
        { label: "Data Analyst", value: 72.18 },
        { label: "Orchestrator Prime", value: 60.33 },
        { label: "Content Agent", value: 45.22 },
      ],
    },
    tags: ["costs", "monthly", "budget"],
    workspace_id: "ws-default",
    created_by_id: "user-001",
    inserted_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-03-01T00:05:00Z",
  },

  {
    id: "rpt-003",
    name: "Sprint Task Summary",
    description:
      "One-time snapshot of all tasks completed, failed, and pending during the current sprint cycle.",
    report_type: "task_summary",
    config: {
      date_range: "custom",
      from: "2026-03-10",
      to: "2026-03-24",
      include_pending: true,
      include_failed: true,
    },
    schedule: null,
    last_generated_at: "2026-03-24T08:30:00Z",
    format: "table",
    status: "active",
    cached_result: {
      summary: {
        total_tasks: 428,
        completed: 389,
        failed: 21,
        pending: 18,
        completion_rate: 0.909,
        sprint: "Sprint 14",
      },
      columns: ["Task", "Agent", "Status", "Duration", "Completed"],
      rows: [
        [
          "Generate Q1 summary",
          "Content Agent",
          "completed",
          "1m 52s",
          "2026-03-23",
        ],
        [
          "Analyze churn data",
          "Data Analyst",
          "completed",
          "6m 14s",
          "2026-03-23",
        ],
        ["Review PR #218", "Code Writer", "completed", "8m 03s", "2026-03-22"],
        [
          "Draft blog post",
          "Content Agent",
          "completed",
          "3m 28s",
          "2026-03-22",
        ],
        ["Competitor analysis", "Research Agent", "failed", "—", "—"],
        ["Update API docs", "Code Writer", "pending", "—", "—"],
      ],
    },
    tags: ["tasks", "sprint"],
    workspace_id: "ws-default",
    created_by_id: "user-001",
    inserted_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-03-24T08:30:00Z",
  },

  {
    id: "rpt-004",
    name: "Workflow Audit Q1",
    description:
      "Compliance audit of all workflow executions in Q1 2026. Records trigger sources, step outcomes, and error traces.",
    report_type: "workflow_audit",
    config: {
      date_range: "custom",
      from: "2026-01-01",
      to: "2026-03-31",
      include_steps: true,
      include_errors: true,
      workflows: "all",
    },
    schedule: null,
    last_generated_at: "2026-03-20T14:00:00Z",
    format: "pdf",
    status: "active",
    cached_result: {
      summary: {
        total_runs: 1_847,
        successful: 1_721,
        failed: 126,
        error_rate: 0.068,
        avg_duration_seconds: 184,
        period: "Q1 2026",
      },
      columns: [
        "Workflow",
        "Runs",
        "Success",
        "Failures",
        "Error Rate",
        "Avg Duration",
      ],
      rows: [
        ["Daily Digest", 90, 89, 1, "1.1%", "2m 24s"],
        ["Code Review Pipeline", 312, 298, 14, "4.5%", "9m 18s"],
        ["Alert Escalation", 847, 814, 33, "3.9%", "0m 42s"],
        ["Data Sync", 90, 78, 12, "13.3%", "4m 11s"],
        ["Monthly Report Gen", 3, 3, 0, "0.0%", "12m 02s"],
      ],
    },
    tags: ["audit", "workflows", "q1"],
    workspace_id: "ws-default",
    created_by_id: "user-001",
    inserted_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-20T14:05:00Z",
  },

  {
    id: "rpt-005",
    name: "Daily Active Agents",
    description:
      "Real-time snapshot of agent activity, current sessions, and task queues. Refreshed daily at midnight.",
    report_type: "agent_performance",
    config: {
      date_range: "1d",
      agents: "all",
      metrics: ["active_sessions", "queue_depth", "current_tasks"],
    },
    schedule: "0 0 * * *",
    last_generated_at: "2026-03-24T00:00:00Z",
    format: "table",
    status: "active",
    cached_result: {
      summary: {
        active_agents: 6,
        total_sessions: 14,
        queued_tasks: 3,
        as_of: "2026-03-24T00:00:00Z",
      },
      columns: ["Agent", "Status", "Active Sessions", "Queue", "Last Task"],
      rows: [
        ["Orchestrator Prime", "active", 3, 1, "2m ago"],
        ["Research Agent", "active", 2, 0, "8m ago"],
        ["Code Writer", "active", 4, 2, "1m ago"],
        ["Data Analyst", "idle", 0, 0, "2h ago"],
        ["Content Agent", "active", 2, 0, "15m ago"],
        ["Alert Monitor", "active", 3, 0, "4m ago"],
      ],
    },
    tags: ["agents", "daily", "realtime"],
    workspace_id: "ws-default",
    created_by_id: "user-001",
    inserted_at: "2026-02-20T08:00:00Z",
    updated_at: BASE_DATE,
  },

  {
    id: "rpt-006",
    name: "Custom ROI Analysis",
    description:
      "Custom multi-metric report comparing agent investment costs against measurable business outcomes and task value.",
    report_type: "custom",
    config: {
      metrics: ["roi_pct", "cost_per_task", "automation_rate", "error_rate"],
      date_range: "90d",
      compare_to_baseline: true,
      baseline_period: "prior_90d",
    },
    schedule: null,
    last_generated_at: "2026-03-15T16:00:00Z",
    format: "chart",
    status: "active",
    cached_result: {
      summary: {
        roi_pct: 342,
        cost_per_task_cents: 33,
        automation_rate: 0.78,
        error_rate: 0.021,
        period: "Q1 2026 vs Q4 2025",
      },
      columns: ["Metric", "Current", "Prior Period", "Change", "Trend"],
      rows: [
        ["ROI", "342%", "298%", "+44pp", "up"],
        ["Cost per Task", "$0.33", "$0.41", "-$0.08", "down"],
        ["Automation Rate", "78%", "71%", "+7pp", "up"],
        ["Error Rate", "2.1%", "3.8%", "-1.7pp", "down"],
        ["Avg Task Duration", "3m 42s", "4m 18s", "-36s", "down"],
      ],
      chart_data: [
        { label: "ROI", value: 342, secondary: 298 },
        { label: "Cost/Task (¢)", value: 33, secondary: 41 },
        { label: "Automation %", value: 78, secondary: 71 },
        { label: "Error Rate %", value: 2.1, secondary: 3.8 },
      ],
    },
    tags: ["roi", "custom", "business"],
    workspace_id: "ws-default",
    created_by_id: "user-001",
    inserted_at: "2026-03-01T11:00:00Z",
    updated_at: "2026-03-15T16:05:00Z",
  },
];

// Mutable in-memory store (like other mock files)
let _reports: MockReport[] = [...mockReportsData];

export function mockReports(): MockReport[] {
  return _reports;
}

export function mockReportById(id: string): MockReport | undefined {
  return _reports.find((r) => r.id === id);
}

export function addMockReport(report: MockReport): void {
  _reports = [report, ..._reports];
}

export function updateMockReport(
  id: string,
  patch: Partial<MockReport>,
): MockReport | undefined {
  const idx = _reports.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  _reports[idx] = {
    ..._reports[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return _reports[idx];
}

export function deleteMockReport(id: string): void {
  _reports = _reports.filter((r) => r.id !== id);
}

export function generateMockReport(id: string): MockReport | undefined {
  const report = mockReportById(id);
  if (!report) return undefined;

  const updatedResult = buildSampleResult(report);
  return updateMockReport(id, {
    status: "active",
    cached_result: updatedResult,
    last_generated_at: new Date().toISOString(),
  });
}

function buildSampleResult(report: MockReport): CachedResult {
  if (report.cached_result) {
    // Refresh timestamps in summary but keep structure
    return {
      ...report.cached_result,
      summary: {
        ...report.cached_result.summary,
        generated_at: new Date().toISOString(),
      },
    };
  }

  // Generate default result for reports with no prior data
  return {
    summary: {
      note: "Report generated",
      period: "last_30d",
      generated_at: new Date().toISOString(),
    },
    columns: ["Metric", "Value"],
    rows: [["No data available", "—"]],
  };
}
