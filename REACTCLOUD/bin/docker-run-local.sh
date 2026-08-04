#!/bin/bash
# Start reactcloudrun locally, stopping any container already on PORT first.

set -euo pipefail

PORT="${PORT:-8080}"
IMAGE="${IMAGE:-reactcloudrun:local}"
NAME="reactcloudrun-local"

# Kill any container currently bound to the target port.
EXISTING=$(docker ps --format '{{.ID}}\t{{.Ports}}' \
           | awk -v port="$PORT" '$2 ~ ":"port"->" {print $1}')
if [[ -n "$EXISTING" ]]; then
    echo "Stopping container(s) on port $PORT: $EXISTING"
    docker rm -f $EXISTING
fi

# Remove a stale named container if present.
docker rm -f "$NAME" 2>/dev/null || true

echo "Starting $IMAGE as $NAME on port $PORT..."
docker run --name "$NAME" --rm -p "${PORT}:${PORT}" -e PORT="$PORT" "$IMAGE"
