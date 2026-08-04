/*  FILE     objfind.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Automatic Generation of Molecule ID
**    Find Identical Structures in Database
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/ 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"

#include "chemdb/objid.c"

 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static ObjectClassification *AddClassificationToSet(SetOfObjectClassifications *set,
				   ObjectClassification *classification);
static ObjectIDTreeNode *ReadInTreeOfObjects(INT id, CHAR *name,
					     BindStructure *bind);
static ObjectIDClass *FindObjectIDClass(ObjectIDTreeNode *tree,
				     ListOfTreeLevelDescriptions *descr,
				     ObjectIDInfo *object);
static ObjectIDClass *FindObjectIDClassLoop(INT level,
					    ListOfTreeLevelDescriptions *descr,
					    ObjectIDTreeNode *tree, 
					    ObjectIDInfo *info);
static ObjectIDTreeNode *FindObjectIDNode(ObjectIDTreeNode *tree,INT id);
static ObjectIDClass *ProduceClassPath(INT level,
				       ObjectIDTreeNode *tree,
				       ObjectIDInfo *info,
				       ListOfTreeLevelDescriptions *descr);
static ObjectIDTreeNode *AddNodeToTree(ObjectIDTreeNode *tree,INT id);
static INT SearchForObjectInBindStructure(ObjectIDClass *class,
					  ObjectClassification *classification,
					  ChemDBMaster *dbmaster,
					  VOID object,
					  BindStructure *bind);
static INT SearchForObjectInDatabase(ObjectIDClass *class,
				 ObjectClassification *classification,
				 ChemDBMaster *dbmaster,
				     VOID object);
static INT WriteTreeOfObjects(ObjectIDTreeNode *tree,
			      INT id,
			      BindStructure *bind);
static  SetOfObjectClassifications *GetSetOfObjectClassifications(INT source,
								  BindStructure *bind);

/*S DetermineObjectID
*/
 
/*F id = DetermineObjectID(object,classid,source,bind) . . . . . . . .  
**
**  DESCRIPTION
**    object  - Object to compare
**    classid - Type of object
**    source  - The source of the comparison objects 
**                       (DATABASE_CLASSIFICATIONS, LOCAL_CLASSIFICATIONS)
**    bind    - The bind structure
**
**    This routine searches the id classes and the database
**    for the object.  If found, the object from the database
**    is returned, if not in the database, zero is returned.
**
**    - Get Classification Definition (FindClassification)
**    - Get (or create) class of object (FindOrCreateObjectIDClass)
**    - With class, read in specified objects and check for equivalence.
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT DetermineObjectID(VOID object,
			     INT classid,
			     INT source,
			     BindStructure *bind)
     {
     ChemDBMaster *dbmaster;
     ObjectClassification *classification;
     ObjectIDClass *class;
     INT id;
     
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);

     classification = FindClassification(classid,source,bind);
     
     class = FindOrCreateObjectIDClass(object,
				       classification->Description,
				       classification->TreeOfObjects);
     
     switch(source)
	  {
     case DATABASE_CLASSIFICATIONS:
	  id = SearchForObjectInDatabase(class,classification,dbmaster,object);
	  break;
     case LOCAL_CLASSIFICATIONS:
	  id = SearchForObjectInBindStructure(class,classification,dbmaster,object,bind);
	  break;
	  }
     
     return(id);
     }
     
     
/*f id = SearchForObjectInBindStructure(class,classification,dbmaster,object)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT SearchForObjectInBindStructure(ObjectIDClass *class,
					  ObjectClassification *classification,
					  ChemDBMaster *dbmaster,
					  VOID object,
					  BindStructure *bind)
     {
     VOID setelements,newobject;
     INT done,count,compare;
     DbaseKeyword *key;
     
     setelements = GetBoundStructure(bind,classification->Description->BindStruct);

     done = 0;
     count = 0;
     key = class->Keys;
     while(done == 0 && count < class->NumberOfKeys)
	  {
	  newobject = (*(classification->FindElementInSet))(key,setelements);
	  compare = (*(classification->Equivalence))(newobject,object);
	  if(compare == 0)
	       done = key->ID;
	  count++;
	  key++;
	  }
     return(done);     
     }

 
/*f id = SearchForObjectInDatabase(class,classification,dbmaster,object)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT SearchForObjectInDatabase(ObjectIDClass *class,
				 ObjectClassification *classification,
				 ChemDBMaster *dbmaster,
				 VOID object)
     {
     DataBaseInformation *dinfo;
     VOID newobject;
     INT done,count,compare,ret;
     DbaseKeyword *key;
     
     dinfo = GetDataBaseInfoFromID(dbmaster->DatabaseInfo,
				   classification->Description->Database);
     newobject = (*(dinfo->AllocateElement))();
     
     done = 0;
     count = 0;
     key = class->Keys;
     while(done == 0 && count < class->NumberOfKeys)
       {
	 ret = SearchKeyElement(classification->Description->KeyType,
				newobject,key,dinfo);
	 if(ret == SYSTEM_NORMAL_RETURN)
	   {
	     compare = (*(classification->Equivalence))(newobject,object);
	     if(compare == 0)
	       done = key->ID;
	     (*(dinfo->FreeElement))(newobject);
	   }
	 else
	   {
	     printf("The object within the classification was not found\n");
	   }
	 count++;
	 key++;
       }
     return(done);
     }
/*S Classifications
*/ 
/*F classifications = InitializeSetOfObjectClassifications(id,name)
**
**  DESCRIPTION
**    Sets up an empty list of classifications
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern SetOfObjectClassifications *InitializeSetOfObjectClassifications(INT id, CHAR *name)
     {
     SetOfObjectClassifications *classifications;
     
     classifications = AllocateSetOfObjectClassifications;
     CreateSetOfObjectClassifications(classifications,id,name,0,0);
     
     return(classifications);
     } 
/*F tree = InitializeObjectTree(id,name)  . . . . . . . . . . . . . . . . .  
**
**  DESCRIPTION
**    id   - The id of the tree
**    name - The name of the tree
**
**    The tree is initialized with no elements
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern ObjectIDTreeNode *InitializeObjectTree(INT id, CHAR *name)
     {
     ObjectIDTreeNode *tree;
     
     tree = AllocateObjectIDTreeNode;
     CreateObjectIDTreeNode(tree,id,name,0,0,0);
     return(tree);
     }

 
/*f set GetSetOfObjectClassifications(source,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static  SetOfObjectClassifications *GetSetOfObjectClassifications(INT source,
								  BindStructure *bind)
     {
     LocDbaseClassifications *classsets;
     SetOfObjectClassifications *set;

     classsets = GetBoundStructure(bind,BIND_ID_CLASSIFICATIONS);
     switch(source)
	  {
     case LOCAL_CLASSIFICATIONS:
	  set = classsets->Local;
	  if(set == 0)
	       {
	       classsets->Local = set = AllocateSetOfObjectClassifications;
	       CreateSetOfObjectClassifications(set,LOCAL_CLASSIFICATIONS,0,
						0,0);
	       }
	  break;
     case DATABASE_CLASSIFICATIONS:
	  set = classsets->Database;
	  if(set == 0)
	       {
	       classsets->Database = set = AllocateSetOfObjectClassifications;
	       CreateSetOfObjectClassifications(set,DATABASE_CLASSIFICATIONS,0,
						0,0);
	       }
	  break;
     default:
	  printf("Fatal Error, FindClassification - %d",source);
	  set = 0;
	  }
     return(set);
     }

     
/*F classification = FindClassification(classid,source,bind) . . . . . . . . . . .  
**
**  DESCRIPTION
**    classid   - The classification type (the database id)
**    bind      - The bind structure
**    classification - The asked for classification
**
**    The classification with the given id is search for in
**    the following way:
**    
**    - First, it is search for in the set structure.
**    - If not found, then it is looked for in the database,
**      and put into the set structure
**    - If not found, then it is created with the empty list
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern ObjectClassification *FindClassification(INT classid,
						INT source,
						BindStructure *bind)
     {
     INT count;
     ObjectClassification *classification,*done;
     SetOfObjectClassifications *set;

     set = GetSetOfObjectClassifications(source,bind);
     
     done = 0;
     count = 0;
     classification = set->Classifications;
     while(done == 0 && count < set->NumberOfClassifications)
	  {
	  if(classid == classification->ID)
	       done = classification;
	  count++;
	  classification++;
	  }
     
     if(done == 0)
	  {
	  done = AddEmptyClassification(set,classid,bind);
	  switch(source)
	       {
	  case LOCAL_CLASSIFICATIONS:
	       break;
	  case DATABASE_CLASSIFICATIONS:
	       ReadInClassification(done,bind);
	       break;
	  default:
	       printf("Fatal Error, FindClassification - %d",source);
	       done = 0;
	       }
	  }
     
     return(done);
     }
 				
/*F classification -  AddEmptyClassification(set,classid,bind)
**
**  DESCRIPTION
**    set       -     The set of classifications
**    classid   -     The classification identification
**    bind      -     The bind structure
**    classification- The classification that was read in (or created)
**
**    The classification description is created and the tree is 
**    initialized to empty tree.
**
**    The possible classid's are:
**    - MOLECULE_DATABASE
**    - SUBSTRUCTURE_DATABASE
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern ObjectClassification *AddEmptyClassification(SetOfObjectClassifications *set,
						    INT classid,
						    BindStructure *bind)
     {
     ObjectClassification *classification,*inset;
     
     classification = AllocateObjectClassification;
     CreateObjectClassification(classification,classid,0,0,0,0,0);
     
     switch(classid)
	  {
     case MOLECULE_DATABASE:
	  classification->Name = CopyString("DB-Index-MoleculeIDs");
	  classification->Description = InitializeMoleculeTreeDescription(classid,
									  "DB-Index-MoleculeIDs");
	  classification->TreeOfObjects = InitializeObjectTree(classid,"DB-Index-MoleculeIDs");
	  classification->Equivalence = MoleculeEquivalence;
	  classification->FindElementInSet = FindMoleculeByKey;
	  break;
     case SUBSTRUCTURE_DATABASE:
	  classification->Name = CopyString("DB-Index-SubStructureIDs");
	  classification->Description = InitializeMoleculeTreeDescription(classid,
									  "DB-Index-SubStructureIDs");
	  classification->TreeOfObjects = InitializeObjectTree(classid,"DB-Index-SubStructureIDs");
	  classification->Equivalence = SubStructureEquivalence;
	  classification->FindElementInSet = FindMoleculeByKey;
	  break;
     default:
	  FreeObjectClassification(classification);
	  Free(classification);
	  inset = classification = 0;
	  break;
	  }
     if(classification != 0)
	  {
	  inset = AddClassificationToSet(set,classification);
	  Free(classification);
	  }
     
     return(inset);
     }

/*f ret = AddClassificationToSet(set,classification)  . . . . . . . . . . .  
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static ObjectClassification *AddClassificationToSet(SetOfObjectClassifications *set,
				   ObjectClassification *classification)
     {
     INT newnum;
     unsigned int oldsize;
     ObjectClassification *first,*newclass;
     
     newnum = set->NumberOfClassifications + 1;
     oldsize = ObjectClassificationSize * (set->NumberOfClassifications);
     first = AllocArrayObjectClassification(newnum);
     memcpy(first,set->Classifications,oldsize);
     newclass = first + set->NumberOfClassifications;
     memcpy(newclass,classification,ObjectClassificationSize);
     Free(set->Classifications);
     set->Classifications = first;
     set->NumberOfClassifications = newnum;
     
     return(newclass);
     }

/*S ReadWriteClassifications
**     This set of routines stores the TreeOfObjects structure of the ClassificationObject 
**     into the database (This is the only part is that is variable - Other parts are
**     not stored, for example, because they are routine addresses).
**
**     GenericReadElement and GenericWriteElement are used to write the tree to the
**     the database.  The database used is the same one used to store the original objects. 
**     The Key is the name of the datastructure as given by the Name in the ClassificationObject 
**     definition (which is transfered to the TreeOfObjects structure).
*/
/*F class = ReadInClassification(classification,bind)  . . . . . . . . . . . .  
**
**  DESCRIPTION
**    set       -   The set of classifications
**    classid   -   The classification identification
**    bind      -   The bind structure
**    class     -   The classification that was read in (or created)
**
**    The classification description is created and the tree is 
**    read in from the appropriate database (or initialized to empty
**    if not in the database).
**
**    The possible classid's are:
**    - MOLECULE_DATABASE
**    - SUBSTRUCTURE_DATABASE
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern ObjectClassification *ReadInClassification(ObjectClassification *classification,
						  BindStructure *bind)
     {
     if(classification != 0)
	  {
	  classification->TreeOfObjects = ReadInTreeOfObjects(classification->ID,
							      classification->Name,
							      bind);
	  }

     return(classification);
     }
 
/*F ret = WriteOutClassification(set,classid,bind)
**
**  DESCRIPTION
**    
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT WriteOutClassification(INT classid,
				  BindStructure *bind)
     {
     INT ret;
     ObjectClassification *classification;
     
     classification = FindClassification(classid,DATABASE_CLASSIFICATIONS,
					 bind);
     
     if(classification != 0)
	  ret = WriteTreeOfObjects(classification->TreeOfObjects,
			     classification->ID,
			     bind);
	  
     return(ret);
     }
/*f tree = ReadInTreeOfObjects(id,name,bind)
**
**  DESCRIPTION
**    id   - the database id
**    name - The tree name (used as keyword)
**    bind - The bind structure
**
**    From the id and name a keyword is formed and the tree
**    is read from the appropriate database.  If it is not in the
**    database, then it is initialized.
**
**  REMARKS
**
*/
static ObjectIDTreeNode *ReadInTreeOfObjects(INT id, CHAR *name,
					     BindStructure *bind)
     {
     ChemDBMaster *master;
     DbaseKeyword *key;
     DataBaseInformation *dinfo;
     ObjectIDTreeNode *tree;
     DbaseLinkedList *link;

     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,id);
     
     key = AllocateDbaseKeyword;
     CreateDbaseKeyword(key,id,name,
			(INT) strlen(name)+1,name);
     

     link = ReadGenericElement(key,dinfo);
     if(link != 0)
	  {
	  tree = AllocateObjectIDTreeNode;
	  ReadBinObjectIDTreeNode(tree,link);
	  FreeDbaseLinkedList(link);
	  Free(link);
	  }
     else
	  tree = InitializeObjectTree(id,name);
     FreeDbaseKeyword(key);
     Free(key);
     
     return(tree);
     }
 
/*f ret = WriteTreeOfObjects(tree,id,bind)
**
**  DESCRIPTION
**    tree  - The tree to write
**    id    - The id of the tree and the database into which to write
**    bind  - The bind structure
**
**    Write the tree of object descriptions into the appropriate database
**    specified by id.
**  REMARKS
**
*/
static INT WriteTreeOfObjects(ObjectIDTreeNode *tree,
			  INT id,
			  BindStructure *bind)
     {
     ChemDBMaster *master;
     DbaseKeyword *key;
     DataBaseInformation *dinfo;
     DbaseLinkedList *firstlink;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,id);
     
     key = AllocateDbaseKeyword;
     CreateDbaseKeyword(key,id,tree->Name,
			(INT) strlen(tree->Name)+1,tree->Name);

     firstlink = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(firstlink,key->ID,key->Name,
			   LINKED_SIZE,
			   0,0,0,0);
     
     WriteBinObjectIDTreeNode((VOID) tree, firstlink);
     
     ret = WriteGenericElement(firstlink,key,GDBM_REPLACE,dinfo);

     FreeDbaseLinkedList(firstlink);
     Free(firstlink);
     FreeDbaseKeyword(key);
     Free(key);
     
     return(ret);
     }

 

/*S FindObjectClass
*/
 
/*F class = FindOrCreateObjectIDClass(object,descr,tree)  . . . . . . . . .  
**
**  DESCRIPTION
**    object    - The object to find
**    descr     - The description of the tree levels
**    tree      - The tree of id descriptions
**    class     - The class corresponding to the object
**
**    This is the top level routine to find the object class (ObjectIDClass).
**
**    The level information about the object is determined and put into
**    info (DetermineObjectIDInfo).  With this information the levels of the 
**    tree are traversed until the class is found and if the tree does not extend
**    fully, it is extended (FindObjectIDClass).  
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern ObjectIDClass *FindOrCreateObjectIDClass(VOID object,
						ListOfTreeLevelDescriptions *descr,
						ObjectIDTreeNode *tree)
     {
     ObjectIDInfo *info;
     ObjectIDClass *class;
     
     info = DetermineObjectIDInfo(descr,object);
     
     class = FindObjectIDClass(tree,descr,info);
     
     return(class);
     }

 
/*f info = DetermineObjectIDInfo(descr,object)
**
**  DESCRIPTION
**     descr    - The description of the level ID's
**     object   - The object
**     info     - The list of level ID's for the object
**
**     This is a preliminary routine for searching through a ID tree. 
**
**     With each level of the ID tree is a given ID number (an integer).  
**     These numbers are defined by ListOfTreeLevelDescriptions.  This 
**     structure is looped through and the level ID's are determined for
**     the given object - LevelIDFunc is called.
**
**  REMARKS
**
*/
extern ObjectIDInfo *DetermineObjectIDInfo(ListOfTreeLevelDescriptions *descr,
					   VOID object)
     {
     INT i,*id,idnum;
     TreeLevelDescription *level;
     ObjectIDInfo *info;
     
     info = AllocateObjectIDInfo;
     CreateObjectIDInfo(info,descr->ID,descr->Name,
			descr->NumberOfLevels,0);
     
     idnum = 0;
     level = descr->Levels;
     id = info->ObjectIDs;
     LOOPi(descr->NumberOfLevels)
	  {
	  *id = (*(level->LevelIDFunc))(object);
	  if(*id > level->MaxSize)
	       *id = level->MaxSize;
	  idnum += *id * level->IDMultFactor;
	  id++;
	  level++;
	  }
     info->ID = idnum;

     return(info);
     }
 
/*f class = FindObjectIDClass(tree,descr,info)
**
**  DESCRIPTION
**    tree    - The top tree node
**    descr   - The set of level ID descriptions
**    info    - The level ID's of the object
**    class   - The class to which the object belongs
**
**    This is the top level routine for finding the class of 
**    a particular object.  This calls FindObjectIDClassLoop to traverse
**    the ID tree.  ProduceClassPath is used to extend the tree when
**    the branch for the object does not extend fully to a class.
**
**  REMARKS
**
*/
static ObjectIDClass *FindObjectIDClass(ObjectIDTreeNode *tree,
					ListOfTreeLevelDescriptions *descr,
					ObjectIDInfo *info)
     {
     ObjectIDClass *class;
     
     class = FindObjectIDClassLoop(0,descr,tree,info);
     return(class);
     }

 
/*f class = FindObjectIDClassLoop(level,descr,tree,info)
**
**  DESCRIPTION
**    level   - The current level of the tree
**    descr   - The level descriptions of the tree
**    tree    - The current node of the tree
**    info    - The ID information of the object
**
**    The ID tree is searched recursively for the class of the object.
**    The id is tested with FindObjectIDNode and if a match with the 
**    object id is found a recursive call is made.  If not found, the
**    remaining path to a class is added to the tree with ProduceClassPath.
**
**  REMARKS
**
*/
static ObjectIDClass *FindObjectIDClassLoop(INT level,
					    ListOfTreeLevelDescriptions *descr,
					    ObjectIDTreeNode *tree,
					    ObjectIDInfo *info)
     {
     ObjectIDTreeNode *subtree;
     ObjectIDClass *class;
     INT newlevel,id;
     
     if(level < descr->NumberOfLevels)
	  {
	  id = *(info->ObjectIDs + level);
	  subtree = FindObjectIDNode(tree,id);
	  if(subtree == 0)
	       class = ProduceClassPath(level,tree,info,descr);
	  else
	       {
	       newlevel = level + 1;
	       class = FindObjectIDClassLoop(newlevel,descr,subtree,info);
	       }
	  }
     else
	  class = tree->Info;
     return(class);
     }

 
/*f node = FindObjectIDNode(tree,id)
**
**  DESCRIPTION
**    Given the current node of the tree (tree), the sub
**    subtree with the given ID (id) is searched for.  If 
**    found, it is returned, otherwise, zero is returned.
**  REMARKS
**
*/
static ObjectIDTreeNode *FindObjectIDNode(ObjectIDTreeNode *tree,
					  INT id)
     {
     ObjectIDTreeNode *done,*node;
     INT count;
     
     done = 0;
     count = 0;
     node = tree->SubTrees;
     while(done == 0 && count < tree->NumberOfSubTrees)
	  {
	  if(id == node->ID)
	       done = node;
	  count++;
	  node++;
	  }
     return(done);
     }

 
/*f class = ProduceClassPath(level,tree,info,descr)
**
**  DESCRIPTION
**    This is a recursive routine to create a tree path from
**    the current node and level (tree,level) to the class definition.
**    A node is added to the current set of subtrees (AddNodeToTree) 
**    and the recursive call is made.  At the last level, a node with 
**    the class (empty of elements) is made.
**
**  REMARKS
**
*/
static ObjectIDClass *ProduceClassPath(INT level,
				       ObjectIDTreeNode *tree,
				       ObjectIDInfo *info,
				       ListOfTreeLevelDescriptions *descr)
     {
     INT id,newlevel;
     ObjectIDClass *class;
     ObjectIDTreeNode *newnode;
     
     if(level < descr->NumberOfLevels)
	  {
	  id = *(info->ObjectIDs + level);
	  newnode = AddNodeToTree(tree,id);
	  newlevel = level + 1;
	  class = ProduceClassPath(newlevel,newnode,info,descr);
	  }
     else
	  {
	  class = tree->Info = AllocateObjectIDClass;
	  CreateObjectIDClass(class,info->ID,info->Name,info,0,0);
	  }
     
     return(class);
     }

 
/*f node = AddNodeToTree(tree,id)
**
**  DESCRIPTION
**    A new node is create with the id and added to the
**    list of nodes in tree.
**
**    Only the first level of info is transfered using memcpy,
**    A vector of one greater is allocated (AllocArrayObjectIDTreeNode),
**    the original vector is copied using memcpy (i.e. just the top
**    level), the new tree is created and copied into the last element
**    of the new vector and then the old vector space is freed.
**
**    memcpy technique instead of CopyFull....
**    
**  REMARKS
**
*/
static ObjectIDTreeNode *AddNodeToTree(ObjectIDTreeNode *tree,
				       INT id)
     {
     INT newnum;
     unsigned int oldsize;
     ObjectIDTreeNode *firstsub, *newsub;
     
     newnum = tree->NumberOfSubTrees + 1;
     oldsize = ObjectIDTreeNodeSize * tree->NumberOfSubTrees;
     firstsub = AllocArrayObjectIDTreeNode(newnum);
     memcpy(firstsub,tree->SubTrees,oldsize);
     newsub = firstsub + tree->NumberOfSubTrees;
     CreateObjectIDTreeNode(newsub,id,tree->Name,
			    0,0,0);
     Free(tree->SubTrees);
     tree->SubTrees = firstsub;
     tree->NumberOfSubTrees = newnum;
     return(newsub);
     }

 
/*F
**
**  DESCRIPTION
**    
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT AddObjectToIDClass(VOID object,
			      ObjectClassification *classification,
			      BindStructure *bind)
     {
     SearchKeyInfo *keytype;
     DbaseKeyword *key;
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     ObjectIDClass *class;
     INT id;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,
				   classification->Description->Database);

     class = FindOrCreateObjectIDClass(object,
				       classification->Description,
				       classification->TreeOfObjects);

     keytype = FindKeyTypeFromID(classification->Description->KeyType,
				 dinfo);
     key = AllocateDbaseKeyword;
     (*(keytype->InsertKey))(object,key);
     id = AddIDKeyToClass(key,class);
     
     return(id);
     }

/*f id = AddKeyToClass(key,class)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern INT AddIDKeyToClass(DbaseKeyword *key, ObjectIDClass *class)
     {
     unsigned int oldsize;
     INT newnum,id;
     DbaseKeyword *newposition;
     ObjectIDClass *newclass;
     
     newnum = class->NumberOfKeys + 1;
     oldsize = class->NumberOfKeys * DbaseKeywordSize;
     
     id = class->ID + class->NumberOfKeys;

     newclass = AllocateObjectIDClass;
     CreateObjectIDClass(newclass,class->ID,class->Name,
			 class->Info,newnum,0);
     newposition = newclass->Keys + class->NumberOfKeys;
     
     if(class->Keys != 0)
	  memcpy(newclass->Keys,class->Keys,oldsize);
     memcpy(newposition,key,DbaseKeywordSize);
     newposition->ID = id;
     
     Free(class->Keys);
     class->Keys = newclass->Keys;
     newclass->Keys = 0;
     
     class->NumberOfKeys = newclass->NumberOfKeys;
     newclass->NumberOfKeys = 0;
     FreeObjectIDClass(newclass);
          
     return(id);
     }

     
