#include "property.h"

#include "molecules/mlf.h"
#include "molecules/bnd.h"
#include "molecules/chrg.h"
#include "molecules/prop.h"
#include "molecules/mol.h"
#include "molecules/mollst.h"

#include "atominf.h"

#include "molconstants.h"

#define BIND_CURRENT_MOLECULES       2007
#define BIND_CURRENT_SUBSTRUCTURES   2008
/****************************************************************************/

#define MOL_ID_BY_NUMBER      1
#define MOL_ID_BY_NAME        2

#define SUBGRAPH_HEAVY    1
#define SUBGRAPH_ALL     2

/****************************************************************************/
/* electron.c                                                                   */
/****************************************************************************/
extern MoleculeElectronic *ElectronicFromMolFile(MolFileMolecule *molecule);

/****************************************************************************/
/* mol0.c                                                                   */
/****************************************************************************/
extern void PrintPrettyMolFile(CHAR *prefix, FILE *file,
			       MolFileMolecule *molecule );
extern void PrintPrettyMoleculeSet(CHAR *prefix, FILE *file,
				   MoleculeSet *set);
extern MoleculeInfo *FindMoleculeFromString(CHAR *name,
					    MoleculeSet *set);
extern MoleculeInfo *FindMoleculeInMoleculeSet(INT id, MoleculeSet *set);
extern MoleculeInfo *FindMoleculeInMoleculeSetByName(CHAR *name,
						     MoleculeSet *set);
extern MoleculeSet *MergeMoleculeSets(MoleculeSet *molset1,
				      MoleculeSet *molset2);
/****************************************************************************/
/* mol1.c                                                                   */
/****************************************************************************/
extern INT ExportMolecules(BindStructure *bind);
extern INT ReadMolFileMetaAtoms(BindStructure *bind);
extern FunctionList *MergeFunctMolecules(FunctionList *old);
extern MoleculeSet *ExtractThenInitialMoleculeSet(INT source,
						  BindStructure *bind);
extern MoleculeSet *ReplaceBindMoleculeSet(MoleculeSet *molset,BindStructure *bind);
extern MoleculeSet *GetMoleculeSetMaster(BindStructure *bind);
extern SetOfMolFileMetaAtoms *GetMetaAtomMaster(BindStructure *bind);
extern INT MasterPrintMetaAtoms(BindStructure *bind);
extern INT ComputeElectronicPropsMolecules(BindStructure *bind);
extern INT ComputeElectronicPropsSubStructures(BindStructure *bind);
extern INT ComputeElectronPropsMolSubs(BindStructure *bind, INT dbflag);
extern DataSubSet *GetListOfMolecules(BindStructure *bind);
extern INT PrintMoleculeAsGraph(BindStructure *bind);
extern DataSubSet *SetUpAtomSet(INT id, INT flag,
				BindStructure *bind);
extern INT SetOfSubGraphs(BindStructure *bind);
extern DataSubSet *ReadInMoleculeList(CHAR *dir,
				      CHAR *name,
				      CHAR *suffix,
				      INT flag,
				      MoleculeSet *set,
				      BindStructure *bind);
extern PropValue *MasterFindAtomProperty(INT id, INT atm, INT prop, 
					 MoleculeSet *molecules);
extern Graph *GraphFromMolecule(INT id, 
				INT valence,
				BindStructure *bind);
extern void GraphFromMoleculeForArrays(Graph *graph,
				       INT id, 
				       INT valence,
				       BindStructure *bind);
extern SetOfGraphs *PutMoleculeSetInSetOfGraphs(DataSubSet *molids,
						INT valence,
						BindStructure *bind);
extern SetOfGraphs *TranslateMoleculeSetToSetOfGraphs(MoleculeSet *molset,
						      INT valence,
						      SetOfGraphMetaAtoms *graphmetaatoms);
extern INT PrintMoleculeAsMolFile(FILE *file, MoleculeInfo *mol);

/****************************************************************************/
/* valence.c                                                                */
/****************************************************************************/
extern MoleculeAtomCounts *DetermineAtomCounts(MoleculeInfo *molinfo);
extern CHAR *PrintStringMoleculeAtomCounts(CHAR *string, INT *length, CHAR *prefix,
					   MoleculeAtomCounts *atomcounts);
extern MolFileMolecule *AddHydrogens(MolFileMolecule *molecule);
extern INT CountLonePairsOfAtom(INT group, INT numbonds);
extern INT AtomGroupFromMolFile(INT atomid, MolFileMolecule *mol);
extern INT AtomGroupFromElectrons(INT electrons);
extern INT *CountBondsToAtom(INT atomid, MolFileMolecule *mol);
extern INT SingleBondsNotSpecified(INT group, INT lonepairs, INT numbonds);
extern INT NumberOfHydrogensToAdd(INT atomid, MolFileMolecule *mol);
extern INT AdjustAtomicNumber(INT an);
/****************************************************************************/
/* atominf.c                                                                */
/****************************************************************************/
extern CHAR *AtomNameFromAtomicNumber(INT num);
extern void PrtStatAtomInfoSet(INT start,INT finish);
extern INT AtomicNumberFromSymbol(CHAR *symbol);



/****************************************************************************/
/* atmprps.c                                                                   */
/****************************************************************************/
extern PropValue *FindAtomProperty(MoleculeInfo *mol, 
				   INT atm, INT prop);


extern MoleculeElectronic *InitializeFromMolFile(MolFileMolecule *molecule);
extern void InitialAtomElectronic(MoleculeElectronic *molecule);
extern FLOAT ShiftElectrons(MoleculeElectronic *molecule);
extern void ComputeElectronic(MoleculeElectronic *electronic);
extern void PrintPrettySetOfResonances(CHAR *prefix, FILE *file,
				      SetOfResonances *sets);
extern void PrintPrettyMoleculeElectronic(CHAR *prefix, FILE *file,
					  MoleculeElectronic *molecule);
extern void PrintPrettyAtomElectronic(CHAR *prefix, FILE *file,
				      AtomElectronic *atom,INT NAtoms);
extern INT DetermineAtomValenceValue(INT atomicnumber,
				     INT hydrogens,
				     INT charge,
				     INT radical,
				     INT lonepairs,
				     INT resonance,
				     INT s,
				     INT d,
				     INT t);
/**************************************************************************/
/* molgrph.c routines    */
/**************************************************************************/
extern INT DetermineValenceValue(INT atomid,
				 INT valence,
				 MoleculeInfo *molecule);
extern Graph *GraphFromMolFile(MoleculeInfo *molinfo,
			       INT valence);

extern INT IsValenceAHeavyAtom(INT type, INT valence);
extern void NeighborsFromMoleFile(INT id, Neighbor *neighbor, 
				  MolFileMolecule *molecule);
extern GraphReaction *PutSetOfGraphsInGraphReaction(SetOfGraphs *molset,
						    INT flag);
extern SetOfGraphMetaAtoms 
     *TranslateSetOfMolfileMetaAtoms(SetOfMolFileMetaAtoms *setmolmeta);
extern void GraphFromMolFileForArrays(Graph *graph,
				      MoleculeInfo *molinfo,
				      INT valence);
/**************************************************************************/
/* molgrph1.c routines    */
/**************************************************************************/
extern DataSubSet *SetUpAtomSetForMolecule(INT flag,
					   MoleculeInfo *molecule);
extern DataSubSet *SetUpAtomSetForGraph(INT flag,
					INT valencetype,
					Graph *graph);
extern SetOfPairSets *IterativeSubGraphPairs(Graph *graph1,
					     Graph *graph2);
/**************************************************************************/
/* molgrph2.c routines    */
/**************************************************************************/
extern DataSubSet *SetWithoutHydrogen(Graph *graph);
extern DataSubSet *IdentifySetOfGraphsWithoutHydrogens(SetOfGraphs *new,
						       SetOfGraphs *reference);
extern DataSubSet *IdentifyGraphsInMaster(SetOfGraphs *graphs, BindStructure *bind);


/**************************************************************************/
/* molgrph3.c routines    */
/**************************************************************************/
extern MoleculeSet *TransferSetOfGraphsToMoleculeSet(SetOfGraphs *graphset);
extern MolFileMolecule *GraphToMolFile(Graph *graph);
extern void GraphToMoleculeInfo(MoleculeInfo *mol, SetOfPropertyTypes *proptypes,Graph *graph);
/**************************************************************************/
/* mollist.c routines    */
/**************************************************************************/
extern ReadInMoleculeSet *ReadInMoleculeNamesFromFile(BindStructure *bind,INT max);
extern ReadInMoleculeSet *ReadInMoleculesFromLine(CHAR *line, 
						  CHAR delimitor,
						  INT max);
extern ReadInMoleculeSet *MergeReadInMoleculeSet(ReadInMoleculeSet *set1, 
						 ReadInMoleculeSet *set2);
