/*  FILE     valence.c
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
#include <math.h>
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void MergeAtomicNumberCounts(AtomicNumberCount *total,
				    AtomicNumberCount *addition);
static int CompareAtomicNumberCount(AtomicNumberCount *cnt1,
				    AtomicNumberCount *cnt2);

static INT AddHydrogenAtoms(MolFileAtom *atom,
			    MolFileMolecule *mol,
			    INT nhyds);
static void AddBondsOfHydrogens(MolFileMolecule *mol,
				INT atomid,
				INT nhydrogens,
				INT hydrogenid);
static INT TransferBonds(MolFileMolecule *old,
			 MolFileMolecule *new);
static INT TransferAtoms(MolFileMolecule *old,
			 MolFileMolecule *new);
static INT MaxNumberOfBonds(INT num);
static INT MaxNumberOfAtoms(INT num);
static INT AtomIsAMetaAtom(INT atomid,
			   MolFileMolecule *mol);
static CHAR *PrintStringAtomicNumberCount(CHAR *string, INT *length,
					  AtomicNumberCount *acount);
 
/*V  . . . GLOBAL VARIABLES  . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#define  NUMBER_ATOM_HYDROGEN_PARAMETERS 8
static INT ATOM_HYDROGEN_PARAMETERS[8] =
     {0,0,0,0,0,0,0,0};
#define  NUMBER_BOND_HYDROGEN_PARAMETERS  8
static INT BOND_HYDROGEN_PARAMETERS[8] =
     {0,0,0,0,0,0,0,0};


/*S AtomCounts
*/
/*F
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
extern MoleculeAtomCounts *DetermineAtomCounts(MoleculeInfo *molinfo)
     {     
     INT max,*valence,i,atomicnumber,count;
     MoleculeAtomCounts *countset;
     AtomicNumberCount *acount,*current;
     MolFileMolecule *molecule;
     
     molecule = molinfo->Molfile;
     max = molecule->NAtoms+2;
     countset = AllocateMoleculeAtomCounts;
     CreateMoleculeAtomCounts(countset,molecule->ID,molecule->Name,
			      max,0,molecule->NAtoms,0);
     countset->NumberOfAtomCounts = molecule->NAtoms;
     
     valence = countset->Valences;
     
     acount = countset->AtomCounts;
     LOOPi(molecule->NAtoms)
	  {
	  *valence = DetermineValenceValue(i,VALENCE_STANDARD,molinfo);
	  atomicnumber = DetermineValenceValue(i,VALENCE_ATOMIC_NUMBER,molinfo);
	  CreateAtomicNumberCount(acount,atomicnumber,0,1,max,0,0);
	  acount->NumberOfValences = 1;
	  *(acount->Valences) = *valence;
	  *(acount->VCounts) = 1;
	  
	  valence++;
	  acount++;
	  }

     qsort(countset->AtomCounts,countset->NumberOfAtomCounts,AtomicNumberCountSize,
	   (int (*)()) CompareAtomicNumberCount);

     current = countset->AtomCounts;
     acount = current + 1;
     count = 1;
     LOOPi(countset->NumberOfAtomCounts - 1)
	  {
	  if(current->ID == acount->ID)
	       {
	       MergeAtomicNumberCounts(current,acount);
	       FreeAtomicNumberCount(acount);
	       }
	  else
	       {
	       current++;
	       count++;
	       if(acount != current)
		    {
		    CreateAtomicNumberCount(current,acount->ID,acount->Name,
					    acount->ACount,max,0,0);
		    current->NumberOfValences = 1;
		    *(current->Valences) = *(acount->Valences);
		    *(current->VCounts) = 1;
		    FreeAtomicNumberCount(acount);
		    }
	       }
	  acount++;
	  }
     countset->NumberOfAtomCounts = count;

     return(countset);
     }
 
/*F new = PrintStringMoleculeAtomCounts(string,length,prefix,atomcounts)
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
extern CHAR *PrintStringMoleculeAtomCounts(CHAR *string, INT *length, CHAR *prefix,
					   MoleculeAtomCounts *atomcounts)
     {
     CHAR *line;
     AtomicNumberCount *acount;
     INT *val,i;
     
     line = AllocateString(LINELENGTH);
     
     string = PrintStringString(string,length,prefix);
     string = PrintStringString(string,length,"Molecule Atom Counts\n");
     string = PrintStringString(string,length,prefix);
     string = PrintStringString(string,length,"     Valences for Atoms");
     val = atomcounts->Valences;
     LOOPi(atomcounts->NumberOfAtoms)
	  {
	  if(i%5 == 0)
	       string = PrintStringString(string,length,"\n      - ");
	  sprintf(line," %10d ",*val);
	  string = PrintStringString(string,length,line);
	  val++;
	  }
     string = PrintStringString(string,length,"     Atom Count Summary\n");     
     acount = atomcounts->AtomCounts;
     LOOPi(atomcounts->NumberOfAtomCounts)
	  {
	  string = PrintStringAtomicNumberCount(string,length,acount);
	  acount++;
	  }
     Free(line);
     return(string);
     }
static CHAR *PrintStringAtomicNumberCount(CHAR *string, INT *length,
					  AtomicNumberCount *acount)
     {
     CHAR *line;
     INT *val,*cnt,j;

     line = AllocateString(LINELENGTH);
     
     sprintf(line,"      - %10d(%2d) -> ",acount->ID,acount->ACount);
     string = PrintStringString(string,length,line);
     
     val = acount->Valences;
     cnt = acount->VCounts;
     LOOPj(acount->NumberOfValences)
	  {
	  sprintf(line,"%d(%d) ",*val,*cnt);
	  string = PrintStringString(string,length,line);
	  val++;
	  cnt++;
	  }
     string = PrintStringString(string,length,"\n");
     Free(line);
     return(string);
     }


/*f MergeAtomicNumberCounts(total,addition)
**
**  DESCRIPTION
**    
**  REMARKS
**   It is assumed that the valences are ordered
**   Also that there is enough allocated space for 
**      added valences and valence counts
*/
static void MergeAtomicNumberCounts(AtomicNumberCount *total,
			       AtomicNumberCount *addition)
     {
     INT addval,curval;
/*
     INT length;
     CHAR *string;
*/     
     total->ACount += 1;
     
/*
     printf("------------MergeAtomicNumber----------\n");
     string = AllocateString(PRINT_BUFFER_LENGTH);
     length = PRINT_BUFFER_LENGTH;
     PrintStringAtomicNumberCount(string,&length,total);
     printf("%s",string);
     
     PrintStringAtomicNumberCount(string,&length,addition);
     printf("%s",string);
*/
     
     addval = *(addition->Valences);
     curval = *(total->Valences + total->NumberOfValences - 1);
	  
     if(addval == curval)
	  {
	  *(total->VCounts) += 1;
	  }
     else
	  {
	  *(total->Valences + total->NumberOfValences) = addval;
	  *(total->VCounts + total->NumberOfValences) = 1;
	  total->NumberOfValences += 1;
	  }
/*
     PrintStringAtomicNumberCount(string,&length,total);
     printf("%s",string);
     Free(string);
*/
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static int CompareAtomicNumberCount(AtomicNumberCount *cnt1,
				    AtomicNumberCount *cnt2)
     {
     int ans;
     
     if(cnt1->ID > cnt2->ID)
	  ans = 1;
     else if(cnt1->ID < cnt2->ID)
	  ans = -1;
     else if(*(cnt1->Valences) > *(cnt2->Valences))
	  ans = 1;
     else if(*(cnt1->Valences) < *(cnt2->Valences))
	  ans = -1;
     else
	  ans = 0;
     return(ans);
     }

     
/*S AddHydrogens
  
*/ 
/*F with = AddHydrogens(molecule)
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
extern MolFileMolecule *AddHydrogens(MolFileMolecule *molecule)
     {
     MolFileMolecule *newmol;
     MolFileAtom *atom;
     INT i,nhyds;
     
     newmol = AllocateMolFileMolecule;
     CreateMolFileMolecule(newmol,molecule->ID,molecule->Name,
			   MaxNumberOfAtoms(molecule->NAtoms),
			   MaxNumberOfBonds(molecule->NBonds),
			   0,0,0);
     
     newmol->NBonds = TransferBonds(molecule,newmol);
     newmol->NAtoms = TransferAtoms(molecule,newmol);
     
     atom = molecule->Atoms;
     LOOPi(molecule->NAtoms)
	  {
	  nhyds = NumberOfHydrogensToAdd(i,molecule);
	  AddBondsOfHydrogens(newmol,i,nhyds,newmol->NAtoms);
	  AddHydrogenAtoms(atom,newmol,nhyds);
	  atom++;
	  }
     return(newmol);
     }

 
/*f max = MaxNumberOfAtoms(num)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT MaxNumberOfAtoms(INT num)
     {
     if(num < 3)
	  return(20);
     else
	  return(4*num+10);
     }

 
/*f max = MaxNumberOfBonds(num)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT MaxNumberOfBonds(INT num)
     {
     if(num < 3)
	  return(20);
     else
	  return(4*num+10);
     }

 
/*f atomid = AddHydrogenAtoms(atom,mol,nhyds)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT AddHydrogenAtoms(MolFileAtom *atom,
			    MolFileMolecule *mol,
			    INT nhyds)
     {
     MolFileAtom *newatom;
     INT atomid,i;
     
     newatom = mol->Atoms + mol->NAtoms;
     atomid = mol->NAtoms;
     LOOPi(nhyds)
	  {
	  CreateMolFileAtom(newatom,mol->NAtoms,atom->Name,
			    atom->X,atom->Y,atom->Z,
			    1,0.0,0,
			    NUMBER_ATOM_HYDROGEN_PARAMETERS,
			    ATOM_HYDROGEN_PARAMETERS);
	  newatom++;
	  mol->NAtoms += 1;
	  }
     return(atomid);
     }

 
/*f AddBondsOfHydrogens(mol,atomid,nhydrogens,hydrogenid)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AddBondsOfHydrogens(MolFileMolecule *mol,
				INT atomid,
				INT nhydrogens,
				INT hydrogenid)
     {
     MolFileBond *bond;
     INT i;
     
     bond = mol->Bonds + mol->NBonds;
     LOOPi(nhydrogens)
	  {
	  CreateMolFileBond(bond,mol->NBonds,mol->Name,
			    atomid,hydrogenid,
			    SINGLE,
			    NUMBER_BOND_HYDROGEN_PARAMETERS,
			    BOND_HYDROGEN_PARAMETERS);
	  bond++;
	  mol->NBonds += 1;
	  hydrogenid++;
	  }
     }

/*S ValenceStructure
**   Routines Determining Valence Structure
**          Number of Hydrogens not seen
**          Number of Lone Pairs
**          Group in Periodic Table
*/

 
/*f out = AtomIsAMetaAtom(atomid,mol)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT AtomIsAMetaAtom(INT atomid,
			   MolFileMolecule *mol)
     {
     MolFileAtom *atom;
     INT out;
     
     atom = mol->Atoms + atomid;
     if(atom->AtomicNumber >= META_ATOM_OFFSET)
	  out = 1;
     else
	  out = 0;
     return(out);
     }
 
/*F num = NumberOfHydrogensToAdd(atomid,mol)
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
extern INT NumberOfHydrogensToAdd(INT atomid, MolFileMolecule *mol)
     {
     INT *numbonds,group,numlonepairs,numhydrogens;
     
     if(AtomIsAMetaAtom(atomid,mol) == 1)
	  {
	  numhydrogens = 0;
	  }
     else
	  {
	  numbonds = CountBondsToAtom(atomid,mol);
	  group = AtomGroupFromMolFile(atomid,mol);
	  numlonepairs = CountLonePairsOfAtom(group,*numbonds);
	  
	  numhydrogens = SingleBondsNotSpecified(group,
						 numlonepairs,
						 *numbonds);
	  Free(numbonds);
	  }
     
     return(numhydrogens);
     }

 
/*F count = SingleBondsNotSpecified(group,lonepairs,numbonds)
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
extern INT SingleBondsNotSpecified(INT group, INT lonepairs, INT numbonds)
     {
     INT count;
     
     count = group - 2*lonepairs - numbonds;
     if(count < 0)
	  count += 10;
     return(count);
     }

 
/*F count = CountLonePairsOfAtom(group,numbonds)
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
extern INT CountLonePairsOfAtom(INT group, INT numbonds)
     {
     INT remaining,lonepair;
     
     lonepair = 0;
     remaining = group - numbonds;
     if(remaining < 0)
	  remaining += 10;
     switch(remaining)
	  {
     case 0:
     case 1:
	  lonepair = 0;
	  break;
     case 2:
     case 3:
	  if(group > 4)
	       lonepair = 1;
	  else 
	       lonepair = 0;
	  break;
     case 4:
     case 5:
	  if(group > 4)
	       lonepair = 2;
	  else 
	       lonepair = 0;
	  break;
     case 6:
     case 7:
	  if(group > 4)
	       lonepair = 3;
	  else 
	       lonepair = 0;
	  break;
	  }
     return(lonepair);
     }
     
 
/*F group = AtomGroupFromMolFile(atomid,mol)
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
extern INT AtomGroupFromMolFile(INT atomid, MolFileMolecule *mol)
     {
     INT nele,group,atmnum;
     MolFileAtom *atom;
     
     atom = mol->Atoms + atomid;
     atmnum = AdjustAtomicNumber(atom->AtomicNumber);
     nele = atmnum + floor(atom->Charge);
     group = AtomGroupFromElectrons(nele);
     return(group);
     }

 
/*F group = AtomGroupFromElectrons(electrons)
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
extern INT AtomGroupFromElectrons(INT electrons)
     {
     INT group,nremaining;

     if(electrons <= 2)
          {
	  if(electrons == 1)
	       group = 1;
	  else
	       group = 0;
          }
     else if(electrons <= 10)
          {
	  group = electrons - 2;
          }
      else if(electrons <= 18)
          {
	  group = electrons - 10;
          }
     else
          {
	  if(electrons <= 36)
	       nremaining = electrons - 18;
	  else if(electrons <= 54)
	       nremaining = electrons - 36;
	  else
	       nremaining = electrons - 54;
	  
          if(nremaining <= 8)
               {
	       group = nremaining;
               }
          else if(nremaining <= 10)
               {
	       group = 8;
               }
          else 
               {
	       group = nremaining - 10;
               }
          }
     if(group == 9)
	  group = 0;
     return(group);
     }

 
/*F countstart = CountBondsToAtom(atomid,mol)
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
extern INT *CountBondsToAtom(INT atomid, MolFileMolecule *mol)
     {
     INT *count,*countstart,i;
     MolFileBond *bonds;
     MolFileAtom *atm;
     
     
     count = countstart = AllocArrayINT(HIGHEST_MULTIPLE_BOND + 2);
     LOOPi(HIGHEST_MULTIPLE_BOND + 1)
	  *count++ = 0;
     
     bonds = mol->Bonds;
     LOOPi(mol->NBonds)
	  {
	  if(bonds->I == atomid ||
	     bonds->J == atomid )
	       *(countstart + bonds->Order) += 1;
	  bonds++;
	  }
     count = countstart + 1;
     LOOPi(HIGHEST_MULTIPLE_BOND)
	  {
	  *countstart += (*count)*(i+1);
	  count++;
	  }
     atm = mol->Atoms + atomid;
     *countstart += atm->Radical;
     
     return(countstart);
     }

 
/*f bonds = TransferBonds(old,new)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/	       
static INT TransferBonds(MolFileMolecule *old,
			 MolFileMolecule *new)
     {
     MolFileBond *oldbond,*newbond;
     INT i;
     
     oldbond = old->Bonds;
     newbond = new->Bonds;
     LOOPi(old->NBonds)
	  CopyFullMolFileBond(newbond++,oldbond++);
     
     return(old->NBonds);
     }

 
/*f atoms = TransferAtoms(old,new)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT TransferAtoms(MolFileMolecule *old,
			 MolFileMolecule *new)
     {
     MolFileAtom *oldatom,*newatom;
     INT i;
     
     oldatom = old->Atoms;
     newatom = new->Atoms;
     LOOPi(old->NAtoms)
	  CopyFullMolFileAtom(newatom++,oldatom++);
     
     return(old->NAtoms);
     }

extern INT AdjustAtomicNumber(INT an)
     {
     if(an > META_ATOM_OFFSET)
	  an = (an - META_ATOM_OFFSET) / MAX_NUMBER_OF_META_ATOMS;
     return(an);
     }
