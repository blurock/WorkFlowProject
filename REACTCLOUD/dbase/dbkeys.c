/*  FILE     dbkeys.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    These are all the  routines dealing with the search
**    keys for the database (outside of reading and writing
**    the keys to the database.
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
static void IncreaseKeyAllocation(SearchKeyInfo *keyinfo);
static DbaseKeyword *GetCorrespondingDBKey(DbaseKeyword *keyword, SearchKeyInfo
				       *keyinfo);
static INT DBKeyError(CHAR *string);


/*F PrintDbaseKeyword(dbase)
**
**  DESCRIPTION
**
**  REMARKS
**
 */
extern void PrintPrettyDbaseKeyword(DbaseKeyword *key)
{
  int i;
  char *c;

  c = key->KeyWord;
  printf("(%10d,%s): ",key->ID,key->Name);
  for(i=0;i<key->Size;i++)
    printf("%d ",*c++);
  printf("\n");
}

/*S SearchKeyInitialization
*/
/*F ret = ResetSearchKeys(dinfo)
**
**  DESCRIPTION
**    dinfo: DATABASEINFORMATION
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    This routine resets the Search key information in the
**    DataBaseInformation structure by freeing up the SetOfSearchKey
**    structures for each of the search key types if they are
**    present.  Space is then allocated for the initial number of
**    keys (i.e. preparing for the filling in routines).
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
extern INT ResetSearchKeys(DataBaseInformation *dinfo)
     {
     SearchKeyInfo *key;
     SetOfSearchKeyTypes *keys;
     INT ret,i;
     
     ret = SYSTEM_NORMAL_RETURN;     
     keys = dinfo->Keys;
     if(keys != 0)
	  {
	  key = keys->KeyTypes;
	  LOOPi(keys->NumberOfKeyTypes)
	       {
	       if(key->Keys != 0)
		    {
		    FreeSetOfSearchKeys(key->Keys);
		    }
	       else
		    key->Keys = AllocateSetOfSearchKeys;
	       
	       CreateSetOfSearchKeys(key->Keys, i,key->Name,
				     key->InitialAllocation,
				     key->InitialAllocation,
				     0);
	       key->Keys->NumberOfKeys = 0;
	       key++;
	       }
	  }
     else
	  ret = DBKeyError("No Search Keys to Reset");
     
     return(ret);
     }

 

/*S ProduceSearchKey
*/
/*F ret = ProduceDataBaseSearchKeys(dinfo)
**
**  DESCRIPTION
**    dinfo: DATABASEINFORMATION
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  Each of the elements of the database are accessed and the routine 
**  InsertSearchKeys is called to produce all keywords for the elements.
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
extern INT ProduceDataBaseSearchKeys(DataBaseInformation *dinfo)
     {
     DbaseKeyword *keyword;
     VOID element;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;
     if(dinfo->Keys != 0)
	  {
	  keyword = AllocateDbaseKeyword;
	  element = (*(dinfo->AllocateElement))();
	  
	  ret = FetchFirstElement(element,keyword,dinfo);
	  while(ret == SYSTEM_NORMAL_RETURN)
	       {
	       if(keyword->Size <= DBINDEXROOTNAMESIZE &&
		  keyword->Size != 0 &&
		  (keyword->Size < DBINDEXROOTNAMESIZE ||
		  strncmp(keyword->KeyWord,DBINDEXROOTNAME,DBINDEXROOTNAMESIZE) != 0)
		  )
		    {
		    InsertSearchKeys(element,keyword,dinfo->Keys);
		    (*(dinfo->FreeElement))(element);
		    }
	       ret = FetchNextElement(element,keyword,dinfo);
	       }
	  Free(keyword);
	  Free(element);
	  }
     else
	  ret = DBKeyError("No Search Keys to Produce");

     return(ret);
     }

 
/*F InsertSearchKeys(element,dbkey,keys)
**
**  DESCRIPTION
**      element: The database element
**      dbkey: The keyword for the database routines
**      keys: The set of search key types
**
**  The database key is paired with all the search key pairs by a simple
**  loop through all the key types and calling InsertSingleSearchKey.
**
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
extern void InsertSearchKeys(VOID element,
			     DbaseKeyword *dbkey,
			     SetOfSearchKeyTypes *keys)
     {
     SearchKeyInfo *keytype;
     INT i;
     DbaseKeyword *ret,*newkey;

     /*     printf("InsertSearchKeys:\n");
     PrintPrettyDbaseKeyword(dbkey);
     */
     newkey = AllocateDbaseKeyword;
     keytype = keys->KeyTypes;
     LOOPi(keys->NumberOfKeyTypes)
	  {
	    (*(keytype->InsertKey))(element,newkey);
	    /*PrintPrettyDbaseKeyword(newkey);*/
	    ret = GetCorrespondingDBKey(dbkey,keytype);
	  if(ret == 0)
	    {
	      InsertSingleSearchKey(element,dbkey,keytype);
	    }
	  FreeDbaseKeyword(newkey);
	  keytype++;
	  }
     Free(newkey);
     }

 
/*F InsertSingleKey(element,dbkey,keytype)
**
**  DESCRIPTION
**    element: The database element
**    dbkey: The database key
**    dinfo: The search key information
**
**  The SingleSearchKey element is created with database key.  The
**  routine InsertKey from the SearchKeyInfo structure is used to insert
**  the search key into the SingleSearchKey structure.  If there is not
**  enough space allocated for the search keys, IncreaseKeyAllocation is
**  called to increase it.
**
**    
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
** */
extern void InsertSingleSearchKey(VOID element,
				  DbaseKeyword *dbkey,
				  SearchKeyInfo *keytype)
     {
     SetOfSearchKeys *keyset;
     SingleSearchKey *key;
     
     if(keytype->Keys->NumberOfKeys >= keytype->Keys->NumberOfAllocatedKeys)
	  IncreaseKeyAllocation(keytype);
     
     keyset = keytype->Keys;
     key = keyset->Keys + keyset->NumberOfKeys;
     CreateSingleSearchKey(key,keyset->NumberOfKeys,NULL,
			   dbkey,0);
     key->Search = AllocateDbaseKeyword;
     (*(keytype->InsertKey))(element,key->Search);
     keyset->NumberOfKeys += 1;
     }
 
/*f IncreaseKeyAllocation(keyinfo)
**
**  DESCRIPTION
       keyinfo: The search key information

    The number of keys in SetOfSearchKeys is increase by
    AllocationIncrement in the SearchKeyInfo structure
**    
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
** */
static void IncreaseKeyAllocation(SearchKeyInfo *keyinfo)
     {
     SetOfSearchKeys *keyset, *newkeys;
     INT newallocation;
     unsigned int memsize;
     
     keyset = keyinfo->Keys;
     memsize = SingleSearchKeySize * keyset->NumberOfKeys;
     
     newallocation = keyinfo->Keys->NumberOfKeys + keyinfo->AllocationIncrement;
     
     newkeys = AllocateSetOfSearchKeys;
     CreateSetOfSearchKeys(newkeys,keyset->ID,keyset->Name,
		      newallocation,newallocation,
		      0);
     newkeys->NumberOfKeys = keyset->NumberOfKeys;
     
     memcpy(newkeys->Keys,keyset->Keys,memsize);
     
     Free(keyset->Keys);
     Free(keyset->Name);
     Free(keyset);
     
     keyinfo->Keys = newkeys;
     }

 

/*S WriteReadSearchKeys
*/
/*F ret = WriteAllDBSearchKeys(dinfo)
**
**  DESCRIPTION
**    dinfo: DATABASEINFORMATION
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  The set of key types are looped through and written out to 
**  the database file using WriteDBSearchType.
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
extern INT WriteAllDBSearchKeys(DataBaseInformation *dinfo)
     {
     SearchKeyInfo *keytype;
     INT ret,i;
     
     ret = SYSTEM_NORMAL_RETURN;
     if(dinfo->Keys != 0)
	  {
	  keytype = dinfo->Keys->KeyTypes;
	  LOOPi(dinfo->Keys->NumberOfKeyTypes)
	       {
	       WriteDBSearchType(keytype->ID,keytype->Keys,dinfo);
	       keytype++;
	       }
	  }
     else
	  ret = DBKeyError("No Search Keys to Write");

     return(ret);
     }

 
/*F ret = ReadKeyIntoMemory(dinfo)
**
**  DESCRIPTION
**    dinfo: DATABASEINFORMATION
**    id:  The identification of the search key
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  The set of keys specified by the id is read into key structure.
**  The new keys are added to the current keys.
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
extern INT ReadKeyIntoMemory(INT id, DataBaseInformation *dinfo)
     {
     SearchKeyInfo *keytype;
     SetOfSearchKeys *keys,*newkeys;
     SingleSearchKey *key,*newkey;
     INT ret,i;
     
     ret = SYSTEM_NORMAL_RETURN;
     
     keytype = FindKeyTypeFromID(id,dinfo);
     if(keytype != 0)
	  {
	  newkeys = AllocateSetOfSearchKeys;
	  ret = ReadDBSearchType(id,newkeys,dinfo);
	  if(ret == SYSTEM_NORMAL_RETURN)
	       {
	       keys = keytype->Keys;
	       newkey = newkeys->Keys;
	       LOOPi(newkeys->NumberOfKeys)
		    {
		    if(keys->NumberOfAllocatedKeys - keys->NumberOfKeys <= 0)
			 {
			 IncreaseKeyAllocation(keytype);
			 keys = keytype->Keys;
			 }
		    
		    key = keys->Keys + keys->NumberOfKeys;
		    CopyFullSingleSearchKey(key,newkey);
		    keys->NumberOfKeys += 1;
		    newkey++;
		    }

	       FreeSetOfSearchKeys(newkeys);
	       }
	  Free(newkeys);
	  }
     
     return(ret);
     }
 
/*F ret = DeleteKeyFromMemory(dinfo)
**
**  DESCRIPTION
**    dinfo: DATABASEINFORMATION
**    id: The identification of the search key
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  This deletes the SetOfSearchKeys from the given key type specified by the id
**  number.  The purpose is to be able to limit the number of keys in memory.
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
extern INT DeleteKeyFromMemory(INT id, DataBaseInformation *dinfo)
     {
     SearchKeyInfo *keytype;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;
     
     keytype = FindKeyTypeFromID(id,dinfo);
     if(keytype != 0)
	  {
	  if(keytype->Keys != 0)
	       {
	       FreeSetOfSearchKeys(keytype->Keys);
	       Free(keytype->Keys);
	       keytype->Keys = 0;
	       }
	  else
	       ret = DBKeyError("No Search Keys to Delete from memory");
	  }
     else
	  ret = DBKeyError("No Search Keys matched ID");

     return(ret);
     }
 

/*S SearchWithKey
*/
/*F ret = SearchKeyElement(id,element,keyword,dinfo)
**
**  DESCRIPTION
**    id: The identification of the keytype
**    element: The element to be read in (allocated space)
**    keyword: The keyword for the element
**    dinfo: DataBaseInformation *
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Given the id of the search type (-1 means the database key) and the
**    DbaseKeyword key, find the element in the database.
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
extern INT SearchKeyElement(INT id, 
			    VOID element,
			    DbaseKeyword *keyword,
			    DataBaseInformation *dinfo)
     {
     SearchKeyInfo *keytype;
     INT ret;
     DbaseKeyword *dbkey;

     if(id == -1)
	  ret = FetchElement(element,keyword,dinfo);
     else
	  {
	  keytype = FindKeyTypeFromID(id,dinfo);
	  if(keytype != 0)
	       {
	       dbkey = GetCorrespondingDBKey(keyword,keytype);
	       if(dbkey != 0)
		    {
		    ret = FetchElement(element,dbkey,dinfo);
		    }
	       else
		    ret = DBKeyError("Search Key Element Not Found");
	       }
	  else
	       ret = DBKeyError("No Search Key Matches id");
	  }
     
     return(ret);
     }

 

/*f dbkey = GetCorrespondingDBKey(keyword,keyiinfo)
**
**  DESCRIPTION
**    keyword: The search keyword to match
**    keyinffo: The keyword information
**    dbkey: The database keyword (0 if not found)
**
**  Within the set of keywords, find a matching keyword and return the
**  database keyword.
**
**    
**  REMARKS
**
*/
static DbaseKeyword *GetCorrespondingDBKey(DbaseKeyword *keyword, SearchKeyInfo *keyinfo)
     {
     SetOfSearchKeys *keyset;
     INT count,ret,kcomp,i;
     SingleSearchKey *key;
     DbaseKeyword *done;
     char *k1,*k2;

     keyset = keyinfo->Keys;

     if(keyset != 0)
	  {
	  count = 0;
	  done = 0;
	  key = keyset->Keys;
	  while(done == 0 && count < keyset->NumberOfKeys)
	       {
	       if(key->Search->Size == keyword->Size)
		 {
		   k1 = key->Search->KeyWord;
		   k2 = keyword->KeyWord;
		   kcomp = 0;
		   LOOPi(keyword->Size)
		     {
		       if(*k1 != *k2)
			 kcomp = 1;
		       k1++;
		       k2++;
		     }
		   /*		   kcomp = strncmp(key->Search->KeyWord,keyword->KeyWord,
				    keyword->Size);*/
		   if(kcomp == 0)
		     done = key->DBKey;
		 }
	       count++;
	       key++;
	       }
	  }
     else
	  {
	  ret = DBKeyError("Keys not in memory");
	  done = 0;
	  }
     return(done);
     }

 
/*F keyinfo = FindKeyTypeFromID(id,dinfo)
**
**  DESCRIPTION
**    id: The identification of the search key
**    dinfo: DataBaseInformation
**    keyinfo: The search key info (not copied, 0 if not found)
**
**  This routine searches through the key types and finds the one
**  matching the id.
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
** */
extern SearchKeyInfo *FindKeyTypeFromID(INT id, DataBaseInformation *dinfo)
     {
     SearchKeyInfo *done, *keytypes;
     INT count;
     
     if(dinfo->Keys != 0)
	  {
	  keytypes = dinfo->Keys->KeyTypes;
	  done = 0;
	  count = 0;
	  while(done == 0 && count < dinfo->Keys->NumberOfKeyTypes)
	       {
	       if(keytypes->ID == id)
		    done = keytypes;
	       keytypes++;
	       count++;
	       }
	  }
     else
	  done = 0;
     
     return(done);
     }

 

/*S SearchKeyUtility
*/
/*f ret = DBKeyError(string)
**
**  DESCRIPTION
**    string: The error string to printout
**    ret: SYSTEM_ERROR_RETURN
**
**    Internal routine to print out error messages for search keys
**    
**  REMARKS
**
*/
static INT DBKeyError(CHAR *string)
     {
     printf("%s\n",string);

     return(SYSTEM_ERROR_RETURN);
     }
