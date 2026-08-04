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

static CurrentStructure *InitializeCurrentStructure();
static DataSubSet *CollectElementsOfPriority(FullMoleculeSpecification *fullspec,INT priority);
static void AddNextSubstructure(FullMoleculeSpecification *fullspec,
				DataSubSet *priorityelements,
				CurrentStructure *currentstructure);
static AttachmentRemoved *RemoveAttachment(CurrentStructure *currentstructure, 
					   INT currentattach);
static void AdjustAttachmentPointsOfNewElement(INT offset,
					       INT replacepoint,
					       INT replacepointC,
					       CurrentStructure *element,
					       CurrentStructure *currentstructure);
static INT PickNextStructureToAdd(DataSubSet *priorityelements);
static void AddStructure(CurrentStructure *currentstructure,
			 FullStructuralElement *element);
static void AddStructureNext(CurrentStructure *currentstructure,
			 FullStructuralElement *element);
static void AddStructureFirst(CurrentStructure *currentstructure,
			 FullStructuralElement *element);
static Graph *GenerateSingleMoleculeAsGraph(GenerateStructureMaster *specmaster);

static INT PickPoint(INT max) {
  double fr,frr,fmax,fnum;
  INT index;
  
  fr = (double) rand();
  frr = (double) RAND_MAX;
  fmax = (double) max;
  index = (int) (fmax*fr/(frr+1.0));
  printf("%d %d %d %d \n", index,fr,frr,fmax);
  if(index == max) 
    printf("-------------- %d %d -------------\n",index,max);
  return index;
}

/*F GenerateSingleMolecule(bind)
**
**  DESCRIPTION
**    bind: The bind structure (for molecule and reaction data)
**
**  REMARKS
**
**   Top routine to generate a single molecule from a 
**   specification
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT GenerateSetOfMolecules(BindStructure *bind) {
     CommandMaster *commandmaster;
     GenerateStructureMaster *specmaster;
     INT num,i;
     SetOfGraphs *set;
     MoleculeSet *mols;
     MoleculeSet *molecules,*newmols;
     BaseArgumentType *currentvalue;
     Graph *graph,*graphelement;

     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     specmaster = GetBoundStructure(bind,BIND_GENERATE);

     currentvalue = GetCurrentArgument("NumberOfMolecules",commandmaster);
     num = currentvalue->Integer_Value;
     set = AllocateSetOfGraphs;
     CreateSetOfGraphs(set,commandmaster->ID,commandmaster->Name,
		       num,0);

     graphelement = set->Graphs;
     for(i=0;i<num;i++) {
       graph = GenerateSingleMoleculeAsGraph(specmaster);
       CopyFullGraph(graphelement,graph);
       FreeGraph(graph);
       graphelement++;
     }
     mols = TransferSetOfGraphsToMoleculeSet(set);
     newmols = MergeMoleculeSets(mols,molecules);

     ReplaceBindMoleculeSet(newmols,bind);
  return(SYSTEM_NORMAL_RETURN);
}
/*F GenerateSingleMolecule(bind)
**
**  DESCRIPTION
**    bind: The bind structure (for molecule and reaction data)
**
**  REMARKS
**
**   Top routine to generate a single molecule from a 
**   specification
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT GenerateSingleMolecule(BindStructure *bind) {

  GenerateStructureMaster *specmaster;
  Graph *graph;
  SetOfPropertyTypes *proptypes;
  MoleculeInfo *mol;

  proptypes = InitializeMolecularPropertyTypes(bind->ID,bind->Name);
  specmaster = GetBoundStructure(bind,BIND_GENERATE);
  graph = GenerateSingleMoleculeAsGraph(specmaster);
  mol = AllocateMoleculeInfo;
  GraphToMoleculeInfo(mol,proptypes,graph);

  return(SYSTEM_NORMAL_RETURN);
}
static Graph *GenerateSingleMoleculeAsGraph(GenerateStructureMaster *specmaster){
  FullMoleculeSpecification *fullspec;
  DataSubSet *priorityelements,*priorityset;
  CurrentStructure *currentstructure;
  INT piter;
  INT *priority;
  Graph *graph;

  fullspec = specmaster->FullSpecification;
  currentstructure = InitializeCurrentStructure();
  priorityset = fullspec->PrioritySets;
  priority = priorityset->Points;
  for(piter=0;piter<priorityset->NumberOfPoints;piter++) {
    priorityelements = CollectElementsOfPriority(fullspec,*priority);
    currentstructure->Completed = 0;
    while(currentstructure->Completed == 0) {
      AddNextSubstructure(fullspec,priorityelements,currentstructure);
    }
    priority++;
  }
  return(currentstructure->Structure);
}
/*F current = InitializeCurrentStructure(fullspec)
**
**  DESCRIPTION
**    fullspec: the full structural specification
**
**  REMARKS
**
**   This initializes the structure that is to be created.
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static CurrentStructure *InitializeCurrentStructure(FullMoleculeSpecification *fullspec) {
  CurrentStructure *current;

  current = AllocateCurrentStructure;
  CreateCurrentStructure(current,fullspec->ID,fullspec->Name,0,0,0);
  return current;

}
/*F prioritylist = CollectElementsOfPriority(fullspec,priority)
**
**  DESCRIPTION
**    fullspec: the full structural specification
**    priority: The current priority to isolate
**    prioritylist: The indicies of elements (repeated, see below)
**
**  REMARKS
**
**   This isolates the set of structural elements of the same priority.
**   In addition, each element is repeated according to the minimum and
**   the maximum number of that element. This means the number of this
**   substructure that will appear in the final structure is determined
**   at this stage.
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static DataSubSet *CollectElementsOfPriority(FullMoleculeSpecification *fullspec,INT priority) {
  DataSubSet *priorityelements;
  FullStructuralElement *element;
  DataSubSet *priorityset;
  INT piter,eiter,elementpriority;
  INT i,maxcount,num;
  double fnum,fmin,fmax;
  double fr,frr;
  maxcount = fullspec->NumberOfElements*20;
  priorityelements = AllocateDataSubSet;
  CreateDataSubSet(priorityelements,fullspec->ID,fullspec->Name,
		   fullspec->NumberOfElements,maxcount,0);
  priorityelements->NumberOfPoints = 0;
  element = fullspec->FullStructuralElements;
  for(eiter=0;eiter<fullspec->NumberOfElements;eiter++) {
    elementpriority = element->Info->Priority;
    if(elementpriority == priority) {
      fmin = (double) element->Info->Minimum;
      fmax = (double) element->Info->Maximum;

      num = element->Info->Minimum + PickPoint(element->Info->Maximum - element->Info->Minimum);
      num = element->Info->Minimum + PickPoint(element->Info->Maximum - element->Info->Minimum);
      num = element->Info->Minimum + PickPoint(element->Info->Maximum - element->Info->Minimum);
      num = element->Info->Minimum + PickPoint(element->Info->Maximum - element->Info->Minimum);
      num = element->Info->Minimum + PickPoint(element->Info->Maximum - element->Info->Minimum);
      for(i=0;i<num;i++) {
	*(priorityelements->Points + priorityelements->NumberOfPoints) = eiter;
	priorityelements->NumberOfPoints++;
      }
    }
    element++;
  }
  return priorityelements;
}
/*F AddNextSubstructure(fullspec,priorityelements,currentstructure)
**
**  DESCRIPTION
**    fullspec: the full structural specification
**    priorityelements: The indicies of structures to add (repeated)
**    currentstructure: The current structure to add to
**
**  REMARKS
**
**   This picks one of the structural elements and adds it to the current structure
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static void AddNextSubstructure(FullMoleculeSpecification *fullspec,
				DataSubSet *priorityelements,
				CurrentStructure *currentstructure) {
INT next;
  FullStructuralElement *element;

  if(priorityelements->NumberOfPoints == 0) {
    currentstructure->Completed = 1;
  } else {
    next = PickNextStructureToAdd(priorityelements);
    element = fullspec->FullStructuralElements + next;
    AddStructure(currentstructure,element);
  }
}
/*F next = PickNextStructureToAdd(priorityelements);
**
**  DESCRIPTION
**    priorityelements: The indicies of structures to add (repeated)
**    next: The index of the next element to add
**
**  REMARKS
**
**   This randomly picks one of the structural elements
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static INT PickNextStructureToAdd(DataSubSet *priorityelements) {
  INT index,point;
  DataSubSet *nextlist;
  
  index = PickPoint(priorityelements->NumberOfPoints);
  
  point = *(priorityelements->Points + index);

  nextlist = RemoveI(index,priorityelements);
  FreeDataSubSet(priorityelements);
  CopyFullDataSubSet(priorityelements,nextlist);
  FreeDataSubSet(nextlist);
  Free(nextlist);

  return point;
}
/*F AddStructure(currentstructure,element)
**
**  DESCRIPTION
**    currentstructure: The current structure to add to
**    element: The structural element to add
**
**  REMARKS
**
**   This connects the current structure with the structural element
**   to form a new currentstructure
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static void AddStructure(CurrentStructure *currentstructure,
			 FullStructuralElement *element){
  if(currentstructure->Structure == 0) 
    AddStructureFirst(currentstructure,element);
  else if(currentstructure->Attachments->NumberOfPoints != 0) {
    AddStructureNext(currentstructure,element);
  } else {
    currentstructure->Completed = 1;
  }
}    
/*F AddStructure(currentstructure,element)
**
**  DESCRIPTION
**    currentstructure: The current structure to add to
**    element: The structural element to add
**
**  REMARKS
**
**   This connects the current structure with the structural element
**   to form a new currentstructure
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static void AddStructureFirst(CurrentStructure *currentstructure,
			 FullStructuralElement *element){
  currentstructure->Structure = AllocateGraph;
  CopyFullGraph(currentstructure->Structure,element->MoleculeGraph);
  currentstructure->Attachments = AllocateDataSubSet;
  CopyFullDataSubSet(currentstructure->Attachments,element->Connections);
}
/*F AddStructureNext(currentstructure,element)
**
**  DESCRIPTION
**    currentstructure: The current structure to add to
**    element: The structural element to add
**
**  REMARKS
**
**   This connects the current structure with the structural element
**   to form a new currentstructure
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static void AddStructureNext(CurrentStructure *currentstructure,
			 FullStructuralElement *element){
  INT currentattach, structureattach,replacepoint,replacepointC;
  CombinedGraph *combined,*newcombined;
  AttachmentRemoved *currentR,*elementR;
  CurrentStructure *elementcurrent;
  INT a1,a2,offset;
  Neighbor *n1,*n2;

  currentattach = PickPoint(currentstructure->Attachments->NumberOfPoints);
  structureattach = PickPoint(element->Connections->NumberOfPoints);

  elementcurrent = AllocateCurrentStructure;
  CreateCurrentStructure(elementcurrent,currentstructure->ID,currentstructure->Name,
			 0,element->MoleculeGraph,element->Connections);
  
  /*
  PrintPrettyGraph("current: ",stdout,currentstructure->Structure);
  PrintPrettyDataSubSet(stdout,"Attachments: ",currentstructure->Attachments);
  PrintPrettyGraph("element: ",stdout,element->MoleculeGraph);
  PrintPrettyDataSubSet(stdout,"Attachments: ",elementcurrent->Attachments);
  */
  replacepoint = *(elementcurrent->Attachments->Points + structureattach);
  replacepointC = *(currentstructure->Attachments->Points + currentattach);
  printf("Remove: Element (%d,%d,%d),  Current(%d,%d,%d)\n",
	 replacepoint,structureattach,element->Connections->NumberOfPoints,
	 replacepointC,currentattach,currentstructure->Attachments->NumberOfPoints);
  currentR = RemoveAttachment(currentstructure,currentattach);
  elementR = RemoveAttachment(elementcurrent,structureattach);
  /*  PrintPrettyGraph("currentR: ",stdout,currentR->Structure);
  PrintPrettyGraph("elementR: ",stdout,elementR->Structure);
  */
  offset = currentR->Structure->NumberOfNodes;
  combined = AllocateCombinedGraph;
  CreateCombinedGraph(combined,currentstructure->ID,currentstructure->Name,
		      currentR->Structure,
		      1,0);
  *(combined->Begins) = 0;

  newcombined = AddGraphToCombined(elementR->Structure,combined);

  a1 = currentR->Attachment;
  a2 = elementR->Attachment + offset;
  n1 = newcombined->Combined->Neighbors + a1;
  n2 = newcombined->Combined->Neighbors + a2;
  AddElementToNeighbor(a1,n2);
  AddElementToNeighbor(a2,n1);
  FreeGraph(currentstructure->Structure);
  CopyFullGraph(currentstructure->Structure,newcombined->Combined);

  /*
  PrintPrettyGraph("newcombined with bond: ",stdout,currentstructure->Structure);
  */
  offset = *(newcombined->Begins +1);
  AdjustAttachmentPointsOfNewElement(offset,replacepoint,replacepointC,elementcurrent,currentstructure);  
}
/*F current = RemoveAttachment(currentstructure,currentattach);
**
**  DESCRIPTION
**    currentstructure: The current structure to remove from
**    currentattach: The attach atom
**    current: The current structure with atom removed and new attach assigned
**
**  REMARKS
**
**   This removes the attach atom and assigns the attachment point
**   1. Removes element from attachment list in current structure
**   2. Removes the element from the Graph (not in the current structure)
**   3. Creates AttachmentRemoved structure
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static AttachmentRemoved *RemoveAttachment(CurrentStructure *currentstructure, 
				    INT currentattach) {
  INT minusone,i;
  DataSubSet *attachments;
  INT *npoints,*points;
  Graph *graph;
  DataSubSet *complete,*reducedlist;
  AttachmentRemoved *removed;
  Neighbor *neighbors;
  INT attachpoint;

  minusone = currentstructure->Attachments->NumberOfPoints - 1;
  attachments = AllocateDataSubSet;
  CreateDataSubSet(attachments,currentstructure->ID,currentstructure->Name,
		   minusone,minusone,0);
  npoints = attachments->Points;
  points = currentstructure->Attachments->Points;
  attachpoint = *(points + currentattach);
  for(i=0;i<currentstructure->Attachments->NumberOfPoints;i++) {
    if(i != currentattach) {
      *npoints = *points;
      npoints++;
    }
    points++;
  }

  FreeDataSubSet(currentstructure->Attachments);
  Free(currentstructure->Attachments);
  currentstructure->Attachments = attachments;
  
  graph = currentstructure->Structure;
  complete = CreateCompleteDataSubSet(graph->ID,graph->Name,graph->NumberOfNodes);
  neighbors = Neighbors(attachpoint,graph,complete);
  if(neighbors->NumberOfNeighbors != 1) {
    printf("Number of Neighbors of connection not valid: %d\n",neighbors->NumberOfNeighbors);
  }

  removed = AllocateAttachmentRemoved;
  CreateAttachmentRemoved(removed,currentstructure->ID,currentstructure->Name,
			  0,*(neighbors->List));
  reducedlist = RemoveI(attachpoint,complete);
  removed->Structure = IsolateGraphWithDataSubSet(graph,reducedlist);

  FreeDataSubSet(complete);
  Free(complete);
  FreeNeighbor(neighbors);
  Free(neighbors);

  return removed;
}
/*F AdjustAttachmentPointsOfNewElement(offset,replacepoint,element,currentstructure)
**
**  DESCRIPTION
**    offset: The offset after the first structure
**    element: The structural element that was added
**    currentstructure: The current structure to add to
**
**  REMARKS
**
**   This connects the current structure with the structural element
**   to form a new currentstructure
**
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
static void AdjustAttachmentPointsOfNewElement(INT offset,
					       INT replacepoint,
					       INT replacepointC,
					       CurrentStructure *element,
					       CurrentStructure *currentstructure) {
  DataSubSet *attached;
  INT i,numattached,num,tot;
  INT *points,*curpnts;

  numattached = element->Attachments->NumberOfPoints;
  num         = currentstructure->Attachments->NumberOfPoints;
  tot         = num+numattached;

  attached = AllocateDataSubSet;
  CreateDataSubSet(attached,currentstructure->ID,currentstructure->Name,
		   tot,tot,0);
  points = attached->Points;
  curpnts = currentstructure->Attachments->Points;
  for(i=0;i<num;i++) {
    if(*curpnts < replacepointC)
      *(points) = *curpnts;
    else
      *(points) = *curpnts - 1;
    curpnts++;
    points++;
  }
  curpnts = element->Attachments->Points;
  for(i=0;i<numattached;i++) {
    if(*curpnts < replacepoint)
      *(points) = *curpnts + offset;
    else
      *(points) = *curpnts + offset - 1;
    curpnts++;
    points++;
  }
  FreeDataSubSet(currentstructure->Attachments);
  Free(currentstructure->Attachments);

  currentstructure->Attachments = attached;
}
