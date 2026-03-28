#!/bin/bash
# Canopy Command Center — Quick Launch
# Usage: ./scripts/launch.sh

set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

# Kill any existing instances
lsof -ti:5200 2>/dev/null | xargs kill -9 2>/dev/null || true

# Install deps if needed
[ -d node_modules ] || npm install

# Start Vite dev server
npm run dev &
VITE_PID=$!

# Wait for Vite to be ready
echo "Starting Canopy..."
for i in $(seq 1 30); do
  curl -s -o /dev/null http://127.0.0.1:5200 2>/dev/null && break
  sleep 1
done

# Launch native app if binary exists, otherwise open in browser
if [ -f "$DIR/src-tauri/target/debug/Canopy" ]; then
  "$DIR/src-tauri/target/debug/Canopy" &
  echo "Canopy desktop app launched"
else
  echo "No Tauri binary found. Run 'npm run tauri:build' first for native app."
  echo "Opening in browser at http://127.0.0.1:5200/app"
  open "http://127.0.0.1:5200/app" 2>/dev/null || true
fi

echo "Press Ctrl+C to stop"
wait $VITE_PID
