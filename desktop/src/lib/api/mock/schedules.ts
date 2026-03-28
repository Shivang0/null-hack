import type { Schedule } from "../types";

let mockScheduleData: Schedule[] = [
  {
    id: "sched-standup",
    agent_id: "agt-researcher",
    agent_name: "Research Agent",
    cron: "0 9 * * 1-5",
    human_readable: "Weekdays at 9:00 AM",
    enabled: false,
    context:
      "Run daily standup: summarize yesterday's completed issues, flag blockers, list today's priorities.",
    next_run_at: null,
    last_run_at: null,
    last_run_status: null,
    run_count: 0,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "sched-review",
    agent_id: "agt-reviewer",
    agent_name: "Code Reviewer",
    cron: "0 2 * * *",
    human_readable: "Daily at 2:00 AM",
    enabled: false,
    context:
      "Review all pull requests opened today. Post review comments and summary report.",
    next_run_at: null,
    last_run_at: null,
    last_run_status: null,
    run_count: 0,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "sched-infra",
    agent_id: "agt-devops",
    agent_name: "DevOps Agent",
    cron: "*/30 * * * *",
    human_readable: "Every 30 minutes",
    enabled: false,
    context:
      "Check service health endpoints, disk usage, and container status. Alert on anomalies.",
    next_run_at: null,
    last_run_at: null,
    last_run_status: null,
    run_count: 0,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

export function mockSchedules(): Schedule[] {
  return mockScheduleData;
}

export function getScheduleById(id: string): Schedule | undefined {
  return mockScheduleData.find((s) => s.id === id);
}

export function addSchedule(schedule: Schedule): void {
  mockScheduleData = [schedule, ...mockScheduleData];
}

export function updateSchedule(
  id: string,
  data: Partial<Schedule>,
): Schedule | undefined {
  const idx = mockScheduleData.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  mockScheduleData[idx] = {
    ...mockScheduleData[idx],
    ...data,
    updated_at: new Date().toISOString(),
  };
  return mockScheduleData[idx];
}

export function deleteSchedule(id: string): boolean {
  const len = mockScheduleData.length;
  mockScheduleData = mockScheduleData.filter((s) => s.id !== id);
  return mockScheduleData.length < len;
}
