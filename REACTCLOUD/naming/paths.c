/*  FILE     paths.c
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


char *CARBON_ROOTS[NUMBER_OF_CARBON_ROOTS] = 
{
  "meth","eth","prop","but","pent",
  "hex","hept","oct","non","dec",
  "ondec","dodec","tridecane","tetradec","pentadec","hexadec",
  "heptadec","octadec","nonadec","icso"
};
char *CARBON_ENDINGS[NUMBER_OF_CARBON_ENDINGS] = 
{
  "ane","ene","yne","anyl"
};

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
/*F GenerateSingleAtomMolecule(graph,name,valence)
**
**  DESCRIPTION
**
**  REMARKS
**  Fills in Graph (as output)
**
*/
void GenerateSingleAtomMolecule(Graph *graph, CHAR *name, INT valence)
{
  int *node;
  Neighbor *neighbor;

  CreateGraph(graph,2,name,
	      1,0,0,0);
  neighbor = graph->Neighbors;
  node = graph->NodeTypes;
  
  *node = valence;

  CreateNeighbor(neighbor,0,0,0,0);
}
/*F GenerateTwoAtomMolecule(graph,name,valence1,valence2)
**
**  DESCRIPTION
**
**  REMARKS
**  Fills in Graph (as output)
**
*/
void GenerateTwoAtomMolecule(Graph *graph, CHAR *name, INT valence1, INT valence2)
{
  int *node;
  Neighbor *neighbor;

  CreateGraph(graph,2,name,
	      2,0,0,0);
  neighbor = graph->Neighbors;
  node = graph->NodeTypes;
  
  *(node+0) = valence1;
  *(node+1) = valence2;

  CreateNeighbor(neighbor,0,0,1,0);
  *(neighbor->List) = 1;
  neighbor++;
  CreateNeighbor(neighbor,0,0,1,0);
  *(neighbor->List) = 0;
  neighbor++;
}
/*F GenerateLinearThreeAtomMolecule(graph,name,valence1,valence2,valence3)
**
**  DESCRIPTION
**
**  REMARKS
**  Fills in Graph (as output)
**
*/
void GenerateLinearThreeAtomMolecule(Graph *graph, CHAR *name, INT valence1, INT valence2, INT valence3)
{
  int *node;
  Neighbor *neighbor;

  CreateGraph(graph,2,name,
	      3,0,0,0);
  neighbor = graph->Neighbors;
  node = graph->NodeTypes;
  
  *(node+0) = valence1;
  *(node+1) = valence2;
  *(node+2) = valence3;

  CreateNeighbor(neighbor,0,0,1,0);
  *(neighbor->List) = 1;
  neighbor++;
  CreateNeighbor(neighbor,0,0,2,0);
  *(neighbor->List+0) = 0;
  *(neighbor->List+1) = 2;
  neighbor++;
  CreateNeighbor(neighbor,0,0,1,0);
  *(neighbor->List) = 1;
  neighbor++;
}
/*F GenerateMolecules(set)
**
**  DESCRIPTION
**
**  REMARKS
**  Fills in SetOfGraphs (as output)
*/
void GenerateMolecules(SetOfGraphs *set)
{
    Graph *graph;

    graph = set->Graphs + set->NumberOfGraphs;

    GenerateSingleAtomMolecule(graph,"oxy",OXYGEN_RADICAL_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;

    GenerateSingleAtomMolecule(graph,"hydroxy",OXYGEN_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;

    GenerateTwoAtomMolecule(graph,"peroxy",OXYGEN_VALENCE,OXYGEN_RADICAL_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;

    GenerateTwoAtomMolecule(graph,"carbonmonoxide",CARBON_DOUBLE_VALENCE,OXYGEN_TRIPLE_RADICAL_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;

    GenerateTwoAtomMolecule(graph,"ethene",CARBON_DOUBLE_VALENCE,CARBON_DOUBLE_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;

    GenerateTwoAtomMolecule(graph,"hydrogen",HYDROGEN_VALENCE,HYDROGEN_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;

    GenerateTwoAtomMolecule(graph,"hydroperoxy",OXYGEN_VALENCE,OXYGEN_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;

    GenerateLinearThreeAtomMolecule(graph,"ketene",CARBON_DOUBLE_VALENCE,CARBON_DOUBLE_KETENE_VALENCE,OXYGEN_DOUBLE_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;

    GenerateLinearThreeAtomMolecule(graph,"ketenyl",CARBON_RADICAL_DOUBLE_VALENCE,CARBON_DOUBLE_VALENCE,OXYGEN_DOUBLE_VALENCE);
    graph++;
    (set->NumberOfGraphs)++;


}

/* PathsOfValences
 */
/*F path = GenerateCarbonPath(numatoms)
**
**  DESCRIPTION
**    numatoms: The number of atoms in the path
**    path: A DataSubSet with the list of carbon valences
**
**  REMARKS
**
*/
DataSubSet *GenerateCarbonPath(int numatoms)
{
  DataSubSet *path;
  int i,*element;

  path = AllocateDataSubSet;
  CreateDataSubSet(path,numatoms,0,numatoms,numatoms,0);
  
  element = path->Points;
  LOOPi(numatoms)
    {
      *element = SP3_CARBON_VALENCE;
      element++;
    }
  return path;
}
 
/*F ModifyNthValence(path,valpos,valence)
**
**  DESCRIPTION
**    path: The path set up
**    valpos: The valence position to change
**    valence: The new valence to set path to
**
**  REMARKS
**
*/
DataSubSet *ModifyNthValence(DataSubSet *path, int valpos, int valence)
{
  if(valpos < path->NumberOfPoints)
    {
      *(path->Points + valpos) = valence;
    }
  else
    {
      printf("Valence change position exceeds number of atoms in path\n");
      printf("Path not changed\n");
    }
  return path;
}
/*F path = GenerateCarbonNthValencePath(numatoms,radpos,valence)
**
**  DESCRIPTION
**    numatoms: The number of atoms in the path
**    valpos:   The position of the new valence
**    valence:  The new valence to insert
**    path:     The path
**
**  REMARKS
**
*/
DataSubSet *GenerateCarbonNthValencePath(int numatoms, 
					 int valpos,
					 int valence)
{
  DataSubSet *path;
  path = GenerateCarbonPath(numatoms);
  ModifyNthValence(path,valpos,valence);
  return path;
}
 
/*F GenerateCarbonRadicalPath(numatoms,radpos)
**
**  DESCRIPTION
**    numatoms: The number of atoms in the path
**    radpos: The position in path to set to carbon radical
**
**  REMARKS
**
*/
DataSubSet *GenerateCarbonRadicalPath(int numatoms, int radpos)
{
  return GenerateCarbonNthValencePath(numatoms,radpos,CARBON_RADICAL_VALENCE);
}
/*F GenerateDoubleBondPath(numatoms,radpos)
**
**  DESCRIPTION
**    numatoms: The number of atoms in the path
**    db: The position in path to set to first double valence
**
**  REMARKS
**
*/
DataSubSet *GenerateDoubleBondPath(int numatoms, int db)
{
  DataSubSet *path;
  path = GenerateCarbonNthValencePath(numatoms,db+1,CARBON_DOUBLE_VALENCE);
  ModifyNthValence(path,db,CARBON_DOUBLE_VALENCE);
  return path;
}
/*F GenerateTripleBondPath(numatoms,radpos)
**
**  DESCRIPTION
**    numatoms: The number of atoms in the path
**    db: The position in path to set to first triple valence
**
**  REMARKS
**
*/
DataSubSet *GenerateTripleBondPath(int numatoms, int trip)
{
  DataSubSet *path;
  path = GenerateCarbonNthValencePath(numatoms,trip+1,CARBON_TRIPLE_VALENCE);
  ModifyNthValence(path,trip,CARBON_TRIPLE_VALENCE);
  return path;
}
/*S GraphPaths
 */
 
/*F FileBondNeighborBond(neighbor,node1,node2)
**
**  DESCRIPTION
**    neighbor: The neighbor to fill in
**    bond1,bond2: The nodes to fill in
**
**    This is a special case of filling in a graph.
**    This fills in the neighbors for a graph made from
**    a path
**
**  REMARKS
**
*/
void FillInNeighborBond(Neighbor *neighbor,int id, int node1, int node2)
{
  int *lst;

  if(node1 != -1 && node2 != -1)
    neighbor = CreateNeighbor(neighbor,id,0,2,0);
  else
    neighbor = CreateNeighbor(neighbor,id,0,1,0);
  lst = neighbor->List;
  if(node1 != -1)
    {
      *lst = node1;
      lst++;
    }
  if(node2 != -1)
    {
      *lst = node2;
      lst++;
    }
} 
/*F GenerateGraphFromPath(graph,path,cycle)
**
**  DESCRIPTION
**    graph:   The graph
**    path:  The path of valences
**    cycle: if non-zero then make a cycle
**
**  REMARKS
**
*/
void GenerateGraphFromPath(Graph *graph, DataSubSet *path, int cycle)
{
  int nbonds,i,*node,*val;
  Neighbor *neighbor;

  nbonds = path->NumberOfPoints;
  if(cycle)
    nbonds++;
  
  CreateGraph(graph,path->NumberOfPoints,0,
	      path->NumberOfPoints,0,0,0);
  neighbor = graph->Neighbors;
  node = graph->NodeTypes;
  val = path->Points;
  LOOPi(path->NumberOfPoints)
    {
      if(i == 0)
	{
	  if(cycle)
	    {
	      FillInNeighborBond(neighbor,i,1,path->NumberOfPoints-1);
	    }
	  else
	    {
	      if(path->NumberOfPoints != 1)
		FillInNeighborBond(neighbor,i,1,-1);
	    }
	}
      else if(i == path->NumberOfPoints - 1)
	{
	  if(cycle)
	    {
	      FillInNeighborBond(neighbor,i,i-1,0);
	      neighbor++;
	    }
	  else
	    {
	      FillInNeighborBond(neighbor,i,i-1,-1);
	    }
	}
      else
	{
	  FillInNeighborBond(neighbor,i-1,i+1,i-1);
	}
      *node = *val;
      neighbor++;
      node++;
      val++;
    }
}
 
/*F GenerateGraphFromPath(graph,path,cycle)
**
**  DESCRIPTION
**    graph:   The graph
**    path:  The path of valences
**    cycle: if non-zero then make a cycle
**
**  REMARKS
**
*/
void GenerateGraphSingleSub(Graph *graph,DataSubSet *path,INT pos,int ctype,int subtype)
{
  int nbonds,i,*node,*val;
  Neighbor *neighbor;
  int last;

  nbonds = path->NumberOfPoints;
  
  ModifyNthValence(path,pos,ctype);

  CreateGraph(graph,path->NumberOfPoints,0,
	      path->NumberOfPoints+1,0,0,0);
  neighbor = graph->Neighbors;
  node = graph->NodeTypes;
  val = path->Points;
  LOOPi(path->NumberOfPoints)
    {
      if(i == 0)
	{
	  if(path->NumberOfPoints != 1)
	    FillInNeighborBond(neighbor,0,1,-1);
	}
      else if(i == path->NumberOfPoints - 1)
	{
	  FillInNeighborBond(neighbor,i,i-1,-1);
	}
      else
	{
	  FillInNeighborBond(neighbor,i-1,i+1,i-1);
	}
      *node = *val;
      neighbor++;
      node++;
      val++;
    }
  last = path->NumberOfPoints;
  *(graph->NodeTypes+last) = subtype;
  CreateNeighbor((graph->Neighbors+last),pos,0,1,0);
  *(neighbor->List) = pos;
  AddElementToNeighbor(last,graph->Neighbors + pos);
}
/*F graph = CarbonToValence(path,val,name,prefix,graph,set)
**
**  DESCRIPTION
**    path: The path set up
**    valpos: The valence position to change
**    valence: The new valence to set path to
**
**  REMARKS
**
*/
Graph *CarbonToValence(DataSubSet *path, int val, char *name, char *prefix,Graph *graph, SetOfGraphs *set)
{
  int i,len;
  DataSubSet *newpath;

  LOOPi(path->NumberOfPoints) {
    if(*(path->Points + i) == SP3_CARBON_VALENCE) {
      newpath = AllocateDataSubSet;
      CopyFullDataSubSet(newpath,path);
      *(newpath->Points + i) = val;
      GenerateGraphFromPath(graph,newpath,0);
      len = strlen(name)+strlen(prefix)+10;
      graph->Name = AllocateString(len);
      sprintf(graph->Name,"%d-%s-%s",i+1,prefix,name);
      graph++;
      (set->NumberOfGraphs)++;
    }
  }
  return graph;
}
/*F graph = CarbonToValenceFromGraph(val,name,prefix,graph,set)
**
**  DESCRIPTION
**    path: The path set up
**    valpos: The valence position to change
**    valence: The new valence to set path to
**
**  REMARKS
**
*/
Graph *CarbonToValenceFromGraph(int val, char *name, char *prefix,Graph *reference, Graph *graph, SetOfGraphs *set)
{
  int i,len;
  Graph *newgraph;

  LOOPi(reference->NumberOfNodes) {
    if(*(reference->NodeTypes + i) == SP3_CARBON_VALENCE) {
      CopyFullGraph(graph,reference);
      *(graph->NodeTypes + i) = val;
      len = strlen(name)+strlen(prefix)+10;
      graph->Name = AllocateString(len);
      sprintf(graph->Name,"%d-%s-%s",i+1,prefix,name);
      graph++;
      (set->NumberOfGraphs)++;
    }
  }
  return graph;
}
/*F set = GenerateAlkanePaths()
**
**  DESCRIPTION
**    set: A set of Alkane Paths
**
**  REMARKS
**
*/
void GenerateAlkanePaths(SetOfGraphs *set)
{
  DataSubSet *path;
  Graph *graph;
  int i,numtot;
  
  numtot = 3*NUMBER_OF_CARBON_ROOTS*(NUMBER_OF_CARBON_ROOTS+1);
  set = AllocateSetOfGraphs;
  CreateSetOfGraphs(set,0,"Alkanes",NUMBER_OF_CARBON_ROOTS,0);
  set->NumberOfGraphs = 0;
  graph = set->Graphs;
  LOOPi(NUMBER_OF_CARBON_ROOTS)
    {
      path = GenerateCarbonPath(i+1);
      GenerateGraphFromPath(graph,path,0);
      graph++;
    }
}
/*F set = GenerateCyclicAlkanePaths()
**
**  DESCRIPTION
**    set: A set of Alkane Paths
**
**  REMARKS
**
*/
void GenerateCyclicAlkanePaths(SetOfGraphs *set)
{
  DataSubSet *path;
  Graph *graph;
  int i,numtot;
  
  numtot = 3*NUMBER_OF_CARBON_ROOTS*(NUMBER_OF_CARBON_ROOTS+1);
  set = AllocateSetOfGraphs;
  CreateSetOfGraphs(set,0,"Alkanes",NUMBER_OF_CARBON_ROOTS,0);
  set->NumberOfGraphs = 0;
  graph = set->Graphs;
  LOOPi(NUMBER_OF_CARBON_ROOTS)
    {
      path = GenerateCarbonPath(i);
      GenerateGraphFromPath(graph,path,1);
    }
}
 
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
char *ProduceCarbonName(int csize,int count,char *prefix,char *suffix)
{
  char *name;
  name = AllocateString(30);
  if(count == 0)    
    sprintf(name,"%s%s%s",prefix,CARBON_ROOTS[csize],suffix);
  else
    sprintf(name,"%s%d-%s%s",prefix,count,CARBON_ROOTS[csize],suffix);
  return name;
}
/*F set = GenerateAlkylPaths()
**
**  DESCRIPTION
**    set: A set of Alkane Paths
**
**  REMARKS
**
*/
SetOfGraphs *GenerateCarbonPaths()
{
  SetOfGraphs *set;
  DataSubSet *path,*newpath;
  Graph *graph;
  int i,j,k,num,numtot;
  char *nametag,*lastname;

  numtot = 10*NUMBER_OF_CARBON_ROOTS*(NUMBER_OF_CARBON_ROOTS+1);
  printf("Max number of graphs: %d\n",numtot);

  set = AllocateSetOfGraphs;
  CreateSetOfGraphs(set,numtot,"Alkanes",numtot,0);
  set->NumberOfGraphs = 0;

  GenerateMolecules(set);
  graph = set->Graphs + set->NumberOfGraphs;
  LOOPi(NUMBER_OF_CARBON_ROOTS)
    {
      path = GenerateCarbonPath(i+1);
      GenerateGraphFromPath(graph,path,0);
      graph->Name = ProduceCarbonName(i,0,"","ane");
      graph++;
      (set->NumberOfGraphs)++;
      /*
      if(i > 2) {
	GenerateGraphFromPath(graph,path,1);
	graph->Name = ProduceCarbonName(i,0,"cyclo","ane");
	graph++;
	(set->NumberOfGraphs)++;
      }
      */
      FreeDataSubSet(path);
      Free(path);
      num = (i+1)/2+((i+1) % 2);
      LOOPj(num)
	{
	  path = GenerateCarbonRadicalPath(i+1,j);
	  GenerateGraphFromPath(graph,path,0);
	  graph->Name = ProduceCarbonName(i,j+1,"","yl");
#ifdef DEBUG
	  printf("------------------------------------------------------\n");
	  printf("Radical %d %d\n",i,j);
	  PrintPrettyGraph("Radical Made:--:",stdout,graph);
	  printf("------------------------------------------------------\n");
#endif
	  graph++;
	  (set->NumberOfGraphs)++;
	  path = GenerateCarbonPath(i+1);
	  GenerateGraphSingleSub(graph, path,j,CARBON_DOUBLE_VALENCE,OXYGEN_DOUBLE_VALENCE);
	  graph->Name = ProduceCarbonName(i,j+1,"","anal");
	  graph++;
	  (set->NumberOfGraphs)++;
	  graph = CarbonToValenceFromGraph(CARBON_RADICAL_VALENCE,(graph-1)->Name,"yl",graph-1,graph,set);
	  FreeDataSubSet(path);
	  Free(path);
	  path = GenerateCarbonPath(i+1);
	  GenerateGraphSingleSub(graph, path,j,CARBON_RADICAL_DOUBLE_VALENCE,OXYGEN_DOUBLE_VALENCE);
	  graph->Name = ProduceCarbonName(i,j+1,"","ylnal");
	  graph++;
	  (set->NumberOfGraphs)++;
	  FreeDataSubSet(path);
	  Free(path);
	  if(j < num && i > 2 && j+1 < i) {
	      path = GenerateDoubleBondPath(i,j);
	      GenerateGraphFromPath(graph,path,0);
	      graph->Name = ProduceCarbonName(i-1,j+1,"","ene");
	      lastname = graph->Name;
	      graph++;
	      (set->NumberOfGraphs)++;
	      LOOPk(i) {
		if(k != j && k != j+1) {
		  newpath = AllocateDataSubSet;
		  CopyFullDataSubSet(newpath,path);
		  GenerateGraphSingleSub(graph, newpath,k,CARBON_DOUBLE_VALENCE,OXYGEN_DOUBLE_VALENCE);
		  graph->Name = AllocateString(strlen(lastname)+10);
		  sprintf(graph->Name,"%d-al-%s",k+1,lastname);
		  graph++;
		  (set->NumberOfGraphs)++;
		  FreeDataSubSet(newpath);
		  Free(newpath);
		}
	      }
	      graph = CarbonToValence(path,CARBON_RADICAL_VALENCE,lastname,"yl",graph,set);
	      FreeDataSubSet(path);
	      Free(path);
	      path = GenerateTripleBondPath(i,j);
	      GenerateGraphFromPath(graph,path,0);
	      graph->Name = ProduceCarbonName(i,j+1,"","yne");
	      graph++;
	      (set->NumberOfGraphs)++;
	    }
	}
    }
  LOOPi(NUMBER_OF_CARBON_ROOTS)
    {
      path = GenerateCarbonPath(i+1);
      if(i >= 2) {
	GenerateGraphFromPath(graph,path,1);
	graph->Name = ProduceCarbonName(i,0,"cyclo","ane");
	graph++;
	(set->NumberOfGraphs)++;

	ModifyNthValence(path,0,OXYGEN_VALENCE);
	GenerateGraphFromPath(graph,path,1);
	graph->Name = ProduceCarbonName(i,0,"cyclooxi","ane");
	graph++;
	(set->NumberOfGraphs)++;

      }
      FreeDataSubSet(path);
      Free(path);
    }
  printf("Generated %d Standard Graphs\n",set->NumberOfGraphs);
  return set;
}
