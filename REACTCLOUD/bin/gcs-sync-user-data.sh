#!/bin/bash
# Helper script for user data file synchronization with Google Cloud Storage
set -euo pipefail

ACTION="${1:-}"
LOCAL_PATH="${2:-}"
GCS_REL_PATH="${3:-}"

USER_ID="${REACT_USER_ID:-user_default_local}"
BUCKET="${GCS_BUCKET:-blurock-database.appspot.com}"

if [[ -z "$ACTION" || -z "$LOCAL_PATH" || -z "$GCS_REL_PATH" ]]; then
    echo "Usage: $0 <download|upload> <local_path> <gcs_relative_path>" >&2
    exit 1
fi

GCS_URI="gs://${BUCKET}/${GCS_REL_PATH}"

if [[ "$ACTION" == "download" ]]; then
    if command -v gcloud &>/dev/null; then
        gcloud storage cp "$GCS_URI" "$LOCAL_PATH" 2>/dev/null || exit 1
    elif command -v gsutil &>/dev/null; then
        gsutil cp "$GCS_URI" "$LOCAL_PATH" 2>/dev/null || exit 1
    else
        echo "No gcloud or gsutil command found" >&2
        exit 1
    fi
elif [[ "$ACTION" == "upload" ]]; then
    if command -v gcloud &>/dev/null; then
        gcloud storage cp "$LOCAL_PATH" "$GCS_URI" 2>/dev/null || exit 1
    elif command -v gsutil &>/dev/null; then
        gsutil cp "$LOCAL_PATH" "$GCS_URI" 2>/dev/null || exit 1
    else
        echo "No gcloud or gsutil command found" >&2
        exit 1
    fi
fi
