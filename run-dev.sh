#!/usr/bin/env bash
# =============================================================================
# Room Service — Dev Runner (Mac / Linux)
# Starts both client and server with SQLite (no Docker needed).
#
# Requirements:
#   - Node.js 18+
#   - npm install in both /client and /server
#
# Usage:
#   ./run-dev.sh        # normal
#   ./run-dev.sh build  # also build client for production
# =============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")"

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN} Room Service — Dev Mode (SQLite)${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}ERROR: Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi

echo -e "${GREEN}[1/3]${NC} Checking dependencies..."

# Install server deps
if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}  Installing server dependencies...${NC}"
    (cd server && npm install)
fi

# Install client deps
if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}  Installing client dependencies...${NC}"
    (cd client && npm install)
fi

echo ""
echo -e "${GREEN}[2/3]${NC} Starting API server (port 3001)..."

# Create data dir for SQLite
mkdir -p server/data

# Start server in background
(cd server && npm run dev) &
SERVER_PID=$!

echo -e "${GREEN}[3/3]${NC} Starting client dev server (port 5173)..."

# Wait a moment for server to start
sleep 2

# Start client in background
(cd client && npm run dev) &
CLIENT_PID=$!

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  Server:  http://localhost:3001${NC}"
echo -e "${GREEN}  Client:  http://localhost:5173${NC}"
echo -e "${GREEN}  Admin:   http://localhost:5173/admin${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services."
echo ""

# Optional: open browser
if command -v open &> /dev/null; then
    sleep 1
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    sleep 1
    xdg-open http://localhost:5173
fi

# Wait for background processes
wait
