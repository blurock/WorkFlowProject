/*  FILE     sidegroups.c
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
#include "molprops.h"
#include "naming.h"

static void AddSideNames(CHAR *name,INT *length,DataSubSet *atoms,DataSubSet *corrs,Graph *graph,SetOfGraphs *set);
static DataSubSet *SeparateOutGroupsIterative(Graph *graph, 
					       INT n,
					      DataSubSet *graphnodes);
static void PrintPrettyData(CHAR *prefix,DataSubSet *data)
     {
     INT i,*points;
     
     printf("%s:::",prefix);
     points = data->Points;
     LOOPi(data->NumberOfPoints)
	  {
	  printf(" %5d ",*points);
	  if( !( (i+1) % 10 ) )
	       printf("      \n%s:::",prefix);
	  points++;
	  }
     printf("\n");
     }

/*F name = GenerateSideGroupNames(graph,reference,set)
**
**  DESCRIPTION
**
**  REMARKS
**
*/
extern CHAR *GenerateSideGroupNames(Graph *graph, Graph *reference,SetOfGraphs *set)
{
  SetOfPairSets *pairs;
  PairSet *pairset;
  DataSetPair *datapair;
  CHAR *name;
  INT i,length;

  pairs = BasicSubGraph(graph,reference);
  name = AllocateString(LINELENGTH);
  *name = '\0';
  length = LINELENGTH;
  pairset = pairs->Sets;
  datapair = DataSubSetFromPairSet(pairset);
  AddSideNames(name,&length,datapair->Set1,datapair->Set2,graph,set);

  FreeDataSetPair(datapair);
  FreeSetOfPairSets(pairs);  
  return name;
}
/*F AddSideNames(name,atoms,graph);
**
**  DESCRIPTION
**
**  REMARKS
**
*/
static void AddSideNames(CHAR *name,INT *length,DataSubSet *atoms,DataSubSet *corrs,Graph *graph,SetOfGraphs *set)
{
  DataSubSet *nohydrogens,*therest,*atomset,*newrest,*gatoms;
  Graph *subgraph;
  Neighbor *neighbors;
  INT i,j,n;
  INT ans;
  CHAR *currentname,*sidename;
  nohydrogens = SetWithoutHydrogen(graph);
  therest = BuildComplementSet(nohydrogens,atoms,0);
  LOOPi(atoms->NumberOfPoints) {
    neighbors = Neighbors(*(atoms->Points +i),graph,therest);
    LOOPj(neighbors->NumberOfNeighbors) {
      n = *(neighbors->List + j);
      atomset = SeparateOutGroupsIterative(graph,n,therest);
      subgraph = IsolateGraphWithDataSubSet(graph,atomset);
      ans = CheckGraphInSet(subgraph,set);
      if(ans >= 0) {
	if(ans >= EQUAL_GRAPH_OFFSET)
	  ans -= EQUAL_GRAPH_OFFSET;
	sidename = GenerateSideGroupNames(subgraph,set->Graphs+ans,set);
	currentname = AllocateString(LINELENGTH);
	if(strlen(sidename) > 0)
	  sprintf(currentname,"%d-(%s%s)",*(corrs->Points + i)+1,sidename,(set->Graphs+ans)->Name);
	else {
	  sprintf(currentname,"%d-(%s)",*(corrs->Points + i)+1,(set->Graphs+ans)->Name);
	}
	Free(sidename);
	name = PrintStringString(name,length,currentname);
	Free(currentname);
      } else {
	currentname = AllocateString(LINELENGTH);
	sprintf(currentname,"%d-(%s)",*(corrs->Points + i)+1,"X");
	name = PrintStringString(name,length,currentname);
	Free(currentname);
      }
      FreeDataSubSet(atomset);
      Free(atomset);
      FreeGraph(subgraph);
      Free(subgraph);
    }
    FreeNeighbor(neighbors);
    Free(neighbors);
  }
}
static DataSubSet *SeparateOutGroupsIterative(Graph *graph, 
					       INT n,
					       DataSubSet *graphnodes)
     {
     DataSubSet *atomset,*newatomset,*newrest,*rest,*neighbors;
     Neighbor *nbr;
     SetOfGraphs *added,*fullset;
     Graph *subgraph;
     INT done,first;
     
     rest = AllocateDataSubSet;
     CopyFullDataSubSet(rest,graphnodes);
     atomset = AllocateDataSubSet;
     CreateDataSubSet(atomset,0,0,1,1,0);
     *(atomset->Points) = n;
     first = 1;
     done = 0;
     while(done == 0)
       {
	 if(first == 1) {
	   first = 0;
	   nbr = Neighbors(n,graph,rest);
	   neighbors = NeighborToDataSubSet(nbr);
	   FreeNeighbor(nbr);
	   Free(nbr);
	 } else {
	   neighbors = NeighborsFromDataSubSet(graph,atomset,rest);
	 }
	 if(neighbors->NumberOfPoints == 0)
	   done = 1;
	 else
	   {
	     newatomset = MergeDataSubSets(graph->Name,graph->ID,
					   atomset,neighbors);
	     newrest = SubtractDataSubSet(graph->ID,graph->Name,
					  rest,neighbors);
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
     FreeDataSubSet(rest);
     Free(rest);
     return atomset;
     }
