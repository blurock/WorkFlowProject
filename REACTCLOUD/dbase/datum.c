/*  FILE     datum.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**  The interface to the gdbm (Gnu Database management library).
**  For each of the routines in gdbm, there is a corresponding one
**  in this file.  The main differences are the use of this library's
**  keyword DbaseKeyword and the database information, DataBaseInformation 
**  andd the element being of type VOID.
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/ 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "basic.h"
#include "dbase.h"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static DbaseKeyword *ProduceIndexKeyword(INT id);

/*S CreateOpenClose
*/
/*F ret = CreateDataBase(info)
**
**  DESCRIPTION   
**   info: DataBaseInformation
**   ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   This creates the database on disc with the name:
**     - directory: info->Directory
**     - rootname:  info->RootName
**     - suffix:    ".dbf"
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      gdbm_create
**
**  HEADERFILE
**
*/
extern INT CreateDataBase(DataBaseInformation *info)
     {
     GDBM_FILE dbf;
     CHAR *filename;
     
     filename = ProduceFileName(info->Directory, info->FilenameRoot,"dbf");
     
     dbf = gdbm_open(filename,0,GDBM_NEWDB,0666,0);
     
     info->File = (VOID) dbf;
     
     Free(filename);
     
     if(dbf == 0)
	  return(SYSTEM_ERROR_RETURN);
     else
	  return(SYSTEM_NORMAL_RETURN);
     }
/*F ret = OpenDataBase(info)
**
**  DESCRIPTION
**   info: DataBaseInformation
**   ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   This opens the database on disc with the name:
**     - directory: info->Directory
**     - rootname:  info->RootName
**     - suffix:    ".dbf"
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      gdbm_open
**
**  HEADERFILE
**
*/
extern INT OpenDataBase(DataBaseInformation *info)
     {
     GDBM_FILE dbf;
     CHAR *filename;
     
     filename = ProduceFileName(info->Directory, info->FilenameRoot, "dbf");
     
     dbf = gdbm_open(filename,0,GDBM_WRCREAT,0666,0);
     
     info->File = (VOID) dbf;
     
     Free(filename);

     if(dbf == 0)
	  return(SYSTEM_ERROR_RETURN);
     else
	  return(SYSTEM_NORMAL_RETURN);
     }
/*F ret = CloseDataBase(info)
**
**  DESCRIPTION
**   info: DataBaseInformation
**   ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   This closes the database file: info->Info
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      gdbm_close
**
**  HEADERFILE
**
*/
extern INT CloseDataBase(DataBaseInformation *info)
     {
     gdbm_close((GDBM_FILE) info->File);

     return(SYSTEM_NORMAL_RETURN);
     }

/*S StoreFetch
*/
/*F ret = StoreElement(element,keyword,flag,info)
**
**  DESCRIPTION
**    element: The element to be stored
**    keyword: It's corresponding keyword
**    flag:    GDBM_INSERT, GDBM_REPLACE
**    info: The DataBaseInformation
**
**  The element is stored in the database using the keyword.
**  The flag determines whether the element in to be replaced or
**  not.
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
extern INT StoreElement(VOID element,
			DbaseKeyword *keyword,
			INT flag,
			DataBaseInformation *info)
     {
     DbaseLinkedList *firstlink;
     INT ret;
     
     firstlink = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(firstlink,keyword->ID,keyword->Name,
			   LINKED_SIZE,
			   0,0,0,0);
     
     (*info->WriteConversion)(element,firstlink);

     ret = WriteGenericElement(firstlink,keyword,flag,info);
     
     FreeDbaseLinkedList(firstlink);
     Free(firstlink);

     return(ret);
     }
 
/*F ret = WriteDBSearchType(id,keywords,dinfo)
**
**  DESCRIPTION
**  id:  the index id (to identify the search keys)
**  keys: The search keys to be written to the database
**  info: The DataBaseInformation
**  ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  This routine write out the SetOfSearchKeys, identified by
**  id, to the database.  The keyword is produced by ProduceIndexKeyword.
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
extern INT WriteDBSearchType(INT id,
			     SetOfSearchKeys *keys,
			     DataBaseInformation *dinfo)
     {
     DbaseKeyword *indexkey;
     DbaseLinkedList *firstlink;
     datum *key, *datset;
     INT ret;
     
     indexkey = ProduceIndexKeyword(id);
     
     firstlink = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(firstlink,indexkey->ID,indexkey->Name,
			   LINKED_SIZE,
			   0,0,0,0);
     
     WriteBinSetOfSearchKeys(keys, firstlink);
     
     
     key = AllocateDatum;
     key->dsize = indexkey->Size;
     key->dptr  = indexkey->KeyWord;
     
     datset = MakeDatumElement(firstlink);
     
     ret = gdbm_store((GDBM_FILE) dinfo->File,
		      *key,
		      *datset,
		      (int) GDBM_REPLACE);
     
     Free(datset->dptr);
     Free(datset);
     Free(indexkey);
     FreeDbaseLinkedList(firstlink);
     Free(firstlink);

     return(ret);
     }
 
/*F ret = FetchElement(element,keyword,dinfo)
**
**  DESCRIPTION
**    element: Allocated space for the element to be fetched
**    keyword: The database keyword for the element
**    dinfo: The DataBaseInformation
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      gdbm_fetch
**  HEADERFILE
**
*/
extern INT FetchElement(VOID element,
			DbaseKeyword *keyword,
			DataBaseInformation *dinfo)
     {
     datum key, datset;
     DbaseLinkedList *link;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;
     key.dsize = keyword->Size;
     key.dptr  = keyword->KeyWord;
     
     datset = gdbm_fetch((GDBM_FILE) dinfo->File,
			key);
     
     if(datset.dsize != 0)
	  {
	  link = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link,keyword->ID,keyword->Name,
				datset.dsize,
				datset.dsize,
				0,0,0);
	  memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	  (*(dinfo->ReadConversion))(element,link);
	  
	  FreeDbaseLinkedList(link);
	  Free(link);
	  }
     else
	  {
	  Error(0,"Element Not Found");
	  ret = SYSTEM_ERROR_RETURN;
	  }
     
     
     return(ret);
     }

 
/*F ret = ReadDBSearchType(id,keys,dinfo)
**
**  DESCRIPTION
**    id: The id of the SetOfSearchKeys
**    keys: The SetOfSearchKeys 
**    dinfo: The DataBaseInformation
**
**    This routine reads  in the set of search keywords for
**    this database.  The particular keywords are identified 
**    by the id.
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
extern INT ReadDBSearchType(INT id,
			    SetOfSearchKeys *keys,
			    DataBaseInformation *dinfo)
     {
     DbaseKeyword *indexkey;
     datum key, datset;
     DbaseLinkedList *link;
     CHAR *string;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;
     indexkey = ProduceIndexKeyword(id);

     key.dsize = indexkey->Size;
     key.dptr  = indexkey->KeyWord;
     
     datset = gdbm_fetch((GDBM_FILE) dinfo->File,
			key);
     
     if(datset.dsize != 0)
	  {
	  link = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link,indexkey->ID,indexkey->Name,
				datset.dsize,
				datset.dsize,
				0,0,0);
	  
	  memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	  ReadBinSetOfSearchKeys(keys,link);
	  
	  FreeDbaseLinkedList(link);
	  Free(link);
	  }
     else
	  {
	  string = AllocateString(LINELENGTH);
	  sprintf(string,"No Keys for %s\n",dinfo->Name);
	  Error(0,string);
	  Free(string);
	  ret = SYSTEM_ERROR_RETURN;
	  }
     
     return(ret);
     }

 
/*f key = ProduceIndexKeyword(id)
**
**  DESCRIPTION
**    id:  The id of the SetOfKeywords
**    key: The key to be used in reading or writing to the database
**
**    Given the id of the SetOfKeywords, the DbaseKeyword is 
**    produced.
**    
**  REMARKS
**
*/
static DbaseKeyword *ProduceIndexKeyword(INT id)
     {
     CHAR *string;
     DbaseKeyword *keyword;
     INT size;
     
     string = AllocateString(LINELENGTH);
     sprintf(string,"%s%d",DBINDEXROOTNAME,id);
     size = strlen(string) + 1;
     
     keyword = AllocateDbaseKeyword;
     CreateDbaseKeyword(keyword,id,string,
			size,string);
     Free(string);
     return(keyword);
     }
/*S SequentialAccess
*/
/*F FetchFirstElement(element,keyword,info)
**
**  DESCRIPTION
**    element: Allocated space in which to put the element
**    keyword: Allocated space in which to put the keyword
**    info:    The database information
**    ret:     SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    This puts the first element (determined by the hash codes
**    of the database routines) into element and its key into
**    keyword.  This is the initialization of going through
**    all the  database (using FetchNextElement).
**
**  REMARKS
**    It is assumed that an index is not the first element
**
**  REFERENCES
**
**  SEE ALSO
**    gdbm_fetch
**  HEADERFILE
**
*/
extern INT FetchFirstElement(VOID element,
			     DbaseKeyword *keyword,
			     DataBaseInformation *info)
     {
     datum key, datset;
     DbaseLinkedList *link;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;
     key = gdbm_firstkey((GDBM_FILE) info->File);

     if(key.dptr != 0)
	  {
	    if(strncmp(key.dptr,"DB-Index",8) == 0)
	      {
		CreateDbaseKeyword(keyword,0,0,
				   key.dsize,
				   key.dptr);
		return FetchNextElement(element,keyword,info);
	      }
	    
	  datset = gdbm_fetch((GDBM_FILE) info->File,
			      key);
	  link = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link,0,0,
				datset.dsize,
				datset.dsize,
				0,0,0);
	  memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	  (*(info->ReadConversion))(element,link);
	  
	  FreeDbaseLinkedList(link);
	  Free(link);
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;
     
     CreateDbaseKeyword(keyword,0,0,
			key.dsize,
			key.dptr);
     return(ret);
     }
 
/*F ret = FetchNextElement(element,keyword,info)
**
**  DESCRIPTION
**    element: Allocated space for the next element
**    keyword: The last keyword fetched 
**    info:     DataBaseInformation
**
**    The keyword of the last fetch (either by FetchFirstElement
**    or FetchNextElement) the next element is found (and 
**    its corresponding keyword
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**     gdbm_next
**  HEADERFILE
**
*/
extern INT FetchNextElement(VOID element,
			    DbaseKeyword *keyword,
			    DataBaseInformation *info)
     {
     datum key, newkey,datset;
     DbaseLinkedList *link;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;

     key.dsize = keyword->Size;
     key.dptr  = keyword->KeyWord;
     
     newkey = gdbm_nextkey((GDBM_FILE) info->File,
			   key);
     
     if(newkey.dptr != 0)
	  {
	  if(newkey.dsize <= strlen(DBINDEXROOTNAME) ||
	     strncmp(DBINDEXROOTNAME,newkey.dptr,strlen(DBINDEXROOTNAME)))
	       {
	       datset = gdbm_fetch((GDBM_FILE) info->File,
				   newkey);
	       
	       link = AllocateDbaseLinkedList;
	       CreateDbaseLinkedList(link,keyword->ID,keyword->Name,
				     datset.dsize,
				     datset.dsize,
				     0,0,0);
	       memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	       (*(info->ReadConversion))(element,link);
	       
	       FreeDbaseLinkedList(link);
	       Free(link);
	       FreeDbaseKeyword(keyword);
	       
	       CreateDbaseKeyword(keyword,0,0,
				  newkey.dsize,
				  newkey.dptr);
	       }
	  else
	       {
	       CreateDbaseKeyword(keyword,0,0,
				  newkey.dsize,
				  newkey.dptr);
	       ret = FetchNextElement(element,keyword,info);
	       }
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;
     return(ret);
     }

 
/*F link = ReadGenericElement(key,dinfo)
**
**  DESCRIPTION
**    key: The key
**    dinfo: The linked list structure
**    link: the link
**
**    Reads a generic element from the specified database and returns the 
**    linked list structure (DbaseLinkedList).
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
extern DbaseLinkedList *ReadGenericElement(DbaseKeyword *key,
					   DataBaseInformation *dinfo)
     {
     datum dkey, datset;
     DbaseLinkedList *link;
     
     dkey.dsize = key->Size;
     dkey.dptr  = key->KeyWord;
     
     datset = gdbm_fetch((GDBM_FILE) dinfo->File,
			dkey);
     
     if(datset.dsize != 0)
	  {
	  link = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link,key->ID,key->Name,
				datset.dsize,
				datset.dsize,
				0,0,0);
	  memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	  }
     else
	  link = 0;
     
     return(link);
     }
/*F ret = StoreGenericElement(link,key,dinfo)
**
**  DESCRIPTION
**    key: The key
**    dinfo: The linked list structure
**    link: the link
**
**    Writes a generic element to the specified database and returns the 
**    linked list structure (DbaseLinkedList).
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
extern INT WriteGenericElement(DbaseLinkedList *link,
			       DbaseKeyword *keyword,
			       INT flag,
			       DataBaseInformation *info)
     {
     datum *key, *datset;
     INT ret;
     
     key = AllocateDatum;
     key->dsize = keyword->Size;
     key->dptr  = keyword->KeyWord;
     
     datset = MakeDatumElement(link);
     
     ret = gdbm_store((GDBM_FILE) info->File,
		      *key,
		      *datset,
		      (int) flag);
     
     Free(datset->dptr);
     Free(datset);
     Free(key);

     return(ret);
     }

