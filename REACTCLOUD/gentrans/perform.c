/*  FILE     perform.c
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
static INT PerformSingleReaction(CombinedGraph *combined,
				   SetOfGraphNodePairs *nodepairs,
				   GraphTransform *transform,
				 INT flag);
static void PerformNodeTransformations(CombinedGraph *combined,
				       SetOfGraphNodePairs *nodepairs,
				       GraphTransform *totaltransform,
				       INT flag);
static INT PerformBondTransformations(CombinedGraph *combined,
				       SetOfGraphNodePairs *nodepairs,
				       GraphTransform *transform,
				      INT flag);
static INT PerformBondMakes(CombinedGraph *combined, 
			     BondTransforms *bondtransforms,
			    SetOfGraphNodePairs *nodepairs);
static INT PerformBondBreaks(CombinedGraph *combined, 
			      BondTransforms *bondtransforms,
			     SetOfGraphNodePairs *nodepairs);
static INT TranslateAtomNumber(INT molecule,
			       INT node,
			       SetOfGraphNodePairs *pairs,
			       CombinedGraph *combined);

/*F ComputeSingleReaction(nodepairs,setofcombined,graphtransform,totaltransformsets,flag)
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
extern void ComputeSingleReaction(SetOfGraphNodePairs *nodepairs,
				  SetOfCombinedGraphs *setofcombined,
				  GraphTransform *graphtransform,
				  TotalSetOfTransformPairs *totaltransformsets,
				  INT flag)
     {
     INT count,i,illegal;
     CombinedGraph *combined;
     SetOfGraphNodePairs *newnodepairs;
     
     count = 0;
     combined = setofcombined->CGraphs;
     newnodepairs = totaltransformsets->PairSets;
     LOOPi(setofcombined->NumberOfCGraphs)
	  {
	  illegal = PerformSingleReaction(combined,newnodepairs,
					  graphtransform,flag);
	  
	  if(illegal != 1)
	       {
	       combined->ID = count;
	       newnodepairs->ID = count;
	       count++;
	       }
	  else
	       {
		 printf("Error in Performing Reaction: %d:%s\n",
			graphtransform->ID,
			graphtransform->Name);
		 
		 combined->ID = -1;
		 newnodepairs->ID = -1;
	       }
	  
	  newnodepairs++;
	  combined++;
	  }
     }
 
/*f illegal = PerformSingleReaction(combined,nodepairs,transform,flag)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT PerformSingleReaction(CombinedGraph *combined,
				   SetOfGraphNodePairs *nodepairs,
				   GraphTransform *transform,
				  INT flag)
     {
     INT error;

#if DEBUG >= DEBUG2
     printf("Combined Graph Before Transformation\n");
     PrintPrettyGraph("Before----->",stdout,combined->Combined);
#endif
     PerformNodeTransformations(combined,nodepairs,transform,flag);
     error = PerformBondTransformations(combined,nodepairs,transform,flag);
#if DEBUG >= DEBUG2
     printf("Combined Graph After Transformation\n");
     PrintPrettyGraph("After----->",stdout,combined->Combined);
#endif
     return(error);
     }

 
/*f error = PerformBondTransformations(combined,nodepairs,transform,flag)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void PerformNodeTransformations(CombinedGraph *combined,
				       SetOfGraphNodePairs *nodepairs,
				       GraphTransform *totaltransform,
				       INT flag)
     {
     GraphNode *aftertransform,*beforetransform;
     Graph *graph,*transformgraph;
     INT graphnode,*nodetypes,*transformtypes,nnode,ntrans,i;
     SetOfNodeTransforms *set;
     NodeTransform *transform;
     
     graph = combined->Combined;
     nodetypes = graph->NodeTypes;
     
     set = totaltransform->Nodes;
     
     transform  = set->Transforms;
     LOOPi(set->NumberOfNodeTransforms)
	  {
	  switch(flag)
	       {
	  case PRODUCT:
	       aftertransform = transform->LHSnode;
	       beforetransform = transform->RHSnode;
	       transformgraph = totaltransform->GraphLHS
		     + aftertransform->Molecule;
	       break;
	  case REACTANT:
	       aftertransform = transform->RHSnode;
	       beforetransform = transform->LHSnode;
	       transformgraph = totaltransform->GraphRHS 
		    + aftertransform->Molecule;
	       break;
	  default:
	       Error(-1,"Fatal Error in PerformNodeTransOnCombined");
	       aftertransform = 0;
	       beforetransform = 0;
	       transformgraph = 0;
	       break;
	       }
	  transformtypes = transformgraph->NodeTypes;
	  
	  graphnode = TranslateAtomNumber(beforetransform->Molecule,
					      beforetransform->GNode,
					      nodepairs,
					      combined);
	  nnode = *(nodetypes + graphnode);
	  ntrans = *(transformtypes + aftertransform->GNode);
	  if( ntrans / VAL_ATOMIC_NUMBER > META_ATOM_OFFSET)
	       ntrans = nnode;
#if DEBUG >= DEBUG3
	  printf("Node Transform (%5d -> %5d)  %10d -> %10d\n",
		 aftertransform->GNode,
		 graphnode,
		 nnode,
		 ntrans);
#endif	       
	  *(nodetypes + graphnode)  = ntrans;
	  
	  transform++;
	  }
     }

 
/*f error = PerformBondTransformations(combined,nodepairs,transform,flag)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT PerformBondTransformations(CombinedGraph *combined,
				       SetOfGraphNodePairs *nodepairs,
				       GraphTransform *transform,
				       INT flag)
     {
     BondTransforms *bondtransforms;
     INT errormake,errorbreak;
     
     switch(flag)
	  {
     case PRODUCT:
	  bondtransforms = transform->Bonds->RHStransform;
	  break;
     case REACTANT:
	  bondtransforms = transform->Bonds->LHStransform;
	  break;
     default:
	  bondtransforms = 0;
	  Error(-1,"Fatal Error PerformReactionsToCombineGraphs");
	  }

     errormake = PerformBondMakes(combined,bondtransforms,nodepairs);
     errorbreak = PerformBondBreaks(combined,bondtransforms,nodepairs);
     if(errormake == 1 || errorbreak == 1)
	  return(1);
     else 
	  return(0);
     }
 
/*f errormake = PerformBondMakes(combined,bondtransforms,nodepairs)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT PerformBondMakes(CombinedGraph *combined, 
			     BondTransforms *bondtransforms,
			     SetOfGraphNodePairs *nodepairs)
     {
     GraphBond *bondtransform;
     INT i,gnodei,gnodej,errori,errorj;
     Neighbor *ni,*nj;
     
     errori = 0;
     errorj = 0;
     
     bondtransform = bondtransforms->BondsMade;
     LOOPi(bondtransforms->NumberOfBondsMade)
	  {
	  gnodei = TranslateAtomNumber(bondtransform->MoleculeI,
					   bondtransform->GNodeI,
					   nodepairs,
					   combined);
	  
	  gnodej = TranslateAtomNumber(bondtransform->MoleculeJ,
					   bondtransform->GNodeJ,
					   nodepairs,
					   combined);
	  
	  ni = GetIthNeighbor(gnodei,combined->Combined);
	  nj = GetIthNeighbor(gnodej,combined->Combined);
	  errori = AddElementToNeighbor(gnodei,nj);
	  errorj = AddElementToNeighbor(gnodej,ni);
	  
#if DEBUG >= DEBUG3 
	  printf("BondsMade:   moleculeI:%5d moleculeJ:%5d (errors: %5d %5d)\n",
		 bondtransform->MoleculeI,bondtransform->MoleculeI,
		 errori,errorj);
	  printf("BondsMade: (%5d %5d) -> (%5d %5d)\n",
		 bondtransform->GNodeI,
		 bondtransform->GNodeJ,
		 gnodei,gnodej);
	  PrintPrettyNeighbor("New Neighbors - I",ni);
	  PrintPrettyNeighbor("New Neighbors - J",nj);
#endif	  
	  bondtransform++;
	  }
     if(errori == 1 || errorj == 1)
	  return(1);
     else 
	  return(0);
     }

 
/*f errorbreak = PerformBondBreaks(combined,bondtransforms,nodepairs)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT PerformBondBreaks(CombinedGraph *combined, 
			      BondTransforms *bondtransforms,
			      SetOfGraphNodePairs *nodepairs)
     {
     GraphBond *bondtransform;
     INT i,gnodei,gnodej,errori,errorj;
     Neighbor *ni,*nj;
     
     errori = 0;
     errorj = 0;
     
     bondtransform = bondtransforms->BondsBroken;
     LOOPi(bondtransforms->NumberOfBondsBroken)
	  {
	  gnodei = TranslateAtomNumber(bondtransform->MoleculeI,
				       bondtransform->GNodeI,
				       nodepairs,
					   combined);
	  
	  gnodej = TranslateAtomNumber(bondtransform->MoleculeJ,
					   bondtransform->GNodeJ,
					   nodepairs,
					   combined);
	  
	  ni = GetIthNeighbor(gnodei,combined->Combined);
	  nj = GetIthNeighbor(gnodej,combined->Combined);
	  errori = RemoveElementFromNeighbor(gnodei,nj);
	  errorj = RemoveElementFromNeighbor(gnodej,ni);

#if DEBUG >= DEBUG3 
	  printf("BondsBroken:  moleculeI:%5d moleculeJ:%5d (errors: %5d %5d)\n",
		 bondtransform->MoleculeI,bondtransform->MoleculeI,
		 errori,errorj);
	  printf("BondsBroken: (%5d %5d) -> (%5d %5d)\n",
		 bondtransform->GNodeI,
		 bondtransform->GNodeJ,
		 gnodei,gnodej);
	  PrintPrettyNeighbor("New Neighbors - I",ni);
	  PrintPrettyNeighbor("New Neighbors - J",nj);
#endif	  
	  bondtransform++;
	  }
     if(errori == 1 || errorj == 1)
	  return(1);
     else
	  return(0);
     }

 
/*f nodeid = translateAtomNumber(molecule,node,pairs,combined)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT TranslateAtomNumber(INT molecule,
			       INT node,
			       SetOfGraphNodePairs *pairs,
			       CombinedGraph *combined)
     {
     INT newmolecule,newnode,count,cnode;
     GraphNode *gnode;
     GraphNodePair *pair;
     
     newmolecule = -1;
     newnode = -1;
     count = 0;
     pair = pairs->Pairs;
     while(newmolecule == -1 && count < pairs->NumberOfPairs)
	  {
	  gnode = pair->TransformN;
	  if(molecule == gnode->Molecule && node == gnode->GNode)
	       {
	       newnode = pair->GraphN->GNode;
	       newmolecule = pair->GraphN->Molecule;
	       }
	  pair++;
	  count++;
	  }
     if(newmolecule >= 0)
	  cnode = GetCombinedAtomNode(newmolecule,newnode,combined);
     else
	  {
	  cnode = -1;
	  Error(-1,"Error In TranslateAtomNumber");
	  }
     return(cnode);
     }
