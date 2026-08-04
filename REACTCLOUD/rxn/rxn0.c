/*  FILE     rxn0.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    ReactionSet manipulation
**    - StoreReactionMolFileInfo
**    - FindReactionInReactionSet
**    - FindReactionInReactionSetByName
**    - RxnCorrFromMolFile
**    - DetermineChangedBonds
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
#include "rxn.h"
#include "molprops.h"

#include "rxn/rxninfo.c"
 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . .  static
*/

static INT ReactionStored(INT id, ReactionSet *reactions);
static INT CorrsInMolFile(INT id, INT position,
			   RxnAtomCorrespondence *corrs,
			   RxnUnMatchedSet *unmatched,
			   MolFileMolecule *mol,
			   INT flag,
			  INT atomcount);
static INT TransferCorrespondences(RxnAtomCorrespondence *new, 
				    RxnAtomCorrespondence *old,
				   INT size);
static RxnAtomCorrespondence *InitialRxnAtomCorrespondence(INT size);
static void AddChangedBonds(RxnBondChanges *bonds,
			    MolFileMolecule *mol,
			    INT id,
			    INT type,
			    RxnCorrespondenceSet *corrs);
static RxnAtomCorrespondence *FindAtomInRxnCorrespondences(INT mol, INT atom,
							  RxnCorrespondenceSet *set,
							   INT flag);
static RxnAtomCorrespondence *FindAtomInRxnCorrespondences(INT mol, INT atom,
							  RxnCorrespondenceSet *set,
							   INT flag);
static RxnAtomCorrespondence *FindAtomInUnMatched(INT mol, INT atom,
						  RxnUnMatchedSet *set,
						  INT flag);
/*S StoreReactionInCurrent
*/ 
/*F StoreReactionMolFileInfo(rxnmolfile,reactions,molecules)
**
**  DESCRIPTION
**    The structure with the reaction molfile (MolFileReaction)
**    is stored.  The reaction itself goes into ReactionSet
**    and the molecules of the reaction go into MoleculeSet
**
**    The correlations and the reaction data are also transfered
**    (RxnCorrFromMolFile and TransferReactionDataFromMolFile)
**
**  REMARKS
**     The molecule ID is assumed to be correct (corresponding to
**     those in MoleculeSet)
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/

extern INT StoreReactionMolFileInfo(MolFileReaction *rxnmolfile,
                                    ReactionSet *reactions,
                                    MoleculeSet *molecules,
                                    int storemolecules,
                                    BindStructure *bind)
{
  ReactionInfo *reaction;
  INT i,*molID;
  MolFileMolecule *molfile;
     
  if(ReactionStored(rxnmolfile->ID,reactions)) 
    return(SYSTEM_NORMAL_RETURN);
  else
    {
      reaction = reactions->Reactions + reactions->NumberOfReactions;
      reactions->NumberOfReactions +=1;
          
      CreateReactionInfo(reaction, rxnmolfile->ID, rxnmolfile->Name,
                         rxnmolfile->NumberOfReactants,
                         rxnmolfile->NumberOfProducts,
                         0,0,0,0,0,0);
      reaction->TotalCorr = RxnCorrFromMolFile(rxnmolfile);
      PrintPrettyRxnCorrespondenceSet("RxnCorrSet: ",stdout,reaction->TotalCorr);
      
      reaction->Data = 0;
      reaction->Properties = InitializeSetOfPropertyValues(reactions->PropertyTypes);
      FillInASCIIValue(rxnmolfile->Properties,
                       reaction->Properties,
                       reactions->PropertyTypes,
                       bind);
      if(storemolecules != 0)
        {
          molID = reaction->Reactants;
          molfile = rxnmolfile->Reactants;
          LOOPi(reaction->NumberOfReactants)
            {
              *molID = molfile->ID;
              StoreMolFileInfo(molfile,molecules,molecules->PropertyTypes);
              molfile++;
              molID++;
            }
          
          molID = reaction->Products;
          molfile = rxnmolfile->Products;
          LOOPi(reaction->NumberOfProducts)
            {
              *molID = molfile->ID;
              StoreMolFileInfo(molfile,molecules,molecules->PropertyTypes);
              molfile++;
              molID++;
            }     
        }
    }
  
  return(SYSTEM_NORMAL_RETURN);
}

/*f ret = ReactionStored(id,reactions)
**
**  DESCRIPTION
**    Check in current reactions whether the reaction with the id is
**    stored already.
**  REMARKS
**
*/
static INT ReactionStored(INT id, ReactionSet *reactions)
     {
     ReactionInfo *reaction;
     INT count;

     reaction = reactions->Reactions;
     count = 0;
     while(count < reactions->NumberOfReactions &&
	   id != reaction->ID)
	  count++;
     
     if(count == reactions->NumberOfReactions)
	  return(0);
     else
	  return(1);
     }
 
/*F rxncorrset = RxnCorrFromMolFile(rxn)
**
**  DESCRIPTION
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

extern RxnCorrespondenceSet *RxnCorrFromMolFile(MolFileReaction *rxn)
     {
     INT totalatoms, ncorrs, molID,numatched,atomcount,i,corrsize;
     RxnAtomCorrespondence *corrs,*corr;
     RxnUnMatchedSet *unmatched;
     MolFileMolecule *mol;
     RxnCorrespondenceSet *set;
     
     totalatoms = AtomsInMolFileReaction(rxn);
     
     corrs = InitialRxnAtomCorrespondence(totalatoms);
     ncorrs = 0;
     molID = 0;

     unmatched = AllocateRxnUnMatchedSet;
     CreateRxnUnMatchedSet(unmatched,rxn->ID,rxn->Name,
			   totalatoms,0);
     unmatched->NumberUnMatchedAtoms = 0;
     
     numatched = 0;
     atomcount = 0;

     mol = rxn->Reactants;
     LOOPi(rxn->NumberOfReactants) {
       /*atomcount = CorrsInMolFile(mol->ID, i,corrs,unmatched,mol,REACTANT,atomcount);*/
       atomcount = CorrsInMolFile(i,i,corrs,unmatched,mol,REACTANT,atomcount);
       mol++;
       molID++;
     }

     mol = rxn->Products;
     LOOPi(rxn->NumberOfProducts) {
       /*atomcount = CorrsInMolFile(mol->ID,i,corrs,unmatched,mol,PRODUCT,atomcount);*/
       atomcount = CorrsInMolFile(i,i,corrs,unmatched,mol,PRODUCT,atomcount);
       mol++;
       molID++;
     }

     corrsize = (totalatoms - unmatched->NumberUnMatchedAtoms)/2;
     set = AllocateRxnCorrespondenceSet;
     CreateRxnCorrespondenceSet(set,rxn->ID,rxn->Name,
				corrsize,
				0,0,
				0);
     set->UnMatched = unmatched;
     set->NumberOfCorrs = TransferCorrespondences(set->Corrs, corrs, totalatoms);
     
     DetermineChangedBonds(set,rxn);
     corr = corrs;
     LOOPi(totalatoms)
	  FreeRxnAtomCorrespondence(corr++);
     Free(corrs);
     
     return(set);
     }
 
/*f newatomcount = CorrsInMolFile(id,position,corrs,unmatched,mol,flag,atomcount)
**
**  DESCRIPTION
**    id: current mol id
**    corrs: Set of correspondences to be filled in
**    unmatched: set of unmatched to be filled in
**    mol: The molecule
**    flag: REACTANT, PRODUCT
**    atomcount: total atom count (through whole reaction)
**    newatomcount: atom count with this molecule
**
**  REMARKS
**
*/
static INT CorrsInMolFile(INT id, INT position,
			   RxnAtomCorrespondence *corrs,
			   RxnUnMatchedSet *unmatched,
			   MolFileMolecule *mol,
			   INT flag,
			   INT atomcount)
     {
     INT i,corr;
     RxnAtom *un;
     MolFileAtom *atominfo;
     RxnAtomCorrespondence *ele;
     
     atominfo = mol->Atoms;
     LOOPi(mol->NAtoms)
	  {
	  corr = (atominfo->Parameters)[9];
	  if(corr == 0)
	       {
	       un = unmatched->UnMatchedAtoms + unmatched->NumberUnMatchedAtoms;
	       CreateRxnAtom(un,unmatched->NumberUnMatchedAtoms,0,
			     id,i);
	       unmatched->NumberUnMatchedAtoms += 1;
	       }
	  else
	       {
	       ele = corrs + (corr-1);
	       switch(flag)
		    {
	       case REACTANT:
		    ele->Reactant = AllocateRxnAtom;
		    CreateRxnAtom(ele->Reactant,atomcount,0,
				  id,i);
		    ele->ReactantPosition = position;
		    break;
	       case PRODUCT:
		    ele->Product = AllocateRxnAtom;
		    CreateRxnAtom(ele->Product,atomcount,0,
				  id,i);
		    ele->ProductPosition = position;
		    break;
		    }
	       }
	  atominfo++;
	  atomcount++;
	  }
     return(atomcount);
     }
 
/*f numcorrs = TransferCorrespondences(new,old,size)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT TransferCorrespondences(RxnAtomCorrespondence *new, 
				   RxnAtomCorrespondence *old,
				   INT size)
     {
     INT i,count;

     count = 0;
     LOOPi(size)
	  {
	  if(old->Product != 0 && old->Reactant != 0)
	       {
	       CopyFullRxnAtomCorrespondence(new++,old);
	       count++;
	       }
	  old++;
	  }

     return(count);
     }
 
/*f rxncorr = InitialRxnAtomCorrespondence(size)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnAtomCorrespondence *InitialRxnAtomCorrespondence(INT size)
     {
     RxnAtomCorrespondence *c,*corr;
     INT i;
     

     corr = c = AllocArrayRxnAtomCorrespondence(size);
     
     LOOPi(size)
	  CreateRxnAtomCorrespondence(corr++,i,0,0,0,0,0);
     return(c);
     }

 
/*F newset = MergeReactionSets(rxnset1,rxnset2)
**
**  DESCRIPTION
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
extern ReactionSet *MergeReactionSets(ReactionSet *rxnset1,
				      ReactionSet *rxnset2)
     {
     INT size,i;
     ReactionInfo *rxn,*new;
     ReactionSet *newset;
     
     size = rxnset1->NumberOfReactions + rxnset2->NumberOfReactions;
     newset = AllocateReactionSet;
     CreateReactionSet(newset,rxnset1->ID,rxnset1->Name,
		       size,0,0);
     
     rxn = rxnset1->Reactions;
     new = newset->Reactions;
     LOOPi(rxnset1->NumberOfReactions)
	  {
	  CopyFullReactionInfo(new,rxn);
	  rxn++;
	  new++;
	  }
     rxn = rxnset2->Reactions;
     LOOPi(rxnset2->NumberOfReactions)
	  {
	  if(FindReactionInReactionSet(rxn->ID,rxnset1))
	       CopyFullReactionInfo(new,rxn);
	  else
	       newset->NumberOfReactions -= 1;
	  
	  rxn++;
	  new++;
	  }
     return(newset);
     }
 
/*F molset = FindMoleculesInReactionSet(set)
**
**  DESCRIPTION
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
extern ReadInMoleculeSet *FindMoleculesInReactionSet(ReactionSet *set)
     {
     ReactionInfo *rxn;
     ReadInMoleculeSet *molset;
     ReadInMolecule *mol;
     CHAR *word;
     INT overestimate,i,j,*molid;
     
     overestimate = set->NumberOfReactions * 5;
     molset = AllocateReadInMoleculeSet;
     CreateReadInMoleculeSet(molset,set->ID,set->Name,overestimate,0);
     molset->NumberOfMolecules = 0;
     
     word = AllocateString(LINELENGTH);
     
     rxn = set->Reactions;
     mol = molset->Molecules;
     LOOPi(set->NumberOfReactions)
	  {
	  molid = rxn->Reactants;
	  LOOPj(rxn->NumberOfReactants)
	       {
	       sprintf(word,"%d",*molid);
	       CreateReadInMolecule(mol,*molid,word,0,0);
	       molid++;
	       mol++;
	       }
	  molset->NumberOfMolecules += rxn->NumberOfReactants;
	  
	  molid = rxn->Products;
	  LOOPj(rxn->NumberOfProducts)
	       {
	       sprintf(word,"%d",*molid);
	       CreateReadInMolecule(mol,*molid,word,0,0);
	       molid++;
	       mol++;
	       }
	  molset->NumberOfMolecules += rxn->NumberOfProducts;
	  rxn++;
	  }
     Free(word);
     return(molset);
     }

     
/*S ReactionAccessRoutines
*/
/*F rxninfo = FindReactionFromString(rxnname,set)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern ReactionInfo *FindReactionFromString(CHAR *rxnname,
					    ReactionSet *set)
     {
     ReactionInfo *rxn;
     INT id,flag;
     
     rxn = 0;
     if(*rxnname > '0' && *rxnname < '9')
	  flag = RXN_ID_BY_NUMBER;
     else
	  flag = RXN_ID_BY_NAME;
     
     switch(flag)
	  {
     case RXN_ID_BY_NUMBER:
	  id = ConvertStringToInteger(rxnname);
	  rxn = FindReactionInReactionSet(id,set);
	  break;
     case RXN_ID_BY_NAME:
	  rxn = FindReactionInReactionSetByName(rxnname,set);
	  break;
	  }
     return(rxn);
     }
/*F rxninfo = FindReactionInReactionSet(id,set)
**
**  DESCRIPTION
**    Return the reaction corresponding to id (0 if not found).
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
extern ReactionInfo *FindReactionInReactionSet(INT id, ReactionSet *set)
     {
     ReactionInfo *rxn,*match;
     INT count;
     
     rxn = set->Reactions;
     match = 0;
     count = 0;
     while(match == 0 && count < set->NumberOfReactions)
	  {
	  if(rxn->ID == id)
	       match = rxn;
	  count++;
	  rxn++;
	  }
     return(match);
     }
 
/*F rxninfo = FindReactionInReactionSetByName(name,set)
**
**  DESCRIPTION
**    Find the reaction given by name in the current set
**    (0 if not found)
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

extern ReactionInfo *FindReactionInReactionSetByName(CHAR *name, ReactionSet *set) {
  ReactionInfo *rxn,*match;
  INT count;
  
  rxn = set->Reactions;
  match = 0;
  count = 0;
  while(match == 0 && count < set->NumberOfReactions) {
    if(rxn->ID != -1) {
      if(!strcmp(rxn->Name,name))
	match = rxn;
    }
    count++;
    rxn++;
  }
  return(match);
}

/*F DetermineChangedBonds(corr,rxn)
**
**  DESCRIPTION
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

extern void DetermineChangedBonds(RxnCorrespondenceSet *corr,
				  MolFileReaction *rxn)
     {
     RxnBondChanges *bonds;
     MolFileMolecule *mol;
     INT i,molID,maxbonds;
     
     maxbonds = BondsInMolFileReaction(rxn);
     
     bonds = AllocateRxnBondChanges;
     CreateRxnBondChanges(bonds,rxn->ID,rxn->Name,
			maxbonds,0);
     bonds->NumberBondChanges = 0;
     
     
     molID = 0;
     
     mol = rxn->Reactants;
     LOOPi(rxn->NumberOfReactants)
	  {
	    /*AddChangedBonds(bonds,mol,mol->ID,REACTANT,corr);*/
	    AddChangedBonds(bonds,mol,i,REACTANT,corr);
	  mol++;
	  molID++;
	  }

     mol = rxn->Products;
     LOOPi(rxn->NumberOfProducts)
	  {
	    /*AddChangedBonds(bonds,mol,mol->ID,PRODUCT,corr);*/
	    AddChangedBonds(bonds,mol,i,PRODUCT,corr);
	  mol++;
	  molID++;
	  }

     corr->BondChanges = bonds;
     }
 
/*f AddChangedBonds(bonds,mol,id,type,corrs)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AddChangedBonds(RxnBondChanges *bonds,
			    MolFileMolecule *mol,
			    INT id,
			    INT type,
			    RxnCorrespondenceSet *corrs)
     {
     MolFileBond *bond;
     RxnAtomCorrespondence *atom1,*atom2;
     RxnBond *change;
     INT i,btype;
     
     bond = mol->Bonds;
     LOOPi(mol->NBonds)
	  {
	  btype = *(bond->Parameters + 3) + 100*type;
	  printf("Add Changed Bonds: %20s %10d %10d %10d\n",
		 mol->Name, i, type, btype);
	  
	  if(btype == 4 || btype == 104)
	       {
	       change = bonds->Changes + bonds->NumberBondChanges;
	       atom1 = FindAtomInRxnCorrespondences(id,bond->I,corrs,type);
	       atom2 = FindAtomInRxnCorrespondences(id,bond->J,corrs,type);
	       CreateRxnBond(change,bonds->NumberBondChanges,corrs->Name,
			     atom1,atom2,btype);
/*
	       change->Atom1 = AllocateRxnAtomCorrespondence
	       CopyFullRxnAtomCorrespondence(change->Atom1,atom1);
	       CopyFullRxnAtomCorrespondence(change->Atom2,atom2);
*/
	       bonds->NumberBondChanges += 1;
	       }
	  bond++;
	  }
     }
 
/*f rxnatomcorr = FindAtomInRxnCorrespondences(mol,atom,set,flag)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnAtomCorrespondence *FindAtomInRxnCorrespondences(INT mol, INT atom,
							  RxnCorrespondenceSet *set,
							  INT flag)
     {
     RxnAtomCorrespondence *corrs,*done;
     INT count;
     RxnAtom *compare;
     
     corrs = set->Corrs;
     count = 0;
     
     compare = 0;
     done = 0;
     while( done == 0 && count < set->NumberOfCorrs)
	  {
	  switch(flag)
	       {
	  case REACTANT:
	       compare = corrs->Reactant;
	       break;
	  case PRODUCT:
	       compare = corrs->Product;
	       break;
	       }
	  if(mol == compare->MoleculeNumber &&
	     atom == compare->AtomNumber)
	       done = corrs;
	  corrs++;
	  count++;
	  }
     if(done == 0)
	  done = FindAtomInUnMatched(mol,atom,set->UnMatched,flag);
     
     return(done);
     }
 
/*f rxnatomcorr = FindAtomInUnMatched(mol,atom,set,flag)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnAtomCorrespondence *FindAtomInUnMatched(INT mol, INT atom,
						  RxnUnMatchedSet *set,
						  INT flag)
     {
     RxnAtom *done,*atm;
     INT count;
     RxnAtomCorrespondence *corr;
     
     atm = set->UnMatchedAtoms;
     count = 0;
     done = 0;
     while(done == 0 && count < set->NumberUnMatchedAtoms)
	  {
	  if(mol == atm->MoleculeNumber &&
	     atom == atm->AtomNumber)
	       done = atm;
	  atm++;
	  count++;
	  }
     if(done != 0)
	  {
	  corr = AllocateRxnAtomCorrespondence;
	  switch(flag)
	       {
	  case REACTANT:
	       CreateRxnAtomCorrespondence(corr,count,set->Name,
					   0,done,0,0);
	       corr->Product = AllocateRxnAtom;
	       CreateRxnAtom(corr->Product,count,set->Name,-1,-1);
	       break;
	  case PRODUCT:
	       CreateRxnAtomCorrespondence(corr,count,set->Name,
					   done,0,0,0);
	       corr->Reactant = AllocateRxnAtom;
	       CreateRxnAtom(corr->Reactant,count,set->Name,-1,-1);
	       break;
	       }
	  }
     else 
	  corr = 0;
     
     return(corr);
     }
 


			

