/*  FILE     dbase.h
**  PACKAGE  dbase
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**
**  REFERENCES
**
**  OVERVIEW
**    This is a set of routines built on the gdbm library of GNU.
**    Each database has a DataBaseInformation structure with all
**    the essential information.  The routines within this package 
**    use this information to store and retrieve the elements.
**
**    The basis of the creating a database element is the set
**    of WriteBin and ReadBin routine automatically created
**    with a structure.
**
**    Associated with each database is a set of search keys
**    which allow additional keyword access on top of those
**    actually used by the database routines.
**
**  IMPLEMENTATION
**        The implementation 
**
**
**  COPYRIGHT (C) 1995 REACTION Project / Edward S. Blurock, RISC Linz
*/
 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "gdbm.h"
#include "dbase/dbasestr.h" 

/*V  . . . GLOBAL VARIABLES  . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#define BIND_DBASE  2000
#define AllocateDatum  Malloc(sizeof(datum))

#define DBINDEXROOTNAME        "DB-Index-"
#define DBINDEXROOTNAMESIZE    9

/*P  PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . .  dbasemaster.c 
*/
extern DataBaseInformation *GetDataBaseInfoFromID(DbaseMaster *master,
						  INT id);
/*P  PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . . . . linked.c 
*/
extern INT InitializeReadLinkedList(DbaseLinkedList *link);
extern datum *MakeDatumElement(DbaseLinkedList *link);
extern datum *CreateDatum(datum *element, INT size);
extern INT DbaseLinkedListMemory(DbaseLinkedList *link);

/*P  PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . . . .  datum.c 
*/
extern INT CreateDataBase(DataBaseInformation *info);
extern INT OpenDataBase(DataBaseInformation *info);
extern INT CloseDataBase(DataBaseInformation *info);
extern INT StoreElement(VOID element,
			DbaseKeyword *keyword,
			INT flag,
			DataBaseInformation *info);
extern INT FetchElement(VOID element,
			DbaseKeyword *keyword,
			DataBaseInformation *info);
extern INT FetchFirstElement(VOID element,
			     DbaseKeyword *keyword,
			     DataBaseInformation *info);
extern INT FetchNextElement(VOID element,
			    DbaseKeyword *keyword,
			    DataBaseInformation *info);
extern INT WriteDBSearchType(INT id,
			     SetOfSearchKeys *keys,
			     DataBaseInformation *dinfo);
extern INT ReadDBSearchType(INT id,
			    SetOfSearchKeys *keys,
			    DataBaseInformation *dinfo);
extern DbaseLinkedList *ReadGenericElement(DbaseKeyword *key,
					   DataBaseInformation *dinfo);

/*P  PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . . . . . dbkey.c
*/
extern INT ResetSearchKeys(DataBaseInformation *dinfo);
extern INT ProduceDataBaseSearchKeys(DataBaseInformation *dinfo);
extern void InsertSearchKeys(VOID element,
			     DbaseKeyword *dbkey,
			     SetOfSearchKeyTypes *keys);
extern void InsertSingleSearchKey(VOID element,
				  DbaseKeyword *dbkey,
				  SearchKeyInfo *keytype);
extern INT WriteAllDBSearchKeys(DataBaseInformation *dinfo);
extern INT DeleteKeyFromMemory(INT id, DataBaseInformation *dinfo);
extern INT ReadKeyIntoMemory(INT id, DataBaseInformation *dinfo);
extern INT SearchKeyElement(INT id, 
			    VOID element,
			    DbaseKeyword *keyword,
			    DataBaseInformation *dinfo);
extern SearchKeyInfo *FindKeyTypeFromID(INT id, DataBaseInformation *dbase);
extern INT WriteGenericElement(DbaseLinkedList *link,
			       DbaseKeyword *keyword,
			       INT flag,
			       DataBaseInformation *info);
extern void PrintDbaseKeyword(DbaseKeyword *key);
