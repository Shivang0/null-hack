// src/lib/api/mock/conversations.ts
// Mock data for the Conversations chat feature

import type { Conversation, ConversationMessage } from "../types";

const NOW = Date.now();
const mins = (n: number) => n * 60_000;
const hours = (n: number) => n * 3_600_000;

// ── Conversations ────────────────────────────────────────────────────────────

let _conversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Security audit — miosa-frontend",
    agent_id: "agent-1",
    agent_name: "Scout",
    agent_avatar: "🔍",
    workspace_id: "ws-1",
    user_id: "user-1",
    status: "active",
    last_message_at: new Date(NOW - mins(12)).toISOString(),
    message_count: 8,
    metadata: {},
    inserted_at: new Date(NOW - hours(12)).toISOString(),
    updated_at: new Date(NOW - mins(12)).toISOString(),
  },
  {
    id: "conv-2",
    title: "PR #247 review — computer use adapters",
    agent_id: "agent-2",
    agent_name: "Aria",
    agent_avatar: "📋",
    workspace_id: "ws-1",
    user_id: "user-1",
    status: "active",
    last_message_at: new Date(NOW - hours(33)).toISOString(),
    message_count: 4,
    metadata: {},
    inserted_at: new Date(NOW - hours(33)).toISOString(),
    updated_at: new Date(NOW - hours(33)).toISOString(),
  },
  {
    id: "conv-3",
    title: "Morning docs sync",
    agent_id: "agent-3",
    agent_name: "Chronicle",
    agent_avatar: "📝",
    workspace_id: "ws-1",
    user_id: "user-1",
    status: "archived",
    last_message_at: new Date(NOW - hours(166)).toISOString(),
    message_count: 6,
    metadata: {},
    inserted_at: new Date(NOW - hours(168)).toISOString(),
    updated_at: new Date(NOW - hours(166)).toISOString(),
  },
];

// ── Messages per conversation ─────────────────────────────────────────────────

const _messages: Record<string, ConversationMessage[]> = {
  "conv-1": [
    {
      id: "cmsg-1-1",
      conversation_id: "conv-1",
      role: "user",
      content:
        "Scan the latest commits in the miosa-frontend repo for any hardcoded secrets or API keys.",
      content_type: "text",
      metadata: {},
      token_count: 28,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(12)).toISOString(),
    },
    {
      id: "cmsg-1-2",
      conversation_id: "conv-1",
      role: "agent",
      content:
        "Starting security scan on recent commits. I'll check for hardcoded credentials, API keys, and sensitive configuration values.",
      content_type: "text",
      metadata: {
        tool_calls: [
          {
            id: "tc-1",
            name: "bash",
            input: { command: "git log --oneline -20 -- miosa-frontend/" },
          },
        ],
      },
      token_count: 380,
      cost_cents: 1,
      inserted_at: new Date(NOW - hours(12) + mins(1)).toISOString(),
    },
    {
      id: "cmsg-1-3",
      conversation_id: "conv-1",
      role: "system",
      content:
        "f268a74 feat(tools): add Platform VM adapter\n15596e7 docs: add computer use architecture\n4f535ab feat(tools): add Docker and Remote SSH adapters",
      content_type: "tool_result",
      metadata: { tool_call_id: "tc-1" },
      token_count: null,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(12) + mins(2)).toISOString(),
    },
    {
      id: "cmsg-1-4",
      conversation_id: "conv-1",
      role: "agent",
      content:
        "I've scanned the 5 most recent commits. **No hardcoded secrets found** in the diff output.\n\nI did flag one potential issue: `VITE_API_URL` is set to a production endpoint in a committed `.env.example` file — this isn't a secret itself, but the pattern could lead to accidental production URL commits.\n\n**Scan summary:**\n- Secrets found: 0\n- Warnings: 1 (env file URL pattern)\n- Files checked: 23\n- Commits scanned: 5",
      content_type: "markdown",
      metadata: {},
      token_count: 620,
      cost_cents: 2,
      inserted_at: new Date(NOW - hours(12) + mins(3)).toISOString(),
    },
    {
      id: "cmsg-1-5",
      conversation_id: "conv-1",
      role: "user",
      content:
        "Good. Now check the Elixir backend configs for any hardcoded database passwords.",
      content_type: "text",
      metadata: {},
      token_count: 22,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(12) + mins(10)).toISOString(),
    },
    {
      id: "cmsg-1-6",
      conversation_id: "conv-1",
      role: "agent",
      content:
        "Scanning Elixir config files for hardcoded database credentials...",
      content_type: "text",
      metadata: {
        tool_calls: [
          {
            id: "tc-2",
            name: "bash",
            input: {
              command:
                "grep -rn 'password\\|passwd\\|secret_key' config/ --include='*.exs' | grep -v '#'",
            },
          },
        ],
      },
      token_count: 240,
      cost_cents: 1,
      inserted_at: new Date(NOW - hours(12) + mins(11)).toISOString(),
    },
    {
      id: "cmsg-1-7",
      conversation_id: "conv-1",
      role: "system",
      content:
        'config/dev.exs:12:  password: System.get_env("DB_PASSWORD") || "postgres"\nconfig/runtime.exs:8:  secret_key_base: System.fetch_env!("SECRET_KEY_BASE")',
      content_type: "tool_result",
      metadata: { tool_call_id: "tc-2" },
      token_count: null,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(12) + mins(12)).toISOString(),
    },
    {
      id: "cmsg-1-8",
      conversation_id: "conv-1",
      role: "agent",
      content:
        'Config scan complete. Results are clean with one minor note:\n\n- `config/dev.exs:12` uses `|| "postgres"` as a fallback for `DB_PASSWORD`. Acceptable for local development but should never reach production.\n- `config/runtime.exs` correctly uses `System.fetch_env!/1` which will raise at boot if the var is missing — good pattern.\n\n**Verdict:** No hardcoded production credentials. Dev fallback pattern is standard Elixir practice.',
      content_type: "markdown",
      metadata: {},
      token_count: 480,
      cost_cents: 2,
      inserted_at: new Date(NOW - hours(12) + mins(13)).toISOString(),
    },
  ],

  "conv-2": [
    {
      id: "cmsg-2-1",
      conversation_id: "conv-2",
      role: "user",
      content:
        "Review PR #247. Focus on: API contract changes, test coverage, and any breaking changes to existing agent adapters.",
      content_type: "text",
      metadata: {},
      token_count: 42,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(33)).toISOString(),
    },
    {
      id: "cmsg-2-2",
      conversation_id: "conv-2",
      role: "agent",
      content: "Fetching PR #247 diff and reviewing changes...",
      content_type: "text",
      metadata: {
        tool_calls: [
          {
            id: "tc-3",
            name: "bash",
            input: { command: "gh pr diff 247 --name-only" },
          },
        ],
      },
      token_count: 890,
      cost_cents: 3,
      inserted_at: new Date(NOW - hours(33) + mins(1)).toISOString(),
    },
    {
      id: "cmsg-2-3",
      conversation_id: "conv-2",
      role: "system",
      content:
        "lib/optimal_system_agent/tools/builtins/computer_use/adapters/macos.ex\nlib/optimal_system_agent/tools/builtins/computer_use/adapters/docker.ex\nlib/optimal_system_agent/tools/builtins/computer_use/server.ex\ntest/tools/computer_use_test.exs\nCHANGELOG.md",
      content_type: "tool_result",
      metadata: { tool_call_id: "tc-3" },
      token_count: null,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(33) + mins(2)).toISOString(),
    },
    {
      id: "cmsg-2-4",
      conversation_id: "conv-2",
      role: "agent",
      content:
        "## PR #247 Review\n\nThis PR extends the computer use adapters with Docker and Remote SSH support.\n\n### API Contract Changes\n- `ComputerUse.Adapter` behaviour now requires `list_windows/1` callback — **breaking change for custom adapters**\n- `screenshot/2` now returns `{:ok, %{image: binary, tree: map}}` instead of `{:ok, binary}` — **breaking change**\n\n### Test Coverage\n- New: 18 tests for Docker adapter, 12 for SSH adapter\n- Missing: integration tests for macOS accessibility tree\n- Coverage delta: +4.2%\n\n### Verdict\n**NEEDS CHANGES** — The behaviour contract change requires a migration guide. Recommend adding a `@deprecated` tag on old callback signatures.",
      content_type: "markdown",
      metadata: {},
      token_count: 2800,
      cost_cents: 9,
      inserted_at: new Date(NOW - hours(33) + mins(5)).toISOString(),
    },
  ],

  "conv-3": [
    {
      id: "cmsg-3-1",
      conversation_id: "conv-3",
      role: "user",
      content:
        "Run the morning docs sync. Check what changed in the last 12 hours and update CHANGELOG.",
      content_type: "text",
      metadata: {},
      token_count: 24,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(168)).toISOString(),
    },
    {
      id: "cmsg-3-2",
      conversation_id: "conv-3",
      role: "agent",
      content: "Checking git log for changes in the last 12 hours...",
      content_type: "text",
      metadata: {
        tool_calls: [
          {
            id: "tc-4",
            name: "bash",
            input: { command: "git log --since='12 hours ago' --oneline" },
          },
        ],
      },
      token_count: 180,
      cost_cents: 1,
      inserted_at: new Date(NOW - hours(168) + mins(1)).toISOString(),
    },
    {
      id: "cmsg-3-3",
      conversation_id: "conv-3",
      role: "system",
      content:
        "f268a74 feat(tools): add Platform VM adapter (#6) for Firecracker microVMs\n15596e7 docs: add computer use architecture and feature documentation",
      content_type: "tool_result",
      metadata: { tool_call_id: "tc-4" },
      token_count: null,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(168) + mins(2)).toISOString(),
    },
    {
      id: "cmsg-3-4",
      conversation_id: "conv-3",
      role: "agent",
      content:
        "2 commits found. Updating CHANGELOG.md with entries for both commits...",
      content_type: "text",
      metadata: {
        tool_calls: [
          {
            id: "tc-5",
            name: "filesystem",
            input: {
              action: "prepend",
              path: "CHANGELOG.md",
              content:
                "## [Unreleased]\n\n### Added\n- Platform VM adapter for Firecracker microVM computer use (#6)\n- Computer use architecture documentation\n",
            },
          },
        ],
      },
      token_count: 420,
      cost_cents: 1,
      inserted_at: new Date(NOW - hours(168) + mins(3)).toISOString(),
    },
    {
      id: "cmsg-3-5",
      conversation_id: "conv-3",
      role: "system",
      content: "ok",
      content_type: "tool_result",
      metadata: { tool_call_id: "tc-5" },
      token_count: null,
      cost_cents: null,
      inserted_at: new Date(NOW - hours(168) + mins(4)).toISOString(),
    },
    {
      id: "cmsg-3-6",
      conversation_id: "conv-3",
      role: "agent",
      content:
        "Morning docs sync complete.\n\n- CHANGELOG.md updated with 2 new entries\n- No undocumented public functions found in changed files\n- README unchanged (no new env vars or dependencies)\n\nRun duration: 8.4 seconds. Cost: $0.065.",
      content_type: "text",
      metadata: {},
      token_count: 560,
      cost_cents: 2,
      inserted_at: new Date(NOW - hours(168) + mins(5)).toISOString(),
    },
  ],
};

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export function getMockConversations(filters?: {
  agent_id?: string;
  status?: string;
}): Conversation[] {
  let result = [..._conversations];
  if (filters?.agent_id) {
    result = result.filter((c) => c.agent_id === filters.agent_id);
  }
  if (filters?.status) {
    result = result.filter((c) => c.status === filters.status);
  }
  return result.sort(
    (a, b) =>
      new Date(b.last_message_at ?? b.inserted_at).getTime() -
      new Date(a.last_message_at ?? a.inserted_at).getTime(),
  );
}

export function getMockConversationById(id: string): Conversation | undefined {
  return _conversations.find((c) => c.id === id);
}

export function getMockConversationMessages(id: string): ConversationMessage[] {
  return _messages[id] ?? [];
}

export function addMockConversation(conv: Conversation): void {
  _conversations = [conv, ..._conversations];
  _messages[conv.id] = [];
}

export function archiveMockConversation(id: string): Conversation | undefined {
  const conv = _conversations.find((c) => c.id === id);
  if (!conv) return undefined;
  conv.status = "archived";
  conv.updated_at = new Date().toISOString();
  return conv;
}

export function deleteMockConversation(id: string): void {
  _conversations = _conversations.filter((c) => c.id !== id);
  delete _messages[id];
}

export function addMockMessage(
  conversationId: string,
  msg: ConversationMessage,
): void {
  if (!_messages[conversationId]) _messages[conversationId] = [];
  _messages[conversationId].push(msg);

  const conv = _conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.message_count += 1;
    conv.last_message_at = msg.inserted_at;
    conv.updated_at = msg.inserted_at;
  }
}

export function mockSendMessage(
  conversationId: string,
  content: string,
): { user_message: ConversationMessage; agent_message: ConversationMessage } {
  const now = new Date().toISOString();
  const conv = _conversations.find((c) => c.id === conversationId);

  const userMsg: ConversationMessage = {
    id: `cmsg-${Date.now()}-u`,
    conversation_id: conversationId,
    role: "user",
    content,
    content_type: "text",
    metadata: {},
    token_count: Math.ceil(content.length / 4),
    cost_cents: null,
    inserted_at: now,
  };

  const agentName = conv?.agent_name ?? "Agent";
  const agentMsg: ConversationMessage = {
    id: `cmsg-${Date.now()}-a`,
    conversation_id: conversationId,
    role: "agent",
    content:
      `${agentName} here. I received your message: "${content.slice(0, 80)}${content.length > 80 ? "..." : ""}"\n\n` +
      "This is a mock response. Real OSA execution will be wired in a future release. " +
      "Your request has been acknowledged.",
    content_type: "text",
    metadata: {},
    token_count: 120,
    cost_cents: 1,
    inserted_at: new Date(Date.now() + 500).toISOString(),
  };

  addMockMessage(conversationId, userMsg);
  addMockMessage(conversationId, agentMsg);

  return { user_message: userMsg, agent_message: agentMsg };
}
