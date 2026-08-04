/*  FILE     dbfunc.c
**  PACKAGE  chemdb
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The list of functions for the menu system
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

/*S DatabaseFunction
*/
#define NUMBER_CHEMDB_FUNCTIONS  12

static FunctionInfo CHEMDB_FUNCTION_LIST[NUMBER_CHEMDB_FUNCTIONS] = {
     {1,"InitializeChemDBInfo",(INT (*)(void)) InitializeChemDBInfo},
     {2,"CreateChemDBFiles",(INT (*)(void)) CreateChemDBFiles},
     {3,"OpenChemDBFiles",(INT (*)(void)) OpenChemDBFiles},
     {4,"CloseChemDBFiles",(INT (*)(void)) CloseChemDBFiles},
     {5,"InitializeAllDatabases",(INT (*)(void)) InitializeAllDatabases},
     {6,"InitializeMoleculeClassifications",(INT (*)(void)) InitializeMoleculeClassifications},
     {7,"DBPrintAllReactions",(INT (*)(void)) DBPrintAllReactions},
     {8,"DBPrintAllRxnPatterns",(INT (*)(void)) DBPrintAllRxnPatterns},
     {9,"ReadInRxnPatternsMolsFromDB",(INT (*)(void)) ReadInRxnPatternsMolsFromDB},
     {10,"RetrieveMechanismsFromDatabase",(INT (*)(void)) RetrieveMechanismsFromDatabase},
     {11,"PrintChemkinNameCorrespondences",(INT (*)(void)) PrintChemkinNameCorrespondences},
     {12,"DBPrintAllMechanisms",(INT (*)(void)) DBPrintAllMechanisms}
     };

static FunctionList CHEMDB_FUNCTIONS = {
        0,"ChemistryDatabase",
    	NUMBER_CHEMDB_FUNCTIONS,
	CHEMDB_FUNCTION_LIST
	};

extern FunctionList *MergeFunctChemDbase(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
				  old, &CHEMDB_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }
/*S DatabaseMolecule
*/
#define NUMBER_DBMOLECULE_FUNCTIONS 20

static FunctionInfo DBMOLECULE_FUNCTION_LIST[NUMBER_DBMOLECULE_FUNCTIONS] = {
     {1,"DBReadInMoleculesFromList",(INT (*)(void)) DBReadInMoleculesFromList},  
     {2,"DBReadInSubstructuresFromList",(INT (*)(void)) DBReadInSubstructuresFromList},  
     {3,"DBReadSDFMolecules",(INT (*)(void)) DBReadSDFMolecules},  
     {4,"DBReadSDFSubstructures",(INT (*)(void)) DBReadSDFSubstructures},
     {5,"DBPrintAllMolecules",(INT (*)(void)) DBPrintAllMolecules},
     {6,"DBPrintAllSubstructures",(INT (*)(void)) DBPrintAllSubstructures},
     {7,"DBResetMoleculeSearchKeys",(INT (*)(void)) DBResetMoleculeSearchKeys},
     {8,"DBResetSubstructureSearchKeys",(INT (*)(void)) DBResetSubstructureSearchKeys},
     {9,"DBProduceMoleculeSearchKeys",(INT (*)(void)) DBProduceMoleculeSearchKeys},
     {10,"DBProduceSubstructureSearchKeys",(INT (*)(void)) DBProduceSubstructureSearchKeys},
     {11,"DBReadListOfMolecules",(INT (*)(void)) DBReadListOfMolecules},
     {12,"DBReadListOfSubstructures",(INT (*)(void)) DBReadListOfSubstructures},
     {13,"StoreCurrentMoleculeSet",(INT (*)(void)) StoreCurrentMoleculeSet},
     {14,"StoreCurrentSubStructureSet",(INT (*)(void)) StoreCurrentSubStructureSet},
     {15,"WriteMoleculeDBKeys",(INT (*)(void)) WriteMoleculeDBKeys},
     {16,"WriteSubStructureDBKeys",(INT (*)(void))WriteSubStructureDBKeys},
     {17,"ReadMoleculeDBKeys",(INT (*)(void)) ReadMoleculeDBKeys},
     {18,"ReadSubStructureDBKeys",(INT (*)(void)) ReadSubStructureDBKeys},
     {19,"ReadInASCIISetOfMoleculeProps",(INT (*)(void)) ReadInASCIISetOfMoleculeProps},
     {20,"ReadInRxnPatternsMolsFromDB",(INT (*)(void)) ReadInRxnPatternsMolsFromDB}
     };

static FunctionList DBMOLECULE_FUNCTIONS = {
        0,"MoleculeDatabase",
    	NUMBER_DBMOLECULE_FUNCTIONS,
	DBMOLECULE_FUNCTION_LIST
	};

extern FunctionList *MergeFunctDBMolecule(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
				  old, &DBMOLECULE_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }
/*S DatabaseThermodynamics
*/
#define NUMBER_DBTHERMO_FUNCTIONS 9

static FunctionInfo DBTHERMO_FUNCTION_LIST[NUMBER_DBTHERMO_FUNCTIONS] = {
     {1,"StoreCurrentBensonTables",(INT (*)(void)) StoreCurrentBensonTables},
     {2,"StoreCurrentBensonTree",(INT (*)(void)) StoreCurrentBensonTree},
     {3,"ReadBensonTablesFromList",(INT (*)(void)) ReadBensonTablesFromList},
     {4,"DBReadInBensonTree",(INT (*)(void)) DBReadInBensonTree},
     {5,"PrintAllBensonTables",(INT (*)(void)) PrintAllBensonTables},
     {6,"PrintAllBensonTrees",(INT (*)(void)) PrintAllBensonTrees},
     {7,"StoreCurrentChemkin",(INT (*)(void)) StoreCurrentChemkin},
     {8,"PrintAllChemkinValues",(INT (*)(void)) PrintAllChemkinValues},
     {9,"FillInChemkinInCurrent",(INT (*)(void)) FillInChemkinInCurrent}
     };
    
static FunctionList DBTHERMO_FUNCTIONS = {
        0,"Thermodynamic Database",
    	NUMBER_DBTHERMO_FUNCTIONS,
	DBTHERMO_FUNCTION_LIST
	};

extern FunctionList *MergeFunctDBBensonTables(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
				  old, &DBTHERMO_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }
/* DatabaseReactions
*/
#define NUMBER_DBREACTIONS_FUNCTIONS 14

static FunctionInfo DBREACTIONS_FUNCTION_LIST[NUMBER_DBREACTIONS_FUNCTIONS] = {
     {1,"DBResetReactionSearchKeys",(INT (*)(void)) DBResetReactionSearchKeys},
     {2,"DBResetRxnPatternSearchKeys",(INT (*)(void)) DBResetRxnPatternSearchKeys},
     {3,"DBProduceReactionSearchKeys",(INT (*)(void)) DBProduceReactionSearchKeys},
     {4,"DBProduceRxnPatternSearchKeys",(INT (*)(void)) DBProduceRxnPatternSearchKeys},
     {5,"InitializeRxnSetDBKeys",(INT (*)(void)) InitializeRxnSetDBKeys},
     {6,"WriteReactionDBKeys",(INT (*)(void)) WriteReactionDBKeys},
     {7,"WriteRxnPatternDBKeys",(INT (*)(void)) WriteRxnPatternDBKeys},
     {8,"ReadReactionDBKeys",(INT (*)(void)) ReadReactionDBKeys},
     {9,"ReadRxnPatternDBKeys",(INT (*)(void)) ReadRxnPatternDBKeys},
     {10,"DBReadListOfReactions",(INT (*)(void)) DBReadListOfReactions},
     {11,"DBReadListOfRxnPatterns",(INT (*)(void)) DBReadListOfRxnPatterns},
     {12,"StoreCurrentReactions",(INT (*)(void)) StoreCurrentReactions},
     {13,"StoreCurrentReactionPatterns",(INT (*)(void)) StoreCurrentReactionPatterns},
     {14,"ReadInASCIISetOfSubStructureProps",(INT (*)(void)) ReadInASCIISetOfSubStructureProps}
     };
    
static FunctionList DBREACTIONS_FUNCTIONS = {
        0,"Reaction/Pattern Database",
    	NUMBER_DBREACTIONS_FUNCTIONS,
	DBREACTIONS_FUNCTION_LIST
	};

extern FunctionList *MergeFunctDBReaction(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
				  old, &DBREACTIONS_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }
#define NUMBER_MECHDB_FUNCTIONS 6

static FunctionInfo MECHDB_FUNCTION_LIST[NUMBER_MECHDB_FUNCTIONS] = {
     {1,"ReadInMechanism",(INT (*)(void)) ReadInMechanism},
     {2,"MasterPrintSetOfMechanisms",(INT (*)(void)) MasterPrintSetOfMechanisms},
     {3,"StoreSetOfMechanismsInDatabase",(INT (*)(void)) StoreSetOfMechanismsInDatabase},
     {4,"GenerateChainMechanism",(INT (*)(void)) GenerateChainMechanism},
     {5,"InitializeMechanismDataBase",(INT (*)(void)) InitializeMechanismDataBase},
     {6,"CombineToTotalMechanism",(INT (*)(void)) CombineToTotalMechanism}
     };
    
static FunctionList MECHDB_FUNCTIONS = {
        0,"SubMechanism Database",
    	NUMBER_MECHDB_FUNCTIONS,
	MECHDB_FUNCTION_LIST
	};

extern FunctionList *MergeFunctDBRSubMechanism(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
				  old, &MECHDB_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }

