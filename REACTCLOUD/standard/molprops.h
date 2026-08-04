/*  FILE     molprops.h
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
#include "molprops/chemkin.h"
#include "molprops/bentables.h"
#include "molprops/bencalc.h"
#include "molprops/tables.h"
 
/*V  . . . GLOBAL VARIABLES . . . . . . . . . . . . . . . . . . . . . .  bind
*/
#define BIND_THERMO_TABLES           2005
#define BIND_BENSONCALC              2006

#define CHEMKIN_THERMO_SUFFIX "thm"
#define BENSON_2NDORDER_SUFFIX "ben"
#define BENSON_TRANSLATE_SUFFIX "trn"

#define MAX_NUMBER_BENSON_VALUES 100
#define MAX_BENSON_BOUND         4
#define MAX_TRANSLATION_VALUES   100

#define MAX_CURRENT_MOLECULES 200
#define INC_CURRENT_MOLECULES 100
 
#define BENSON_THERMO_PROPERTY      100
#define MOLECULE_SUBGRAPH_PROPERTY  101
#define CHEMKIN_READTHERMO_PROPERTY 102
#define CALC_THERMO_PROPERTY        103
#define MISC_MOLECULE_PROPERTIES    104


#define BENSON_LINKED_LIST_SIZE 1000
#define CHEMKIN_LINKED_LIST_SIZE 1000
#define MOLCONSTANTS_LINKED_LIST_SIZE 300

/*V  . . . GLOBAL VARIABLES  . . . . . . . . . . . . . . . . . . . . .chemkin
*/
#define CHEMKIN_GAS           0
#define CHEMKIN_LIQUID        1
#define CHEMKIN_SOLID         2
#define CHEMKIN_UNKNOWN       3

/*V  . . . MOLID VARIABLES  . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#define TOP_MOLIDLEVEL                    4
#define MOLID_REPEAT                      1
#define MOLID_NUM_CARBONS               100
#define MOLID_NUM_ATOMS                1000
#define MOLID_NUM_BONDS              100000
#define MOLID_STRUCTURE            10000000
#define GENERATED_MOLECULE         70000000
#define MOLID_MAX_REPEAT                 99
#define MOLID_MAX_NUM_CARBONS             9
#define MOLID_MAX_NUM_ATOMS              99
#define MOLID_MAX_NUM_BONDS              39
#define MOLID_MAX_STRUCTURE               9

#define MOLID_REPEAT_DIVIDE             100

#define MOLID_RADICAL              1
#define MOLID_MOLECULE             1
#define MOLID_SUBSTRUCTURE         5
#define MOLID_MOLECULE_RADICAL     2
#define MOLID_SUBSTRUCTURE_RADICAL 6
#define MOLID_GENERATED            8
#define MOLID_GENERATED_RADICAL    9
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . .  prpfunc.c
*/
extern FunctionList *MergeFunctMolProperties(FunctionList *old);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . .  molprt.c
*/
extern INT MasterPrintCurrentMolecules(BindStructure *bind);
extern INT MasterPrintCurrentSubStructures(BindStructure *bind);
extern INT MasterPrintMoleculeSet(BindStructure *bind, INT cflag);

extern MoleculeInfo *FindMoleculeInMoleculeSet(INT id, MoleculeSet *set);
extern void PrintPrettyMoleculeInfo(CHAR *prefix, FILE *file, 
				    MoleculeInfo *molecule,
				    SetOfPropertyTypes *types);

/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . .  molprp.c
*/
extern void StoreMolFileInfo(MolFileMolecule *molfile,
			     MoleculeSet *molecules,
			     SetOfPropertyTypes *types);
extern MoleculeSet *InitializeMoleculeSet(INT id, CHAR *name);
extern SetOfPropertyTypes *InitializeMolecularPropertyTypes(INT id, CHAR *name);
extern CHAR *PrintStringArrheniusFormValue(CHAR *out, INT *length,
					   CHAR *prefix,
					   ArrheniusFormValue *constants);
extern ArrheniusFormValue *FillInArrheniusFormValue(CHAR *string,
						    ArrheniusFormValue *constants);
extern void ProduceChemkinGenPropValue(GenPropValue *value,
				       ChemkinThermoRead *chemkin);
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
extern ReadInMoleculeSet *ReadInASCIIMolecules(FILE *file, INT max);
extern INT LocalReadASCIIMoleculeProps(BindStructure *bind);
extern void FillInMoleculePropertyValues(ReadInMoleculeSet *asciimolset, 
					 MoleculeSet *molset,
					 BindStructure *bind);


/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . .  scndcorr.c
*/
extern INT CurrentMoleculeBensonThermo(BindStructure *bind);
extern INT MolSubBensonThermo(MoleculeSet *molset,BensonCalculation *tree,FILE *file);
extern INT PrintOutMolThermo(BindStructure *bind);
extern SetOfTables *InitializeSetOfTables(INT id, CHAR *name);
extern void StoreBensonInMolecule(MoleculeInfo *molecule,
				  BensonSecondThermoTable *benson,
				  SetOfPropertyTypes *types);
extern BensonSecondThermoTable *ComputeBensonThermoForGraph(Graph *graph,
							    BensonCalculation *tree,
							    FILE *file);
extern CHAR *PrintStringBensonSecondThermoTable(CHAR *in, INT *length, CHAR *prefix,
						BensonSecondThermoTable *thermo);


/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
extern INT ReadInChemkinThermoFile(BindStructure *bind);
extern SetOfChemkinThermoInformation *ChemkinThermoReadSetOfMolecules(FILE *file,
								      INT id, CHAR *name,
								      INT max);
extern INT ChemkinMoleculeThermoRead(FILE *file,
				     ChemkinThermoRead *thermo);
extern INT ChemkinThermPrintOutStandard(BindStructure *bind);
extern INT WriteOutStandardChemkinThermo(FILE *file,
					 SetOfChemkinThermoInformation *set);
extern void StringMoleculeStandardChemkinThermo(CHAR *string,
						ChemkinThermoRead *thermo);

/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . ben2ndorder.c
*/
extern INT BindReadIn2ndOrdBensonTable(BindStructure *bind);
extern INT ReadIn2ndOrderBensonTable(FILE *file, 
				     BensonSecondOrderTable *table,
				     SetOfBensonAtomTranslationPairs *translation);
extern INT ChemkinThermPrintOutStandard(BindStructure *bind);
extern INT WriteOutStandardSecondOrderBensonTableSet(FILE *file,
						     SetOfBenson2ndOrderTables *set,
						     SetOfBensonAtomTranslationPairs *translation);
extern CHAR *StringSecondOrderBensonTableThermo(CHAR *string,
						INT *length,
						BensonSecondOrderTable *thermo,
						SetOfBensonAtomTranslationPairs *translation);
extern CHAR *BensonSecondOrderLine(CHAR *in, INT *length, 
				   BensonSecondOrder *value,
				   SetOfBensonAtomTranslationPairs *translation);
extern INT PrintOutBensonTables(BindStructure *bind);


extern INT ReadInBensonTranslationTables(BindStructure *bind);
extern INT ReadInBensonTranslationPairs(FILE *file, 
					SetOfBensonAtomTranslationPairs *translation);
extern INT PrintBensonAtomTranslation(BindStructure *bind);
extern CHAR *StringBensonTranslationTable(CHAR *in,INT *length,
					  SetOfBensonAtomTranslationPairs *pairs);
extern INT TranslateAtomSymbol(CHAR *string, 
			       SetOfBensonAtomTranslationPairs *translation);
extern CHAR *TranslateValenceToString(INT valence, 
				      SetOfBensonAtomTranslationPairs *translation);
extern INT ReadInBensonSingleLine(CHAR *line, 
				   INT count,
				   BensonSecondOrder *value,
				  SetOfBensonAtomTranslationPairs *translation);
extern INT FillInThermoValues(CHAR *line, 
			      BensonSecondThermoTable *thermo);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . bensonord.c
*/
extern BensonCalculation *InitializeBensonCalculation(INT id, CHAR *name);
extern INT SetUpSecondOrderTable(BindStructure *bind);
extern BensonSecondOrderTable *CondenseToOneBensonTable(SetOfBenson2ndOrderTables *tables);
extern INT PrintOut2ndOrderBensonTree(BindStructure *bind);
extern CHAR *PrintStringSecondOrderBensonTree(CHAR *string, INT *length,
					      SecondOrderBensonTree *tree);
extern CHAR *PrintStringCentralAtomBranch(CHAR *string,
					  INT *length,
					  CentralAtomBranch *branch);
extern CHAR *PrintStringBensonConnectionTree(CHAR *string, INT *length,
					     BensonConnectionTree *tree,
					     CHAR *prefix);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . molread.c
*/
extern INT AddToCurrentMolecules(BindStructure *bind);
extern INT AddToCurrentSubStructures(BindStructure *bind);
extern INT ReadInMoleculesFromList(BindStructure *bind,INT cflag);
extern INT AddSDFToCurrentMolecules(BindStructure *bind);
extern INT AddSDFToCurrentSubStructures(BindStructure *bind);
extern INT ReadSDFMolecules(BindStructure *bind, INT cflag);
extern void ChargeAndRadicalFromMolFileSpec(INT charge,MolFileAtom *atom);


extern SetOfMolFileMetaAtoms *MetaAtomInfoRead(CHAR *name, FILE *file);
extern void StoreMolFileInfo(MolFileMolecule *molfile,
			     MoleculeSet *molecules,
			     SetOfPropertyTypes *types);
extern void ReadMFMol( FILE *file, MolFileMolecule *molecule,
		      SetOfMolFileMetaAtoms *metaatomset);
extern void PrintPrettyMolFile(CHAR *prefix, FILE *file,
			       MolFileMolecule *molecule );
extern void PrintPrettySetOfMolMetaAtoms(CHAR *prefix,FILE *out,
					 SetOfMolFileMetaAtoms *set);
extern INT ReadSDFMol( FILE *file, MolFileMolecule *molecule,
		      SetOfMolFileMetaAtoms *metaatoms);
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
extern INT FillInSubGraphCurrentMolecules(BindStructure *bind);
extern INT FillInSubGraphCurrentSubStructures(BindStructure *bind);
extern INT FillInSubGraphMolsSubs(MoleculeSet *molset);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . .  benson2chemkin.c
*/
extern ChemkinThermoRead *CalculateChemkinCoefficients(BensonSecondThermoTable *bentable,
						       FLOAT *temperatures, INT NumberOfTemps);
extern INT ChemkinFromBensonCalc(BindStructure *bind);
extern INT TransferChemkinToTables(BindStructure *bind);
extern void  ChemkinFromBensonForSet(MoleculeSet *molset);
extern void ChemkinFromBensonMolecule(MoleculeInfo *molecule,
				      SetOfPropertyTypes *types,
				      FLOAT *temperatures, INT NumberOfTemps);
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
extern INT ChemkinToBensonTest(BindStructure *bind);
extern CHAR *PrintChemkinToBensonFromMoleculeSet(CHAR *string, INT *length, CHAR *prefix,
						 MoleculeSet *molset,
						 INT numtemps,FLOAT *temperatures);
extern INT CalculateBensonFromChemkinThermoValue(BensonSecondThermoTable *benson,
						 ChemkinThermoRead *chemkin,
						 INT numtemps,FLOAT *temperatures);
extern FLOAT ChemkinCPseries(ChemkinThermoRead *chemkin, FLOAT temperature);
extern FLOAT ChemkinHFseries(ChemkinThermoRead *chemkin, FLOAT temperature);
extern FLOAT ChemkinS0series(ChemkinThermoRead *chemkin, FLOAT temperature);
