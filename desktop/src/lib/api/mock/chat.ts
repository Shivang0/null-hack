import type { Message } from "../types";

// Note: mockSessions() in sessions.ts covers the Session list for /sessions.
// This file provides per-session message history and streaming simulation
// used by the chat/conversation UI routes.

const MOCK_MESSAGES: Record<string, Message[]> = {
  "sess-1": [
    {
      id: "msg-1-1",
      session_id: "sess-1",
      role: "user",
      content:
        "Scan the latest commits in the miosa-frontend repo for any hardcoded secrets or API keys.",
      timestamp: new Date(Date.now() - 44_000_000).toISOString(),
      token_usage: { input: 28, output: 0, cache_read: 0, cache_write: 0 },
    },
    {
      id: "msg-1-2",
      session_id: "sess-1",
      role: "assistant",
      content:
        "Starting security scan on recent commits. I'll check for hardcoded credentials, API keys, and sensitive configuration values.",
      timestamp: new Date(Date.now() - 43_900_000).toISOString(),
      thinking: {
        type: "thinking",
        thinking:
          "I need to run git log to get recent commits, then inspect diffs for patterns matching common secret formats: AWS keys, GitHub tokens, generic API keys, private keys.",
      },
      tool_calls: [
        {
          id: "tc-1",
          name: "bash",
          input: { command: "git log --oneline -20 -- miosa-frontend/" },
        },
      ],
      token_usage: {
        input: 1240,
        output: 380,
        cache_read: 8000,
        cache_write: 2000,
      },
    },
    {
      id: "msg-1-3",
      session_id: "sess-1",
      role: "tool",
      content:
        "f268a74 feat(tools): add Platform VM adapter\n15596e7 docs: add computer use architecture\n4f535ab feat(tools): add Docker and Remote SSH adapters\n2e2823f feat(tools): cross-platform computer use\nffefb29 docs: add Command Center desktop UI to README",
      timestamp: new Date(Date.now() - 43_850_000).toISOString(),
    },
    {
      id: "msg-1-4",
      session_id: "sess-1",
      role: "assistant",
      content:
        "I've scanned the 5 most recent commits. No hardcoded secrets found in the diff output. I did flag one potential issue: `VITE_API_URL` is set to a production endpoint in a committed `.env.example` file — this isn't a secret itself, but the pattern could lead to accidental production URL commits. Recommend adding a lint rule to catch `.env` files.\n\nScan summary:\n- **Secrets found:** 0\n- **Warnings:** 1 (env file URL pattern)\n- **Files checked:** 23\n- **Commits scanned:** 5",
      timestamp: new Date(Date.now() - 43_700_000).toISOString(),
      token_usage: {
        input: 2840,
        output: 620,
        cache_read: 8000,
        cache_write: 0,
      },
    },
    {
      id: "msg-1-5",
      session_id: "sess-1",
      role: "user",
      content:
        "Good. Now check the Elixir backend configs for any hardcoded database passwords.",
      timestamp: new Date(Date.now() - 43_600_000).toISOString(),
      token_usage: { input: 22, output: 0, cache_read: 0, cache_write: 0 },
    },
    {
      id: "msg-1-6",
      session_id: "sess-1",
      role: "assistant",
      content:
        "Scanning Elixir config files for hardcoded database credentials...",
      timestamp: new Date(Date.now() - 43_500_000).toISOString(),
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
      token_usage: {
        input: 3100,
        output: 240,
        cache_read: 8000,
        cache_write: 0,
      },
    },
    {
      id: "msg-1-7",
      session_id: "sess-1",
      role: "tool",
      content:
        'config/dev.exs:12:  password: System.get_env("DB_PASSWORD") || "postgres"\nconfig/runtime.exs:8:  secret_key_base: System.fetch_env!("SECRET_KEY_BASE")',
      timestamp: new Date(Date.now() - 43_450_000).toISOString(),
    },
    {
      id: "msg-1-8",
      session_id: "sess-1",
      role: "assistant",
      content:
        'Config scan complete. Results are clean with one minor note:\n\n- `config/dev.exs:12` uses `|| "postgres"` as a fallback for `DB_PASSWORD`. This is acceptable for local development but should never reach production. `config/runtime.exs` correctly uses `System.fetch_env!/1` which will raise at boot if the var is missing — good pattern.\n\n**Verdict:** No hardcoded production credentials. Dev fallback pattern is standard Elixir practice.',
      timestamp: new Date(Date.now() - 43_300_000).toISOString(),
      token_usage: {
        input: 3800,
        output: 480,
        cache_read: 8000,
        cache_write: 0,
      },
    },
  ],
  "sess-2": [
    {
      id: "msg-2-1",
      session_id: "sess-2",
      role: "user",
      content:
        "Review PR #247. Focus on: API contract changes, test coverage, and any breaking changes to existing agent adapters.",
      timestamp: new Date(Date.now() - 119_000_000).toISOString(),
      token_usage: { input: 42, output: 0, cache_read: 0, cache_write: 0 },
    },
    {
      id: "msg-2-2",
      session_id: "sess-2",
      role: "assistant",
      content: "Fetching PR #247 diff and reviewing changes...",
      timestamp: new Date(Date.now() - 118_800_000).toISOString(),
      thinking: {
        type: "thinking",
        thinking:
          "I need to fetch the PR diff, identify changed files, look for adapter interface changes, check test files, and assess backward compatibility.",
      },
      tool_calls: [
        {
          id: "tc-3",
          name: "bash",
          input: { command: "gh pr diff 247 --name-only" },
        },
      ],
      token_usage: {
        input: 5200,
        output: 890,
        cache_read: 15000,
        cache_write: 5000,
      },
    },
    {
      id: "msg-2-3",
      session_id: "sess-2",
      role: "tool",
      content:
        "lib/optimal_system_agent/tools/builtins/computer_use/adapters/macos.ex\nlib/optimal_system_agent/tools/builtins/computer_use/adapters/docker.ex\nlib/optimal_system_agent/tools/builtins/computer_use/server.ex\ntest/tools/computer_use_test.exs\nCHANGELOG.md",
      timestamp: new Date(Date.now() - 118_700_000).toISOString(),
    },
    {
      id: "msg-2-4",
      session_id: "sess-2",
      role: "assistant",
      content:
        "PR #247 analysis complete. Here's my review:\n\n## Summary\nThis PR extends the computer use adapters with Docker and Remote SSH support. The macOS adapter has been refactored to use the new shared accessibility tree module.\n\n## API Contract Changes\n- `ComputerUse.Adapter` behaviour now requires `list_windows/1` callback — **breaking change for custom adapters**\n- `screenshot/2` now returns `{:ok, %{image: binary, tree: map}}` instead of `{:ok, binary}` — **breaking change**\n\n## Test Coverage\n- New: 18 tests for Docker adapter, 12 for SSH adapter\n- Missing: integration tests for macOS accessibility tree (only unit tests with mocks)\n- Coverage delta: +4.2%\n\n## Verdict\n**NEEDS CHANGES** — The behaviour contract change requires a migration guide. Recommend adding a `@deprecated` tag on old callback signatures and a CHANGELOG entry explicitly calling out the breaking changes.\n\n[2 critical, 1 major, 3 minor issues filed]",
      timestamp: new Date(Date.now() - 118_200_000).toISOString(),
      token_usage: {
        input: 18_400,
        output: 2_800,
        cache_read: 15000,
        cache_write: 0,
      },
    },
  ],
  "sess-3": [
    {
      id: "msg-3-1",
      session_id: "sess-3",
      role: "user",
      content:
        "Run the morning docs sync. Check what changed in the last 12 hours and update CHANGELOG.",
      timestamp: new Date(Date.now() - 599_000_000).toISOString(),
      token_usage: { input: 24, output: 0, cache_read: 0, cache_write: 0 },
    },
    {
      id: "msg-3-2",
      session_id: "sess-3",
      role: "assistant",
      content: "Checking git log for changes in the last 12 hours...",
      timestamp: new Date(Date.now() - 598_800_000).toISOString(),
      tool_calls: [
        {
          id: "tc-4",
          name: "bash",
          input: { command: "git log --since='12 hours ago' --oneline" },
        },
      ],
      token_usage: {
        input: 1800,
        output: 180,
        cache_read: 5000,
        cache_write: 1000,
      },
    },
    {
      id: "msg-3-3",
      session_id: "sess-3",
      role: "tool",
      content:
        "f268a74 feat(tools): add Platform VM adapter (#6) for Firecracker microVMs\n15596e7 docs: add computer use architecture and feature documentation",
      timestamp: new Date(Date.now() - 598_700_000).toISOString(),
    },
    {
      id: "msg-3-4",
      session_id: "sess-3",
      role: "assistant",
      content:
        "2 commits found. Updating CHANGELOG.md with entries for both commits...",
      timestamp: new Date(Date.now() - 598_600_000).toISOString(),
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
      token_usage: {
        input: 3200,
        output: 420,
        cache_read: 5000,
        cache_write: 0,
      },
    },
    {
      id: "msg-3-5",
      session_id: "sess-3",
      role: "tool",
      content: "ok",
      timestamp: new Date(Date.now() - 598_500_000).toISOString(),
    },
    {
      id: "msg-3-6",
      session_id: "sess-3",
      role: "assistant",
      content:
        "Morning docs sync complete.\n\n- CHANGELOG.md updated with 2 new entries\n- No undocumented public functions found in changed files\n- README unchanged (no new env vars or dependencies)\n\nRun duration: 8.4 seconds. Cost: $0.065.",
      timestamp: new Date(Date.now() - 598_300_000).toISOString(),
      token_usage: {
        input: 4800,
        output: 560,
        cache_read: 5000,
        cache_write: 0,
      },
    },
  ],
};

export function getMockMessages(sessionId: string): Message[] {
  return MOCK_MESSAGES[sessionId] ?? [];
}

// Generator that yields token-by-token stream events for mock streaming.
// Consumers iterate this and emit each chunk with a timeout between yields.
export function* mockStreamResponse(prompt: string): Generator<{
  type: string;
  delta?: string;
  tool_use_id?: string;
  tool_name?: string;
  input?: Record<string, unknown>;
  session_id?: string;
  message_id?: string;
}> {
  // Simulate a brief thinking block
  yield { type: "thinking_delta", delta: "The user is asking: " };
  yield { type: "thinking_delta", delta: prompt.slice(0, 40) };
  yield {
    type: "thinking_delta",
    delta: ". I should respond helpfully and concisely.",
  };

  // Simulate a tool call
  yield {
    type: "tool_call",
    tool_use_id: "tc-mock-1",
    tool_name: "bash",
    input: { command: "echo 'mock tool execution'" },
  };

  // Simulate tool result
  yield {
    type: "tool_result",
    tool_use_id: "tc-mock-1",
    delta: "mock tool execution",
  };

  // Stream the response tokens
  const response =
    "I've processed your request. Here's what I found:\n\n" +
    "The operation completed successfully. All checks passed with no issues detected. " +
    "The system is operating within normal parameters.\n\n" +
    "**Summary:**\n" +
    "- Status: OK\n" +
    "- Duration: 1.2s\n" +
    "- Issues found: 0";

  const words = response.split(" ");
  for (const word of words) {
    yield { type: "streaming_token", delta: word + " " };
  }

  yield {
    type: "done",
    session_id: "sess-mock",
    message_id: `msg-mock-${Date.now()}`,
  };
}
