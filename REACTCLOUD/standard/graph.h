#include "datmat0.h"

#include "graphs/sgr.h"
#include "graphs/pair.h"

#include "molconstants.h"

#define MAXIMUM_NUMBER_OF_BONDS 100
#define HEAVY_ATOMS    0
#define ALL_ATOMS      1

#define SUBGRAPH_SUBGRAPH      1
#define SUBGRAPH_EQUAL         2

#define REACTANT    0
#define PRODUCT     1


/**************************************************************************/
/* subgraph.c routines    */
/**************************************************************************/
extern SetOfPairSets *FindSubGraphsRoot(INT root1, CHAR *name,
					Graph *graph1, DataSubSet *set1,
					Graph *graph2, DataSubSet *set2);
extern SetOfPairSets *BasicSubGraph(Graph *graph1,
				    Graph *graph2);
extern void SetUpTotalGraphSet(DataSubSet *sub, Graph *graph);
extern INT IsSubGraph(INT flag,
		      Graph *graph1, DataSubSet *set1,
		      Graph *graph2, DataSubSet *set2);

extern SetOfPairSets *FindSubGraphFromPairSet(INT root1, CHAR *name,
					      SetOfPairSets *pairset,
					      Graph *graph1, DataSubSet *set1,
					      Graph *graph2, DataSubSet *set2);
extern PairSet *SetOfBonds(Graph *graph, DataSubSet *set, INT MaxNumberOfBonds);


/**************************************************************************/
/* graph0.c routines    */
/**************************************************************************/
extern Neighbor *Neighbors(int I, Graph *graph, DataSubSet *dataset);
extern Neighbor *NeighborsInDataSubSet(Neighbor *neighbors, DataSubSet *data);
extern void PrintPrettyNeighbor(CHAR *prefix, Neighbor *neighbors);
extern DataSubSet *NeighborToDataSubSet(Neighbor *neighbor);
extern DataSubSet *FindAtomsOfType(INT Type, Graph *graph, DataSubSet *set);
extern INT NthNodeType(INT pointer, Graph *graph);
extern DataSubSet *SubtractDataSubSet(INT id, CHAR *name,
				      DataSubSet *set1, DataSubSet *set2);
extern DataSubSetVector *FindNodesInLevelsFromNode(INT node, 
						   Graph *graph,
						   DataSubSet *all,
						   INT MaxLevels);
extern void PrintPrettyGraph(CHAR *prefix, FILE *file, Graph *graph);
extern DataSubSetVector *SetUpMoleculeAtomSets(SetOfGraphs *graphs, INT flag);
extern void SetUpAtomSetFromGraph(DataSubSet *subset,
				  INT flag,
				  Graph *graph);
extern INT RemoveElementFromNeighbor(INT n, Neighbor *neighbor);
extern INT AddElementToNeighbor(INT n, Neighbor *neighbor);
extern Neighbor *GetIthNeighbor(INT i,Graph *graph);
extern DataSubSet *NeighborsFromDataSubSet(Graph *graph,
					   DataSubSet *set,
					   DataSubSet *rest);

extern void PrintPrettySetOfGraphs(CHAR *prefix, FILE *out, SetOfGraphs *set);

/**************************************************************************/
/* graph1.c routines    */
/**************************************************************************/
extern INT GraphInSet(Graph *graph, SetOfGraphs *set);
extern INT GraphsEqual(Graph *graph1, Graph *graph2);
extern INT GraphsEqualSet(Graph *graph1, DataSubSet *set1,
			  Graph *graph2, DataSubSet *set2);

/**************************************************************************/
/* graph2.c routines    */
/**************************************************************************/
extern DataSubSet *IdentifySetOfGraphs(SetOfGraphs *set,
				       SetOfGraphs *reference);
extern SetOfGraphs *ReduceSetOfGraphs(SetOfGraphs *set);
extern SetOfGraphs *SeparateOutGraphs(Graph *graph);
extern SetOfGraphs *AddGraphToSet(Graph *graph, SetOfGraphs *set);
extern DataSubSet *UpdateSetOfGraphs(SetOfGraphs *newelements,
				     SetOfGraphs *total);
extern SetOfGraphs *ExtendSetOfGraphs(SetOfGraphs *newelements,
				      SetOfGraphs *total);
extern Graph *IsolateGraphWithDataSubSet(Graph *graph,
					 DataSubSet *subset);

/**************************************************************************/
/* graph3.c routines    */
/**************************************************************************/
extern CombinedGraph *InitializeCombinedGraph(GraphReaction *rxn,
					     CombinedGraph *combined,
					      INT flag);
extern CombinedGraph *AddGraphToCombined(Graph *graph, CombinedGraph *combined);
extern INT GetCombinedAtomNode(INT molecule, INT node, CombinedGraph *graph);
extern void AddToSetOfCombinedGraphs(CombinedGraph *graph, 
				     SetOfCombinedGraphs *set);
extern SetOfGraphs *LastNGraphs(INT n, SetOfGraphs *set);
extern SetOfGraphs *UnionSetOfGraphs(SetOfGraphs *set1, SetOfGraphs *set2);

/**************************************************************************/
/* pairset.c routines    */
/**************************************************************************/
extern DataSubSet *RemoveI(INT point, DataSubSet *subset);
extern void PrintPrettyPair(Pair *pair);
extern void PrintPrettyPairSet(PairSet *set);
extern void PrintPrettySetOfPairSets(SetOfPairSets *sets);
extern SetOfPairSets *SetOfPairPermutations(DataSubSet *dataset1,
					    DataSubSet *dataset2);
extern SetOfPairSets *MergeTwoSetOfPairSets(SetOfPairSets *set1,
                                     SetOfPairSets *set2);
extern SetOfPairSets *ConcatTwoSetOfPairSets(SetOfPairSets *set1,
					     SetOfPairSets *set2);
extern DataSetPair *DataSubSetFromPairSet(PairSet *set);
extern SetOfPairSets *SplitDuplicateSetsOfPairSets(SetOfPairSets *sets);
extern INT TranslateFirstToSecond(INT first,
				  PairSet *pairs);
extern INT TranslateSecondToFirst(INT second,
				  PairSet *pairs);
extern SetOfPairSets *FilterOutEquivalentPairSets(SetOfPairSets *pairsets);
extern int PairSetsEqual(PairSet *set1,PairSet *set2);
/**************************************************************************/
/* path.c routines    */
/**************************************************************************/
DataSubSetVector *FindSetOfPaths(Graph *graph, int (*comp)());
