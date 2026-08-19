---
name: Compile REACT Backend
description: Instructions for compiling the REACT C backend libraries and chemdb executable, running the local Node.js Orchestrator with user management, and deploying backend & frontend updates to Google Cloud.
---

# Compile REACT Backend & Deploy Cloud Version

## Overview

This guide details the complete process for:
1. Recompiling REACT C libraries (`chemdb`) when backend changes are made.
2. Running and testing the local Node.js Orchestrator service (`server.js`) with user management.
3. Deploying updated backend containers to **Google Cloud Run** and frontend applications to **Firebase Hosting**.

---

## 1. Required Environment Variables

Before running `make` or starting the local orchestrator server, export the absolute paths for `REACTROOT` and `CCROOT`:

```bash
export REACTROOT=/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
export CCROOT=/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
```

If working inside the `REACTCLOUD` directory:
```bash
export REACTROOT=$PWD
export CCROOT=$PWD
```

---

## 2. Local C Backend Compilation Workflow

When C source files or headers in any module directory (`comlib`, `molecules`, `rxn`, `chemdb`, etc.) are modified:

1. Navigate to the `REACTCLOUD` directory:
   ```bash
   cd /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
   ```

2. Perform incremental compilation:
   ```bash
   export REACTROOT=$PWD
   export CCROOT=$PWD
   make library chemdb
   ```

> **Note**: For code updates, run `make library chemdb`. Avoid running `make clean` or `make all` during incremental updates as `make clean` removes generated directories and `.dbf` database files.

---

## 3. Running the Local Orchestrator & User Management

The Node.js Orchestrator server (`orchestrator/server.js`) manages user sessions, sandboxed job execution in `/tmp/reactcloud/users/{uid}/job_{jobId}/`, and GCS synchronization.

### Step 3.1: Start Local Orchestrator
```bash
cd /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator
npm install
node server.js
```
The server will start on port `8085` (or `PORT` environment variable).

### Step 3.2: User Management & Authentication Modes
- **Firebase Auth (Google Sign-In)**: Accepts standard `Authorization: Bearer <ID_TOKEN>` headers from Firebase Auth.
- **Dev User Preset Switcher**:
  - `Bearer reactcloud-bearer-token-default` -> User UID: `user_default_local`
  - `Bearer reactcloud-bearer-token-alice` -> User UID: `user_alice`
  - `Bearer reactcloud-bearer-token-bob` -> User UID: `user_bob`
  - `Bearer reactcloud-bearer-token-<custom_name>` -> User UID: `user_<custom_name>`

### Step 3.3: Verify Local Orchestrator API
```bash
# Health Check
curl http://localhost:8085/api/health

# Execute Input Script for Default User
curl -X POST http://localhost:8085/api/run-input \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer reactcloud-bearer-token-default" \
  -d '{"inputFile":"PrintMoleculeList.inp","root":"ROOT"}'
```

---

## 4. Updating and Deploying to Google Cloud

When changes are verified locally and ready for production, follow this two-step cloud update process.

### Step 4.1: Deploy Backend Container to Google Cloud Run

1. **Submit Build to Google Cloud Build**:
   ```bash
   cd /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD
   gcloud builds submit --tag gcr.io/blurock-database/reactcloud:latest
   ```

2. **Deploy Built Image to Cloud Run**:
   ```bash
   gcloud run deploy reactcloud \
     --image gcr.io/blurock-database/reactcloud:latest \
     --platform managed \
     --region europe-west1 \
     --allow-unauthenticated \
     --memory 1Gi \
     --cpu 1
   ```

3. **Verify Cloud Run Backend**:
   - Live URL: `https://reactcloud-315685320181.europe-west1.run.app`
   - Test Health: `curl https://reactcloud-315685320181.europe-west1.run.app/api/health`

### Step 4.2: Deploy Frontend to Firebase Hosting

1. **Build Production Angular App**:
   ```bash
   cd /Users/edwardblurock/git/WorkFlowProject/REACTInterface
   npm run build
   ```

2. **Deploy to Firebase Hosting**:
   ```bash
   npx -y firebase-tools@latest deploy --only hosting
   ```

3. **Verify Live Application**:
   - Production URL: `https://blurock-database.web.app`

---

## 5. Local vs Cloud Service Switching in Frontend

In `REACTInterface`, switch the backend API service endpoint in `src/app/services/react-cloud-api.service.ts`:

- **Local Backend**: `private readonly baseUrl = 'http://localhost:8085';`
- **Cloud Run Production**: `private readonly baseUrl = 'https://reactcloud-315685320181.europe-west1.run.app';`
