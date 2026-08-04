/*  FILE     filter.c
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
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static INT NumberOfRadicalsInGraph(Graph *graph);
static INT RadicalInStandardValence(INT valence); 


/*F FilterOutSetOfGraphs(set)
**
**  DESCRIPTION
**    
**
**  REMARKS
**
*/
extern void FilterOutSetOfGraphs(SetOfGraphs *set)
     {
     Graph *graph,*newgraph;
     INT i,change;
     
     change = 0;
     graph = set->Graphs;
     newgraph = set->Graphs;
     LOOPi(set->NumberOfGraphs)
	  {
	  if(newgraph != graph)
	       memcpy(newgraph,graph,GraphSize);
	       
	  if( !( FilterGraphOut(graph)) )
	       {
	       change++;
	       newgraph++;
	       }
	  else
	       FreeGraph(graph);

	  graph++;
	  }
     set->NumberOfGraphs = change;
     }
 
/*F reject = FilterGraphOut(graph)
**
**  DESCRIPTION
**    graph: Graph to check
**    reject:  1 - reject  0 - otherwise
**
**    Rejection is based simply on the number of radicals in graph
**
**    This is a simple policy.  Improvements reserved for later
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
extern INT FilterGraphOut(Graph *graph)
     {
     INT count,out;
     
     out = 0;
          
     count = NumberOfRadicalsInGraph(graph);
     if(count > 1 && graph->NumberOfNodes > 3) {
       PrintPrettyGraph("More Radicals: ", stdout, graph);
       out = 1;
     }
     out = 0;
     return(out);
     }

static INT NumberOfRadicalsInGraph(Graph *graph)
     {
     INT *atm,count,i;
     
     atm = graph->NodeTypes;
     count = 0;
     LOOPi(graph->NumberOfNodes)
	  {
	  if(RadicalInStandardValence(*atm))
	       count++;
	  atm++;
	  }
     return(count);
     }
static INT RadicalInStandardValence(INT valence)
     {
     INT c,out,r;
     
     r = (INT) (((double)valence) / ((double) VAL_CHARGE_SPEC));
     c =  (INT) r/10;
     
     if(r - c * 10 == 9)
	  out = 1;
     else
	  out = 0;

     return(out);
     }
