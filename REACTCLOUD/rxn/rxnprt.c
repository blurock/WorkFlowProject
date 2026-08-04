#include "basic.h"

#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "rxn.h"

static void StringRxnChangesParameters(CHAR *out, 
				       RxnBondChanges *bond,
				       MoleculeSet *molecules);
static void StringRxnUnMatchedParameters(CHAR *out,
				      RxnUnMatchedSet *unmatched,
					 MoleculeSet *molecules);
static void StringRxnAtomCorrespondenceParameters(CHAR *out,
						  RxnAtomCorrespondence *corr,
						  MoleculeSet *molecules);
static void StringRxnAtomParameters(CHAR *out,
				    RxnAtom *atom,
				    MoleculeSet *molecules);

/***************************************************************************/
/* Pretty Print Routines */
/***************************************************************************/

extern void PrintPrettyReactionInfo(CHAR *prefix, FILE *file, 
				    ReactionInfo *rxn,
				    SetOfPropertyTypes *types)
     {
     CHAR *string;
     INT length;
     
     if(rxn == 0) 
	  {
	  fprintf(file,"%s: No Reaction\n",prefix);
	  }
     else
	  {
	  if(rxn->Name != 0)
	       fprintf(file,"%s\n",rxn->Name);
	  fprintf(file,"%s:Rxn %5d (%5d Reactants, %5d Products)\n",
		  prefix,rxn->ID,rxn->NumberOfReactants,rxn->NumberOfProducts);
	  
	  string = AllocateString(LINELENGTH);
	  sprintf(string,"%s: Reactants ",prefix);
	  PrintPrettyIntegerArray(string,file,rxn->Reactants,rxn->NumberOfReactants,6);
	  sprintf(string,"%s: Products ",prefix);
	  PrintPrettyIntegerArray(string,file,rxn->Products,rxn->NumberOfProducts,6);
	  Free(string);

	  string = AllocateString(PRINT_BUFFER_LENGTH);
	  length = PRINT_BUFFER_LENGTH;
	  PrintStringAllPropertySets(string,&length,types,rxn->Properties,0);
	  fprintf(file,"%s",string);
	  Free(string);
	  fprintf(file,"~\n");
	  fprintf(file,"Total Set of Atom Correspondences\n",prefix);
	  PrintPrettyRxnCorrespondenceSet(prefix,file,rxn->TotalCorr);
	  }
     }

extern void PrintPrettyReactionSet(CHAR *prefix, FILE *file,
				   ReactionSet *set)
     {
     CHAR *string;
     ReactionInfo *rxn;
     INT i;
     
     if(set == 0) 
	  {
	  fprintf(file,"%s: No Set of Reactions\n",prefix);
	  return;
	  }
     
     fprintf(file,"%s:%5d Reactions\n",prefix, 
	     set->NumberOfReactions);
     string = StringOfBlanks(strlen(prefix)+5);
     rxn = set->Reactions;
     LOOPi(set->NumberOfReactions)
	  {
	  PrintPrettyReactionInfo(string,file,rxn++,set->PropertyTypes);
	  fprintf(file,"\n");
	  }
     }

extern CHAR *PrintStringReactionDataConstants(CHAR *out, INT *length,
					      CHAR *prefix,
					      ReactionDataConstants *constants)
     {
     CHAR *string;
     
     string = AllocateString(LINELENGTH);
     sprintf(string,"%s %10e %10.3f %10.2f %d",
	     prefix,
	     constants->Aconstant,
	     constants->TempExp,			     
	     constants->Energy,
	     constants->Sym);
     
     out = PrintStringString(out,length,string);
     Free(string);
     return(out);
     }

	 
extern void PrintPrettyRxnCorrespondenceSet(CHAR *prefix, FILE *file,
					    RxnCorrespondenceSet *set)
     {
     RxnAtomCorrespondence *corr;
     INT i;
     CHAR *string;
     
     if(set == 0)
	  {
	  fprintf(file,"%s: No Reaction Correspondences\n",prefix);
	  return;
	  }
     
     fprintf(file,"%s:Reaction Correspondences %d \n",prefix, set->ID);
     
     string = StringOfBlanks(strlen(prefix));
     fprintf(file,"%s: %d Matched Atoms\n",string,set->NumberOfCorrs);
     corr = set->Corrs;
     LOOPi(set->NumberOfCorrs)
	  {
	  fprintf(file,"%s:%5d [%15d %5d]  [%15d %5d] \n",
		  string,i,
		  corr->Reactant->MoleculeNumber, corr->Reactant->AtomNumber,
		  corr->Product->MoleculeNumber, corr->Product->AtomNumber);
	  corr++;
	  }
     PrintPrettyRxnUnMatchedSet(prefix,file,set->UnMatched);
     
     PrintPrettyRxnBondChanges(prefix,file,set->BondChanges);
     
     }

extern void PrintPrettyRxnUnMatchedSet(CHAR *prefix, FILE *file,
				       RxnUnMatchedSet *set)
     {
     INT i;
     RxnAtom *atm;
     CHAR *string;
     
     if(set == 0)
	  {
	  fprintf(file,"%s: No UnMatched\n",prefix);
	  return;
	  }
     
     string = StringOfBlanks(strlen(prefix));
     fprintf(file,"%s: %d Unmatched Atoms\n",prefix,
	     set->NumberUnMatchedAtoms);
     atm = set->UnMatchedAtoms;
     LOOPi(set->NumberUnMatchedAtoms)
	  {
	  fprintf(file,"%s:[%15d %5d] \n",string,
		  atm->MoleculeNumber, atm->AtomNumber);
	  atm++;
	  }
     }

extern void PrintPrettyRxnBondChanges(CHAR *prefix, FILE *file,
				      RxnBondChanges *changes)
     {
     RxnBond *bond;
     RxnAtomCorrespondence *atom1,*atom2;
     INT i;
     CHAR *string;
     
     if(changes == 0)
	  {
	  fprintf(file,"%s: No Reaction Bond Changes\n",prefix);
	  return;
	  }

     fprintf(file,"%s:Reaction Bond Changes\n",prefix);
     string = StringOfBlanks(strlen(prefix));

     bond = changes->Changes;
     LOOPi(changes->NumberBondChanges)
	  {
	  atom1 = bond->Atom1;
	  atom2 = bond->Atom2;
	  
	  fprintf(file,"%s:%5d ",
		  string,i);
	  if(atom1 != 0)
	       fprintf(file,"([%15d %5d]  [%15d %5d])",
		       atom1->Reactant->MoleculeNumber, atom1->Reactant->AtomNumber,
		       atom1->Product->MoleculeNumber, atom1->Product->AtomNumber);
	  else
	       fprintf(file,"(         UnMatched          )");

	  fprintf(file,"---");
	  
	  if(atom2 != 0)
	       fprintf(file,"([%15d %5d]  [%15d %5d])",
		       atom2->Reactant->MoleculeNumber, atom2->Reactant->AtomNumber,
		       atom2->Product->MoleculeNumber, atom2->Product->AtomNumber);
	  else
	       fprintf(file,"(         UnMatched          )");
          fprintf(file,"\n");
	  
	  bond++;
	  }
     Free(string);
     
     }

extern void PrintReactionSetParameters(FILE *file,
				       CHAR *prefix,
				       ReactionSet *reactions,
				       MoleculeSet *molecules)
     {
     CHAR *string0,*string1,*string2;
     ReactionInfo *rxn;
     RxnCorrespondenceSet *rxnpat;
     INT i;
     
     string0 = AllocateString(LINELENGTH);
     string1 = AllocateString(LINELENGTH);
     string2 = AllocateString(LINELENGTH);

     rxn = reactions->Reactions;
     LOOPi(reactions->NumberOfReactions)
	  {
	  rxnpat = rxn->TotalCorr;
	  sprintf(string0,"%s %5d ",prefix,rxn->ID);
	  StringRxnChangesParameters(string1,rxnpat->BondChanges,molecules);
	  StringRxnUnMatchedParameters(string2,rxnpat->UnMatched,molecules);
	  fprintf(file,"%s%s%s\n",string0,string1,string2);
	  rxn++;
	  }
     
     Free(string0);
     Free(string1);
     Free(string2);
     }

static void StringRxnChangesParameters(CHAR *out, 
				       RxnBondChanges *bond,
				       MoleculeSet *molecules)
     {
     CHAR *string,*string1,*string2;
     RxnBond *change;
     INT i;

     string1 = AllocateString(LINELENGTH);
     string2 = AllocateString(LINELENGTH);
     
     change = bond->Changes;
     string = out;
     LOOPi(bond->NumberBondChanges)
	  {
	  if(change->Type == 4 || change->Type == 104)
	       {
	       StringRxnAtomCorrespondenceParameters(string1,change->Atom1,molecules);
	       StringRxnAtomCorrespondenceParameters(string2,change->Atom2,molecules);
	       sprintf(string,"%s%s",string1,string2);
	       string += strlen(string1) + strlen(string2) - 2;
	       }
	  change++;
	       }
     Free(string1);
     Free(string2);
     }

static void StringRxnUnMatchedParameters(CHAR *out,
				      RxnUnMatchedSet *unmatched,
				      MoleculeSet *molecules)
     {
     RxnAtom *atm;
     INT i;
     
     atm = unmatched->UnMatchedAtoms;
     LOOPi(unmatched->NumberUnMatchedAtoms)
	  {
	  StringRxnAtomParameters(out,atm,molecules);
	  out += strlen(out);
	  atm++;
	  }
     }

static void StringRxnAtomCorrespondenceParameters(CHAR *out,
						  RxnAtomCorrespondence *corr,
						  MoleculeSet *molecules)
     {
     CHAR *str;
     
     str = out;
     if(corr == 0)
	  {
	  StringRxnAtomParameters(str,0,molecules);
	  StringRxnAtomParameters(out + strlen(str),0,molecules);
	  }
     else
	  {
	  StringRxnAtomParameters(str,
				  corr->Reactant,molecules);
	  StringRxnAtomParameters(out + strlen(str),
				  corr->Product,molecules);
	  }
     }

     
static void StringRxnAtomParameters(CHAR *out,
				    RxnAtom *atom,
				    MoleculeSet *molecules)
     {
     MoleculeInfo *mol;
     PropValue *atmnum,*electro,*charge,*bndord,*reson;
     
     if(atom == 0 || atom->MoleculeNumber < 0)
	  {
	  sprintf(out,"  .   . .   .         .    ");
	  }
     else
	  {
	  mol = FindMoleculeInMoleculeSet(atom->MoleculeNumber,molecules);
     
	  atmnum  = FindAtomProperty(mol,atom->AtomNumber,ATOMIC_NUMBER);
	  electro = FindAtomProperty(mol,atom->AtomNumber,ELECTRONEGATIVITY);
	  charge  = FindAtomProperty(mol,atom->AtomNumber,CHARGE);
	  bndord  = FindAtomProperty(mol,atom->AtomNumber,BONDORDER);
	  reson   = FindAtomProperty(mol,atom->AtomNumber,RESONANT);
	  
	  sprintf(out,"%5d%2d%10.3f%10.3f",
		  atmnum->Integer,
		  reson->Integer,
		  electro->Float,
		  charge->Float);
	  
	  FreePropValue(atmnum);
	  FreePropValue(electro);
	  FreePropValue(charge);
	  FreePropValue(bndord);
	  FreePropValue(reson);
	  Free(atmnum);
	  Free(electro);
	  Free(charge);
	  Free(bndord);
	  Free(reson);
	  }
     }

	  

