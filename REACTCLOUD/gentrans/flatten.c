/*  FILE     flatten.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Make the correspondence tree into a linear list.  
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
static SetOfGraphNodePairs *FlattenSubTree(INT level,
					   SetOfGraphNodePairs *currentpairset,
					   SetOfGraphNodePairs *pairs,
					   GraphTransformGraphTree *tree);
static SetOfGraphNodePairs 
     *MergePairSetToSetOfGraphNodePairs(INT transID,
					INT graphID,
					PairSet *pairset,
					SetOfGraphNodePairs *gnps);
static INT CountNumberOfTransformedGraphs(GraphTransformGraphTree *tree);
static INT  CountNumberOfTransformedGraphsLoop(INT count,
					       GraphTransformGraphTree *tree);

 
/*F set = FlattenTransformCorrTree(tree)
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
extern TotalSetOfTransformPairs
     *FlattenTransformCorrTree(GraphTransformGraphTree *tree)
     {
     TotalSetOfTransformPairs *set;
     SetOfGraphNodePairs *pairset;
     INT num;
     
     num = CountNumberOfTransformedGraphs(tree);
     
     set = AllocateTotalSetOfTransformPairs;
     CreateTotalSetOfTransformPairs(set,tree->ID,tree->Name,
				    num,0);
     pairset = AllocateSetOfGraphNodePairs;
     CreateSetOfGraphNodePairs(pairset,tree->ID,tree->Name,
			       0,0);

     FlattenSubTree(0,set->PairSets,pairset,tree);

     FreeSetOfGraphNodePairs(pairset);
     Free(pairset);
     
     return(set);
     }
 
/*f nodepairs = FlattenSubTree(level,currentpairset,pairs,tree)
**
**  DESCRIPTION
**    level: The level of the tree, the molecule number in the transform
**    currentpairset: The set of pairsets extracted thus far
**    pairs: The node pairs of the path to this node
**    tree: The current subtree
**
**    Each node of the tree has the pairset of the molecules in one list
**    of SetOfPairSets.  Each PairSet has its own subtree unless it is the
**    last graph.  A depth first traveling through the tree is done.  
**    All the pairsets of the nodes in one path in the tree are merged together
**    (MergePairSetToSetOfGraphNodePairs).  When at
**    a terminal node, the pairset is added to the total list (currentpairset).
**
**  REMARKS
**
*/
static SetOfGraphNodePairs *FlattenSubTree(INT level,
					   SetOfGraphNodePairs *currentpairset,
					   SetOfGraphNodePairs *pairs,
					   GraphTransformGraphTree *tree)
     {
     GraphTransformGraphTree *subtrees;
     TransformGraphCorrSet *graphset;
     SetOfPairSets *graphcorrs;
     PairSet *pairset;
     SetOfGraphNodePairs *merged;
     INT i,j;
     
     subtrees = tree->SubTree;
     graphset = tree->CorrSets;
     graphcorrs = graphset->TransformPairSet;
     /*   
     printf("-----------------------------------------------------------\n");
     printf("FlattenSubTree: Begin: Set of Pair Sets\n");
     PrintPrettySetOfPairSets(graphcorrs);
     printf("FlattenSubTree: End: Set of Pair Sets\n");
     printf("-----------------------------------------------------------\n");
     */
     LOOPi(graphset->NumberOfGraphs)
	  {
	  pairset = graphcorrs->Sets;
	  LOOPj(graphcorrs->NumberOfSets)
	       {
	       merged = 
		    MergePairSetToSetOfGraphNodePairs(level,i,pairset,
						      pairs);
	       if(tree->NumberOfSubTrees == 0)
		    {
		    CopyFullSetOfGraphNodePairs(currentpairset,merged);
		    currentpairset++;
		    }
	       else
		    {
		    currentpairset = 
			 FlattenSubTree(level + 1,currentpairset,merged,subtrees);
		    subtrees++;
		    }
	       FreeSetOfGraphNodePairs(merged);
	       Free(merged);
	       pairset++;
	       }
	  graphcorrs++;
	  }
     return(currentpairset);
     }
 
/*f merged = MergePairSetToSetOfGraphNodePairs(transID,graphID,pairset,gnps)
**
**  DESCRIPTION
**    transID: The graph within the transform for the pair
**    graphID: The graph within the molecules for the pair
**    pairset: The pairset to be merged
**    gnps: The set old set of pairs
**    merged: The new set of pairs
**
**    The pairs of PairSet are merged into a SetOfGraphNodePairs structure.
**    The transform and molecule id's are added to the pairset info when added
**    (these are the same for the current pairset):
**    - Allocate and Create a new SetOfGraphNodePairs
**    - Copy the old pairs into the new
**    - Loop through the pairs in the PairSet to merge.
**      - Create a new GraphNodePair
**      - Transfer the node information
**
**  REMARKS
**
*/
static SetOfGraphNodePairs 
     *MergePairSetToSetOfGraphNodePairs(INT transID,
					INT graphID,
					PairSet *pairset,
					SetOfGraphNodePairs *gnps)
     {
     INT num,i;
     SetOfGraphNodePairs *new;
     GraphNodePair *newgraphnode,*oldgraphnode;
     Pair *pair;
     
     num = pairset->NumberOfPairs + gnps->NumberOfPairs;

     new = AllocateSetOfGraphNodePairs;
     CreateSetOfGraphNodePairs(new,gnps->ID,gnps->Name,
			       num,0);
     
     newgraphnode = new->Pairs;
     oldgraphnode = gnps->Pairs;
     LOOPi(gnps->NumberOfPairs)
	  {
	  CopyFullGraphNodePair(newgraphnode,oldgraphnode);
	  newgraphnode++;
	  oldgraphnode++;
	  }
     
     pair = pairset->Pairs;
     LOOPi(pairset->NumberOfPairs)
	  {
	  CreateGraphNodePair(newgraphnode,
			      pair->ID,pair->Name,
			      0,0);
	  newgraphnode->TransformN = AllocateGraphNode;
	  CreateGraphNode(newgraphnode->TransformN,pair->ID,pair->Name,
			  transID,pair->J);
	  newgraphnode->GraphN = AllocateGraphNode;
	  CreateGraphNode(newgraphnode->GraphN,pair->ID,pair->Name,
			  graphID,pair->I);
	  pair++;
	  newgraphnode++;
	  }
     return(new);
     }
 
/*f count = CountNumberOfTransformedGraphs(tree)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT CountNumberOfTransformedGraphs(GraphTransformGraphTree *tree)
     {
     INT num;
     
     num = CountNumberOfTransformedGraphsLoop(0,tree);
     return(num);
     }
 
/*f count = CountNumberOfTransformedGraphsLoop(count,tree)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT  CountNumberOfTransformedGraphsLoop(INT count,
					       GraphTransformGraphTree *tree)
     {
     GraphTransformGraphTree *subtrees;
     TransformGraphCorrSet *graphset;
     SetOfPairSets *graphcorrs;
     PairSet *pairset;
     INT i,j;
     
     subtrees = tree->SubTree;
     graphset = tree->CorrSets;
     graphcorrs = graphset->TransformPairSet;
     LOOPi(graphset->NumberOfGraphs)
	  {
	  pairset = graphcorrs->Sets;
	  LOOPj(graphcorrs->NumberOfSets)
	       {
	       if(tree->NumberOfSubTrees == 0)
		    count++;
	       else
		    {
		    count = CountNumberOfTransformedGraphsLoop(count,subtrees);
		    subtrees++;
		    }
	       pairset++;
	       }
	  graphcorrs++;
	  }
     return(count);
     }

