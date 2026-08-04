#include "gentrans/gtrns.h"
#include "gentrans/rset.h"
#include "gentrans/chain.h"

#define TRANSFORM_LIST_SUFFIX   "lsr"
#define TRANSFORM_MOLECULE_SUFFIX "lsm"

#define PERFORMED_MOLECULE_SUFFIX     "lso"
#define PERFORMED_MECHANISM_SUFFIX    "m"
#define PERFORMED_PRIMARY_SUFFIX      "p"
#define PERFORMED_SPECIES_SUFFIX      "e"

#define NODE_PAIR_REACTANT  1
#define NODE_PAIR_TRANSFORM 2

/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . iteration.c
*/
extern void PerformOneReactionIteration(PerformedRxnMaster *rxnpmaster);
extern void PerformReactionTransform(GraphTransform *transform,
				     PerformedRxnInfo *adjust,
				     SetOfGraphs *gmol,
				     DataSubSetVector *atomsets,
				     PerformedRxnMaster *rxnpmaster);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . .  trnscorr.c
*/
extern GraphTransformGraphTree *FindGraphSetReactionCorr(GraphTransform *transform,
							 SetOfGraphs *mols,
							 DataSubSetVector *datasets,
							 INT flag);
extern GraphTransformGraphTree *FindTransformGraphTree(GraphTransformGraphTree *graphtree,
						       INT id, CHAR *name,
						       DataSubSetVector *atomsets,
						       Graph *graphset, INT numgraphs,
						       Graph *tgraph, INT numtgraphs);
extern DataSubSetVector *SetUpAtomSetsForReaction(GraphReaction *grxn,
						  INT flag,
						  INT atomsettype);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . flatten.c
*/
extern TotalSetOfTransformPairs
*FlattenTransformCorrTree(GraphTransformGraphTree *tree);

 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . .  combined.c
*/
extern void ComputeSetOfCombinedGraphs(SetOfGraphs *gmol,
				       SetOfGraphNodePairs *nodepairs,
				       SetOfCombinedGraphs *setofcombined,
				       TotalSetOfTransformPairs *totaltransformsets);
extern DataSubSet 
     *ListOfMoleculesFromGraphNodePairs(INT flag,
					SetOfGraphNodePairs *nodepairs);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . .  update.c
*/
extern void PutPerformedReactionMaster(PerformedRxnMaster *performed,
				       BindStructure *bind);
extern PerformedRxnMaster *UpdatePerformedRxnMaster(PerformedRxnMaster *total,
						    PerformedRxnMaster *newelement);
extern DataSubSet 
     *UpdatePerformedRxnMasterMolecules(PerformedRxnMaster *new,
					SetOfGraphs *total,
					SetOfGraphs *newelements);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . readchain.c
 */
extern ChainSequence *ReadInChainSequenceList(CHAR *dir,
					      CHAR *name,
					      CHAR *suffix,
					      INT molflag,
					      INT rxnflag,
					      BindStructure *bind);
extern ReadChainSet *ReadInChainDefinition(BindStructure *bind);
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . . setup.c
*/
extern SetOfPerformedRxnInfo *SetUpChainAdjustments(ChainSequenceElement *element,
						    INT flag,
						    BindStructure *bind);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . trnsprint.c
*/
extern void PrintPrettyLevelResult(PerformedRxnMaster *rxnpmaster);
extern void PrintPrettySetOfPerformedRxns(CHAR *prefix, FILE *out,
					  SetOfPerformedRxns *prxns);
extern void PrintPrettyPerformedRxns(CHAR *prefix, FILE *out,
				     PerformedRxn *prxn);
extern void PrintPrettyGraphTransform(CHAR *prefix,
				      FILE *out,
				      GraphTransform *transform);
extern void PrintPrettySetOfNodeTransforms(CHAR *prefix,
					   FILE *out,
					   SetOfNodeTransforms *transform);
extern CHAR *StringNodeTransform(CHAR *prefix, NodeTransform *node, CHAR *line);
extern CHAR *StringGraphNode(CHAR *prefix, GraphNode *node, CHAR *line);
extern void PrintPrettyBondTransformSet(CHAR *prefix, FILE *out, 
					BondTransformSet *set);
extern void PrintPrettyBondTransforms(CHAR *prefix, FILE *out,
				      BondTransforms *transform);
extern CHAR *StringGraphBond(CHAR *prefix, GraphBond *bond, CHAR *line);
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
extern void FilterOutSetOfGraphs(SetOfGraphs *set);
extern INT FilterGraphOut(Graph *graph);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . formrxn.c
*/
extern void SeparateToFormReaction(SetOfGraphNodePairs *nodepairs,
				   SetOfCombinedGraphs *setofcombined,
				   SetOfGraphs *setofresults,
				   SetOfPerformedRxns *setofrxns);
extern void AddPerformedRxnFromSetIfUnique(SetOfPerformedRxns *new,
					   SetOfPerformedRxns *total,
					   PerformedRxnInfo *adjust);
extern void CanonicalPerformedRxn(PerformedRxn *performed);
extern INT CanonicalPerformedRxnEqual(PerformedRxn *pr1,
				      PerformedRxn *pr2);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . .  rxn2trns.c
*/
extern INT ReactionSetToGraphTransformSet(BindStructure *bind);
extern INT ConvertReactionToGraphTransform(GraphTransform *transform,
					    ReactionInfo *rxn,
					    BindStructure *bind);
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
extern void ComputeSingleReaction(SetOfGraphNodePairs *nodepairs,
				  SetOfCombinedGraphs *setofcombined,
				  GraphTransform *graphtransform,
				  TotalSetOfTransformPairs *totaltransformsets,
				  INT flag);
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . .  chain.c 
*/
extern PerformedRxnMaster *ChainReactionSet(ChainSequence *chain,
					    INT direction,
					    SetOfGraphs *molecules,
					    BindStructure *bind);
extern INT PerformChain(BindStructure *bind);

 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . genfunc.c
*/
extern FunctionList *MergeFunctGenTrans(FunctionList *old);
