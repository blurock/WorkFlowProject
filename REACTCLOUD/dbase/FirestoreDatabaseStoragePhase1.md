*** Goal
This is the first phase of a conversion of the REACTCLOUD database system from a file based system to a Firestore based system. The objects are converted to JSON and then stored as Firestore documents within a directory reflecting datatype and user. This phase only involves the storage of the data, not the retrieval.

Important: In this phase, the gdbm logic code should be kept as is, and the Firestore logic should be added in parallel. The result is that the database will be stored in both gdbm and Firestore.  (Don't remove any gdbm code)

Changes are done in the file /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/dbase/datum.c and /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c


*** Directory structure

1. 'REACTCLOUD' (collection)
2. User UID (document) from the current user
3. 'data' (collection)
4. Data type (collection) (DataBaseInformation)->name)
5 the data object with ID from object (extracted from (DbaseKeyword)->keyword)

*** Storing data: StoreElement

The code will be added to 
extern INT StoreElement(VOID element,
			DbaseKeyword *keyword,
			INT flag,
			DataBaseInformation *info)

1. info->name -> collection: datatype 
2. element -> info->ElementToJSONString() -> JSON string
3. the orchestrator (/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js) is used to convert the JSON string to a JSON object and then convert the JSON object to a map for the firebase document.
4. The orchestrator knows the user ID
5. the orchestrator uses (DbaseKeyword)->keyword for the document ID
6. The orchestrator determines if the document already exists and if it does, it updates it.
7. The map is then converted to a Firestore document and stored in the appropriate collection.
8. The result of the call should have a status, whether the element was stored or updated.

*** storing data: WriteTreeOfObjects

extern INT WriteTreeOfObjects(ObjectIDTreeNode *tree,
			      INT id,
			      BindStructure *bind)

In file /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c

1. Use the routine WriteJSONObjectIDTreeNodeToString to convert the tree to a JSON string.
2. The Datatype will be 'Classification' with the id appended. E.g. Classification_12345
3. the orchestrator (/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js) is used to convert the JSON string to a JSON object and then convert the JSON object to a map for the firebase document.
4. The orchestrator knows the user ID
5. the orchestrator uses (DbaseKeyword)->keyword for the document ID
6. The orchestrator determines if the document already exists and if it does, it updates it.
7. The map is then converted to a Firestore document and stored in the appropriate collection.
8. The result of the call should have a status, whether the element was stored or updated.


*** storing data: WriteDBSearchType
/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/dbase/datum.c

1. Use the routine WriteJSONSetOfSearchKeysToString to convert the tree to a JSON string.
2. The Datatype will be 'SearchKeys' with the id appended. E.g. SearchKeys_12345
3. the orchestrator (/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/orchestrator/server.js) is used to convert the JSON string to a JSON object and then convert the JSON object to a map for the firebase document.
4. The orchestrator knows the user ID
5. the orchestrator uses (DbaseKeyword)->keyword for the document ID
6. The orchestrator determines if the document already exists and if it does, it updates it.
7. The map is then converted to a Firestore document and stored in the appropriate collection.
8. The result of the call should have a status, whether the element was stored or updated.









