/*  FILE   rxndb.c  
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Routines the bind and work routines for reading in
**    and storing a set of reactions and reaction patterns
**    into the database
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

 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static DbaseKeyword *ComputeReactionKeyWord(ReactionInfo *reaction);
static INT DBPrintAllRxns(BindStructure *bind, INT dbflag);

/*S RxnCurrentToDatabase
*/
/*F  ret = StoreCurrentReactions(bind)
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
extern INT StoreCurrentReactions(BindStructure *bind)
     {
     ChemDBMaster *master;
     ReactionSet *rxnset;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     rxnset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     
     ret = StoreReactionSetToDatabase(rxnset,REACTION_DATABASE,master);
     
     return(ret);
     }
/*F  ret = StoreCurrentReactions(bind)
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
extern INT StoreCurrentReactionPatterns(BindStructure *bind)
     {
     ChemDBMaster *master;
     ReactionSet *rxnpat;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     rxnpat = GetBoundStructure(bind,BIND_CURRENT_PATTERNS);
     ret = StoreReactionSetToDatabase(rxnpat,PATTERN_DATABASE,master);
     
     return(ret);
     }
 
/*F ret = StoreReactionSetToDatabase(rxnset,dbflag,master)
**
**  DESCRIPTION
**    rxnset: The current reaction set to store in database
**    dbflag: Thedatabase id (REACTION_DATABASE, PATTERN_DATABASE)
**    master: Master Database structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Store the ReactionSet in the database specified
**
**  REMARKS
**     If the id is in the database, then it is overwritten
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT StoreReactionSetToDatabase(ReactionSet *rxnset,
				      INT dbflag,
				      ChemDBMaster *master)
     {
     DataBaseInformation *dinfo;
     ReactionInfo *reaction;
     INT i;
     DbaseKeyword *key;
    
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);

     reaction = rxnset->Reactions;
     LOOPi(rxnset->NumberOfReactions)
	  {
	  key = ComputeReactionKeyWord(reaction);
	  
	  StoreElement((VOID) reaction,
		       key,GDBM_REPLACE,
		       dinfo);
	  InsertSearchKeys((VOID) reaction,
			   key,dinfo->Keys);
	  FreeDbaseKeyword(key);
	  Free(key);
	  reaction++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }
/*f  key = ComputeReactionKeyWord(molecule)
**
**  DESCRIPTION
**    reaction: The reaction from which the keyword is to be derived
**    key: The keyword to be used in the database
**    
**  REMARKS
**
*/
static DbaseKeyword *ComputeReactionKeyWord(ReactionInfo *reaction)
     {
     DbaseKeyword *key;
     
     key = AllocateDbaseKeyword;
     CreateDbaseKeyword(key,reaction->ID,reaction->Name,
			sizeof(INT),0);
     memcpy(key->KeyWord,&(reaction->ID),sizeof(INT));
     
     return(key);
     }

/*S PrintOutDatabase
**    This is a basic check of the database.  Each name of the structure or
**    molecule is printed out to stdout.
**
**
*/
/*F  ret = DBPrintAllReactions(bind)  . . . . . . . . bind: print molecules
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Print out the names of the molecules in the database (to stdout)
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBPrintAllMolSubs
**
**  HEADERFILE
**
*/
extern INT DBPrintAllReactions(BindStructure *bind)
     {
     INT ret;
     
     ret = DBPrintAllRxns(bind,REACTION_DATABASE);
     return(ret);
     }
/*F  ret = DBPrintAllRxnPatterns(bind)  . . . . . . . . bind: print molecules
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Print out the names of the molecules in the database (to stdout)
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBPrintAllMolSubs
**
**  HEADERFILE
**
*/
extern INT DBPrintAllRxnPatterns(BindStructure *bind)
     {
     INT ret;
     
     ret = DBPrintAllRxns(bind,PATTERN_DATABASE);
     return(ret);
     }
/*f  ret = DBPrintAllRxns(bind,dbflags)  . . . . . . . . . . static: print
**  DESCRIPTION
**
**    bind: The bind structure
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The main work routine for printing out a list of molecules or structures.
**    The database is looped through using FetchFirstElement and FetchNextElement.
**
**  REMARKS
**
*/
static INT DBPrintAllRxns(BindStructure *bind, INT dbflag)
     {
     ReactionInfo *reaction;
     DbaseKeyword *keyword;
     DataBaseInformation *dinfo;
     INT ret;
     ChemDBMaster *master;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     reaction = AllocateReactionInfo;
     keyword = AllocateDbaseKeyword;
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     ret = FetchFirstElement((VOID *) reaction,keyword,dinfo);
     
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  while(ret == SYSTEM_NORMAL_RETURN)
	       {
	       printf("%10d: -->%s<--\n",reaction->ID,reaction->Name);
	       ret = FetchNextElement((VOID *) reaction,keyword,dinfo);;
	       }
	  Free(reaction);
	  FreeDbaseKeyword(keyword);
	  }
     
     Free(keyword);
	  
     return(SYSTEM_NORMAL_RETURN);
     }

