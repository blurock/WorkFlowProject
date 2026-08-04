#include "basic.h"
#include "graph.h"

static INT GraphEqualLevel0(Graph *g1, DataSubSet *set1,
			    Graph *g2, DataSubSet *set2);
static INT GraphEqualLevel1(Graph *g1, DataSubSet *set1,
			    Graph *g2, DataSubSet *set2);
static INT GraphEqualLevel2(Graph *g1, DataSubSet *set1,
			    Graph *g2, DataSubSet *set2);
static int INTGreaterThan(INT *i1,INT *i2);

/*******************************************************************************/

extern DataSubSet *UpdateSetOfGraphs(SetOfGraphs *newelements,
				     SetOfGraphs *total)
     {
     SetOfGraphs *newset;
     Graph *newgraph,*oldgraph,*graphtoadd;
     DataSubSet *molcorr;
     INT i,count,*corrs;
     CHAR *name;
     
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
	       FreeGraph(oldgraph);
	       newgraph++;
	       oldgraph++;
	       }
	  newset->NumberOfGraphs = total->NumberOfGraphs;
	  }
     
     molcorr = IdentifySetOfGraphs(newelements,newset);
     
     name = AllocateString(20);
     corrs = molcorr->Points;
     count = total->NumberOfGraphs;
     graphtoadd = newelements->Graphs;
     LOOPi(molcorr->NumberOfPoints)
	  {
	  if(*corrs < 0 && graphtoadd->ID >= 0)
	       {
	       CopyFullGraph(newgraph,graphtoadd);
	       newset->NumberOfGraphs +=1;
	       
	       newgraph->ID = count;
	       sprintf(name,"PP%d",count);
	       Free(newgraph->Name);
	       newgraph->Name = CopyString(name);
	       *corrs = count;
	       newgraph++;
	       count++;
	       }
	  corrs++;
	  graphtoadd++;
	  }
     total->Graphs = newset->Graphs;
     total->NumberOfGraphs = newset->NumberOfGraphs;

     newset->Graphs = 0;
     newset->NumberOfGraphs = 0;
     FreeSetOfGraphs(newset);
     Free(newset);
     Free(name);
     return(molcorr);
     }

extern SetOfGraphs *UnionSetOfGraphs(SetOfGraphs *set1, SetOfGraphs *set2)
     {
     SetOfGraphs *newset;
     Graph *new,*old;
     INT i,ans;
     
     newset = AllocateSetOfGraphs;
     CreateSetOfGraphs(newset,set1->ID,set1->Name,
		       set1->NumberOfGraphs + set2->NumberOfGraphs,
		       0);
     newset->NumberOfGraphs = set1->NumberOfGraphs;
     old = set1->Graphs;
     new = newset->Graphs;
     LOOPi(set1->NumberOfGraphs)
	  {
	  CopyFullGraph(new,old);
	  new++;
	  old++;
	  }

     old = set2->Graphs;
     LOOPi(set2->NumberOfGraphs) {
       ans = GraphInSet(old,set1);
       printf("UnionSetOfGraphs: %10s %5d\n",old->Name,ans);
       if(ans == -1)
	 {
	   CopyFullGraph(new,old);
	   new++;
	   newset->NumberOfGraphs += 1;
	 }
       old++;
     }
     return(newset);
     }

extern SetOfGraphs *LastNGraphs(INT n, SetOfGraphs *set)
     {
     SetOfGraphs *newset;
     Graph *new,*old;
     INT i;

     newset = AllocateSetOfGraphs;
     CreateSetOfGraphs(newset,set->ID,set->Name,
		       n,0);

     old = set->Graphs + (set->NumberOfGraphs - n);
     new = newset->Graphs;
     LOOPi(n)
	  {
	  CopyFullGraph(new,old);
	  new++;
	  old++;
	  }
     return(newset);
     }

extern DataSubSet *IdentifySetOfGraphs(SetOfGraphs *set,
				       SetOfGraphs *reference)
     {
     Graph *graph;
     DataSubSet *ids;
     INT i,*id;
     
     ids = AllocateDataSubSet;
     CreateDataSubSet(ids,set->ID,set->Name,
		      set->NumberOfGraphs,
		      set->NumberOfGraphs,
		      0);

     id = ids->Points;
     graph = set->Graphs;
     LOOPi(set->NumberOfGraphs)
	  {
	  if(graph->ID < 0)
	       *id = -1;
	  else
	       {
	       *id = GraphInSet(graph,reference);
	       id++;
	       graph++;
	       }
	  }
     
     return(ids);
     }

extern INT GraphInSet(Graph *graph, SetOfGraphs *set)
     {
     INT done,count;
     Graph *setgraph;
     
     setgraph = set->Graphs;
     done = -1;
     count = 0;
     while(done == -1 &&
	   count < set->NumberOfGraphs)
	  {
	  if(GraphsEqual(graph,setgraph))
	       done = count;
	  else
	       {
	       count++;
	       setgraph++;
	       }
	  }
     return(done);
     }

extern INT GraphsEqual(Graph *graph1, Graph *graph2)
     {
     DataSubSet *set1,*set2;
     INT eq;
     
     set1 = AllocateDataSubSet;
     SetUpTotalGraphSet(set1,graph1);
     set2 = AllocateDataSubSet;
     SetUpTotalGraphSet(set2,graph2);
     
     eq = GraphsEqualSet(graph1,set1,graph2,set2);
     
     FreeDataSubSet(set1);
     Free(set1);
     FreeDataSubSet(set2);
     Free(set2);
     
     return(eq);
     }


extern INT GraphsEqualSet(Graph *graph1, DataSubSet *set1,
			  Graph *graph2, DataSubSet *set2)
     {
     INT done;
     
     if(GraphEqualLevel0(graph1,set1,graph2,set2))
	  {
	  if(GraphEqualLevel1(graph1,set1,graph2,set2))
	       {
	       if(GraphEqualLevel2(graph1,set1,graph2,set2))
		    done = 1;
	       else
		    done = 0;

	       }
	  else 
	       done = 0;
	  }
     else
	  done = 0;
     return(done);
     }

static INT GraphEqualLevel0(Graph *g1, DataSubSet *set1,
			    Graph *g2, DataSubSet *set2)
     {
     INT eq;
     
     if(set1->NumberOfPoints != set2->NumberOfPoints)
	  eq = 0;
     else 
	  eq = 1;

     return(eq);
     }
	       
static int INTGreaterThan(INT *i1,INT *i2)
     {
     return((*i1) - (*i2));
     }

static INT GraphEqualLevel1(Graph *g1, DataSubSet *set1,
			    Graph *g2, DataSubSet *set2)
     {
     INT done,count,*nodes1,*nodes2,*nodestart1,*nodestart2,*gn1,*gn2,i;
     INT *inc1,*inc2;
     size_t num;
     int (*comp)();
     
     comp = INTGreaterThan;
     
     nodes1 = nodestart1 = AllocArrayINT(g1->NumberOfNodes);
     nodes2 = nodestart2 = AllocArrayINT(g2->NumberOfNodes);
     
     num = set1->NumberOfPoints;

     gn1 = g1->NodeTypes;
     gn2 = g2->NodeTypes;
     inc1 = set1->Points;
     inc2 = set2->Points;
     LOOPi(num)
	  {
	  *nodes1++ = *(gn1 + *inc1++);
	  *nodes2++ = *(gn2 + *inc2++);
	  }

     nodes1 = nodestart1;
     nodes2 = nodestart2;
     
     qsort((void *) nodes1,num, INTSize, comp);
     qsort((void *) nodes2,num,INTSize, comp);
     
     done = 1;
     count = 0;
     while(count < num && done == 1)
	  {
	  if(*nodes1 != *nodes2)
	       done = 0;
	  else
	       {
	       count++;
	       nodes1++;
	       nodes2++;
	       }
	  }
     Free(nodestart1);
     Free(nodestart2);
     
     return(done);
     }

static INT GraphEqualLevel2(Graph *g1, DataSubSet *set1,
			    Graph *g2, DataSubSet *set2)
     {
     INT eq;

     eq = IsSubGraph(SUBGRAPH_EQUAL,g1,set1,g2,set2);
    
     return(eq);
     }

