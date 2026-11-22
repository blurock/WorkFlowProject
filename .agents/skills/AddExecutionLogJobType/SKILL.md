---
name: AddExecutionLogJobType
description: Step-by-step guide for adding a new execution log job type (jobCategory) to REACTCLOUD Orchestrator and REACTInterface Logging Administration, including taxonomy subdivision, same-job deduplication signatures, output artifact patterns, and frontend fallback registration.
---

# Adding a New Execution Log Job Type (`jobCategory`)

This skill documents how to introduce a new execution job category so that it automatically:
1. Classifies executions into `read-only` or `db-modifying` access modes.
2. Collects only expected artifacts and log files (per `TaskOutputCatalogAndCaching`).
3. Appears in the **Execution Tree** (`Access Mode → Display Label → Subcategory → Target`) and the **Category Rules** reference table.
4. Groups repeated runs of the same job behind the latest run (`Latest Only`) and supports **Prune Superseded Runs**.

---

## Step 1: Register the Job Type in `TASK_OUTPUT_CATALOG` (Backend)

Open [`REACTCLOUD/orchestrator/server.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js) and add a new entry to `TASK_OUTPUT_CATALOG`:

```javascript
my_new_job_type: {
  label: 'My New Job Display Label',
  defaultAccessMode: 'db-modifying', // or 'read-only'
  subCategoryField: 'molecule',      // Human-readable name of Level 3 grouping field
  targetField: 'targetName',         // Human-readable name of Level 4 leaf field
  signatureFormat: 'my_new_job_type::<molecule>::<targetName>',
  extractTaxonomy: (ctx) => {
    const subCategory = normalizeTaxonomyToken(ctx.molecule, 'General');
    const targetName = normalizeTaxonomyToken(ctx.targetName || ctx.rootName, 'default');
    return {
      subCategory,
      targetName,
      jobSignature: `my_new_job_type::${subCategory}::${targetName}`
    };
  },
  getArtifactPatterns: (meta) => ['*.out', '*.ans'],
  getLogPatterns: () => ['execution.log', 'run.inp']
},
```

### Rules for `extractTaxonomy(ctx)`
- **`subCategory`**: The grouping folder under the category's Display Label in the tree (e.g., `molecule` for `submechanism_generation`, `entityType` for `format_check` / `catalog_print`).
- **`targetName`**: The leaf label shown in the tree (e.g., `rootName`, `targetItem`, or `inputFile`).
- **`jobSignature`**: A deterministic string that uniquely identifies the **"same" job**. Two executions for the same user with the same `(jobCategory, jobSignature)` are treated as repeated runs of the same job — the UI shows the newest run by default with a `(+N older)` expandable badge and allows pruning older runs via `POST /api/logs/prune-superseded`.

---

## Step 2: Classify Incoming Requests in `classifyJob()` (Backend)

In [`REACTCLOUD/orchestrator/server.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js), update `classifyJob(reqBody, commandText, inputFile)`:

1. Add detection logic for your new job type (from `reqBody`, `commandText`, or `inputFile`) before the generic fallback branches.
2. Set `jobCategory = 'my_new_job_type'`.
3. If the job type is strictly read-only, add it to the strict read-only enforcement check so `isReadOnly = true` and `accessMode = 'read-only'`.

---

## Step 3: Pass Structured Metadata to `persistUserWorkspace()` (Backend)

In the Express route handler that executes the job, pass a metadata object as the 7th argument to `persistUserWorkspace(...)` containing the fields your `extractTaxonomy(ctx)` reads:

```javascript
const classification = classifyJob(req.body, commandText, inputFile);
persistUserWorkspace(
  uid,
  sessionId,
  workspaceDir,
  jobId,
  classification,
  inputFileManifest,
  {
    molecule: req.body?.molecule || '',
    rootName: req.body?.rootName || '',
    targetItem: req.body?.targetItem || '',
    inputFile,
    root: root || ''
  },
  initialWorkspaceFiles
);
```

`persistUserWorkspace()` automatically calls `resolveJobTaxonomy(jobCategory, ctx)` and writes `catalogLabel`, `subCategory`, `targetName`, and `jobSignature` to all three Firestore locations (mirrored log doc, flat user job doc, and session job doc).

---

## Step 4: Register Frontend Fallback Taxonomy (`LoggingAdminService`)

Open [`REACTInterface/src/app/services/logging-admin.service.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/logging-admin.service.ts):

1. Add a matching entry to `LoggingAdminService.DEFAULT_TAXONOMY` (used if `/api/logs/taxonomy` is temporarily unavailable or while initializing):
   ```typescript
   {
     jobCategory: 'my_new_job_type',
     label: 'My New Job Display Label',
     defaultAccessMode: 'db-modifying',
     subCategoryField: 'molecule',
     targetField: 'targetName',
     signatureFormat: 'my_new_job_type::<molecule>::<targetName>'
   }
   ```
2. If historical logs for this category need custom client-side inference when `subCategory`/`jobSignature` are absent, add a branch in `deriveJobTaxonomy(job)`.

*(No changes are needed to `LoggingAdminComponent` HTML or tree rendering — the Execution Tree, Category filter dropdown, Latest Only grouping, Prune Superseded action, and Category Rules modal all populate dynamically from `GET /api/logs/taxonomy` and the enriched job fields.)*

---

## Step 5: Verification Checklist

1. **Backend syntax check**:
   ```bash
   node --check REACTCLOUD/orchestrator/server.js
   ```
2. **Frontend type check**:
   ```bash
   cd REACTInterface && ./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
   ```
3. **Runtime check**:
   - Confirm `GET /api/logs/taxonomy` includes your new `jobCategory`.
   - Execute the new job twice with the same inputs; verify in **Logging Administration → Execution Tree** that it appears under `<Access Mode> → <Display Label> → <Subcategory> → <Target>` with `(+1 older)` and that **Prune** deletes the older run from all 3 Firestore paths and GCS.
