/*  FILE     setup.c 
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The setup routines for reaction generation.  These routines
**    are called to set a particular generation step.
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
static SetOfPerformedRxnInfo *SetUpAdjustments(DataSubSet *rxnsubset,
					       INT flag,
					       BindStructure *bind);
static void TransferPerformedRxnInfoConstants(PerformedRxnInfoConstants *info,
					      ReactionDataConstants *data); 
/*S TransformAdjustments
**      This sets up the reaction information.  The adjustment comes from
**      deciding whether in the reaction or retrosynthetic direction
*/
/*F
**
**  DESCRIPTION
**    element: One step in a sequence
**    direction: The reaction direction (REACTANT,PRODUCT)
**    bind: Bind structure
**    performed: The structure with the SetOfPerformedRxnInfo set up
**
**    This is the front end of the SetUpAdjustments routine for the
**    chain of reactions.  The reaction id's are put into a DataSubSet
**    structure and passed on.
**
**
**  REMARKS
**       Setup forSetUpAdjustments 
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern SetOfPerformedRxnInfo *SetUpChainAdjustments(ChainSequenceElement *element,
						    INT flag,
						    BindStructure *bind)
     {
     SetOfPerformedRxnInfo *adjustments;
     DataSubSet *set;
     INT num,i,*pnts;
     GraphTransform *transform;
    
     num = element->Reactions->NumberOfTransforms;
     
     set = AllocateDataSubSet;
     CreateDataSubSet(set,element->ID,element->Name,
		      num,num,0);

     transform = element->Reactions->Set;
     pnts = set->Points;
     LOOPi(num)
	  {
	  *pnts = transform->ID;
	  pnts++;
	  transform++;
	  }

     adjustments = SetUpAdjustments(set,flag,bind);
     
     return(adjustments);
     }

 
/*f info = SetUpAdjustments(rxnsubset,direction,bind)
**
**  DESCRIPTION
**    rxnsubset: The set of reaction id's
**    direction: Generation direction (REACTANT, PRODUCT)
**    bind: bind structure used to get reactions
**
**    The SetOfPerformedRxnInfo is set up.  The information from the
**    reactions is extracted and filled in.  What is the forward
**    and reverse direction depends on the reaction direction.
**
**  REMARKS
**
*/
static SetOfPerformedRxnInfo *SetUpAdjustments(DataSubSet *rxnsubset,
					       INT direction,
					       BindStructure *bind)
     {
     ReactionInfo *rxn;
     INT *rxnid,i;
     ReactionSet *rxnset;
     SetOfPerformedRxnInfo *infoset;
     PerformedRxnInfo *info;
     ReactionData *data;
     GenPropValue *forwardvalue,*reversevalue;
     ReactionDataConstants *forward,*reverse;
     SetOfPropertyTypes *types;

     rxnset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);

     infoset = AllocateSetOfPerformedRxnInfo;
     CreateSetOfPerformedRxnInfo(infoset,rxnsubset->ID,
				 rxnsubset->Name,
				 rxnsubset->NumberOfPoints,
				 0);
     types = InitializeReactionPropertyTypes(0,0);
     info = infoset->Set;
     rxnid = rxnsubset->Points;
     LOOPi(infoset->NumberOfReactions)
	  {
	  rxn = FindReactionInReactionSet(*rxnid,rxnset);
	  data = rxn->Data;
	  forwardvalue = FindBestReactionValue(FORWARD_REACTION_CONSTANTS,rxn->Properties);
	  if(forwardvalue != 0)
	       {
	       forward = AllocateReactionDataConstants;
	       GetPropValue(forward,forwardvalue,types);
	       }
	  else
	       forward = 0;
	  
	  reversevalue = FindBestReactionValue(REVERSE_REACTION_CONSTANTS,rxn->Properties);
	  if(reversevalue != 0)
	       {
	       reverse = AllocateReactionDataConstants;
	       GetPropValue(reverse,reversevalue,types);
	       }
	  else 
	       reverse = 0;
	  CreatePerformedRxnInfo(info,i,info->Name,
				 0,0);
	  info->Forward = AllocatePerformedRxnInfoConstants;
	  info->Reverse = AllocatePerformedRxnInfoConstants;	  
	  switch(direction)
	       {
	  case REACTANT:
	       TransferPerformedRxnInfoConstants(info->Forward,forward);
	       TransferPerformedRxnInfoConstants(info->Reverse,reverse);
	       break;
	  case PRODUCT:
	       TransferPerformedRxnInfoConstants(info->Forward,reverse);
	       TransferPerformedRxnInfoConstants(info->Reverse,forward);
	       break;
	       }
	  FreeReactionDataConstants(forward);
	  Free(forward);
	  FreeReactionDataConstants(reverse);
	  Free(reverse);
	  info++;
	  rxnid++;
	  }
     return(infoset);
     }

 
/*f TransferPerformedRxnInfoConstants(info,data)
**
**  DESCRIPTION
**    Transfer the reaction data from the reaction to the PerformedRxnInfoConstants
**
**  REMARKS
**
*/
static void TransferPerformedRxnInfoConstants(PerformedRxnInfoConstants *info,
					      ReactionDataConstants *data)
{
  if(data != 0)
    {
      CreatePerformedRxnInfoConstants(info,data->ID,data->Name,
				      data->Sym,
				      data->Relative,
				      data->Aconstant,
				      data->Energy,
				      data->TempExp);
      if(info->Weight == 0.0)
	info->Weight = 1.0;
    }
  else
    {
      CreatePerformedRxnInfoConstants(info,0,0,1,1.0,0.0,0.0,0.0);
    }
}







