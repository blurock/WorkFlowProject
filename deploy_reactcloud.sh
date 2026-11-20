#!/bin/bash
# ==============================================================================
# Rebuild & Redeploy Unified REACT Stack to Google Cloud Run
# ==============================================================================
# Builds REACTCLOUD (C engine + Orchestrator), REACTInterface (Angular 18),
# and Ketcher Standalone via Google Cloud Build (no local Docker required) and
# deploys the updated image to Google Cloud Run.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PROJECT_ID="${GCP_PROJECT:-blurock-database}"
REGION="${CLOUD_RUN_REGION:-europe-west1}"
REPO_NAME="${ARTIFACT_REPO:-react-images}"
IMAGE_NAME="${CLOUD_RUN_IMAGE:-reactcloud}"
TAG="${IMAGE_TAG:-latest}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-reactcloud}"
GCS_BUCKET="${GCS_BUCKET:-blurock-database.appspot.com}"

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${TAG}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Error: gcloud CLI is not installed or not in PATH." >&2
  exit 1
fi

if [[ ! -f "cloudbuild.yaml" || ! -f "REACTCLOUD/Dockerfile" ]]; then
  echo "Error: Must be run from the WorkFlowProject workspace root containing cloudbuild.yaml and REACTCLOUD/Dockerfile." >&2
  exit 1
fi

if [[ ! -f "ketcher/example/dist/standalone/index.html" ]]; then
  echo "Error: Ketcher Standalone bundle not found at ketcher/example/dist/standalone/index.html." >&2
  echo "Build it first with: (cd ketcher/example && npm run build:standalone)" >&2
  exit 1
fi

echo "=== 1/3 Ensuring gcloud project is '$PROJECT_ID' ==="
gcloud config set project "$PROJECT_ID"

echo "=== 2/3 Building & pushing container image via Cloud Build ==="
echo "Image: $IMAGE_URI"
gcloud beta builds submit \
  --config=cloudbuild.yaml \
  --substitutions="_REGION=${REGION},_REPO=${REPO_NAME},_IMAGE=${IMAGE_NAME},_TAG=${TAG}" \
  .

echo "=== 3/3 Deploying '$SERVICE_NAME' to Cloud Run ($REGION) ==="
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 10 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "GCP_PROJECT=${PROJECT_ID},GCS_BUCKET=${GCS_BUCKET}"

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
echo ""
echo "Deployment complete!"
echo "Service URL: $SERVICE_URL"

if command -v curl >/dev/null 2>&1 && [[ -n "$SERVICE_URL" ]]; then
  echo "Checking health endpoint..."
  curl -fsS "${SERVICE_URL}/api/health" || true
  echo ""
fi
