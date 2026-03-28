import type { Secret } from "../types";

const MOCK_SECRETS: Secret[] = [
  {
    id: "secret-anthropic",
    name: "ANTHROPIC_API_KEY",
    type: "api_key",
    description: "Anthropic API key for LLM access",
    last_rotated_at: "2026-03-01T00:00:00Z",
    expires_at: null,
    created_by: "user-admin",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "secret-github",
    name: "GITHUB_TOKEN",
    type: "token",
    description: "GitHub personal access token for repo operations",
    last_rotated_at: null,
    expires_at: "2026-06-01T00:00:00Z",
    created_by: "user-admin",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
];

export function mockSecrets(): Secret[] {
  return MOCK_SECRETS;
}
