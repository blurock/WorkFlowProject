---
name: AddScopedCatalogObjectType
description: Step-by-step guide for introducing a new database object type into REACTCLOUD and REACTInterface with combined System (read-only baseline) and Personal (user-writable overlay) database support, ID range partitioning, classification index merging, and Admin integrity verification.
---

# AddScopedCatalogObjectType

Use this skill whenever a new database or catalog object type (similar to `Molecules`, `SubStructures`, `ReactionPatterns`, `Reactions`, `Thermodynamics`, `MechanismPathway`, or `Mechanisms`) is added to the REACTCLOUD backend and REACTInterface frontend.

---

## Architecture Overview

REACTCLOUD separates data into two namespaces managed centrally by [`REACTCLOUD/orchestrator/scoped-db-resolver.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/scoped-db-resolver.js):
1. **System Namespace (`SYSTEM_UID = 'UOqk0KtFtaXma5TGsi8Seh9RMbx1'`)**:
   * Read-only baseline objects visible to all authenticated users.
   * Integer IDs allocate in the System range: `10,000 – 999,999` (`SYSTEM_ID_START = 10000`).
   * Only Administrators with `writeScope = 'system'` (or via **Promote to System**) can write to this namespace.
2. **Personal Namespace (`users/{uid}` or `users/UOqk0KtFtaXma5TGsi8Seh9RMbx1_personal` for Admin)**:
   * User-writable objects (full Create, Read, Update, Delete).
   * Integer IDs allocate in the Personal range: `1,000,000+` (`PERSONAL_ID_START = 1000000`).
   * Personal objects with the same `Name` as a System object shadow (override) the System object for that user (`Personal first -> System fallback`). Deleting/reverting the personal object restores the System default.

---

## Step-by-Step Checklist for Adding a New Object Type

### Step 1: Register the Object Type in `CATALOG_OBJECT_REGISTRY`
Open [`REACTCLOUD/orchestrator/scoped-db-resolver.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/scoped-db-resolver.js) and add an entry to `CATALOG_OBJECT_REGISTRY`:

```javascript
  MyNewObjectType: {
    dbKey: 'MyNewObjectType',
    dbName: 'MyNewObjectType',              // Firestore collection: users/{uid}/databases/MyNewObjectType/records
    aliases: ['my-new-object', 'MyNewObjects'],
    classIndex: 'DB-Index-MyNewObjectIDs',  // Set to null if keyed directly by Name (like MechanismPathway)
    hasSearchKeys: true,                    // Set true if C-binary stores searchkeys/<dbName>
    idOffset: PERSONAL_ID_START,            // 1,000,000+ for personal IDs
    keyByName: false                        // Set true if document ID is the object Name rather than integer ID
  }
```

> [!IMPORTANT]
> Because `/api/db/store`, `/api/db/fetch`, `/api/db/listSummary`, `/api/db/delete`, `/api/db/generateNextID`, `/api/db/findOrCreateObjectIDClass`, `/api/db/storeObjectIDClass`, `/api/db/fetchSearchKeys`, `/api/db/storeSearchKeys`, `/api/db/promoteToSystem`, and `/api/db/revertOverride` all delegate to `ScopedDatabaseResolver`, registering your object in `CATALOG_OBJECT_REGISTRY` **automatically** enables:
> * Personal -> System read fallback (`viewScope: 'all' | 'personal' | 'system'`)
> * Write protection on System objects
> * `1,000,000+` Personal ID allocation
> * On-the-fly merging of System + Personal classification index keys on read, and stripping of System keys on personal write
> * Admin 1-click **Promote to System** and **Revert Personal Override**

---

### Step 2: Register in `DATABASE_INDEX_MAP` for Verify Integrity Audits
If the new object type uses a classification index (`classIndex !== null`), open [`REACTCLOUD/orchestrator/admin-integrity.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/admin-integrity.js) and add it to `DATABASE_INDEX_MAP`:

```javascript
  MyNewObjectType: {
    dbName: 'MyNewObjectType',
    classIndex: 'DB-Index-MyNewObjectIDs',
    label: 'My New Objects'
  }
```
This automatically enables:
* Cross-reconciliation between `records` and `classifications` in both **System** and **Personal** scopes.
* Detection of **Personal Overrides of System Objects**, **ID Range Violations**, **Orphan Records**, **Ghost Index Keys**, and **Name Mismatches**.

---

### Step 3: Create the Angular Frontend Catalog Service
Create a service in `REACTInterface/src/app/services/catalog/my-new-objects.service.ts` extending [`BaseCatalogService`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/catalog/base-catalog.service.ts):

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCatalogService } from './base-catalog.service';
import { CatalogItem, ReactCloudApiService } from '../react-cloud-api.service';

@Injectable({
  providedIn: 'root'
})
export class MyNewObjectsService extends BaseCatalogService {
  constructor(apiService: ReactCloudApiService) {
    super(apiService);
  }

  public getCatalogList(rootName: string = 'job1', forceRefresh: boolean = false): Observable<CatalogItem[]> {
    return this.fetchCatalogList('my-new-objects', rootName, forceRefresh);
  }

  public getItemDetails(itemName: string, rootName: string = 'job1', forceRefresh: boolean = false): Observable<string> {
    return this.fetchItemDetails('my-new-objects', itemName, rootName, forceRefresh);
  }
}
```
Register the service in [`CatalogServiceRegistry`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/services/catalog/catalog-service-registry.service.ts):
* `BaseCatalogService` automatically partitions session caches by the active 3-way view scope (`Combined | Personal | System`).
* [`authInterceptor`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/interceptors/auth.interceptor.ts) automatically attaches `X-React-View-Scope` and `X-React-Write-Scope` headers to every API request.

---

### Step 4: (If Backed by C-Engine `chemdb`) Register Command Templates
If `chemdb` executes catalog listing or detail printing for this object type, add the command template methods in [`CommandTemplatesRegistry`](file:///Users/edwardblurock/git/WorkFlowProject/REACTInterface/src/app/templates/command-templates.registry.ts) under `getCatalogCommands` and `getItemDetailCommands`.
When `chemdb` runs, `resolveEffectiveJobUid` in [`server.js`](file:///Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js) automatically binds the request's `viewScope` and `writeScope` to `chemdb`'s internal IPC calls.

