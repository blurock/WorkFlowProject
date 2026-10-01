---
name: REACTCloudLoggingStrategy
description: Architecture, Firestore document paths, GCS storage structure, single-job deletion rules, and bulk purge workflows for REACTCloud execution logs and session jobs.
---

# REACTCloud Logging & Job Artifact Management Strategy

This skill documents the logging architecture, storage partition structure, Firestore data models, and deletion/purge workflows for `REACTCLOUD` and `REACTInterface`.

---

## 1. Overview & Dual-Storage Architecture

REACTCloud execution logs and output artifacts are stored using a **dual-storage pattern**:

1. **Google Cloud Storage (GCS)**: Stores physical log files (`execution.log`), uploaded input files, and command execution output artifacts.
2. **Google Cloud Firestore**: Stores document metadata (`LogJobDocument`), execution status, file manifests, timestamps, and access mode classifications.

---

## 2. Firestore Document Partitioning (3 Locations)

Whenever an execution job runs in the Orchestrator ([`server.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js)), a single `LogJobDocument` payload is written to **three** Firestore paths:

### 1. Mirrored Date-Partitioned Subcollection (Primary Tree Path)
```text
users/{uid}/logs/{accessMode}/years/{year}/months/{month}/days/{day}/categories/{jobCategory}/jobs/{jobId}
```
* **Purpose**: Primary path for date-partition browsing, category hierarchy trees, and global `collectionGroup('jobs')` queries.
* **Access Modes**: `read-only` or `db-modifying`.

### 2. User Flat Subcollection
```text
users/{uid}/jobs/{jobId}
```
* **Purpose**: Direct lookup and un-partitioned listing for a specific user.

### 3. Session Job Subcollection
```text
users/{uid}/sessions/{activeSessionId}/jobs/{jobId}
```
* **Purpose**: Tracks jobs created within a specific user session (e.g. `default_session`).

---

## 3. Google Cloud Storage (GCS) Structure

* **Bucket**: `blurock-database.firebasestorage.app`
* **GCS Prefix Format**:
  ```text
  gs://blurock-database.firebasestorage.app/users/{uid}/logs/{accessMode}/years/{year}/months/{month}/days/{day}/categories/{jobCategory}/jobs/{jobId}/
  ```
* **Contents**:
  * `execution.log` (plain text console log output)
  * Uploaded input files
  * Result files and generated artifacts

---

## 4. Single Log Deletion Strategy (`DELETE /api/logs/job`)

> [!IMPORTANT]
> Because job documents are written to **three** Firestore locations, deleting a job MUST purge all three locations and the GCS bucket prefix. Failing to sweep session jobs leaves orphan documents under `/users/{uid}/sessions/{sessionId}/jobs/`.

### Mandatory Deletion Steps:

1. **GCS Cleanup**:
   Purge all GCS objects matching `gcsPrefix` using `storage.bucket().deleteFiles({ prefix })`.
2. **Primary Mirrored Document Cleanup**:
   Delete `firestore.doc(docPath)` (e.g., `users/{uid}/logs/.../jobs/{jobId}`).
3. **Flat User Job Cleanup**:
   Delete `firestore.collection('users').doc(uid).collection('jobs').doc(jobId)`.
4. **Collection Group Sweep**:
   Query `firestore.collectionGroup('jobs').where('jobId', '==', jobId)` and delete all matching docs.
5. **Session Subcollection Sweep**:
   Iterate `users/{uid}/sessions` and delete `sessions/{sessionId}/jobs/{jobId}` for all active/past sessions.

### Implementation Reference ([`server.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js#L521-L572)):
```javascript
// 1. Purge GCS files
if (gcsPrefix) {
  let rawPrefix = gcsPrefix.replace(`gs://${BUCKET_NAME}/`, '');
  await bucket.deleteFiles({ prefix: rawPrefix });
}

// 2. Delete primary doc
if (docPath) await firestore.doc(docPath).delete().catch(() => {});

// 3. Delete flat user job doc
await firestore.collection('users').doc(targetUserId).collection('jobs').doc(jobId).delete().catch(() => {});

// 4. CollectionGroup sweep for jobId
const groupSnap = await firestore.collectionGroup('jobs').where('jobId', '==', jobId).get();
for (const d of groupSnap.docs) await d.ref.delete().catch(() => {});

// 5. Sweep session job docs under users/{targetUserId}/sessions/*/jobs/{jobId}
const sessionsSnap = await firestore.collection('users').doc(targetUserId).collection('sessions').get();
for (const sessDoc of sessionsSnap.docs) {
  await sessDoc.ref.collection('jobs').doc(jobId).delete().catch(() => {});
}
```

---

## 5. Bulk Purge Strategy (`POST /api/logs/purge-all`)

To clear all execution history and orphan session jobs:

1. Query `firestore.collectionGroup('jobs').where('userId', '==', targetUserId)`.
2. For each document, delete its GCS artifact prefix and remove the Firestore document reference.
3. Explicitly iterate `users/{userId}/sessions` and delete all documents in `sessions/{sessionId}/jobs/`.

---

## 6. Frontend Integration & Caching Rules

File: [`LoggingAdminService`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/logging-admin.service.ts)

* **SessionStorage Caching**: Job lists are cached in `sessionStorage` under `reactcloud_log_jobs_cache` to eliminate unnecessary network traffic.
* **Cache Invalidation**:
  * `deleteJobLog()` removes the target job from local cache.
  * `purgeAllLogs()` calls `clearCache()`.
  * `loadLogs(true)` bypasses cache and forces a background refresh from Orchestrator API (`GET /api/logs/list`).
