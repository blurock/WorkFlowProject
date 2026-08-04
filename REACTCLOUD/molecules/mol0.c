#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"

#include "molecules/mol.c"
#include "molecules/bnd.c"
#include "molecules/chrg.c"

/*****************************************************************************/
/* Molecule Electronic
*/

/******PrtMoleculeElectronic
*/
extern void PrintPrettyMoleculeElectronic(CHAR *prefix, FILE *file,
					  MoleculeElectronic *molecule)
     {
     if(molecule == 0)
	  {
	  fprintf(file,"%s: No Electronic Calc\n",prefix);
	  return;
	  }
     
     fprintf(file,"%s: ----- Electronic\n",prefix);
     PrintPrettyAtomElectronic(prefix, file,
			       molecule->Atoms,molecule->NAtoms );

     fprintf(file,"~\n");
     fprintf(file,"%s: ----- Resonances(s)\n",prefix);
     PrintPrettySetOfResonances(prefix, file,molecule->Resonant);
}

extern void PrintPrettyAtomElectronic(CHAR *prefix, FILE *file,
				      AtomElectronic *atom,INT NAtoms)
     {                       
     INT i,j;              
     AtomElectronic *atomstart;
     CHAR *string;
     
     string = StringOfBlanks(strlen(prefix));
     
     atomstart = atom;
     fprintf(file,"%s:   Atomic :  Charge  :Number of : Occupied :Shells\n",
	     prefix);
     fprintf(file,"%s:   Number :          :Electrons :          :      \n",
	     string);
     
     atom = atomstart;
     LOOPi(NAtoms)
          {
         fprintf(file,"%s:%11.3d:%11.3f:%11.3f:%10d",string,
		 atom->AtomicNumber,
		 atom->Charge,
		 atom->NElectrons,
		 atom->NOccupied);
          LOOPj(atom->NOccupied)
              fprintf(file,"%5.3f ",atom->Shells[j]);
         fprintf(file,"\n");     
          atom++;
          }
     fprintf(file,"~\n");
     
    fprintf(file,
	    "%s:  Radius   :Electro-  :Screening :Effective :Residual :  Beta\n",
	    prefix);
    fprintf(file,
	    "%s:           :negative  : factor   : Charge   : Charge  :      \n",
	    string);
     
     fprintf(file,"~\n");
     atom = atomstart;
     LOOPi(NAtoms)
          {
	  fprintf(file,
		  "%s:%11.6f%11.6f%11.6f%11.6f%11.6f%11.6f%11.6f\n",string,
		  atom->CovalentRadius,
		  atom->Electronegativity,
		  atom->Screening,
		  atom->CovalentRadius,
		  atom->NuclearCharge,
		  atom->ResidualCharge,
		  atom->Beta);
	 atom++;             
	 }
     fprintf(file,"~\n");
     }

extern void PrintPrettySetOfResonances(CHAR *prefix, FILE *file,
				       SetOfResonances *sets)
     {
     INT i,j,*atm;
     Resonance *set;
     
     set = sets->Sets;
     LOOPi(sets->NumberOfSets)
	  {
	  fprintf(file,"%s:%5d:   ",prefix,i);
	  atm = set->Atoms;
	  LOOPj(set->NumberOfAtoms)
	       fprintf(file,"%3d",*atm++);
	  fprintf(file,"\n");
	  set++;
	  }
     }

/*F molinfo = FindMoleculeFromString(molname,set)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern MoleculeInfo *FindMoleculeFromString(CHAR *molname,
					    MoleculeSet *set)
     {
     INT id,flag;
     MoleculeInfo *mol;
     
     if(*molname > '0' && *molname < '9')
	  flag = MOL_ID_BY_NUMBER;
     else
	  flag = MOL_ID_BY_NAME;
     
     switch(flag)
	  {
     case MOL_ID_BY_NUMBER:
	  id = ConvertStringToInteger(molname);
	  mol = FindMoleculeInMoleculeSet(id,set);
	  break;
     case MOL_ID_BY_NAME:
	  mol = FindMoleculeInMoleculeSetByName(molname,set);
	  break;
	  }
     return(mol);
     }

extern MoleculeInfo *FindMoleculeInMoleculeSet(INT id, MoleculeSet *set)
     {
     MoleculeInfo *mol,*match;
     INT count;
     
     mol = set->Molecules;
     match = 0;
     count = 0;
     while(match == 0 && count < set->NumberOfMolecules)
	  {
	  if(mol->ID == id)
	       match = mol;
	  count++;
	  mol++;
	  }
     return(match);
     }

extern MoleculeInfo *FindMoleculeInMoleculeSetByName(CHAR *name,
						     MoleculeSet *set)
     {
     MoleculeInfo *mol,*match;
     INT count;
     
     mol = set->Molecules;
     match = 0;
     count = 0;
     while(match == 0 && count < set->NumberOfMolecules)
	  {
	  if(!strcmp(name,mol->Name))
	       match = mol;
	  count++;
	  mol++;
	  }
     return(match);
     }

extern MoleculeSet *MergeMoleculeSets(MoleculeSet *molset1,
				      MoleculeSet *molset2)
     {
     INT size,i;
     MoleculeInfo *mol,*new;
     MoleculeSet *newset;
     
     size = molset1->NumberOfMolecules + molset2->NumberOfMolecules;
     newset = AllocateMoleculeSet;
     CreateMoleculeSet(newset,molset1->ID,molset1->Name,
		       size,0,0,0);
     
     mol = molset1->Molecules;
     new = newset->Molecules;
     LOOPi(molset1->NumberOfMolecules)
	  {
	  CopyFullMoleculeInfo(new,mol);
	  mol++;
	  new++;
	  }
     mol = molset2->Molecules;
     LOOPi(molset2->NumberOfMolecules)
	  {
	  if(FindMoleculeInMoleculeSet(mol->ID,molset1) == 0)
	       CopyFullMoleculeInfo(new,mol);
	  else
	       newset->NumberOfMolecules -= 1;
	  
	  mol++;
	  new++;
	  }
     return(newset);
     }
     
