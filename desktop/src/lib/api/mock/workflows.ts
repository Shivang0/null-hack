// src/lib/api/mock/workflows.ts
import type { Workflow, WorkflowStep, WorkflowRun } from "../types";

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();

const contentPipelineSteps: WorkflowStep[] = [
  {
    id: "wf-step-cp-1",
    workflow_id: "wf-content-pipeline",
    agent_id: "agt-researcher",
    agent_name: "Content Strategist",
    agent_emoji: "✍️",
    name: "Draft Content Brief",
    step_type: "agent_task",
    position: 1,
    config: {
      prompt:
        "Analyze trending topics and produce a detailed content brief with target keywords, audience, and outline.",
    },
    depends_on: [],
    timeout_seconds: 300,
    retry_count: 1,
    on_failure: "stop",
    inserted_at: now,
    updated_at: now,
  },
  {
    id: "wf-step-cp-2",
    workflow_id: "wf-content-pipeline",
    agent_id: "agt-reviewer",
    agent_name: "SEO Analyst",
    agent_emoji: "🔍",
    name: "SEO Optimization Review",
    step_type: "agent_task",
    position: 2,
    config: {
      prompt:
        "Review the content brief for SEO gaps, keyword density, and search intent alignment. Return an optimized version.",
    },
    depends_on: ["wf-step-cp-1"],
    timeout_seconds: 300,
    retry_count: 0,
    on_failure: "stop",
    inserted_at: now,
    updated_at: now,
  },
  {
    id: "wf-step-cp-3",
    workflow_id: "wf-content-pipeline",
    agent_id: "agt-coderev",
    agent_name: "Code Reviewer",
    agent_emoji: "🧐",
    name: "Editorial Final Review",
    step_type: "agent_task",
    position: 3,
    config: {
      prompt:
        "Perform a final editorial review for tone, accuracy, and brand alignment. Approve or request revisions.",
    },
    depends_on: ["wf-step-cp-2"],
    timeout_seconds: 180,
    retry_count: 0,
    on_failure: "skip",
    inserted_at: now,
    updated_at: now,
  },
];

const bugTriageSteps: WorkflowStep[] = [
  {
    id: "wf-step-bt-1",
    workflow_id: "wf-bug-triage",
    agent_id: null,
    agent_name: null,
    agent_emoji: null,
    name: "Receive Bug Report",
    step_type: "webhook",
    position: 1,
    config: { source: "github", event: "issues.opened" },
    depends_on: [],
    timeout_seconds: 60,
    retry_count: 0,
    on_failure: "stop",
    inserted_at: now,
    updated_at: now,
  },
  {
    id: "wf-step-bt-2",
    workflow_id: "wf-bug-triage",
    agent_id: "agt-dataeng",
    agent_name: "Data Engineer",
    agent_emoji: "📊",
    name: "Analyze Reproduction Steps",
    step_type: "agent_task",
    position: 2,
    config: {
      prompt:
        "Analyze the bug report, reproduce the issue, determine severity (critical/high/medium/low), and identify the affected component.",
    },
    depends_on: ["wf-step-bt-1"],
    timeout_seconds: 600,
    retry_count: 2,
    on_failure: "retry",
    inserted_at: now,
    updated_at: now,
  },
  {
    id: "wf-step-bt-3",
    workflow_id: "wf-bug-triage",
    agent_id: "agt-devops",
    agent_name: "DevOps Agent",
    agent_emoji: "⚙️",
    name: "Assign to Team",
    step_type: "agent_task",
    position: 3,
    config: {
      prompt:
        "Based on the severity and component analysis, assign the bug to the appropriate team and update the issue tracker.",
    },
    depends_on: ["wf-step-bt-2"],
    timeout_seconds: 120,
    retry_count: 0,
    on_failure: "skip",
    inserted_at: now,
    updated_at: now,
  },
];

const weeklyReportSteps: WorkflowStep[] = [
  {
    id: "wf-step-wr-1",
    workflow_id: "wf-weekly-report",
    agent_id: "agt-researcher",
    agent_name: "Analyst",
    agent_emoji: "📈",
    name: "Gather Weekly Metrics",
    step_type: "agent_task",
    position: 1,
    config: {
      prompt:
        "Pull all activity metrics for the past 7 days: completed tasks, agent performance, cost breakdown, and key outcomes.",
    },
    depends_on: [],
    timeout_seconds: 300,
    retry_count: 1,
    on_failure: "stop",
    inserted_at: now,
    updated_at: now,
  },
  {
    id: "wf-step-wr-2",
    workflow_id: "wf-weekly-report",
    agent_id: "agt-researcher",
    agent_name: "Analyst",
    agent_emoji: "📈",
    name: "Generate Report",
    step_type: "agent_task",
    position: 2,
    config: {
      prompt:
        "Format gathered metrics into an executive-friendly weekly report with insights, anomalies, and recommendations for next week.",
    },
    depends_on: ["wf-step-wr-1"],
    timeout_seconds: 300,
    retry_count: 0,
    on_failure: "stop",
    inserted_at: now,
    updated_at: now,
  },
];

let mockWorkflowData: Workflow[] = [
  {
    id: "wf-content-pipeline",
    name: "Content Pipeline",
    slug: "content-pipeline",
    description:
      "Full content production pipeline: strategy brief → SEO optimization → editorial review.",
    status: "active",
    trigger_type: "manual",
    trigger_config: {},
    created_by: "admin",
    version: 1,
    workspace_id: "ws-default",
    organization_id: null,
    step_count: 3,
    last_run_at: yesterday,
    steps: contentPipelineSteps,
    inserted_at: "2026-03-01T00:00:00Z",
    updated_at: now,
  },
  {
    id: "wf-bug-triage",
    name: "Bug Triage",
    slug: "bug-triage",
    description:
      "Automated bug intake: receive webhook → analyze severity → assign to team.",
    status: "active",
    trigger_type: "webhook",
    trigger_config: { source: "github", secret: "***" },
    created_by: "admin",
    version: 2,
    workspace_id: "ws-default",
    organization_id: null,
    step_count: 3,
    last_run_at: now,
    steps: bugTriageSteps,
    inserted_at: "2026-03-05T00:00:00Z",
    updated_at: now,
  },
  {
    id: "wf-weekly-report",
    name: "Weekly Report",
    slug: "weekly-report",
    description:
      "Scheduled weekly digest: gather metrics → generate executive report.",
    status: "draft",
    trigger_type: "schedule",
    trigger_config: { cron: "0 9 * * 1" },
    created_by: "admin",
    version: 1,
    workspace_id: "ws-default",
    organization_id: null,
    step_count: 2,
    last_run_at: null,
    steps: weeklyReportSteps,
    inserted_at: "2026-03-10T00:00:00Z",
    updated_at: now,
  },
];

let mockRunData: Record<string, WorkflowRun[]> = {
  "wf-content-pipeline": [
    {
      id: "wfr-cp-1",
      workflow_id: "wf-content-pipeline",
      status: "completed",
      trigger_event: "manual",
      input: {},
      output: { approved: true },
      started_at: yesterday,
      completed_at: new Date(Date.now() - 82800000).toISOString(),
      error: null,
      step_results: {
        "wf-step-cp-1": { status: "completed" },
        "wf-step-cp-2": { status: "completed" },
        "wf-step-cp-3": { status: "completed" },
      },
      inserted_at: yesterday,
      updated_at: new Date(Date.now() - 82800000).toISOString(),
    },
  ],
  "wf-bug-triage": [
    {
      id: "wfr-bt-1",
      workflow_id: "wf-bug-triage",
      status: "running",
      trigger_event: "webhook",
      input: { issue_id: "GH-1234" },
      output: {},
      started_at: now,
      completed_at: null,
      error: null,
      step_results: {
        "wf-step-bt-1": { status: "completed" },
        "wf-step-bt-2": { status: "running" },
      },
      inserted_at: now,
      updated_at: now,
    },
  ],
};

export function mockWorkflows(): Workflow[] {
  return mockWorkflowData;
}

export function getWorkflowById(id: string): Workflow | undefined {
  return mockWorkflowData.find((w) => w.id === id);
}

export function addWorkflow(workflow: Workflow): void {
  mockWorkflowData = [workflow, ...mockWorkflowData];
}

export function updateWorkflow(
  id: string,
  data: Partial<Workflow>,
): Workflow | undefined {
  const idx = mockWorkflowData.findIndex((w) => w.id === id);
  if (idx === -1) return undefined;
  mockWorkflowData[idx] = {
    ...mockWorkflowData[idx],
    ...data,
    updated_at: new Date().toISOString(),
  };
  return mockWorkflowData[idx];
}

export function deleteWorkflow(id: string): boolean {
  const len = mockWorkflowData.length;
  mockWorkflowData = mockWorkflowData.filter((w) => w.id !== id);
  return mockWorkflowData.length < len;
}

export function getWorkflowSteps(workflowId: string): WorkflowStep[] {
  const wf = getWorkflowById(workflowId);
  return wf?.steps ?? [];
}

export function addWorkflowStep(workflowId: string, step: WorkflowStep): void {
  const idx = mockWorkflowData.findIndex((w) => w.id === workflowId);
  if (idx === -1) return;
  mockWorkflowData[idx] = {
    ...mockWorkflowData[idx],
    steps: [...mockWorkflowData[idx].steps, step],
    step_count: mockWorkflowData[idx].step_count + 1,
    updated_at: new Date().toISOString(),
  };
}

export function removeWorkflowStep(workflowId: string, stepId: string): void {
  const idx = mockWorkflowData.findIndex((w) => w.id === workflowId);
  if (idx === -1) return;
  mockWorkflowData[idx] = {
    ...mockWorkflowData[idx],
    steps: mockWorkflowData[idx].steps.filter((s) => s.id !== stepId),
    step_count: Math.max(0, mockWorkflowData[idx].step_count - 1),
    updated_at: new Date().toISOString(),
  };
}

export function getWorkflowRuns(workflowId: string): WorkflowRun[] {
  return mockRunData[workflowId] ?? [];
}

export function addWorkflowRun(run: WorkflowRun): void {
  const existing = mockRunData[run.workflow_id] ?? [];
  mockRunData[run.workflow_id] = [run, ...existing];
}
