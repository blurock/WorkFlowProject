---
name: DatabaseExistenceCheck
description: Standard workflow and guidelines for executing database existence checks in REACTInterface using ExistenceCheckService. Use whenever checking if molecules, substructures, reaction patterns, reactions, or mechanisms exist in the REACTCLOUD database before storing or substituting database IDs.
---

# Database Existence Check

This skill details how database existence checks are performed across `REACTInterface` using `ExistenceCheckService` ([`src/app/services/existence-check.service.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/existence-check.service.ts)).

Whenever checking whether data structures (molecules, substructures, reaction patterns, reactions, mechanisms) exist in the database, always use `ExistenceCheckService`.

---

## 1. Core Architecture & Service Overview

`ExistenceCheckService` encapsulates the complete database check lifecycle:
1. **File Upload (Optional)**: Uploads user data files (such as `<rootName>.sdf` for substructures or `<rootName>.lst` for reaction patterns) to user storage via `ReactCloudApiService.uploadUserDataFiles`.
2. **Command Construction**: Fetches the exact command string array for the given `dataType` ('molecule' | 'substructure' | 'rxn-pattern' | 'reaction' | 'mechanism') and `format` ('sdf' | 'ascii') from `CommandTemplatesRegistry.getReadCheckStoreCommands(dataType, 'check', format, rootName, outName)`.
3. **Execution**: Sends the memory-piped command sequence to `ReactCloudApiService.runCommands()`.
4. **Output Parsing**: Parses the raw stdout table into structured items (`ExistenceCheckItem[]`) and builds a `dbIdMap` (`Map<string, string>`) mapping existing structure names to their database IDs.

---

## 2. API Signature & Usage

File: [`existence-check.service.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/existence-check.service.ts)

### Service Method
```typescript
public async checkDatabaseExistence(
  dataType: string,
  format: string,
  rootName: string,
  outName?: string,
  filesToUpload?: { filename: string; content: string }[]
): Promise<ExistenceCheckResult>
```

### Return Data Interface (`ExistenceCheckResult`)
```typescript
export interface ExistenceCheckItem {
  id: string;
  name: string;
  dbId?: string;
  inDatabase: boolean;
  status: 'Present' | 'New' | 'Unknown' | string;
  suggestedAction: string;
}

export interface ExistenceCheckResult {
  items: ExistenceCheckItem[];
  hasConflicts: boolean;
  rawOutput: string;
  logLines: { text: string; isError: boolean }[];
  exitCode: number;
  success: boolean;
  dbIdMap: Map<string, string>; // Maps structure name -> database ID
}
```

---

## 3. Workflow Integration Patterns

### Pattern A: Standard 3-Step Input Sequence (`ReadCheckStoreComponent`)
Used in file input dialogues to check uploaded dataset files against the database before storing.

```typescript
import { ExistenceCheckService } from '../../services/existence-check.service';

constructor(private existenceCheckService: ExistenceCheckService) {}

public async executeStep2Check(): Promise<void> {
  const result = await this.existenceCheckService.checkDatabaseExistence(
    this.dataType, // 'molecule' | 'substructure' | 'rxn-pattern' | 'reaction'
    this.format,   // 'sdf' | 'ascii'
    this.rootName  // Root dataset name
  );

  this.existenceItems = result.items;
  this.hasConflicts = result.hasConflicts;
  this.step2Completed = result.success;
}
```

### Pattern B: Substructure Existence Check & DB ID Substitution (`GeneralRxnPatGeneratorComponent`)
Used in the Reaction Pattern Generator workflow:
1. **Check Substructures**: Generates the substructure `.sdf` content, uploads `${rootName}.sdf`, and invokes `checkDatabaseExistence('substructure', 'sdf', rootName)`.
2. **Substitute DB IDs**: Matches existing substructure names (e.g. `c(rrr)`) against `result.dbIdMap` (e.g. `20304104`).
3. **Re-serialize `.lst` File**: Replaces substructure names with Database IDs in the reaction pattern equations (e.g. `20304104 20304104 = 20304104 20304104`).
4. **Check Reaction Patterns**: Uploads `${rootName}.lst` (containing substituted DB IDs) and invokes `checkDatabaseExistence('rxn-pattern', 'ascii', rootName)`.

```typescript
// Example: Substructures existence check and ID substitution
const result = await this.existenceCheckService.checkDatabaseExistence(
  'substructure',
  'sdf',
  this.rootName,
  `${this.rootName}_sub_check`,
  [{ filename: `${this.rootName}.sdf`, content: this.substructureMolfilesCombined }]
);

// Map matched DB IDs
this.substructureDbIdMap = result.dbIdMap; // e.g. 'c(rrr)' -> '20304104'

// In equation serializer:
const resolveSubId = (subName: string): string => {
  return this.substructureDbIdMap.get(subName) || subName;
};
```

---

## 4. Backend Command Templates Reference

File: [`command-templates.registry.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/templates/command-templates.registry.ts)

The existence check templates correspond to the C backend command inputs:

- **Substructure SDF Existence Check** (`checkSubstructuresInDatabase`):
  Equivalent to `ExistenceCheckSubstructuresFromFile.inp`:
  `Mol` -> `Read SubStructures SDF` -> `DbaseOps SubStructures Current ExistenceCheck`

- **Reaction Patterns ASCII Existence Check** (`checkRxnPatternsInDatabase`):
  Equivalent to `ExistenceCheckReactionPatterns.inp`:
  `Rxn` -> `RxnPatterns` -> `ExistenceCheck`

- **Reactions ASCII Existence Check** (`checkReactionsInDatabase`):
  `Rxn` -> `Reactions` -> `ExistenceCheck`

- **Molecules SDF Existence Check** (`checkMoleculesInDatabase`):
  `Mol` -> `Read Molecules SDF` -> `DbaseOps Molecules Current ExistenceCheck`

---

## 5. Summary Checklist for Developers & Agents

- [ ] Always call `ExistenceCheckService.checkDatabaseExistence()` for any database existence check task instead of writing raw API calls or duplicative output parsers.
- [ ] For substructures, extract `result.dbIdMap` and substitute existing Database IDs into downstream reaction pattern definitions.
- [ ] For `.lst` reaction pattern files, ensure database IDs are formatted cleanly in the equation line (`<ReactantDBIDs> = <ProductDBIDs>`).
- [ ] Display the resulting `items` table in the UI showing `name`, `dbId`, `status`, and `suggestedAction`.
