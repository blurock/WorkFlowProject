#include "rxn/rxninfo.h"
#include "rxn/rxnascii.h"

#define BIND_CURRENT_REACTIONS 2010
#define BIND_CURRENT_PATTERNS 2010

#define INTIAL_CURRENT_RXNS   300

#define REACTION_PRINT_OUT_SUFFIX      "out"
#define RXN_FILE_LIST_SUFFIX           "lst"
#define RXN_FILE_SUFFIX                "rxn"

#define SAME_PROPS        0
#define GT_PROPS         -1
#define DONT_KNOW        0

#define FORWARD_REACTION_CONSTANTS        1
#define REVERSE_REACTION_CONSTANTS        2
#define EQUILIBRIUM_REACTION_CONSTANTS    3
#define ENTHALPY_OF_REACTION              4
#define RXNCONSTANTS_LINKED_LIST_SIZE     200

#define FORWARD_REVERSE    1
#define FORWARD_REACTION   2

#define REACTION_DELIMITOR '='
#define FORWARD_DELIMITOR '>'

#define CHARGE_EQUAL(c1,c2) (fabs((double) c1-c2) < (double) 0.0005)

#define RXN_ID_BY_NUMBER    1
#define RXN_ID_BY_NAME      2 

#define MAX_CURRENT_REACTIONS  200
#define INC_CURRENT_REACTIONS  100

/****************************************************************************/
/* Routines from rxnfunc.c   */
/****************************************************************************/
extern FunctionList *MergeFunctReactions(FunctionList *old);
/****************************************************************************/
/* Routines from rxntype.c   */
/****************************************************************************/
extern ReactionSet *FormCanonicalReactionSet(ReactionSet *set,
					     MoleculeSet *molecules);
/****************************************************************************/
/* Routines from rxnprt.c   */
/****************************************************************************/
extern void PrintPrettyReactionSet(CHAR *prefix, FILE *file,
				   ReactionSet *set);
extern void PrintPrettyRxnCorrespondenceSet(CHAR *prefix, FILE *file,
					    RxnCorrespondenceSet *set);
extern void PrintPrettyRxnUnMatchedSet(CHAR *prefix, FILE *file,
				       RxnUnMatchedSet *set);
extern void PrintPrettyRxnBondChanges(CHAR *prefix, FILE *file,
				      RxnBondChanges *changes);
extern void PrintReactionSetParameters(FILE *file,
				       CHAR *prefix,
				       ReactionSet *reactions,
				       MoleculeSet *molecules);
extern CHAR *PrintStringReactionDataConstants(CHAR *out, INT *length,
					      CHAR *prefix,
					      ReactionDataConstants *constants);
extern void PrintPrettyReactionInfo(CHAR *prefix, FILE *file, 
				    ReactionInfo *rxn,
				    SetOfPropertyTypes *types);
extern ReadInMoleculeSet *FindMoleculesInReactionSet(ReactionSet *set);

/****************************************************************************/
/* Routines from rxn0.c   */
/****************************************************************************/
extern INT StoreReactionMolFileInfo(MolFileReaction *rxnmolfile,
				    ReactionSet *reactions,
				    MoleculeSet *molecules,
				    int storemolecules,
				    BindStructure *bind);
extern RxnCorrespondenceSet *RxnCorrFromMolFile(MolFileReaction *rxn);
extern void DetermineChangedBonds(RxnCorrespondenceSet *corr,
				  MolFileReaction *rxn);
extern ReactionInfo *FindReactionFromString(CHAR *rxnname,ReactionSet *set);
extern ReactionInfo *FindReactionInReactionSet(INT id, ReactionSet *set);
extern ReactionInfo *FindReactionInReactionSetByName(CHAR *name, ReactionSet *set);
extern ReactionSet *MergeReactionSets(ReactionSet *rxnset1,
				      ReactionSet *rxnset2);

/****************************************************************************/
/* Routines from rxn1.c   */
/****************************************************************************/
extern INT ReadInReactionsFromList(BindStructure *bind);
extern INT ReadInRxnPatternsFromList(BindStructure *bind);
extern INT ReadInReactionsFromListAndDB(BindStructure *bind);
extern INT ReadInRxnPatternsFromListAndDB(BindStructure *bind);
extern INT MasterPrintReactionSet(BindStructure *bind);
extern INT MasterPrintRxnPatterns(BindStructure *bind);


extern DataSubSet *GetListOfReactions(BindStructure *bind);
extern ReactionSet *InitializeReactionSet(INT id, CHAR *name);
extern INT FindReactionPattern(BindStructure *bind);
extern INT MasterReactionOrder(BindStructure *bind);
extern DataSubSet *ReadInReactionList(CHAR *dir,
				      CHAR *name,
				      CHAR *suffix,
				      INT flag,
				      ReactionSet *set,
				      BindStructure *bind);
extern ReactionSet *ReplaceBindReactionSet(ReactionSet *rxnset,
					   BindStructure *bind);
/****************************************************************************/
/* Routines from rxnprps.c   */
/****************************************************************************/
extern SetOfPropertyTypes *InitializeReactionPropertyTypes(INT id, CHAR *name);
extern ReactionDataConstants *FillInReactionDataConstants(CHAR *string,
							  ReactionDataConstants *constants);
extern ArrheniusFormValue *TransferReactionConstants(GenPropValue *value,
						     SetOfPropertyTypes *types);
extern GenPropValue *FindBestReactionValue(INT flag,SetOfPropertyValues *values);
/****************************************************************************/
/* Routines from asciiread.c   */
/****************************************************************************/
extern ReadInMoleculeSet *DetermineSetOfASCIIMolecules(ASCIIReactionSet *rxnset);
extern ReactionSet *ASCIIMoleculesInReaction(ASCIIReactionSet *asciirxnset,
					     ReadInMoleculeSet *asciimolset,
					     MoleculeSet *molset);
extern void FillInMolecules(INT *molecules, 
			    ReadInMoleculeSet *asciimolset,
			    MoleculeSet *molset);
extern INT FindASCIIInMolSet(ReadInMolecule *asciimol, 
			     MoleculeSet *molset);
extern ASCIIReactionSet *ReadInASCIIReactions(FILE *file, INT max);
extern void FillInReactionPropertyValues(ASCIIReactionSet *asciirxnset, 
					 ReactionSet *rxnset,
					 BindStructure *bind);


extern INT ReadInASCIISetOfReactions(BindStructure *bind);
extern INT ReadInASCIISetOfRxnPatterns(BindStructure *bind);


extern void FillInASCIIValueToReactionInfo(ASCIIProperties *asciipropset,
					   SetOfPropertyValues *propset,
					   SetOfPropertyTypes *types,
					   BindStructure *bind);
extern void ReadRXNMolFile(FILE *file, 
			   MolFileReaction *reaction,
			   SetOfMolFileMetaAtoms *metaatomset);

extern INT AtomsInMolFileReaction(MolFileReaction *rxn);
extern INT BondsInMolFileReaction(MolFileReaction *rxn);
extern INT DBPrintAllReactions(BindStructure *bind);
extern INT DBPrintAllRxnPatterns(BindStructure *bind);
