/*  FILE     iteration.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    A single iteration of a set of reaction transforms acting on a 
**    set of molecules.  The main call is to PerformOneReactionIteration.
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

#include "gentrans/rset.c"
#include "gentrans/gtrns.c"

#define DEBUG DEBUG0
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void PerformedReactionsFromGraphNodePair(SetOfGraphNodePairs *nodepairs,
                                                SetOfGraphs *gmol,
                                                INT flag,
                                                GraphTransform *graphtransform,
                                                PerformedRxnInfo *adjust,
                                                PerformedRxnMaster *rxnpmaster);
static void AdjustSetOfPerformedRxns(SetOfPerformedRxns *set,
                                     DataSubSet *molcorr);
static void AdjustPerformedRxn(PerformedRxn *prxn,
                               DataSubSet *molcorr);
static void AdjustSetOfMoleculeIDs(SetOfGraphs *results,
                                   DataSubSet *molcorrs,
                                   SetOfGraphs *total);

/*S RxnPerformIteration
*/
/*F  PerformOneReactionIteration(rxnpmaster)
**
**  DESCRIPTION
**   rxnpmaster: The set of info associated with the iteration 
**   
**   The set of transforms is looped through and PerformReactionTransform is
**   called to execute a single transform
**
**  REMARKS
**
*/
extern void PerformOneReactionIteration(PerformedRxnMaster *rxnpmaster)
{
  TransformSet *transformset;
  PerformedRxnInfo *adjust;
  SetOfGraphs *gmol;
  DataSubSetVector *atomsets;
  GraphTransform *transform;
  INT i;
     
  transformset = rxnpmaster->Reactions;
  gmol = AllocateSetOfGraphs;
  CopyFullSetOfGraphs(gmol,rxnpmaster->Molecules);

#if DEBUG >= DEBUG2
  printf("---------------------------------------------------------\n");
  PrintPrettySetOfGraphs("Perform On:",stdout,gmol);
  printf("---------------------------------------------------------\n");
#endif

  atomsets = AllocateDataSubSetVector;
  CopyFullDataSubSetVector(atomsets,rxnpmaster->MoleculeAtomSets);
     
  transform = transformset->Set;
  adjust = rxnpmaster->Adjustments->Set;
  LOOPi(transformset->NumberOfTransforms)
    {
      printf("---------------------------------------------------------\n");
      printf("      %10d%s\n",transform->ID,transform->Name);
      printf("---------------------------------------------------------\n");
#if DEBUG >= DEBUG2
      PrintPrettyGraphTransform("Transform: ",stdout,transform);
#endif
      PerformReactionTransform(transform,
                               adjust,
                               gmol,atomsets,
                               rxnpmaster);
      transform++;
      adjust++;
    }
#if DEBUG >= DEBUG2
  printf("---------------PerformOneReactionIteration: DONE------------------\n");
#endif
  FreeSetOfGraphs(gmol);
  Free(gmol);
  FreeDataSubSetVector(atomsets);
  Free(atomsets);
}

 
/*F PerformReactionTransform(transform,adjust,gmol,atomsets,rxnpmaster)
**
**  DESCRIPTION
**    transform: The reaction to use
**    adjust: The reaction information
**    gmol: The set of molecules to be acted on
**    atomset: The corresponding set of atoms lists for each molecule
**    rxnpmaster: The full set of iteration info
**
**    - The GraphTransformGraphTree is formed by matching each reaction
**      graph within the molecules
**    - The tree is flattened into a list of correspondences (i.e. the
**      matchings of the transforms within the molecules
**    - The correspondences are looped through and PerformedReactionsFromGraphNodePair
**      is called
**
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern void PerformReactionTransform(GraphTransform *transform,
                                     PerformedRxnInfo *adjust,
                                     SetOfGraphs *gmol,
                                     DataSubSetVector *atomsets,
                                     PerformedRxnMaster *rxnpmaster)
{
  GraphTransformGraphTree *tree;
  TotalSetOfTransformPairs *graphcorrset;
  SetOfGraphNodePairs *graphnodepair;
  INT i,flag;
     
  flag = rxnpmaster->Direction;
  tree = FindGraphSetReactionCorr(transform,gmol,atomsets,flag);
  graphcorrset = FlattenTransformCorrTree(tree);

  graphnodepair = graphcorrset->PairSets;
  LOOPi(graphcorrset->NumberOfPairSets)
    {
      PerformedReactionsFromGraphNodePair(graphnodepair,gmol,
                                          flag,
                                          transform,
                                          adjust,
                                          rxnpmaster);
      graphnodepair++;
    }
  FreeGraphTransformGraphTree(tree);
  Free(tree);
  FreeTotalSetOfTransformPairs(graphcorrset);
  Free(graphcorrset);
}

 
/*F AddMetaAtomInformation(newset,gmol)
**
**  DESCRIPTION
**    gmol: Source of meta atom information
**    newset: The new set of graphs
**
**    The meta atom information comes from the 
**    first graph of gmol (it is assumed that 
**    there is at least one graph  -- no check is
**    made).  If the new graph has no meta atom info,
**    then it is added.
**
**  REMARKS
**
*/
static void AddMetaAtomInformation(SetOfGraphs *newset,SetOfGraphs *gmol)
{
  SetOfGraphMetaAtoms *meta;
  Graph *graph;
  int i;
  
  meta = gmol->Graphs->MetaAtoms;
  graph = newset->Graphs;
  LOOPi(newset->NumberOfGraphs)
    {
      if(graph->MetaAtoms == 0)
        {
          graph->MetaAtoms = AllocateSetOfGraphMetaAtoms;
          CopyFullSetOfGraphMetaAtoms(graph->MetaAtoms,meta);
        }
      
      graph++;
    }
}

/*f PerformedReactionsFromGraphNodePair(nodepairs,gmol,flag,graphtransform,adjust,rxnpmaster)
**
**  DESCRIPTION
**    graphnodepair: The correspondences between the molecules and the transform
**    gmol: The total set of molecules
**    flag: The reaction direction (REACTANT,PRODUCT)
**    graphtransform: The reaction
**    adjust: The reaction information
**    rxnpmaster: The iteration information (the result will be put here)
**
**    - From the node pairs, the set of possible combined graphs are 
**      produced.  A set of combined graphs are produced due to inter-
**      and intramolecular reactions (ComputeSetOfCombinedGraphs)
**    - The reaction is performed on each of the combined graphs 
**      (ComputeSingleReaction)
**    - The results are separated into separate reactions 
**      (SeparateToFormReaction)
**    - The graphs are identified in the original set 
**      (IdentifySetOfGraphsWithoutHydrogens) a correspondence list is produced (molcorr)
**    - The molecule ID's are adjusted in the result graphs (AdjustSetOfMoleculeIDs)
**    - The molecule ID's in the reactions are adjusted (AdjustSetOfPerformedRxns)
**    - The final result is added to the master structure
**
**    
**  REMARKS
**
*/
static void PerformedReactionsFromGraphNodePair(SetOfGraphNodePairs *nodepairs,
                                                SetOfGraphs *gmol,
                                                INT flag,
                                                GraphTransform *graphtransform,
                                                PerformedRxnInfo *adjust,
                                                PerformedRxnMaster *rxnpmaster)
{
  SetOfCombinedGraphs *setofcombined;
  TotalSetOfTransformPairs *totaltransformsets;
  SetOfGraphs *setofresults;
  SetOfPerformedRxns *setofrxns;
  DataSubSet *molcorr;
     
  setofcombined = AllocateSetOfCombinedGraphs;
  totaltransformsets = AllocateTotalSetOfTransformPairs;
  ComputeSetOfCombinedGraphs(gmol,nodepairs,
                             setofcombined,totaltransformsets);
  ComputeSingleReaction(nodepairs,setofcombined,graphtransform,
                        totaltransformsets,flag);

  setofresults = AllocateSetOfGraphs;
  setofrxns    = AllocateSetOfPerformedRxns;
  SeparateToFormReaction(nodepairs,setofcombined,setofresults,setofrxns);
  AddMetaAtomInformation(setofresults,gmol);
     
  molcorr = IdentifySetOfGraphsWithoutHydrogens(setofresults,
                                                rxnpmaster->Molecules);
  AdjustSetOfMoleculeIDs(setofresults,molcorr,rxnpmaster->Molecules);
     
  AdjustSetOfPerformedRxns(setofrxns,molcorr);
     
  AddPerformedRxnFromSetIfUnique(setofrxns,
                                 rxnpmaster->Performed,
                                 adjust);
}
 
/*f AdjustSetOfPerformedRxns(set,molcorr)
**
**  DESCRIPTION
**    set: The set of reactions
**    molcorr: The set of molecules correspondences
**
**    Loop over the set of PerformedRxn structures to adjust the 
**    molecule id's (AdjustPerformedRxn)
**
**  REMARKS
**
*/
 
static void AdjustSetOfPerformedRxns(SetOfPerformedRxns *set,
                                     DataSubSet *molcorr)
{
  PerformedRxn *prxn;
  INT i;
     
  prxn = set->Reactions;
  LOOPi(set->NumberOfReactions)
    {
      AdjustPerformedRxn(prxn++,molcorr++);
    }
}

/*f AdjustPerformedRxn(prxn,molcorr)
**
**  DESCRIPTION
**    prxn: The generated reaction
**    molcorr: The set of correspondences
**
**    The molecules id's are changed and the reaction is put into canonical form
**
**  REMARKS
**   
*/
static void AdjustPerformedRxn(PerformedRxn *prxn,
                               DataSubSet *molcorr)
{
  INT *mols,*id,i;
     
  mols = molcorr->Points;
     
  id = prxn->ProductIDs;
  LOOPi(prxn->NumberOfProducts)
    {
      *id = *(mols + *id);
      id++;
    }

  CanonicalPerformedRxn(prxn);
}
 
/*f AdjustSetOfMoleculeIDs(results,molcorrs,total)
**
**  DESCRIPTION
**    
**  REMARKS
**  Check through correspondences of new molecules
**    if correspondence (*id) < 0 then
**       it is a new molecule:
**           Check first if not just previously assigned
**                while loop
**                if previously assigned, use previous ID
**           add to newtotal (*tgraph)
**           change correspondence (*id) to new ID (num)
**           change graph ID (tgraph->ID) to new ID (num)
**           increment new ID count (num++)
**
**
*/
static void AdjustSetOfMoleculeIDs(SetOfGraphs *results,
                                   DataSubSet *molcorrs,
                                   SetOfGraphs *total)
{
  SetOfGraphs *newtotal;
  INT i,totalsize,num,*id,numold,ans,dup;
  Graph *tgraph,*rgraph,*sgraph,*igraph;
     
  num = total->NumberOfGraphs;
  newtotal = AllocateSetOfGraphs;
  CreateSetOfGraphs(newtotal,results->ID,results->Name,
                    num + results->NumberOfGraphs,
                    0);
  if(num > 0) {
    totalsize = num * GraphSize;
    memcpy(newtotal->Graphs,total->Graphs,totalsize);
  }
  tgraph = newtotal->Graphs + num;
  sgraph = tgraph;
  rgraph = results->Graphs;
  id = molcorrs->Points;
  LOOPi(results->NumberOfGraphs) {
    if(*id < 0) {
      dup = -1;
      igraph = sgraph;
      while(dup < 0 && igraph < tgraph) {
	ans = GraphsEqual(igraph,rgraph);
	if(ans) dup = igraph->ID;
	igraph++;
      }
      if(dup >= 0) {
	*id = dup;
      } else {
	memcpy(tgraph,rgraph,GraphSize);
	tgraph->ID = *id = num;
	tgraph++;
	num++;
      }
    } else {
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

