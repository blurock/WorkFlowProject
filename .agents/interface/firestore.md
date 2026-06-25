Description
This is describing the UI for the JSON object FirestoreCatalogID which is used to identify the location of the object in the Firestore database. 

Content
The FirestoreCatalogID object contains:
CollectionDocumentIDPair: Array of objects with keys CollectionName and DocumentID
CollectionName: Name of the collection in the Firestore database
DocumentID: ID of the document in the Firestore database

The identifier for the FirestoreCatalogID is: dataset:firestorecatalog

The FirestoreCatalogID interface should be used for FirestoreCatalogID and the subclasses of FirestoreCatalogID: 
dataset:FirebaseCatalogIDForModifiedObject, 
dataset:RelatedCatalogObjectIDAndType, 
dataset:DatabasePersonObjectID, 
dataset:ActivityInformationRecordID, 
dataset:DataCatalogOutputObjectReplaced, 
dataset:DatabaseObjectIDOutputTransaction, 
dataset:UserAccountObjectID, 
dataset:FirestoreCatalogIDForTransaction, 
dataset:RequiredTransactionIDAndType, 
dataset:DatabaseIDFromRequiredTransaction, 
dataset:DataCatalogOutputObjectID

User Interface

1. All the parameters cannot be modified by the user. The information is just presented in the interface.
2. The initial presentation of the object should be two lines. 
Line 1: the label (rdfs:label) and the comment (rdfs:comment) is also displayed. There will be an eye icon to the left, Clicking on the icon will expand the object to show all the parameters. Also on the right will be a button to use the firestore address to read in the catalog object and display it (if possible, in a separate view, or a new tab).
Line 2: The ShortDescription text. 
3. If the FirebaseObjectID is part of a larger object, then the display should be at the end of the parent object.
4. If the FirestoreCatalogID object is within an array of FirestoreCatalogID objects, then each of the FirestoreCatalogID objects is displayed in the array in the order that they are in the array. It does not affect the position of the array.
4. The endpoint defined in CatalogInformationController:
    /cataloginfo?catalogname=dataset:FirestoreCatalogID. 
should be used to populate the FirestoreCatalogID object in the user interface.


*** Response of /cataloginfo?catalogname=dataset:FirestoreCatalogID
{
  "dataset:servicesuccessful": "true",
  "dataset:serviceresponsemessage": "\u003c?xml version\u003d\"1.0\" encoding\u003d\"UTF-8\"?\u003e\n\n\u003chtml\u003e\n\t\u003chead\u003e\n\t\t\u003ctitle\u003eDatasetCollectionDocumentIDPairForHierarchy\u003c/title\u003e\n\t\u003c/head\u003e\n\t\u003cbody\u003e\n\t\t\u003cdiv\u003eSuccess: DatasetCollectionDocumentIDPairForHierarchy\u003c/div\u003e\n\t\u003c/body\u003e\n\u003c/html\u003e\n",
  "dataset:simpcatobj": {
    "dataobject": {
      "dataset:addressidpairs": {
        "dataset:collectiondocpair": [
          {
            "dataset:idlevel": "not assigned",
            "dataset:collectionid": "not assigned",
            "dataset:documentid": "not assigned"
          }
        ]
      },
      "qb:DataSet": "not assigned",
      "skos:inScheme": "not assigned"
    },
    "annotations": {
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
      "dataset:DatasetIDLevel": {
        "rdfs:label": "ID Level",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:idlevel",
        "rdfs:comment": "This is the level of the collection-document pair. This is to ensure that the set of collection-document ids are in the right order.",
        "dataset:catalogtype": "dataset:DatasetIDLevel"
      },
      "dataset:DatasetCollectionID": {
        "rdfs:label": "Collection ID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:collectionid",
        "rdfs:comment": "This is the id of a collection of objects. Its main use is the correspondence with the Google Firestore database which is made up of collections of documents.",
        "dataset:catalogtype": "dataset:DatasetCollectionID"
      },
      "dataset:DatasetDocumentID": {
        "rdfs:label": "Document ID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:documentid",
        "rdfs:comment": "This is the document ID within a collection. Its main use is the correspondence with the Google Firestore database which is made up of collections of documents.",
        "dataset:catalogtype": "dataset:DatasetDocumentID"
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
      }
    }
  }
}
