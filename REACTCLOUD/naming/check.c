/*  FILE     check.c
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

/*#define DEBUG*/
/*S
 */
 
/*F best = CheckGraphInSet(graph,set)
**
**  DESCRIPTION
**    graph: The graph to check
**    set: The set to compare
**    best: The best in the set
**
**  REMARKS
**
*/
int CheckGraphInSet(Graph *graph, SetOfGraphs *set)
{
  DataSubSet *graphset,*checkset;
  int best;

  graphset = AllocateDataSubSet;
  checkset = AllocateDataSubSet;
 
  best = CheckGraphInSetWithPairing(graph,graphset,checkset,set);

  return best;
}
/*F best = CheckGraphInSetWithPairing(graph,graphset,checkset,set)
**
**  DESCRIPTION
**    graph: The graph to check
**    set: The set to compare
**    best: The best in the set
**
**  REMARKS
**
*/
int CheckGraphInSetWithPairing(Graph *graph, DataSubSet *graphset, DataSubSet *checkset, SetOfGraphs *set)
{
  Graph *bestgraph,*check;
  int i,best,next1,next2;
  char *str;
  int strl;
  strl = LINELENGTH;
  str = AllocateString(LINELENGTH);

  best = -1;
  check = set->Graphs;
  LOOPi(set->NumberOfGraphs)
    {
      SetUpTotalGraphSet(graphset,graph);
      SetUpTotalGraphSet(checkset,check);
      
      next1 = IsSubGraph(SUBGRAPH_EQUAL,
			graph,graphset,
			check,checkset);
      if(!next1)
	{
	  next2 = IsSubGraph(SUBGRAPH_SUBGRAPH,
			     graph,graphset,
			     check,checkset);
	}

      #ifdef DEBUG
      PrintStringDataSubSet(str,"GraphSet:",&strl,graphset);
      printf("%s",str);
      if(checkset->Points != 0)
	{
	  PrintStringDataSubSet(str,"CheckSet:",&strl,checkset);
	  printf("%s",str);
	}
      PrintPrettyGraph("Graph: -- ",0,graph);
      PrintPrettyGraph("Check: -- ",0,check);
      printf("Compare: (%d,%d)\n",next1,next2);
      #endif
      if(next1 || next2)
	{
	  if(best > 0) {
	    bestgraph = set->Graphs + best;
	    /*	    if(bestgraph->NumberOfNodes <= check->NumberOfNodes)*/
	    if(best < i)
	      best = i;
	  } else 
	    best = i;
	  if(next1)
	      best = i + EQUAL_GRAPH_OFFSET;
	}
      check++;
    }
  Free(graphset);
  Free(checkset);
  return best;
}
