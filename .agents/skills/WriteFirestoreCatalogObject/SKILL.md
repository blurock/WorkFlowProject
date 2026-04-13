---
name: Write Firestore Catalog Object
description: Writes a catalog object to Firestore.
---

# Write Firestore Catalog Object

If the object has a dataset:FirestoreCatalogID is present within the object, then it can be written to Firestore.
If the object does not have an dataset:FirestoreCatalogID, then it then the address is generated and inserted into the object as a dataset:FirestoreCatalogID property

*** Find address ** *
In info.esblurock.reaction.core.ontology.base.hierarchyCreateHierarchyElement.java  (ChemConnectCoreOntologyBase)
public static JsonObject searchForCatalogObjectInHierarchyTemplate(JsonObject json) where json contains the minimal set of information needed to derive the address of the catalog object.

*** Write to Firestore ** *
In info.esblurock.background.services.firestore.WriteFirestoreCatalogObject.java  (DatasetBackgroundServices)
public static String writeCatalogObject(JsonObject catalog) where catalog contains the dataset:FirestoreCatalogID property


## When to use this skill

- Use when the user is asked to write an existing catalog object to Firestore.


## How to use it

1. Determine whether the object has a dataset:FirestoreCatalogID property
2. If not, generate one using searchForCatalogObjectInHierarchyTemplate and insert the dataset:FirestoreCatalogID property into the object
4. Write the object to Firestore using writeCatalogObject 