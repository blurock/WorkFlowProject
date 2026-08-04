/********************************************************************************/
/* Bond Routines
*/
                 
#include "basic.h"      
#include "comlib.h"
#include "graph.h"
#include "mat.h"

#include "mol0.h"
#include "bond.h"

/********************************************************************************/
/* Bond Order Matrix Routines
*/

/****** PrtBndOrdMat
*/

extern INT *AdrBndOrdMat(BondOrderMatrix *matrix, INT i, INT j)
     {
     if( i >= matrix->Size ||
         j >= matrix->Size )
          Error(DimError, "IntegerSquareMatrix Dimension Error");

     return( (INT *) matrix->Matrix + i*matrix->Size + j );
     }


extern void ZeroBndOrdMat(BondOrderMatrix *bnd)
     {
     INT *tmp,i;

     tmp = bnd->Matrix;
     
     LOOPi(bnd->TotalSize)
	  *tmp = 0;
     }

	  

extern void PrtBndOrdMat( BondOrderMatrix *matrix ) 
     {
     int i,j,*pntr;

     printf("-------Bond Order Matrix-----\n");
     pntr = matrix->Matrix;
     
     LOOPi(matrix->Size)
          {
          printf(" %5d :",i);
          LOOPj(matrix->Size)
               printf(" %10d ",*pntr++);
          printf("\n");
          }
     }

/* MFMol2BndOrdMat
    This routine converts the information in the MolFile of a molecule
    to the Bond Order Matrix
*/
extern BondOrderMatrix *MFMol2BndOrdMat( MolFileMolecule *molecule )
     {
     INT i;
     BondOrderMatrix *bndord;
     MolFileBond     *bndpntr;
     
     bndord = AllocateBondOrderMatrix;
     CreateBondOrderMatrix(bndord, molecule->ID, molecule->Name,
			   molecule->NAtoms, 
			   (molecule->NAtoms)*(molecule->NAtoms),
			   0
			   );
     
     ZeroBndOrdMat(bndord);

     bndpntr = molecule->Bonds;
     LOOPi(molecule->NBonds)
          {
          *( AdrBndOrdMat( bndord,
                           (bndpntr->I),
                           (bndpntr->J) )  )
                     =  bndpntr->Order;
          *( AdrBndOrdMat( bndord,
                           (bndpntr->J),
                           (bndpntr->I) )  )
                     =  bndpntr->Order;
          bndpntr++;
          }   
     return(bndord);
}

/*******************************************************************************/
/* Logical Bond Matrix
*/

void MultLogBndMat(LogicalBondMatrix *mat1,
                   LogicalBondMatrix *mat2,
                   LogicalBondMatrix *result)
{
INT dimension,i,j,k,prod;

     dimension = mat1->Size;
     LOOPi(dimension)
          LOOPj(dimension)
               {
               prod = 0;
               k = 0;
               while( prod == 0 &&
                      k < dimension )
                    {
                    prod = *( AdrLogBndMat(mat1,i,k) ) *
                           *( AdrLogBndMat(mat2,k,j) ) ;
                    k++;
                    };
               *( AdrLogBndMat(result,i,j) ) = prod;
               }
}

/****** UnSymLogBndMat
   This routine converts the logical bond matrix to the unsymetrical part
   (i.e. the symetrical parts are set to zero)
*/
void UnSymLogBndMat( LogicalBondMatrix *mat )
{
INT i,j,jmax;

      LOOPi(mat->Size)
           {
           jmax = i;
           
           LOOPj(jmax)
                {
                if( *( AdrLogBndMat(mat,i,j) )  ==
                    *( AdrLogBndMat(mat,j,i) )  )
                     {
                     *( AdrLogBndMat(mat,i,j) ) = 0;
                     *( AdrLogBndMat(mat,j,i) ) = 0;
                     };
                 }
            }
}                     
/****** Conjugation?
    This routine determines from the LogicalBondMatrix whether a conjugated
    system exists.  The test is to see whether a TRUE (i.e. 1) exists
    symmetrically in the matrix.  A TRUE has to be in element (i,j) and (j,i).
*/          
LOG ConjugationTest( LogicalBondMatrix *mat )
{
INT i,j,jmax;

      LOOPi(mat->Size)
           {
           jmax = i;
           
           LOOPj(jmax)
                if( ( *( AdrLogBndMat(mat,i,j) )  == 1 )
                    &&
                    ( *( AdrLogBndMat(mat,j,i) )  == 1 )
                    )   return(1);
            }
     return(0);
}                     


/********************************************************************************/
/* Logical Bond Set of Matricies
*/

LogicalBondSet *AllocateLogBndSet( INT NAtoms )
{
LogicalBondSet *bndset;

      bndset = (LogicalBondSet *) Malloc( LogBndSetSize );

      bndset->Single   = AllocateLogBndMat( NAtoms );
      bndset->Multiple = AllocateLogBndMat( NAtoms );

     return( bndset );
}

void PrtLogBndSet( LogicalBondSet *bndset )
{

     printf("---------------Logical Bond Set---------------\n");

     printf("-----Single-----\n");
     PrtLogBndMat(bndset->Single);

     printf("-----Multiple-----\n");
     PrtLogBndMat(bndset->Multiple);
}

LogicalBondSet *FullCopyLogBndSet(LogicalBondSet *old)
{
LogicalBondSet *new;

     new = AllocateLogBndSet(old->Multiple->Size);

     FullCopyLogBndMat(old->Multiple,new->Multiple);
     FullCopyLogBndMat(old->Single,new->Single);

     return(new);
}

void ResonanceMultTSingF(LogicalBondSet *logbndset, INT i,INT j)
{
LogicalBondMatrix *sing,*mult;     

     sing = logbndset->Single;
     mult = logbndset->Multiple;

     *( AdrLogBndMat(sing,i,j) ) = 0;
     *( AdrLogBndMat(sing,j,i) ) = 0;

     *( AdrLogBndMat(mult,i,j) ) = 1;
     *( AdrLogBndMat(mult,j,i) ) = 1;
}

void ResonanceMultFSingT(LogicalBondSet *logbndset, INT i,INT j)
{
LogicalBondMatrix *sing,*mult;     

     sing = logbndset->Single;
     mult = logbndset->Multiple;

     *( AdrLogBndMat(sing,i,j) ) = 1;
     *( AdrLogBndMat(sing,j,i) ) = 1;

     *( AdrLogBndMat(mult,i,j) ) = 0;
     *( AdrLogBndMat(mult,j,i) ) = 0;
}

/****** ResonateTriple
     This does a resonance on a triplet in the sing and mult logical bond matricies
          between i and j is a single bond
          between j and k is a double bond

     At the end the single and double bonds are switched
*/         
void ResonateTriple(LogicalBondSet *logbndset, INT i, INT j, INT k)
{
     ResonanceMultTSingF(logbndset,i,j);
     ResonanceMultFSingT(logbndset,i,j);
}     

LogicalBondSet *BndOrdMat2LogBndSet( BondOrderMatrix *bondorder )
     {
     LogicalBondSet *bndset;
     INT *ordadr,dimension,i,j;
     LOG *multadr,*singadr;
     
     dimension = BndOrdMatDim(bondorder);
     
     bndset = AllocateLogBndSet( dimension );
     
     multadr = bndset->Multiple->Matrix;
     singadr = bndset->Single->Matrix;
     ordadr  = bondorder->Matrix;

     LOOPi(dimension)
          LOOPj(dimension)
               {
               switch( *ordadr++ )
                    {
                    case 0:
                         *singadr++ = 0;
                         *multadr++ = 0;
                         break;
                    case 1:
                         *singadr++ = 1;
                         *multadr++ = 0;
                         break;
                    default:
                         *singadr++ = 0;
                         *multadr++ = 1;
                         break;
                     }
               }
      return(bndset);
}

/****** SymCmpLogBndSet
      This routine compares two Logical Bond Sets (i.e. whether
      the Single and Multiple are logically equal)

           Return  If equal     1
                   If not equal 0

     This routine is used to compare whether a resonance structure have
     already been encountered (a ring...aromatic).

     Note: This routine assumes that both are symmetric!!!
*/

LOG SymCmpLogBndSet( LogicalBondSet *logbndset1,
		    LogicalBondSet *logbndset2 )
     {
     INT i,j,dimension;
     LogicalBondMatrix *sing1,*mult1,*sing2,*mult2;
     
     PrtLogBndSet(logbndset1);
     PrtLogBndSet(logbndset2);
     
     dimension = LogBndSetDimension(logbndset1);

     sing1 = logbndset1->Single;
     mult1 = logbndset1->Multiple;
     sing2 = logbndset2->Single;
     mult2 = logbndset2->Multiple;

     LOOPi(dimension)
          LOOPj(i)
               if( (*( AdrLogBndMat(sing1,i,j) ) !=
                    *( AdrLogBndMat(sing2,i,j) )  )
                   ||
                   (*( AdrLogBndMat(mult1,i,j) ) !=
                    *( AdrLogBndMat(mult2,i,j) )  )
                 )  return(0);
     return(1);
}
/***************************************************************************/
/* ResonantSet
*/
/* AllocateResSet
   This routine allocates the resonant set
       NAtoms - The number of atoms in the entire molecule
       PathLength - The number of atoms in the resonant path
*/
ResonantSet *AllocateResSet(INT NAtoms, INT NumCoups)
{
ResonantSet *set;

     set = (ResonantSet *) Malloc(ResSetSize);

     set->Resonances    = AllocateLogBndSet(NAtoms);
     set->Atoms         = AllocArrayINT(2*NumCoups);

     return(set);
}
/* MakeResSet
*/
ResonantSet *MakeResSet(INT NumCoups,
                       LogicalBondSet *resonances,
                       Coupling       **couplingpairs)
{
ResonantSet *set;
Coupling **coup;
INT i,*atoms,start;


     set = AllocateResSet(resonances->Single->Size,
                          2*NumCoups);

     set->Resonances    = FullCopyLogBndSet( resonances );

     set->NAtoms = 0;
     coup = couplingpairs;
     atoms = set->Atoms; 
     start = (*coup)->I;
     LOOPi(NumCoups)
          {
          *atoms++ = (*coup)->I;
          *atoms++ = (*coup)->J;
          set->NAtoms += 2;
          coup++;     
          }
     if( start == *(atoms - 1) ) (set->NAtoms)--;

     return(set);
}

void PrtResSet(ResonantSet *set)
{                   
INT i,*atoms;

     printf("-----Resonant Set-----\n");

/*     PrtLogBndSet(set->Resonances);*/
                                   
     atoms = set->Atoms;
     printf("Atoms: ");
     LOOPi(set->NAtoms)
          printf(" %4d ",*atoms++);
     printf("\n");
}                                                                         

#define MAXIMUMRESONANTSIZE 20

ResonantSets *AllocateResSets()
{
ResonantSets *sets;
ResonantSet *set;

      sets = (ResonantSets *) Malloc(ResSetsSize);

      sets->NSets = 0;
      sets->Sets  = (ResonantSet **) Calloc(sizeof(set),MAXIMUMRESONANTSIZE);

      return(sets);

}

LOG NotDuplicateInSets(ResonantSets *sets, ResonantSet *new)
{
ResonantSet **compare;
INT i;

    compare = sets->Sets;
    LOOPi(sets->NSets)
         if( EqualResonantSet(new,*compare) ) return(0);
    return(1);
}

LOG EqualResonantSet(ResonantSet *set1, ResonantSet *set2)
     {
     INT i,natoms,count2,*atoms1,*atoms2,*shifted2;
     
     if( set1->NAtoms != set2->NAtoms ) return(0);
     
     natoms = set1->NAtoms;
     atoms1 = set1->Atoms;
     atoms2 = set2->Atoms;
     count2 = 0;
     LOOPi(natoms)
          if(*atoms1 == *atoms2++) count2 = i;
     
     shifted2 = set2->Atoms + count2;
     atoms1 = set1->Atoms;
     LOOPi(natoms)          
          {
          if(*atoms1++ != *shifted2++) return(0);
	  count2++;
          if( count2 >= natoms ) 
               {
	       count2 = 0;
               shifted2 = set2->Atoms;
               }
          }
     if( SymCmpLogBndSet(set1->Resonances,set2->Resonances) ) return(1);

     return(0);
}


void PrtResSets(ResonantSets *sets)
{
ResonantSet **set;
INT i;

     set = sets->Sets;                  
     if(sets->NSets)
          LOOPi(sets->NSets)
               {
               PrtResSet(*set);
               set++;
               }
     else
          printf("NONE\n");
}  
/****************************************************************************/
/* Conjugate Atom Information
*/

/****** AllocateCnjAtmInfVec
*/
ConjAtomInfoVec *AllocateCnjAtmInfVec(INT size)
{
ConjAtomInfoVec *element;

     element = (ConjAtomInfoVec *) Malloc(CnjAtmInfVecSize);

     element->Size   = size;
     element->Vector = (ConjAtomInfo *) Calloc(CnjAtmInfSize,size);

     return(element);
}

/****** AdrCnjAtmInfVec
   This is to find the ith element of the CnjAtmInf array
*/
ConjAtomInfo *AdrCnjAtmInfVec( ConjAtomInfoVec *info, INT i)
{
     if( i >= info->Size )
          Error(DimError,"ConjAtomInfo vector dimension error");
     return( (ConjAtomInfo *) info->Vector + i );
}
                  
void PrtCnjAtmInfVec(ConjAtomInfoVec *element)
{
ConjAtomInfo *vector;                     
INT i;

     vector = element->Vector;

     printf("Atom : Charge : AtomicNumber : Hetero : Double :\n");
     LOOPi(element->Size)
          {
          printf("%6d%9d%15d%9d%9d\n", i,
                                     vector->Charge,
                                     vector->AtomicN,
                                     vector->Hetero,
                                     vector->Double);
          vector++;
          }
}
          
/***** HeteroAtom?
   This determines whether the atom is capable of donating (e.g. lone
   pairs) electrons for resonance
*/
LOG HeteroAtomTest(ConjAtomInfo *atom)
{                       
INT an;

     an = atom->AtomicN;

     if ( (an > 6 && an < 10) ||
          (an > 14 && an < 18 ) ||
          (an > 32 && an < 36 ) ||
          (an > 50 && an < 54 )
          ) 
           return(1);

      if ( atom->Charge > 0 && 
           atom->Double == -1 )
           return(1);

      return(0);
}

/****** MFMol2CnjAtmInf
     This routine converts the information in the MolFile molecule
     to that needed for the atom information in the conjugation iterations

     Double and Hetero have to be computed
*/
extern ConjAtomInfoVec *MFMol2CnjAtmInf( MolFileMolecule *molecule )
{
ConjAtomInfoVec    *atominfo;
MolFileAtom        *atoms;
MolFileBond        *bonds;
ConjAtomInfo       *vector;
INT i;

     atominfo = AllocateCnjAtmInfVec(molecule->NAtoms);
                  
     vector = atominfo->Vector;
     LOOPi(molecule->NAtoms)
          {
          vector->Double = -1;
          vector++;
          }
                          
      bonds = molecule->Bonds;
      LOOPi(molecule->NBonds)
          {
          if( bonds->Order > 1 )
               {
               vector = AdrCnjAtmInfVec(atominfo,(bonds->I));
               vector->Double = (bonds->J);
               vector = AdrCnjAtmInfVec(atominfo,(bonds->J));
               vector->Double = (bonds->I);
               }
          bonds++;
           }

     atoms = molecule->Atoms;
     vector = atominfo->Vector;
     LOOPi(molecule->NAtoms)
          {
          vector->AtomicN      = atoms->AtomicNumber;
          vector->Charge       = atoms->Charge;
          vector->Hetero       = HeteroAtomTest( vector );
          if( vector->Hetero ) vector->Double = i;
          vector++;
          atoms++;
          }

     return(atominfo);
}

void CorrectLogBndMat( LogicalBondMatrix *logmat, ConjAtomInfoVec *infovec)
{
ConjAtomInfo *atom;
INT i;

     atom = infovec->Vector;

     LOOPi(infovec->Size)
           {
           if( atom->Hetero ) 
                *( AdrLogBndMat(logmat,i,i) ) = 1;
           atom++;
           }
}
     
void CorrectBndOrdMat( BondOrderMatrix *mat, ConjAtomInfoVec *infovec)
{
ConjAtomInfo *atom;
INT i;

     atom = infovec->Vector;

     LOOPi(infovec->Size)
           {
           if( atom->Hetero ) 
                *( AdrBndOrdMat(mat,i,i) ) = 1;
           atom++;
           }
}
     
/***************************************************************************/
/*Coupling Vector
*/
CouplingVector *AllocateCoupVec(INT size)
{
CouplingVector *vector;

     vector = (CouplingVector *)  Malloc(CoupVecSize);

     vector->Size = 0;
     vector->Coups = (Coupling *) Calloc(CoupSize,size);

     return(vector);
}

Coupling *AdrCoup( CouplingVector *info, INT i)
{
     if( i >= info->Size )
          Error(DimError,"Coupling vector dimension error");
     return( (Coupling *) info->Coups + i );
}              

void SetNextCoup( CouplingVector *coupvec, INT i, INT j )
{                                         
Coupling *coup;
      
     coup = coupvec->Coups + coupvec->Size;
     coup->J    = i;
     coup->I    = j;
     coup->Flag = 1;
     coupvec->Size += 1;
}

void PrtCouplingVector(CouplingVector *coupvec)
{                                           
Coupling *coup;
INT i;

     coup = coupvec->Coups;  
     printf("-----Coupling Vectors-----\n        I    J  \n");

     if( coupvec->Size > 0)
          LOOPi(coupvec->Size)  
               {
               printf("%5d:%5d%5d\n",i,coup->I,coup->J);
               coup++;
               }
     else
          printf("None\n");
}

/****************************************************************************/
/* ConjugationSet
    This is the main structure for the iterations for finding the bond orders
*/


/****** AllocateConjBndSet
*/
ConjugationSet *AllocateConjBndSet(INT size)
     {
     ConjugationSet *conjset;
     
     conjset = (ConjugationSet *) Malloc(ConjBndSetSize);

     conjset->NAtoms       = size;
/*     conjset->LogBondSet   = AllocateLogBndSet(size);*/
     conjset->MultSingProd = AllocateLogBndMat(size);
     conjset->Resonance    = AllocateLogBndMat(size);
     conjset->Conjugation  = AllocateLogBndMat(size);
     conjset->Coupling     = AllocateCoupVec(size);
/*     conjset->ConjAtomInfo = AllocateCnjAtmInfVec(size); */
     conjset->ResonanceSets = AllocateResSets();

/*
     conjset->BondOrder    = AllocateBondOrderMatrix;
     CreateBondOrderMatrix(conjset->BondOrder,0,"",
			   size,size*size,0);
*/
     return(conjset);
};

extern void FreeConjugationSet(ConjugationSet *conjset)
     {
     FreeIntSqrMat(conjset->LogBondSet->Single);
     FreeIntSqrMat(conjset->LogBondSet->Multiple);
     Free(conjset->LogBondSet);
     
     FreeIntSqrMat(conjset->MultSingProd);
     FreeIntSqrMat(conjset->Resonance);
     FreeIntSqrMat(conjset->Conjugation);
     Free(conjset->Coupling->Coups);
     Free(conjset->Coupling);
     Free(conjset->ConjAtomInfo->Vector);
     Free(conjset->ConjAtomInfo);
     Free(conjset->ResonanceSets->Sets);
     Free(conjset->ResonanceSets);
     FreeBondOrderMatrix(conjset->BondOrder);
     Free(conjset->BondOrder);
     }

void PrtConjBndSet( ConjugationSet *conjset)
{
     printf(" Iteration Conjugation Set\n");

     PrtCnjAtmInfVec(conjset->ConjAtomInfo);
     PrtBndOrdMat(conjset->BondOrder);
     PrtLogBndSet(conjset->LogBondSet);
     printf("----- Logical Product between Multiple and Single -----\n");
     PrtLogBndMat( conjset->MultSingProd );
     printf("----- Resonance Structure -----\n");
     PrtLogBndMat( conjset->Resonance );
     printf("----- Conjugation Structure -----\n");
     PrtLogBndMat( conjset->Conjugation );             
     PrtCouplingVector( conjset->Coupling ); 
     PrtResSets(conjset->ResonanceSets);

}


     



                  
      
