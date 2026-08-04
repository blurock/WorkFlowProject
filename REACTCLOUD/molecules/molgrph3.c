/*  FILE   molgraph3.c  
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
#include "naming.h"

#include <math.h> 

static void MolFileAtomFromValence(INT id, MolFileAtom *matom, INT valence);
static void MolFileBondFromGraphBond(Graph *graph, 
				     MolFileBond *mbond,
				     Pair *gbond);
static INT IsolateDigit(INT position, INT value);
static void MolFileDoubleBonds(DataSubSetVector *doubles,
			       MolFileMolecule *molfile);

/*F molset = TransferSetOfGraphsToMoleculeSet(graphset)
**
**  DESCRIPTION
**    
**
**  REMARKS
**
*/
extern MoleculeSet *TransferSetOfGraphsToMoleculeSet(SetOfGraphs *graphset) {
  MoleculeSet *molset;
  MoleculeInfo *mol;
  Graph *graph;
  INT i;
     
  printf("TransferSetOfGraphsToMoleculeSet\n");
  molset = AllocateMoleculeSet;
  CreateMoleculeSet(molset,graphset->ID,graphset->Name,
		    graphset->NumberOfGraphs,0,0,0);
  molset->PropertyTypes = InitializeMolecularPropertyTypes(graphset->ID,
							   graphset->Name);
     
  mol = molset->Molecules;
  graph = graphset->Graphs;
  LOOPi(molset->NumberOfMolecules) {
    GraphToMoleculeInfo(mol,molset->PropertyTypes,graph);
    mol++;
    graph++;
  }
  FillInSubGraphMolsSubs(molset);

  return(molset);
}
static int TestForDoubleBond(int val) {
  int doubleI,ans;
  ans = 0;

  if(IsolateDigit(VAL_DOUBLE_BOND_COUNT,val) > 0)
    ans = 1;
  /* printf("Test: %10d %10d = %3d\n",val,IsolateDigit(VAL_DOUBLE_BOND_COUNT,val),ans);*/
  return ans;
}
extern void GraphToMoleculeInfo(MoleculeInfo *mol, SetOfPropertyTypes *proptypes,Graph *graph) {
    CreateMoleculeInfo(mol,graph->ID+GENERATED_MOLECULE,graph->Name,
		       0,0,0);
    mol->Properties = InitializeSetOfPropertyValues(proptypes);
    mol->Molfile = GraphToMolFile(graph);
    mol->Electronic = ElectronicFromMolFile(mol->Molfile);
  
}
/*f molfile = GraphToMolFile(graph)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern MolFileMolecule *GraphToMolFile(Graph *graph) {
  DataSubSet *atomset;
  PairSet *bondset;
  MolFileMolecule *molfile;
  MolFileAtom *matom;
  INT *gatom,i;
  MolFileBond *mbond;
  Pair *gbond;
  DataSubSetVector *subsetvec;

  atomset = AllocateDataSubSet;
  SetUpAtomSetFromGraph(atomset,ALL_ATOMS,graph);

  subsetvec = FindSetOfPaths(graph,TestForDoubleBond);
  bondset = SetOfBonds(graph,atomset,4*atomset->NumberOfPoints);

  molfile = AllocateMolFileMolecule;
  CreateMolFileMolecule(molfile,graph->ID,graph->Name,
			graph->NumberOfNodes,
			bondset->NumberOfPairs,0,0,0);
  matom = molfile->Atoms;
  gatom = graph->NodeTypes;
  LOOPi(molfile->NAtoms)
    {
      MolFileAtomFromValence(i,matom,*gatom);
      matom++;
      gatom++;
    }
  mbond = molfile->Bonds;
  gbond = bondset->Pairs;
  LOOPi(molfile->NBonds)
    {
      MolFileBondFromGraphBond(graph,mbond,gbond);
      mbond++;
      gbond++;
    }
  MolFileDoubleBonds(subsetvec,molfile);

  FreeDataSubSet(atomset);
  Free(atomset);
  FreePairSet(bondset);
  Free(bondset);
     
  return(molfile);
}
/*f MolFileAtomFromValence(id,matom,valence)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void MolFileAtomFromValence(INT id, MolFileAtom *matom, INT valence) {
  INT charge,atomicnumber;
  CHAR *name;
     
  charge = IsolateDigit(VAL_CHARGE_SPEC,valence);
     
  atomicnumber = IsolateDigit(VAL_ATOMIC_NUMBER,valence);
  name = AtomNameFromAtomicNumber(atomicnumber);
     
  CreateMolFileAtom(matom,id,name,
		    0.0,0.0,0.0,
		    atomicnumber,
		    0.0,0.0,
		    0,0);
  switch(charge)
    {
    case 3:
      matom->Charge = 0.0;
      matom->Radical = 0.0;
      break;
    case 9:
      matom->Charge = 0.0;
      matom->Radical = 1.0;
      break;
    }
  Free(name);
}

     
 
/*f MolFileBondFromGraphBond(graph,mbond,gbond)
**
**  DESCRIPTION
**    This is a very simple version of changing the valence
**    information of the atoms to a multiple bond.  Where this 
**    will fail is a line of resonant bonds (for example,  4 carbon 
**    atoms with carbon bonds, or benzene)
**  REMARKS
**
*/
static void MolFileBondFromGraphBond(Graph *graph, 
				     MolFileBond *mbond,
				     Pair *gbond)
{
  INT valI,valJ,tripleI,tripleJ,doubleI,doubleJ,order,nieghbors;

  valI = *(graph->NodeTypes + gbond->I);
  valJ = *(graph->NodeTypes + gbond->J);
     
  tripleI = IsolateDigit(VAL_TRIPLE_BOND_COUNT,valI);
  tripleJ = IsolateDigit(VAL_TRIPLE_BOND_COUNT,valJ);
     
  /*
    doubleI = IsolateDigit(VAL_DOUBLE_BOND_COUNT,valI);
    doubleJ = IsolateDigit(VAL_DOUBLE_BOND_COUNT,valJ);
    else if(doubleI > 0 && doubleJ > 0)
    order = VAL_DOUBLE;
  */ 
  if(tripleI > 0 && tripleJ > 0)
    order = VAL_TRIPLE;
  else 
    order = VAL_SINGLE;
     
  CreateMolFileBond(mbond,gbond->ID,0,
		    gbond->I,gbond->J,
		    order,
		    0,0);
}
static MolFileBond *FindBond(MolFileMolecule *molfile,
			     int i, int j) {
  MolFileBond *bond;
  int notfound,cnt;

  bond = molfile->Bonds;
  cnt = 0;
  notfound = 1;
  while(notfound && cnt < molfile->NBonds) {
    if(( i == bond->I && j == bond->J ) ||
       ( j == bond->I && i == bond->J ) )
      notfound = 0;
    cnt++;
    if(notfound)
      bond++;
  }
  return bond;

}
static void MolFileDoubleBonds(DataSubSetVector *doubles,
			       MolFileMolecule *molfile) {
  int i,j,bond1,bond2;
  DataSubSet *set;
  MolFileBond *mbond;

  for(i=0;i<doubles->NumberOfVectors;i++) {
    set = doubles->Vector + i;
    for(j=1;j<set->NumberOfPoints;j+=2) {
      bond1 = *(set->Points + j);
      bond2 = *(set->Points + j - 1);
      mbond = FindBond(molfile,bond2,bond1);
      mbond->Order =  VAL_DOUBLE;
    }
  }
}

/*f ans = IsolateDigit(position,value)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT IsolateDigit(INT position, INT value)
{
  double fval,fposition,fans,n1,n2;
  INT ans;
     
  fval = (double) value;
  fposition = (double) position;
  n1 = floor(fval/fposition/10.0)*10;
  n2 = floor(fval/fposition);
	  
  fans = n2 - n1;
     
  ans = (INT) fans;
     
  return(ans);
}
 
