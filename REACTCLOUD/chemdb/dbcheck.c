/*  FILE     dbcheck.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Routines to check whether the current and the database structures
**    are the same.  The ID and the Name are checked first and then, 
**    depending on the structure, other checks are made for equivalency:
**    - Molecules and Substructures
**            The graph with hydrogens is check
**    - Reactions and Reaction Pattern (in canonical form)
**            An exact match is looked for
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
#include "chemdb.h"
/*P static prototypes for this file
*/

/*S MoleculeChecks
*/
 
/*F  ret = CheckCurrentMoleculesWithDB(bind)
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
extern INT CheckCurrentMoleculesWithDB(BindStructure *bind)
     {
     INT ret;
     MoleculeSet *molset;

     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);     
     ret = CheckCurrentMoleculeSetWithDB(molset,MOLECULE_DATABASE,bind);
     
     return(ret);
     }

 
/*F  ret = CheckCurrentSubStructuresWithDB(bind)
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
extern INT CheckCurrentSubStructuresWithDB(BindStructure *bind)
     {
     INT ret;
     MoleculeSet *molset;

     molset = GetBoundStructure(bind,BIND_CURRENT_SUBSTRUCTURES);     
     ret = CheckCurrentMoleculeSetWithDB(molset,SUBSTRUCTURE_DATABASE,bind);
     
     return(ret);
     }

 
/*F ret = CheckCurrentMoleculeSetWithDB(molset,id,bind)
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
extern INT CheckCurrentMoleculeSetWithDB(MoleculeSet *molset, INT dbflag,
					 BindStructure *bind)
     {
     MoleculeInfo *molecule;
     INT i;
     ChemDBMaster *master;
     DataBaseInformation *dinfo;

     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     molecule = molset->Molecules;
     LOOPi(molset->NumberOfMolecules)
	  {
	  check = CheckSingleMoleculeInDatabase(molecule,dinfo);
	  molecule++;
	  }

     return(SYSTEM_NORMAL_RETURN);
     }

 
/*F check = CheckSingleMoleculeInDatabase(molecule, dinfo)
  
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
extern INT CheckSingleMoleculeInDatabase(MoleculeInfo *molecule,
					DataBaseInformation *dinfo)
     {
     DbaseKeyword *keyword;
     MoleculeInfo *dbmolecule;
     INT ret;
     
     molecule = AllocateMoleculeInfo;
     keyword = AllocateDbaseKeyword;
     
     ret = FetchFirstElement((VOID *) molecule,keyword,dinfo);
     
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  while(ret == SYSTEM_NORMAL_RETURN)
	       {
	       check = CheckMoleculeEquivalences(molecule,dbmolecule);
	       ret = FetchNextElement((VOID *) molecule,keyword,dinfo);
	       }
	  Free(molecule);
	  FreeDbaseKeyword(keyword);
	  }
     
     Free(keyword);
	  
     return(check);
     }
     
 
/*F check = CheckMoleculeEquivalences(molecule1,molecule2)
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
extern INT CheckMoleculeEquivalences(MoleculeInfo *molecule1, MoleculeInfo *molecule2)
     {
     INT check;
     Graph *mol1,*mol2;
     
     check = 0;
     
     if(molecule1->ID == molecule2->ID)
	  {
	  printf("ID Clash: %d\n",molecule1->ID);
	  check = 1;
	  }
     if(!strcmp(molecule1->Name,molecule2->Name))
	  {
	  printf("Name Clash %s\n",molecule1->Name);
	  check = 1;
	  }
     
     mol1 = AddHydrogens(molecule1->Molfile);
     mol2 = AddHydrogens(molecule2->Molfile);
     if(GraphEqual(mol1,mol2))
	     {
	     printf("Structure Clash: (%8d, %8d), (%s %s)\n",
		    molecule1->ID,molecule2->ID,
		    molecule1->Name,molecule2->Name);
	     check = 1;
	     }
     return(check);
     }

/*S ReactionChecks
*/
 
/*F  ret = CheckCurrentReactionsWithDB(bind)
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
extern INT CheckCurrentReactionsWithDB(BindStructure *bind)
     {
     INT ret;
     ReactionSet *rxnset;
     
     rxnset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     ret = CheckCurrentReactionSetWithDB(rxnset,REACTION_DATABASE,bind);
     
     return(ret);
     }
/*F  ret = CheckCurrentRxnPatternsWithDB(bind)
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
extern INT CheckCurrentRxnPatternsWithDB(BindStructure *bind)
     {
     INT ret;
     ReactionSet *rxnset;
     
     rxnset = GetBoundStructure(bind,BIND_CURRENT_PATTERNS);
     ret = CheckCurrentReactionSetWithDB(rxnset,PATTERN_DATABASE,bind);
     
     return(ret);
     }

 
/*F ret = CheckCurrentReactionSetWithDB(rxnset,dbflag,bind)
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
extern INT CheckCurrentReactionSetWithDB(ReactionSet *rxnset,
					 INT dbflag,
					 BindStructure *bind)
     {
     ReactionInfo *reaction;
     INT i;
     ChemDBMaster *master;
     DataBaseInformation *dinfo;

     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     reaction = rxnset->Reactions;
     LOOPi(rxnset->NumberOfReactions)
	  {
	  check = CheckSingleReactionInDatabase(reaction,dinf0);
	  reaction++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }
 
/*F check = CheckSingleReactionInDatabase(reaction,dinf0)
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
extern INT CheckSingleReactionInDatabase(ReactionInfo *reaction,
					 DataBaseInformation *dinf0)
     {
     ReactionInfo *dbreaction;
     DbaseKeyword *keyword;
     INT ret,check;
     
     reaction = AllocateReactionInfo;
     keyword = AllocateDbaseKeyword;
     
     ret = FetchFirstElement((VOID *) reaction,keyword,dinfo);
     
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  while(ret == SYSTEM_NORMAL_RETURN)
	       {
	       check = CheckEquivalencyOfReaction(reaction,dbreaction);
	       ret = FetchNextElement((VOID *) molecule,keyword,dinfo);
	       }
	  Free(molecule);
	  FreeDbaseKeyword(keyword);
	  }
 
     return(SYSTEM_NORMAL_RETURN);
     }

 
/*F check = CheckEquivalencyOfReaction(reaction1,reaction2)
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
extern INT CheckEquivalencyOfReaction(ReactionInfo *reaction1, ReactionInfo *reaction2) 
     {
     
     if(reaction1->ID == reaction2->ID)
	  {
	  printf("ID Clash: %d\n", reaction1->ID);
	  check = 1;
	  }
     if(reaction1->Name == reaction2->Name)
	  {
	  printf("Name Clash: %s\n",reaction1->Name);
	  check = 1;
	  }
     return(check);
     }
