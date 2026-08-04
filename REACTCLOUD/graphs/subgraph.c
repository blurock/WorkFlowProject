#include "basic.h"
#include "graph.h"

#define DEBUG DEBUG0

static INT SubgraphPreFilter(Graph *graph1, DataSubSet *set1,
			     Graph *graph2, DataSubSet *set2);
static EquivalentSets *FormEquivalentSets(INT id,CHAR *name,
					  DataSubSet *set1, Graph *graph1,
					  DataSubSet *set2, Graph *graph2);
static void PrintPrettyDataSetPair(CHAR *prefix, DataSetPair *pair);
static void PrintPrettyEquivalentSets(CHAR *prefix, EquivalentSets *equiv);
static SetOfPairSets *StartPairs(INT id, CHAR *name,
				 INT start, 
				 Graph *graph1, DataSubSet *set1,
				 Graph *graph2, DataSubSet *set2);
static SetOfPairSets *NextNodePair(Pair *pair, 
				   Graph *graph1, DataSubSet *set1,
				   Graph *graph2, DataSubSet *set2);
static SetOfPairSets *NextNodeSetFromPairSet(PairSet *pairset,
					     Graph *graph1, DataSubSet *set1,
					     Graph *graph2, DataSubSet *set2);
static INT AllBondsMatch(PairSet *bonds1, Graph *graph2, PairSet *pairs);
static INT SearchInNeighbor(INT element, Neighbor *n);
static PairSet *TransformSetOfBonds(PairSet *transform, INT set, PairSet *bonds);
static INT TransformElement(INT element, PairSet *transform, INT set);
static SetOfPairSets *RemoveDuplicatesInSetOfPairSets(SetOfPairSets *set);
static void RemoveDuplicatePairs(PairSet *new, PairSet *old);
static SetOfPairSets *SmallestStartPairs(Graph *graph1, DataSubSet *set1,
					 Graph *graph2, DataSubSet *set2);
static INT IterationSteps(PairSet *pairs,
			  Graph *graph1, DataSubSet *set1,
			  Graph *graph2, DataSubSet *set2,
			  PairSet *bonds2,
			  INT max, SetOfPairSets *total);
static INT AddPairSetToTotalList(PairSet *pairs,
				 INT max,
				 SetOfPairSets *total);

static INT IsSubGraphWork(Graph *graph1, DataSubSet *set1,
			  Graph *graph2, DataSubSet *set2,
			  PairSet *bonds2);
static INT ISGIteration(PairSet *pairset,
			Graph *graph1, DataSubSet *set1,
			Graph *graph2, DataSubSet *set2,
			PairSet *bonds2);

#define MemberOfDataSet(i,data) IntegerMemberOf(i,data->Points,data->NumberOfPoints)
#define START_NUMBER_OF_PAIR_SETS     1000
#define PAIR_SET_INCREMENT            500

/********************************************************************/
extern SetOfPairSets *BasicSubGraph(Graph *graph1,
				    Graph *graph2)
     {
     DataSubSet *set1,*set2;
     SetOfPairSets *out;
     
     
     set1 = AllocateDataSubSet;
     SetUpTotalGraphSet(set1,graph1);
     set2 = AllocateDataSubSet;
     SetUpTotalGraphSet(set2,graph2);
     
     out = FindSubGraphsRoot(0,graph1->Name,
			     graph1,set1,
			     graph2,set2);
     FreeDataSubSet(set1);
     Free(set1);
     FreeDataSubSet(set2);
     Free(set2);
     
     return(out);
     }

extern SetOfPairSets *FindSubGraphsRoot(INT root1, CHAR *name,
					Graph *graph1, DataSubSet *set1,
					Graph *graph2, DataSubSet *set2)
     {
     SetOfPairSets *pairset;
     SetOfPairSets *totalset;
     
#if DEBUG >= DEBUG1
     printf("---------------FindSubGraphsRoot--------------\n");
     PrintPrettyGraph("Graph1",stdout,graph1);
     PrintPrettyGraph("Graph2",stdout,graph2);
#endif
     if(SubgraphPreFilter(graph1,set1,graph2,set2) == 0)
	  {
	  totalset = 0;
	  }
     else
	  {
	  pairset = SmallestStartPairs(graph1,set1,graph2,set2);
	  
	  totalset = FindSubGraphFromPairSet(root1,name,
					     pairset,
					     graph1,set1,graph2,set2);

	  FreeSetOfPairSets(pairset);
	  Free(pairset);

	  }
     return(totalset);
     }

extern SetOfPairSets *FindSubGraphFromPairSet(INT root1, CHAR *name,
					      SetOfPairSets *pairset,
					      Graph *graph1, DataSubSet *set1,
					      Graph *graph2, DataSubSet *set2)
     {
     SetOfPairSets *totalset;
     PairSet *pairs,*bonds2;
     INT max,i;
     
     if(pairset == 0)
	  {
	  totalset = 0;
	  }
     else
	  {
	  max = START_NUMBER_OF_PAIR_SETS;
	  totalset = AllocateSetOfPairSets;
	  CreateSetOfPairSets(totalset,root1,name,max,0);
	  totalset->NumberOfSets = 0;
	  
	  bonds2 = SetOfBonds(graph2,set2,MAXIMUM_NUMBER_OF_BONDS);
	  
	  pairs = pairset->Sets;
	  LOOPi(pairset->NumberOfSets)
	       {
	       max = IterationSteps(pairs,
				    graph1, set1,
				    graph2, set2,
				    bonds2,
				    max, totalset);
	       pairs++;
	       }
	  FreePairSet(bonds2);
	  Free(bonds2);
	  }
     
     return(totalset);
     }

static INT IterationSteps(PairSet *pairs,
			  Graph *graph1, DataSubSet *set1,
			  Graph *graph2, DataSubSet *set2,
			  PairSet *bonds2,
			  INT max, SetOfPairSets *total)
     {
     SetOfPairSets *newpairset;
     PairSet *newpair;
     INT i;
     
#if DEBUG != NODEBUG
     printf("IterationSteps:----------------------------------\n");
     PrintPrettyPairSet(pairs);
#endif

     if(pairs->NumberOfPairs == set2->NumberOfPoints)
	  {
	  if(AllBondsMatch(bonds2,graph1,pairs))
	       {
	       max = AddPairSetToTotalList(pairs,max,total);
	       }
	  }
     else
	  {
	  newpairset = NextNodeSetFromPairSet(pairs,
					      graph1,set1,
					      graph2,set2);
	  
	  if(newpairset != 0)
	       {
#if DEBUG != NODEBUG
	       printf("---Iterate---\n");
#endif
	       newpair = newpairset->Sets;
	       LOOPi(newpairset->NumberOfSets)
		    {
		    max = IterationSteps(newpair,
					 graph1,set1,
					 graph2,set2,
					 bonds2,
					 max,total);
		    newpair++;
		    }
	       
	       FreeSetOfPairSets(newpairset);
	       Free(newpairset);
	       }
	  }
#if DEBUG != NODEBUG
     printf("---Return---\n");
#endif
     return(max);
     }

static INT AddPairSetToTotalList(PairSet *pairs,
			     INT max,
			     SetOfPairSets *total)
     {
     INT i;
     PairSet *newpairs,*newpairstart,*next,*oldpair;
     
     if(total->NumberOfSets == max)
	  {
	  max += PAIR_SET_INCREMENT;
	  newpairs = newpairstart = AllocArrayPairSet(max);
	  oldpair = total->Sets;
	  LOOPi(total->NumberOfSets)
	       {
	       CopyFullPairSet(newpairs,oldpair);
	       FreePairSet(oldpair);
	       oldpair++;
	       newpairs++;
	       }
	  Free(total->Sets);
	  total->Sets = newpairstart;
	  }
     next = total->Sets + total->NumberOfSets;
     CopyFullPairSet(next,pairs);
     total->NumberOfSets += 1;

     return(max);
     }

/********************************************************************/
extern INT IsSubGraph(INT flag,
		      Graph *graph1, DataSubSet *set1,
		      Graph *graph2, DataSubSet *set2)
     {
     INT done;
     PairSet *bonds1,*bonds2;
     
     done = 0;

     bonds1 = SetOfBonds(graph1,set1,MAXIMUM_NUMBER_OF_BONDS);
     bonds2 = SetOfBonds(graph2,set2,MAXIMUM_NUMBER_OF_BONDS);
     
     if((flag == SUBGRAPH_EQUAL &&
	 bonds2->NumberOfPairs == bonds1->NumberOfPairs)
	||
	(flag == SUBGRAPH_SUBGRAPH &&
	 bonds2->NumberOfPairs < bonds1->NumberOfPairs)
	)
	  {
	  done = IsSubGraphWork(graph1,set1,graph2,set2,bonds2);
	  }
     FreePairSet(bonds1);
     Free(bonds1);
     FreePairSet(bonds2);
     Free(bonds2);

     return(done);
     }

static INT IsSubGraphWork(Graph *graph1, DataSubSet *set1,
			  Graph *graph2, DataSubSet *set2,
			  PairSet *bonds2)
     {
     SetOfPairSets *pairset;
     PairSet *pairs;
     INT count,done;
     
     pairset = SmallestStartPairs(graph1,set1,graph2,set2);
     pairs = pairset->Sets;
     count = 0;
     done = 0;
     while(done == 0 && count < pairset->NumberOfSets)
	  {
	  done = ISGIteration(pairs,graph1,set1,graph2,set2,bonds2);
	  pairs++;
	  count++;
	  }
     FreeSetOfPairSets(pairset);
     Free(pairset);

     return(done);
     }

extern void SetUpTotalGraphSet(DataSubSet *sub, Graph *graph)
     {
     INT i,*pnt;
     
     
     CreateDataSubSet(sub,graph->ID,graph->Name,
		      graph->NumberOfNodes,
		      graph->NumberOfNodes,
		      0);

     pnt = sub->Points;
     LOOPi(sub->NumberOfPoints)
	  *pnt++ = i;
     }

static INT ISGIteration(PairSet *pairset,
			Graph *graph1, DataSubSet *set1,
			Graph *graph2, DataSubSet *set2,
			PairSet *bonds2)
     {
     SetOfPairSets *newpairset;
     INT done,count;
     PairSet *newset;
     
#if DEBUG != NODEBUG
     printf("ISGIteration:----------------------------------\n");
     PrintPrettyPairSet(pairset);
#endif
     done = 0;

     if(pairset->NumberOfPairs == set2->NumberOfPoints)
	  {
	  if(AllBondsMatch(bonds2,graph1,pairset))
	       done = 1;
#if DEBUG != NODEBUG
		    printf("ISGIteration:TEST %d------------------------\n",done);
#endif	  
	  }
     else
	  {
	  newpairset = NextNodeSetFromPairSet(pairset,
					      graph1,set1,
					      graph2,set2);
	  if(newpairset != 0)
	       {
	       newset = newpairset->Sets;
	       count = 0;
	       while(done == 0 && count < newpairset->NumberOfSets)
		    {
#if DEBUG != NODEBUG
		    printf("ISGIteration:LOOP %d------------------------\n",count);
#endif
		    done = ISGIteration(newset,
					graph1,set1,
					graph2,set2,
					bonds2);
		    newset++;
		    count++;
		    }
	       FreeSetOfPairSets(newpairset);
	       Free(newpairset);
	       }
	  }
     
#if DEBUG != NODEBUG
     printf("ISGIteration:DONE %d------------------------\n",done);
#endif
     return(done);
     }

/************************************************************************/
static INT SubgraphPreFilter(Graph *graph1, DataSubSet *set1,
			      Graph *graph2, DataSubSet *set2)
     {
     INT out;
     
     out = 1;
     
     if(set1->NumberOfPoints < set2->NumberOfPoints)
	  out = 0;
     return(out);
     }

static INT AllBondsMatch(PairSet *bonds2, Graph *graph1, PairSet *pairs)
     {
     PairSet *bonds1;
     Pair *bond;
     INT diff,count;
     Neighbor *n2;
     
     bonds1 = TransformSetOfBonds(pairs,1,bonds2);
     if(bonds1->NumberOfPairs < bonds2->NumberOfPairs)
	  diff = 0;
     else
	  {
	  bond = bonds1->Pairs;
	  diff = 1;
	  count = 0;
	  while( count < bonds1->NumberOfPairs && diff == 1)
	       {
	       n2 = graph1->Neighbors + bond->I;
	       diff = SearchInNeighbor(bond->J,n2);
	       bond++;
	       count++;
	       }
	  }
     FreePairSet(bonds1);
     Free(bonds1);
     return(diff);
     }

static INT SearchInNeighbor(INT element, Neighbor *n)
     {
     INT *ele,count,found;
     
     found = 0;
     count = 0;
     ele = n->List;
     while(count < n->NumberOfNeighbors &&
	   found == 0)
	  {
	  if(element == *ele)
	       found = 1;
	  ele++;
	  count++;
	  }
     return(found);
     }


extern PairSet *SetOfBonds(Graph *graph, DataSubSet *set, INT MaxNumberOfBonds)
     {
     INT i,j,count,*other;
     PairSet *bondset;
     Pair *bond;
     Neighbor *neighbor;
     
     bondset = AllocatePairSet;
     CreatePairSet(bondset,graph->ID,graph->Name,
		   MaxNumberOfBonds,0);
     count = 0;
     bond = bondset->Pairs;
     neighbor = graph->Neighbors;
     LOOPi(graph->NumberOfNodes)
	  {
	  if(MemberOfDataSet(i,set))
	       {
	       other = neighbor->List;
	       LOOPj(neighbor->NumberOfNeighbors)
		    {
		    if(MemberOfDataSet(*other,set))
			 {
			 if(i <= *other)
			      {
			      CreatePair(bond,graph->ID,graph->Name,
					 i,*other);
			      count++;
			      bond++;
			      }
			 }
		    other++;
		    }
	       }
	  neighbor++;
	  }
     bondset->NumberOfPairs = count;
     return(bondset);
     }

static PairSet *TransformSetOfBonds(PairSet *transform, INT set, PairSet *bonds)
     {
     PairSet *newbonds;
     Pair *bond,*newbond;
     INT i,newi,newj;
     
     newbonds = AllocatePairSet;
     CreatePairSet(newbonds,bonds->ID,bonds->Name,
		   bonds->NumberOfPairs,0);
     
     bond = bonds->Pairs;
     newbond = newbonds->Pairs;
     LOOPi(bonds->NumberOfPairs)
	  {
	  newi = TransformElement(bond->I,transform,set);
	  newj = TransformElement(bond->J,transform,set);
	  CreatePair(newbond,bond->ID,bond->Name,newi,newj);
	  bond++;
	  newbond++;
	  }
     return(newbonds);
     }

static INT TransformElement(INT element, PairSet *transform, INT set)
     {
     INT i,match;
     Pair *trans;
     
     trans = transform->Pairs;
     i = 0;
     match = -1;
     if(set == 0)
	  {
	  while(i<transform->NumberOfPairs &&
		match == -1                )
	       {
	       if(element == trans->I) match = trans->J;
	       trans++;
	       i++;
	       }
	  }  
     else
	  {
	  while(i<transform->NumberOfPairs &&
		match == -1                )
	       {
	       if(element == trans->J) match = trans->I;
	       trans++;
	       i++;
	       }
	  }  
     return(match);
     }
	       
static SetOfPairSets *NextNodeSetFromPairSet(PairSet *pairset,
					     Graph *graph1, DataSubSet *set1,
					     Graph *graph2, DataSubSet *set2)
     {
     DataSubSet *newset1,*newset2;
     DataSetPair *datapair;
     SetOfPairSets *referenceset,*newnodesets,*mergedpairset,*final,*nodups;
     INT i,flag;
     Pair *pair;
     
     datapair = DataSubSetFromPairSet(pairset);
     newset1 = SubtractDataSubSet(pairset->ID,pairset->Name,
				  set1,datapair->Set1);
     newset2 = SubtractDataSubSet(pairset->ID,pairset->Name,
				  set2,datapair->Set2);

     referenceset = AllocateSetOfPairSets;
     CreateSetOfPairSets(referenceset,pairset->ID,pairset->Name,
			 1,0);
     CopyFullPairSet(referenceset->Sets,pairset);

     flag = 0;
     pair = pairset->Pairs;
#if DEBUG >= DEBUG3
     printf("*** Begin   NextNodeSetFromPairSet \n");
#endif
     LOOPi(pairset->NumberOfPairs)
	  {
#if DEBUG >= DEBUG3
	  printf("From: (%d,%d) \n",pair->I,pair->J);
#endif
	  newnodesets = NextNodePair(pair,graph1,newset1,graph2,newset2);
#if DEBUG >= DEBUG3
	  PrintPrettySetOfPairSets(newnodesets);
#endif
	  if(newnodesets->NumberOfSets > 0) flag = 1;

	  mergedpairset = MergeTwoSetOfPairSets(referenceset,newnodesets);
	  FreeSetOfPairSets(newnodesets);
	  Free(newnodesets);
	  FreeSetOfPairSets(referenceset);
	  Free(referenceset);

	  referenceset = mergedpairset;
	  pair++;
	  }
     if(flag == 0)
	  {
	  FreeSetOfPairSets(referenceset);
	  Free(referenceset);
	  referenceset = 0;
	  }
     
#if DEBUG >= DEBUG3
     printf("*** End   NextNodeSetFromPairSet \n");
#endif

     FreeDataSetPair(datapair);
     Free(datapair);
     FreeDataSubSet(newset1);
     Free(newset1);
     FreeDataSubSet(newset2);
     Free(newset2);

#if DEBUG >= DEBUG3
     printf("before remove\n");
     PrintPrettySetOfPairSets(referenceset);
#endif
     final = RemoveDuplicatesInSetOfPairSets(referenceset);
     FreeSetOfPairSets(referenceset);
     Free(referenceset);
#if DEBUG >= DEBUG3
     printf("after remove\n");
     PrintPrettySetOfPairSets(final);
#endif
     
     nodups = SplitDuplicateSetsOfPairSets(final);
     FreeSetOfPairSets(final);
     Free(final);
     
#if DEBUG >= DEBUG3
     printf("After Splitting of Duplicate Pairs\n");
     PrintPrettySetOfPairSets(nodups);
#endif
     
     return(nodups);
     }

static SetOfPairSets *RemoveDuplicatesInSetOfPairSets(SetOfPairSets *set)
     {
     SetOfPairSets *newset;
     PairSet *pairs,*newpairs;
     INT i,count;
     
     if(set == 0)
	  return(0);
     
     newset = AllocateSetOfPairSets;
     CreateSetOfPairSets(newset,set->ID,set->Name,
			 set->NumberOfSets,0);

     count = 0;
     newpairs = newset->Sets;
     pairs = set->Sets;
     LOOPi(set->NumberOfSets)
	  {
	  RemoveDuplicatePairs(newpairs,pairs);
	  pairs++;
	  newpairs++;
	  }
     return(newset);
     }

static void RemoveDuplicatePairs(PairSet *new, PairSet *old)
     {
     Pair *rest,*oldpair,*newpair;
     INT i,j,count,matched,paircount,n;
     
     CreatePairSet(new, old->ID,old->Name,
		   old->NumberOfPairs,
		   0);
     
     paircount = 0;
     newpair = new->Pairs;
     oldpair = old->Pairs;
     LOOPi(old->NumberOfPairs)
	  {
	  rest = oldpair + 1;
	  n = old->NumberOfPairs - i - 1;
	  count = 0;
	  matched = 0;
	  while(count < n && matched == 0)
	  LOOPj(n)
	       {
	       if( (rest->I == oldpair->I && rest->J == oldpair->J ) )
		    matched = 1;
	       rest++;
	       count++;
	       }
	  if(matched == 0)
	       {
	       CopyFullPair(newpair,oldpair);
	       newpair++;
	       paircount++;
	       }
	  oldpair++;
	  }
     new->NumberOfPairs = paircount;
     }
	  
static SetOfPairSets *NextNodePair(Pair *pair, 
				   Graph *graph1, DataSubSet *set1,
				   Graph *graph2, DataSubSet *set2)
     {
     int i;
     Neighbor *N1,*N2;
     DataSetPair *dset;
     EquivalentSets *sets;
     SetOfPairSets *new, *master, *pairsets;
     DataSubSet *DN1,*DN2;
     
     N1 = Neighbors(pair->I,graph1,set1);
     N2 = Neighbors(pair->J,graph2,set2);

     DN1 = NeighborToDataSubSet(N1);
     DN2 = NeighborToDataSubSet(N2);
     
     sets = FormEquivalentSets(pair->ID,pair->Name,DN1,graph1,DN2,graph2);
     
     master = AllocateSetOfPairSets;
     CreateSetOfPairSets(master,pair->ID,pair->Name,
			 0,0);

     dset = sets->Sets;
     LOOPi(sets->NumberOfSets)
          {
          pairsets = SetOfPairPermutations(dset->Set1,dset->Set2);
	  
          new = MergeTwoSetOfPairSets(master,pairsets);

          FreeSetOfPairSets(master);
          FreeSetOfPairSets(pairsets);
	  Free(master);
	  Free(pairsets);
	  
          master = new;
	  dset++;
          }
     FreeNeighbor(N1);
     Free(N1);
     FreeNeighbor(N2);
     Free(N2);
     FreeDataSubSet(DN1);
     Free(DN1);
     FreeDataSubSet(DN2);
     Free(DN2);
     FreeEquivalentSets(sets);
     Free(sets);
     
     return(master);
     }

/********************************************************************/
/* SmallestStartPairs

   This set of routines picks out from the two graphs, that set of 
   of start pairs (i.e. the initial matching nodes) which has the 
   fewest number of pairs.
*/
/********************************************************************/
static SetOfPairSets *SmallestStartPairs(Graph *graph1, DataSubSet *set1,
					 Graph *graph2, DataSubSet *set2)
     {
     SetOfPairSets *beststartpairs,*setstartpairs;
     INT i,best,*root;
     
     beststartpairs = AllocateSetOfPairSets;
     CreateSetOfPairSets(beststartpairs,set1->ID,set1->Name,
			 0,0);
     best = graph1->NumberOfNodes + graph2->NumberOfNodes;
     
     root = set2->Points;
     LOOPi(set2->NumberOfPoints)
	  {
	  setstartpairs = StartPairs(set1->ID,set1->Name,
				    *root,
				    graph1,set1,graph2,set2);
	  if(setstartpairs->NumberOfSets < best)
	       {
	       FreeSetOfPairSets(beststartpairs);
	       Free(beststartpairs);
	       beststartpairs = setstartpairs;
	       best = setstartpairs->NumberOfSets;
	       }
	  else
	       {
	       FreeSetOfPairSets(setstartpairs);
	       Free(setstartpairs);
	       }
	  root++;
	  }
     return(beststartpairs);
     }

	       
static SetOfPairSets *StartPairs(INT id, CHAR *name,
				 INT start, 
				 Graph *graph1, DataSubSet *set1,
				 Graph *graph2, DataSubSet *set2)
     {
     DataSubSet *start1,*start2;
     SetOfPairSets *pairsets;
     INT type;
     
     start2 = AllocateDataSubSet;
     CreateDataSubSet(start2,id,name,graph2->NumberOfNodes,1,0);
     *(start2->Points) = start;
     
     type = NthNodeType(start,graph2);
     start1 = FindAtomsOfType(type,graph1,set1);

     pairsets = SetOfPairPermutations(start1,start2);
     FreeDataSubSet(start1);
     Free(start1);
     FreeDataSubSet(start2);
     Free(start2);
     
     return(pairsets);
     }


static void PrintPrettyEquivalentSets(CHAR *prefix, EquivalentSets *equiv)
     {
     DataSetPair *pair;
     INT i;
     CHAR *string;
     
     string = AllocateString(LINELENGTH);
     pair = equiv->Sets;
     LOOPi(equiv->NumberOfSets)
	  {
	  sprintf(string,"%s:%5d:",prefix,i);
	  PrintPrettyDataSetPair(string,pair++);
	  }
     Free(string);
     }

static void PrintIntegerVector(CHAR *prefix, DataSubSet *subset)
     {
     INT i,*pnts;
     
     printf("%s:",prefix);
     pnts = subset->Points;
     LOOPi(subset->NumberOfPoints)
	  printf("%4d",*pnts++);
     printf("\n");
     }

static void PrintPrettyDataSetPair(CHAR *prefix, DataSetPair *pair)
     {
     CHAR *string;
     
     string = AllocateString(LINELENGTH);
     sprintf(string,"%s: 1 :",prefix);
     PrintIntegerVector(string,pair->Set1);
     
     sprintf(string,"%s: 2 :",prefix);
     PrintIntegerVector(string,pair->Set2);

     Free(string);
     }

static EquivalentSets *FormEquivalentSets(INT id,CHAR *name,
					  DataSubSet *set1, Graph *graph1,
					  DataSubSet *set2, Graph *graph2)
     {
     DataSubSet *unused1,*unused2,*newunused1,*newunused2;
     EquivalentSets *equiv;
     DataSetPair *pair;
     INT count,i,type;
     
     equiv = AllocateEquivalentSets;
     CreateEquivalentSets(equiv,id,name,
			  graph1->NumberOfNodes,
			  0);

     unused1 = AllocateDataSubSet;
     CopyFullDataSubSet(unused1,set1);
     unused2 = AllocateDataSubSet;
     CopyFullDataSubSet(unused2,set2);
     
     count = 0;
     pair = equiv->Sets;
     LOOPi(graph1->NumberOfNodes)
	  {
	  if(MemberOfDataSet(i,unused1))
	       {
	       type = NthNodeType(i,graph1);
	       CreateDataSetPair(pair,type,graph1->Name,
				 0,0);
	       pair->Set1 = FindAtomsOfType(type,graph1,unused1);
	       pair->Set2 = FindAtomsOfType(type,graph2,unused2);
	       if(pair->Set2->NumberOfPoints != 0)
		    {
		    
		    newunused1 = SubtractDataSubSet(i,name,unused1,pair->Set1);
		    newunused2 = SubtractDataSubSet(i,name,unused2,pair->Set2);

		    FreeDataSubSet(unused1);
		    Free(unused1);
		    unused1 = newunused1;
		    FreeDataSubSet(unused2);
		    Free(unused2);
		    unused2 = newunused2;

		    count++;
		    pair++;
		    }
	       else 
		    {
		    FreeDataSetPair(pair);
		    }
	       }
	  }

     FreeDataSubSet(unused1);
     Free(unused1);
     FreeDataSubSet(unused2);
     Free(unused2);

     equiv->NumberOfSets = count;
     return(equiv);
     }


