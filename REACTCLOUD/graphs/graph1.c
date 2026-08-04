#include "basic.h"
#include "graph.h"

static SetOfGraphs *SeparateOutGraphsIterative(SetOfGraphs *set,
					       Graph *graph, 
					       DataSubSet *rest);
static void NeighborsSubSet(Neighbor *sub, Neighbor *orig, DataSubSet *subset);
static void TranslateNeighborSet(Neighbor *new, INT *transformations);

#define DEBUG DEBUG0


#if DEBUG >= DEBUG3
static void PrintIntegerVector(CHAR *prefix, DataSubSet *subset);
#endif

/*******************************************************************************/
/*  These routines deal with separating out unconnected subgraphs from a given 
    graph:

            ReduceSetOfGraphs - 
                      Input - A SetOfGraphs
                      Output  A new SetOfGraphs containing the set of unique 
                              connected graphs within the original set of graphs.

	    SeparateOutGraphs
                      Input   A Single Graph (unconnected)
                      Output  A SetOfGraphs containing the set of connected graphs
*/                             
/*******************************************************************************/


extern SetOfGraphs *ReduceSetOfGraphs(SetOfGraphs *set)
     {
     SetOfGraphs *newset,*added,*separated;
     Graph *current,*sepgraph;
     INT i,j;
     
     newset = AllocateSetOfGraphs;
     CreateSetOfGraphs(newset,set->ID,set->Name,
		       0,0);
     
     current = set->Graphs;
     LOOPi(set->NumberOfGraphs)
	  {
	  separated = SeparateOutGraphs(current);
	  sepgraph = separated->Graphs;
	  LOOPj(separated->NumberOfGraphs)
	       {
	       if(GraphInSet(sepgraph,newset) == -1)
		    {
		    added = AddGraphToSet(sepgraph,newset);
		    FreeSetOfGraphs(newset);
		    Free(newset);
		    newset = added;
		    }
	       sepgraph++;
	       }
	  FreeSetOfGraphs(separated);
	  Free(separated);
	  current++;
	  }
     return(newset);
     }

extern SetOfGraphs *SeparateOutGraphs(Graph *graph)
     {
     SetOfGraphs *set,*newset;
     DataSubSet *subset;
     
     subset = AllocateDataSubSet;
     SetUpAtomSetFromGraph(subset,ALL_ATOMS,graph);

     set = AllocateSetOfGraphs;
     CreateSetOfGraphs(set,graph->ID,graph->Name,0,0);
     
     newset = SeparateOutGraphsIterative(set,graph,subset);
     
     FreeDataSubSet(subset);
     Free(subset);
     FreeSetOfGraphs(set);
     Free(set);
  
     return(newset);
     }

static SetOfGraphs *SeparateOutGraphsIterative(SetOfGraphs *set,
					       Graph *graph, 
					       DataSubSet *dataset)
     {
     DataSubSet *atomset,*newatomset,*newrest,*neighbors,*rest;
     SetOfGraphs *added,*fullset;
     Graph *subgraph;
     INT done;
#if DEBUG >= DEBUG3
     INT i;
     printf("-------------------SeparateOutGraphsIterative---------\n");
     printf("Original Graph to Separate Out\n");
     PrintPrettyGraph("Combined---",stdout,graph);
     printf("Current Isolated Set (%d graphs) \n",set->NumberOfGraphs);
     subgraph = set->Graphs;
     LOOPi(set->NumberOfGraphs)
	  {
	  PrintPrettyGraph("Isolated====",stdout,subgraph);
	  subgraph++;
	  }
     printf("Sets of Atoms to Be Isolated\n");
     PrintIntegerVector("Set of Atoms",dataset);
#endif
     
     if(dataset->NumberOfPoints == 0)
	  {
	  fullset = AllocateSetOfGraphs;
	  CopyFullSetOfGraphs(fullset,set);
	  return(fullset);
	  }
     
     atomset = AllocateDataSubSet;
     CreateDataSubSet(atomset,graph->ID,graph->Name,
		      1,1,0);
     *(atomset->Points) = *(dataset->Points);
     rest = SubtractDataSubSet(graph->ID,graph->Name,
				  dataset,atomset);

     done = 0;
     while(done == 0)
	  {
	  neighbors = NeighborsFromDataSubSet(graph,atomset,rest);
#if DEBUG >= DEBUG3
	  PrintIntegerVector("Neighbors",neighbors);
#endif
	  
	  if(neighbors->NumberOfPoints == 0)
	       done = 1;
	  else
	       {
	       newatomset = MergeDataSubSets(graph->Name,graph->ID,
					     atomset,neighbors);
#if DEBUG >= DEBUG3
	       PrintIntegerVector("NewAtomSet",newatomset);
#endif
	       newrest = SubtractDataSubSet(graph->ID,graph->Name,
					    rest,neighbors);
#if DEBUG >= DEBUG3
	       PrintIntegerVector("TheRest",newrest);
#endif
	       FreeDataSubSet(atomset);
	       Free(atomset);
	       FreeDataSubSet(rest);
	       Free(rest);
	       atomset = newatomset;
	       rest = newrest;
	       }
	  FreeDataSubSet(neighbors);
	  Free(neighbors);
	  }
     subgraph = IsolateGraphWithDataSubSet(graph,atomset);
     
#if DEBUG >= DEBUG3
     PrintPrettyGraph("IsolatedGraph",stdout,subgraph);
#endif

     added = AddGraphToSet(subgraph,set);

     FreeDataSubSet(atomset);
     Free(atomset);
     FreeGraph(subgraph);
     Free(subgraph);

     fullset = SeparateOutGraphsIterative(added,graph,rest);
     FreeSetOfGraphs(added);
     Free(added);
     FreeDataSubSet(rest);
     Free(rest);

     return(fullset);
     }

extern Graph *IsolateGraphWithDataSubSet(Graph *graph,
					 DataSubSet *subset)
     {
     Graph *newgraph;
     INT *transformed,i,*nodetype,*node;
     Neighbor *neighbor,*newneighbor;
     
     newgraph = AllocateGraph;
     CreateGraph(newgraph,graph->ID,graph->Name,
		 subset->NumberOfPoints,0,0,graph->MetaAtoms);
     
     transformed = AllocArrayINT(graph->NumberOfNodes);
     
     node = subset->Points;
     nodetype = newgraph->NodeTypes;
     newneighbor = newgraph->Neighbors;
     LOOPi(subset->NumberOfPoints)
	  {
	  *nodetype = NthNodeType(*node,graph);
	  *(transformed + *node) = i;
	  
	  neighbor = GetIthNeighbor(*node,graph);
	  NeighborsSubSet(newneighbor,neighbor,subset);
	  
	  node++;
	  nodetype++;
	  newneighbor++;
	  }
     
     newneighbor = newgraph->Neighbors;
     LOOPi(newgraph->NumberOfNodes)
	  {
	  TranslateNeighborSet(newneighbor,transformed);
	  newneighbor++;
	  }
     
     Free(transformed);
     return(newgraph);
     }

static void NeighborsSubSet(Neighbor *sub, Neighbor *orig, DataSubSet *subset)
     {
     INT *norig,*nnew,i;
     
     CreateNeighbor(sub,orig->ID,orig->Name,
		    orig->NumberOfNeighbors,0);
     
     sub->NumberOfNeighbors = 0;
     norig = orig->List;
     nnew  = sub->List;
     LOOPi(orig->NumberOfNeighbors)
	  {
	  if(IntegerMemberOf(*norig,subset->Points,subset->NumberOfPoints))
	       {
	       *nnew = *norig;
	       nnew++;
	       sub->NumberOfNeighbors += 1;
	       }
	  norig++;
	  }
     }

static void TranslateNeighborSet(Neighbor *new, INT *transformations)
     {
     INT *nb,i;
     
     nb = new->List;
     LOOPi(new->NumberOfNeighbors)
	  {
	  *nb = *(transformations + *nb);
	  nb++;
	  }
     }

extern SetOfGraphs *AddGraphToSet(Graph *graph, SetOfGraphs *set)
     {
     SetOfGraphs *newset;
     Graph *g,*setgraph;
     INT i;
     
     newset = AllocateSetOfGraphs;
     CreateSetOfGraphs(newset,set->ID,set->Name,
		       set->NumberOfGraphs + 1,
		       0);
     
     g = newset->Graphs;
     setgraph = set->Graphs;
     LOOPi(set->NumberOfGraphs)
	  {
	  CopyFullGraph(g,setgraph);
	  g++;
	  setgraph++;
	  }
     CopyFullGraph(g,graph);
     
     return(newset);
     }

#if DEBUG >= DEBUG3
static void PrintIntegerVector(CHAR *prefix, DataSubSet *subset)
     {
     INT i,*pnts;
     
     printf("%s:",prefix);
     pnts = subset->Points;
     LOOPi(subset->NumberOfPoints)
	  printf("%4d",*pnts++);
     printf("\n");
     }
#endif

extern SetOfGraphs *ExtendSetOfGraphs(SetOfGraphs *newelements,
				      SetOfGraphs *total)
     {
     SetOfGraphs *newset;
     Graph *newgraph,*oldgraph;
     INT i;
     
     newset = AllocateSetOfGraphs;
     CreateSetOfGraphs(newset,total->ID,total->Name,
		       total->NumberOfGraphs + newelements->NumberOfGraphs,
		       0);
     newgraph = newset->Graphs;
     oldgraph = total->Graphs;
     if(oldgraph != 0)
	  {
	  LOOPi(total->NumberOfGraphs)
	       {
	       CopyFullGraph(newgraph,oldgraph);
	       newgraph++;
	       oldgraph++;
	       }
	  }
     newset->NumberOfGraphs = total->NumberOfGraphs;
     
     return(newset);
     }
