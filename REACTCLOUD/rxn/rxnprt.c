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


static MoleculeInfo *FindMoleculeInSetByID(MoleculeSet *set, INT id)
{
  INT i;
  MoleculeInfo *mol;
  if (set == 0 || set->Molecules == 0) return 0;
  mol = set->Molecules;
  for (i = 0; i < set->NumberOfMolecules; i++) {
    if (mol->ID == id) {
      return mol;
    }
    mol++;
  }
  return 0;
}

extern void PrintReactionAsRxnFile(CHAR *prefix, FILE *file,
                                   ReactionInfo *rxn,
                                   MoleculeSet *molecules)
{
  INT i;
  MoleculeInfo *mol;

  if (rxn == 0) return;

  fprintf(file, "~\n");
  fprintf(file, "%s:Molecule / Reaction in $RXN form\n", prefix);
  fprintf(file, "$RXN\n");
  fprintf(file, "$MDL\n");
  fprintf(file, "%s\n", rxn->Name ? rxn->Name : "Reaction Pattern");
  fprintf(file, "  REACTCLOUD\n");
  fprintf(file, "%3d%3d\n", rxn->NumberOfReactants, rxn->NumberOfProducts);

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    fprintf(file, "$MOL\n");
    mol = FindMoleculeInSetByID(molecules, rxn->Reactants[i]);
    if (mol != 0) {
      PrintMoleculeAsMolFile(file, mol);
    } else {
      fprintf(file, "%d\n  -REACTCLOUD-\n\n  0  0  0  0  0  0  0  0999 V2000\nM  END\n", rxn->Reactants[i]);
    }
  }

  for (i = 0; i < rxn->NumberOfProducts; i++) {
    fprintf(file, "$MOL\n");
    mol = FindMoleculeInSetByID(molecules, rxn->Products[i]);
    if (mol != 0) {
      PrintMoleculeAsMolFile(file, mol);
    } else {
      fprintf(file, "%d\n  -REACTCLOUD-\n\n  0  0  0  0  0  0  0  0999 V2000\nM  END\n", rxn->Products[i]);
    }
  }
}

/***************************************************************************/
/* Pretty Print Routines */
/***************************************************************************/

extern void PrintPrettyReactionInfo(CHAR *prefix, FILE *file, 
				    ReactionInfo *rxn,
				    SetOfPropertyTypes *types,
				    MoleculeSet *molecules,
				    BindStructure *bind)
     {
     CHAR *string;
     INT length;
     CHAR **names;
     INT nummols, i, idx;
     
     if(rxn == 0) 
	  {
	  fprintf(file,"%s: No Reaction\n",prefix);
	  }
     else
	  {
	  nummols = rxn->NumberOfReactants + rxn->NumberOfProducts;
	  if (nummols > 0 && bind != 0)
	       {
	       names = (CHAR **) Calloc(nummols, sizeof(CHAR *));
	       idx = 0;
	       for (i = 0; i < rxn->NumberOfReactants; i++) {
		   names[idx] = AllocateString(32);
		   sprintf(names[idx], "%d", rxn->Reactants[i]);
		   idx++;
	       }
	       for (i = 0; i < rxn->NumberOfProducts; i++) {
		   names[idx] = AllocateString(32);
		   sprintf(names[idx], "%d", rxn->Products[i]);
		   idx++;
	       }

	       PrintRXNFromListOfNames(rxn->Name, rxn->NumberOfReactants, rxn->NumberOfProducts, names, file, bind);

	       for (i = 0; i < nummols; i++) {
		   Free(names[i]);
	       }
	       Free(names);
	       }
	  else
	       {
	       PrintReactionAsRxnFile(prefix, file, rxn, molecules);
	       }

	  string = AllocateString(PRINT_BUFFER_LENGTH);
	  length = PRINT_BUFFER_LENGTH;
	  if (types != 0)
	       PrintStringAllPropertySets(string, &length, types, rxn->Properties, 0);
	  fprintf(file, "%s", string);
	  Free(string);
	  fprintf(file,"~\n");
	  fprintf(file,"%sTotal Set of Atom Correspondences\n",prefix);
	  PrintPrettyRxnCorrespondenceSet(prefix,file,rxn->TotalCorr);
	  }
     }

extern void PrintPrettyReactionSet(CHAR *prefix, FILE *file,
				   ReactionSet *set,
				   MoleculeSet *molecules,
				   BindStructure *bind)
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
	  PrintPrettyReactionInfo(string,file,rxn++,set->PropertyTypes,molecules,bind);
	  fprintf(file,"\n");
	  }
     Free(string);
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
     fprintf(file,"%s: MatTable (%d Matched Atoms)\n",string,set->NumberOfCorrs);
     fprintf(file,"%s: %-18s %-10s %-18s %-10s\n", string,
	     "Reactant Molecule", "Index", "Product Molecule", "Index");
     corr = set->Corrs;
     LOOPi(set->NumberOfCorrs)
	  {
	  fprintf(file,"%s: %-18d %-10d %-18d %-10d\n",
		  string,
		  corr->Reactant->MoleculeNumber, corr->Reactant->ID,
		  corr->Product->MoleculeNumber, corr->Product->ID);
	  corr++;
	  }
     PrintPrettyRxnUnMatchedSet(prefix,file,set->UnMatched);
     
     PrintPrettyRxnBondChanges(prefix,file,set->BondChanges);
     Free(string);
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
     CHAR r1[32], r2[32], p1[32], p2[32];
     
     if(changes == 0)
	  {
	  fprintf(file,"%s: No Reaction Bond Changes\n",prefix);
	  return;
	  }

     fprintf(file,"%s:Reaction Bond Changes\n",prefix);
     string = StringOfBlanks(strlen(prefix));

     fprintf(file,"%s: %-17s   %-17s\n", string, "Reactant Bond.", "Product Bond");
     fprintf(file,"%s: %-8s %-8s   %-8s %-8s\n", string, "Atom 1.", "Atom 2.", "Atom 1", "Atom 2.");

     bond = changes->Changes;
     LOOPi(changes->NumberBondChanges)
	  {
	  atom1 = bond->Atom1;
	  atom2 = bond->Atom2;
	  
	  if(atom1 != 0 && atom1->Reactant != 0 && atom1->Reactant->MoleculeNumber >= 0)
	       sprintf(r1, "%d", atom1->Reactant->ID);
	  else
	       sprintf(r1, ".");

	  if(atom2 != 0 && atom2->Reactant != 0 && atom2->Reactant->MoleculeNumber >= 0)
	       sprintf(r2, "%d", atom2->Reactant->ID);
	  else
	       sprintf(r2, ".");

	  if(atom1 != 0 && atom1->Product != 0 && atom1->Product->MoleculeNumber >= 0)
	       sprintf(p1, "%d", atom1->Product->ID);
	  else
	       sprintf(p1, ".");

	  if(atom2 != 0 && atom2->Product != 0 && atom2->Product->MoleculeNumber >= 0)
	       sprintf(p2, "%d", atom2->Product->ID);
	  else
	       sprintf(p2, ".");

	  fprintf(file,"%s: %-8s %-8s   %-8s %-8s\n", string, r1, r2, p1, p2);
	  
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

	  

