/*  FILE chemdbdoc.h    
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**
**  REFERENCES
**
**  OVERVIEW
**       This is an overview
**
**  IMPLEMENTATION
**        The implementation 
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/
 
 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "chemdb/chemdatab.h"
#include "chemdb/thermo.h"
#include "chemdb/mech.h"
#include "chemdb/objid.h"
 
/*V  . . . GLOBAL VARIABLES  . . . . . . . . . . . . . . . . . . . . . . . . 
*/

#define BIND_CHEMDBASE          2001
#define BIND_CURRENT_MECHANISMS 2100
#define BIND_ID_CLASSIFICATIONS 2101

#define MOL_FILE_LIST_SUFFIX    "lst"
#define SDF_FILE_LIST_SUFFIX    "sdf"
#define META_ATOM_FILE_SUFFIX   "mta"
#define MECH_FILE_LIST_SUFFIX   "mch"
#define MECH_FILE_OUT_SUFFIX    "out"

#define MOLECULE_FILE_LIST_SUFFIX "mol"
#define REACTION_FILE_LIST_SUFFIX "rxn"


#define MOLECULE_DATABASE       0
#define SUBSTRUCTURE_DATABASE   1
#define BENSON_TABLES_DATABASE  2
#define CHEMKIN_THERMO_DATABASE 3
#define REACTION_DATABASE       4
#define PATTERN_DATABASE        5
#define MECHANISM_DATABASE      6

#define DB_NAME_SEARCH          0
#define DB_ID_SEARCH            1

#define FULL_NAMES      1
#define CHEMKIN_NAMES   2

 
 
/*V  . . . Object Find  VARIABLES . . . . . . . . . . . . . . . . . . . . .  
*/
#define DATABASE_CLASSIFICATIONS 100
#define LOCAL_CLASSIFICATIONS    200


/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . .  dbfunc.c
*/
extern FunctionList *MergeFunctChemDbase(FunctionList *old);
extern FunctionList *MergeFunctDBMolecule(FunctionList *old);
extern FunctionList *MergeFunctDBBensonTables(FunctionList *old);
extern FunctionList *MergeFunctDBReaction(FunctionList *old);
extern FunctionList *MergeFunctDBRSubMechanism(FunctionList *old);


/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . . datab.c
*/
extern INT InitializeAllDatabases(BindStructure *bind);

extern INT GetConstantsChemDB(BindStructure *bind);
extern ChemDBMaster *InitializeChemDBMaster(INT id, CHAR *name);
extern INT CreateChemDBFiles(BindStructure *bind);
extern INT OpenChemDBFiles(BindStructure *bind);
extern INT CloseChemDBFiles(BindStructure *bind);
extern INT InitializeChemDBInfo(BindStructure *bind);


/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . . moldb.c
*/
extern INT StoreCurrentMoleculeSet(BindStructure *bind);
extern INT StoreCurrentSubStructureSet(BindStructure *bind);
extern INT StoreMoleculeSetToDatabase(MoleculeSet *set, INT dbflag, 
				      BindStructure *bind);
extern INT DBReadInMoleculesFromList(BindStructure *bind);
extern INT DBReadInSubstructuresFromList(BindStructure *bind);
extern INT DBReadSDFMolecules(BindStructure *bind);
extern INT DBReadSDFSubstructures(BindStructure *bind);
extern INT DBReadMolFileMetaAtoms(BindStructure *bind);
extern INT DBPrintAllMolecules(BindStructure *bind);
extern INT DBPrintAllSubstructures(BindStructure *bind);
extern MoleculeSet *DetermineMoleculeSetFromASCII(ReadInMoleculeSet *asciimolset,
						  INT dbflag,
						  BindStructure *bind);

/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . dbmolsearch.c
*/
extern INT WriteMoleculeDBKeys(BindStructure *bind);
extern INT WriteSubStructureDBKeys(BindStructure *bind);
extern INT ReadMoleculeDBKeys(BindStructure *bind);
extern INT ReadSubStructureDBKeys(BindStructure *bind);
extern INT WriteCurrentMolStructKeys(BindStructure *bind, INT dbflag);
extern INT ReadCurrentMolStructKeys(BindStructure *bind, INT dbflag);
extern INT DBResetMoleculeSearchKeys(BindStructure *bind);
extern INT DBResetSubstructureSearchKeys(BindStructure *bind);
extern INT DBProduceMoleculeSearchKeys(BindStructure *bind);
extern INT DBProduceSubstructureSearchKeys(BindStructure *bind);
extern INT DBReadListOfMolecules(BindStructure *bind);
extern INT DBReadListOfSubstructures(BindStructure *bind);
extern void ProduceMolNameKey(CHAR *name,DbaseKeyword *key);
extern void ProduceMolIDKey(INT id, DbaseKeyword *key);
extern INT DBResetMolSubsSearchKeys(BindStructure *bind, INT dbflag);
extern INT DBProduceMolSubsSearchKeys(BindStructure *bind, INT dbflag);
extern INT DBReadListMolSubFromKeys(BindStructure *bind, INT dbflag);
extern INT IncrementMoleculeSet(MoleculeSet *molset);
extern INT DBFindMolSubFromString(CHAR *name, MoleculeInfo *mol, 
				  DataBaseInformation *dinfo);

 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . .  bensontables.c
*/
extern INT StoreCurrentBensonTables(BindStructure *bind);
extern INT StoreCurrentBensonTree(BindStructure *bind);
extern INT FillInChemkinInCurrent(BindStructure *bind);
extern INT StoreCurrentChemkin(BindStructure *bind);
extern DbaseKeyword *ComputeChemkinValueKey(ChemkinThermoRead *thermo);
extern DbaseKeyword *ComputeBensonTreeKey(CHAR *name);
extern DbaseKeyword *ComputeBensonTable2ndOrderKey(BensonSecondOrderTable *thermo);
extern INT PrintAllBensonTables(BindStructure *bind);
extern INT PrintAllBensonTrees(BindStructure *bind);
extern INT PrintAllChemkinValues(BindStructure *bind);
extern INT ReadBensonTablesFromList(BindStructure *bind);
extern INT DBReadInBensonTree(BindStructure *bind);

 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . . rxndb.c
*/
extern INT StoreCurrentReactions(BindStructure *bind);
extern INT StoreCurrentReactionPatterns(BindStructure *bind);
extern INT StoreReactionSetToDatabase(ReactionSet *rxnset,
				      INT dbflag,
				      ChemDBMaster *master);
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . dbrxnsearch.c
*/
extern INT DBResetReactionSearchKeys(BindStructure *bind);
extern INT DBResetRxnPatternSearchKeys(BindStructure *bind);
extern INT DBResetRxnSetSearchKeys(BindStructure *bind, INT dbflag);
extern void ProduceRxnNameKey(CHAR *name,DbaseKeyword *key);
extern void ProduceRxnIDKey(INT id, DbaseKeyword *key);
extern INT DBProduceReactionSearchKeys(BindStructure *bind);
extern INT DBProduceRxnPatternSearchKeys(BindStructure *bind);
extern INT DBProduceRxnSetSearchKeys(BindStructure *bind, INT dbflag);
extern INT InitializeRxnSetDBKeys(BindStructure *bind);
extern INT WriteReactionDBKeys(BindStructure *bind);
extern INT WriteRxnPatternDBKeys(BindStructure *bind);
extern INT ReadReactionDBKeys(BindStructure *bind);
extern INT ReadRxnPatternDBKeys(BindStructure *bind);
extern INT WriteCurrentRxnSetKeys(BindStructure *bind, INT dbflag);
extern INT ReadCurrentRxnSetKeys(BindStructure *bind, INT dbflag);
extern INT DBReadListOfReactions(BindStructure *bind);
extern INT DBReadListOfRxnPatterns(BindStructure *bind);
extern INT DBReadListRxnSetFromKeys(BindStructure *bind, INT dbflag);
extern INT IncrementReactionSet(ReactionSet *rxnset);
extern INT DBFindRxnSetFromString(CHAR *name, ReactionInfo *rxn, 
				  DataBaseInformation *dinfo);
extern ReactionSet *DetermineReactionSetFromASCII(ReadInReactionSet *asciirxnset,
						  INT dbflag,
						  BindStructure *bind);
extern ReadInReactionSet *ReadInReactionSetFromFile(BindStructure *bind,
						    INT delim);
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
extern INT ReadInASCIISetOfMoleculeProps(BindStructure *bind);
extern INT ReadInASCIISetOfSubStructureProps(BindStructure *bind);
extern INT ReadInASCIIMols(INT dbflag,
			   MoleculeSet *orig,
			   BindStructure *bind);
extern INT ReadInASCIISetOfReactions(BindStructure *bind);
extern INT ReadInASCIISetOfRxnPatterns(BindStructure *bind);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . mechanism.c
*/
extern SetOfPropertyTypes *InitializeMechRxnPropertyTypes(INT id, CHAR *name);
extern DetailedMechanism *SpaceToAddNewMechanismToSet(SetOfDetailedMechanisms *set);
extern INT ReadInMechanism(BindStructure *bind);
extern INT TransferASCIIMechanism(ASCIIProperties *asciimech,
				  DetailedMechanism *mechanism,
				  BindStructure *bind);
extern INT MasterPrintSetOfMechanisms(BindStructure *bind);
extern CHAR *PrintStringDetailedMechanism(CHAR *string, INT *length, CHAR *prefix,
					  DetailedMechanism *mechanism,
					  BindStructure *bind);
extern CHAR *PrintStringReactionMechanismEquations(CHAR *string, INT *length, CHAR *prefix,
						   DetailedMechanism *mechanism,
						   BindStructure *bind);
extern INT StoreSetOfMechanismsInDatabase(BindStructure *bind);
extern INT StoreMechanismToDatabase(DetailedMechanism *mechanism,
				    ChemDBMaster *master);
extern void InsertEquilibriumValue(MechanismMolecule *mol,
				   SetOfPropertyValues *valueset,
				   SetOfPropertyTypes *types);
extern void InsertThermoValue(MechanismMolecule *mol,
			      SetOfPropertyValues *valueset,
			      SetOfPropertyTypes *types);
extern SetOfDetailedMechanisms *InitializeSetOfDetailedMechanisms(INT id, CHAR *name);
extern DataSubSet *DetermineDatabaseCorrespondence(MoleculeSet *molecules,
						   INT classid,
						   BindStructure *bind);


/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . .  genrxn.c
*/
extern DetailedMechanism 
*TransferGeneratedToMechanism(DetailedMechanism *mech,
			      PerformedRxnMaster *performed,
			      ReactionSet *rxnpatterns,
			      BensonCalculation *bentree,
			      BindStructure *bind);
extern MoleculeSet *ReadSetOfMoleculesFromParameters(CHAR *parameter,
						     BindStructure *bind);
extern INT GenerateChainMechanism(BindStructure *bind);
extern DataSubSet *ReplaceMoleculesFromDatabase(MoleculeSet *molset,
					 BindStructure *bind); 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . objfind.c
*/
extern INT DetermineObjectID(VOID object,
			     INT classid,
			     INT source,
			     BindStructure *bind);
extern SetOfObjectClassifications *InitializeSetOfObjectClassifications(INT id, CHAR *name);
extern ObjectIDTreeNode *InitializeObjectTree(INT id, CHAR *name);
extern ObjectClassification *FindClassification(INT classid,
						INT source,
						BindStructure *bind);
extern INT DetermineObjectIDFromInfo(ListOfTreeLevelDescriptions *descr,
				     ObjectIDInfo *info);
extern ObjectClassification *AddEmptyClassification(SetOfObjectClassifications *set,
						    INT classid,
						    BindStructure *bind);
extern ObjectClassification *ReadInClassification(ObjectClassification *classification,
						  BindStructure *bind);
extern ObjectIDClass *FindOrCreateObjectIDClass(VOID object,
						ListOfTreeLevelDescriptions *descr,
						ObjectIDTreeNode *tree);
extern ObjectIDInfo *DetermineObjectIDInfo(ListOfTreeLevelDescriptions *descr,
					   VOID object);
extern INT AddObjectToIDClass(VOID object,
			      ObjectClassification *classification,
			      BindStructure *bind);
extern INT WriteOutClassification(INT classid,
				  BindStructure *bind);

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . .objfindmol.c
*/
extern INT InitializeMoleculeClassifications(BindStructure *bind);
extern ListOfTreeLevelDescriptions *InitializeMoleculeTreeDescription(INT id, CHAR *name);
extern INT MoleculeEquivalence(VOID mol1, VOID mol2);
extern INT SubStructureEquivalence(VOID mol1, VOID mol2);
extern VOID FindMoleculeByKey(DbaseKeyword *key, VOID setofelements);
extern INT PutMoleculeInDatabaseClass(MoleculeInfo *molecule,
				      INT source,
				      BindStructure *bind);
extern INT ReadInRxnPatternsMolsFromDB(BindStructure *bind);
extern void WriteOutDetailedMechanism(DetailedMechanism *mechanism,
				      BindStructure *bind);
extern int InsertDetailedMechanismInSet(BindStructure *bind,
					DetailedMechanism *mechanism);
extern INT RetrieveMechanismsFromDatabase(BindStructure *bind);
extern INT InitializeMechanismDataBase(BindStructure *bind);
extern INT CombineToTotalMechanism(BindStructure *bind);
extern INT DBPrintAllMechanisms(BindStructure *bind);
extern INT PrintChemkinNameCorrespondences(BindStructure *bind);
extern INT AddIDKeyToClass(DbaseKeyword *key, ObjectIDClass *class);
