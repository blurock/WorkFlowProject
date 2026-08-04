/*  FILE     trnscorr.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Find the correspondences of the transform in the set of molecules.
**    The representation is a tree structure with each level dealing
**    with one of the transform graphs.  Within a level is the set
**    of matchings for all the molecules
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

#define DEBUG DEBUG0

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void FindNextLevel(GraphTransformGraphTree *graphtree,
			  INT id, CHAR *name,
			  DataSubSetVector *atomsets,
			  Graph *graphset, INT numgraphs,
			  Graph *tgraph, INT numtgraphs);


/*F graphtree = FindGraphSetReactionCorr(transform,mols,datasets,flag)
**
**  DESCRIPTION
**    transform: The graph transform to match in molecules
**    mols: The set of moleucules in which to match the transform
**    datasets: The subsets of atoms available to match within the mols
**    direction: Reaction (REACTANT) or Retrosynthetic (PRODUCT)
**    graphtree: The tree of correspondences
**
**    Given a graph transform (transform) , find all the instances 
**    of the reaction (REACTANT) or product (PRODUCT) graphs 
**    in the set of molecule graphs (mols) 
**    This is the setup routine for FindTransformGraphTree
**
**    Each level of the tree corresponds to a graph within the transform.
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
extern GraphTransformGraphTree *FindGraphSetReactionCorr(GraphTransform *transform,
							 SetOfGraphs *mols,
							 DataSubSetVector *datasets,
							 INT flag)
     {
     Graph *transset;
     INT transnum;
     GraphTransformGraphTree *graphtree;
     
     switch(flag)
	  {
     case PRODUCT:
	  transset = transform->GraphRHS;
	  transnum = transform->NumberRHS;
	  break;
     case REACTANT:
	  transset = transform->GraphLHS;
	  transnum = transform->NumberLHS;
	  break;
     default:
	  transset = 0;
	  transnum = 0;
	  Error(-1,"Fatal Error, GraphTransformGraphTee");
	  }
     
     graphtree = AllocateGraphTransformGraphTree;
     FindTransformGraphTree(graphtree,
			    transform->ID,transform->Name,
			    datasets,
			    mols->Graphs,mols->NumberOfGraphs,
			    transset,transnum);
     return(graphtree);
     }

 
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void ChangeSetOfPairSetsName(char *name,SetOfPairSets *corrs)
{
  PairSet *corr;
  int i;
  
  corr = corrs->Sets;
  for(i=0;i<corrs->NumberOfSets;i++)
    {
      corr->Name = CopyString(name);
      corr++;
    }
  
}

 
/*F graphtree = FindTransformGraphTree(graphtree, id,name,atomsets,graphset,numgraphs,tgraph,numtgarphs)
**
**  DESCRIPTION
**    graphtree: Allocated space for GraphTransformGraphTree
**    id: Id of graphtree
**    name: name of graphtree
**    atomsets: The set of available atoms within the graphs
**    graphset: The set of graphs (molecules) to match
**    numgraphs: The number of graphs
**    tgraph: The set of transform graphs
**    numtgraphs: The number of transform graphs
**
**    This is a recursive routine through the transform graphs.  Each call
**    deals with the current transform graph and generates a level of the
**    GraphTransformGraphTree.
**
**    - Set up TransformGraphCorrSet
**    - Set up initial set of atoms (ALL_ATOMS) for transform graphs
**    - Loop through sets of graphs
**      There is one pair correspondence set for each molecule
**      - Find current transform graph in molecule (root search is made to simplify)
**        The result is a SetOfPairSets
**      - If the set of correspondences return is zero store the empty set,
**        otherwise store the non-empty set
**    - Prepare for next level
**      - if no more tgraphs, then stop
**      - total is number of ways the tgraph fits into the total set of graphs
**        This is the number of branches of the tree
**      - FindNextLevel is the interface for the next recursion
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
extern GraphTransformGraphTree *FindTransformGraphTree(GraphTransformGraphTree *graphtree,
						       INT id, CHAR *name,
						       DataSubSetVector *atomsets,
						       Graph *graphset, INT numgraphs,
						       Graph *tgraph, INT numtgraphs)
     {
     TransformGraphCorrSet *corrset;
     SetOfPairSets *corrs,*pairsets;
     Graph *graph,*newtgraph;
     DataSubSet *atomset,*tatomset;
     INT total,i,root,newnumtgraph;
     
     if(numtgraphs == 0)
	  return(0);
						       
     corrset = AllocateTransformGraphCorrSet;
     CreateTransformGraphCorrSet(corrset,id,name,
				 numgraphs,0);

     tatomset = AllocateDataSubSet;
     SetUpAtomSetFromGraph(tatomset,ALL_ATOMS,tgraph);
     root = *(tatomset->Points);
     
#if DEBUG >= DEBUG3
     printf("FindTransformGraphTree: Current Reaction Part\n");
     PrintPrettyGraph("Rxn--",stdout,tgraph);
#endif     
     corrs = corrset->TransformPairSet;
     graph = graphset;
     atomset = atomsets->Vector;
     total = 0;
     LOOPi(numgraphs)
	  {
	  pairsets = FindSubGraphsRoot(root,tgraph->Name,
				       graph,atomset,
				       tgraph,tatomset);
#if DEBUG >= DEBUG2
	  printf("Graph %5d--------------------------\n",i); 
#endif
#if DEBUG >= DEBUG3
	  printf("FindTransformGraphTree: Current Reaction Part\n");
	  PrintPrettyGraph("LOOP-",stdout,tgraph);
#endif     
#if DEBUG >= DEBUG2
	  PrintPrettySetOfPairSets(pairsets);
#endif
          FilterOutEquivalentPairSets(pairsets);
#if DEBUG >= DEBUG2
	  PrintPrettySetOfPairSets(pairsets);
#endif
	  if(pairsets == 0)
	       {
	       CreateSetOfPairSets(corrs,graph->ID,graph->Name,
				   0,0);
	       }
	  else
	       {
	       CopyFullSetOfPairSets(corrs,pairsets);
	       ChangeSetOfPairSetsName(tgraph->Name,corrs);
	       FreeSetOfPairSets(pairsets);
	       Free(pairsets);
	       total += corrs->NumberOfSets;
	       }
	  corrs++;
	  graph++;
	  atomset++;
	  }
     

     newtgraph = tgraph + 1;
     newnumtgraph = numtgraphs - 1;
     
     if(newnumtgraph == 0)
	  {
	  CreateGraphTransformGraphTree(graphtree,
					id,name,
					0,
					0,0);
	  graphtree->CorrSets = corrset;
	  }
     else 
	  {
	  CreateGraphTransformGraphTree(graphtree,
					id,name,
					0,
					total,0);
	  graphtree->CorrSets = corrset;
	  FindNextLevel(graphtree,id,name,
			atomsets,graphset,numgraphs,newtgraph,newnumtgraph);
	  }
     FreeDataSubSet(tatomset);
     Free(tatomset);
     
     return(graphtree);
     }
 
/*f FindNextLevel(graphtree,id,name,atomsets,graphset,numgraphs,tgraph,numtgraphs
**
**  DESCRIPTION
**    Each of the TransformGraphCorrSet structures corresponds to a branch of the
**    next GraphTransformGraphTree.  This is the interface to the recursive call
**    to FindTransformGraphTree.  
**
**    For each TransformGraphCorrSet (gcorrset), the next call to FindTransformGraphTree
**    is made with the next transform graph.
**
**  REMARKS
**
*/
static void FindNextLevel(GraphTransformGraphTree *graphtree,
			  INT id, CHAR *name,
			  DataSubSetVector *atomsets,
			  Graph *graphset, INT numgraphs,
			  Graph *tgraph, INT numtgraphs)
     {
     GraphTransformGraphTree *subtree;
     TransformGraphCorrSet *gcorrset;
     SetOfPairSets *corrset;
     PairSet *pairset;
     INT i,j;
     
     subtree = graphtree->SubTree;
     gcorrset = graphtree->CorrSets;
     corrset = gcorrset->TransformPairSet;
     LOOPi(gcorrset->NumberOfGraphs)     
	  {
	  pairset = corrset->Sets;
	  LOOPj(corrset->NumberOfSets)
	       {
	       FindTransformGraphTree(subtree,id,name,
				      atomsets,
				      graphset,numgraphs,
				      tgraph,numtgraphs);
	       pairset++;
	       subtree++;
	       }
	  corrset++;
	  }
     }
 
/*F atomsets = SetUpAtomSetsForReaction(grxn,flag,atomsettype)
**
**  DESCRIPTION
**    grxn: The reaction with the graphs
**    flag: Reaction (REACTANT) or retrosynthetic (PRODUCT) direction
**    atomsettype: ALL_ATOMS, etc. for SetUpAtomSetFromGraph routine
**
**    For each of the graphs of the reactants (REACTANT) or products
**    (PRODUCT), the atomsets are found. 
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
extern DataSubSetVector *SetUpAtomSetsForReaction(GraphReaction *grxn,
						  INT flag,
						  INT atomsettype)
     {
     DataSubSetVector *datasubsets;
     DataSubSet *atomset;
     Graph *mol;
     INT i,num;
     
     
     switch(flag)
	  {
     case REACTANT:
	  mol = grxn->GraphLHS;
	  num = grxn->NumberLHS;
	  break;
     case PRODUCT:
	  mol = grxn->GraphRHS;
	  num = grxn->NumberRHS;
	  break;
     default:
	  mol = 0;
	  num = 0;
	  Error(-1,"Error In SetUpAtomsSetsForReaction");
	  }
     
     datasubsets = AllocateDataSubSetVector;
     CreateDataSubSetVector(datasubsets,grxn->ID,grxn->Name,
			    num,0);
     atomset = datasubsets->Vector;
     LOOPi(num)
	  {
	  SetUpAtomSetFromGraph(atomset,atomsettype,mol);
	  atomset++;
	  mol++;
	  }
     return(datasubsets);
     }
