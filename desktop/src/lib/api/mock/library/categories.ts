// Library category constants

export const AGENT_CATEGORIES = [
  "academic",
  "design",
  "engineering",
  "finance",
  "hr",
  "legal",
  "marketing",
  "operations",
  "paid-media",
  "product",
  "project-management",
  "sales",
  "spatial-computing",
  "specialized",
  "support",
  "testing",
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];

export const SKILL_CATEGORIES = [
  "ai-patterns",
  "development",
  "communication",
  "analysis",
  "automation",
  "integration",
  "security",
  "media",
  "finance",
  "productivity",
  "processing",
  "search",
  "strategy",
  "workflow",
  "workspace",
  "governance",
  "learning",
  "agent",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
