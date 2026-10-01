---
name: ReadCheckStoreDatabaseInputTask
description: Instructions for registering and configuring new data structures into the 3-Step Read-Check-Store REACTCLOUD database file input sequence.
---

# Read-Check-Store Database Input Task

This skill details how to register and configure data structure file inputs in `REACTInterface` using the 3-Step Read-Check-Store sequence:
1. **Read & Format Check**: Validate input file syntax and parse structure into memory.
2. **Database Existence Check**: Check whether structures already exist in the database (with conflict handling and a **Reread File** reset option).
3. **Database Store**: Commit structures and file paths into the REACTCLOUD database.

---

## 3-Step Template Registration Guide

File: [`command-templates.registry.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/templates/command-templates.registry.ts)

Every data structure registered in the 3-step pipeline defines 3 command array generator methods:

### Step 1: Read Template
```typescript
public static readMyData(rootName: string = 'job1', outName: string = 'out1'): string[] {
  return [
    "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
    "MetaAtoms", "Read", "Quit", "Quit",
    "Mol", "Parameters", "MolOutName", "Input", outName, "Quit",
    "RootMolName", "Input", rootName, "Quit",
    "MolDirectory", "Input", ".", "Quit", "Quit",
    "Read", "Molecules", "SDF", "Quit", "Quit",
    "Calculations", "Molecules", "SemiEmpirical", "Quit", "Quit",
    "Output", "Molecules", "Print", "Quit", "Quit", "Quit",
    "Quit"
  ];
}
```

### Step 2: Check Template
```typescript
public static checkMyDataInDatabase(rootName: string = 'job1', outName: string = 'out1'): string[] {
  return [
    "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
    "MetaAtoms", "Read", "Quit", "Quit",
    "CreateOpenClose", "Initialize", "Quit",
    "Mol", "Parameters", "MolOutName", "Input", outName, "Quit",
    "RootMolName", "Input", rootName, "Quit",
    "MolDirectory", "Input", ".", "Quit", "Quit",
    "Read", "Molecules", "SDF", "Quit", "Quit",
    "Calculations", "Molecules", "SemiEmpirical", "Quit", "Quit",
    "Output", "Molecules", "Print", "Quit", "Quit", "Quit",
    "DbaseOps", "Molecules", "Current", "ExistenceCheck", "Quit", "Quit", "Quit",
    "Quit", "Quit", "Quit"
  ];
}
```

### Step 3: Store Template
```typescript
public static storeMyDataInDatabase(rootName: string = 'job1', outName: string = 'out1'): string[] {
  return [
    "Mol", "Parameters", "RootMolName", "Input", "StandardMeta", "Quit", "Quit",
    "MetaAtoms", "Read", "Quit", "Quit",
    "CreateOpenClose", "Initialize", "Quit",
    "Mol", "Parameters", "MolOutName", "Input", outName, "Quit",
    "RootMolName", "Input", rootName, "Quit",
    "MolDirectory", "Input", ".", "Quit", "Quit",
    "Read", "Molecules", "SDF", "Quit", "Quit",
    "Calculations", "Molecules", "SemiEmpirical", "Quit", "Quit",
    "Output", "Molecules", "Print", "Quit", "Quit", "Quit",
    "DbaseOps", "Molecules", "Current", "Store", "Quit", "Quit", "Quit",
    "Quit", "Quit", "Quit"
  ];
}
```

---

## Universal Dispatcher Integration

Register the new data type handling inside `CommandTemplatesRegistry.getReadCheckStoreCommands()`:

```typescript
case 'my-new-datatype':
  if (step === 'read') return this.readMyData(rootName, outName);
  if (step === 'check') return this.checkMyDataInDatabase(rootName, outName);
  return this.storeMyDataInDatabase(rootName, outName);
```

---

## UI Component Usage

File: [`read-check-store.component.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/components/read-check-store/read-check-store.component.ts)

Embed the standalone component into any workflow panel:

```html
<app-read-check-store [initialDataType]="'molecule'"></app-read-check-store>
```
