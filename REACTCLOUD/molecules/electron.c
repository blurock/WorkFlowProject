/* Electronic
*/

#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mat.h"

#include "mol0.h"
#include "bond.h"

extern void FindAllResonantStructures(ConjugationSet *conjset);
extern void InitializeConjIteration(ConjugationSet *conjset);
extern BondOrderMatrix *ComputeResonantBondOrder(ConjugationSet *conjset);


static ConjugationSet *InitializeWithMolFile(MolFileMolecule *molecule);
static void SetCouplings(ConjugationSet *conjset);
static INT AromaticPath(ConjugationSet *conjset, Coupling **CoupPath);
static LogicalBondSet *PerformResonance(ConjugationSet *conjset, 
                                      Coupling **CoupPath, 
                                      INT PathCount);
static void SaveNextResonance(INT NumCoups,
                       LogicalBondSet *resonances,
                       Coupling       **couplingpairs,
                       LogicalBondSet *original,
                       ResonantSets   *sets);
static void ConjSetFromLogBndSet(ConjugationSet *conjset);
static void ResonantFromLogBndSet(ConjugationSet *conjset);
static LogicalBondSet *NextStructure(ConjugationSet *conjset,INT number);
static void AdjustForBackBonding(ConjugationSet *conjset,
                          BondOrderMatrix *new, 
                          BondOrderMatrix *orig);
static INT CountSingleBonds(INT atom, BondOrderMatrix *bndord);
static INT CountConjBonds(INT atom, BondOrderMatrix *bndord);
static SetOfResonances *ListResonances(INT id, CHAR *name,
				       ConjugationSet *conjset);
static INT Double(ConjugationSet *conjset, INT i);
          
#define PRECISION 1000
extern MoleculeElectronic *ElectronicFromMolFile(MolFileMolecule *molecule)
     {
     ConjugationSet *conjset; 
     MoleculeElectronic *electronic;
     
     conjset = InitializeWithMolFile(molecule);
     electronic = InitializeFromMolFile(molecule);
     
     InitializeConjIteration(conjset);
     
     FindAllResonantStructures(conjset);

     electronic->Resonant = ListResonances(molecule->ID,molecule->Name,
					   conjset);     
     electronic->BondOrder = ComputeResonantBondOrder(conjset);
     
     ComputeElectronic(electronic);
     FreeConjugationSet(conjset);
     Free(conjset);
     
     return(electronic);
     }
extern float *UnLoadMolFileMolecule(MoleculeElectronic *mlfmol)
{
  AtomElectronic *molatom;
  int natm,i;
  float *atmvec,*atmvecstart;

  natm = mlfmol->NAtoms;
  atmvec = atmvecstart = AllocArrayFLOAT( natm * 6 );

  molatom = mlfmol->Atoms;
  for(i=0;i<natm;i++)
    {
      *(atmvec+0) = molatom->NElectrons;
      *(atmvec+1) = molatom->Charge;
      *(atmvec+2) = molatom->Electronegativity;
      *(atmvec+3) = molatom->Screening;
      *(atmvec+4) = molatom->ZEff;
      *(atmvec+5) = molatom->ResidualCharge;

      atmvec += 6;
      molatom++;
    }
  return atmvecstart;
}

extern MolFileMolecule *LoadMolFileMolecule(int id,char *name,
			   int natm,int nbnd,
			   double *atmvec,int *bndvec)
{
  MolFileMolecule *mlfmol;
  MolFileAtom *molatom;
  MolFileBond *molbond;
  int i,bi,bj,bord,rad,atmnum,count;
  float x,y,z,charge;

  
  mlfmol = AllocateMolFileMolecule;
  CreateMolFileMolecule(mlfmol,id,name,
		        natm,nbnd,0,0,0);
  
  count = 0;
  mlfmol->Atoms = molatom = AllocArrayMolFileAtom(natm);
  for(i=0;i<natm;i++)
    {
      x = *(atmvec+0);
      y = *(atmvec+1);
      z = *(atmvec+2);
      atmnum = (int) *(atmvec+3);
      charge = *(atmvec+4);
      rad = *(atmvec+5);
      printf("Atom: %f %f %f   %d %f %d\n", x,y,z,atmnum,charge,rad);
      CreateMolFileAtom(molatom,count,0,
			x,y,z,
			atmnum,charge,rad,0,0);
      molatom->Parameters = AllocArrayINT(10);
      molatom->NumberOfParameters = 9;
      atmvec += 6;
      count++;
      molatom++;
    }
  count = 0;
  mlfmol->Bonds = molbond = AllocArrayMolFileBond(nbnd);
  for(i=0;i<nbnd;i++)
    {
      bi   = *(bndvec + 0);
      bj   = *(bndvec + 1);
      bord = *(bndvec + 2);

      CreateMolFileBond(molbond,count,0,
			bi,bj,bord,
			0,0);
      printf("Bond: (%10d %10d): %10d\n",bi,bj,bord);

      molbond->Parameters = AllocArrayINT(10);
      molbond->NumberOfParameters = 9;
			
      bndvec += 3;
      count++;
      molbond++;	
    }
  return mlfmol;
}
			   
static SetOfResonances *ListResonances(INT id, CHAR *name,
				       ConjugationSet *conjset)
     {
     ResonantSets *sets;
     SetOfResonances *rsets;
     ResonantSet **setp,*set;
     Resonance *rset;
     INT i;
     
     sets = conjset->ResonanceSets;
     rsets = AllocateSetOfResonances;
     CreateSetOfResonances(rsets,id,name,
			   sets->NSets,0);
     
     setp = sets->Sets;
     rset = rsets->Sets;
     LOOPi(sets->NSets)
	  {
	  set = *setp;
	  CreateResonance(rset,i,name,
			  set->NAtoms,
			  set->Atoms);
	  setp++;
	  rset++;
	  }
     return(rsets);
     }


extern BondOrderMatrix *ComputeResonantBondOrder(ConjugationSet *conjset)
     {
     BondOrderMatrix *bndordmat,*originalbndord;
     LogicalBondSet *logbndset;
     LogicalBondMatrix *multlogbnd,*singlogbnd;
     INT i,j,*mult,*sing,*bond,StructureCount,factor,*newbondij,*newbondji;

     originalbndord = conjset->BondOrder;

     bndordmat = AllocateBondOrderMatrix;
     CreateBondOrderMatrix(bndordmat,0,"",
			   conjset->NAtoms,
			   (conjset->NAtoms)*(conjset->NAtoms),
			   0);
     
     if(conjset->ResonanceSets->NSets == 0 )
	  {
	  bond = conjset->BondOrder->Matrix;

	  newbondij = bndordmat->Matrix;
	  LOOPi(conjset->NAtoms)
	       LOOPj(conjset->NAtoms)
		    *newbondij++ = *bond++ * 1000;
	  }
     else
	  {
	  factor = PRECISION / conjset->ResonanceSets->NSets;
	  originalbndord = conjset->BondOrder;

	  StructureCount = 0;
	  while( StructureCount < conjset->ResonanceSets->NSets )
	       {
	       logbndset = NextStructure(conjset,StructureCount);
	       StructureCount++;
	       multlogbnd = logbndset->Multiple;
	       singlogbnd = logbndset->Single;
	       
	       
	       LOOPi(conjset->NAtoms)
		    {
		    *( AdrBndOrdMat(bndordmat,i,i) ) = 0;
		    LOOPj(i)       
			 {
			 newbondij = AdrBndOrdMat(bndordmat,i,j);
			 newbondji = AdrBndOrdMat(bndordmat,j,i);
			 mult    = AdrLogBndMat(multlogbnd,i,j);
			 sing    = AdrLogBndMat(singlogbnd,i,j);
			 bond    = AdrBndOrdMat(originalbndord,i,j);
			 if( *bond < 0 || *mult > 2 )
			      {
			      *newbondij += *bond * factor;
			      *newbondji += *bond * factor;
			      }
			 else if( *mult )
			      {
			      *newbondij += 2*factor;
			      *newbondji += 2*factor;
			      }
			 else if( *sing )
			      {
			      *newbondij += factor;
			      *newbondji += factor;
			      }
			 else           
			      {
			      *newbondij += 0;
			      *newbondji += 0;
			      }
                         }   
		    }
	       }
	  }
     
     AdjustForBackBonding(conjset,bndordmat,originalbndord);
     
     return(bndordmat);
     
     }                                                   

static void AdjustForBackBonding(ConjugationSet *conjset,
                          BondOrderMatrix *new, 
                          BondOrderMatrix *orig)
{
INT i,*bond,SingleBonds,ConjBonds;                                           

     LOOPi(conjset->NAtoms)
          {
          bond = AdrBndOrdMat(orig,i,i); 
          if(*bond)
               {
               SingleBonds = CountSingleBonds(i,orig);
               ConjBonds   = CountConjBonds(i,orig);
               if( SingleBonds > 0 &&
                   ConjBonds > 0 )
                    {
                    *( AdrBndOrdMat(new,i,i) ) = ConjBonds * PRECISION;
                    }
                }
           }
}

static INT CountSingleBonds(INT atom, BondOrderMatrix *bndord)
{
INT i,count;

     count = 0;
     LOOPi(bndord->Size)
          if( i != atom &&
              *( AdrBndOrdMat(bndord,atom,i) ) == 1 )
                count++;
     return(count);
}

static INT CountConjBonds(INT atom, BondOrderMatrix *bndord)
{
INT i,count,*bond;

     count = 0;
     LOOPi(bndord->Size)
          {
          bond = AdrBndOrdMat(bndord,atom,i);
          if( i != atom && *bond < 0 )
                count -= *bond;
          }
     return(count);
}
extern void FindAllResonantStructures(ConjugationSet *conjset)
{
INT StructuresDone;

    StructuresDone = -1;
    while( StructuresDone < conjset->ResonanceSets->NSets )
         {
         if(StructuresDone != -1)
              conjset->LogBondSet = NextStructure(conjset,StructuresDone);
         else
              StructuresDone = 0;

         StructuresDone++;

         ConjSetFromLogBndSet(conjset);

         ResonantFromLogBndSet(conjset);                           

         }
}

static LogicalBondSet *NextStructure(ConjugationSet *conjset,INT number)
{

      return(( *(conjset->ResonanceSets->Sets + number) )->Resonances);
};

                                              
static void ResonantFromLogBndSet(ConjugationSet *conjset)
{
Coupling *coups,**coupsvec; 
LogicalBondSet *logbnd;                           
INT i,PathCount,NumberRings;
LOG MoreResonantForms;


    MoreResonantForms = ConjugationTest(conjset->Conjugation);

    while(MoreResonantForms)
         {

         conjset->Iteration -= 1;

         SetCouplings(conjset);

         NumberRings = conjset->Coupling->Size / (1  - conjset->Iteration);

         LOOPi(NumberRings)
              {
              coupsvec = (Coupling **) Calloc(sizeof(coups),20);
              PathCount = AromaticPath(conjset,coupsvec);

	      if(PathCount >= 0)
		   {
		   logbnd = PerformResonance(conjset,coupsvec,PathCount);
		   SaveNextResonance(PathCount,logbnd,coupsvec,
				     conjset->LogBondSet,
				     conjset->ResonanceSets);
		   }
	      }
         printf("Found Resonances:\n");
	 PrtResSets(conjset->ResonanceSets);
         MultLogBndMat( conjset->Resonance,
                        conjset->MultSingProd ,
                        conjset->Conjugation );

         MoreResonantForms = ConjugationTest(conjset->Conjugation);

         }
}
/***** InitializeWithMolFile
    This routine initializes the 
           1.  Bond Order Matrix and the
           2.  Conjugation Atom Information Structure
    from the information read in from the MolFile.

    The return is the MolFileMolecule with the molecule information.
*/
static ConjugationSet *InitializeWithMolFile(MolFileMolecule *molecule)
{
ConjugationSet *conjset;

    conjset = AllocateConjBndSet(molecule->NAtoms);    

    conjset->BondOrder  = MFMol2BndOrdMat( molecule );
    conjset->ConjAtomInfo = MFMol2CnjAtmInf( molecule );

    return(conjset);
};

/****** InitializeConjIteration
     This routine Initializes the iteration procedure.

     From the
          1. Bond Order Matrix
          2. Conjugation Atom Information Structure

     The following matricies are derived:
          1.  Bond Order matrix corrected for heteroatoms
          2.  Multiple (in LogBondSet) corrected for heteroatoms
          3.  The product of the Single and Multiple matricies
          4.  The initial Resonance matrix (a copy of the 3.)
          5.  The first derived conjugation matrix
*/
extern void InitializeConjIteration(ConjugationSet *conjset)
     {
     conjset->Iteration = 0;
     
     conjset->LogBondSet = BndOrdMat2LogBndSet( conjset->BondOrder );
     CorrectBndOrdMat( conjset->BondOrder,
                      conjset->ConjAtomInfo );
     CorrectLogBndMat( conjset->LogBondSet->Multiple, 
                      conjset->ConjAtomInfo );
     
     ConjSetFromLogBndSet(conjset);

     }

static void ConjSetFromLogBndSet(ConjugationSet *conjset)
{
    MultLogBndMat( conjset->LogBondSet->Single, 
                   conjset->LogBondSet->Multiple,
                   conjset->MultSingProd);

    UnSymLogBndMat(conjset->MultSingProd);
    FullCopyLogSqrMat( conjset->LogBondSet->Multiple, conjset->Resonance  );

    MultLogBndMat( conjset->Resonance,
                   conjset->MultSingProd ,
                   conjset->Conjugation );

}                      

static void SetCouplings(ConjugationSet *conjset)
{
CouplingVector *coupvec;
Coupling       *coup;
LogicalBondMatrix *conjugation,*resonance,*single;
INT dimension,i,j,jmax;
INT *resij,*resji,*bndorderij,*bndorderji;

     coupvec     = conjset->Coupling;
     coup        = coupvec->Coups;
     conjugation = conjset->Conjugation;
     single      = conjset->LogBondSet->Single;
     resonance   = conjset->Resonance;

     coupvec->Size = 0;
     dimension = conjset->NAtoms;

     LOOPi(dimension)
          {
          if( *( AdrLogBndMat(conjugation,i,i) ) &&
              *( AdrLogBndMat(single,i,i)      ) )
              {
              SetNextCoup(coupvec,i,i);
              }
          jmax = i;
          LOOPj(jmax)
               {
               resij = AdrLogBndMat(resonance,i,j);
               resji = AdrLogBndMat(resonance,j,i);

               if( *AdrLogBndMat(conjugation,i,j) &&
                   *AdrLogBndMat(conjugation,j,i) )
                    {       
                    bndorderij = AdrBndOrdMat(conjset->BondOrder,i,j);
                    bndorderji = AdrBndOrdMat(conjset->BondOrder,j,i);
		    
                    if(  *bndorderij == 0 || *bndorderij <= conjset->Iteration )
                         {
                         *resij = *resji = 1;
                         *bndorderij = *bndorderji = conjset->Iteration;
                         }
                    else if( *( AdrLogBndMat(single,i,j) ) &&
                             ~( abs(conjset->Iteration) & 1 )             )
                         {
                         *resij = *resji = 0;
			 if(Double(conjset,j) == j)
			      SetNextCoup(coupvec,i,j);
			 else
			      SetNextCoup(coupvec,j,i); 
                         }
                    else if(  *( AdrLogBndMat(single,i,j) ) &&
                              ( abs(conjset->Iteration) & 1 )             )
                         *resij = *resji = 0;
                    else
                         *resij = *resji = 0;   
               
                    }
              else
                    *resij = *resji = 0;
              }
          }
}
    
/****** Double
     This gets the double bond information from the conjset structure
     for the ith atom
*/
static INT Double(ConjugationSet *conjset, INT i)
     {
     ConjAtomInfoVec *vec;
     ConjAtomInfo *inf;
     INT out;
     
     vec = conjset->ConjAtomInfo;
     if(i < vec->Size)
	  {
	  inf = vec->Vector + i;
	  out = inf->Double;
	  }
     else
	  {
	  Error(-1,"Illegal Atom in routine Double");
	  out = 0;
	  }
     return (out);
}

typedef struct BackNode {
     Coupling *coup;
     INT Level;
     } BackTrackNode;

/****** FindAdjacentResonance
     This routine searches the Coupling matricies to find one which has
     not been used yet (i.e. coups->Flags == 1 ) and that has an adjoining
     atom.  
           atom -  The atom at the other end of a double bond from the
                   the previous coupling set.
           coups - The complete set of couplings
           max   - The maximum set of couplings.

     Note: The connecting atom should be on the I side of the coupling
           matrix.  If this is not so, then the coupling pair is reversed.

     The RETURN is the found coupling matrix, otherwise 0
*/
INT FindAdjacentResonance(INT atom, INT BackCount,BackTrackNode *nodes, 
                          Coupling *coups, INT level, INT max)
{                                    
INT i;
     LOOPi(max)
          {
          if( ( coups->I == atom || coups->J == atom )
              && coups->Flag)
               {
               if( coups->J == atom )
                    {
                    coups->J = coups->I;
                    coups->I = atom;
                    }
               BackCount++;
               nodes->coup = coups;
               nodes->Level = level;
               nodes++;
               }
          coups++;
          }
     return(BackCount);
}
/****** ResonanceForms

This routine performs a depth-first search to find an aromatic ring
within the system.  The basis of the routine is as follows:
        1.  Start with atom I.
        2.  Using the Coupling pair: I is paired with J.
            The Coupling pair is over a single bond.
        3.  From J, the connecting double bond is found using
            Double from the ConjAtomInfo structure.
        4.  The other end of the double bond, K, is used
            as the starting point of the next iteration.

This process is continued for the size of the ring.  
Backtracking occurs if:
     1. The last atom, K, is not the same as the starting atom of the process.
     2. In the search for the next Coupling pair, none is found.

The nodes of the backtracking are kept track of by means of the structure
BackNodes.

The path of the Couplings are done by CoupPath.

*/
static INT AromaticPath(ConjugationSet *conjset, Coupling **CoupPath)
{
LogicalBondMatrix *sing,*mult;
INT BackNodeCount,nextcoupling,StartNode,NextNode,PathCount,
    i,J,JDouble,oldcount;
BackTrackNode NODE,*nodes;
Coupling *couplings;
               
 PrtConjBndSet(conjset);
     sing = conjset->LogBondSet->Single;
     mult = conjset->LogBondSet->Multiple;
     couplings = conjset->Coupling->Coups;

     nextcoupling = 0;
     while(nextcoupling < conjset->Coupling->Size &&
           couplings->Flag != 1)
          {
          nextcoupling++;
          couplings++;
          }

     PathCount = 0;
     if( nextcoupling < conjset->Coupling->Size )
          {
   
          StartNode = couplings->I;
          NextNode  = -1;

          BackNodeCount = 0;
          nodes = (BackTrackNode *) Calloc(sizeof(NODE),20);
	  nodes->Level = 0;
          
          while(NextNode != StartNode)
               {
               *(CoupPath + PathCount) = couplings;
               couplings->Flag = 0;

               J = couplings->J;
               JDouble = Double(conjset,J);
               oldcount = BackNodeCount;
               BackNodeCount = FindAdjacentResonance(
                                                 JDouble,
                                                 BackNodeCount,nodes,
                                                 conjset->Coupling->Coups,
                                                 PathCount,
                                                 conjset->Coupling->Size);

               if( JDouble != StartNode )
                    {
                    if( BackNodeCount == oldcount )  
                         {
                         for(i=(nodes->Level)+1; i <= PathCount ; i++)
                              couplings->Flag = 1;
                         PathCount = nodes->Level;
                         } 
                    
                    if( BackNodeCount == 0 ) 
                         return(-1);

                    couplings = nodes->coup;
                    NextNode = couplings->J;
                    PathCount++;
                    }
               else 
                    NextNode = JDouble;
               }

               Free(nodes);
           }                                     

     *(CoupPath + PathCount) = couplings;
     return(++PathCount);
   
}

static LogicalBondSet *PerformResonance(ConjugationSet *conjset, 
                                Coupling **CoupPath, 
                                INT PathCount)
{
LogicalBondSet *logbnd;
INT i,atomI,atomJ,atomK,atomStart,atomEnd;
     
     logbnd   = FullCopyLogBndSet(conjset->LogBondSet);
                                     
     atomStart = (*CoupPath)->I;
     LOOPi(PathCount)
          {                         
          atomI = (*CoupPath)->I;
          atomJ = (*CoupPath)->J;
          atomK = Double( conjset, (*CoupPath)->J );
          ResonanceMultTSingF(logbnd,atomI,atomJ);
          if( i != PathCount - 1 )
               {
               ResonanceMultFSingT(logbnd,atomJ,atomK);
               CoupPath++;
               }
          }

     atomEnd = (*CoupPath)->J;
     ResonanceMultFSingT(logbnd,atomStart,atomEnd);

     return(logbnd);
}

static void SaveNextResonance(INT NumCoups,
                       LogicalBondSet *resonances,
                       Coupling       **couplingpairs,
                       LogicalBondSet *original,
                       ResonantSets  *sets)
     {                                           
     ResonantSet *set;                               
     
     if(sets->NSets == 0) 
          {
          set = MakeResSet(NumCoups,original,couplingpairs);
          sets->NSets +=1;
          *( sets->Sets ) = set;
          }
     else
	  {
	  set = MakeResSet(NumCoups,resonances,couplingpairs);
	  
	  if( NotDuplicateInSets(sets,set) )
	       {
	       *(sets->Sets + sets->NSets) = set;
	       sets->NSets += 1;
	       }
	  else
	       Free(set);
	  }
     
     }

