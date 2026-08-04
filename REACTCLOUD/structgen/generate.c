/*  FILE     generate.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**
**  REFERENCES
**
**  COPYRIGHT (C) 2005  REACTION Project / Edward S. Blurock 
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
#include "generate.h"

static DataSubSet *FindGraphConnections(Graph *graph, int type);
static int CountNumberOfConnections(Graph *graph,int type);
static void DeterminePriorityList(FullMoleculeSpecification *fullset);
static void DeterminePriorityList(FullMoleculeSpecification *fullset);

extern INT GenerateStructureFill(BindStructure *bind) {
     CommandMaster *commandmaster;
     GenerateStructureMaster *specmaster;
     MoleculeStructureSpecification *spec;
     SetOfGraphMetaAtoms *graphmetaatoms;
     SetOfMolFileMetaAtoms *metaatomset;
     StructuralElement *element;
     FullMoleculeSpecification *fullspec;
     FullStructuralElement *full;
     INT i,count;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     specmaster = GetBoundStructure(bind,BIND_GENERATE);
     spec = specmaster->BasicSpecification;
     metaatomset = GetMetaAtomMaster(bind);
     graphmetaatoms = TranslateSetOfMolfileMetaAtoms(metaatomset);

     fullspec = AllocateFullMoleculeSpecification;
     CreateFullMoleculeSpecification(fullspec,1,commandmaster->Name,
				     spec->NumberOfElements,0,0);
     
     element = spec->StructuralElements;
     full    = fullspec->FullStructuralElements;
     count = spec->NumberOfElements;
     for(i=0;i<spec->NumberOfElements;i++) {
       int ret = FillInFullElementSpecification(element,full,graphmetaatoms,bind);
       if(ret == SYSTEM_NORMAL_RETURN) {
	 element++;
	 full++;
       } else {
	 count--;
       }
     }
     fullspec->NumberOfElements = count;
     DeterminePriorityList(fullspec);
     specmaster->FullSpecification = fullspec;
     return(SYSTEM_NORMAL_RETURN);
}

extern int FillInFullElementSpecification(StructuralElement *element,
					  FullStructuralElement *full,
					  SetOfGraphMetaAtoms *graphmetaatoms,
					  BindStructure *bind) {
     MoleculeInfo *molinfo;
     DataBaseInformation *dinfo;
     ChemDBMaster *master;

     INT ret;
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,SUBSTRUCTURE_DATABASE);

     full->Molecule = AllocateMoleculeInfo;
     full->Info = AllocateStructuralElement;
     CopyFullStructuralElement(full->Info,element);
     ret = DBFindMolSubFromString(element->Name,full->Molecule,dinfo);
     if(ret == SYSTEM_NORMAL_RETURN) {
       printf("Read in molecule: %s (%d)\n",full->Molecule->Name,full->Molecule->ID);
       full->MoleculeGraph = GraphFromMolFile(full->Molecule,VALENCE_STANDARD);
       full->MoleculeGraph->MetaAtoms = AllocateSetOfGraphMetaAtoms;
       CopyFullSetOfGraphMetaAtoms(full->MoleculeGraph->MetaAtoms,graphmetaatoms);
       PrintPrettyGraph("--->",stdout,full->MoleculeGraph);
       full->Connections = FindGraphConnections(full->MoleculeGraph,R_GROUP_SPEC);
       printf("Number of Connections: %d\n",full->Connections->NumberOfPoints);
       PrintPrettyDataSubSet(stdout,"Connections: ",full->Connections);
     } else {
       printf("Error in reading: %s\n",element->Name);
     }
  return(ret);
}
static DataSubSet *FindGraphConnections(Graph *graph, int type) {
  DataSubSet *set;
  INT count,i;
  
  count = CountNumberOfConnections(graph,type);
  set = AllocateDataSubSet;
  CreateDataSubSet(set,1,0,graph->NumberOfNodes,count,0);
  count = 0;
  for(i=0;i<graph->NumberOfNodes;i++) {
    if(*(graph->NodeTypes + i) == type) {
      *(set->Points + count) = i;
      count++;
    }
  }
  return set;
}
static int CountNumberOfConnections(Graph *graph,int type) {
  int count,i;
  
  count = 0;
  for(i=0;i<graph->NumberOfNodes;i++) {
    if(*(graph->NodeTypes + i) == type) {
      count++;
    }
  }
  return count;
}
static void DeterminePriorityList(FullMoleculeSpecification *fullset) {
  DataSubSet *priorities,*final;
  FullStructuralElement *element;
  INT i,j,matched,p;

  priorities = AllocateDataSubSet;
  CreateDataSubSet(priorities,fullset->ID,fullset->Name,
		   fullset->NumberOfElements,fullset->NumberOfElements,0);
  priorities->NumberOfPoints = 0;
  element = fullset->FullStructuralElements;
  for(i=0;i<fullset->NumberOfElements;i++) {
    p = element->Info->Priority;
    matched = 0;
    for(j=0;j<priorities->NumberOfPoints;j++) {
      if(p == *(priorities->Points + j))
	matched = 1;
    }
    if(matched == 0) {
      *(priorities->Points + priorities->NumberOfPoints) = p;
      priorities->NumberOfPoints++;
    }
    element++;
  }
  PrintPrettyDataSubSet(stdout,"Priority: ",priorities);
  fullset->PrioritySets = AllocateDataSubSet;
  CopyFullDataSubSet(fullset->PrioritySets,priorities);
}
