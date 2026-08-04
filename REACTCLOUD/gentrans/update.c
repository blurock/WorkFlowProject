/*  FILE     update.c
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
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"
 extern DataSubSet *UpdateSetOfGraphsWithoutHydrogens(SetOfGraphs *newelements,
						      SetOfGraphs *total);

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static SetOfPerformedRxns *AddNewSetOfReactions(SetOfPerformedRxns *old,
						SetOfPerformedRxns *toadd,
						DataSubSet *molcorrs);
static INT TransformRxnIDs(INT *id, INT num, DataSubSet *corrs);
static SetOfPerformedRxns *ExpandSetOfPerformedRxns(SetOfPerformedRxns *old,
						    INT numtoadd);
/*S UpdatePerformedRxnMaster
*/
/*F performed = UpdatePerformedRxnMaster(total,newelement)
**
**  DESCRIPTION
**    total: The current total PerformedRxnMaster
**    newelement: The new PerformedRxnMaster from the last set of molecules
**    performed: The new total
**
**    - Initialize a new PerformedRxnMaster
**    -  Update the set of molecules (UpdatePerformedRxnMasterMolecules) 
**      giving a correspondence list between the original molecules (total)
**      and the newly generated molecules (newelement).
**    - Expand the number of Performed reactions to accomidate new ones
**    - Add the new ones (skipping reactions with filtered out molecules)
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
extern PerformedRxnMaster *UpdatePerformedRxnMaster(PerformedRxnMaster *total,
						    PerformedRxnMaster *newelement)
     {
     PerformedRxnMaster *newtotal;
     DataSubSet *molcorrs;
     SetOfPerformedRxns *newset;
     
     
     newtotal = AllocatePerformedRxnMaster;
     CreatePerformedRxnMaster(newtotal,total->ID,total->Name,
			      total->Direction,
			      0,0,0,0,0);

     molcorrs = UpdatePerformedRxnMasterMolecules(newtotal,
						  total->Molecules,
						  newelement->Molecules);

     newset = AddNewSetOfReactions(total->Performed,
				   newelement->Performed,
				   molcorrs);
     
     if(newtotal->Performed != 0)
	  {
	  FreeSetOfPerformedRxns(newtotal->Performed);
	  Free(newtotal->Performed);
	  }
     
     newtotal->Performed = newset;

     FreeDataSubSet(molcorrs);
     Free(molcorrs);
     
     return(newtotal);
     }
 
/*F PutPerformedReactionMaster(performed,bind)
**
**  DESCRIPTION
**    At the moment, an empty routine
**
**  REMARKS
**
*/
extern void PutPerformedReactionMaster(PerformedRxnMaster *performed,
				       BindStructure *bind)
     {
     }

/*f newset = AddNewSetOfReactions(old,toadd,molcorrs)
**
**  DESCRIPTION
**    old: The original set of reactions
**    toadd: Those to add
**    molcorrs: The correspondences between molecules of old and new
**    newset: The new set with the new translated reactions
**
**    A new set of performed reactions are created with the new
**    reactions merged.  The molecules of the new reactions are
**    translated using molcorrs.
**
**    - Create a new expanded SetOfPerformedRxns structure to accomidate
**      the new set of reactions
**    - Loop through the set of reactions to add
**      - Translate the reactant reactions
**      - Translate the product reactions looking for rejected molecules
**      - If no rejected molecules, then add to the total list
**      
**  REMARKS
**
*/
static SetOfPerformedRxns *AddNewSetOfReactions(SetOfPerformedRxns *old,
						SetOfPerformedRxns *toadd,
						DataSubSet *molcorrs)
     {
     SetOfPerformedRxns *newset;
     PerformedRxn *newprxns,*toaddprxns;
     INT i,reject2;
     
     newset = ExpandSetOfPerformedRxns(old,toadd->NumberOfReactions);

     newprxns = newset->Reactions + newset->NumberOfReactions;
     toaddprxns = toadd->Reactions;
     LOOPi(toadd->NumberOfReactions)
	  {
	  CopyFullPerformedRxn(newprxns,toaddprxns);
	  TransformRxnIDs(newprxns->ReactantIDs,
			       newprxns->NumberOfReactants,
			       molcorrs);
	  reject2 = TransformRxnIDs(newprxns->ProductIDs,
				    newprxns->NumberOfProducts,
				    molcorrs);
	  if(reject2 == 1)
	       {
	       FreePerformedRxn(newprxns);
	       }
	  else
	       {
	       newprxns++;
	       newset->NumberOfReactions += 1;
	       }
	  toaddprxns++;
	  }
     return(newset);
     }

 
/*f reject = TransformRxnIDs(id,num,corrs)
**
**  DESCRIPTION
**    id: begining of vector of id's to translate
**    num: Number of id's to translate
**    corr: The set of translations correspondences
**    reject: If a molecule has been rejected, reject=1 otherwise=0
**
**  REMARKS
**
*/
static INT TransformRxnIDs(INT *id, INT num, DataSubSet *corrs)
     {
     INT i,newid,reject;
     
     reject = 0;
     LOOPi(num)
	  {
	  newid = *(corrs->Points + *id);
	  if(newid >= 0)
	       *id = newid;
	  else
	       reject = 1;
	  id++;
	  }
     return(reject);
     }

/*S UpdateMolecules
*/
 
/*F
**
**  DESCRIPTION
**    new: The reaction master with the molecules to modify
**    total: The original total of molecules
**    newelements: The new elements to add
**    molcorr: The set of correspondences between new and old molecules
**
**    The Molecules field of new is modified with the new set of molecules
**    added to the original (eliminating those that are duplicated).
**
**  REMARKS
**     The check for molecules is done with hydrogens at the moment (UpdateSetOfGraphs)
**     to do the check non-destructively, a temporary copy of total is made
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern DataSubSet 
     *UpdatePerformedRxnMasterMolecules(PerformedRxnMaster *new,
					SetOfGraphs *total,
					SetOfGraphs *newelements)
     {
     SetOfGraphs *newset;
     DataSubSet *molcorr;
     
     newset = ExtendSetOfGraphs(newelements,total);
     
     FilterOutSetOfGraphs(newelements);

     molcorr = UpdateSetOfGraphsWithoutHydrogens(newelements,newset);
     
     if(new->Molecules != 0)
	  {
	  FreeSetOfGraphs(new->Molecules);
	  Free(new->Molecules);
	  }
     new->Molecules = newset;
     
     return(molcorr);
     }
 
/*f newset = ExpandSetOfPerformedRxns(old,numtoadd)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static SetOfPerformedRxns *ExpandSetOfPerformedRxns(SetOfPerformedRxns *old,
						    INT numtoadd)
     {
     SetOfPerformedRxns *newset;
     PerformedRxn *newprxns,*oldprxns;
     INT i;
     
     newset = AllocateSetOfPerformedRxns;
     CreateSetOfPerformedRxns(newset,old->ID,old->Name,
			     old->NumberOfReactions + numtoadd,
			     0);
     
     oldprxns = old->Reactions;
     newprxns = newset->Reactions;
     LOOPi(old->NumberOfReactions)
	  {
	  CopyFullPerformedRxn(newprxns,oldprxns);
	  newprxns++;
	  oldprxns++;
	  }
     newset->NumberOfReactions = old->NumberOfReactions;
     return(newset);
     }
