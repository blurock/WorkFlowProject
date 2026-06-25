*** MinimumDatabaseObjectStructure.md

Description:
The MinimumDatabaseObjectStructure is the set of parameters which are in all database (firestore) objects. The purpose of this document is to describe how this information is to be presented in the user interface.

*** User Interface

1. All the parameters cannot be modified by the user. The information is just presented in the interface.
2. The initial presentation of the object should be one line with the ShortDescription text. There will be an eye icon to the left of the ShortDescription text. Clicking on the icon will expand the object to show all the parameters.
3. The interface for the parameters in MinimumDatabaseObjectStructure should be at the end of the user interface presentation of the firebase catalog object.
3. The endpoint defined in CatalogInformationController:
    /cataloginfo?catalogname=dataset:MinimumDatabaseObjectStructure
should be used to populate the MinimumDatabaseObjectStructure object in the user interface.

*** Firestore Catalog Object

When a firestore catalog object is to be displayed, the parameters in the MinimumDatabaseObjectStructure class should be presented as outlined here. The remaining parameters are presented using either primitives or nested primitives interface (manager-frontend/src/app/features/catalog/primitives).

*** Response of /cataloginfo?catalogname=dataset:MinimumDatabaseObjectStructure
{
  "dataset:servicesuccessful": "true",
  "dataset:serviceresponsemessage": "\u003c?xml version\u003d\"1.0\" encoding\u003d\"UTF-8\"?\u003e\n\n\u003chtml\u003e\n\t\u003chead\u003e\n\t\t\u003ctitle\u003eDatasetCollectionDocumentIDPairForHierarchy\u003c/title\u003e\n\t\u003c/head\u003e\n\t\u003cbody\u003e\n\t\t\u003cdiv\u003eSuccess: DatasetCollectionDocumentIDPairForHierarchy\u003c/div\u003e\n\t\u003c/body\u003e\n\u003c/html\u003e\n",
  "dataset:simpcatobj": {
    "dataobject": {
      "dataset:firestorecatalog": {
        "dataset:addressidpairs": {
          "dataset:collectiondocpair": [
            {
              "dataset:documentid": "not assigned",
              "dataset:collectionid": "not assigned",
              "dataset:idlevel": "not assigned"
            }
          ]
        },
        "qb:DataSet": "not assigned",
        "skos:inScheme": "not assigned"
      },
      "dataset:shortdescription": "not assigned",
      "dataset:catobjid": "not assigned",
      "dataset:transactionid": "not assigned",
      "dataset:catalogkey": "not assigned",
      "dcterms:creator": "not assigned",
      "dcterms:created": "not assigned",
      "dataset:objectype": "not assigned",
      "dataset:readaccess": "not assigned",
      "dataset:accessmodify": "not assigned"
    },
    "annotations": {
      "dataset:MinimumDatabaseObjectStructure": {
        "rdfs:label": "Database Object",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:minimumdatabaseobject",
        "rdfs:comment": "The minimal database object found in the database",
        "dataset:catalogtype": "dataset:MinimumDatabaseObjectStructure"
      },
      "dataset:FirestoreCatalogID": {
        "rdfs:label": "Firestore Catalog ID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:firestorecatalog",
        "rdfs:comment": "The catalog ID associated with the Google firestore database. This adds a set of collection-document pairs to the hierarchy.",
        "dataset:catalogtype": "dataset:FirestoreCatalogID"
      },
      "dataset:CollectionDocumentIDPairAddress": {
        "rdfs:label": "Set of Collection-Document pairs",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:addressidpairs",
        "rdfs:comment": "Set of Collection-Document pairs",
        "dataset:catalogtype": "dataset:CollectionDocumentIDPairAddress"
      },
      "dataset:CollectionDocumentIDPair": {
        "rdfs:label": "Collection-Document Pair",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:collectiondocpair",
        "rdfs:comment": "This is the collection ID and document ID pair associated with the position of the information within the database. This pair is associated with the Firestore database structure.",
        "dataset:catalogtype": "dataset:CollectionDocumentIDPair"
      },
      "dataset:DatasetDocumentID": {
        "rdfs:label": "Document ID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:documentid",
        "rdfs:comment": "This is the document ID within a collection. Its main use is the correspondence with the Google Firestore database which is made up of collections of documents.",
        "dataset:catalogtype": "dataset:DatasetDocumentID"
      },
      "dataset:DatasetCollectionID": {
        "rdfs:label": "Collection ID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:collectionid",
        "rdfs:comment": "This is the id of a collection of objects. Its main use is the correspondence with the Google Firestore database which is made up of collections of documents.",
        "dataset:catalogtype": "dataset:DatasetCollectionID"
      },
      "dataset:DatasetIDLevel": {
        "rdfs:label": "ID Level",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:idlevel",
        "rdfs:comment": "This is the level of the collection-document pair. This is to ensure that the set of collection-document ids are in the right order.",
        "dataset:catalogtype": "dataset:DatasetIDLevel"
      },
      "dataset:SimpleCatalogName": {
        "rdfs:label": "Simple Catalog Name",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "qb:DataSet",
        "rdfs:comment": "The name of the entity within the catalog hierarchy. This name should be unique with the position within the hierarchy.",
        "dataset:catalogtype": "dataset:SimpleCatalogName"
      },
      "dataset:DataCatalog": {
        "rdfs:label": "Data Catalog",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "skos:inScheme",
        "rdfs:comment": "This specifies the catalog to which the data belongs. This name reflects on the type of catalog object is contained.",
        "dataset:catalogtype": "dataset:DataCatalog"
      },
      "dataset:ShortDescription": {
        "rdfs:label": "Short Description",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:shortdescription",
        "rdfs:comment": "This is a standard short description of an object. Its main use is in lists within the user interface to isolate a particular catalog ob ject",
        "dataset:catalogtype": "dataset:ShortDescription"
      },
      "dataset:CatalogObjectID": {
        "rdfs:label": "Catalog Object ID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:catobjid",
        "rdfs:comment": "This is the ID of a catalog object",
        "dataset:catalogtype": "dataset:CatalogObjectID"
      },
      "dataset:TransactionID": {
        "rdfs:label": "Transaction ID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:transactionid",
        "rdfs:comment": "This is the ID of the transaction that was used to generate this object. All the objects that were created with this transaction have the same ID. This is used to collect all objects created by this transaction in the case that the object created was modified. This includes deletion.",
        "dataset:catalogtype": "dataset:TransactionID"
      },
      "dataset:CatalogObjectKey": {
        "rdfs:label": "Catalog Object Key",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:catalogkey",
        "rdfs:comment": "This is a unique (automatically generated) key to identify this catalog object. The key itself is generated using a UUID generator (https://www.uuidgenerator.net/api/guid).",
        "dataset:catalogtype": "dataset:CatalogObjectKey"
      },
      "dataset:CatalogObjectOwner": {
        "rdfs:label": "Owner",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dcterms:creator",
        "rdfs:comment": "This is the creator and owner of the catalog object.",
        "dataset:catalogtype": "dataset:CatalogObjectOwner"
      },
      "dataset:DateCreated": {
        "rdfs:label": "creation date of data within object",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dcterms:created",
        "rdfs:comment": "This refers to when the data in the data object was originally created/published. This is different from when the data object was entered into the database.",
        "dataset:catalogtype": "dataset:DateCreated"
      },
      "dataset:DatabaseObjectType": {
        "rdfs:label": "Database Object Type",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:objectype",
        "rdfs:comment": "This is the data type of the referenced object.",
        "dataset:catalogtype": "dataset:DatabaseObjectType"
      },
      "dataset:CatalogObjectAccessRead": {
        "rdfs:label": "Read Access",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:readaccess",
        "rdfs:comment": "This is who can access the catalog object. The value is a username, consortium or public",
        "dataset:catalogtype": "dataset:CatalogObjectAccessRead"
      },
      "dataset:CatalogObjectAccessModify": {
        "rdfs:label": "Can Modify/Delete Object",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:accessmodify",
        "rdfs:comment": "This is who can modify and delete the object. The value is a username or consortium.",
        "dataset:catalogtype": "dataset:CatalogObjectAccessModify"
      }
    }
  }
}