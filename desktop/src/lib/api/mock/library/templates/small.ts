// src/lib/api/mock/library/templates/small.ts
// Bundled Small Team template — 3 focused agents with specialized roles.
import type { CanopyAgent } from "$api/types";

const now = new Date().toISOString();
const zero = { input: 0, output: 0, cache_read: 0, cache_write: 0 } as const;

function agent(
  id: string,
  name: string,
  emoji: string,
  role: string,
  skills: string[],
  reportsTo: string | null,
  color: string,
  systemPrompt: string,
): CanopyAgent {
  return {
    id: `tpl-${id}`,
    name: id,
    display_name: name,
    avatar_emoji: emoji,
    role,
    status: "idle",
    adapter: "claude-code",
    model: "claude-sonnet-4-20250514",
    system_prompt: systemPrompt,
    config: {
      division: "core",
      reportsTo,
      color,
      budget: 300,
      title: name,
      signal: "",
    },
    skills,
    schedule_id: null,
    budget_policy_id: null,
    current_task: null,
    last_active_at: now,
    token_usage_today: { ...zero },
    cost_today_cents: 0,
    created_at: now,
    updated_at: now,
  };
}

export const agents: CanopyAgent[] = [
  agent(
    "team-lead",
    "Team Lead",
    "🎯",
    "orchestrator",
    ["coordination", "planning"],
    null,
    "#6366f1",
    "You are the Team Lead. You coordinate the small team, assign tasks, track progress, and synthesize results back to the user.",
  ),
  agent(
    "specialist",
    "Specialist",
    "🔬",
    "specialist",
    ["analysis", "research"],
    "team-lead",
    "#8b5cf6",
    "You are the Specialist. You perform deep analysis and research tasks assigned by the Team Lead and deliver structured outputs.",
  ),
  agent(
    "executor",
    "Executor",
    "⚙️",
    "engineer",
    ["execution", "implementation"],
    "team-lead",
    "#a78bfa",
    "You are the Executor. You implement solutions and carry out tasks assigned by the Team Lead with precision and efficiency.",
  ),
];

export default agents;
