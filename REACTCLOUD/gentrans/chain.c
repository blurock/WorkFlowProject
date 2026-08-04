/*  FILE     chain.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Routines for generating a mechanism from a chain of reaction transforms
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

#include "gentrans/chain.c"

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static PerformedRxnMaster *ChainReactionLoop(ChainSequence *chain,
					     PerformedRxnMaster *rxnpmaster,
					     BindStructure *bind);
static PerformedRxnMaster *ChainSingleStepReactionSetUp(SetOfGraphs *current,
							SetOfGraphs *chainmols,
							ChainSequenceElement *step,
							INT direction,
							BindStructure *bind);

 
/*F  ret = PerformChain(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Menu routine to generate a mechanism from a chain of transforms
**
**    1. Read in a set molecules
**    2. Convert all to graphs
**    3. Read in the chain sequence
**    4. Perform the chain sequence
**    5. Identify the molecules generated against known
**    6. Store the result
**
**  REMARKS
**     This is the call routine which sets up the ChainSequence and SetOfGraphs
**     structures for the call to ChainReactionSet
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT PerformChain(BindStructure *bind)
     {
     MoleculeSet *molset;
     DataSubSet *molsubset;
     PerformedRxnMaster *result;
     ChainSequence *chain;
     SetOfGraphs *molecules;
     
     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);

     molsubset = ReadInMoleculeList("TransformDir",
				    "TransformMol",
				    TRANSFORM_MOLECULE_SUFFIX,
				    MOL_ID_BY_NAME,
				    molset,
				    bind);
     molecules = PutMoleculeSetInSetOfGraphs(molsubset,
					     VALENCE_STANDARD,
					     bind);
     chain = ReadInChainSequenceList("TransformDir",
				     "TransformRxn",
				     TRANSFORM_LIST_SUFFIX,
				     MOL_ID_BY_NAME,
				     RXN_ID_BY_NUMBER,
				     bind);
     
     result = ChainReactionSet(chain,REACTANT,molecules,bind);

     IdentifyGraphsInMaster(result->Molecules,bind);
     
     printf("############################################################\n");
     printf("                        Final Result\n");
     PrintPrettyLevelResult(result);
     PutPerformedReactionMaster(result,bind);
     
     return(NORMAL_RETURN);     
     }

/*S ChainWorkRoutines
*/
 
/*F performed = ChainReactionSet(chain,molecules,bind)
**
**  DESCRIPTION
**    
**    Set up for ChainReactionLoop (where each transform in the sequence
**    is actually executed.  Initializes the final PerformedRxnMaster
**    structure:
**    1. Renumber the graphs id's to sequential numbers
**    2. Initialize SetOfPerformedRxns to no reactions
**    3. Perform loop (call to ChainReactionLoop)
**
*/
extern PerformedRxnMaster *ChainReactionSet(ChainSequence *chain,
					    INT direction,
					    SetOfGraphs *molecules,
					    BindStructure *bind)
     {
     PerformedRxnMaster *total,*newtotal;
     Graph *graph;
     INT i;
     
     total = AllocatePerformedRxnMaster;
     CreatePerformedRxnMaster(total,0,chain->Name,
			      direction,
			      molecules,
			      0,0,0,0);

     graph = total->Molecules->Graphs;
     LOOPi(total->Molecules->NumberOfGraphs)
	  {
	  graph->ID = i;
	  graph++;
	  }
     
     total->Performed = AllocateSetOfPerformedRxns;
     CreateSetOfPerformedRxns(total->Performed,
			      chain->ID,
			      chain->Name,
			      0,0);

     newtotal = ChainReactionLoop(chain,total,bind);

     return(newtotal);
     }

 
/*f performed = ChainReactionLoop(chain,rxnpmaster,bind)
**
**  DESCRIPTION
**    chain: The sequence of reactions
**    rxnpmaster: The initialized PerformedRxnMaster
**    bind: Bind Structures
**    performed: The total result
**
**    - Set up the set of initial molecules (gmol)
**    - Loop over chain sequence (loop only if new molecules generated)
**      - Set up the chain step (transmaster)
**      - Perform the chain step (PerformOneReactionIteration)
**      - Determine the number of new molecules generated
**      - Update the total PerformedRxnMaster
**      - Put the newly generated molecules as those to be used in the next step
**
**    
**  REMARKS
**
*/
static PerformedRxnMaster *ChainReactionLoop(ChainSequence *chain,
					     PerformedRxnMaster *rxnpmaster,
					     BindStructure *bind)
     { 
     PerformedRxnMaster *newtotal,*transmaster;
     SetOfGraphs *gmol,*gmol1;
     INT i,offset,numnewmolecules,numstartmolecules;
     ChainSequenceElement *step;
     
     gmol = AllocateSetOfGraphs;
     CopyFullSetOfGraphs(gmol,rxnpmaster->Molecules);

     newtotal = rxnpmaster;

     offset = 0;

     numnewmolecules = -1;
     step = chain->Steps;
     LOOPi(chain->NumberOfSteps)
	  {
	  if(numnewmolecules != 0)
	       {
		 gmol1 = UnionSetOfGraphs(gmol,chain->Molecules);
		 printf("Number of Graph gmol: %d\n", gmol->NumberOfGraphs);
		 printf("Number of Graph ,chain->Molecules: %d\n",chain->Molecules->NumberOfGraphs);
		 printf("Number of Graph gmol1: %d\n", gmol1->NumberOfGraphs);
		 
		 FreeSetOfGraphs(gmol);
		 Free(gmol);
	       transmaster = ChainSingleStepReactionSetUp(gmol1,
							  chain->Molecules,
							  step,
							  rxnpmaster->Direction,
							  bind);
	       numstartmolecules = transmaster->Molecules->NumberOfGraphs;
	       
	       PerformOneReactionIteration(transmaster);
	       
	       numnewmolecules =  
		    transmaster->Molecules->NumberOfGraphs - numstartmolecules;
	       printf("UpdatePerformedRxnMaster(\n");
	       newtotal = UpdatePerformedRxnMaster(newtotal,transmaster);
	       
	       offset += numnewmolecules;
	       printf("LastNGraphs\n");

	       gmol = LastNGraphs(numnewmolecules,
				   transmaster->Molecules);
	       step++;
	       printf("Loop Bottom: ChainReactionLoop\n");

	       }
	  }
     return(newtotal);
     }     

 
/*f performed = ChainSingleStepReactionSetUp(current,chainmols,step,direction,bind)
**
**  DESCRIPTION
**    current: The current set of molecules to react (those generated from the last sequence)
**    chainmols: Those molecules to be included every step
**    step: This chain sequence element
**    direction: Reaction (REACTANT) or Retrosynthetic (PRODUCT) direction
**    performed: The setup for a single transform set run for chains
**
**    Set up the PerformedRxnMaster for a single set of transforms in a chain
**    of transforms:
**
**    - Create PerformedRxnMaster
**    - Add the last generated molecules, those to be included in all steps
**      and those to be included in this step into the set of molecules
**    - Set up the atomsets (all atoms) for this set of molecules
**    - Initialize the SetOfPerformedReactions to no reactions 
**
**  REMARKS
**
*/
static PerformedRxnMaster *ChainSingleStepReactionSetUp(SetOfGraphs *current,
							SetOfGraphs *chainmols,
							ChainSequenceElement *step,
							INT direction,
							BindStructure *bind)
     {
     SetOfGraphs *molset;
     PerformedRxnMaster *transmaster;
     PerformedRxnInfo *adjust;
     
     transmaster = AllocatePerformedRxnMaster;
     CreatePerformedRxnMaster(transmaster,0,current->Name,
			      direction,
			      0,0,0,0,0);
     molset = UnionSetOfGraphs(current,chainmols);
     transmaster->Molecules = UnionSetOfGraphs(molset,step->Molecules);

     transmaster->MoleculeAtomSets = SetUpMoleculeAtomSets(transmaster->Molecules,ALL_ATOMS);
     transmaster->Adjustments = SetUpChainAdjustments(step,
						      direction,
						      bind);
     if(transmaster->Adjustments->NumberOfReactions > 0) {
       adjust = transmaster->Adjustments->Set;
       printf("ChainSingleStepReactionSetUp: %10f %10d\n",adjust->Forward->Weight, adjust->Forward->SymmetryFactor);
       printf("ChainSingleStepReactionSetUp: %10f %10d\n",adjust->Reverse->Weight, adjust->Reverse->SymmetryFactor);
     } else {
       printf("ChainSingleStepReactionSetUp: No reactions to setup\n");
     }
     transmaster->Performed = AllocateSetOfPerformedRxns;
     CreateSetOfPerformedRxns(transmaster->Performed,0,current->Name,
			      0,0);
     transmaster->Reactions = step->Reactions;
     
     return(transmaster);
     }




