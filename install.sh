#!/usr/bin/env bash
set -euo pipefail

# ── Canopy Installer ─────────────────────────────────────────────────────────
#
# One command to install and launch Canopy:
#
#   curl -fsSL https://raw.githubusercontent.com/Miosa-osa/canopy/main/install.sh | bash
#
# Or if you already cloned:
#
#   ./install.sh
#
# What it does:
#   1. Installs prerequisites if missing (Node.js, Elixir, Rust, PostgreSQL)
#   2. Clones the repo (or uses current directory if already cloned)
#   3. Sets up the database
#   4. Installs all dependencies
#   5. Launches the full stack (backend + desktop app)
# ─────────────────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

REPO="Miosa-osa/canopy"
INSTALL_DIR="${CANOPY_HOME:-$HOME/.canopy-app}"

# ── Platform Detection ───────────────────────────────────────────────────────

case "$(uname -s)" in
  Darwin) OS="macos" ;;
  Linux)  OS="linux" ;;
  MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
  *) echo -e "${RED}Unsupported OS: $(uname -s)${NC}"; exit 1 ;;
esac

# ── Helpers ──────────────────────────────────────────────────────────────────

ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
warn() { echo -e "  ${YELLOW}!${NC} $*"; }
fail() { echo -e "  ${RED}✗${NC} $*"; }
step() { echo -e "\n${BOLD}$*${NC}"; }

has() { command -v "$1" >/dev/null 2>&1; }

install_pkg() {
  local name="$1" brew_pkg="${2:-$1}" apt_pkg="${3:-$2}"
  if [[ "$OS" == "macos" ]]; then
    if has brew; then
      echo -e "  ${DIM}brew install $brew_pkg${NC}"
      brew install "$brew_pkg"
    else
      echo -e "  ${DIM}Installing Homebrew first...${NC}"
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      brew install "$brew_pkg"
    fi
  elif [[ "$OS" == "linux" ]]; then
    if has apt-get; then
      sudo apt-get update -qq && sudo apt-get install -y -qq "$apt_pkg"
    elif has dnf; then
      sudo dnf install -y "$apt_pkg"
    elif has pacman; then
      sudo pacman -S --noconfirm "$apt_pkg"
    else
      fail "No supported package manager found. Install $name manually."
      exit 1
    fi
  fi
}

# ── Banner ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}${BOLD}"
echo "   ╔══════════════════════════════════════╗"
echo "   ║         Canopy Command Center        ║"
echo "   ║     Your AI team, one command away   ║"
echo "   ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── Step 1: Prerequisites ────────────────────────────────────────────────────

step "1/5  Checking prerequisites..."

# Node.js
if has node; then
  ok "Node.js $(node --version)"
else
  warn "Node.js not found — installing..."
  if [[ "$OS" == "macos" ]]; then
    install_pkg "Node.js" "node" "nodejs"
  elif [[ "$OS" == "linux" ]]; then
    # Use fnm for reliable Node.js install
    if ! has fnm; then
      curl -fsSL https://fnm.vercel.app/install | bash
      export PATH="$HOME/.local/share/fnm:$PATH"
      eval "$(fnm env)"
    fi
    fnm install --lts
    fnm use lts-latest
  fi
  ok "Node.js installed: $(node --version)"
fi

# Elixir + Erlang
if has elixir && has mix; then
  ok "Elixir $(elixir --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
else
  warn "Elixir not found — installing..."
  install_pkg "Elixir" "elixir" "elixir"
  ok "Elixir installed"
fi

# PostgreSQL
if has psql; then
  ok "PostgreSQL $(psql --version | grep -oE '[0-9]+\.[0-9]+')"
else
  warn "PostgreSQL not found — installing..."
  if [[ "$OS" == "macos" ]]; then
    install_pkg "PostgreSQL" "postgresql@16" "postgresql"
    brew services start postgresql@16 2>/dev/null || true
  else
    install_pkg "PostgreSQL" "postgresql" "postgresql"
    sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null || true
  fi
  ok "PostgreSQL installed"
fi

# Rust (optional — only needed for native Tauri app builds)
if has rustc; then
  ok "Rust $(rustc --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"
else
  warn "Rust not found — installing (needed for native desktop app)..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  export PATH="$HOME/.cargo/bin:$PATH"
  ok "Rust installed: $(rustc --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"
fi

# ── Step 2: Get the Code ─────────────────────────────────────────────────────

step "2/5  Getting the code..."

# Check if we're already in a canopy repo
if [ -f "mix.exs" ] && grep -q "canopy" "mix.exs" 2>/dev/null; then
  CANOPY_DIR="$(pwd)"
  ok "Already in Canopy directory"
elif [ -f "backend/mix.exs" ] && [ -d "desktop" ]; then
  CANOPY_DIR="$(pwd)"
  ok "Already in Canopy directory"
elif [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/backend/mix.exs" ]; then
  CANOPY_DIR="$INSTALL_DIR"
  ok "Found existing install at $CANOPY_DIR"
else
  echo -e "  ${DIM}Cloning to $INSTALL_DIR...${NC}"
  git clone --depth 1 "https://github.com/$REPO.git" "$INSTALL_DIR"
  CANOPY_DIR="$INSTALL_DIR"
  ok "Cloned to $CANOPY_DIR"
fi

cd "$CANOPY_DIR"

# ── Step 3: Database Setup ───────────────────────────────────────────────────

step "3/5  Setting up database..."

# Check if canopy_dev database exists
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw canopy_dev; then
  ok "Database canopy_dev already exists"
else
  echo -e "  ${DIM}Creating database...${NC}"
  (cd backend && mix ecto.create 2>/dev/null) || {
    # If mix ecto.create fails, try createdb directly
    createdb canopy_dev 2>/dev/null || warn "Could not create database — you may need to configure PostgreSQL"
  }
  ok "Database created"
fi

# Run migrations
echo -e "  ${DIM}Running migrations...${NC}"
(cd backend && mix ecto.migrate 2>/dev/null) && ok "Migrations complete" || warn "Migrations skipped (will retry on launch)"

# Seed data
if [ -f "backend/priv/repo/seeds.exs" ]; then
  echo -e "  ${DIM}Seeding initial data...${NC}"
  (cd backend && mix run priv/repo/seeds.exs 2>/dev/null) && ok "Seed data loaded" || warn "Seeding skipped"
fi

# ── Step 4: Install Dependencies ─────────────────────────────────────────────

step "4/5  Installing dependencies..."

# Backend
if [ ! -d "backend/deps" ] || [ ! -d "backend/_build" ]; then
  echo -e "  ${DIM}Backend: mix deps.get && mix compile...${NC}"
  (cd backend && mix deps.get --quiet && mix compile --quiet)
fi
ok "Backend dependencies ready"

# Desktop
if [ ! -d "desktop/node_modules" ]; then
  echo -e "  ${DIM}Desktop: npm install...${NC}"
  (cd desktop && npm install --silent)
fi
ok "Desktop dependencies ready"

# ── Step 5: Launch ───────────────────────────────────────────────────────────

step "5/5  Launching Canopy..."

echo ""
echo -e "${GREEN}${BOLD}  Setup complete!${NC}"
echo ""
echo -e "  ${BOLD}To start Canopy:${NC}"
echo -e "    cd $CANOPY_DIR"
echo -e "    make dev          ${DIM}# browser mode${NC}"
echo -e "    make app          ${DIM}# native desktop app${NC}"
echo ""
echo -e "  ${BOLD}Starting now...${NC}"
echo ""

exec ./scripts/start.sh
