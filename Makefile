.PHONY: setup dev app backend desktop build check test lint format release db.reset db.migrate clean doctor

# ── One-Liner ────────────────────────────────────────────────────────────────
# make setup     # First time: install ALL deps (backend + desktop)
# make dev       # Launch full stack (backend + desktop)
# make app       # Launch full stack with native Tauri app

# ── Setup ────────────────────────────────────────────────────────────────────

setup:
	@echo "Installing backend dependencies..."
	cd backend && mix deps.get
	@echo ""
	@echo "Installing desktop dependencies..."
	cd desktop && npm install
	@echo ""
	@echo "Ready. Run 'make dev' to launch."

# ── Development ──────────────────────────────────────────────────────────────

# Full stack: backend (port 9089) + desktop (port 5200)
dev:
	@./scripts/start.sh

# Full stack with native Tauri app instead of browser
app:
	@./scripts/start.sh --tauri

# Backend only (Phoenix on port 9089)
backend:
	cd backend && mix phx.server

# Desktop only (Vite on port 5200, mock mode)
desktop:
	cd desktop && npm run dev

# ── Build ────────────────────────────────────────────────────────────────────

# Production Tauri app bundle (.app on macOS, .appimage on Linux)
build:
	cd desktop && npm run tauri:build

# ── Quality ──────────────────────────────────────────────────────────────────

check:
	cd desktop && npm run check
	cd backend && mix compile --warnings-as-errors

test:
	cd backend && mix test
	cd desktop && npm run test

lint:           ## Run Elixir + TypeScript linters
	cd backend && mix credo --strict
	cd desktop && npx eslint src/

format:         ## Auto-format all code
	cd backend && mix format
	cd desktop && npx prettier --write "src/**/*.{ts,svelte,css}"

release:        ## Build and package the Tauri desktop app
	cd desktop && npm run tauri build

db.reset:       ## Drop, create, migrate, and seed the database
	cd backend && mix ecto.reset

db.migrate:     ## Run pending migrations
	cd backend && mix ecto.migrate

clean:
	cd desktop && rm -rf build .svelte-kit node_modules
	cd desktop/src-tauri && cargo clean
	cd backend && rm -rf _build deps

# ── Doctor ───────────────────────────────────────────────────────────────────

doctor:
	@echo "Checking prerequisites..."
	@command -v node >/dev/null 2>&1 && echo "  Node.js: $$(node --version)" || echo "  Node.js: MISSING (brew install node)"
	@command -v npm >/dev/null 2>&1 && echo "  npm:     $$(npm --version)" || echo "  npm:     MISSING"
	@command -v rustc >/dev/null 2>&1 && echo "  Rust:    $$(rustc --version)" || echo "  Rust:    MISSING (curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh)"
	@command -v elixir >/dev/null 2>&1 && echo "  Elixir:  $$(elixir --version | head -1)" || echo "  Elixir:  MISSING (brew install elixir)"
	@command -v mix >/dev/null 2>&1 && echo "  Mix:     OK" || echo "  Mix:     MISSING"
	@command -v psql >/dev/null 2>&1 && echo "  Postgres: $$(psql --version)" || echo "  Postgres: MISSING (brew install postgresql@16)"
	@echo ""
	@echo "Checking ports..."
	@lsof -ti:9089 >/dev/null 2>&1 && echo "  Port 9089: IN USE (backend)" || echo "  Port 9089: free"
	@lsof -ti:5200 >/dev/null 2>&1 && echo "  Port 5200: IN USE (desktop)" || echo "  Port 5200: free"
	@lsof -ti:9090 >/dev/null 2>&1 && echo "  Port 9090: IN USE (OSA)" || echo "  Port 9090: free"
