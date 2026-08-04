#ifndef SELLO_BONDMAT_H
#define SELLO_BONDMAT_H

#define BndOrdMatDim(mat) mat->Size

/*****************************************************************************/
/* LogicalBondMats

     This is the structure for the two logical matricies for single and
     multiple bonds.                   

     LogicalBondMats

         Single   - The Bond matrix for single bonds
         Multiple - The Bond matrix for multiple bonds

*/

#define LogicalBondMatrix  LogicalSquareMatrix
#define AllocateLogBndMat  AllocateLogSqrMat
#define AdrLogBndMat       AdrLogSqrMat
#define SetLogBndMat       SetLogSqrMat
#define PrtLogBndMat       PrtLogSqrMat
#define SeqStartLogBndMat  SeqStartLogSqrMat
#define SeqNextLogBndMat   SeqNextLogSqrMat
#define FullCopyLogBndMat  FullCopyLogSqrMat

typedef struct LogBndset {
   LogicalBondMatrix *Single;
   LogicalBondMatrix *Multiple;
} LogicalBondSet;

#define LogBndSetSize sizeof(LogicalBondSet)
#define LogBndSetDimension(set) set->Single->Size

extern LogicalBondSet *BndOrdMat2LogBndSet( BondOrderMatrix *bndord);
extern void PrtLogBndSet( LogicalBondSet *matrix );
extern LogicalBondSet *FullCopyLogBndSet( LogicalBondSet *matrix);
extern LOG SymCmpLogBndSet( LogicalBondSet *logbndset1,
                            LogicalBondSet *logbndset2 );
extern LogicalBondSet *AllocateLogBndSet( INT NAtoms );
extern LogicalBondSet *FullCopyLogBndSet(LogicalBondSet *old);
extern void ResonanceMultFSingT(LogicalBondSet *logbndset, INT i,INT j);
extern void ResonanceMultTSingF(LogicalBondSet *logbndset, INT i,INT j);
extern void ResonateTriple(LogicalBondSet *logbndset, INT i, INT j, INT k);

/*********************************************************************************/
/*  ConjAtomInfo
     This is the atom information needed to derive some of the bonding informaiton
     in the iterations.

          Hetero  - This is a heteroatom that can contribute to resonance
                        0 - Can't contribute
                        1 - Can contribute
          Charge  - The charge on the atom
          AtomicN - The atomic number
          Double  - This is an atom with a double bond
                        0 - Double bond not present
                       >0 - Atom with which the double bond is connected
*/

typedef struct CnjAtmInf {
     LOG Hetero;
     INT Charge;
     INT AtomicN;
     INT Double;
} ConjAtomInfo;                                  

typedef struct CnjAtmInfVec {
     INT Size;
     ConjAtomInfo *Vector;
     } ConjAtomInfoVec;

#define CnjAtmInfSize sizeof(ConjAtomInfo)
#define CnjAtmInfVecSize sizeof(ConjAtomInfoVec)

extern ConjAtomInfo    *AdrCnjAtmInfVec(ConjAtomInfoVec *begin, INT i);
extern ConjAtomInfoVec *AllocateCnjAtmInfVec(INT size);
extern void             PrtCnjAtmInfVec(ConjAtomInfoVec *element);
extern void CorrectLogBndMat( LogicalBondMatrix *logmat, 
                              ConjAtomInfoVec *infovec);
extern void CorrectLogBndMat( LogicalBondMatrix *logmat, 
                              ConjAtomInfoVec *infovec);
extern void CorrectBndOrdMat( BondOrderMatrix *mat, ConjAtomInfoVec *infovec);

/*******************************************************************************/
/* Couplng 
  After a multiplication of logical matricies, this vector is created to 
  keeping track of the atoms which are resonantly coupled.

  In the structure, I and J are the two coupled atoms.
*/

typedef struct Coup {
      INT I;
      INT J;
      LOG Flag;
      } Coupling;

typedef struct CoupVec {
     INT Size;
     Coupling *Coups;
     } CouplingVector;
     
#define CoupVecSize sizeof(Coupling)
#define CoupSize    sizeof(CouplingVector)

extern CouplingVector *AllocateCoupVec(INT size);
extern Coupling *AdrCoup( CouplingVector *info, INT i);
extern void PrtCouplingVector(CouplingVector *coupvec);
extern void SetNextCoup( CouplingVector *coupvec, INT i, INT j );


/*******************************************************************************/
/* ResonantSets
     These are the set of resonant structures in the molecule.

      NSets       - The number of sets
      Sets        - An array of pointers to a single resonant set

   ResonantSet
      This is the information representing a single resonant structure
                         
      Size         - This is the number of Resonant Set
      Atoms        - This is the vector of atoms in the resonant set
      LogicalBonds - This is the Logical Bond Set representing the resonance
                     structure
      Coupling     - This is the vector of pointers to the Coupling structures
                     representing the resonance.
*/

typedef struct ResSet {
     INT             NAtoms;
     LogicalBondSet  *Resonances;
     Coupling        **CouplingPairs;
     INT             *Atoms;
     } ResonantSet;

typedef struct ResSets {
     INT   NSets;
     ResonantSet **Sets;
     } ResonantSets;

#define ResSetSize sizeof(ResonantSet)
#define ResSetsSize sizeof(ResonantSets)

extern void PrtResSet(ResonantSet *set);
extern ResonantSets *AllocateResSets();
extern ResonantSet *MakeResSet(INT NumCoups,
                       LogicalBondSet *resonances,
                       Coupling       **couplingpairs);
extern ResonantSet *AllocateResSet(INT NAtoms, INT NumCoups);
extern void PrtResSets(ResonantSets *sets);
extern LOG NotDuplicateInSets(ResonantSets *sets, ResonantSet *newset);
extern LOG EqualResonantSet(ResonantSet *set1, ResonantSet *set2);
/********************************************************************************/
/* ConjugationSet
     This is the set of matricies which are used in the iterations to find
     the conjugations.

          NAtoms         - This is the dimension of all the matricies
          Iteration      - The conjugation step (a negative number)
          LogBondSet     - This is the Logical Bond Set for a given iteration
          MultSingProd   - This is the (modified) LogicalBondMatrix from the 
                           logical product of Multiple and Single in LogBondSet
                           (unsymmetrical, i.e. symmetrical elements eliminated).
          Resonance      - The current resonance matrix (formed initially by
                           the Multiple matrix.
          Conjugation    - This the current conjugation matrix, formed by the
                           product of the MultSingProd and Multiple
          Coupling       - This is the information on how the atoms are coupled
          ConjAtomInfo   - This is the vector of atom information needed for the
                           iterations (vector of size NAtoms).
*/

typedef struct ConjBndSet {
     INT NAtoms;                                                   
     INT Iteration;
     LogicalBondSet    *LogBondSet;                 
     BondOrderMatrix   *BondOrder;
     LogicalBondMatrix *MultSingProd;
     LogicalBondMatrix *Resonance;
     LogicalBondMatrix *Conjugation;
     CouplingVector    *Coupling;
     ConjAtomInfoVec   *ConjAtomInfo;
     ResonantSets      *ResonanceSets;
     } ConjugationSet;
extern void FreeConjugationSet(ConjugationSet *conjset);

#define ConjBndSetSize sizeof(ConjugationSet)

extern ConjugationSet *AllocateConjBndSet(INT size);
extern void PrtConjBndSet( ConjugationSet *conjset);

extern LOG ConjugationTest( LogicalBondMatrix *mat );
extern void MultLogBndMat(LogicalBondMatrix *mat1,
                   LogicalBondMatrix *mat2,
			  LogicalBondMatrix *result);
extern void UnSymLogBndMat( LogicalBondMatrix *mat );

/******** external definitions   */

extern void PrtBndOrdMat( BondOrderMatrix *mat );
extern INT *AdrBndOrdMat(BondOrderMatrix *matrix, INT i, INT j);
extern void ZeroBndOrdMat(BondOrderMatrix *bnd);

#endif
