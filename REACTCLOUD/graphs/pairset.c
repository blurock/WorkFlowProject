#include "basic.h"
#include "graph.h"

static SetOfPairSets *MergePairToSetOfPairSets(Pair *pair,
                                     SetOfPairSets *sets);
static void MergePairToSet(Pair *pair, PairSet *new, PairSet *old);
static void CopyPairArray(Pair *new, Pair *old, int n);
static void CopyPairSetArray(PairSet *new, PairSet *old,int n);
static Pair *MakePair(int i, DataSubSet *seti, int j, DataSubSet *setj);
static void ConcatTwoPairSets(PairSet *new, PairSet *pair1, PairSet *pair2);

static SetOfPairSets *SplitDuplicatePairSets(PairSet *set);
static Pair *FindDuplicatePair(PairSet *set);
static SetOfPairSets *SplitPairSetAtMark(PairSet *set,Pair *dup);
static INT Factorial(INT n);
static INT CountPermutations(INT n1,INT n2);
static void SetOfPairPermutationsWork(DataSubSet *seta, DataSubSet *setb,
				       INT flag, SetOfPairSets *sets);
static void CreateNextPermutation(DataSubSet *seta,
				  DataSubSet *setb,
				  SetOfPairSets *sets,
				  INT *vector,
				  INT flag);
static void PermuteVectorAndCreate(DataSubSet *seta,
				   DataSubSet *setb,
				   SetOfPairSets *sets,
				   INT *vector,
				   INT flag);

#define DONT_SWITCH_PAIRS     0
#define SWITCH_PAIRS          1

#include "perms.c"

/***************************************************************************
   SetOfPermutations

    This routine takes two lists and produces a set of pairs
       In:
           dataset1,dataset2  :   The lists of elements (DataSubSet)
                                  Ex. (1 2 3)  (4 5)
       Out:
           SetOfPairSets      :   The set of pair sets
                                  [(1 4) (2 5)]
                                  [(1 4) (3 5)]
				  [(2 4) (3 5)]
				  [(2 4) (1 5)]
				  [(3 4) (2 5)]
				  [(3 4) (1 5)]
*/
static void PrintPrettyData(CHAR *prefix,DataSubSet *data)
     {
     INT i,*points;
     
     printf("%s:::",prefix);
     points = data->Points;
     LOOPi(data->NumberOfPoints)
	  {
	  printf(" %5d ",*points);
	  if( !( (i+1) % 10 ) )
	       printf("      \n%s:::",prefix);
	  points++;
	  }
     printf("\n");
     }

extern SetOfPairSets *SetOfPairPermutations(DataSubSet *dataseta,
					    DataSubSet *datasetb)
     {
     INT num;
     SetOfPairSets *sets;
     
/*
     printf("----------------------------------------\n");
     PrintPrettyData("Set A",dataseta);
     PrintPrettyData("Set B",datasetb);
*/
     
     num = CountPermutations(dataseta->NumberOfPoints, datasetb->NumberOfPoints);
/*
     printf("%d Sets\n",num);
*/
   sets = AllocateSetOfPairSets;
     CreateSetOfPairSets(sets,dataseta->ID,datasetb->Name,num,0);
     sets->NumberOfSets = 0;
     
     if((dataseta->NumberOfPoints) < (datasetb->NumberOfPoints))
	  SetOfPairPermutationsWork(datasetb,dataseta,SWITCH_PAIRS,sets);
     else
	  SetOfPairPermutationsWork(dataseta,datasetb,DONT_SWITCH_PAIRS,sets);
/*
     PrintPrettySetOfPairSets(sets);
     printf("----------------------------------------\n");
*/
     return(sets);
     }

static INT Factorial(INT n)
     {
     INT i,j,tot;
     
     tot = 1;
     j = 1;
     LOOPi(n)
	  tot *= j++;
     return(tot);
     }

static INT CountPermutations(INT n1,INT n2)
     {
     INT tot,na,nb,i;

     if(n1 < n2)
	  {
	  na = n2;
	  nb = n1;
	  }
     else
	  {
	  na = n1;
	  nb = n2;
	  }
     tot = 1;
     LOOPi(nb)
	  tot *= na--;
	  
     return(tot);
     }

static void SetOfPairPermutationsWork(DataSubSet *seta, DataSubSet *setb,
				       INT flag, SetOfPairSets *sets)
     {
     INT i,j,k,n,*vector,*vectorstart,notdone,*v0;
     
     n = seta->NumberOfPoints;
     k = setb->NumberOfPoints;
     
     vector = vectorstart = AllocArrayINT(k+1);
     
     LOOPi(k)
	  *vector++ = (i+1);
	  
     *vector = n+1;
     
     notdone = 1;
     
     v0 = vectorstart-1;
     
     while(notdone)
	  {
	  PermuteVectorAndCreate(seta,setb,sets,vectorstart,flag);
	  
	  if(*vectorstart < n-k+1)
	       {
	       j = 0;
	       do
		    {
		    j++;
		    }
	       while(*(v0+j+1) <= *(v0+j) + 1);
	       
	       *(v0+j) += 1;
	       vector = vectorstart;
	       LOOPi(j-2)
		    *vector++ = (i+1);
	       }
	  else
	       notdone = 0;
	  }
     Free(vectorstart);
     }


static void PermuteVectorAndCreate(DataSubSet *seta,
				   DataSubSet *setb,
				   SetOfPairSets *sets,
				   INT *vector,
				   INT flag)
     {
     INT n,ntot,*perm,i,j,*nvector,*vectorstart;
     
     n = setb->NumberOfPoints;
     switch(n)
	  {
     case 0:
     case 1:
	  ntot = 1;
	  perm = (INT *) perm1;
	  break;
     case 2:
	  ntot = 2;
	  perm = (INT *) perm2;
	  break;
     case 3:
	  ntot = 6;
	  perm = (INT *) perm3;
	  break;
     case 4:
	  ntot = 24;
	  perm = (INT *) perm4;
	  break;
     default:
	  ntot = 0;
	  perm = 0;
	  printf("---Permutationss %d\n",n);
	  Error(-1,"Not In Table (Permutations)");
	  break;
	  }
     
     vectorstart = AllocArrayINT(n);
     LOOPi(ntot)
	  {
	  nvector = vectorstart;
	  LOOPj(n)
	       {
	       *nvector = *(vector + *perm);
	       nvector++;
	       perm++;
	       }
	  CreateNextPermutation(seta,setb,sets,vectorstart,flag);
	  }
     }


static void CreateNextPermutation(DataSubSet *seta,
				  DataSubSet *setb,
				  SetOfPairSets *sets,
				  INT *vector,
				  INT flag)
     {
     INT *pnt1, *pnt2, n,i;
     PairSet *pairset;
     Pair *pair;
     
     n = setb->NumberOfPoints;
     pnt1 = seta->Points;
     pnt2 = setb->Points;
     
     pairset = sets->Sets + sets->NumberOfSets;
     CreatePairSet(pairset,sets->ID,sets->Name,
		   n,0);
     pair = pairset->Pairs;
     sets->NumberOfSets += 1;
     
     if(flag == DONT_SWITCH_PAIRS)
	  {
	  LOOPi(n)
	       {
	       CreatePair(pair,i,"p",
			  *(pnt1 + *vector - 1),
			  *pnt2);
	       vector++;
	       pair++;
	       pnt2++;
	       }
	  }
     else
	  {
	  LOOPi(n)
	       {
	       CreatePair(pair,i,"p",
			  *pnt2,
			  *(pnt1 + *vector - 1));
	       vector++;
	       pair++;
	       pnt2++;
	       }
	  }
     
     }


	       
		    
     

extern SetOfPairSets *SetOfPairPermutationsOld(DataSubSet *dataseta,
					    DataSubSet *datasetb)
     {
     INT i,n1,n2,rev;
     DataSubSet *dataset1,*dataset2,*new1,*new2;
     SetOfPairSets *total,*setij,*newtotal,*pairset;
     Pair *pairij;

     if(dataseta->NumberOfPoints >= datasetb->NumberOfPoints)
	  {
	  dataset1 = dataseta;
	  dataset2 = datasetb;
	  rev = 0;
	  }
     else
	  {
	  dataset2 = dataseta;
	  dataset1 = datasetb;
	  rev = 1;
	  }


     n1 = dataset1->NumberOfPoints;
     n2 = dataset2->NumberOfPoints;
     
     total = AllocateSetOfPairSets;
     CreateSetOfPairSets(total,0,"top",0,0);
     if(n1 == 0 || n2 == 0) 
	  {
	  return(total);
	  }

     LOOPi(n1)
	  {
	  new1 = RemoveI(i,dataset1);
	  new2 = RemoveI(0,dataset2);
	       
	  if(rev == 0)
	       {
	       pairij = MakePair(i,dataset1,0,dataset2);
	       setij = SetOfPairPermutations(new1,new2);
	       }
	  else
	       {
	       pairij = MakePair(0,dataset2,i,dataset1);
	       setij = SetOfPairPermutations(new2,new1);
	       }
	  
	  pairset = MergePairToSetOfPairSets(pairij,setij);
	  FreePair(pairij);
	  Free(pairij);
	  FreeSetOfPairSets(setij);
	  Free(setij);
	  
	  newtotal = ConcatTwoSetOfPairSets(total,pairset);
	  FreeSetOfPairSets(total);
	  Free(total);
	  total = newtotal;

	  FreeDataSubSet(new1);
	  FreeDataSubSet(new2);
	  Free(new1);
	  Free(new2);
	  FreeSetOfPairSets(pairset);
	  Free(pairset);
	  }
     return(total);
     }

/* ConcatTwoSetOfPairSets
*/
extern SetOfPairSets *ConcatTwoSetOfPairSets(SetOfPairSets *set1,
					     SetOfPairSets *set2)
     {
     int n,i;
     PairSet *pairs,*newpair;
     SetOfPairSets *new;
     
     if(set1->NumberOfSets == 0)
	  {
	  new = AllocateSetOfPairSets;
	  CopyFullSetOfPairSets(new,set2);
	  }
     else if(set2->NumberOfSets == 0)
	  {
	  new = AllocateSetOfPairSets;
	  CopyFullSetOfPairSets(new,set1);
	  }
     else
	  {
	  n = set1->NumberOfSets + set2->NumberOfSets;
	  
	  new = AllocateSetOfPairSets;
	  CreateSetOfPairSets(new,set1->ID,set1->Name,n,0);
	  
	  pairs = set1->Sets;
	  newpair = new->Sets;
	  LOOPi(set1->NumberOfSets)
	       CopyFullPairSet(newpair++,pairs++);

	  pairs = set2->Sets;
	  LOOPi(set2->NumberOfSets)
	       CopyFullPairSet(newpair++,pairs++);

	  }
     return(new);
     }

/* MergeTwoSetOfPairSets

    Every combination of PairSets will be made:

    [PSi,PSj,....] + [PSa,PSb,...]  --->

    [PSi+PSa,PSi+PSb,PSj+PSa,PSj+PSb,...]

      where PSi+PSa is the concatenation of the two PairSets
*/
extern SetOfPairSets *MergeTwoSetOfPairSets(SetOfPairSets *set1,
					    SetOfPairSets *set2)
     {
     int n,i,j;
     PairSet *pairs1,*pairs2,*newpair;
     SetOfPairSets *new;
     
     if(set1->NumberOfSets == 0)
	  {
	  new = AllocateSetOfPairSets;
	  CopyFullSetOfPairSets(new,set2);
	  }
     else if(set2->NumberOfSets == 0)
	  {
	  new = AllocateSetOfPairSets;
	  CopyFullSetOfPairSets(new,set1);
	  }
     else
	  {
	  n = set1->NumberOfSets * set2->NumberOfSets;
	  
	  new = AllocateSetOfPairSets;
	  CreateSetOfPairSets(new,set1->ID,set1->Name,n,0);
	  
	  pairs1 = set1->Sets;
	  newpair = new->Sets;
	  LOOPi(set1->NumberOfSets)
	       {
	       pairs2 = set2->Sets;
	       LOOPj(set2->NumberOfSets)
		    {
		    ConcatTwoPairSets(newpair,pairs1,pairs2);
		    newpair++;
		    pairs2++;
		    }
	       pairs1++;
	       }
	  }
     
     return(new);
}

extern DataSetPair *DataSubSetFromPairSet(PairSet *set)
     {
     DataSetPair *datapair;
     Pair *pair;
     INT i,*pnt1,*pnt2;
     
     datapair = AllocateDataSetPair;
     CreateDataSetPair(datapair,set->ID,set->Name,
		       0,0);
     
     datapair->Set1 = AllocateDataSubSet;
     CreateDataSubSet(datapair->Set1,set->ID,set->Name,
		      1000,set->NumberOfPairs,0);
     
     datapair->Set2 = AllocateDataSubSet;
     CreateDataSubSet(datapair->Set2,set->ID,set->Name,
		      1000,set->NumberOfPairs,0);
     
     pair = set->Pairs;
     pnt1 = datapair->Set1->Points;
     pnt2 = datapair->Set2->Points;
     LOOPi(set->NumberOfPairs)
	  {
	  *pnt1++ = pair->I;
	  *pnt2++ = pair->J;
	  pair++;
	  }
     
     return(datapair);
     }


static SetOfPairSets *MergePairToSetOfPairSets(Pair *pair,
                                     SetOfPairSets *sets)
     {
     int n,i;
     SetOfPairSets *new;
     PairSet *oldset,*newset;
     
     n = sets->NumberOfSets;
     if(n == 0)
	  {
	  new = AllocateSetOfPairSets;
	  CreateSetOfPairSets(new,pair->ID,pair->Name,1,0);
	  CreatePairSet(new->Sets,pair->ID,pair->Name,
			1,pair);
	  }
     else
	  {
	  new = AllocateSetOfPairSets;
	  CreateSetOfPairSets(new,sets->ID,sets->Name,n,0);
	  oldset = sets->Sets;
	  newset = new->Sets;
	  LOOPi(n)
	       MergePairToSet(pair,newset++,oldset++);
	  }
     return(new);
     }


extern void PrintPrettySetOfPairSets(SetOfPairSets *sets)
     {
     int i;
     PairSet *set;
     
     if(sets == 0)
	  {
	  printf("SetOfPairSets Empty\n");
	  }
     else
	  {
	  printf("SetOfPairSets: %d pair sets\n",sets->NumberOfSets);
	  
	  set = sets->Sets;
	  LOOPi(sets->NumberOfSets)
	       PrintPrettyPairSet(set++);
	  }
}

/****************************************************************************/
/*                             PairSet                                      */
/****************************************************************************/

static void ConcatTwoPairSets(PairSet *new,PairSet *pair1, PairSet *pair2)
     {
     int n;
     Pair *pairs;

     n = pair1->NumberOfPairs + pair2->NumberOfPairs;
     CreatePairSet(new,pair1->ID,pair1->Name,
		   n,0);

     pairs = new->Pairs;
     CopyPairArray(pairs,pair1->Pairs,pair1->NumberOfPairs);
     CopyPairArray(pairs+pair1->NumberOfPairs,
		   pair2->Pairs,
		   pair2->NumberOfPairs);
}

/*  MergePairToSet

     (a,b) + [(i,j), (k,l), ...] --> [(a,b),(i,j), (k,l), ...]
*/
static void MergePairToSet(Pair *pair, PairSet *new, PairSet *old)
     {

     
     CreatePairSet(new,old->ID,old->Name,
		   old->NumberOfPairs + 1,
		   0);

     CopyPairArray(new->Pairs,old->Pairs,old->NumberOfPairs);
     CopyFullPair( (new->Pairs + old->NumberOfPairs), pair);
}

static void CopyPairSetArray(PairSet *new, PairSet *old,int n)
     {
     int i;
     
     CopyFullPairSet(new,old);
     
     LOOPi(n)
          {
	  new->Pairs = AllocArrayPair(old->NumberOfPairs);
          new->NumberOfPairs = old->NumberOfPairs;
	  CopyPairArray(new->Pairs,old->Pairs,old->NumberOfPairs);
          new++;
          old++;
          }
     }

extern void PrintPrettyPairSet(PairSet *set)
{
int i;
Pair *pair;

     printf("PairSet: %d pairs  ",set->NumberOfPairs);

     pair = set->Pairs;
     LOOPi(set->NumberOfPairs)
          {
          if(i % 10 || i == 0) 
	       printf(",");
	  else
	       printf("\n");
          PrintPrettyPair(pair++);
          }
     printf("\n");
}

/*****************************************************************************/
/*                     Routines for Pair                                     */
/*****************************************************************************/

static Pair *MakePair(int i, DataSubSet *seti, int j, DataSubSet *setj)
     {
     Pair *pair;
     
     pair = AllocatePair;
     CreatePair(pair,seti->ID,seti->Name,
		*( seti->Points + i),
		*( setj->Points + j));
     return(pair);
}

static void CopyPairArray(Pair *new, Pair *old, int n)
     {
     int i;
     LOOPi(n)
	  CopyFullPair(new++,old++);
     }

extern void PrintPrettyPair(Pair *pair)
{
          printf("(%3d,%3d)",pair->I,pair->J);
}

extern DataSubSet *RemoveI(INT point, DataSubSet *subset)
     {
     DataSubSet *new;
     INT i,*pnt,*newpnt,n;
     
     new = AllocateDataSubSet;
     CreateDataSubSet(new,subset->ID,subset->Name,
		      subset->MaximumPoint,
		      (subset->NumberOfPoints - 1),
		      0);

     pnt = subset->Points;
     newpnt = new->Points;
     LOOPi(point)
	  *newpnt++ = *pnt++;

     pnt++;
     n = subset->NumberOfPoints - point - 1;     
     LOOPi(n)
	  *newpnt++ = *pnt++;
     
     return(new);
	  }

/**************************************************************************/
/*  SplitDuplicateSetsOfPairSets                                          */
/**************************************************************************/

extern SetOfPairSets *SplitDuplicateSetsOfPairSets(SetOfPairSets *sets)
     {
     PairSet *set;
     SetOfPairSets *new, *master, *pairsets;
     INT i;
     
     if(sets == 0) return(0);
     
     master = AllocateSetOfPairSets;
     CreateSetOfPairSets(master,sets->ID,sets->Name,
			 0,0);

     set = sets->Sets;
     LOOPi(sets->NumberOfSets)
	  {
	  pairsets = SplitDuplicatePairSets(set);
	  new = ConcatTwoSetOfPairSets(master,pairsets);
	  
	  FreeSetOfPairSets(master);
	  FreeSetOfPairSets(pairsets);
	  Free(master);
	  Free(pairsets);
	  
	  master = new;
	  set++;
          }
     return(master);
     }

static SetOfPairSets *SplitDuplicatePairSets(PairSet *set)
     {
     Pair *count;
     SetOfPairSets *split,*sets;

     count = FindDuplicatePair(set);
     
     if(count != 0)
	  {
	  split = SplitPairSetAtMark(set,count);
	  sets = SplitDuplicateSetsOfPairSets(split);
	  
	  FreeSetOfPairSets(split);
	  Free(split);
	  }
     else
	  {
	  sets = AllocateSetOfPairSets;
	  CreateSetOfPairSets(sets,set->ID,set->Name,
			      1,set);
	  }
     FreePair(count);
     Free(count);

     return(sets);
     }

static Pair *FindDuplicatePair(PairSet *set)
     {
     Pair *done,*pair1,*pair2;
     INT count,n,j;
     
     done = 0;
     count = 0;
     pair1 = set->Pairs;
     while(done == 0 && count < set->NumberOfPairs)
	  {
	  pair2 = pair1 + 1;
	  n = set->NumberOfPairs - count - 1;
	  LOOPj(n)
	       {
	       if(pair1->J == pair2->J ||
		  pair1->I == pair2->I )
		    {
		    done = AllocatePair;
		    CreatePair(done,count,set->Name,count,j+count+1);
		    }
	       pair2++;
	       }
	  pair1++;
	  count++;
	  }
     return(done);
     }

static SetOfPairSets *SplitPairSetAtMark(PairSet *set,Pair *dup)
     {
     SetOfPairSets *newset;
     PairSet *pairset1,*pairset2;
     Pair *pair,*pair1,*pair2;
     INT i;
     
     newset = AllocateSetOfPairSets;
     CreateSetOfPairSets(newset,set->ID,set->Name,
			 2,0);
     
     pairset1 = newset->Sets;
     pairset2 = pairset1 + 1;
     
     CreatePairSet(pairset1,set->ID,set->Name,
		   set->NumberOfPairs - 1,
		   0);
     CreatePairSet(pairset2,set->ID,set->Name,
		   set->NumberOfPairs - 1,
		   0);

     pair = set->Pairs;
     pair1 = pairset1->Pairs;
     pair2 = pairset2->Pairs;
     
     LOOPi(set->NumberOfPairs)
	  {
	  if(i != dup->I)
	       CopyFullPair(pair1++,pair);
	  if(i != dup->J)
	       CopyFullPair(pair2++,pair);
	  pair++;
	  }
     
     return(newset);
     }

/*****************************************************************************/
extern INT TranslateFirstToSecond(INT first,
				  PairSet *pairs)
     {
     INT done,count;
     Pair *pair;
     
     count = 0;
     done = -1;
     pair = pairs->Pairs;
     while(count < pairs->NumberOfPairs &&
	   done == -1)
	  {
	  if(pair->I == first) 
	       done = pair->J;
	  pair++;
	  count++;
	  }
     return(done);
     }
     
extern INT TranslateSecondToFirst(INT second,
				  PairSet *pairs)
     {
     INT done,count;
     Pair *pair;
     
     count = 0;
     done = -1;
     pair = pairs->Pairs;
     while(count < pairs->NumberOfPairs &&
	   done == -1)
	  {
	  if(pair->J == second) 
	       done = pair->I;
	  pair++;
	  count++;
	  }
     return(done);
     }
extern SetOfPairSets *FilterOutEquivalentPairSets(SetOfPairSets *pairsets) {
  INT set1,set2,count,notfound;
  PairSet *setpntr1,*setpntr2,*setpntrnew;
  
  if(!pairsets) return pairsets;
  setpntr1   = pairsets->Sets;
  setpntrnew = setpntr1;
  count = 0;
  for(set1 = 0;set1< pairsets->NumberOfSets;set1++) {
    setpntr2 = setpntr1 + 1;
    set2 = set1 + 1;
    notfound = 1;
    while(notfound && set2 < pairsets->NumberOfSets) {
      if(PairSetsEqual(setpntr1,setpntr2)) {
	 notfound = 0;
      } else {
	set2++;
	setpntr2++;
      }
    }
    if(notfound) {
      if(setpntrnew != setpntr1)
	CopyFullPairSet(setpntrnew,setpntr1);
      count++;
      setpntrnew++;
    }
    setpntr1++;
  }
  pairsets->NumberOfSets = count;
  return pairsets;
}
extern int PairSetsEqual(PairSet *set1,PairSet *set2) {
  int found1,found2,i,j;
  int *pointer,*pntr;
  Pair *pair1,*pair2;

  pointer = AllocArrayINT(set1->NumberOfPairs);
  pntr = pointer;
  for(i=0;i<set1->NumberOfPairs;i++) {
    *pntr++ = 0;
  }
  pair1 = set1->Pairs;
  found1 = 1;
  for(i=0;i<set1->NumberOfPairs && found1;i++) {
      pair2 = set2->Pairs;
      pntr = pointer;
      found2 = 1;
      for(j=0;j<set2->NumberOfPairs && found2;j++) {
	  if( pair1->I == pair2->I &&
	      pair1->J == pair2->J) {
	    *pntr = 1;
	    found2 = 0;
	  }
	pair2++;
	pntr++;
      }
      if(found2 == 1)
	found1 = 0;
    pair1++;
  }
  return found1;
}
