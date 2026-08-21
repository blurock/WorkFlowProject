---
name: AddGenericFileInputTask
description: Step-by-step instructions for adding a new generic file input task to REACTInterface and registering its command templates in CommandTemplatesRegistry.
---

# Add Generic File Input Task

This skill details how to register and configure a new file-upload task in `REACTInterface` using the client-side `CommandTemplatesRegistry` and `GenericFileInputComponent`.

## Overview Architecture

File input tasks follow a 3-step registration pattern:
1. **Command Sequence**: Add a static command array generator to `CommandTemplatesRegistry` (`command-templates.registry.ts`).
2. **File Slot & UI Config**: Define slot extensions and descriptions in `GENERIC_TASK_CONFIGS` (`generic-file-input.component.ts`).
3. **Category Registration**: Expose the task in `TaskCategoryRegistry` (`task-category-registry.service.ts`) with `type: 'generic-file-input'`.

---

## Step 1: Register Command Sequence in `CommandTemplatesRegistry`

File: [`command-templates.registry.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/templates/command-templates.registry.ts)

1. Add a static generator method returning a `string[]` of `chemdb` interactive command tokens, parameterizing the target root name:

```typescript
public static readMyNewData(rootName: string = 'job1'): string[] {
  return [
    "CreateOpenClose", "Start", "Quit",
    "DbaseOps", "Molecules", "Parameters", "DBDataMolRoot", "Input", `mol/molsdf/${rootName}`, "Quit", "Quit",
    "Current", "ASCII", "Store", "Quit",
    "Keys", "Read", "Fill", "Write", "Quit",
    "Quit", "Quit", "Quit"
  ];
}
```

2. Add a `case` in `getTaskCommands(taskId: string, rootName: string)`:

```typescript
public static getTaskCommands(taskId: string, rootName: string = '22dimethylC3C4'): string[] {
  switch (taskId) {
    case 'read-my-new-data':
      return this.readMyNewData(rootName);
    // ... existing tasks
  }
}
```

---

## Step 2: Configure Task in `GENERIC_TASK_CONFIGS`

File: [`generic-file-input.component.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/components/generic-file-input/generic-file-input.component.ts)

Add the task configuration object to `GENERIC_TASK_CONFIGS`:

```typescript
export const GENERIC_TASK_CONFIGS: { [key: string]: GenericFileInputConfig } = {
  'read-my-new-data': {
    taskId: 'read-my-new-data',
    taskTitle: 'Read My New Data',
    description: 'Upload custom data file (ROOTNAME.dat) to data/mol/molsdf and read properties into database.',
    targetDirectory: 'mol/molsdf',
    rootNameLabel: 'Dataset Root Name (e.g. 22dimethylC3C4, propane)',
    defaultRootName: '22dimethylC3C4',
    fileSlots: [
      { extension: '.dat', label: 'Custom Data File (.dat)', required: true }
    ]
  },
  // ... existing configs
};
```

---

## Step 3: Register Task in `TaskCategoryRegistry`

File: [`task-category-registry.service.ts`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/task-category-registry.service.ts)

Add the task item under the desired `TaskCategory` in `CATEGORIES`:

```typescript
{
  id: 'read-my-new-data',
  title: 'Read My New Data',
  description: 'Upload custom data file (ROOTNAME.dat) and process into database',
  icon: 'upload_file',
  type: 'generic-file-input'
}
```

---

## Step 4: How Execution Works

When the user uploads files and clicks **Upload & Run Task**:
1. `GenericFileInputComponent.uploadAndExecute()` uploads user files to `/api/upload-data-files` (persisting to session disk cache `/tmp/reactcloud/users/{uid}/cache/data/` & Cloud Storage).
2. The component calls `reactCloudApi.runTaskWithRegistry(taskId, rootName)`.
3. `ReactCloudApiService` fetches `CommandTemplatesRegistry.getTaskCommands(taskId, rootName)` and posts to `/api/run-commands`.
4. Backend streams command array into `chemdb` stdin without relying on disk `.inp` templates.
