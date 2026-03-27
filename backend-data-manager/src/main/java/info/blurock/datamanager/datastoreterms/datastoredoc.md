GOAL
To create a technical description of the data store terms and how they are used in the RAG system.
This is to be a separate page from the RAG page, but linked from the RAG page. (link at the end of the RAG page 'Implementation Details')
Important: This page is not for the general chemistry audience, but for the software engineer who will be implementing the system.

GENERAL STRUCTURE
I would like a separate page  that is basically a very detailed tutorial showing the entire flow from the JAVA code generating the firestore terms to the data store setup instructions to using the data store to retrieve the information.
Maybe the stages should be the main headings that point either are on the same page or links to separate pages.

INFORMATION INCLUDED
This should include code snippets and references to google documentation.

STAGES:
1. This should start with a detailed explanation of the code in CreateDataStoreTermSet.
1.1 JsonObject template = CreateDocumentTemplate.createTemplateWithAnnotations(classname);
1.2 Structure of the annotaiton object: Show how a typical annotation has a identifier, label and description extracted from the ontology.
2. Then explain how this information is converted to the DictionaryTerm 
2.2 DictionaryTerm class definition
2.3 DictionaryTermSet class definition
3. Writing the term to firestore. (show the code)
3.1 Include Firestore configuration and initialization code.
3.2 Include code to write the term to firestore.
4. Data Store Setup
4.1 Instructions for setting up the data store.
4.2 Instructions for setting up the data store dictionary.
4.3 Instructions for setting up the data store schema
4.4 Instructions for linking the firestore data to the data store.
5. Using the data store to retrieve the information 
5.1 The configuration to use the data store for retrieval.
5.2 code snippets (the classes involved)showing how to use the data store to retrieve the information.
5.3 An example of the data that is retrieved.
5.4 Extracting the data to present the information to the user.

## Current Implementation Status
The RAG technical documentation (rag-technical.html) is fully implemented following the stages above.
- **RAG Architecture Flow**: A high-fidelity diagram was added to the main datastore-terms.html page to visualize the ontology-to-AI flow.
- **Stage 1 (Ontology)**: Documented Term Extraction logic.
- **Stage 2 (Modeling)**: Documented DictionaryTerm structure.
- **Stage 3 (Persistence)**: Documented Batched Firestore writes.
- **Stage 4 (Setup)**: Documented Discovery Engine schema and configuration.
- **Stage 5 (Retrieval)**: Documented SearchRequest, Filters, and Structured Data parsing.

## Walkthrough of Technical Documentation Build
1. **Source Code Extraction**: Extracted logical chunks from CreateDataStoreTermSet, DictionaryTerm, and WriteDictionaryTerms.
2. **Setup Verification**: Replicated the Data Store configuration steps within the documentation to ensure reproducibility.
3. **Visual Architecture**: Generated the 'rag_architecture_flow' graphic using autonomous design tools.
4. **Site Integration**: Integrated the technical documentation into the Vite-based hosting project.
