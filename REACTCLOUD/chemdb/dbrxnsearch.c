/*  FILE     dbrxnserch.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Database routines for the reactions and reaction patterns.
**    There is not difference between the two, both are ReactionSet
**    routines.
**
**    This set of routines has to do with the external (i.e.
**    the keys of the user, not the single one of the database)
**    keys.
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
#include "molprops.h"
#include "dbase.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void InsertRxnNameKey(VOID element,DbaseKeyword *key);
static void InsertRxnIDKey(VOID element,DbaseKeyword *key);

/*S DefineRectionDatabase
*/
/*F  ret = DBResetReactionSearchKeys(bind)
**
**  DESCRIPTION
**    bind: Bind Structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN 
**
**   Main menu routine to reset the search reaction key
**   structures to the standard set.  The existing keys are erased.  This
**   routine calls DBResetRxnSetSearchKeys.
**
** REMARKS
**    A Menu Function
**
** SEE ALSO
**
** HEADERFILE
**      chemdatabase.h, comlib.h
*/
extern INT DBResetReactionSearchKeys(BindStructure *bind)
{
  INT ret;
  
  ret = DBResetRxnSetSearchKeys(bind,REACTION_DATABASE);
  return(ret);
}
/*F  ret = DBResetRxnPatternSearchKeys(bind)
**
**  DESCRIPTION
**    bind: Bind Structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN 
**
**   Main menu routine to reset the search reaction pattern key
**   structures to the standard set.  The existing keys are erased.  This
**   routine calls DBResetRxnSetSearchKeys.
**
** REMARKS
**    A Menu Function
**
** SEE ALSO
**
** HEADERFILE
*/
extern INT DBResetRxnPatternSearchKeys(BindStructure *bind)
{
  INT ret;
  
  ret = DBResetRxnSetSearchKeys(bind,PATTERN_DATABASE);
  return(ret);
}
 
/*F  ret = DBResetRxnSetSearchKeys(bind,dbflag)
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   Depending on the database flag (dbflag) the reaction or reaction
**   patterns are initialized.  This means the SearchKeyType structure is
**   produced and the SearchKeyInfo structures are filled in with:
**     - DB_ID_SEARCH   - Search with ID
**     - DB_NAME_SEARCH - Search with Name
**
**  REMARKS
**
**  The only distinction between reaction and reaction patterns is the
**  DatabaseInfo structure.
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT DBResetRxnSetSearchKeys(BindStructure *bind, INT dbflag)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     SetOfSearchKeyTypes *keytypes;
     SearchKeyInfo *keyinfo;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);

     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);

     keytypes = dinfo->Keys = AllocateSetOfSearchKeyTypes;
     
     CreateSetOfSearchKeyTypes(keytypes,0,0,
			       5,2,0);
     keytypes->NumberOfKeyTypes = 2;
     
     keyinfo = keytypes->KeyTypes;
     CreateSearchKeyInfo(keyinfo,DB_ID_SEARCH,"Search by ID",
			 20,10,0,InsertRxnIDKey);
     
     keyinfo = keytypes->KeyTypes + 1;
     CreateSearchKeyInfo(keyinfo,DB_NAME_SEARCH,"Search by Name",
			 20,10,0,InsertRxnNameKey);
     
     ResetSearchKeys(dinfo);
     
     return(SYSTEM_NORMAL_RETURN);
   }
/*f InsertRxnNameKey(element,key)
**
**  DESCRIPTION
**   element:   The ReactionInfo structure (VOID because of general
**              prototype)
**     key: The keyword to insert the information
**    
**   These are the routines to insert the Name into the database
**   keys.  These are used by both reactions and reaction patterns.  
**
**  REMARKS
**   These
**   routines are the InsertKey routines of the databases.  These routines
**   call ProduceRxnNameKey and ProduceRxnIDKey routines, respectively.
*/
static void InsertRxnNameKey(VOID element,DbaseKeyword *key)
     {
     ReactionInfo *rxn;
     
     rxn = (ReactionInfo *) element;
     ProduceRxnNameKey(rxn->Name,key);
     }
/*f InsertRxnIDKey(element,key)
**
**  DESCRIPTION
**   element:   The ReactionInfo structure (VOID because of general
**              prototype)
**       key: The keyword to insert the information
**    
**   These are the routines to insert the ID into the database
**   keys.  These are used by both reactions and reaction patterns.  
**
**  REMARKS
**   These
**   routines are the InsertKey routines of the databases.  These routines
**   call ProduceRxnNameKey and ProduceRxnIDKey routines, respectively.
**
*/
static void InsertRxnIDKey(VOID element,DbaseKeyword *key)
     {
     ReactionInfo *rxn;
     
     rxn = (ReactionInfo *) element;
     ProduceRxnIDKey(rxn->ID,key);
   }
/*F ProduceRxnNameKey(name,key) . . . . . . . . . . . . . . . . . . does work
**
**  DESCRIPTION
**   name: The name to insert
**   key: The key to insert the name
**
**   The external routine to insert the name or ID of the ReactionInfo
**   structure into the DbaseKeyword structure.
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
extern void ProduceRxnNameKey(CHAR *name,DbaseKeyword *key)
     {
     key->ID = 0;
     key->Name = CopyString(name);

     key->Size = strlen(name) + 1;
     key->KeyWord = (VOID) AllocateString(key->Size);
     memcpy((char *) key->KeyWord, name, (unsigned int) key->Size);
   }
    
/*F ProduceRxnIDKey(id,key) . . . . . . . . . . . . . . . . . . . . does work
**
**  DESCRIPTION
**   id: The id to insert
**   key: The key into which to insert the id
**
**   The external routine to insert the name or ID of the ReactionInfo
**   structure into the DbaseKeyword structure.
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
extern void ProduceRxnIDKey(INT id, DbaseKeyword *key)
     {
     key->ID = id;
     key->Name = 0;

     key->Size = INTSize;
     key->KeyWord = (VOID) AllocateINT;
     memcpy((char *) key->KeyWord, (char *) &(id), (unsigned int) key->Size);
   }
    

/*S RxnFillKeys 
**    The keys have been set up by the reset database commands and this routine
**    fills in the keys for the whole set of databases.  The main call is to
**    ProduceDataBaseSearchKeys
*/
/*F  ret = DBProduceReactionSearchKeys(bind) bind: fill in keys for Reactions
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Main routine to produce the set of keys for the reactions.  This
**    routine calls DBProduceRxnSetSearchKeys to do the work.
**
**  REMARKS
**     A Menu function:
**
**  SEE ALSO
**      Main Local Function: DBProduceRxnSetSearchKeys
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
extern INT DBProduceReactionSearchKeys(BindStructure *bind)
     {
     INT ret;

     ret = DBProduceRxnSetSearchKeys(bind,REACTION_DATABASE);
     return(ret);
     }
 
/*F  ret = DBProduceRxnPatternSearchKeys(bind)  bind: fill in keys for Subs
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Main routine to produce the set of keys for the reaction patterns.  This
**    routine calls DBProduceRxnSetSearchKeys to do the work.
**
**  REMARKS
**     A Menu function
**
**  SEE ALSO
**
**  HEADERFILE
*/
extern INT DBProduceRxnPatternSearchKeys(BindStructure *bind)
     {
     INT ret;

     ret = DBProduceRxnSetSearchKeys(bind,PATTERN_DATABASE);
     return(ret);
     }
/*F  ret = DBProduceRxnSetSearchKeys(bind,dbflag)
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag: The database info flag (GetDataBaseInfoFromID is used to
**            fetch the DatabaseInfo structure 
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   Once the search keys have been formed (DBResetRxnSetSearchKeys),
**   the actual keys can be be produced (call to general
**   ProduceDataBaseSearchKeys).  All the database elements are fetched
**   and the keywords are produced.
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: ProduceDataBaseSearchKeys
**
**  HEADERFILE
**
*/
extern INT DBProduceRxnSetSearchKeys(BindStructure *bind, INT dbflag)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;

     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     ProduceDataBaseSearchKeys(dinfo);
     
     return(SYSTEM_NORMAL_RETURN);
     } 



/*S RxnReadWriteCurrentKeys
*/
 
/*F  ret = InitializeRxnSetDBKeys(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT InitializeRxnSetDBKeys(BindStructure *bind)
     {
     
     DBResetReactionSearchKeys(bind);
     DBResetRxnPatternSearchKeys(bind);
     ReadReactionDBKeys(bind);
     ReadRxnPatternDBKeys(bind);
     return(SYSTEM_NORMAL_RETURN);
     }
/*F  ret = WriteReactionDBKeys(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT WriteReactionDBKeys(BindStructure *bind)
     {
     INT ret;
     
     ret = WriteCurrentRxnSetKeys(bind,REACTION_DATABASE);
     
     return(ret);
     }
/*F  ret = WriteRxnPatternDBKeys(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT WriteRxnPatternDBKeys(BindStructure *bind)
     {
     INT ret;
     
     ret = WriteCurrentRxnSetKeys(bind,PATTERN_DATABASE);
     
     return(ret);
     }
/*F  ret = ReadReactionDBKeys(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT ReadReactionDBKeys(BindStructure *bind)
     {
     INT ret;
     
     ret = ReadCurrentRxnSetKeys(bind,REACTION_DATABASE);
     
     return(ret);
     }
/*F  ret = ReadRxnPatternDBKeys(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT ReadRxnPatternDBKeys(BindStructure *bind)
     {
     INT ret;
     
     ret = ReadCurrentRxnSetKeys(bind,PATTERN_DATABASE);
     
     return(ret);
     }


/*F  ret = WriteCurrentRxnSetKeys(bind,dbflag)
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag: the database id
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Using WriteAllDBSearchKeys the current set of keys are written
**    to the database.
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT WriteCurrentRxnSetKeys(BindStructure *bind, INT dbflag)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     ret = WriteAllDBSearchKeys(dinfo);
     
     return(ret);
     }
 
/*F  ret = ReadCurrentRxnSetKeys(bind,dbflag)
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag: the database id
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Using WriteAllDBSearchKeys  the keys DB_ID_SEARCH  DB_NAME_SEARCH are
**    read from the database. 
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
extern INT ReadCurrentRxnSetKeys(BindStructure *bind, INT dbflag)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     ret = ReadKeyIntoMemory(DB_ID_SEARCH,dinfo);
     if(ret == SYSTEM_NORMAL_RETURN)
	  ReadKeyIntoMemory(DB_NAME_SEARCH,dinfo);
     
     return(ret);
     }

     

/*S RxnExtractCurrent
**    A the reaction or reaction pattern list file is opened and the names
**    (identified by name or id) are listed.  They
**    are extracted from the database and put into a newly
**    formed ReactionsInfo structure to be the new current
**    reactions.  The file with the names is formed with:
**    - Directory: DBDataDirectory
**    - RootName: DBDataRxnRoot
**    - Suffix: .rxn (REACTION_FILE_LIST_SUFFIX)
**
*/
/*F  ret = DBReadListOfReactions(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   These read a list of reactions ids or names to the current set of
**   reactions.
**
**  REMARKS
**     A Menu function
**
**  SEE ALSO
**      Main Local Function: DBReadListRxnSetFromKeys
**
**  HEADERFILE
**
*/
extern INT DBReadListOfReactions(BindStructure *bind)
     {
     INT ret;

     ret = DBReadListRxnSetFromKeys(bind,REACTION_DATABASE);
     return(ret);
   }
 
/*F  ret = DBReadListOfRxnPatterns(bind)  . . . bind: put list into current
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   These read a list of reaction pattern names or ids  to the current set of
**   reaction patterns.
**
**  REMARKS
**     A Menu function
**
**  SEE ALSO
**      Main Local Function: DBReadListRxnSetbFromKeys
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
extern INT DBReadListOfRxnPatterns(BindStructure *bind)
     {
     INT ret;

     ret = DBReadListRxnSetFromKeys(bind,PATTERN_DATABASE);
     return(ret);
   }
/*F  ret = DBReadListRxnSetFromKeys(bind,dbflag)  . extern: into current list
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag: The database info flag (GetDataBaseInfoFromID is used to
**            fetch the DatabaseInfo structure 
**    
**    
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    A the reaction set list file is opened and the names
**    (identified by name or id) are listed.  The reactions
**    are extracted from the database and put into a newly
**    formed ReactionSet structure to be the new current
**    reactions.
**
**  REMARKS
**       Filename derived from menu constants:
**                   DBDataDirectory, DBDataRxnRoot
**        and the define:
**                   REACTION_FILE_LIST_SUFFIX
**       
**  SEE ALSO
**      Main Local Functions: 
**                  DBFindRxnSetFromString
**                  IncrementReactionSet
**
**  HEADERFILE
**
*/
extern INT DBReadListRxnSetFromKeys(BindStructure *bind, INT dbflag)
     {
     ReadInReactionSet *asciirxnset;
     ReactionSet *rxnset,*newrxns;

     rxnset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     asciirxnset = ReadInReactionSetFromFile(bind,';');

     newrxns = DetermineReactionSetFromASCII(asciirxnset,dbflag,bind);

     ReplaceBindReactionSet(newrxns,bind);
     
     return(SYSTEM_NORMAL_RETURN);
     }

 
/*F rxnset = DetermineReactionSetFromASCII(asciirxnset,dbflag,bind)
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
extern ReactionSet *DetermineReactionSetFromASCII(ReadInReactionSet *asciirxnset,
						     INT dbflag,
						     BindStructure *bind)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     ReactionSet *rxnset;
     ReactionInfo *rxninfo;
     ReadInReaction *asciirxn;
     INT i,ret;

     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     rxnset = AllocateReactionSet;
     CreateReactionSet(rxnset,asciirxnset->ID,asciirxnset->Name,
		       asciirxnset->NumberOfReactions,0,0);

     rxnset->PropertyTypes = 
	  InitializeReactionPropertyTypes(rxnset->ID,rxnset->Name);

     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     rxninfo = rxnset->Reactions;
     asciirxn = asciirxnset->Reactions;
     LOOPi(asciirxnset->NumberOfReactions)
	  {
	  ret = DBFindRxnSetFromString(asciirxn->Name,rxninfo,dinfo);
	  if(ret == SYSTEM_NORMAL_RETURN)
	       {
	       printf("ID = %5d Name = %s\n",rxninfo->ID, rxninfo->Name);
	       }
	  else
	    {
	      printf("ERROR: Reaction Pattern Not Found: '%s'\n",asciirxn->Name);
	      rxninfo->ID = -1;
	    }
	  
	  
	  rxninfo++;
	  asciirxn++;
	  }
     return(rxnset);
     }
 
/*F asciirxnset = ReadInReactionSetFromFilebind,delim)
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
extern ReadInReactionSet *ReadInReactionSetFromFile(BindStructure *bind,
						    INT delim)
     {
     CommandMaster *commandmaster;
     FILE *file;
     ReadInReactionSet *rxnset;
     ReadInReaction *rxn;
     CHAR delimitor,*string,*line,*name;

     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     
     delimitor = (CHAR) delim;
     file = OpenReadFileFromCurrent("DBDataDirectory","DBDataRxnRoot",
				    REACTION_FILE_LIST_SUFFIX,
				    RECOVER,"List of Reaction",
				    commandmaster);
     
     if(file != 0)
	  {
	  string = AllocateString(LINELENGTH);

	  line = NextNonBlankLine(file,string);
	  EliminateBlanks(line);
	  name = CopyString(line);	  

	  rxnset = AllocateReadInReactionSet;
	  CreateReadInReactionSet(rxnset,0,name,MAX_CURRENT_REACTIONS,0);
	  rxnset->NumberOfReactions = 0;
	  line = NextNonBlankLine(file,string);
	  rxn = rxnset->Reactions;
	  while(line != 0 &&  rxnset->NumberOfReactions < MAX_CURRENT_REACTIONS)
	       {
	       CreateReadInReaction(rxn,rxnset->NumberOfReactions,line);
	       rxn++;
	       rxnset->NumberOfReactions +=1;
	       line = NextNonBlankLine(file,string);
	       }
	  Free(name);
	  Free(line);
	  fclose(file);
	  }
     else
       {
	 printf("Reaction List File not found\n");
       }

     printf("End:    Read in Reaction List\n");
     return(rxnset);
     }

/*F  ret = IncrementReactionSet(rxnset) . . . .  extern: reallocate rxnecules
**
**  DESCRIPTION
**    rxnset: The ReactionSet structure to be expanded
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  The ReactionSet structure is expanded by the ReactionIncrement (to allow more
**  current reactions to be stored.
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
 
extern INT IncrementReactionSet(ReactionSet *rxnset)
     {
/*     INT incrxns,numrxns;
     unsigned int memsize;
     void *newset;

     numrxns = rxnset->NumberOfReactionsAllocated + rxnset->ReactionIncrement;
     
     memsize = ReactionInfoSize * rxnset->NumberOfReactions;
     
     rxnset->NumberOfReactionsAllocated = numrxns;

     newset = Malloc(memsize);
     memcpy(newset, (void *) rxnset->Reactions, memsize);

     Free(rxnset->Reactions);
     rxnset->Reactions = newset;
*/     
     return(SYSTEM_NORMAL_RETURN);
     }
 
  
/*F  ret = DBFindRxnSetFromString(name,rxn,dinfo)  . . extern: read database
**
**  DESCRIPTION
**    name: The string name of the 
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      ProduceRxnNameKey, ProduceRxnIDKey, SearchKeyElement
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/

extern INT DBFindRxnSetFromString(CHAR *name, ReactionInfo *rxn, 
				  DataBaseInformation *dinfo)
     {
     DbaseKeyword *key;
     INT id,ret;
     
     key = AllocateDbaseKeyword;

     if(*name >= '0' && *name <= '9')
	  {
	  sscanf(name,"%d",&id);
	  ProduceRxnIDKey(id,key);
	  ret = SearchKeyElement(DB_ID_SEARCH,rxn,key,dinfo);
	  }
     else
	  {
	  ProduceRxnNameKey(name,key);
	  ret = SearchKeyElement(DB_NAME_SEARCH,rxn,key,dinfo);
	  }
     
     FreeDbaseKeyword(key);
     Free(key);
     
     return(ret);
     }

     
	  
	



