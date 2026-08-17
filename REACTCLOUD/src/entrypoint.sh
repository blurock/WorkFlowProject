#!/bin/bash

set -euo pipefail

REACTROOT="${REACTROOT:-/opt/react}"
CCROOT="${CCROOT:-/opt/react}"
PORT="${PORT:-}"
REACT_MODE="${REACT_MODE:-}"

export REACTROOT CCROOT

CHEMDB_BIN="$REACTROOT/bin/chemdb"
ORCHESTRATOR_BIN="$REACTROOT/orchestrator/server.js"

start_http() {
    if [[ -f "$ORCHESTRATOR_BIN" ]]; then
        exec node "$ORCHESTRATOR_BIN" "$@"
    elif [[ -x "$HTTP_BIN" ]]; then
        if [[ -n "$PORT" ]]; then
            exec "$HTTP_BIN" --port "$PORT" "$@"
        fi
        exec "$HTTP_BIN" "$@"
    fi
}

start_cli() {
    exec "$CHEMDB_BIN" "$@"
}

if [[ ! -x "$CHEMDB_BIN" ]]; then
    echo "chemdb binary not found at $CHEMDB_BIN" >&2
    exit 1
fi

if [[ ! -f "$ORCHESTRATOR_BIN" && ! -x "${HTTP_BIN:-}" ]]; then
    echo "No http handler binary or orchestrator found at $REACTROOT" >&2
    exit 1
fi

case "${1:-}" in
    http)
        shift
        start_http "$@"
        ;;
    cli)
        shift
        start_cli "$@"
        ;;
esac

case "$REACT_MODE" in
    http)
        start_http "$@"
        ;;
    cli)
        start_cli "$@"
        ;;
esac

if [[ $# -eq 0 && -n "$PORT" ]]; then
    start_http
fi

start_cli "$@"
