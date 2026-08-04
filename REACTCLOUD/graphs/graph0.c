#include "basic.h"
#include "graph.h"

#include "graphs/sgr.c"
#include "graphs/pair.c"

static void NextLevel(DataSubSetVector *levels, 
		      Graph *graph,
		      DataSubSet *rest,
		      INT MaxLevels);
static DataSubSet *NeighborsToSubSet(Neighbor *neighbors);
static void NextLevel(DataSubSetVector *levels, 
		      Graph *graph,
		      DataSubSet *rest,
		      INT MaxLevels);
static void StringNeighbors(CHAR *string, Neighbor *neighbor);
static GraphMetaAtom *NthGraphMetaAtom(INT n, SetOfGraphMetaAtoms *set);
static INT MatchMetaAtomToAtom(INT atm, INT type,
			       SetOfGraphMetaAtoms *setmetaatoms);
static INT GraphAtomMatchingTypes(INT type1, INT type2, 
				  SetOfGraphMetaAtoms *setmetaatoms);


#define MemberOfDataSet(i,data) IntegerMemberOf(i,data->Points,data->NumberOfPoints)


extern Neighbor *Neighbors(int I, Graph *graph, DataSubSet *dataset)
{
Neighbor *neighbors,*reduced;

     neighbors = graph->Neighbors + I;
     reduced   = NeighborsInDataSubSet(neighbors,dataset);
     return(reduced);
}

extern Neighbor *NeighborsInDataSubSet(Neighbor *neighbors, DataSubSet *data)
     {
     INT *old,*new;
     Neighbor *newneighbor;
     int i,count;

     old = neighbors->List;
     newneighbor = AllocateNeighbor;
     CreateNeighbor(newneighbor,neighbors->ID,neighbors->Name,
		    neighbors->NumberOfNeighbors,0);

     new = newneighbor->List;
     count =0;
     LOOPi(neighbors->NumberOfNeighbors)
          {
          if( MemberOfDataSet(*old,data) )
	       {
	       count++;
               *new++ = *old++;
	       }
          else
               old++;
          }
     newneighbor->NumberOfNeighbors = count;
     return(newneighbor);
     }

extern void PrintPrettyNeighbor(CHAR *prefix, Neighbor *neighbors)
     {
     INT i,*n;
     
     printf("%s [",prefix);
     
     n = neighbors->List;
     LOOPi(neighbors->NumberOfNeighbors)
	  printf("%5d",*n++);
	  
     printf("]\n");
     }

extern DataSubSet *NeighborToDataSubSet(Neighbor *neighbor)
     {
     DataSubSet *set;
     
     set = AllocateDataSubSet;
     CreateDataSubSet(set,neighbor->ID,neighbor->Name,
		      neighbor->NumberOfNeighbors,
		      neighbor->NumberOfNeighbors,
		      neighbor->List);
     return(set);
     }

extern DataSubSet *FindAtomsOfType(INT Type, Graph *graph, DataSubSet *set)
     {
     DataSubSet *subset;
     INT i,*match,count,*node,gtype;
     SetOfGraphMetaAtoms *setgraphmeta;
     
     setgraphmeta = graph->MetaAtoms;
     
     subset = AllocateDataSubSet;
     CreateDataSubSet(subset,graph->ID,graph->Name,
		      set->MaximumPoint,
		      set->NumberOfPoints,
		      0);
     match = subset->Points;
     count = 0;
     node = set->Points;
     LOOPi(set->NumberOfPoints)
	  {
	  gtype = *(graph->NodeTypes + *node);
	  if(GraphAtomMatchingTypes(gtype,Type,setgraphmeta))
	       {
	       count++;
	       *match++ = *node;
	       }
	  node++;
	  }
     subset->NumberOfPoints = count;
     return(subset);
     }

static INT GraphAtomMatchingTypes(INT type1, INT type2, 
				  SetOfGraphMetaAtoms *setmetaatoms)
     {
     INT out,atm1,atm2;
     
     out = 0;

     atm1 = type1 / VAL_ATOMIC_NUMBER;
     atm2 = type2 / VAL_ATOMIC_NUMBER;

     if(atm1 >= META_ATOM_OFFSET && atm2 >= META_ATOM_OFFSET)
	  {
	  if(atm1 == atm2)
	       out = 1;
	  else 
	       out = 0;
	  }
     else if(atm2 >= META_ATOM_OFFSET)
	  out = GraphAtomMatchingTypes(type2,type1,setmetaatoms);
     else if(atm1 >= META_ATOM_OFFSET)
	  out = MatchMetaAtomToAtom(atm1,type2,setmetaatoms);
     else if(type1 == type2)
	  out = 1;
     else 
	  out = 0;
     return(out);
     }

static INT MatchMetaAtomToAtom(INT atm, INT type,
			       SetOfGraphMetaAtoms *setmetaatoms)
     {
     GraphMetaAtom *metaatoms;
     INT *alias,done,count;
     
     metaatoms = NthGraphMetaAtom(atm % MAX_NUMBER_OF_META_ATOMS,setmetaatoms);
     
     alias = metaatoms->AtomicTypes;
     done = 0;
     count = 0;
     while(count < metaatoms->NumberOfAliased &&
	   done == 0)
	  {
	  if(type == *alias) done = 1;
	  alias++;
	  count++;
	  }
     return(done);
     }

static GraphMetaAtom *NthGraphMetaAtom(INT n, SetOfGraphMetaAtoms *set)
     {
     GraphMetaAtom *out;
     
     if(n >= set->NumberOfMetaAtoms)
	  {
	  Error(0, "Illegal Graph Meta Atom");
	  out = 0;
	  }
     else
	  out = set->MetaAtoms + n;
     return(out);
     }


	  

extern INT NthNodeType(INT pointer, Graph *graph)
     {
     INT ans;
     
     if(pointer < graph->NumberOfNodes)
	  ans = *(graph->NodeTypes + pointer);
     else
	  {
	  Error(pointer,"Illegal Pointer in Graph: NthNodeType");
	  ans = 0;
	  }
     return(ans);
     }

/* SubtractDataSubSet
     This subtracts the elements of the second DataSubSet from 
     those of the first.  It is assumed that ALL of the points
     of the second are to be found in the first.
*/
extern DataSubSet *SubtractDataSubSet(INT id, CHAR *name,
				      DataSubSet *set1, DataSubSet *set2)
     {
     INT n,*newpnt,*pnt,i;
     DataSubSet *new;
     
     n = set1->NumberOfPoints - set2->NumberOfPoints;
     if(n != 0)
	  {
	  new = AllocateDataSubSet;
	  CreateDataSubSet(new,id,name,set1->NumberOfPoints,n,0);
	  newpnt = new->Points;
	  pnt = set1->Points;
	  LOOPi(set1->NumberOfPoints)
	       {
	       if(!MemberOfDataSet(*pnt,set2))
		    *newpnt++ = *pnt;
	       pnt++;
	       }
	  }
     else
	  {
	  new = AllocateDataSubSet;
	  CreateDataSubSet(new,id,name,set1->NumberOfPoints,1,0);
	  new->NumberOfPoints = 0;
	  }
     
     return(new);
     }

extern DataSubSetVector *FindNodesInLevelsFromNode(INT node, 
						   Graph *graph,
						   DataSubSet *all,
						   INT MaxLevels)
     {
     DataSubSetVector *levels;
     DataSubSet *rest,*level0;
     
     levels = AllocateDataSubSetVector;
     CreateDataSubSetVector(levels,graph->ID,graph->Name,
			    MaxLevels,
			    0);
     
     levels->NumberOfVectors = 1;
     level0 = levels->Vector;
     CreateDataSubSet(level0,0,graph->Name,
		      graph->NumberOfNodes,1,0);
     *(level0->Points) = node;

     rest = SubtractDataSubSet(0,"total",all,level0);
     
     NextLevel(levels,graph,rest,MaxLevels);
     
     return(levels);
     }

static void NextLevel(DataSubSetVector *levels, 
		      Graph *graph,
		      DataSubSet *rest,
		      INT MaxLevels)
     {
     INT level;
     DataSubSet *current,*nextlevel,*newrest;
     
     if(levels->NumberOfVectors >= MaxLevels ||
	rest->NumberOfPoints == 0)
	  {
	  FreeDataSubSet(rest);
	  Free(rest);
	  return;
	  }
     
     level = levels->NumberOfVectors - 1;
     current = levels->Vector + level;
     
     nextlevel = NeighborsFromDataSubSet(graph,
					 current,
					 rest);
     newrest = SubtractDataSubSet(levels->NumberOfVectors,
				  "rest",
				  rest,
				  nextlevel);

     CopyFullDataSubSet((levels->Vector + levels->NumberOfVectors),
			nextlevel);
     levels->NumberOfVectors += 1;

     FreeDataSubSet(nextlevel);
     Free(nextlevel);

     NextLevel(levels,graph,newrest,MaxLevels);
     }

extern DataSubSet *NeighborsFromDataSubSet(Graph *graph,
					   DataSubSet *set,
					   DataSubSet *rest)
     {
     DataSubSet *neighbors,*nset,*newset;
     INT *node;
     INT i;
     Neighbor *neigh;
     
     neighbors = AllocateDataSubSet;
     CreateDataSubSet(neighbors,graph->ID,graph->Name,
		      0,0,0);
     
     node = set->Points;
     LOOPi(set->NumberOfPoints)
	  {
	  neigh = Neighbors(*node,graph,rest);
	  nset = NeighborsToSubSet(neigh);
	  newset = MergeDataSubSets(graph->Name,graph->ID,
				    nset,neighbors);
	  FreeDataSubSet(nset);
	  Free(nset);
	  FreeDataSubSet(neighbors);
	  Free(neighbors);
	  neighbors = newset;
	  
	  FreeNeighbor(neigh);
	  Free(neigh);
	  node++;
	  }
     return(neighbors);
     }

static DataSubSet *NeighborsToSubSet(Neighbor *neighbors)
     {
     DataSubSet *set;
     
     set = AllocateDataSubSet;
     CreateDataSubSet(set,neighbors->ID,neighbors->Name,
		      neighbors->NumberOfNeighbors,
		      neighbors->NumberOfNeighbors,
		      neighbors->List);
     return(set);
     }

extern void PrintPrettySetOfGraphs(CHAR *prefix, FILE *out, SetOfGraphs *set)
     {
     INT j;
     Graph *graph;
     CHAR *string;
     
     string = AllocateString(LINELENGTH);
     
     fprintf(out,"%s: SetOfGraphs (%5d,%s) %d Graphs\n",
	     prefix,
	     set->ID,set->Name,
	     set->NumberOfGraphs);
     
     graph = set->Graphs;
     LOOPj(set->NumberOfGraphs)
	  {
	  sprintf(string,"%s: %5d -----",prefix,j);
	  PrintPrettyGraph(string,stdout,graph);
	  graph++;
	  }
     Free(string);
     }

extern void PrintPrettyGraph(CHAR *prefix, FILE *file, Graph *graph)
     {
     INT i,*types;
     CHAR *string;
     Neighbor *neighbors;
     
     string = AllocateString(LINELENGTH);
     printf("%s:%5d:%s\n",prefix,graph->ID,graph->Name);

     types = graph->NodeTypes;
     neighbors = graph->Neighbors;
     LOOPi(graph->NumberOfNodes)
	  {
	  StringNeighbors(string,neighbors);
	  printf("%s: %5d,%5d ->> %s\n",prefix,i,*types,string);
	  types++;
	  neighbors++;
	  }
     printf("\n");
     Free(string);
     }

static void StringNeighbors(CHAR *string, Neighbor *neighbor)
     {
     INT *node;
     INT i;
     
     *string++ = '(';
     node = neighbor->List;
     LOOPi(neighbor->NumberOfNeighbors)
	  {
	  sprintf(string,"%5d",*node);
	  string += 5;
	  node++;
	  }
     *string++ = ')';
     *string = '\0';
     
     }

extern DataSubSetVector *SetUpMoleculeAtomSets(SetOfGraphs *graphs, INT flag)
     {
     Graph *graph;
     DataSubSet *dataset;
     INT originalcount,i;
     DataSubSetVector *atomsets;
     
     originalcount = graphs->NumberOfGraphs;
     atomsets = AllocateDataSubSetVector;
     CreateDataSubSetVector(atomsets,
			    graphs->ID,graphs->Name,
			    originalcount,0);
     graph = graphs->Graphs;
     dataset = atomsets->Vector;
     LOOPi(originalcount)
	  {
	  SetUpAtomSetFromGraph(dataset,flag,graph);
	  graph++;
	  dataset++;
	  }
     return(atomsets);
     }


extern void SetUpAtomSetFromGraph(DataSubSet *subset,
				  INT flag,
				  Graph *graph)
     {
     INT *type,i,heavy;
     
     CreateDataSubSet(subset,graph->ID,graph->Name,
		      graph->NumberOfNodes,
		      graph->NumberOfNodes,
		      0);
     subset->NumberOfPoints = 0;
     type = graph->NodeTypes;
     LOOPi(graph->NumberOfNodes)
	  {
	  switch(flag)
	       {
	  case HEAVY_ATOMS:
	       if(*type / VAL_ATOMIC_NUMBER > 1)
		    heavy = 1;
	       else
		    heavy = 0;
	       break;
	  case ALL_ATOMS:
	       heavy = 1;
	       break;
	  default:
	       heavy = 0;
	       break;
	       }
	  if(heavy == 1)
	       {
	       *(subset->Points + subset->NumberOfPoints) = i;
	       subset->NumberOfPoints += 1;
	       }
	  type++;
	  }
     return;
     }

extern INT RemoveElementFromNeighbor(INT n, Neighbor *neighbor)
     {
     Neighbor *newneighbor;
     INT i,done,*new,*element,error;
     
     error = 0;
     newneighbor = AllocateNeighbor;
     CreateNeighbor(newneighbor,neighbor->ID,neighbor->Name,
		    neighbor->NumberOfNeighbors - 1,
		    0);
     new = newneighbor->List;
     element = neighbor->List;
     done = -1;
     LOOPi(neighbor->NumberOfNeighbors)
	  {
	  if(*element != n)
	       {
	       *new = *element;
	       new++;
	       }
	  else
	       done = 0;
	  element++;
	  }

     if(done == -1)
	  {
	  error = 1;
	  }
     else
	  {
	  FreeNeighbor(neighbor);
	  CopyFullNeighbor(neighbor,newneighbor);
	  }
     FreeNeighbor(newneighbor);
     Free(newneighbor);
     
     return(error);
     }

extern INT AddElementToNeighbor(INT n, Neighbor *neighbor)
     {
     Neighbor *newneighbor;
     INT i,done,*new,*element,error;
     
     error = 0;
     newneighbor = AllocateNeighbor;
     CreateNeighbor(newneighbor,neighbor->ID,neighbor->Name,
		    neighbor->NumberOfNeighbors + 1,
		    0);
     done = 0;
     new = newneighbor->List;
     element = neighbor->List;
     LOOPi(neighbor->NumberOfNeighbors)
	  {
	  if(*element == n)
	       done = -1;
	       
	  *new++ = *element++;
	  }
     *new = n;
     if(done == -1)
	  {
	  error = 1;
	  }
     else
	  {
	  FreeNeighbor(neighbor);
	  CopyFullNeighbor(neighbor,newneighbor);
	  }

     FreeNeighbor(newneighbor);
     Free(newneighbor);
     
     return(error);
     } 
extern Neighbor *GetIthNeighbor(INT i,Graph *graph)
     {
     Neighbor *neighbor;
     CHAR *string;
     
     neighbor = 0;
     if(i >= graph->NumberOfNodes)
	  {
	  string = AllocateString(LINELENGTH);
	  sprintf(string,"Illegal Neighbor (%d) in graph %s:%d",
		  i,graph->Name,graph->ID);
	  Error(-1,string);
	  Free(string);
	  }
     else
	  {
	  neighbor = graph->Neighbors + i;
	  }
     return(neighbor);
     }

	  
