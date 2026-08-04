/**************************************************************************/
/* charge routines
*/

#include "basic.h"
#include <math.h>
#include "comlib.h"
#include "graph.h"

#include "mol0.h"
#include "mat.h"
#include "bond.h"
                              
static FLOAT CovalentRadius(INT AtomicNumber);
static void Shells(AtomElectronic *atom);
static void Screening(AtomElectronic *atom);
static void Electronegativity(AtomElectronic *atom);
static void CalculateElectroneg(AtomElectronic *atom);
static FLOAT BondOrderFloated(BondOrderMatrix *bndord,INT i,INT j);

extern void ComputeElectronic(MoleculeElectronic *electronic)
{
FLOAT delta;
INT i;

    InitialAtomElectronic(electronic);

    delta = 10000.0;                                 
    i = 0;

    while( i< 50 && delta > .000001)
         {
         i++;
         delta = ShiftElectrons(electronic);
         }
}
/***************************************************************************/
/* AtomElectronic
   These are the basic routines for the AtomElectronic structure
*/

/****** PrtAtomElectronic 
*/
/****** InitializeFromMolFile
    This routine initializes the electronic molecule from the molfile information.
    The required information is:

         AtomicNumber
         Charge
*/
extern MoleculeElectronic *InitializeFromMolFile(MolFileMolecule *molecule)
     {
     MoleculeElectronic *molele;   
     AtomElectronic     *atomele;           
     MolFileAtom        *atom;                                
     INT i;
     
     molele = AllocateMoleculeElectronic;
     CreateMoleculeElectronic(molele,molecule->ID, molecule->Name,
			      molecule->NAtoms,
			      0,0,0);

      atomele = molele->Atoms;
      atom    = molecule->Atoms;
      LOOPi(molele->NAtoms)
           {
	   atomele->ID = i;
	   atomele->NumberOfShells = 12;
	   atomele->Shells = AllocArrayFLOAT(12);
	   
           atomele->AtomicNumber = AdjustAtomicNumber(atom->AtomicNumber);
           atomele->Charge       = atom->Charge;
           atomele++;
	   atom++;
           }
      return(molele);
}

/****** CovalentRadius
   This returns the covalent radius for a given Atomic Number
*/
static FLOAT CovalentRadius(INT AtomicNumber)
     {
     static FLOAT radius[] = 
	  {0.32,                                                       0.93,
		1.23,0.90,                         0.82,0.77,0.75,0.73,0.72,0.71,
		1.54,1.36,                         1.18,1.11,1.06,1.02,0.96,0.98,
		2.03,1.74,1.44,1.32,1.22,1.18,1.17,
                1.17,1.16,1.15,1.17,1.25,1.26,1.22,1.20,1.16,1.10,1.12,
		2.16,1.91,1.62,1.45,1.34,1.30,1.27,
                1.25,1.25,1.28,1.34,1.48,1.44,1.41,1.40,1.36,1.28,1.31};
     
     return(radius[AtomicNumber - 1]);
}

/****** Shells 
*/
static void Shells(AtomElectronic *atom)
{                                
FLOAT electrons,nremaining;
FLOAT *shells;

     electrons = atom->NElectrons;
     shells = &(atom->Shells[0]);

     if(electrons <= 2)
          {
          shells[0] = electrons;
          atom->NOccupied = 1;
          }
     else if(electrons <= 10)
          {
          shells[0] = 2;
          shells[1] = electrons - 2;
          atom->NOccupied = 2;
          }
      else if(electrons <= 18)
          {
          shells[0] = 2;
          shells[1] = 8;
          shells[2] = electrons - 10;
          atom->NOccupied = 3;
          }
      else if(electrons <= 36)
          {
          shells[0] = 2;
          shells[1] = 8;
          shells[2] = 8;
          nremaining = electrons - 18;
          if(nremaining <= 2)
               {
               shells[3] = 0;
               shells[4] = nremaining;
               }
          else if(nremaining <= 5)
               {
               shells[3] = nremaining - 2;
               shells[4] = 2;
               }
          else if(nremaining <= 7)
               {
               shells[3] = 5;
               shells[4] = nremaining - 5;
               }
          else if(nremaining <= 10)
               {
               shells[3] = nremaining - 2;
               shells[4] = 2;
               }            
          else 
               {
               shells[3] = 10;
               shells[4] = nremaining - 10;
               }
          atom->NOccupied = 5;
          }
     else
          {
          shells[0] = 2;
          shells[1] = 8;
          shells[2] = 8;
          shells[3] = 10;
          shells[4] = 8;
          nremaining = electrons - 36;
          if(nremaining <= 2)
               {
               shells[5] = 0;
               shells[6] = nremaining;
               }
          else if(nremaining <= 4)
               {
               shells[5] = nremaining - 2;
               shells[6] = 2;
               }
          else if(nremaining <= 9)
               {
               shells[5] = nremaining - 1;
               shells[6] = 1;
               }
          else 
               {
               shells[5] = 10;
               shells[6] = nremaining - 10;
               }
          atom->NOccupied = 7;
          }
}
 
/****** Screening
*/
static void Screening(AtomElectronic *atom)
{
INT occupied,occupiedm1,occupiedm2,i,ip1;
FLOAT screening,outer,sigma;

      occupied = atom->NOccupied;
      occupiedm1 = occupied - 1;
      occupiedm2 = occupiedm1 - 1;

      screening = 0.0;

      if(atom->NOccupied == 1)
           outer = 0.30;
      else 
           {
           outer = 0.35;
           LOOPi(occupiedm1)
                {
                 ip1 = i + 1;
                 if( (ip1 == occupiedm1)      ||
                     ( (ip1 == occupiedm2) &&
                       (occupied >= 5) )
                   )
                        screening += atom->Shells[i]*0.85;
                   else 
                        screening += atom->Shells[i];
                }
           }
     atom->Screening = screening + outer*(atom->Shells[occupied-1] - 1);
     sigma           = atom->Screening + outer;
     atom->ZEff      = atom->AtomicNumber - sigma;
}
/******Electronegativity
*/
static void Electronegativity(AtomElectronic *atom)
{     
FLOAT potential,atomicnumber;
                             
     atomicnumber = (FLOAT) atom->AtomicNumber;
     if(atom->NElectrons < 1)
          potential = atomicnumber / atom->CovalentRadius;
     else
          potential = (atomicnumber - atom->Screening)/atom->CovalentRadius;

     if(atom->NOccupied == 1)
          atom->Electronegativity = .5 * potential + 0.64;
     else if(atom->NOccupied == 2)
          atom->Electronegativity = .478 * potential + 0.5;
     else if(atom->NOccupied == 3)
          atom->Electronegativity = .44 * potential + 0.28;
     else if(atom->NOccupied == 5)
          atom->Electronegativity = .42 * potential - 0.07;
     else
          atom->Electronegativity = .46 * potential - 0.12;
}

static void CalculateElectroneg(AtomElectronic *atom)
{
     Shells(atom);
     Screening(atom);
     Electronegativity(atom);
}                                                           

#define PRECISION 1000;
static FLOAT BondOrderFloated(BondOrderMatrix *bndord,INT i,INT j)
     { 
     FLOAT matans;
     matans = (FLOAT) *( AdrBndOrdMat(bndord,i,j) );
     
     return(  matans * .001 );
     }

extern void InitialAtomElectronic(MoleculeElectronic *molecule)
{                           
AtomElectronic *atomI;
INT i,j;
FLOAT valence,radius,bndord;

     atomI = molecule->Atoms;
     LOOPi(molecule->NAtoms)                       
         {
         atomI->NuclearCharge  = (FLOAT) atomI->AtomicNumber;
         atomI->NElectrons     = (FLOAT) atomI->AtomicNumber;
         atomI->CovalentRadius = CovalentRadius(atomI->AtomicNumber);

         CalculateElectroneg(atomI);

         atomI->Beta = 0.0;
         valence = 0;    
         LOOPj(molecule->NAtoms)
              {
              bndord = BondOrderFloated(molecule->BondOrder,i,j);

              if( bndord > 0.0 && i != j )
                   {
                   if(atomI->AtomicNumber < 10)
                        atomI->Beta += bndord*(bndord*(bndord*.030 -.230) + 1.20);
                   else
                        atomI->Beta += bndord*(bndord*(bndord*.015 -.135) + 1.12);
		   
                   valence += bndord;
                   }
              }

          if(valence > 0.0)
               atomI->Beta *= atomI->CovalentRadius * atomI->ZEff / valence;
          else
               atomI->Beta  = atomI->CovalentRadius * atomI->ZEff;

	 radius = atomI->CovalentRadius;
	 atomI->CovalentRadius = atomI->Beta / atomI->ZEff;

          if( atomI->CovalentRadius != radius )     
               CalculateElectroneg(atomI);
               
          if( atomI->Charge != 0.0)
               {
               atomI->NElectrons -= atomI->Charge;
               atomI->NuclearCharge = atomI->NElectrons;
               CalculateElectroneg(atomI);
               atomI->CovalentRadius = atomI->Beta / atomI->ZEff;
               CalculateElectroneg(atomI);
               } 
          atomI++;
     }
}

extern FLOAT ShiftElectrons(MoleculeElectronic *molecule)
{
INT i,j;
FLOAT bond,bondI,bondJ,electronegI,electronegJ,ionic,delta,coeficient,ele2;
AtomElectronic *atom,*atomI,*atomJ;

     atom = molecule->Atoms;
     LOOPi(molecule->NAtoms) 
          {
          atom->NElectrons = atom->NuclearCharge;
          atom++;
          }

     atomI = molecule->Atoms;
     LOOPi(molecule->NAtoms)              
          {
          bondI = BondOrderFloated(molecule->BondOrder,i,i);
          atomJ = molecule->Atoms;
          LOOPj(i)                          
               {
               bondJ = BondOrderFloated(molecule->BondOrder,j,j);
               bond  = BondOrderFloated(molecule->BondOrder,i,j);
               if( bond != 0.0 )
                    {
                    electronegI = atomI->Electronegativity;
                    electronegJ = atomJ->Electronegativity;
                    
                    if( electronegI != electronegJ )
                         {
                         if( bond > 0.0 )
                              coeficient = -bond/4.0;
                         else if( bondI + bondJ == 0 )
                              coeficient = 1.0/(bond*8.0);
                         else 
                              coeficient = 0.0;                                 
                         ele2 = electronegI-electronegJ;
                         ionic = 1 - exp(coeficient*ele2*ele2);
                         if( electronegI > electronegJ ) 
                              {
                              atomI->NElectrons += ionic;
                              atomJ->NElectrons -= ionic;
                              }
                         else
                              {
                              atomI->NElectrons -= ionic;
                              atomJ->NElectrons += ionic;
                              }
                         }
                     } 
               atomJ++;
               }
          atomI++;
          } 

     delta = 0.0;
     atomI = molecule->Atoms;
     LOOPi(molecule->NAtoms)
          {
          atomI->CovalentRadius = atomI->Beta / atomI->ZEff;
          electronegI = atomI->Electronegativity;
          CalculateElectroneg(atomI);
          delta += fabs( (double) electronegI - atomI->Electronegativity );
          atomI->Charge = 
                 ((FLOAT)atomI->AtomicNumber) - atomI->NElectrons;
          atomI++;
          }      
     delta /= (FLOAT) molecule->NAtoms;
     return(delta);
}







