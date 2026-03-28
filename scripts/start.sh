#!/usr/bin/env bash
set -euo pipefail

# ── Canopy Full Stack Launcher ───────────────────────────────────────────────
# Starts the Phoenix backend + SvelteKit desktop app.
#
# Usage:
#   ./scripts/start.sh           # Backend + browser dev server
#   ./scripts/start.sh --tauri   # Backend + native Tauri app
# ─────────────────────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
USE_TAURI=false

for arg in "$@"; do
  case "$arg" in
    --tauri) USE_TAURI=true ;;
  esac
done

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

cleanup() {
  echo -e "\n${DIM}Shutting down...${NC}"
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo -e "${GREEN}Stopped.${NC}"
}
trap cleanup EXIT INT TERM

# ── Prerequisite Check ───────────────────────────────────────────────────────

check() {
  local name="$1" cmd="$2" install_hint="$3"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $name"
  else
    echo -e "  ${RED}✗${NC} $name — install with: ${BOLD}$install_hint${NC}"
    return 1
  fi
}

echo -e "${BOLD}Checking prerequisites...${NC}"
MISSING=0
check "Node.js" node "brew install node" || MISSING=1
check "npm" npm "comes with Node.js" || MISSING=1
check "Elixir" elixir "brew install elixir" || MISSING=1
check "Mix" mix "comes with Elixir" || MISSING=1

if [ "$MISSING" -eq 1 ]; then
  echo -e "\n${RED}Missing prerequisites. Install them and try again.${NC}"
  exit 1
fi
echo ""

# ── Install Dependencies ────────────────────────────────────────────────────

if [ ! -d "$ROOT/backend/deps" ] || [ ! -d "$ROOT/backend/_build" ]; then
  echo -e "${YELLOW}Installing backend dependencies...${NC}"
  (cd "$ROOT/backend" && mix deps.get && mix compile)
  echo ""
fi

if [ ! -d "$ROOT/desktop/node_modules" ]; then
  echo -e "${YELLOW}Installing desktop dependencies...${NC}"
  (cd "$ROOT/desktop" && npm install)
  echo ""
fi

# ── Start Backend ────────────────────────────────────────────────────────────

echo -e "${BOLD}Starting backend on port 9089...${NC}"
(cd "$ROOT/backend" && mix phx.server) &
BACKEND_PID=$!

# Wait for backend to be ready
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:9089/api/v1/health >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo -e "  ${YELLOW}⚠${NC} Backend may still be starting (continuing anyway)"
  fi
  sleep 1
done
echo ""

# ── Start Desktop ───────────────────────────────────────────────────────────

if $USE_TAURI; then
  echo -e "${BOLD}Starting native desktop app...${NC}"
  (cd "$ROOT/desktop" && npm run tauri:dev) &
  FRONTEND_PID=$!
  echo -e "  ${GREEN}✓${NC} Tauri app launching"
else
  echo -e "${BOLD}Starting desktop dev server on port 5200...${NC}"
  (cd "$ROOT/desktop" && npm run dev) &
  FRONTEND_PID=$!

  for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:5200 >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  echo -e "  ${GREEN}✓${NC} Desktop ready at ${BOLD}http://127.0.0.1:5200/app${NC}"

  # Open in browser
  if command -v open >/dev/null 2>&1; then
    open "http://127.0.0.1:5200/app"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://127.0.0.1:5200/app"
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}Canopy is running.${NC}"
echo -e "${DIM}Backend:  http://127.0.0.1:9089${NC}"
echo -e "${DIM}Desktop:  http://127.0.0.1:5200/app${NC}"
echo -e "${DIM}Press Ctrl+C to stop everything.${NC}"
echo ""

wait
