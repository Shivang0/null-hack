import type { Document, DocumentTreeNode } from "../types";

let mockDocumentData: Document[] = [
  {
    id: "doc-1",
    title: "README",
    path: "reference/README.md",
    format: "markdown",
    project_id: "proj-1",
    last_edited_by: "Scribe",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: new Date(Date.now() - 86_400_000).toISOString(),
    content: `# NULLHACK Command Center

NULLHACK is the desktop interface for the OSA Agent system. It provides a unified view of all your AI agents, their schedules, budgets, and outputs.

## Quick Start

\`\`\`bash
cd desktop
npm install
npm run dev
\`\`\`

The app runs on \`http://localhost:5173\` in development mode.

## Architecture

NULLHACK is built with:
- **SvelteKit 2** — routing, SSR, form actions
- **Svelte 5 Runes** — reactive state management
- **Foundation** — MIOSA design system (124 components)
- **Tauri 2** — desktop packaging and native OS integration
- **TypeScript** — strict mode throughout

## Directory Structure

\`\`\`
desktop/
├── src/
│   ├── lib/
│   │   ├── api/          # API client + mock layer
│   │   ├── components/   # Feature components
│   │   └── stores/       # Svelte 5 class-based stores
│   └── routes/           # SvelteKit file-based routes
└── src-tauri/            # Tauri Rust bridge
\`\`\`

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| \`VITE_API_URL\` | Backend API base URL | \`http://localhost:4000\` |
| \`VITE_MOCK_API\` | Use mock API layer | \`false\` |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
`,
  },
  {
    id: "doc-2",
    title: "Architecture Overview",
    path: "reference/architecture.md",
    format: "markdown",
    project_id: "proj-1",
    last_edited_by: "Architect",
    created_at: "2026-03-03T00:00:00Z",
    updated_at: new Date(Date.now() - 172_800_000).toISOString(),
    content: `# Architecture Overview

## System Layers

### 1. Presentation Layer (NULLHACK Desktop)
SvelteKit 2 application compiled with Tauri 2 for native desktop distribution. Communicates with the backend exclusively via HTTP REST + SSE streaming.

### 2. API Gateway (Phoenix)
Elixir/Phoenix application exposing REST endpoints. Handles authentication, authorization, and request routing to the OSA core.

### 3. OSA Core (Elixir/OTP)
The agent runtime — 25 agent modules supervised under a 4-subsystem OTP tree:
- **Infrastructure** — event bus, registry, hooks
- **Sessions** — LLM session lifecycle, streaming
- **AgentServices** — agent roster, budget, scheduler
- **Extensions** — skills, tools, adapters

### 4. Knowledge Layer (miosa_knowledge)
Pure Elixir semantic knowledge graph with native SPARQL parser and OWL 2 RL reasoner. Agents read/write via \`knowledge\` tool.

## Data Flow

\`\`\`
User Action
  → SvelteKit Form Action / API call
    → Phoenix Controller
      → OSA Agent GenServer
        → LLM Provider (Anthropic)
          → Tool calls (filesystem, bash, knowledge, etc.)
            → SSE stream back to NULLHACK
\`\`\`

## State Management

NULLHACK uses **Svelte 5 class-based stores** with runes. Each domain has a dedicated store class:
- \`AgentStore\` — agent roster, lifecycle state
- \`SessionStore\` — active sessions, message history
- \`InboxStore\` — inbox items, unread counts
- \`BudgetStore\` — cost tracking, policy enforcement

## Adapter Pattern

Agents are decoupled from their execution environment via adapters:
| Adapter | Description |
|---|---|
| \`osa\` | Native OSA Elixir runtime |
| \`claude_code\` | Claude Code CLI subprocess |
| \`bash\` | Raw shell execution |
| \`http\` | External HTTP service |
| \`cursor\` | Cursor IDE integration |
`,
  },
  {
    id: "doc-3",
    title: "Scout Agent Guide",
    path: "agents/scout.md",
    format: "markdown",
    project_id: "proj-1",
    last_edited_by: "Scout",
    created_at: "2026-03-05T00:00:00Z",
    updated_at: new Date(Date.now() - 43_200_000).toISOString(),
    content: `# Scout — Security Analyst Agent

## Identity
Scout is the security-focused code analyst in the OSA ecosystem. Scout continuously monitors the codebase for vulnerabilities, dependency issues, and security policy violations.

## Skills
- \`code-review\` — Static analysis with AST inspection
- \`security-scan\` — OWASP Top 10 checks, secret detection
- \`dependency-audit\` — CVE lookups via OSV.dev API

## Schedule
Scout runs on a cron heartbeat every 4 hours:
\`\`\`
0 */4 * * *
\`\`\`

Context injected per run:
\`\`\`
Perform a security review of any files changed since the last run.
Focus on: auth bypass, injection, insecure dependencies, and hardcoded secrets.
Output a structured report with severity levels.
\`\`\`

## Budget Policy
- Daily limit: $10.00
- Per-run limit: $2.50
- Hard stop: enabled
- Warning threshold: 80%

## Output Format
Scout produces structured JSON reports written to \`/workspace/.canopy/reports/security/\`. Reports are indexed in the knowledge graph and surface as Inbox items when issues are found.

## Configuration
\`\`\`yaml
adapter: osa
model: claude-sonnet-4-6
tools:
  - bash
  - filesystem
  - knowledge
  - web_fetch
context_window: 200000
\`\`\`
`,
  },
  {
    id: "doc-4",
    title: "Scribe Agent Guide",
    path: "agents/scribe.md",
    format: "markdown",
    project_id: "proj-1",
    last_edited_by: "Scribe",
    created_at: "2026-03-05T00:00:00Z",
    updated_at: new Date(Date.now() - 259_200_000).toISOString(),
    content: `# Scribe — Documentation Writer Agent

## Identity
Scribe keeps documentation synchronized with the codebase. It reads code changes, generates docstrings, updates changelogs, and maintains the agent knowledge base.

## Skills
- \`doc-writer\` — Generate and update Markdown documentation
- \`markdown-formatter\` — Enforce consistent style (headers, tables, code blocks)
- \`changelog-generator\` — Parse git log and produce CHANGELOG.md entries

## Schedule
Scribe runs twice daily:
\`\`\`
0 7,19 * * *
\`\`\`

Morning run context:
\`\`\`
Review git commits from the last 12 hours.
Update CHANGELOG.md with any notable changes.
Check for undocumented public functions and add JSDoc/ExDoc stubs.
\`\`\`

Evening run context:
\`\`\`
Sync agent guide documents to match current agent configurations.
Update the README if any environment variables or dependencies changed.
\`\`\`

## Budget Policy
- Daily limit: $5.00
- Per-run limit: $1.50
- Hard stop: enabled
- Warning threshold: 85%

## Configuration
\`\`\`yaml
adapter: claude_code
model: claude-sonnet-4-6
tools:
  - filesystem
  - bash
  - knowledge
\`\`\`
`,
  },
  {
    id: "doc-5",
    title: "Heartbeat YAML Template",
    path: "templates/heartbeat.yaml",
    format: "yaml",
    project_id: "proj-1",
    last_edited_by: "Architect",
    created_at: "2026-03-08T00:00:00Z",
    updated_at: new Date(Date.now() - 604_800_000).toISOString(),
    content: `# NULLHACK Heartbeat Schedule Template
# Copy and adapt this file to define a new agent heartbeat.

agent_id: agent-REPLACE_ME
schedule:
  cron: "0 */6 * * *"         # Every 6 hours
  enabled: true
  timezone: UTC
  context: |
    Replace this with the task context injected at each run.
    Be specific about what the agent should accomplish.
    Include any relevant file paths or data sources.

budget:
  per_run_limit_cents: 200     # $2.00 max per heartbeat run
  timeout_seconds: 300         # Abort if run exceeds 5 minutes

notifications:
  on_failure: inbox            # Send inbox alert on failure
  on_success: silent           # No notification on success
  on_budget_warning: inbox

retry:
  enabled: true
  max_attempts: 2
  backoff_seconds: 60
`,
  },
];

export const DOCUMENT_TREE: DocumentTreeNode[] = [
  {
    name: "reference",
    path: "reference",
    type: "directory",
    children: [
      { name: "README.md", path: "reference/README.md", type: "file" },
      {
        name: "architecture.md",
        path: "reference/architecture.md",
        type: "file",
      },
    ],
  },
  {
    name: "agents",
    path: "agents",
    type: "directory",
    children: [
      { name: "scout.md", path: "agents/scout.md", type: "file" },
      { name: "scribe.md", path: "agents/scribe.md", type: "file" },
    ],
  },
  {
    name: "templates",
    path: "templates",
    type: "directory",
    children: [
      {
        name: "heartbeat.yaml",
        path: "templates/heartbeat.yaml",
        type: "file",
      },
    ],
  },
];

export function getDocumentTree(): DocumentTreeNode[] {
  return DOCUMENT_TREE;
}

export function getDocuments(): Document[] {
  return mockDocumentData;
}

export function getDocumentById(id: string): Document | undefined {
  return mockDocumentData.find((d) => d.id === id);
}

export function getDocumentByPath(path: string): Document | undefined {
  return mockDocumentData.find((d) => d.path === path);
}

export function addDocument(doc: Document): void {
  mockDocumentData = [doc, ...mockDocumentData];
}

export function updateDocument(
  id: string,
  data: Partial<Document>,
): Document | undefined {
  const idx = mockDocumentData.findIndex((d) => d.id === id);
  if (idx === -1) return undefined;
  mockDocumentData[idx] = {
    ...mockDocumentData[idx],
    ...data,
    updated_at: new Date().toISOString(),
  };
  return mockDocumentData[idx];
}

export function deleteDocument(id: string): boolean {
  const len = mockDocumentData.length;
  mockDocumentData = mockDocumentData.filter((d) => d.id !== id);
  return mockDocumentData.length < len;
}
