import type { ConfigEntry } from "../types";

const MOCK_CONFIG: ConfigEntry[] = [
  {
    key: "llm.default_model",
    value: "claude-sonnet-4-6",
    type: "string",
    description: "Default LLM model for new agents",
    editable: true,
  },
  {
    key: "budget.default_daily_cents",
    value: 500,
    type: "number",
    description: "Default daily budget for new agents (cents)",
    editable: true,
  },
  {
    key: "system.log_level",
    value: "info",
    type: "string",
    description: "System log level",
    editable: true,
  },
];

export function mockConfig(): ConfigEntry[] {
  return MOCK_CONFIG;
}
