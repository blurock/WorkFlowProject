#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"


/*************************************************************************/
/*  These routines are the interface between the chemistry structures and
    the graph structures
*/
/*************************************************************************/

extern DataSubSet *SetUpAtomSetForMolecule(INT flag,
					   MoleculeInfo *molecule)
     {
     MolFileMolecule *mlf;
     DataSubSet *subset;
     INT i,count,*pnt;
     MolFileAtom *atominfo;
     
     mlf = molecule->Molfile;

     subset = AllocateDataSubSet;
     CreateDataSubSet(subset,molecule->ID,molecule->Name,
		      mlf->NAtoms,mlf->NAtoms,0);
     
     atominfo = mlf->Atoms;
     pnt = subset->Points;
     count = 0;
     LOOPi(mlf->NAtoms)
	  {
	  if( (flag == HEAVY_ATOMS && atominfo->AtomicNumber > 1 ) ||
	     flag == ALL_ATOMS)
	       {
	       count++;
	       *pnt++ = i;
	       }
	  atominfo++;
	  }
     subset->NumberOfPoints = count;
     return(subset);
     }

extern DataSubSet *SetUpAtomSetForGraph(INT flag,
					INT valencetype,
					Graph *graph)
     {
     DataSubSet *subset;
     INT i,count,*pnt,*type;

     subset = AllocateDataSubSet;
     CreateDataSubSet(subset,graph->ID,graph->Name,
		      graph->NumberOfNodes,graph->NumberOfNodes,0);
     
     pnt = subset->Points;
     count = 0;
     type = graph->NodeTypes;
     LOOPi(graph->NumberOfNodes)
	  {
	  if((flag == HEAVY_ATOMS && IsValenceAHeavyAtom(*type,valencetype))
	     || flag == ALL_ATOMS)
	       {
	       count++;
	       *pnt++ = i;
	       }
	  type++;
	  }
     subset->NumberOfPoints = count;
     return(subset);
     }


extern SetOfPairSets *IterativeSubGraphPairs(Graph *graph1,
					     Graph *graph2)
     {
     DataSubSet *set1,*set2;
     SetOfPairSets *heavypairs,*totalset;
     
     set1 = SetUpAtomSetForGraph(HEAVY_ATOMS,VALENCE_ATOMIC_NUMBER,graph1);
     set2 = SetUpAtomSetForGraph(HEAVY_ATOMS,VALENCE_ATOMIC_NUMBER,graph2);
     
     heavypairs = FindSubGraphsRoot(0,graph1->Name,
				    graph1,set1,
				    graph2,set2);


     FreeDataSubSet(set1);
     Free(set1);
     FreeDataSubSet(set2);
     Free(set2);
     
     set1 = SetUpAtomSetForGraph(ALL_ATOMS,VALENCE_ATOMIC_NUMBER,graph1);
     set2 = SetUpAtomSetForGraph(ALL_ATOMS,VALENCE_ATOMIC_NUMBER,graph2);
     
     
     totalset = FindSubGraphFromPairSet(0,graph1->Name,
					heavypairs,
					graph1,set1,
					graph2,set2);
     
     FreeDataSubSet(set1);
     Free(set1);
     FreeDataSubSet(set2);
     Free(set2);
     
     FreeSetOfPairSets(heavypairs);
     Free(heavypairs);
     
     return(totalset);
     }



