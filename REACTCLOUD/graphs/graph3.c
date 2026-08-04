#include "basic.h"

#include "graph.h"

static void TransferReactionToCombined(Graph *graphs, INT num,
				       CombinedGraph *combined);
static void TransferSetOfNeighbors(Neighbor *new,
				   Neighbor *old,
				   INT offset);

/*******************************************************************************/
/* These are a set of routines dealing with CombinedGraphs                     */
/*******************************************************************************/


/******************************************************************************/
/* InitializeCombinedGraph
  This routine sets up the set of molecules participating in the reaction
  (in the left or right hand side of the structure GraphReaction) and puts
  them into one (unconnected) graph.  It is on this graph that the reaction 
  will be preformed.
*/
extern CombinedGraph *InitializeCombinedGraph(GraphReaction *rxn,
					     CombinedGraph *combined,
					     INT flag)
     {
     Graph *graphs,*graph;
     INT i,num,count,*begin;
     
     switch(flag)
	  {
     case REACTANT:
	  graphs = rxn->GraphLHS;
	  num    = rxn->NumberLHS;
	  break;
     case PRODUCT:
	  graphs = rxn->GraphRHS;
	  num    = rxn->NumberRHS;
	  break;
     default:
	  graphs = 0;
	  num = 0;
	  Error(-1,"Error in CountNodesInGraphReaction");
	  break;
	  }
     
     CreateCombinedGraph(combined,rxn->ID,rxn->Name,
			 0,num,0);
     
     begin = combined->Begins;
     graph = graphs;
     count = 0;
     LOOPi(num)
	  {
	  *begin = count;
	  count += graph->NumberOfNodes;
	  begin++;
	  graph++;
	  }
     
     combined->Combined = AllocateGraph;
     CreateGraph(combined->Combined,rxn->ID,rxn->Name,
		 count,0,0,0);
     

     TransferReactionToCombined(graphs,num,combined);

     return(combined);
     }
/******************************************************************************/
extern CombinedGraph *AddGraphToCombined(Graph *graph, CombinedGraph *combined)
     {
     CombinedGraph *newcombined;
     Graph *oldgraph,*newgraph;
     INT i,*newbegin,*oldbegin,*node,*newnode;
     Neighbor *neighbors,*newneighbors;
     
     newcombined = AllocateCombinedGraph;
     CreateCombinedGraph(newcombined,combined->ID,combined->Name,
			 0,
			 combined->NumberOfBegins + 1,
			 0);
     
     oldgraph = combined->Combined;
     newgraph = newcombined->Combined = AllocateGraph;
     if(oldgraph != 0)
	  CreateGraph(newcombined->Combined,combined->ID,combined->Name,
		      oldgraph->NumberOfNodes + graph->NumberOfNodes,0,0,0);
     else
	  CreateGraph(newcombined->Combined,combined->ID,combined->Name,
		      graph->NumberOfNodes,0,0,0);
	  
	  
     newbegin = newcombined->Begins;
     oldbegin = combined->Begins;
     LOOPi(combined->NumberOfBegins)
	  *newbegin++ = *oldbegin++;

     if(oldgraph != 0)
	  *newbegin = oldgraph->NumberOfNodes;
     else 
	  *newbegin = 0;
     
     newnode = newgraph->NodeTypes;
     newneighbors = newgraph->Neighbors;
     if(oldgraph != 0)
	  {
	  node = oldgraph->NodeTypes;
	  neighbors = oldgraph->Neighbors;
	  LOOPi(oldgraph->NumberOfNodes)
	       {
	       *newnode++ = *node++;
	       CopyFullNeighbor(newneighbors,neighbors);
	       newneighbors++;
	       neighbors++;
	       }
	  }
     node = graph->NodeTypes;
     neighbors = graph->Neighbors;
     LOOPi(graph->NumberOfNodes)
	  {
	  *newnode++ = *node++;
	  TransferSetOfNeighbors(newneighbors,neighbors,*newbegin);
	  newneighbors++;
	  neighbors++;
	  }

     return(newcombined);
     }

/******************************************************************************/
extern void AddToSetOfCombinedGraphs(CombinedGraph *graph, 
				     SetOfCombinedGraphs *set)
     {
     SetOfCombinedGraphs *newset;
     CombinedGraph *newgraph,*oldgraph;
     INT i;
     
     newset= AllocateSetOfCombinedGraphs;
     CreateSetOfCombinedGraphs(newset,set->ID,set->Name,
			       set->NumberOfCGraphs + 1,
			       0);
     newgraph = newset->CGraphs;
     oldgraph = set->CGraphs;
     LOOPi(set->NumberOfCGraphs)
	  {
	  CopyFullCombinedGraph(newgraph,oldgraph);
	  newgraph++;
	  oldgraph++;
	  }
     CopyFullCombinedGraph(newgraph,graph);

     FreeSetOfCombinedGraphs(set);
     CopyFullSetOfCombinedGraphs(set,newset);
     FreeSetOfCombinedGraphs(newset);
     Free(newset);
     }
     
/******************************************************************************/
extern INT GetCombinedAtomNode(INT molecule, INT node, CombinedGraph *graph)
     {
     INT cnode;
     
     if(molecule >= graph->NumberOfBegins)
	  Error(-1,"Error In GetCombinedAtomNode");
	  
     cnode = *(graph->Begins + molecule) + node;
     
     return(cnode);
     }
/******************************************************************************/
/*   Utility Routines
*/
/******************************************************************************/
     
static void TransferReactionToCombined(Graph *graphs, INT num,
				       CombinedGraph *combined)
     {
     INT *begin,*newnodes,*nodes,*offset,i,j;
     Graph *newgraph;
     Neighbor *newneighbors,*neighbors;
     
     begin = combined->Begins;
     newgraph = combined->Combined;
     newnodes = newgraph->NodeTypes;
     newneighbors = newgraph->Neighbors;
     offset = combined->Begins;
     LOOPi(num)
	  {
	  nodes = graphs->NodeTypes;
	  neighbors = graphs->Neighbors;
	  LOOPj(graphs->NumberOfNodes)
	       {
	       *newnodes = *nodes;
	       TransferSetOfNeighbors(newneighbors,neighbors,*offset);
	       newnodes++;
	       nodes++;
	       newneighbors++;
	       neighbors++;
	       }
	  graphs++;
	  offset++;
	  }
     }

static void TransferSetOfNeighbors(Neighbor *new,
				   Neighbor *old,
				   INT offset)
     {
     INT i,*nnew,*nold;
     
     CreateNeighbor(new,old->ID,old->Name,
		     old->NumberOfNeighbors,0);
     
     nnew = new->List;
     nold = old->List;
     LOOPi(new->NumberOfNeighbors)
	  {
	  *nnew = *nold + offset;
	  nnew++;
	  nold++;
	  }
     }

