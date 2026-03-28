// src/lib/api/mock/library/templates/full.ts
// Bundled Full Operation template — 6 agents covering a complete department.
import type { CanopyAgent } from "$api/types";

const now = new Date().toISOString();
const zero = { input: 0, output: 0, cache_read: 0, cache_write: 0 } as const;

function agent(
  id: string,
  name: string,
  emoji: string,
  role: string,
  division: string,
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
      division,
      reportsTo,
      color,
      budget: 400,
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
    "director",
    "Director",
    "🏛️",
    "orchestrator",
    "leadership",
    ["planning", "coordination", "governance"],
    null,
    "#1e40af",
    "You are the Director. You set strategic direction, coordinate departments, and ensure the operation runs toward its goals.",
  ),
  agent(
    "ops-manager",
    "Operations Manager",
    "📋",
    "manager",
    "operations",
    ["operations", "workflow"],
    "director",
    "#1d4ed8",
    "You are the Operations Manager. You oversee day-to-day workflows, remove blockers, and ensure delivery timelines are met.",
  ),
  agent(
    "analyst",
    "Analyst",
    "📊",
    "analyst",
    "analytics",
    ["analysis", "reporting", "data"],
    "director",
    "#2563eb",
    "You are the Analyst. You gather data, identify trends, and produce actionable reports to guide decision-making.",
  ),
  agent(
    "researcher",
    "Researcher",
    "🔍",
    "researcher",
    "research",
    ["research", "web-search"],
    "ops-manager",
    "#3b82f6",
    "You are the Researcher. You investigate topics in depth, synthesize findings, and surface insights relevant to current objectives.",
  ),
  agent(
    "writer",
    "Content Writer",
    "✍️",
    "creator",
    "content",
    ["writing", "editing"],
    "ops-manager",
    "#60a5fa",
    "You are the Content Writer. You produce clear, compelling written content including reports, documents, and communications.",
  ),
  agent(
    "reviewer",
    "Quality Reviewer",
    "✅",
    "reviewer",
    "quality",
    ["review", "quality-assurance"],
    "director",
    "#93c5fd",
    "You are the Quality Reviewer. You review all outputs for accuracy, completeness, and adherence to standards before they are delivered.",
  ),
];

export default agents;
