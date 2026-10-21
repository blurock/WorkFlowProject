
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
#include <ctype.h>
#include "basic.h"
#include "comlib.h"
#include "property.h"
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
			      INT dbflag, BindStructure *bind);
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

     if (origrxns == NULL) {
       origrxns = AllocateReactionSet;
       memset(origrxns, 0, sizeof(ReactionSet));
       BindStructureIntoMaster((VOID)origrxns, BIND_CURRENT_REACTIONS, bind);
     }
     if (origmols == NULL) {
       origmols = AllocateMoleculeSet;
       memset(origmols, 0, sizeof(MoleculeSet));
       BindStructureIntoMaster((VOID)origmols, BIND_CURRENT_MOLECULES, bind);
     }

     ret = ReadInASCIIRxns(origmols,origrxns,MOLECULE_DATABASE,bind);
     return(ret);
     }

extern INT ReadInASCIISetOfRxnPatterns(BindStructure *bind)
     {
     MoleculeSet *origmols;
     ReactionSet *origrxns;
     INT ret;

     origrxns = GetBoundStructure(bind,BIND_CURRENT_PATTERNS);
     origmols = GetBoundStructure(bind,BIND_CURRENT_SUBSTRUCTURES);

     if (origrxns == NULL) {
       origrxns = AllocateReactionSet;
       memset(origrxns, 0, sizeof(ReactionSet));
       BindStructureIntoMaster((VOID)origrxns, BIND_CURRENT_PATTERNS, bind);
     }
     if (origmols == NULL) {
       origmols = AllocateMoleculeSet;
       memset(origmols, 0, sizeof(MoleculeSet));
       BindStructureIntoMaster((VOID)origmols, BIND_CURRENT_SUBSTRUCTURES, bind);
     }


     ret = ReadInASCIIRxns(origmols,origrxns,SUBSTRUCTURE_DATABASE,bind);
     return(ret);
     }

/*f asciirxnset = ReadInASCIIReactionsWithDBCheck(file, max, dbflag, bind)
**
**  DESCRIPTION
**    Reads ASCII reactions or reaction patterns from file.
**    When dbflag is SUBSTRUCTURE_DATABASE or MOLECULE_DATABASE and bind is provided,
**    it verifies that all reactant and product substructures/molecules exist in the database.
**    If one or more substructures are not found, an easy-to-grep error message is printed:
**      "ERROR Substructure in Reaction Pattern not found: xxx not found in yyy"
**    and the rest of the current reaction pattern is skipped until "$$$$",
**    proceeding to read the next reaction pattern.
*/
extern ASCIIReactionSet *ReadInASCIIReactionsWithDBCheck(FILE *file, INT max,
                                                        INT dbflag,
                                                        BindStructure *bind) {
  CHAR *string, *word, *line, *name, *rest, *rxn_name;
  ASCIIReactionSet *rxnset;
  ASCIIReaction *rxn;
  ASCIIProperty *aprop;
  INT id, pidx, all_found, r, p;
  ChemDBMaster *dbmaster;
  DataBaseInformation *dinfo = NULL;
  MoleculeInfo *testmol = NULL;

  if (bind != NULL && dbflag != 0) {
    dbmaster = GetBoundStructure(bind, BIND_CHEMDBASE);
    if (dbmaster == NULL || dbmaster->DatabaseInfo == NULL) {
      InitializeChemDBInfo(bind);
      dbmaster = GetBoundStructure(bind, BIND_CHEMDBASE);
    }
    if (dbmaster != NULL && dbmaster->DatabaseInfo != NULL) {
      dinfo = GetDataBaseInfoFromID(dbmaster->DatabaseInfo, dbflag);
    }
  }

  string = AllocateString(10 * LINELENGTH);
  word = AllocateString(LINELENGTH);

  line = NextNonBlankLine(file, string);

  if (line != 0) {
    rest = IsolateNextWord(line, word, BLANK, LINELENGTH);

    if (strstr(line, " = ") != 0 || strstr(line, " =") != 0 || !isdigit((unsigned char)word[0])) {
      id = 0;
      name = "Reactions";
      rxnset = AllocateASCIIReactionSet;
      CreateASCIIReactionSet(rxnset, id, name, max, 0);
      /* Keep line intact for the while loop */
    } else {
      id = atoi(word);
      EliminateBlanks(rest);
      name = rest;
      rxnset = AllocateASCIIReactionSet;
      CreateASCIIReactionSet(rxnset, id, name, max, 0);
      line = NextNonBlankLine(file, string);
    }
  } else {
    rxnset = AllocateASCIIReactionSet;
    CreateASCIIReactionSet(rxnset, 0, "Reactions", max, 0);
  }

  rxnset->NumberOfReactions = 0;
  rxn = rxnset->Reactions;
  while (line != 0 && rxnset->NumberOfReactions < max) {
    rest = IsolateNextWord(line, word, BLANK, LINELENGTH);
    rxn_name = CopyString(word);

    CreateASCIIReaction(rxn, rxnset->NumberOfReactions, word, 0,
                        FORWARD_REVERSE, 0, 0);

    rest = IsolateNextWordFromPhrase(rest, word, " = ", LINELENGTH);
    EliminateLeadingBlanks(rest);
    if (*rest == FORWARD_DELIMITOR) {
      rxn->ReactionType = FORWARD_REACTION;
      rest++;
    }

    CHAR rdelim = (strchr(word, '+') != NULL) ? '+' : ' ';
    CHAR pdelim = (strchr(rest, '+') != NULL) ? '+' : ' ';
    rxn->Reactants = ReadInMoleculesFromLine(word, rdelim, 10);
    rxn->Products = ReadInMoleculesFromLine(rest, pdelim, 10);

    all_found = 1;
    if (dinfo != NULL) {
      testmol = AllocateMoleculeInfo;

      if (rxn->Reactants != NULL && rxn->Reactants->Molecules != NULL) {
        ReadInMolecule *rmol = rxn->Reactants->Molecules;
        for (r = 0; r < rxn->Reactants->NumberOfMolecules; r++) {
          if (rmol->Name != NULL && strlen(rmol->Name) > 0 && strcmp(rmol->Name, "+") != 0) {
            memset(testmol, 0, sizeof(MoleculeInfo));
            INT ret = DBFindMolSubFromString(rmol->Name, testmol, dinfo);
            if (ret != SYSTEM_NORMAL_RETURN) {
              all_found = 0;
              if (dbflag == SUBSTRUCTURE_DATABASE) {
                printf("ERROR Substructure in Reaction Pattern not found: %s not found in %s\n",
                       rmol->Name, rxn_name);
              } else {
                printf("ERROR Molecule in Reaction not found: %s not found in %s\n",
                       rmol->Name, rxn_name);
              }
            } else {
              FreeMoleculeInfo(testmol);
            }
          }
          rmol++;
        }
      }

      if (rxn->Products != NULL && rxn->Products->Molecules != NULL) {
        ReadInMolecule *pmol = rxn->Products->Molecules;
        for (p = 0; p < rxn->Products->NumberOfMolecules; p++) {
          if (pmol->Name != NULL && strlen(pmol->Name) > 0 && strcmp(pmol->Name, "+") != 0) {
            memset(testmol, 0, sizeof(MoleculeInfo));
            INT ret = DBFindMolSubFromString(pmol->Name, testmol, dinfo);
            if (ret != SYSTEM_NORMAL_RETURN) {
              all_found = 0;
              if (dbflag == SUBSTRUCTURE_DATABASE) {
                printf("ERROR Substructure in Reaction Pattern not found: %s not found in %s\n",
                       pmol->Name, rxn_name);
              } else {
                printf("ERROR Molecule in Reaction not found: %s not found in %s\n",
                       pmol->Name, rxn_name);
              }
            } else {
              FreeMoleculeInfo(testmol);
            }
          }
          pmol++;
        }
      }

      Free(testmol);
    }

    if (!all_found) {
      /* Skip over the rest of the current reaction pattern until $$$$ */
      if (rxn->Name != NULL) {
        Free(rxn->Name);
        rxn->Name = NULL;
      }
      if (rxn->Reactants != NULL) {
        FreeReadInMoleculeSet(rxn->Reactants);
        Free(rxn->Reactants);
        rxn->Reactants = NULL;
      }
      if (rxn->Products != NULL) {
        FreeReadInMoleculeSet(rxn->Products);
        Free(rxn->Products);
        rxn->Products = NULL;
      }
      if (rxn->Properties != NULL) {
        FreeASCIIProperties(rxn->Properties);
        Free(rxn->Properties);
        rxn->Properties = NULL;
      }
      memset(rxn, 0, sizeof(ASCIIReaction));
      Free(rxn_name);

      while (line != NULL && strncmp(line, "$$$$", 4) != 0) {
        line = NextNonBlankLine(file, string);
      }
      if (line != NULL) {
        line = NextNonBlankLine(file, string);
      }
      continue;
    }

    Free(rxn_name);

    rxn->Properties = AllocateASCIIProperties;
    line = FillInProperties(file, rxn->Properties, string);

    if (rxn->Properties != 0) {
      aprop = rxn->Properties->Properties;
      for (pidx = 0; pidx < rxn->Properties->NumberOfProperties; pidx++) {
        if (aprop->Name != 0 && (!strcmp(aprop->Name, "ID") || !strcmp(aprop->Name, "- ID"))) {
          if (aprop->PropertyValue != 0)
            rxn->ID = atoi(aprop->PropertyValue);
          break;
        }
        aprop++;
      }
    }

    rxn++;
    rxnset->NumberOfReactions += 1;
  }

  Free(string);
  Free(word);
  return (rxnset);
}

/*f ret = ReadInASCIIRxns(origmols,origrxns,dbflag,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT ReadInASCIIRxns(MoleculeSet *origmols,ReactionSet *origrxns,
                           INT dbflag,
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
	  asciirxnset = ReadInASCIIReactionsWithDBCheck(file,max,dbflag,bind);
	  asciimolset = DetermineSetOfASCIIMolecules(asciirxnset);
	  molset = DetermineMoleculeSetFromASCII(asciimolset,dbflag,bind);
	  rxnset = ASCIIMoleculesInReaction(asciirxnset,asciimolset,molset);
	  FillInReactionPropertyValues(asciirxnset,rxnset,bind);

	  if (origrxns != NULL && origrxns->Reactions != NULL) FreeReactionSet(origrxns);
	  if (origmols != NULL && origmols->Molecules != NULL) FreeMoleculeSet(origmols);
	  memcpy(origrxns,rxnset,ReactionSetSize);
	  memcpy(origmols,molset,MoleculeSetSize);

	  
	  fclose(file);
	  }
     return(SYSTEM_NORMAL_RETURN);
     }


