# Unified REACT System — Google Cloud Run Deployment Guide

This guide provides complete, step-by-step instructions to build and deploy the **entire REACT stack** using [`REACTCLOUD/Dockerfile`](./Dockerfile) to **Google Cloud Run**.

---

## 1. Do I Need to Start Docker on This Computer?

**No — you do NOT need Docker installed or running on your computer to deploy to Google Cloud.**

By using **Google Cloud Build** (`gcloud builds submit --config=cloudbuild.yaml .`), your Mac simply uploads the filtered project files (~170 MB, compressed to ~50 MB) to Google Cloud, and Google's own build servers run Docker in the cloud, compile the C engine and Angular app, package Ketcher, and push the resulting container image directly to **Google Artifact Registry**.

* **Deploy to Google Cloud Run (Recommended)**: Local Docker is **NOT required**.
* **Optional Local Container Testing**: Start Docker Desktop on your Mac *only* if you want to build and test the container locally on `http://localhost:8080` before deploying.

---

## 2. What Is Packaged in the Unified Docker Image?

[`REACTCLOUD/Dockerfile`](./Dockerfile) uses a **3-stage multi-stage build** that packages all three projects of the REACT system into a single Cloud Run container running on port `8080`:

| Project | Build Stage | Runtime Path in Container | Served URL Path |
| :--- | :--- | :--- | :--- |
| **1. `REACTCLOUD`** (C backend `chemdb` + libraries + Node.js Orchestrator) | Stage 1 (`c-builder`, Ubuntu 22.04) | `/opt/react/bin/chemdb`, `/opt/react/orchestrator` | `/api/*` and `/health` |
| **2. `REACTInterface`** (Angular 18 web app, production config) | Stage 2 (`frontend-builder`, Node 20) | `/opt/react/public/frontend` | `/` (SPA fallback) |
| **3. `ketcher`** (Ketcher Standalone 2D chemical editor) | Stage 3 (`runtime`, pre-built `ketcher/example/dist/standalone`) | `/opt/react/public/ketcher` | `/ketcher/` |

### Why One Unified Container?
* **Single Cloud Run URL & Port (`8080`)**: No need to manage separate services or cross-origin networking between the Angular app, Orchestrator API, and Ketcher.
* **Same-Origin Architecture**: In production (`REACTInterface/src/environments/environment.prod.ts`), `apiBaseUrl` is `''` (relative `/api/*`) and `ketcherUrl` is `'/ketcher/index.html'`. This eliminates CORS errors and cross-origin `<iframe>` restrictions with Ketcher.
* **Automatic C-Engine IPC Port Binding**: The entrypoint and Orchestrator automatically propagate `REACT_ORCHESTRATOR_PORT=$PORT` (`8080` on Cloud Run) so `chemdb` always connects back to the local Orchestrator Firestore bridge.
* **Fast Cloud Uploads**: Root [`.gcloudignore`](../.gcloudignore) and [`.dockerignore`](../.dockerignore) exclude `node_modules/`, `.angular/`, `*.rawout`, macOS binaries, and unrelated sibling repositories so Cloud Build uploads only ~170 MB instead of 30+ GB.

---

## 3. Prerequisites & One-Time Google Cloud Setup

Run these commands **once** in your terminal to prepare Google Cloud for project `blurock-database` (region `europe-west1`).

### 3.1 Authenticate and Select Project
```bash
gcloud auth login
gcloud config set project blurock-database
```

### 3.2 Enable Required Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com
```

### 3.3 Create the Artifact Registry Docker Repository (One-Time)
```bash
gcloud artifacts repositories create react-images \
  --repository-format=docker \
  --location=europe-west1 \
  --description="Unified REACT Cloud Run container images"
```
*(If the repository already exists, `gcloud` will tell you — you can safely proceed to Section 4.)*

### 3.4 Verify Cloud Run Service Account Permissions
By default, Cloud Run runs as the Compute Engine default service account (`315685320181-compute@developer.gserviceaccount.com`) or a custom service account. Ensure it has access to Firestore and Cloud Storage (`blurock-database.appspot.com`):

```bash
export PROJECT_ID="blurock-database"
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
export RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant Firestore access
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/datastore.user"

# Grant Cloud Storage access (for mechanism artifacts & execution logs)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/storage.objectAdmin"

# Optional: allow signing V4 GCS download URLs directly on Cloud Run
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

---

## 4. Deploy to Google Cloud Run (No Local Docker Needed)

> **Important:** Always run `gcloud builds submit` from the **workspace root** (`/Users/edwardblurock/git/WorkFlowProject`), NOT from inside `REACTCLOUD/`. This gives Docker access to `REACTCLOUD/`, `REACTInterface/`, and `ketcher/`.

### Step 1: Confirm Ketcher Standalone Bundle Exists
The Dockerfile copies the pre-built Ketcher Standalone app from `ketcher/example/dist/standalone`. Verify it exists:
```bash
ls -la /Users/edwardblurock/git/WorkFlowProject/ketcher/example/dist/standalone/index.html
```
*(Only if you ever modify Ketcher source code and need to rebuild it: run `cd /Users/edwardblurock/git/WorkFlowProject/ketcher/example && npm run build:standalone` first.)*

### Step 2: Build & Push the Container Image in Google Cloud Build
```bash
cd /Users/edwardblurock/git/WorkFlowProject

gcloud builds submit --config=cloudbuild.yaml .
```
This runs on an 8-vCPU Cloud Build machine (`E2_HIGHCPU_8`), compiles `chemdb` for Ubuntu Linux, builds `REACTInterface` in production mode, bundles Ketcher Standalone, and pushes:
```text
europe-west1-docker.pkg.dev/blurock-database/react-images/reactcloud:latest
```
*(Typical build time: 3–6 minutes.)*

### Step 3: Deploy the Image to Google Cloud Run
```bash
gcloud run deploy reactcloud \
  --image europe-west1-docker.pkg.dev/blurock-database/react-images/reactcloud:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 10 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "GCP_PROJECT=blurock-database,GCS_BUCKET=blurock-database.appspot.com"
```

> **Optional Environment Variables:**
> You can also pass `--set-env-vars` with:
> * `ADMIN_BOOTSTRAP_UIDS=UOqk0KtFtaXma5TGsi8Seh9RMbx1` (ensures your admin UID is bootstrapped if needed)
> * `ALLOWED_ORIGINS=https://reactcloud-315685320181.europe-west1.run.app,https://blurock-database.web.app`

When `gcloud run deploy` finishes, it prints your live **Service URL**, for example:
```text
Service URL: https://reactcloud-315685320181.europe-west1.run.app
```

### Step 4: Authorize the Cloud Run Domain in Firebase Authentication (One-Time)
So Google, GitHub, Microsoft, and Email sign-in work on your Cloud Run URL:
1. Open the [Firebase Console](https://console.firebase.google.com/project/blurock-database/authentication/settings).
2. Go to **Authentication** → **Settings** → **Authorized domains**.
3. Click **Add domain** and add your Cloud Run hostname (without `https://`), e.g.:
   ```text
   reactcloud-315685320181.europe-west1.run.app
   ```
4. Click **Add**.

---

## 5. Verify Your Deployment

Replace `<SERVICE_URL>` with the URL printed by `gcloud run deploy` (e.g. `https://reactcloud-315685320181.europe-west1.run.app`):

### 5.1 Verify All 3 Projects Are Bundled & Online
```bash
curl -s <SERVICE_URL>/api/health | python3 -m json.tool
```
Expected response:
```json
{
  "status": "UP",
  "backend": "REACTCLOUD Orchestrator",
  "project": "blurock-database",
  "components": {
    "chemdb": true,
    "orchestrator": true,
    "frontend": true,
    "ketcher": true
  },
  "timestamp": "..."
}
```
Confirm all four flags under `components` are **`true`**.

### 5.2 Verify in Your Browser
1. **REACTInterface Web App**: Open `<SERVICE_URL>/`
   * Sign in with your Firebase account.
   * Check **Molecules List** or **Manage Path Sets** to verify Firestore + `chemdb` IPC works.
2. **Ketcher Standalone**: Open `<SERVICE_URL>/ketcher/` directly, OR open **Molecule Creator & Editor** / **Reaction Pattern Generator** inside REACTInterface to verify the embedded Ketcher 2D editor loads smoothly.

---

## 6. Routine Redeployment (After Code Changes)

Whenever you make changes to `REACTCLOUD`, `REACTInterface`, or `ketcher`, simply run these two commands from the workspace root:

```bash
cd /Users/edwardblurock/git/WorkFlowProject

gcloud builds submit --config=cloudbuild.yaml .

gcloud run deploy reactcloud \
  --image europe-west1-docker.pkg.dev/blurock-database/react-images/reactcloud:latest \
  --region europe-west1
```

---

## 7. Optional: Testing the Docker Image Locally (Requires Docker Desktop)

If you *do* want to test the exact Cloud Run container on your Mac before deploying:

1. **Start Docker Desktop** on your Mac.
2. From the workspace root, build and start the container:
   ```bash
   cd /Users/edwardblurock/git/WorkFlowProject
   docker compose up --build
   ```
3. Open in your browser:
   * Frontend: `http://localhost:8080/`
   * Health check: `http://localhost:8080/api/health`
   * Ketcher editor: `http://localhost:8080/ketcher/`
4. To stop: press `Ctrl+C` or run `docker compose down`.

*(Note: Local containers do not automatically have GCP credentials unless you mount your Application Default Credentials file with `-v ~/.config/gcloud:/opt/react/.config/gcloud:ro`. On Google Cloud Run, credentials are provided automatically via the attached service account.)*

---

## 8. Monitoring, Logs & Troubleshooting

### View Live Cloud Run Logs
```bash
gcloud run services logs tail reactcloud --region europe-west1
```

### Common Issues & Fixes

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `auth/unauthorized-domain` on login | Cloud Run domain not whitelisted in Firebase Auth | Add your `*.run.app` domain in Firebase Console → Authentication → Settings → Authorized domains (Step 4). |
| `gcloud builds submit` fails with `REPOSITORY_NOT_FOUND` | Artifact Registry repo `react-images` not yet created | Run the `gcloud artifacts repositories create react-images ...` command in Section 3.3. |
| `PERMISSION_DENIED` on Firestore or Cloud Storage | Cloud Run service account missing IAM roles | Run the IAM policy binding commands in Section 3.4. |
| Ketcher iframe shows 404 | `ketcher/example/dist/standalone` was missing during build | Rebuild Ketcher standalone (`cd ketcher/example && npm run build:standalone`) and re-run `gcloud builds submit`. |
| `chemdb` execution fails with database connection error | Orchestrator IPC port mismatch | Automatically fixed in `entrypoint.sh` and `server.js` via `REACT_ORCHESTRATOR_PORT=$PORT`. Check Cloud Run logs for details. |
| Local dev (`./start_react_stack.sh`) | Still uses `environment.ts` (`localhost:8085` & `localhost:4002`) | Unchanged — local development continues working exactly as before. |

