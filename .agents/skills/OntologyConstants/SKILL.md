---
name: OntologyConstants
description: Given a class ontology definition in JSON format, generate the TypeScript and JAVA class constants for the ontology.
---

# OntologyConstants

Use this skill to sync the frontend and backend when new classes are added to the ontology. It generates constant definitions for both TypeScript (frontend) and Java (backend) using a JSON ontology snippet.

## Target Files
Only these two files should be changed:
1.  **Frontend**: `manager-frontend/src/app/components/constants/ontologyconstants.ts`
2.  **Backend**: `ChemConnectCoreOntologyBase/src/main/java/info/esblurock/reaction/core/ontology/base/constants/ClassLabelConstants.java`

Other changes are not part of this task. Do not suggest other changes.

## When to use this skill
- When a new class is added to the system.
- To avoid hardcoding string identifiers directly in the UI or service logic.
- To ensure consistency between frontend and backend class identifiers.

## How to use it
Given a JSON file with the ontology definition (found under the `annotations` property):

### 1. Extraction Rules
- **Source JSON Key**: The full class name (e.g., `"dataset:ActivitySpeciesCatalogObjectCreation"`).
- **Variable Name**: The part of the key after the colon (e.g., `ActivitySpeciesCatalogObjectCreation`).
- **Constant Value**: The value of the identifier property (e.g., `"dataset:speciescatalogobjectcreation"`).

### 2. Format for TypeScript
Add constant only if that constant does not already exist.
Add the property to the `Ontologyconstants` class in `ontologyconstants.ts`:
```typescript
public ActivitySpeciesCatalogObjectCreation = 'dataset:speciescatalogobjectcreation';
```

### 3. Format for Java
Add constant only if that constant does not already exist.
Add the static string to the `ClassLabelConstants` class in `ClassLabelConstants.java`:
```java
public static String ActivitySpeciesCatalogObjectCreation = "dataset:speciescatalogobjectcreation";
```

### Example Mapping
If the JSON contains:
```json
"dataset:ActivitySpeciesCatalogObjectCreation": {
    "rdfs:label": "Species Catalog Object Creation",
    "http://purl.org/dc/elements/1.1/identifier": "dataset:speciescatalogobjectcreation",
    "dataset:catalogtype": "dataset:ActivitySpeciesCatalogObjectCreation"
}
```
You generate the variable **ActivitySpeciesCatalogObjectCreation** with the value **"dataset:speciescatalogobjectcreation"**.