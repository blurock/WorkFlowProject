*** Goal 
The goal is to take the current in-memory ObjectIDTreeNode structure, which is based on linked lists and pointers, and convert it into a structure that can be stored in Firestore. This new structure will use arrays and IDs to represent the tree, making it suitable for document-based storage.

Routines in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c will need to be rewritten to use the tree structure that is now in firestore. the same data structures will be used, but repurposed for the firestore  implementation. The actual Firestore interface will be done by the orchestration engine, which will provide the interface.

Only /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c (for repurposing the data structures) and orchestration routines for the interface to Firestore. (supplementing the routines that already exist). 



*** Current Structure
The current structure is defined as:

```c
typedef struct molidtreenode ObjectIDTreeNode;
struct molidtreenode {
     INT ID;
     CHAR *Name;
     INT  NumberOfSubTrees;
     ObjectIDTreeNode *SubTrees;
     ObjectIDClass *Info;
     };
```

Key characteristics:
- `SubTrees` is an array of pointers to other `ObjectIDTreeNode`s.
- `Info` is a pointer to a linked list of `ObjectIDClass`.

*** Target Structure for Firestore

The level of the tree will be a tree of 'directories' of collections and documents. At leaf node level there will be a document ObjectIDClass (translated JSON object) with identifier: Info. The document fields will be pointing to the next level of the tree. The tree structure of ObjectIDTreeNode will be mimmiced by the directory structure of the firestore collections/documents. 

*** tree structure

The tree is created from the following structure:
typedef struct molidinfo ObjectIDInfo;
struct molidinfo {
     INT ID;
     CHAR *Name;
     INT  NumberOfObjectIDs;
     INT *ObjectIDs;
     };

    The name of the current level/directory is given by id = *(info->ObjectIDs + level);

    At the last level there is no children (NumberOfSubTrees = 0).  At this level there is a pointer to the ObjectIDClass. If it does not exist, then it is created (see below). 


    **** Corresponding Functions
    extern ObjectIDTreeNode *InitializeObjectTree(INT id, CHAR *name)
     {
     ObjectIDTreeNode *tree;
     
     tree = AllocateObjectIDTreeNode;
     CreateObjectIDTreeNode(tree,id,name,0,0,0);
     return(tree);
     }

InitializeObjectTree will give the specific class (for example molecule or substruction) infomation for the top node of the tree in firestore. Later in other routines (see below) the exact collection 'usr/<userid>/classifications/database' or 'usr/<userid>/classifications/<session id>' will be specified. The total directory structure given as a string in the Name property, will eventually be used to specify the top directory structure in of the class in firestore.  


     **** SetOfObjectClassifications
     There are two SetOfObjectClassifications, one local (LOCAL_CLASSIFICATIONS) and one in the database (DATABASE_CLASSIFICATIONS).
     The database of objects for the local is stored in memory (in bind). This is when mechanisms are generated automatically. 
     The database of objects for the database is read in from the firestore database.

     Both the local and the database versions the object ID tree is stored in firestore.
     The database version is persistent with the topnode is 'Classifications' and the local version the top node is the session id.

     The SetOfObjectClassifications is initialized in AddEmptyClassification in REACTCLOUD/chemdb/objfind.c

**** InitializeSetOfObjectClassifications

The job of this routine is to set up the tree structures in firestore for the current user. 
In the user firestore there will be a collection 'classifications' (user/<userid>/classifications). in classifications there will be subcollections. One is database, which are collections refer to collections using the firestore objects. The others are refered to by the session id. They represent classifications of 'local'object in the bind structure. 

The job of InitializeSetOfObjectClassifications, in addition to the current job of setting the data structure, SetOfObjectClassifications,  is to set up this structure if it does not exist. This will be done with a ochestration call.

*** classification(ObjectClassification)->TreeOfObjects
In the datatype ObjectClassification the property TreeOfObjects is a pointer to a ObjectIDTreeNode. The Name is the directory of this classification. 
For example, usr/<userid>/classifications/database/<source>/<classification-name>
where <source> is the source, either 'Local' or 'Database' and
<classification-name> classification type (for example, DB-Index-MoleculeIDs or DB-Index-SubStructureIDs)

*** FindClassification changes 
In trying to keep in line with the original structure, this will be set in the FindClassification (in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c). In this routine, in the switch case based on source, it will first set the TreeOfObjects name to the full directory name. Then it make call an orchestration that creates the directory structure in firestore, if it does not exist.   (note that the ReadInClassification(done,bind) for the database,  because it already exists.)

From done, the name of the classification is found <classication name> grabbed from done->TreeObjects->Name
this is then used to rewrite the name  to 
For example if source is DATABASE_CLASSIFICATIONS, the done->TreeObjects->Name is set to 'usr/<userid>/classifications/database/<classification name>'. If LOCAL_CLASSIFICATIONS then 'usr/<userid>/classifications/<session id>/<classification name>'.  

*** ReadInClassification and WriteOutClassification
ReadInClassification and WriteOutClassification (in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c) will be obsolete because the database is persistent.

*** ReadInTreeOfObjects and WriteTreeOfObjects
Beacuse the database is already persistent, these routines are not used.
ReadInTreeOfObjects (in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c) is currently unused
WriteTreeOfObjects (in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c) is currently unused

*** FindObjectIDClass

The routine FindObjectIDClass in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/chemdb/objfind.c will need to be rewritten to use the tree structure that is now in firestore.

From ObjectIDTreeNode *tree the path in the property Name specifies the directory where this classification type is located. 
The path to the specific clas for this object is found in ObjectIDInfo *info; in info->ObjectIDs is the list of IDs of the objects in the tree.  For example if info->ObjectIDs = {1,3,5}, this means the path to the specific class is 1/3/5 subdirectories from the original location in tree->Name.

In orchestration will determine the class location in the Firestore with the combination of tree->Name and info->ObjectIDs.  It will then read in the ObjectIDClass from Firestore.  If it does not exist, then it will be created.  This will be a synchronous call.  It will then read in the ObjectIDClass from Firestore.  If it does not exist, then ObjectIDClass *class will be created, with the first ID being the first ID in the list. The ID of the object will be converted to  DbaseKeyword Key. 

key = AllocateDbaseKeyword;
key->Size = INTSize;
key->KeyWord = (VOID)AllocateINT;
memcpy((char *)key->KeyWord, (char *)&(ID), (unsigned int)key->Size);




     

    






