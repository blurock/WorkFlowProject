#!/usr/bin/env bash
# ==============================================================================
# REACTInterface & REACTCLOUD Master Startup Script
# ==============================================================================
# Starts all backend C compilation, Node.js Orchestrator, and Angular Frontend
# services required for REACTInterface with pre-flight running checks.
# ==============================================================================

set -e

# Configuration
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REACTROOT="${WORKSPACE_DIR}/REACTCLOUD"
CCROOT="${WORKSPACE_DIR}/REACTCLOUD"
INTERFACE_DIR="${WORKSPACE_DIR}/REACTInterface"

ORCH_PORT=8085
FRONTEND_PORT=4200

ORCH_LOG="/tmp/react_orchestrator.log"
FRONTEND_LOG="/tmp/react_frontend.log"

export REACTROOT
export CCROOT

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# Helper Functions
is_port_in_use() {
    local port="$1"
    if command -v lsof >/dev/null 2>&1; then
        lsof -i ":${port}" -sTCP:LISTEN >/dev/null 2>&1
    else
        nc -z localhost "${port}" >/dev/null 2>&1
    fi
}

get_pid_on_port() {
    local port="$1"
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti ":${port}" | head -n 1
    else
        echo ""
    fi
}

check_status() {
    echo -e "${BOLD}=== REACT Stack Status ===${NC}"
    
    # 1. Orchestrator
    if is_port_in_use "$ORCH_PORT"; then
        local pid=$(get_pid_on_port "$ORCH_PORT")
        echo -e "  [${GREEN}RUNNING${NC}] Orchestrator Service (Port ${ORCH_PORT}, PID: ${pid:-unknown})"
        echo -e "           URL: http://localhost:${ORCH_PORT}/api/health"
    else
        echo -e "  [${RED}STOPPED${NC}] Orchestrator Service (Port ${ORCH_PORT})"
    fi

    # 2. Frontend
    if is_port_in_use "$FRONTEND_PORT"; then
        local pid=$(get_pid_on_port "$FRONTEND_PORT")
        echo -e "  [${GREEN}RUNNING${NC}] REACTInterface Frontend (Port ${FRONTEND_PORT}, PID: ${pid:-unknown})"
        echo -e "           URL: http://localhost:${FRONTEND_PORT}"
    else
        echo -e "  [${RED}STOPPED${NC}] REACTInterface Frontend (Port ${FRONTEND_PORT})"
    fi
    echo ""
}

stop_services() {
    echo -e "${YELLOW}Stopping REACT Stack services...${NC}"
    if is_port_in_use "$ORCH_PORT"; then
        local pid=$(get_pid_on_port "$ORCH_PORT")
        if [ -n "$pid" ]; then
            echo "Stopping Orchestrator (PID: $pid)..."
            kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
        fi
    else
        echo "Orchestrator not running."
    fi

    if is_port_in_use "$FRONTEND_PORT"; then
        local pid=$(get_pid_on_port "$FRONTEND_PORT")
        if [ -n "$pid" ]; then
            echo "Stopping REACTInterface Frontend (PID: $pid)..."
            kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
        fi
    else
        echo "Frontend not running."
    fi
    echo -e "${GREEN}Services stopped.${NC}"
}

build_backend() {
    echo -e "${CYAN}Building REACT C backend libraries and chemdb binary...${NC}"
    cd "${REACTROOT}"
    make library chemdb
    echo -e "${GREEN}C Backend build complete.${NC}"
}

# Process Command Line Arguments
FORCE_BUILD=false
case "${1:-}" in
    --status)
        check_status
        exit 0
        ;;
    --stop)
        stop_services
        exit 0
        ;;
    --build)
        FORCE_BUILD=true
        ;;
    --help)
        echo "Usage: ./start_react_stack.sh [OPTION]"
        echo "Options:"
        echo "  (none)     Start all missing services"
        echo "  --status   Check status of all stack services"
        echo "  --stop     Stop all running stack services"
        echo "  --build    Rebuild C backend binary before starting"
        exit 0
        ;;
esac

echo -e "${BOLD}${CYAN}======================================================${NC}"
echo -e "${BOLD}${CYAN}      REACTInterface & REACTCLOUD Startup             ${NC}"
echo -e "${BOLD}${CYAN}======================================================${NC}"

# Step 1: C Binary Build Check
if [ "$FORCE_BUILD" = true ] || [ ! -f "${REACTROOT}/bin/chemdb" ]; then
    build_backend
else
    echo -e "  [${GREEN}OK${NC}] C backend binary found at ${REACTROOT}/bin/chemdb"
fi

# Step 2: Orchestrator Service Check & Launch
echo -e "\n${BOLD}[1/2] Checking Orchestrator Service (Port ${ORCH_PORT})...${NC}"
if is_port_in_use "$ORCH_PORT"; then
    local_pid=$(get_pid_on_port "$ORCH_PORT")
    echo -e "  [${GREEN}ALREADY RUNNING${NC}] Orchestrator is active on port ${ORCH_PORT} (PID: ${local_pid:-unknown})"
else
    echo "Starting Orchestrator Node.js server..."
    cd "${REACTROOT}/orchestrator"
    
    # Check dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing Orchestrator npm dependencies..."
        npm install
    fi
    
    PORT=${ORCH_PORT} REACTROOT="${REACTROOT}" CCROOT="${CCROOT}" node server.js > "${ORCH_LOG}" 2>&1 &
    ORCH_PID=$!
    echo "  Spawned Orchestrator (PID: ${ORCH_PID}), logging to ${ORCH_LOG}"
    
    # Wait for health endpoint
    echo -n "  Waiting for Orchestrator health check..."
    for i in {1..15}; do
        if curl -s "http://localhost:${ORCH_PORT}/api/health" >/dev/null 2>&1; then
            echo -e " [${GREEN}ONLINE${NC}]"
            break
        fi
        sleep 1
    done
fi

# Step 3: REACTInterface Angular Frontend Check & Launch
echo -e "\n${BOLD}[2/2] Checking REACTInterface Frontend (Port ${FRONTEND_PORT})...${NC}"
if is_port_in_use "$FRONTEND_PORT"; then
    frontend_pid=$(get_pid_on_port "$FRONTEND_PORT")
    echo -e "  [${GREEN}ALREADY RUNNING${NC}] REACTInterface Frontend is active on port ${FRONTEND_PORT} (PID: ${frontend_pid:-unknown})"
else
    echo "Starting REACTInterface Angular frontend..."
    cd "${INTERFACE_DIR}"
    
    if [ ! -d "node_modules" ]; then
        echo "Installing REACTInterface npm dependencies..."
        npm install
    fi
    
    npm start > "${FRONTEND_LOG}" 2>&1 &
    FRONTEND_PID=$!
    echo "  Spawned REACTInterface Frontend (PID: ${FRONTEND_PID}), logging to ${FRONTEND_LOG}"
    echo "  (Frontend compilation usually takes ~10-15 seconds)"
fi

echo -e "\n${BOLD}${GREEN}======================================================${NC}"
echo -e "${BOLD}${GREEN}   REACT Stack successfully initialized!              ${NC}"
echo -e "${BOLD}${GREEN}======================================================${NC}"
echo -e "  - ${BOLD}REACTInterface Frontend:${NC} http://localhost:${FRONTEND_PORT}"
echo -e "  - ${BOLD}Orchestrator Backend:${NC}   http://localhost:${ORCH_PORT}"
echo -e "  - ${BOLD}Orchestrator Logs:${NC}      ${ORCH_LOG}"
echo -e "  - ${BOLD}Frontend Logs:${NC}          ${FRONTEND_LOG}"
echo -e "\nUse ${BOLD}./start_react_stack.sh --status${NC} to check status or ${BOLD}./start_react_stack.sh --stop${NC} to shutdown.\n"
