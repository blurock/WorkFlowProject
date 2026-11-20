#!/bin/bash
# ==============================================================================
# One-Time Google Cloud Setup for Unified REACT Cloud Run Deployment
# ==============================================================================
# Run this script once per Google Cloud project to:
#   1. Authenticate with gcloud and select the target project
#   2. Enable required Google Cloud APIs
#   3. Create the Artifact Registry Docker repository (if missing)
#   4. Grant Firestore, Cloud Storage, and Blob-Signing IAM roles to Cloud Run
# ==============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-blurock-database}"
REGION="${CLOUD_RUN_REGION:-europe-west1}"
REPO_NAME="${ARTIFACT_REPO:-react-images}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Error: gcloud CLI is not installed or not in PATH." >&2
  exit 1
fi

echo "=== 1/4 Checking gcloud authentication ==="
ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n 1 || true)"
if [[ -z "$ACTIVE_ACCOUNT" ]]; then
  echo "No active gcloud account found. Launching gcloud auth login..."
  gcloud auth login
else
  echo "Authenticated as: $ACTIVE_ACCOUNT"
fi

echo "Setting active project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "=== 2/4 Enabling required Google Cloud APIs ==="
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com

echo "=== 3/4 Ensuring Artifact Registry repository '$REPO_NAME' exists in '$REGION' ==="
if gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" >/dev/null 2>&1; then
  echo "Artifact Registry repository '$REPO_NAME' already exists in '$REGION'."
else
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Unified REACT Cloud Run container images"
fi

echo "=== 4/4 Granting Cloud Run service account permissions ==="
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "Target service account: $RUN_SA"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/datastore.user" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/storage.objectAdmin" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/iam.serviceAccountTokenCreator" >/dev/null

echo ""
echo "One-time Google Cloud setup complete for project '$PROJECT_ID' ($REGION)."
echo "Reminder: After your first deploy, add your Cloud Run hostname (without https://)"
echo "to Firebase Console -> Authentication -> Settings -> Authorized domains:"
echo "  https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings"
