
GOAL: To replace the logic using MoleculeTask interface with the data described by the ontology object dataset:ActivitySpeciesCatalogObjectCreation and to call a transaction in DatasetBackgroundService.

Files to focus on:
1. The fronted is  manager-frontend: app/components/ketcher-editor/ketcher-editor.component.ts
2. The backend is backend-data-manager: info.blurock.datamanager.service.services.MoleculeTaskListenerService.java
3. The backend MoleculeTaskListenerService calls the transaction process in DatasetBackgroundService: info.esblurock.background.services.controllers.BackgroundTransactionController.java

TASKS:
1.  Update ketcher-editor.component.ts to use the dataset:ActivitySpeciesCatalogObjectCreation object instead of the MoleculeTask interface.
2. The listener should be updated to use the dataset:ActivitySpeciesCatalogObjectCreation object instead of the MoleculeTask interface.
3. The status is in the dataset:ActivitySpeciesCatalogObjectCreation object under key of SessionStatus
4. Successful completion is indicated by the SessionStatus being set to dataset:SessionStatusCompleted
5. Error is indicated by the SessionStatus being set to dataset:SessionStatusError
6. The UI should be updated with the DescriptionAbstract (dataet:description) which is a org.dom4j.Document as a string. Convert the string to a HTML document and display it in the UI.
2. The molecule formats for SMILES and for MolFileV2000 should be in the array of dataset:JThermodynamicsStructureFormat structures with the molfiletype set to dataset:SpeciesRepresentationMolFileV2000 and dataset:SpeciesRepresentationSMILES respectively.
2. the frontend write the object dataset:ActivitySpeciesCatalogObjectCreation to the firestore database at the path defined by getFirestorePath.
3. the frontend should listen to the firestore database at the path defined by getFirestorePath for changes to the object dataset:ActivitySpeciesCatalogObjectCreation and update the UI as completed.
4. the backend should listen (MoleculeTaskListenerService) to the firestore database at the path defined by getFirestorePath for changes to the object dataset:ActivitySpeciesCatalogObjectCreation.
5. When MoleculeTaskListenerService detects a new object, it should process it by performing the following steps:
    a. Create a JSON object that will be the input to the transaction process that has the following elements:
  "prov:activity": "dataset:CreateA2DSpeciesFromGraphicInterface",
	"dataset:transreqobj": {},
	"dataset:activityinfo": This is the dataset:ActivitySpeciesCatalogObjectCreation object
    b. The transaction process is /transaction of the  BackgroundTransactionController in DataseetBackgroundService.
    c. The transaction process will return a JSON object that will be the output of the transaction process:
    ClassLabelConstants.ServiceProcessSuccessful: is true if the transaction was successful, false otherwise
    ClassLabelConstants.ServiceResponseMessage: is a org.dom4j.Document in string form that contains the result of the transaction process
    ClassLabelConstants.SimpleCatalogObject: is the JSON catalog object that was created
6. The org.dom4j.Document should be written to SessionData in the key DescriptionAbstract (dataet:description) and updated in the firestore database.
7. The backend should update the dataset:ActivitySpeciesCatalogObjectCreation object SessionStatus to dataset:SessionStatusCompleted or dataset:SessionStatusError based on the result of the transaction process.

    
    




ActivitySpeciesCatalogObjectCreation Definition

 "dataset:simpcatobj": {
    "dataobject": {
      "dataset:speciesformat": [
        {
          "dataset:molfiletype": "Unassigned classification: dataset:SpeciesRepresentationType",
          "dataset:speciesrepresentation": "not assigned"
        }
      ],
      "dataset:speciesrepresentation": "not assigned",
      "datasert:sessionstatus": "Unassigned classification: dataset:SessionStatus",
      "dataset:authorizationuid": "not assigned",
      "dataset:sessionId": "not assigned",
      "dcterms:created": "not assigned"
    },
    "annotations": {
      "dataset:ActivitySpeciesCatalogObjectCreation": {
        "rdfs:label": "Species Catalog Object Creation",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:speciescatalogobjectcreation",
        "rdfs:comment": "A species catalog object with structure",
        "dataset:catalogtype": "dataset:ActivitySpeciesCatalogObjectCreation"
      },
      "dataset:JThermodynamicsStructureFormat": {
        "rdfs:label": "Species Structure as Text",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:speciesformat",
        "rdfs:comment": "The representation of a molecular species as text",
        "dataset:catalogtype": "dataset:JThermodynamicsStructureFormat"
      },
      "dataset:SpeciesRepresentationChoices": {
        "rdfs:label": "Species Representation",
        "rdfs:comment": "These are the possible text formats of a species",
        "dataset:catalogtype": "dataset:SpeciesRepresentationChoices"
      },
      "dataset:SpeciesRepresentationMolFile": {
        "rdfs:label": "MolFile",
        "rdfs:comment": "This is the older MolFile representation (no properties)",
        "dataset:catalogtype": "dataset:SpeciesRepresentationMolFile"
      },
      "dataset:SpeciesRepresentationNancyLinearForm": {
        "rdfs:label": "Nancy Linear Form",
        "rdfs:comment": "This is the one line linear form of species representation used by the University of Nancy and CNRS",
        "dataset:catalogtype": "dataset:SpeciesRepresentationNancyLinearForm"
      },
      "dataset:SpeciesRepresentationSMILES": {
        "rdfs:label": "SMILES",
        "rdfs:comment": "This is the one line linear format SMILES",
        "dataset:catalogtype": "dataset:SpeciesRepresentationSMILES"
      },
      "dataset:SpeciesRepresentationInChI": {
        "rdfs:label": "InChI",
        "rdfs:comment": "The InChI single line text format for a species",
        "dataset:catalogtype": "dataset:SpeciesRepresentationInChI"
      },
      "dataset:SpeciesRepresentationMolFileV2000": {
        "rdfs:label": "MolFile V2000",
        "rdfs:comment": "This is the MolFile V2000 which includes properties, such as radicals",
        "dataset:catalogtype": "dataset:SpeciesRepresentationMolFileV2000"
      },
      "dataset:SpeciesRepresentationType": {
        "rdfs:label": "MolFile type",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:molfiletype",
        "rdfs:comment": "This the type of MolFile representation",
        "dataset:catalogtype": "dataset:SpeciesRepresentationType",
        "classification": {
          "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
          "dataset:catalogtype": "dataset:SpeciesRepresentationChoices",
          "rdfs:label": "Species Representation",
          "rdfs:comment": "These are the possible text formats of a species",
          "dataset:classificationtree": [
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SpeciesRepresentationMolFileV2000",
              "rdfs:label": "MolFile V2000",
              "rdfs:comment": "This is the MolFile V2000 which includes properties, such as radicals",
              "dataset:classificationtree": []
            },
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SpeciesRepresentationSMILES",
              "rdfs:label": "SMILES",
              "rdfs:comment": "This is the one line linear format SMILES",
              "dataset:classificationtree": []
            },
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SpeciesRepresentationInChI",
              "rdfs:label": "InChI",
              "rdfs:comment": "The InChI single line text format for a species",
              "dataset:classificationtree": []
            },
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SpeciesRepresentationNancyLinearForm",
              "rdfs:label": "Nancy Linear Form",
              "rdfs:comment": "This is the one line linear form of species representation used by the University of Nancy and CNRS",
              "dataset:classificationtree": []
            },
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SpeciesRepresentationMolFile",
              "rdfs:label": "MolFile",
              "rdfs:comment": "This is the older MolFile representation (no properties)",
              "dataset:classificationtree": []
            }
          ]
        }
      },
      "dataset:SpeciesRepresentationAsText": {
        "rdfs:label": "Species Representation",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:speciesrepresentation",
        "rdfs:comment": "Species Representation",
        "dataset:catalogtype": "dataset:SpeciesRepresentationAsText"
      },
      "dataset:SessionStatusChoices": {
        "rdfs:label": "Session Status Choices",
        "rdfs:comment": "These are the different types of generic status that a session object or a session can be in. The status is generic and interpreted by the frontend and the backend",
        "dataset:catalogtype": "dataset:SessionStatusChoices"
      },
      "dataset:SessionStatusProcessing": {
        "rdfs:label": "Processing",
        "rdfs:comment": "The operation is currently processing the input",
        "dataset:catalogtype": "dataset:SessionStatusProcessing"
      },
      "dataset:SessionStatusPending": {
        "rdfs:label": "Pending",
        "rdfs:comment": "This is where the frontend is waiting for an answer.",
        "dataset:catalogtype": "dataset:SessionStatusPending"
      },
      "dataset:SessionStatusComplete": {
        "rdfs:label": "Complete",
        "rdfs:comment": "This is when the current operation or session is complete",
        "dataset:catalogtype": "dataset:SessionStatusComplete"
      },
      "dataset:SessionStatusError": {
        "rdfs:label": "Error",
        "rdfs:comment": "An error has occured during the operation or session",
        "dataset:catalogtype": "dataset:SessionStatusError"
      },
      "dataset:SessionStatus": {
        "rdfs:label": "Session Status",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "datasert:sessionstatus",
        "rdfs:comment": "The session status is to signal the status of the session operation. It is part of the communication between the frontend and the backend.",
        "dataset:catalogtype": "dataset:SessionStatus",
        "classification": {
          "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
          "dataset:catalogtype": "dataset:SessionStatusChoices",
          "rdfs:label": "Session Status Choices",
          "rdfs:comment": "These are the different types of generic status that a session object or a session can be in. The status is generic and interpreted by the frontend and the backend",
          "dataset:classificationtree": [
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SessionStatusProcessing",
              "rdfs:label": "Processing",
              "rdfs:comment": "The operation is currently processing the input",
              "dataset:classificationtree": []
            },
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SessionStatusComplete",
              "rdfs:label": "Complete",
              "rdfs:comment": "This is when the current operation or session is complete",
              "dataset:classificationtree": []
            },
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SessionStatusPending",
              "rdfs:label": "Pending",
              "rdfs:comment": "This is where the frontend is waiting for an answer.",
              "dataset:classificationtree": []
            },
            {
              "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "",
              "dataset:catalogtype": "dataset:SessionStatusError",
              "rdfs:label": "Error",
              "rdfs:comment": "An error has occured during the operation or session",
              "dataset:classificationtree": []
            }
          ]
        }
      },
      "dataset:UID": {
        "rdfs:label": "UID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:authorizationuid",
        "rdfs:comment": "The unique user ID assigned by the authorization (or some external) service",
        "dataset:catalogtype": "dataset:UID"
      },
      "dataset:SessionId": {
        "rdfs:label": "Session ID",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dataset:sessionId",
        "rdfs:comment": "This is the ID associated with the session. The session could be defined is several ways. The main being the workflow session.",
        "dataset:catalogtype": "dataset:SessionId"
      },
      "dataset:DateCreated": {
        "rdfs:label": "creation date of data within object",
        "\u003chttp://purl.org/dc/elements/1.1/identifier\u003e": "dcterms:created",
        "rdfs:comment": "This refers to when the data in the data object was originally created/published. This is different from when the data object was entered into the database.",
        "dataset:catalogtype": "dataset:DateCreated"
      }
    }
  }
}