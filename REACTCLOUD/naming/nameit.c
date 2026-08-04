/*  FILE     
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
#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "molprops.h"
#include "naming.h"

 
/*F AtomCountName(namecount,count)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
void AtomCountName(CHAR *namecount, AtomicNumberCount *count) 
{
  CHAR *aname;
  
  if(count->ACount > 0) {
    aname = AtomNameFromAtomicNumber(count->ID);
    if(count->ACount > 1)
      sprintf(namecount,"%s%d",aname,count->ACount);
    else if(count->ACount == 1)
      sprintf(namecount,"%s",aname);
  } else {
    sprintf(namecount," ");
  }
}
/*F NameOfMolecule
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
char *NameOfMolecule(CHAR *molname,INT *molnamecount,MoleculeInfo *mol)
{
  MoleculeAtomCounts *counts;
  AtomicNumberCount *count;
  CHAR *aname,*namecount,*totalname,*cname,*n;
  INT numcount,i,notdone;

  namecount = AllocateString(LINELENGTH);
  totalname = AllocateString(LINELENGTH);
  cname = totalname;
  numcount = LINELENGTH;
  counts = DetermineAtomCounts(mol);
  count = counts->AtomCounts;
  notdone = 0;
  while(notdone >= 0 && notdone < counts->NumberOfAtomCounts) {
    if(count->ID == 6) {
      AtomCountName(namecount,count);
      cname = PrintStringString(cname,&numcount,namecount);
      notdone = -10;
    }
    count++;
    notdone++;
  }
  count = counts->AtomCounts;
  LOOPi(counts->NumberOfAtomCounts) {
    if(count->ID != 6) {
      AtomCountName(namecount,count);
      cname = PrintStringString(cname,&numcount,namecount);
    }
    count++;
  }
  EliminateBlanks(totalname);
  /* printf("The name of the molecule %s: %s\n",mol->Name,totalname);*/
  n = PrintStringString(molname,molnamecount,totalname); 
 
  Free(namecount);
  Free(totalname);
  FreeMoleculeAtomCounts(counts);
  Free(counts);

  return n;
}
 
/*F NewNamesForMolecules(molset)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void NewNamesForMolecules(MoleculeSet *molset)
{
  MoleculeInfo *mol;
  INT i,ans,molnamecount;
  Graph *graph;
  char *molcounts,*molname,*newname;
  SetOfGraphs *set;

  set = GenerateCarbonPaths();
  newname = AllocateString(LINELENGTH);
  molcounts = AllocateString(LINELENGTH);
  molnamecount = LINELENGTH;
  mol = molset->Molecules;
  LOOPi(molset->NumberOfMolecules)
    {
      molnamecount = LINELENGTH;
      NameOfMolecule(molcounts,&molnamecount,mol);

      graph = GraphFromMolFile(mol,VALENCE_STANDARD);
      ans = CheckGraphInSet(graph,set);
      if(ans != -1) {
	if(ans >= EQUAL_GRAPH_OFFSET)
	  molname = CopyString((set->Graphs + ans - EQUAL_GRAPH_OFFSET)->Name);
	else
	  molname = CopyString((set->Graphs + ans)->Name);
      }
      else
	molname = CopyString("");
      
      if(ans >= EQUAL_GRAPH_OFFSET)
	sprintf(newname,"%s",molname);
      else
	sprintf(newname,"%s-(%s).%s",mol->Name,molcounts,molname);
	
      Free(mol->Name);
      Free(molname);

      mol->Name = CopyString(newname);
      printf("New Molecule Name: %s \n",newname);
      mol++;
      FreeGraph(graph);
      Free(graph);
    }
  Free(newname);
  Free(molcounts);
  
}
