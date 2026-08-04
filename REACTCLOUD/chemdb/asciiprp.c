
/*  FILE     asciiprp.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
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
static INT ReadInASCIIRxns(MoleculeSet *origmols,ReactionSet *origrxns,
			      BindStructure *bind);
static void MoleculesFromDatabase(ReadInMoleculeSet *asciimolset,
				  MoleculeSet *mols,
				  INT dbflag,
				  BindStructure *bind);

/* ReadInASCIIMoleculeProperties
*/
/*F ret = ReadInASCIISetOfMoleculeProps(bind)
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
extern INT ReadInASCIISetOfMoleculeProps(BindStructure *bind) {
  INT ret;
  MoleculeSet *orig;
  orig = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
  ret = ReadInASCIIMols(MOLECULE_DATABASE,orig,bind);
  return(ret);
}
     
/*F ret = ReadInASCIISetOfSubStructureProps (Bind)
**
**  DESCRIPTION
**    Bind: The Bind Structure
**
**    Ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT ReadInASCIISetOfSubStructureProps(BindStructure *bind)
     {
     MoleculeSet *orig;
     INT ret;

     orig = GetBoundStructure(bind,BIND_CURRENT_SUBSTRUCTURES);
     
     ret = ReadInASCIIMols(SUBSTRUCTURE_DATABASE,orig,bind);

     return(ret);
     }
    
/*f ret = ReadInASCIIMols(dbflag,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern INT ReadInASCIIMols(INT dbflag,
			   MoleculeSet *orig,
			   BindStructure *bind)
     {
     CommandMaster *commandmaster;
     FILE *file;
     ReadInMoleculeSet *asciimolset;
     MoleculeSet *molset;
     INT max;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
    
     file = OpenReadFileFromCurrent("MolDirectory","DBDataMolRoot",
				    MOL_FILE_LIST_SUFFIX,
				    IGNORE,"ASCII Molecules",commandmaster);
     max = GetCurrentIntegerArgument("ASCIIMoleculeMaxNum",commandmaster);
     
     if(file != 0)
	  {
	  FreeMoleculeSet(orig);
	  asciimolset = ReadInASCIIMolecules(file,max);
	  MoleculesFromDatabase(asciimolset,orig,dbflag,bind);
	  FillInMoleculePropertyValues(asciimolset,orig,bind);
	  FreeReadInMoleculeSet(asciimolset);
	  Free(asciimolset);
	  
	  fclose(file);
	  }
     return(SYSTEM_NORMAL_RETURN);
     } 
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
     
/*f MoleculesFromDatabase(asciimolset,dbflag,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void MoleculesFromDatabase(ReadInMoleculeSet *asciimolset,
					  MoleculeSet *orig,
					  INT dbflag,
					  BindStructure *bind)
     {
     ChemDBMaster *dbmaster;
     DataBaseInformation *dinfo;
     ReadInMolecule *asciimol;
     MoleculeSet *molset;
     MoleculeInfo *mol;
     INT i,ret;
      
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(dbmaster->DatabaseInfo,dbflag);
     
     molset = orig;
     CreateMoleculeSet(molset,asciimolset->ID,asciimolset->Name,
		       asciimolset->NumberOfMolecules,0,0,0);

     molset->PropertyTypes = InitializeMolecularPropertyTypes(asciimolset->ID,
							      asciimolset->Name);
     
     mol = molset->Molecules;
     asciimol = asciimolset->Molecules;
     LOOPi(asciimolset->NumberOfMolecules)
	  {
	  ret = DBFindMolSubFromString(asciimol->Name,mol,dinfo);
	  if(ret == SYSTEM_ERROR_RETURN)
	       {
	       printf("%s Not found\n",asciimol->Name);
	       mol->ID = -1;
	       }
	  
	  mol++;
	  asciimol++;
	  }
     }

/*S ReadInASCIIReactionProperties
*/
/*F ret = ReadInASCIISetOfReactions(bind)
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
extern INT ReadInASCIISetOfReactions(BindStructure *bind)
     {
     MoleculeSet *origmols;
     ReactionSet *origrxns;
     INT ret;

     origrxns = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     origmols = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);

     ret = ReadInASCIIRxns(origmols,origrxns,bind);
     return(ret);
     }
/*F ret = ReadInASCIISetOfRxnPatterns(bind)
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
extern INT ReadInASCIISetOfRxnPatterns(BindStructure *bind)
     {
     MoleculeSet *origmols;
     ReactionSet *origrxns;
     INT ret;
     printf("ReadInASCIISetOfRxnPatterns\n");
     origrxns = GetBoundStructure(bind,BIND_CURRENT_PATTERNS);
     origmols = GetBoundStructure(bind,BIND_CURRENT_SUBSTRUCTURES);

     ret = ReadInASCIIRxns(origmols,origrxns,bind);
     return(ret);
     }
/*f ret = ReadInASCIIRxns(origmols,origrxns,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT ReadInASCIIRxns(MoleculeSet *origmols,ReactionSet *origrxns,
			      BindStructure *bind)
     {
     CommandMaster *commandmaster;
     FILE *file;
     ASCIIReactionSet *asciirxnset;
     ReadInMoleculeSet *asciimolset;
     MoleculeSet *molset;
     ReactionSet *rxnset;
     INT max;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
    
     file = OpenReadFileFromCurrent("RxnDirectory","RootRxnName",
				    RXN_FILE_LIST_SUFFIX,
				    IGNORE,"ASCII Reactions",commandmaster);
     max = GetCurrentIntegerArgument("ASCIIReactionMaxNum",commandmaster);
     
     if(file != 0)
	  {
	  asciirxnset = ReadInASCIIReactions(file,max);
	  asciimolset = DetermineSetOfASCIIMolecules(asciirxnset);
	  molset = DetermineMoleculeSetFromASCII(asciimolset,MOLECULE_DATABASE,bind);
	  rxnset = ASCIIMoleculesInReaction(asciirxnset,asciimolset,molset);
	  FillInReactionPropertyValues(asciirxnset,rxnset,bind);

	  FreeReactionSet(origrxns);
	  FreeMoleculeSet(origmols);
	  memcpy(origrxns,rxnset,ReactionSetSize);
	  memcpy(origmols,molset,MoleculeSetSize);
	  
	  fclose(file);
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

