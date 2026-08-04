/*  FILE     combined.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    From the SetOfGraphNodePairs generate a set of combined graphs
**    needed to perform the reaction.
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
static void CombinedGraphFromGraphNodePairs(SetOfGraphNodePairs *nodepairs,
					    SetOfCombinedGraphs *finalcombined,
					    TotalSetOfTransformPairs *finalpairs,
					    SetOfGraphs *gmol);

static void AddCombinedGraphs(CombinedGraph *graph, 
			      SetOfCombinedGraphs *set);

static void AddGraphNodePairs(SetOfGraphNodePairs *pairs,
			      TotalSetOfTransformPairs *set);

static void 
     CombinedGraphFromGraphNodePairsIterate(INT level,
					    SetOfGraphNodePairs *original,
					    SetOfGraphNodePairs *nodepairs,
					    CombinedGraph *reference,
					    DataSubSet *moleculelist,
					    SetOfCombinedGraphs *totalcombined,
					    TotalSetOfTransformPairs *totalpairs,
					    DataSubSetVector *nodelists,
					    Graph *graphs, INT numgraphs);

static INT TotalNodeLevels(SetOfGraphNodePairs *set);

static void AddLevelMolecule(INT level,
			     SetOfGraphNodePairs *original,
			     SetOfGraphNodePairs *nodepairs,
			     CombinedGraph *reference,
			     DataSubSet *moleculelist,
			     SetOfCombinedGraphs *totalcombined,
			     TotalSetOfTransformPairs *totalpairs,
			     DataSubSetVector *nodelists,
			     Graph *graphs, INT numgraphs);

static void UsePreviousMolecule(INT level,
				SetOfGraphNodePairs *original,
				SetOfGraphNodePairs *nodepairs,
				CombinedGraph *reference,
				DataSubSet *moleculelist,
				SetOfCombinedGraphs *totalcombined,
				TotalSetOfTransformPairs *totalpairs,
				DataSubSetVector *nodelists,
				Graph *graphs, INT numgraphs);

static DataSubSet *AddMolIDToMoleculeList(INT molid, DataSubSet *moleculelist);

static SetOfGraphNodePairs *ModifySetOfGraphNodePairs(INT level,
						      INT molid,
						      SetOfGraphNodePairs *pairs);

static INT NodeListsClashWithPrevious(INT level, DataSubSetVector *sets);

static INT MoleculeListClashes(INT level,
			       DataSubSetVector *sets,
			       DataSubSet *molids);

static void FillInNodeList(DataSubSetVector *nodelist,
			   SetOfGraphNodePairs *nodepairs);

static DataSubSetVector *InitializeNodeList(DataSubSet *molids,
					    SetOfGraphs *set);

static DataSubSet *AddPointToDataSubSet(INT point, 
					DataSubSet *set);

static INT PointsInCommon(DataSubSet *set1,
			  DataSubSet *set2);


/*S ComputeSetOfCombinedGraphs
*/
/*F ComputeSetOfCombinedGraphs(gmol,nodepairs,setofcombined,totaltransformsets)
**
**  DESCRIPTION
**    gmol: The set of molecules
**    nodepairs: The set ofGraphNodePairs to combine
**    setofcombined: Allocated space for the set of combined graphs generated
**    totaltransformsets:  
**
**    - Create the set of combined graphs (over-estimating how many are needed)
**    - Create a TotalSetOfTransformPairs for each combined graph
**    - Find the combined graphs (CombinedGraphFromGraphNodePairs)
**
**
**  REMARKS
**     The initial allocation of the number of combined graphs needed is
**     three times the number of pairs
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern void ComputeSetOfCombinedGraphs(SetOfGraphs *gmol,
				       SetOfGraphNodePairs *nodepairs,
				       SetOfCombinedGraphs *setofcombined,
				       TotalSetOfTransformPairs *totaltransformsets)
     {
     INT num;
     
     num = nodepairs->NumberOfPairs * 3;
     
     CreateSetOfCombinedGraphs(setofcombined,gmol->ID,gmol->Name,
			       num,0);
     setofcombined->NumberOfCGraphs = 0;

     CreateTotalSetOfTransformPairs(totaltransformsets,
				    nodepairs->ID,nodepairs->Name,
				    num,0);
     totaltransformsets->NumberOfPairSets = 0;
     
     CombinedGraphFromGraphNodePairs(nodepairs,
				     setofcombined,totaltransformsets,
				     gmol);
     if(totaltransformsets->NumberOfPairSets != setofcombined->NumberOfCGraphs)
	  Error(-1,"Error In PerformSingleReactionFlat");
     }
 
/*f CombinedGraphFromGraphNodePairs(nodepairs,finalcombined,finalpairs,gmol)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void CombinedGraphFromGraphNodePairs(SetOfGraphNodePairs *nodepairs,
					    SetOfCombinedGraphs *finalcombined,
					    TotalSetOfTransformPairs *finalpairs,
					    SetOfGraphs *gmol)
     {
     DataSubSet *listofmolecules,*molforreactionpart;
     DataSubSetVector *nodelist;
     CombinedGraph *combinedref;
     SetOfGraphNodePairs *original;
     INT num;
     
     num = nodepairs->NumberOfPairs;
     listofmolecules = AllocateDataSubSet;
     CreateDataSubSet(listofmolecules,nodepairs->ID,nodepairs->Name,
		      num,num,0);
     listofmolecules->NumberOfPoints = 0;
     
     combinedref = AllocateCombinedGraph;
     CreateCombinedGraph(combinedref,gmol->ID,gmol->Name,
			 0,0,0);
     
     molforreactionpart = ListOfMoleculesFromGraphNodePairs(NODE_PAIR_REACTANT,nodepairs);
     nodelist = InitializeNodeList(molforreactionpart,gmol);
     FillInNodeList(nodelist,nodepairs);
     
     original = AllocateSetOfGraphNodePairs;
     CopyFullSetOfGraphNodePairs(original,nodepairs);
     CombinedGraphFromGraphNodePairsIterate(0,original,nodepairs,
					    combinedref,listofmolecules,
					    finalcombined,
					    finalpairs,
					    nodelist,
					    gmol->Graphs,gmol->NumberOfGraphs);
     FreeDataSubSet(listofmolecules);
     Free(listofmolecules);
     FreeDataSubSet(molforreactionpart);
     Free(molforreactionpart);
     FreeCombinedGraph(combinedref);
     Free(combinedref);
     FreeDataSubSetVector(nodelist);
     Free(nodelist);
     FreeSetOfGraphNodePairs(original);
     Free(original);
     }
/*S IntraInterMolecular
**  Main Decision Routines for Intra and Inter- Molecular Reactions
**           CombinedGraphFromNodePairsIterate - 
**                            The main branching routine
**           AddLevelMolecule                  -
**                             Add Molecule To list and then iterates to next
**           UsePrevious                       -
**                             Combine nodes with previous molecule in list and
**                             then iterate to next
*/			    
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AddCombinedGraphs(CombinedGraph *graph, 
				     SetOfCombinedGraphs *set)
     {
     CopyFullCombinedGraph(set->CGraphs + set->NumberOfCGraphs,
			   graph);
     set->NumberOfCGraphs +=1;
     }
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AddGraphNodePairs(SetOfGraphNodePairs *pairs,
			      TotalSetOfTransformPairs *set)
     {
     CopyFullSetOfGraphNodePairs(set->PairSets  + set->NumberOfPairSets,
				 pairs);
     set->NumberOfPairSets +=1;
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void 
     CombinedGraphFromGraphNodePairsIterate(INT level,
					    SetOfGraphNodePairs *original,
					    SetOfGraphNodePairs *nodepairs,
					    CombinedGraph *reference,
					    DataSubSet *moleculelist,
					    SetOfCombinedGraphs *totalcombined,
					    TotalSetOfTransformPairs *totalpairs,
					    DataSubSetVector *nodelists,
					    Graph *graphs, INT numgraphs)
     {
     if(level >= TotalNodeLevels(original))
	  {
	  AddCombinedGraphs(reference,totalcombined);
	  AddGraphNodePairs(nodepairs,totalpairs);
	  }
     else
	  {
	  if(NodeListsClashWithPrevious(level,nodelists))
	       {
	       AddLevelMolecule(level,original,nodepairs,
				reference,moleculelist,
				totalcombined,totalpairs,nodelists,
				graphs,numgraphs);
	       }
	  else if(MoleculeListClashes(level,nodelists,moleculelist))
	       {
	       AddLevelMolecule(level,original,nodepairs,
				reference,moleculelist,
				totalcombined,totalpairs,nodelists,
				graphs,numgraphs);
	       UsePreviousMolecule(level,original,nodepairs,
				   reference,moleculelist,
				   totalcombined,totalpairs,nodelists,
				   graphs,numgraphs);
	       }
	  else
	       {
	       AddLevelMolecule(level,original,nodepairs,
				reference,moleculelist,
				totalcombined,totalpairs,nodelists,
				graphs,numgraphs);
	       }
	  }
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT TotalNodeLevels(SetOfGraphNodePairs *set)
     {
     INT level,i;
     GraphNodePair *pair;
     
     level = 0;
     pair = set->Pairs;
     LOOPi(set->NumberOfPairs)
	  {
	  if(level < pair->TransformN->Molecule)
	       level = pair->TransformN->Molecule;
	  pair++;
	  }
     return(level+1);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AddLevelMolecule(INT level,
			     SetOfGraphNodePairs *original,
			     SetOfGraphNodePairs *nodepairs,
			     CombinedGraph *reference,
			     DataSubSet *moleculelist,
			     SetOfCombinedGraphs *totalcombined,
			     TotalSetOfTransformPairs *totalpairs,
			     DataSubSetVector *nodelists,
			     Graph *graphs, INT numgraphs)
     {
     DataSubSet *levelnodelist,*newmoleculelist;
     CombinedGraph *newcombined;
     SetOfGraphNodePairs *newnodes;
     INT molid;
     
     levelnodelist = nodelists->Vector + level;
     molid = levelnodelist->ID;
     newmoleculelist = AddMolIDToMoleculeList(molid,moleculelist);
     newcombined = AddGraphToCombined(graphs+molid,
				      reference);
     newnodes = ModifySetOfGraphNodePairs(level,
					  moleculelist->NumberOfPoints,
					  nodepairs);     
     CombinedGraphFromGraphNodePairsIterate(level + 1,
					    original,
					    newnodes,
					    newcombined,
					    newmoleculelist,
					    totalcombined,
					    totalpairs,
					    nodelists,
					    graphs,numgraphs);
     FreeCombinedGraph(newcombined);
     Free(newcombined);
     FreeSetOfGraphNodePairs(newnodes);
     Free(newnodes);
     FreeDataSubSet(newmoleculelist);
     Free(newmoleculelist);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void UsePreviousMolecule(INT level,
				SetOfGraphNodePairs *original,
				SetOfGraphNodePairs *nodepairs,
				CombinedGraph *reference,
				DataSubSet *moleculelist,
				SetOfCombinedGraphs *totalcombined,
				TotalSetOfTransformPairs *totalpairs,
				DataSubSetVector *nodelists,
				Graph *graphs, INT numgraphs)
     {
     DataSubSet *levelnodelist;
     INT molid,*previousmolid,i;
     SetOfGraphNodePairs *newnodes;
     
     levelnodelist = nodelists->Vector + level;
     molid = levelnodelist->ID;
     previousmolid = moleculelist->Points;
     LOOPi(moleculelist->NumberOfPoints)
	  {
	  if(*previousmolid == molid)
	       {
	       newnodes = ModifySetOfGraphNodePairs(level,i,nodepairs);
	       CombinedGraphFromGraphNodePairsIterate(level + 1,
						      original,
						      newnodes,
						      reference,
						      moleculelist,
						      totalcombined,
						      totalpairs,
						      nodelists,
						      graphs,numgraphs);
	       FreeSetOfGraphNodePairs(newnodes);
	       Free(newnodes);
	       }
	  previousmolid++;
	  }
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static DataSubSet *AddMolIDToMoleculeList(INT molid, DataSubSet *moleculelist)
     {
     DataSubSet *newmollist;
     
     newmollist = AddPointToDataSubSet(molid,moleculelist);
     return(newmollist);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static SetOfGraphNodePairs *ModifySetOfGraphNodePairs(INT level,
						      INT molid,
						      SetOfGraphNodePairs *pairs)
     {
     SetOfGraphNodePairs *new;
     GraphNodePair *newpair,*pair;
     INT i;
     
     new = AllocateSetOfGraphNodePairs;
     CopyFullSetOfGraphNodePairs(new,pairs);
     
     newpair = new->Pairs;
     pair = pairs->Pairs;
     LOOPi(new->NumberOfPairs)
	  {
	  if(pair->TransformN->Molecule == level)
	       newpair->GraphN->Molecule = molid;
	  newpair++;
	  pair++;
	  }
     return(new);
     }

/*S IntraInterCheck
**   Inter- Intra-Molecular Condition Check Routines      
*/
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT NodeListsClashWithPrevious(INT level, DataSubSetVector *sets)
     {
     DataSubSet *currentlist,*previous;
     INT common,i;
     
     common = 0;
     
     if(level >= sets->NumberOfVectors)
	  Error(-1,"Error In NodeListsClashWithPrevious");
     else
	  {
	  currentlist = sets->Vector + level;
	  previous = sets->Vector;
	  common = 0;
	  LOOPi(level)
	       {
	       if(previous->ID == currentlist->ID)
		    {
		    if(PointsInCommon(currentlist,previous))
			 common = 1;
		    }
	       previous++;
	       }
	  }
     return(common);
     }
 
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT MoleculeListClashes(INT level,
			       DataSubSetVector *sets,
			       DataSubSet *molids)
     {
     INT common;
     DataSubSet *currentlist;
     
     common = 0;
     if(level >= sets->NumberOfVectors)
	  Error(-1,"Error In NodeListsClashWithPrevious");
     else
	  {
	  currentlist = sets->Vector + level;
	  if(IntegerMemberOf(currentlist->ID,
			     molids->Points,molids->NumberOfPoints))
	       common = 1;
	  }
     return(common);
     }
 
/*S CombinedInitialization
*/
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void FillInNodeList(DataSubSetVector *nodelist,
			   SetOfGraphNodePairs *nodepairs)
     {
     DataSubSet *list;
     GraphNodePair *pair;
     INT molid,rxn,*node,i;
     
     list = nodelist->Vector;
     pair = nodepairs->Pairs;
     if(nodepairs->NumberOfPairs > 0)
	  {
	  molid = pair->GraphN->Molecule;
	  rxn = pair->TransformN->Molecule;
	  node = list->Points;
	  LOOPi(nodepairs->NumberOfPairs)
	       {
	       if(rxn != pair->TransformN->Molecule ||
		  molid != pair->GraphN->Molecule)
		    {
		    molid = pair->GraphN->Molecule;
		    rxn = pair->TransformN->Molecule;
		    list++;
		    node = list->Points;
		    }
	       *node = pair->GraphN->GNode;
	       list->NumberOfPoints += 1;
	       node++;
	       pair++;
	       }
	  }
     
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static DataSubSetVector *InitializeNodeList(DataSubSet *molids,
					    SetOfGraphs *set)
     {
     DataSubSetVector *nodesets;
     Graph *graph;
     DataSubSet *nodeset;
     INT i,*molid;
     
     nodesets = AllocateDataSubSetVector;
     CreateDataSubSetVector(nodesets,molids->ID,molids->Name,
			    molids->NumberOfPoints,
			    0);
     nodeset = nodesets->Vector;
     molid = molids->Points;
     LOOPi(nodesets->NumberOfVectors)
	  {
	  if(*molid >= set->NumberOfGraphs)
	       Error(-1,"Error in InitializeNodeList");
	  else
	       {
	       graph = set->Graphs + *molid;
	       CreateDataSubSet(nodeset,*molid,molids->Name,
				graph->NumberOfNodes,
				graph->NumberOfNodes,
				0);
	       nodeset->NumberOfPoints = 0;
	       }
	  nodeset++;
	  molid++;
	  }
     return(nodesets);
     }
/*S PointSetsCombined
*/
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static DataSubSet *AddPointToDataSubSet(INT point, 
					DataSubSet *set)
     {
     INT i,num,*newpoints,*oldpoints;
     DataSubSet *newset;
     
     num = set->NumberOfPoints + 1;
     newset = AllocateDataSubSet;
     CreateDataSubSet(newset,set->ID,set->Name,
		      num,num,0);
     
     newpoints = newset->Points;
     oldpoints = set->Points;
     LOOPi(set->NumberOfPoints)
	  *newpoints++ = *oldpoints++;
	  
     *newpoints = point;
     
     return(newset);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT PointsInCommon(DataSubSet *set1,
			  DataSubSet *set2)
     {
     INT *pnt1,i,common;
     
     common = 0;
     pnt1 = set1->Points;
     LOOPi(set1->NumberOfPoints)
	  {
	  if(IntegerMemberOf(*pnt1,set2->Points,set2->NumberOfPoints))
	       common = 1;
	  pnt1++;
	  }
     return(common);
     }
/* CombinedMoleculeList
*/
 
/*f list = ListOfMoleculesFromGraphNodePairs(flag,nodepairs)
**
**  DESCRIPTION
**   This routine looks at the Molecule ID in the set of graph node pairs and 
**  forms a list of unique molecules (in a DataSubSet)
**  
**  REMARKS
**
*/
extern DataSubSet 
     *ListOfMoleculesFromGraphNodePairs(INT flag,
					SetOfGraphNodePairs *nodepairs)
     {
     DataSubSet *list;
     GraphNodePair *pair;
     INT i,*molid,refmol,refrxn;
     
     list = AllocateDataSubSet;
     CreateDataSubSet(list,nodepairs->ID,nodepairs->Name,
		      nodepairs->NumberOfPairs,
		      nodepairs->NumberOfPairs,
		      0);
     pair = nodepairs->Pairs;
     molid = list->Points;

     refmol = pair->GraphN->Molecule;
     refrxn = pair->TransformN->Molecule;
     switch(flag)
	  {
     case NODE_PAIR_REACTANT:
	  *molid = refmol;
	  break;
     case NODE_PAIR_TRANSFORM:
	  *molid = refrxn;
	  break;
     default:
	  Error(-1, "Error in ListOfMoleculesFromGraphNodePairs");
	  *molid = -1;
	  break;
	  }
     
     list->NumberOfPoints = 1;
     molid++;
     LOOPi(nodepairs->NumberOfPairs)
	  {
	  if(refmol != pair->GraphN->Molecule ||
	     refrxn != pair->TransformN->Molecule)
	       {
	       refmol = pair->GraphN->Molecule;
	       refrxn = pair->TransformN->Molecule;
	       switch(flag)
		    {
	       case NODE_PAIR_REACTANT:
		    *molid = refmol;
		    break;
	       case NODE_PAIR_TRANSFORM:
		    *molid = refrxn;
		    break;
	       default:
		    Error(-1, "Error in ListOfMoleculesFromGraphNodePairs");
		    *molid = -1;
		    break;
		    }
	       molid++;
	       list->NumberOfPoints += 1;
	       }
	  pair++;
	  }
     return(list);
     }

