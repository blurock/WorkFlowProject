---
name: TaskOutputCatalogAndCaching
description: Architectural guidelines, input cache isolation, declarative Task Output Catalog contracts, and step-by-step instructions for registering new tasks to prevent cache pollution and ensure only genuine artifacts are collected.
---

# Task Output Catalog & Caching Strategy

This skill documents the **Input Caching & Isolation Architecture** and the **Declarative Task Output Catalog (`TASK_OUTPUT_CATALOG`)** used by the `REACTCLOUD` Orchestrator ([`server.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js)) and `chemdb`.

---

## 1. Why Cached Files Exist & When They Are Used

The REACT stack bridges a modern cloud web interface (Angular / Firestore / GCS) with a high-performance C computational backend (`chemdb`, `pstore`, `genrxn`).

### Why Caching Is Necessary
1. **POSIX Filesystem Requirement**: `chemdb` does not connect over HTTP or to Cloud Storage. It relies on standard C `fopen()` calls to read molecules, substructures, and reaction tables from the local filesystem (e.g. `./data/`, `.` or `./elements.xml`).
2. **Sub-second Latency**: Downloading molecules from GCS on every single pattern test or submechanism step adds 100ms–2s of network latency. The local user disk cache (`/tmp/reactcloud/users/<uid>/cache/data/`) makes interactive runs sub-second.
3. **Companion File Dependencies**: In `chemdb`, a reaction pattern list (`.lst`) requires companion `.mol` and `.sdf` files. The cache ensures these companions are co-located so `chemdb` avoids `RECOVER` missing-file errors.

### When Cached Files Are Used (Inputs)
Cached files represent **input data**, such as:
* User-created molecules (e.g. `1-butyl-radical.sdf`, `butane.sdf`).
* Custom substructures (e.g. `subsAldPeroxy.sdf`).
* Reaction pattern lists and companion files (e.g. `RO2Isomerization.lst`, `RO2Isomerization.mol`).
* Pathway definitions (e.g. `BasicLowTemperatureV2.5.1.lsr`).

---

## 2. The Input Isolation Pattern

To prevent input files from being mistaken for output artifacts:

1. **Symlink, Never Duplicate**:
   In `hydrateUserWorkspace(uid, workspaceDir)`:
   ```javascript
   // Symlink cache files into workspaceDir so chemdb can resolve them:
   for (const child of fs.readdirSync(userCacheDataDir)) {
     const srcChild = path.join(userCacheDataDir, child);
     if (fs.statSync(srcChild).isFile()) {
       const destChild = path.join(workspaceDir, child);
       if (!fs.existsSync(destChild)) {
         try { fs.symlinkSync(srcChild, destChild); } catch (_) { fs.copyFileSync(srcChild, destChild); }
       }
     }
   }
   ```
2. **Pre-Execution Snapshotting**:
   Immediately before spawning `chemdb`, take a snapshot of the workspace directory:
   ```javascript
   const initialWorkspaceFiles = new Set(fs.readdirSync(workspaceDir));
   ```
   Any file already present in `initialWorkspaceFiles` is strictly an **input** and will never be collected as an artifact.

---

## 3. The Declarative Task Output Catalog (`TASK_OUTPUT_CATALOG`)

Located in [`REACTCLOUD/orchestrator/server.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js), `TASK_OUTPUT_CATALOG` defines the exact contract of output artifacts and log files for each task:

```javascript
const TASK_OUTPUT_CATALOG = {
  submechanism_generation: {
    label: 'Submechanism Generation',
    getArtifactPatterns: (meta) => [
      `${meta.mechName}.mech`,
      `${meta.mechName}.sdf`,
      `${meta.mechName}.thm`,
      `${meta.mechName}.corrs`,
      `${meta.mechName}_artifacts.zip`,
      'read.lsr'
    ],
    getLogPatterns: () => ['execution.log', '*.api.inp', 'run.inp']
  },

  mechanism_combine: {
    label: 'Combine Submechanisms',
    getArtifactPatterns: (meta) => [
      `${meta.mechName}.mech`,
      `${meta.mechName}.sdf`,
      `${meta.mechName}.thm`,
      `${meta.mechName}.corrs`,
      `${meta.mechName}_artifacts.zip`
    ],
    getLogPatterns: () => ['execution.log', 'combine.api.inp', '*.api.inp', 'run.inp']
  },

  format_check: {
    label: 'Catalog Format Check',
    getArtifactPatterns: () => ['*.Format.out'],
    getLogPatterns: () => ['execution.log', 'run.inp']
  },

  catalog_print: {
    label: 'Catalog Print / Query',
    getArtifactPatterns: () => ['*.ans', '*.out'],
    getLogPatterns: () => ['execution.log', 'run.inp']
  },

  thermo_calc: {
    label: 'Thermodynamics Calculation',
    getArtifactPatterns: () => ['*.thm', '*.ans', '*.out'],
    getLogPatterns: () => ['execution.log', 'run.inp']
  },

  script_runner: {
    label: 'Generic Script Runner',
    getArtifactPatterns: () => ['*.Format.out', '*.ans', '*.out', '*.dat'],
    getLogPatterns: () => ['execution.log', 'run.inp']
  },

  default: {
    label: 'General Task',
    getArtifactPatterns: () => ['*.Format.out', '*.ans', '*.out'],
    getLogPatterns: () => ['execution.log', 'run.inp', '*.api.inp']
  }
};
```

---

## 4. How `persistUserWorkspace` Enforces the Catalog

When `persistUserWorkspace()` is called:
```javascript
async function persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classification, inputFileManifest, mechanismMetadata, initialWorkspaceFiles)
```
It evaluates every file in `workspaceDir` against four rules:
1. **Rule 1 (No Symlinks)**: `fs.lstatSync(file).isSymbolicLink()` is always skipped.
2. **Rule 2 (No System Assets)**: `elements.xml`, `command`, `data`, `basis`, `ffield` are always skipped.
3. **Rule 3 (No Pre-existing Inputs)**: If `initialWorkspaceFiles.has(file)` and it is not a log pattern, it is skipped.
4. **Rule 4 (Catalog Matching)**: The file must match either `expectedArtifactPatterns` or `expectedLogPatterns` defined in `TASK_OUTPUT_CATALOG[jobCategory]`. Any unrequested temporary file is discarded.

---

## 5. Step-by-Step Guide: Adding a New Task Type

When introducing a new computation, query, or runner task:

### Step 1: Register Job Classification
In `classifyJob()` in `server.js`, assign a descriptive `jobCategory`:
```javascript
else if (combinedText.includes('my_custom_task')) {
  jobCategory = 'my_custom_task';
}
```

### Step 2: Add Entry to `TASK_OUTPUT_CATALOG`
In `TASK_OUTPUT_CATALOG` in `server.js`, define the expected outputs and logs:
```javascript
my_custom_task: {
  label: 'My Custom Task',
  getArtifactPatterns: (meta) => [`${meta?.targetName || '*'}.custom.out`, '*.report'],
  getLogPatterns: () => ['execution.log', 'run.inp']
}
```

### Step 3: Snapshot Workspace Before Execution
In the endpoint handler right before `spawn(CHEMDB_BIN, ...)`:
```javascript
const initialWorkspaceFiles = new Set(fs.readdirSync(workspaceDir));
```

### Step 4: Pass Snapshot to Persistence
When `chemdb` exits, pass `initialWorkspaceFiles` to `persistUserWorkspace`:
```javascript
persistUserWorkspace(uid, sessionId, workspaceDir, jobId, classification, inputFileManifest, taskMetadata, initialWorkspaceFiles)
```

---

## 6. Inspection & Verification APIs

* **`GET /api/catalog/task-outputs`**:
  Returns the complete active task output catalog, useful for frontend inspection, logging diagnostics, and automated tests.

