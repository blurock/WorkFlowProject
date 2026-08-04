#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"

extern DataSubSet *UpdateSetOfGraphsWithoutHydrogens(SetOfGraphs *newelements,
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
     
     molcorr = IdentifySetOfGraphsWithoutHydrogens(newelements,newset);
     
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
extern DataSubSet *SetWithoutHydrogen(Graph *graph)
     {
     DataSubSet *set;
     INT i,*pnt,*node,count;
     
     set = AllocateDataSubSet;
     CreateDataSubSet(set,0,"",
		      graph->NumberOfNodes,
		      graph->NumberOfNodes,
		      0);
     
     pnt = set->Points;
     node = graph->NodeTypes;
     count = 0;
     LOOPi(graph->NumberOfNodes)
	  {
	  if(*node != 1003001)
	       {
	       *pnt = i;
	       count++;
	       pnt++;
	       }
	  node++;
	  }
     set->NumberOfPoints = count;
     return(set);
     }

extern DataSubSet *IdentifySetOfGraphsWithoutHydrogens(SetOfGraphs *new,
						       SetOfGraphs *reference)
     {
     DataSubSet *molcorr,*set1,*set2;
     INT *corr,i,count;
     Graph *graph1,*graph2;
     
     molcorr = AllocateDataSubSet;
     CreateDataSubSet(molcorr,new->ID,new->Name,
		      new->NumberOfGraphs,
		      new->NumberOfGraphs,
		      0);
     
     corr = molcorr->Points;
     graph1 = new->Graphs;
     LOOPi(new->NumberOfGraphs)
	  {
	  set1 = SetWithoutHydrogen(graph1);
	  *corr = -1;
	  count = 0;
	  if(reference != 0)
	       {
	       graph2 = reference->Graphs;
	       while(*corr == -1 && count < reference->NumberOfGraphs)
		    {
		    set2 = SetWithoutHydrogen(graph2);
		    if(set1->NumberOfPoints == 0 && set2->NumberOfPoints == 0)
		      *corr = count;
		    else if(GraphsEqualSet(graph1,set1,graph2,set2))
		      *corr = count;
		    count++;
		    graph2++;
		    FreeDataSubSet(set2);
		    Free(set2);
		    }
	       }
	  graph1++;
	  corr++;
	  FreeDataSubSet(set1);
	  Free(set1);
	  }
     return(molcorr);
     }

/* Note that this routine destroys the SetOfGraphs structure ..results..
*/
static void AdjustSetOfMoleculeIDs(SetOfGraphs *results,
				   DataSubSet *molcorrs,
				   SetOfGraphs *total)
     {
     SetOfGraphs *newtotal;
     INT i,totalsize,num,*id;
     Graph *tgraph,*rgraph;
     
     num = total->NumberOfGraphs;
     newtotal = AllocateSetOfGraphs;
     CreateSetOfGraphs(newtotal,results->ID,results->Name,
		       num + results->NumberOfGraphs,
		       0);
     if(num > 0)
	  {
	  totalsize = num * GraphSize;
	  memcpy(newtotal->Graphs,total->Graphs,totalsize);
	  }
     
     tgraph = newtotal->Graphs + num;
     rgraph = results->Graphs;
     id = molcorrs->Points;
     LOOPi(results->NumberOfGraphs)
	  {
	  if(*id < 0)
	       {
	       memcpy(tgraph,rgraph,GraphSize);
	       tgraph->ID = *id = num;
	       tgraph++;
	       num++;
	       }
	  else
	       {
	       FreeGraph(rgraph);
	       }
	  rgraph++;
	  id++;
	  }
     
     total->NumberOfGraphs = num;
     Free(total->Graphs);
     total->Graphs = newtotal->Graphs;
     newtotal->Graphs = 0;
     newtotal->NumberOfGraphs = 0;
     FreeSetOfGraphs(newtotal);
     Free(newtotal);
     Free(results->Graphs);
     results->Graphs = 0;
     results->NumberOfGraphs = 0;
     FreeSetOfGraphs(results);
     Free(results);
     }

extern DataSubSet *IdentifyGraphsInMaster(SetOfGraphs *graphs, BindStructure *bind)
     {
     MoleculeSet *molecules;
     Graph *graph,*systemgraph,*tmpgraph;
     SetOfGraphs *systemgraphs;
     DataSubSet *set;
     INT i,*ids;
     MoleculeInfo *molecule;
    
     molecules = GetMoleculeSetMaster(bind);
     
     systemgraphs = AllocateSetOfGraphs;
     CreateSetOfGraphs(systemgraphs,
		       molecules->ID,molecules->Name,
		       molecules->NumberOfMolecules,
		       0);

     molecule = molecules->Molecules;
     systemgraph = systemgraphs->Graphs;
     LOOPi(molecules->NumberOfMolecules)
	  {
	  tmpgraph = GraphFromMolFile(molecule,
				      VALENCE_STANDARD);
	  CopyFullGraph(systemgraph,tmpgraph);
	  FreeGraph(tmpgraph);
	  Free(tmpgraph);
	  systemgraph++;
	  molecule++;
	  }
     
     set = IdentifySetOfGraphsWithoutHydrogens(graphs,systemgraphs);
	  
     ids = set->Points;
     graph = graphs->Graphs;
     LOOPi(graphs->NumberOfGraphs)
	  {
	  if(*ids == -1)
	       {
	       graph->ID = graph->ID + 90000;
	       *ids = graph->ID;
	       }
	  else
	       {
	       systemgraph = systemgraphs->Graphs + *ids;
	       graph->ID = systemgraph->ID;
	       Free(graph->Name);
	       graph->Name = CopyString(systemgraph->Name);
	       }
	  ids++;
	  graph++;
	  }
     FreeSetOfGraphs(systemgraphs);
     Free(systemgraphs);
     
     return(set);
     }

