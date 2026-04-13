---
name: Read Firestore Object
description: These are the steps need to read from a Firestore database.
---

# Read Firestore Object

When a catalog object is to be read in from the firestore database, the address must be derived from a minimal set of information. 
This information must be present in the catalog object. 
This can be done by creating a minimal data object that contains the essential address information.

JAVA routines needed:

*** Find address ** *
In info.esblurock.reaction.core.ontology.base.hierarchyCreateHierarchyElement.java  (ChemConnectCoreOntologyBase)
public static JsonObject searchForCatalogObjectInHierarchyTemplate(JsonObject json) where json contains the minimal set of information needed to derive the address of the catalog object.

*** Read object ***
In info.esblurock.background.services.firestore.ReadFirestoreInformation.java  (DatasetBackgroundServices)
public static JsonObject readFirestoreCatalogObject(JsonObject firestoreid) where firestoreid is the generated address of the catalog object.

## When to use this skill

- When a user asks to read a catalog object from Firestore.

## How to use it

1. Identify the minimal set of information needed to derive the address of the catalog object.
2. Create a minimal data object that contains the essential address information.
3. find the address of the catalog object using the searchForCatalogObjectInHierarchyTemplate routine.
4. read the catalog object using the readFirestoreCatalogObject routine.

