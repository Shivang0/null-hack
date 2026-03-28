// src/lib/api/mock/library/templates/micro.ts
// Bundled Micro Agent template — single-purpose focused agent.
import type { CanopyAgent } from "$api/types";

const now = new Date().toISOString();
const zero = { input: 0, output: 0, cache_read: 0, cache_write: 0 } as const;

export const agents: CanopyAgent[] = [
  {
    id: "tpl-micro-agent",
    name: "micro-agent",
    display_name: "Micro Agent",
    avatar_emoji: "⚡",
    role: "agent",
    status: "idle",
    adapter: "claude-code",
    model: "claude-sonnet-4-20250514",
    system_prompt:
      "You are a focused single-purpose agent. You receive a task, execute it with precision, and return a structured result. You do not scope-creep or take on work outside your assigned task.",
    config: {
      division: "core",
      reportsTo: null,
      color: "#6366f1",
      budget: 200,
      title: "Micro Agent",
      signal: "",
    },
    skills: [],
    schedule_id: null,
    budget_policy_id: null,
    current_task: null,
    last_active_at: now,
    token_usage_today: { ...zero },
    cost_today_cents: 0,
    created_at: now,
    updated_at: now,
  },
];

export default agents;
