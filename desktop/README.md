# Canopy Command Center

<p align="center">
  <img src="static/canopy-screenshot.png" alt="Canopy Command Center — Virtual Office" width="100%">
</p>

Native desktop command center for AI agent teams. Hire agents, watch them work in a virtual office, monitor costs, and manage everything from one app.

Built with SvelteKit 2 + Tauri 2. Connects to [OSA](https://github.com/Miosa-osa/OSA), Claude Code, Codex, JidoClaw, and other AI adapters. Works offline with mock data — no backend required to start.

## Quick Start

```bash
# One-liner launch
./scripts/launch.sh
```

That's it. Opens the native desktop app with the Vite dev server.

## Manual Setup

### Prerequisites

- Node.js 20+
- Rust toolchain (`rustup`, `cargo`, `rustc`)
- macOS: Xcode Command Line Tools (`xcode-select --install`)
- Linux: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libssl-dev`

### Install & Run

```bash
# Install dependencies
npm install

# Option 1: Browser dev mode (fastest)
npm run dev
# Open http://127.0.0.1:5200/app

# Option 2: Native desktop app (dev mode)
npm run tauri:dev

# Option 3: Production build
npm run tauri:build
# macOS: src-tauri/target/release/bundle/macos/Canopy.app
# Linux: src-tauri/target/release/bundle/appimage/
```

## Adapters

Canopy connects to AI backends through **adapters**. The app auto-detects installed adapters and provides setup wizards for each.

| Adapter | Type | Install |
|---------|------|---------|
| **OSA** | Elixir/OTP agent framework | `curl -fsSL https://raw.githubusercontent.com/Miosa-osa/OSA/main/install.sh \| bash` |
| **Claude Code** | Anthropic CLI agent | `npm install -g @anthropic-ai/claude-code` |
| **Codex** | OpenAI CLI agent | `npm install -g @openai/codex` |
| **JidoClaw** | Jido-based agent platform | `curl -fsSL https://raw.githubusercontent.com/robertohluna/jido_claw/main/install.sh \| bash` |
| **OpenClaw** | Open-source agent | `npm install -g openclaw` |
| **Hermes** | Rust agent runtime | `cargo install hermes-agent` |
| **Bash** | Shell execution | Built-in |
| **HTTP** | Generic REST adapter | Built-in |

### OSA Setup

OSA is the primary adapter. The app includes a full setup assistant (Settings > Integrations):

1. **Auto-detect** — scans `~/.osa/`, common paths, and running ports (9089/9090)
2. **One-click install** — runs the official install script if OSA isn't found
3. **Health check** — verifies the connection and shows version/port
4. **Start/stop** — launches OSA daemon from the app

### Backend (Optional)

The app works standalone with mock data. To connect to the Canopy Phoenix backend:

```bash
cd ../backend
mix phx.server  # Runs on port 9089
```

## Onboarding

First launch walks through:

1. **Welcome** — get started or import an existing `.canopy/` workspace
2. **Provider** — pick your LLM provider (Anthropic, OpenAI, Ollama, etc.) and enter API key
3. **Adapter** — select which agent backend to use
4. **Workspace** — name your workspace and set the directory
5. **Team** — pre-select agents from the library to hire
6. **Launch** — saves config to Tauri secure store and drops you into the dashboard

Provider credentials are stored in the OS keychain via Tauri's secure store (not localStorage).

## Project Structure

```
src/
├── routes/
│   ├── app/                 # 36 pages (dashboard, agents, office, library, etc.)
│   └── onboarding/          # First-run setup wizard
├── lib/
│   ├── api/                 # HTTP client + SSE streaming
│   │   ├── client.ts        # API client (auto-falls back to mock)
│   │   ├── mock/            # Full mock data for offline use
│   │   ├── sse.ts           # Server-Sent Events with auto-reconnect
│   │   └── types.ts         # TypeScript interfaces
│   ├── components/          # 120+ components
│   │   ├── chat/            # Chat UI, streaming, tool calls
│   │   ├── office/          # Virtual office (2D pixel + 3D)
│   │   ├── library/         # Agent/skill/template cards
│   │   ├── costs/           # Budget dashboard, anomaly alerts
│   │   └── layout/          # Sidebar, command palette, toasts
│   ├── services/            # System integration layer
│   │   ├── adapters.ts      # Adapter detection & installation
│   │   ├── credentials.ts   # Secure credential storage
│   │   └── osa.ts           # OSA health, setup, onboarding
│   └── stores/              # Svelte 5 rune stores (30+)
src-tauri/                   # Rust native shell
├── src/
│   ├── lib.rs               # Plugin registration
│   └── filesystem.rs        # Workspace scanning, adapter detection, OSA setup
├── tauri.conf.json          # Window config, CSP, permissions
└── Cargo.toml               # Rust dependencies
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server on :5200 |
| `npm run build` | Static build to `build/` |
| `npm run check` | TypeScript + Svelte type checking |
| `npm run tauri:dev` | Native app in dev mode |
| `npm run tauri:build` | Production .app/.appimage bundle |
| `npm run test` | Run tests |
| `npm run lint` | Lint + format check |

## Architecture

- **Frontend**: SvelteKit 2, Svelte 5 (runes), Tailwind CSS v4
- **Desktop**: Tauri 2 (Rust + WebView), cross-platform (macOS, Linux, Windows)
- **Backend**: Phoenix 1.8 on port 9089 (optional — app works offline with mock data)
- **Adapters**: Pluggable AI backends via Tauri IPC (binary detection + TCP health checks)
- **Security**: Provider keys in OS keychain (Tauri secure store), no plaintext storage
- **Design**: Glassmorphic dark theme with [Foundation](https://github.com/Miosa-osa/foundation) design system tokens
- **Workspace**: `.canopy/` directory protocol for portable agent/team/schedule definitions
