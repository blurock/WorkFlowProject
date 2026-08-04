#include "basic.h"
#include <math.h>
#include "comlib.h"
#include "graph.h"
#include "mol0.h"

#include "molecules/prop.c"

static INT AtomLonePair(PropValue *prop,
			 KeyWords *key,
			 MoleculeInfo *mol,
			 INT atm);
static INT AtomBondingType(PropValue *prop,
			    KeyWords *key,
			    MoleculeInfo *mol,
			    INT atm);
static INT AtomResonanceProperties(PropValue *prop,
				    KeyWords *key,
				    MoleculeInfo *mol, INT atm);
static AtomElectronic *FindAtomInMoleculeElectronic(MoleculeElectronic *ele,
						    INT atm);
static INT AtomElectronicProperties(PropValue *prop,
				     KeyWords *key, 
				     MoleculeInfo *mol, INT atm);
static INT AtomValenceValue(PropValue *prop,
			     KeyWords *key,
			     MoleculeInfo *mol,
			     INT atm);

#define NUMBER_ATOM_PROPERTY_KEYWORDS     11

static KeyWords ATOM_PROPERTY_KEYWORDS[NUMBER_ATOM_PROPERTY_KEYWORDS] = {
     {"AtomicNumber",       ATOMIC_NUMBER,      AtomElectronicProperties,
           "Atomic Number (Integer)"},
     {"Electrons",          NUMBER_ELECTRONS,   AtomElectronicProperties,
           "Number of Electrons on Atom (Integer)"},
     {"Shells",             NUMBER_SHELLS,      AtomElectronicProperties,
           "Number of Shell of Atom (Integer)"},
     {"Charge",             CHARGE,             AtomElectronicProperties,
           "Calculated Charge (Sello)"},
     {"Electroneg",         ELECTRONEGATIVITY,  AtomElectronicProperties,
           "Calculated Electronegativity"},
     {"Radius",             COVALENT_RADIUS,    AtomElectronicProperties,
           "Covalent Radius of Atom"},
     {"Aromatic",            RESONANT,           AtomResonanceProperties,
           "In Aromatic System  (0= No, 1=Yes)"},
     {"Bonding",            BONDORDER,          AtomBondingType,
           "Highest Bond Order of Atom"},
     {"LonePair",           LONEPAIR,           AtomLonePair,
           "Presence of Lone Pair (0 = No)"},
     {"Valence",            VALENCE,            AtomValenceValue,
           "Standard Valence Value"},
     {"Polarizability",     POLARIZABILITY,     AtomElectronicProperties,
           "Semi-Empirical Polarizability Value"}
     };


extern PropValue *FindAtomProperty(MoleculeInfo *mol, 
				   INT atm, INT prop)
     {
     KeyWords *props,*propkey;
     INT count;
     INT (*function)();
     PropValue *propvalue;
     
     props = ATOM_PROPERTY_KEYWORDS;
     count = 0;
     propkey = 0;
     while(count < NUMBER_ATOM_PROPERTY_KEYWORDS &&
	   propkey == 0)
	  {
	  if(props->Type == prop)
	       propkey = props;
	  props++;
	  count++;
	  }
     
     if(propkey != 0)
           {
	   function = propkey->Function;
	   propvalue = AllocatePropValue;
	   (*function)(propvalue,propkey,mol,atm);
           }
      else
           {
           Error(0,"Illegal Main Function");
	   propvalue = 0;
           }
     return(propvalue);
     }

static INT AtomElectronicProperties(PropValue *propvalue, KeyWords *key, 
					   MoleculeInfo *mol, INT atm)
     {
     AtomElectronic *atmele;
     
     atmele = FindAtomInMoleculeElectronic(mol->Electronic,atm);
     
     CreatePropValue(propvalue,key->Type,key->KeyWord,
		     0,0.0,0,0);
     switch(key->Type)
	  {
     case ATOMIC_NUMBER:
	  propvalue->Integer = atmele->AtomicNumber;
	  break;
     case NUMBER_ELECTRONS:
	  propvalue->Integer = atmele->NOccupied;
	  break;
     case NUMBER_SHELLS:
	  propvalue->Integer = atmele->NumberOfShells;
	  break;
     case CHARGE:
	  propvalue->Float = atmele->Charge;
	  break;
     case ELECTRONEGATIVITY:
	  propvalue->Float = atmele->Electronegativity;
	  break;
     case POLARIZABILITY:
	  propvalue->Float = atmele->Polarizability;
	  break;
     case COVALENT_RADIUS:
	  propvalue->Float = atmele->CovalentRadius;
	  break;
	  }
     return(0);
     }

static AtomElectronic *FindAtomInMoleculeElectronic(MoleculeElectronic *ele,
						    INT atm)
     {
     if(atm >= ele->NAtoms)
	  {
	  Error(atm,"Non-Exsistent Atom in Molecule");
	  return(0);
	  }
     return(ele->Atoms + atm);
     }


static INT AtomResonanceProperties(PropValue *prop, 
			       KeyWords *key,
			       MoleculeInfo *mol, INT atm)
     {
     INT scnt,rcnt,resonant,*rsn;
     SetOfResonances *resons;
     Resonance *set;

     resons = mol->Electronic->Resonant;
     set = resons->Sets;
     scnt = 0;
     resonant = 0;
     rcnt = 0;
     while(resonant == 0 && rcnt < resons->NumberOfSets)
	  {
	  rsn = set->Atoms;
	  scnt = 0;
	  while(resonant == 0  && scnt < set->NumberOfAtoms)
	       {
	       if(*rsn == atm)
		    resonant = 1;
	       scnt++;
	       rsn++;
	       }
	  scnt++;
	  resons++;
	  rcnt++;
	  }

     CreatePropValue(prop,key->Type,key->KeyWord,
		     resonant,0.0,0,0);
     return(0);     
     }

static INT AtomBondingType(PropValue *prop,
			    KeyWords *key,
			    MoleculeInfo *mol,
			    INT atm)
     {
     BondOrderMatrix *bndmat;
     INT i,*bnd,topbnd;
     FLOAT ftop;
     
     topbnd = 0;
     bndmat = mol->Electronic->BondOrder;
     bnd = bndmat->Matrix + atm*(bndmat->Size);
     LOOPi(bndmat->Size)
	  {
	  if(*bnd > topbnd) topbnd = *bnd;
	  bnd++;
	  }
     ftop = topbnd;
     ftop = ftop / 1000.0;
     topbnd = ceil(ftop);
     CreatePropValue(prop,key->Type,key->KeyWord,
		     topbnd,0.0,0,0);
     return(0);
     }

static INT AtomLonePair(PropValue *prop,
			 KeyWords *key,
			 MoleculeInfo *mol,
			 INT atm)
     {
     INT lone,group,*numbonds;
     
     group = AtomGroupFromMolFile(atm,mol->Molfile);
     numbonds = CountBondsToAtom(atm,mol->Molfile);
     lone = CountLonePairsOfAtom(group,*numbonds);

     CreatePropValue(prop,key->Type,key->KeyWord,
		     lone,0.0,0,0);
     Free(numbonds);
     return(0);
     }
     

/*************************************************************************/
static INT AtomValenceValue(PropValue *prop,
			KeyWords *key,
			MoleculeInfo *mol,
			INT atm)
     {
     MolFileMolecule *molfile;
     MolFileAtom *atominfo;
     INT *bondcounts,val,hydrogens,toadd;
     PropValue *lone,*res;
     
     molfile = mol->Molfile;
     
     atominfo = (molfile->Atoms + atm);
     
     hydrogens = 0;
     
     lone = FindAtomProperty(mol,atm,LONEPAIR);
     res =  FindAtomProperty(mol,atm,RESONANT);
     
     bondcounts = CountBondsToAtom(atm,molfile);
     toadd = NumberOfHydrogensToAdd(atm,molfile);
     
     val = DetermineAtomValenceValue(atominfo->AtomicNumber,
				     hydrogens,
				     StandardChargeSpec(atominfo),
				     atominfo->Radical,
				     lone->Integer,
				     res->Integer,
				     *(bondcounts + 1)+toadd,
				     *(bondcounts + 2),
				     *(bondcounts + 3));
     
     
     CreatePropValue(prop,key->Type,key->KeyWord,
		     val,0.0,0,0);
     Free(bondcounts);
     FreePropValue(lone);
     Free(lone);
     FreePropValue(res);
     Free(res);

     return(0);
     }     
		    
extern INT DetermineAtomValenceValue(INT atomicnumber,
				     INT hydro,
				     INT charge,
				     INT radical,
				     INT lonepairs,
				     INT resonance,
				     INT sbond,
				     INT dbond,
				     INT tbond)
     {
     INT valence,br;
     
     br = charge + 3;
     if(charge == 0 && radical == 1)
	  br = 9;
     
     valence = 
	  atomicnumber * VAL_ATOMIC_NUMBER + 
             hydro * VAL_HYDROGEN_COUNT +
	       br * VAL_CHARGE_SPEC + 
		    lonepairs * VAL_LONE_PAIR_COUNT +
			 resonance * VAL_AROMATIC_SPEC + 
			      sbond * VAL_SINGLE_BOND_COUNT + 
				   dbond * VAL_DOUBLE_BOND_COUNT + 
					tbond * VAL_TRIPLE_BOND_COUNT;
     

     return(valence);
     }
