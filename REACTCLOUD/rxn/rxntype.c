/*  FILE     rxntype.c
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
#include "rxn.h"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/

static INT VectorSetCompare(CompareVector *vec1, CompareVector *vec2);
static CompareVectorSet *ComputeCompareVectorSetForRxnAtom(RxnAtom *atm,
							   INT num,
							   MoleculeSet *molecules);
static RxnAtom *FormCanonicalVectorRxnAtom(RxnAtom *atm, INT num,
					   MoleculeSet *molecules);
static INT CompareRxnAtomCorrespondence(RxnAtomCorrespondence *corr1,
					RxnAtomCorrespondence *corr2,
					INT level,
					MoleculeSet *molecules);
static CompareVectorSet 
     *ComputeCompareVectorSetForRxnAtomCorrespondence(RxnAtomCorrespondence *atm,
						      INT num,
						      MoleculeSet *molecules);
static RxnAtomCorrespondence 
     *FormCanonicalVectorRxnAtomCorrespondence(RxnAtomCorrespondence *atm, 
				 INT num,
					       MoleculeSet *molecules);
static INT CompareRxnUnMatchedSet(RxnUnMatchedSet *set1,
				  RxnUnMatchedSet *set2,
				  INT level,
				  MoleculeSet *molecules);
static RxnUnMatchedSet *FormCanonicalRxnUnMatchedSet(RxnUnMatchedSet *set,
						     MoleculeSet *molecules);
static INT CompareRxnBond(RxnBond *bond1, RxnBond *bond2,
			  INT level,
			  MoleculeSet *molecules);
static void FormCanonicalRxnBond(RxnBond *new,
				     RxnBond *bond,
				 MoleculeSet *molecules);
static CompareVectorSet *ComputeCompareVectorSetForRxnBond(RxnBond *atm,
							   INT num,
							   MoleculeSet *molecules);
static RxnBond *FormCanonicalVectorRxnBond(RxnBond *bond, INT num,
					   MoleculeSet *molecules);
static INT CompareRxnBondChanges(RxnBondChanges *set1,
				 RxnBondChanges *set2,
				 INT level,
				 MoleculeSet *molecules);
static RxnBondChanges *FormCanonicalRxnBondChanges(RxnBondChanges *set,
						   MoleculeSet *molecules)
;
static INT CompareRxnCorrespondenceSet(RxnCorrespondenceSet *set1,
				       RxnCorrespondenceSet *set2,
				       INT level,
				       MoleculeSet *molecules);
static RxnCorrespondenceSet 
     *FormCanonicalRxnCorrespondenceSet(RxnCorrespondenceSet *set,
					MoleculeSet *molecules);
static INT CompareReactionInfo(ReactionInfo *info1, 
			       ReactionInfo *info2,
			       INT level,
			       MoleculeSet *molecules);
static void FormCanonicalReactionInfo(ReactionInfo *new,
				      ReactionInfo *info,
				      MoleculeSet *molecules);

/*S RxnCanonicalForm
*/
 
/*F rxnset = FormCanonicalReactionSet(set,molecules)
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
extern ReactionSet *FormCanonicalReactionSet(ReactionSet *set,
					     MoleculeSet *molecules)
     {
     CompareVectorSet *comparesets;
     CompareVector *cmp;
     ReactionSet *new;
     ReactionInfo *newrxn,*old,*rxn,*newarr;
     INT i,j,*comps;
     
     new = AllocateReactionSet;
     CreateReactionSet(new,set->ID,set->Name,
		       set->NumberOfReactions,
		       0,0);
     
     newrxn = new->Reactions;
     old = set->Reactions;
     LOOPi(new->NumberOfReactions)
	  {
	  FormCanonicalReactionInfo(newrxn,old,molecules);
	  newrxn++;
	  old++;
	  }
     
     comparesets = AllocateCompareVectorSet;
     CreateCompareVectorSet(comparesets,set->ID,set->Name,
			    set->NumberOfReactions,0);
     cmp = comparesets->Sets;
     newrxn = new->Reactions;
     LOOPi(set->NumberOfReactions)
	  {
	  CreateCompareVector(cmp,i,newrxn->Name,
			      new->NumberOfReactions,0);
	  comps = cmp->Compares;
	  LOOPj(set->NumberOfReactions)
	       {
	       *comps = CompareReactionInfo((new->Reactions + i),
					    (new->Reactions + j),
					    2,molecules);
	       comps++;
	       }
	  cmp++;
	  }

     qsort(comparesets->Sets,comparesets->NumberOfSets,
	   CompareVectorSetSize,(int (*)()) VectorSetCompare);
     
     rxn = newarr = AllocArrayReactionInfo(set->NumberOfReactions);
     cmp = comparesets->Sets;
     LOOPi(set->NumberOfReactions)
	  {
	  old = new->Reactions + cmp->ID;
	  CopyFullReactionInfo(rxn,old);
	  printf("rxn%d\n",rxn->ID);
	  rxn++;
	  cmp++;
	  }
     
     FreeCompareVectorSet(comparesets);
     Free(comparesets);
     FreeReactionSet(new);
     
     new = CreateReactionSet(new,set->ID,set->Name,
			     set->NumberOfReactions,
			     0,0);
     new->Reactions = newarr;
     
     return(new);
     }

 
/*f comp = VectorSetCompare(vec1,vec2)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT VectorSetCompare(CompareVector *vec1, CompareVector *vec2)
     {
     INT *comp;
     
     comp = vec1->Compares + vec2->ID;
     return(*comp);
     }
 
/*f CompareRxnAtom(atom1,atom2,level,molecules)
**
**  DESCRIPTION
**  RxnAtom Compare Routines:
**       CompareRxnAtom - Comparison of two RxnAtom structures
**	 FormCanonicalVectorRxnAtom - Orders a Vector of RxnAtom 
**	                              structures
**  Help Routines:
**       ComputeCompareVectorSetForRxnAtom
**
**  Note: Canonical form for single RxnAtom structure not necessary
**
**  Levels - 
**      0  -  Molecule and Atom Labels
**      1  -  Atomic Numbers
**      2  -  Charge
**
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
static INT CompareRxnAtom(RxnAtom *atom1, RxnAtom *atom2, INT level, 
		   MoleculeSet *molecules)
     {
     PropValue *atm1,*atm2;
     INT ans;
     MoleculeInfo *mol1,*mol2;
     
     if(level == 0)
	  {
	  if(atom1->MoleculeNumber == atom2->MoleculeNumber)
	       {
	       if(atom1->AtomNumber == atom2->AtomNumber)
		    ans = 0;
	       else
		    ans = atom1->AtomNumber - atom2->AtomNumber;
	       }
	  else
	       ans = atom1->MoleculeNumber - atom2->MoleculeNumber;
	  }
     else
	  {
	  if(atom1->MoleculeNumber == -1)
	       {
	       if(atom2->MoleculeNumber == -1)
		    ans = 0;
	       else 
		    ans = -1;
	       }
	  else if(atom2->MoleculeNumber == -1)
	       ans = 1;
	  else
	       {
	       mol1 = FindMoleculeInMoleculeSet(atom1->MoleculeNumber,
						molecules);
	       mol2 = FindMoleculeInMoleculeSet(atom2->MoleculeNumber,
						molecules);
	       
	       atm1 = FindAtomProperty(mol1,atom1->AtomNumber,ATOMIC_NUMBER);
	       atm2 = FindAtomProperty(mol2,atom2->AtomNumber,ATOMIC_NUMBER);
	       
	       if(atm1->Integer != atm2->Integer)
		    ans = atm1->Integer - atm2->Integer;
	       else
		    {
		    if(level == 1)
			 ans = 0;
		    else
			 {
			 atm1 = FindAtomProperty(mol1,atom1->AtomNumber,CHARGE);
			 atm2 = FindAtomProperty(mol2,atom2->AtomNumber,CHARGE);
			 
			 if(CHARGE_EQUAL(atm1->Float, atm2->Float))
			      ans = 0;
			 else if(atm1->Float > atm2->Float)
			      ans = 1;
			 else
			      ans = -1;
			 }
		    }
	       }
	  }
     return(ans);
     }
 
/*f compvecset = ComputeCompareVectorSetForRxnAtom(atm,num,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CompareVectorSet *ComputeCompareVectorSetForRxnAtom(RxnAtom *atm,
							   INT num,
							   MoleculeSet *molecules)
     {
     CompareVectorSet *comparesets;
     CompareVector *cmp;
     INT i,j,*comps;
     
     comparesets = AllocateCompareVectorSet;
     CreateCompareVectorSet(comparesets,num,"",
			    num,0);
     cmp = comparesets->Sets;
     LOOPi(num)
	  {
	  CreateCompareVector(cmp,i,"",
			      num,0);
	  comps = cmp->Compares;
	  LOOPj(num)
	       {
	       *comps = CompareRxnAtom((atm + i),(atm + j),1,molecules);
	       comps++;
	       }
	  cmp++;
	  }
     return(comparesets);
     }

 
/*f rxnatom = FormCanonicalVectorRxnAtom(atm,num,molecules) 
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnAtom *FormCanonicalVectorRxnAtom(RxnAtom *atm, INT num,
					   MoleculeSet *molecules)
     {
     CompareVectorSet *comparesets;
     RxnAtom *new,*start,*old;
     CompareVector *cmp;
     INT i;
     
     comparesets = ComputeCompareVectorSetForRxnAtom(atm,num,molecules);
     
     qsort(comparesets->Sets,comparesets->NumberOfSets,
	   CompareVectorSetSize,(int (*)()) VectorSetCompare);
     
     new = start = AllocArrayRxnAtom(num);

     cmp = comparesets->Sets;
     LOOPi(num)
	  {
	  old = atm + cmp->ID;
	  CopyFullRxnAtom(new,old);
	  new++;
	  cmp++;
	  }
     FreeCompareVectorSet(comparesets);
     Free(comparesets);
     
     return(start);
     }
 
/*f comp = CompareRxnAtomCorrespondence(corr1,corr2,level,molecules)
**
**  DESCRIPTION
**      Compare Routine:
**            CompareRxnAtomCorrespondence 
**      Canonical Form:
**            FormCanonicalVectorRxnAtomCorrespondence
**      Help Routines:
**	      ComputeCompareVectorSetForRxnAtomCorrespondence
**    
**  REMARKS
**
*/
static INT CompareRxnAtomCorrespondence(RxnAtomCorrespondence *corr1,
					RxnAtomCorrespondence *corr2,
					INT level,
					MoleculeSet *molecules)
     {
     INT ans;

     ans = -3;
     if(corr1 == 0)
	  ans = -1;
     else if(corr2 == 0)
	  ans = 1;
     else 
	  {
	  ans = CompareRxnAtom(corr1->Product,corr2->Product,level,molecules);
	  if(ans == 0)
	       ans = CompareRxnAtom(corr1->Reactant,corr2->Reactant,level,molecules);
	  }
     
     return(ans);
     }
 
/*f compvecset = ComputeCompareVectorSetForRxnAtomCorrespondence(atm,num,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CompareVectorSet 
     *ComputeCompareVectorSetForRxnAtomCorrespondence(RxnAtomCorrespondence *atm,
						      INT num,
						      MoleculeSet *molecules)
     {
     CompareVectorSet *comparesets;
     CompareVector *cmp;
     INT i,j,*comps;
     
     comparesets = AllocateCompareVectorSet;
     CreateCompareVectorSet(comparesets,num,"",
			    num,0);
     cmp = comparesets->Sets;
     LOOPi(num)
	  {
	  CreateCompareVector(cmp,i,"",
			      num,0);
	  comps = cmp->Compares;
	  LOOPj(num)
	       {
	       *comps = CompareRxnAtomCorrespondence((atm + i),(atm + j),1,molecules);
	       comps++;
	       }
	  cmp++;
	  }
     return(comparesets);
     }
 
/*f rxnatomcorr = FormCanonicalVectorRxnAtomCorrespondence(atm,num,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnAtomCorrespondence 
     *FormCanonicalVectorRxnAtomCorrespondence(RxnAtomCorrespondence *atm, 
				 INT num,
				 MoleculeSet *molecules)
     {
     CompareVectorSet *comparesets;
     RxnAtomCorrespondence *new,*start,*old;
     CompareVector *cmp;
     INT i;
     
     comparesets = 
	  ComputeCompareVectorSetForRxnAtomCorrespondence(atm,num,molecules);
     
     qsort(comparesets->Sets,comparesets->NumberOfSets,
	   CompareVectorSetSize,(int (*)()) VectorSetCompare);
     
     new = start = AllocArrayRxnAtomCorrespondence(num);

     cmp = comparesets->Sets;
     LOOPi(num)
	  {
	  old = atm + cmp->ID;
	  CopyFullRxnAtomCorrespondence(new,old);
	  new++;
	  cmp++;
	  }
     FreeCompareVectorSet(comparesets);
     Free(comparesets);
     
     return(start);
     }
 
/*f comp = CompareRxnUnMatchedSet(set1,set2,level,molecules)
**
**  DESCRIPTION
**     Compare Routine:
**          CompareRxnUnMatchedSet
**     Canonical Form:
**          FormCanonicalRxnUnMatchedSet
**    
**  REMARKS
**
*/
static INT CompareRxnUnMatchedSet(RxnUnMatchedSet *set1,
				  RxnUnMatchedSet *set2,
				  INT level,
				  MoleculeSet *molecules)
     {
     RxnAtom *atm1,*atm2;
     INT count,ans;
     
     if(set1->NumberUnMatchedAtoms != set2->NumberUnMatchedAtoms)
	  ans = set1->NumberUnMatchedAtoms - set2->NumberUnMatchedAtoms;
     else
	  {
	  atm1 = set1->UnMatchedAtoms;
	  atm2 = set2->UnMatchedAtoms;
	  count = 0;
	  ans = 0;
	  while(count < set1->NumberUnMatchedAtoms && 
		ans == 0)
	       {
	       ans = CompareRxnAtom(atm1,atm2,level,molecules);
	       count++;
	       }
	  }
     return(ans);
     }
 
/*f rxnunmatched =FormCanonicalRxnUnMatchedSet(set,molecules) 
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnUnMatchedSet *FormCanonicalRxnUnMatchedSet(RxnUnMatchedSet *set,
						     MoleculeSet *molecules)

     {
     RxnUnMatchedSet *unmatched;
     
     unmatched = AllocateRxnUnMatchedSet;
     CreateRxnUnMatchedSet(unmatched,set->ID,set->Name,
			   set->NumberUnMatchedAtoms,
			   0);
     
     unmatched->UnMatchedAtoms = 
	  FormCanonicalVectorRxnAtom(set->UnMatchedAtoms,
				     set->NumberUnMatchedAtoms,
				     molecules);
     
     return(unmatched);
     }
 
/*f comp = CompareRxnBond(bond1,bond2,level,molecules)
**
**  DESCRIPTION
**        Compare Routine:
**             CompareRxnBond
**        Canonical Form:
**             FormCanonicalRxnBond
**	       FormCanonicalVectorRxnBond
**    
**  REMARKS
**
*/
static INT CompareRxnBond(RxnBond *bond1, RxnBond *bond2,
			  INT level,
			  MoleculeSet *molecules)
     {
     INT ans;

     if(bond1->Type != bond2->Type)
	  ans = bond1->Type - bond2->Type;
     else
	  {
	  ans = CompareRxnAtomCorrespondence(bond1->Atom1,bond2->Atom1,
					     level,molecules);
	  if(ans == 0)
	       ans = CompareRxnAtomCorrespondence(bond1->Atom2,bond2->Atom2,
						  level,molecules);
	  }
     return(ans);
     }
 
/*f FormCanonicalRxnBond(new,num,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void FormCanonicalRxnBond(RxnBond *new,
				     RxnBond *bond,
				     MoleculeSet *molecules)
     {
     RxnAtomCorrespondence *atm1;
     
     CopyFullRxnBond(new,bond);
     
     if(CompareRxnAtomCorrespondence(bond->Atom1,bond->Atom2,
			      2,molecules) < 0)
	  {
	  atm1 = new->Atom1;
	  new->Atom1 = new->Atom2;
	  new->Atom2 = atm1;
	  }
     }
 
/*f compvecset = ComputeCompareVectorSetForRxnBond(atm,num,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CompareVectorSet *ComputeCompareVectorSetForRxnBond(RxnBond *atm,
							   INT num,
							   MoleculeSet *molecules)
     {
     CompareVectorSet *comparesets;
     CompareVector *cmp;
     INT i,j,*comps;
     
     comparesets = AllocateCompareVectorSet;
     CreateCompareVectorSet(comparesets,num,"",
			    num,0);
     cmp = comparesets->Sets;
     LOOPi(num)
	  {
	  CreateCompareVector(cmp,i,"",
			      num,0);
	  comps = cmp->Compares;
	  LOOPj(num)
	       {
	       *comps = CompareRxnBond((atm + i),(atm + j),1,molecules);
	       comps++;
	       }
	  cmp++;
	  }
     return(comparesets);
     }
 
/*f rxnbond = FormCanonicalVectorRxnBond(bond,num,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnBond *FormCanonicalVectorRxnBond(RxnBond *bond, INT num,
					   MoleculeSet *molecules)
     {
     CompareVectorSet *comparesets;
     RxnBond *newset,*newstart,*new,*start,*old;
     CompareVector *cmp;
     INT i;
     
     newset = newstart = AllocArrayRxnBond(num);
     LOOPi(num)
	  {
	  FormCanonicalRxnBond(newset,bond,molecules);
	  bond++;
	  newset++;
	  }
     
     comparesets = ComputeCompareVectorSetForRxnBond(newstart,num,molecules);
     
     qsort(comparesets->Sets,comparesets->NumberOfSets,
	   CompareVectorSetSize,(int (*)()) VectorSetCompare);
     
     new = start = AllocArrayRxnBond(num);

     cmp = comparesets->Sets;
     LOOPi(num)
	  {
	  old = newstart + cmp->ID;
	  CopyFullRxnBond(new,old);
	  FreeRxnBond(old);
	  
	  new++;
	  cmp++;
	  }
     FreeCompareVectorSet(comparesets);
     Free(comparesets);
     Free(newstart);
     
     return(start);
     }
 
/*f comp = CompareRxnBondChanges(set1,set2,level,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT CompareRxnBondChanges(RxnBondChanges *set1,
				 RxnBondChanges *set2,
				 INT level,
				 MoleculeSet *molecules)
     {
     RxnBond *bond1,*bond2;
     INT count,ans;
     
     if(set1->NumberBondChanges != set2->NumberBondChanges)
	  ans = set1->NumberBondChanges - set2->NumberBondChanges;
     else
	  {
	  bond1 = set1->Changes;
	  bond2 = set2->Changes;
	  count = 0;
	  ans = 0;
	  while(count < set1->NumberBondChanges && 
		ans == 0)
	       {
	       ans = CompareRxnBond(bond1,bond2,level,molecules);
	       count++;
	       }
	  }
     return(ans);
     }
 
/*f rxnbondchanges = FormCanonicalRxnBondChanges(set,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnBondChanges *FormCanonicalRxnBondChanges(RxnBondChanges *set,
						   MoleculeSet *molecules)

     {
     RxnBondChanges *changes;
     
     changes = AllocateRxnBondChanges;
     CreateRxnBondChanges(changes,set->ID,set->Name,
			   set->NumberBondChanges,
			   0);
     
     changes->Changes = 
	  FormCanonicalVectorRxnBond(set->Changes,
				     set->NumberBondChanges,
				     molecules);
     return(changes);
     }

 
/*f comp = CompareRxnCorrespondenceSet(set1,set2,level,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/			  
static INT CompareRxnCorrespondenceSet(RxnCorrespondenceSet *set1,
				       RxnCorrespondenceSet *set2,
				       INT level,
				       MoleculeSet *molecules)
     {     
     INT ans,count;
     RxnAtomCorrespondence *corrs1,*corrs2;

     ans = CompareRxnBondChanges(set1->BondChanges,
			      set2->BondChanges,
			      level,molecules);
     if(ans == 0)
	  {
	  ans = CompareRxnUnMatchedSet(set1->UnMatched,set2->UnMatched,
				       level,molecules);
	  if(ans == 0)
	       {
	       if(set1->NumberOfCorrs != set2->NumberOfCorrs)
		    ans = set1->NumberOfCorrs - set2->NumberOfCorrs;
	       else
		    {
		    count = 0;
		    corrs1 = set1->Corrs;
		    corrs2 = set2->Corrs;
		    while(ans == 0 &&
			  count < set1->NumberOfCorrs)
			 {
			 ans = CompareRxnAtomCorrespondence(corrs1,corrs2,
							    level,molecules);
			 count++;
			 }
		    }
	       }
	  }
     return(ans);
     }
 
/*f rxncorrset = FormCanonicalRxnCorrespondenceSet(set,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static RxnCorrespondenceSet 
     *FormCanonicalRxnCorrespondenceSet(RxnCorrespondenceSet *set,
					MoleculeSet *molecules)
     {
     RxnCorrespondenceSet *new;
     
     new = AllocateRxnCorrespondenceSet;

     new->ID = set->ID;
     new->Name = CopyString(set->Name);
     new->NumberOfCorrs = set->NumberOfCorrs;
     
     new->Corrs = FormCanonicalVectorRxnAtomCorrespondence(set->Corrs,
							    set->NumberOfCorrs,
							    molecules);
     new->UnMatched = FormCanonicalRxnUnMatchedSet(set->UnMatched,molecules);
     new->BondChanges = FormCanonicalRxnBondChanges(set->BondChanges,molecules);
     
     return(new);
     }
 
/*f comp =CompareReactionInfo(info1,info2,level,molecules) 
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT CompareReactionInfo(ReactionInfo *info1, 
			       ReactionInfo *info2,
			       INT level,
			       MoleculeSet *molecules)
     {
     INT ans;
     
     ans = CompareRxnCorrespondenceSet(info1->TotalCorr,
				       info2->TotalCorr,
				       level,
				       molecules);
     if(ans == 0)
	  {
	  if(info1->NumberOfReactants != info2->NumberOfReactants)
	       ans = info1->NumberOfReactants - info2->NumberOfReactants;
	  else
	       {
	       if(info1->NumberOfProducts != info2->NumberOfProducts)
		    ans = info1->NumberOfProducts - info2->NumberOfProducts;
	       else
		    ans = 0;
	       }
	  }
     return(ans);
     }
 
/*f FormCanonicalReactionInfo(new,info,molecules)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void FormCanonicalReactionInfo(ReactionInfo *new,
				      ReactionInfo *info,
				      MoleculeSet *molecules)
     {
     CreateReactionInfo(new,info->ID,info->Name,
			info->NumberOfReactants,
			info->NumberOfProducts,
			info->Reactants,
			info->Products,
			0,0,0,0);
     new->TotalCorr = FormCanonicalRxnCorrespondenceSet(info->TotalCorr,
							molecules);
     }

     

     
