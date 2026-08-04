/*  FILE     
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
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void AddGraphsToTotalSet(SetOfGraphs *new, 
				SetOfGraphs *total);
static void FormPerformedRxn(SetOfGraphs *graphs,
			     SetOfGraphNodePairs *nodepairs,
			     PerformedRxn *prxn); 
static PerformedRxn *ProduceReverseReaction(PerformedRxn *old,
					    PerformedRxnInfo *adjust);
static void AdjustExistingReaction(INT id,
				   INT flag,
                                   PerformedRxnInfoConstants *adjust,
				   SetOfPerformedRxns *total);
static INT PerformedRxnInSet(PerformedRxn *performed,
			     SetOfPerformedRxns *set);
static INT IntegerGreaterThan(INT *i1, INT *i2);

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
extern void SeparateToFormReaction(SetOfGraphNodePairs *nodepairs,
				   SetOfCombinedGraphs *setofcombined,
				   SetOfGraphs *setofresults,
				   SetOfPerformedRxns *setofrxns)
     {
     INT maxnumgraphs,maxnumrxns,i,num;
     PerformedRxn *prxn;
     CombinedGraph *combined;
     SetOfGraphs *setofgraphs;
     
     maxnumgraphs = setofcombined->NumberOfCGraphs * 3;
     maxnumrxns   = setofcombined->NumberOfCGraphs;

     CreateSetOfGraphs(setofresults,setofcombined->ID,setofcombined->Name,
		       maxnumgraphs,0);
     setofresults->NumberOfGraphs = 0;
     
     CreateSetOfPerformedRxns(setofrxns,setofcombined->ID,setofcombined->Name,
			      maxnumrxns,0);
     setofrxns->NumberOfReactions = 0;
     
     prxn = setofrxns->Reactions;
     combined = setofcombined->CGraphs;
     LOOPi(setofcombined->NumberOfCGraphs)
	  {
	  if(combined->ID >= 0)
	       {
	       setofgraphs = SeparateOutGraphs(combined->Combined);
	       
	       num = setofgraphs->NumberOfGraphs;
	       FilterOutSetOfGraphs(setofgraphs);
	       if(num == setofgraphs->NumberOfGraphs)
		 {
		   AddGraphsToTotalSet(setofgraphs,setofresults);
		   
		   FormPerformedRxn(setofgraphs,nodepairs,prxn);
		   
		   prxn++;
		   setofrxns->NumberOfReactions += 1;
		 }
	       else
		 {
		   printf("Resulting Molecule Filtered Out\n");
		 }
	       
	       }
	    
	  combined++;
	  }	  
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AddGraphsToTotalSet(SetOfGraphs *new, 
				SetOfGraphs *total)
     {
     INT offset,i;
     Graph *gnew,*graphs;
     
     offset = total->NumberOfGraphs;
     total->NumberOfGraphs += new->NumberOfGraphs;
     
     gnew = new->Graphs;
     graphs = total->Graphs;
     LOOPi(new->NumberOfGraphs)
	  {
	  memcpy(graphs,gnew,GraphSize);
	  gnew->ID = graphs->ID = offset + i;
	  graphs++;
	  gnew++;
	  }
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/     
static void FormPerformedRxn(SetOfGraphs *graphs,
			     SetOfGraphNodePairs *nodepairs,
			     PerformedRxn *prxn)
     {
     DataSubSet *reactants;
     INT i,*molid;
     Graph *graph;
     
     reactants = ListOfMoleculesFromGraphNodePairs(NODE_PAIR_REACTANT,
						   nodepairs);
     CreatePerformedRxn(prxn,nodepairs->ID,nodepairs->Name,
			reactants->NumberOfPoints,
			graphs->NumberOfGraphs,
			reactants->Points,0,0);
     graph = graphs->Graphs;
     molid = prxn->ProductIDs;
     LOOPi(graphs->NumberOfGraphs)
	  {
	  *molid = graph->ID;
	  graph++;
	  molid++;
	  }

     FreeDataSubSet(reactants);
     Free(reactants);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AddNewReaction(PerformedRxnInfo *adjust,
			   SetOfPerformedRxns *total,
			   PerformedRxn *nprxn)
     {
     PerformedRxn *prxn;
     PerformedRxnInfoConstants *rxninfo;
     FLOAT factor,sym;
     
     prxn = total->Reactions + total->NumberOfReactions;
     memcpy(prxn,nprxn,PerformedRxnSize);
     total->NumberOfReactions +=1;

     prxn->Info = AllocatePerformedRxnInfo;
     CreatePerformedRxnInfo(prxn->Info,adjust->ID,adjust->Name,
			    0,0);
     prxn->Info->Forward = AllocatePerformedRxnInfoConstants;
     rxninfo = prxn->Info->Forward;
     sym = (FLOAT) adjust->Forward->SymmetryFactor;
     factor = adjust->Forward->Weight / sym;
     CreatePerformedRxnInfoConstants(rxninfo,prxn->ID,prxn->Name,
			    1,factor,
			    adjust->Forward->Aconstant,
			    adjust->Forward->Energy,
			    adjust->Forward->TempExp);

     prxn->Info->Reverse = AllocatePerformedRxnInfoConstants;
     rxninfo = prxn->Info->Reverse;
     sym = (FLOAT) adjust->Reverse->SymmetryFactor;
     factor = adjust->Reverse->Weight / sym;
     CreatePerformedRxnInfoConstants(rxninfo,prxn->ID,prxn->Name,
			    1,factor,
			    adjust->Reverse->Aconstant,
			    adjust->Reverse->Energy,
			    adjust->Reverse->TempExp);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static PerformedRxn *ProduceReverseReaction(PerformedRxn *old,
					    PerformedRxnInfo *adjust)
     {
     PerformedRxnInfo *info;
     PerformedRxn* new;
     INT *oldid,*newid,i;
     
     new = AllocatePerformedRxn;
     CreatePerformedRxn(new,old->ID,old->Name,
			old->NumberOfProducts,
			old->NumberOfReactants,
			0,0,0);
     oldid = old->ProductIDs;
     newid = new->ReactantIDs;
     LOOPi(new->NumberOfReactants)
	  *newid++ = *oldid++;
     
     oldid = old->ReactantIDs;
     newid = new->ProductIDs;
     LOOPi(new->NumberOfProducts)
	  *newid++ = *oldid++;
     
     new->Info = AllocatePerformedRxnInfo;
     CreatePerformedRxnInfo(new->Info,old->ID,old->Name,
			    0,0);
     new->Info->Forward = AllocatePerformedRxnInfoConstants;
     new->Info->Reverse = AllocatePerformedRxnInfoConstants;

     if(old->Info == 0)
	  info = adjust;
     else
	  info = old->Info;
     
     CopyFullPerformedRxnInfoConstants(new->Info->Forward,info->Reverse);
     CopyFullPerformedRxnInfoConstants(new->Info->Reverse,info->Forward);
     return(new);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AdjustExistingReaction(INT id,
				   INT flag,
                                   PerformedRxnInfoConstants *adjust,
				   SetOfPerformedRxns *total)
     {
     FLOAT factor,sym;
     PerformedRxn *prxn;
     PerformedRxnInfo *rxninfo;
     
     sym = (FLOAT) adjust->SymmetryFactor;
     factor = adjust->Weight / sym;
     prxn = total->Reactions + id;
     rxninfo = prxn->Info;
     switch(flag)
	  {
     case REACTANT:
       if(rxninfo->Forward)
	 {
	   rxninfo->Forward->SymmetryFactor += 1;
	   rxninfo->Forward->Weight += factor;
	 }
	  break;
     case PRODUCT:
       if(rxninfo->Reverse)
	 {
	   rxninfo->Reverse->SymmetryFactor += 1;
	   rxninfo->Reverse->Weight += factor;
	 }
	   break;
	  }
     
     }
/*S AddPerformedIfUnique
*/
/*F
**
**  DESCRIPTION
**    
**
**  REMARKS
**
*/
extern void AddPerformedRxnFromSetIfUnique(SetOfPerformedRxns *new,
					   SetOfPerformedRxns *total,
					   PerformedRxnInfo *adjust)
     {
     SetOfPerformedRxns *newtotal;
     PerformedRxn *nprxn,*reverse;
     INT i,id,idreverse;
     unsigned int totalsize;
     
     newtotal = AllocateSetOfPerformedRxns;
     CreateSetOfPerformedRxns(newtotal, total->ID,total->Name,
			      new->NumberOfReactions + total->NumberOfReactions,
			      0);
     totalsize = (unsigned int) PerformedRxnSize * total->NumberOfReactions;
     memcpy(newtotal->Reactions,total->Reactions,totalsize);

     Free(total->Reactions);
     total->Reactions = newtotal->Reactions;
     newtotal->Reactions = 0;
     newtotal->NumberOfReactions = 0;
     FreeSetOfPerformedRxns(newtotal);
     Free(newtotal);
     
     nprxn = new->Reactions;
     LOOPi(new->NumberOfReactions)
	  {
	  id = PerformedRxnInSet(nprxn,total);
	  if(id  >= 0)
	       {	
	       AdjustExistingReaction(id,REACTANT,adjust->Forward,total);
	       AdjustExistingReaction(id,PRODUCT,adjust->Reverse,total);
	       FreePerformedRxn(nprxn);
	       }
	  else
	       AddNewReaction(adjust,total,nprxn);
	  nprxn++;
	  }

     Free(new->Reactions);
     new->Reactions = 0;
     new->NumberOfReactions = 0;
     FreeSetOfPerformedRxns(new);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT PerformedRxnInSet(PerformedRxn *performed,
			     SetOfPerformedRxns *set)
     {
     INT count,done;
     PerformedRxn *prxn;
     
     count = 0;
     done = -1;
     prxn = set->Reactions;
     while(count < set->NumberOfReactions &&
	   done == -1)
	  {
	  if(CanonicalPerformedRxnEqual(performed,prxn))
	       done = count;
	  else
	       prxn++;
	  count++;
	  }
     return(done);
     }
/*S CanonicalRxn
*/
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT IntegerGreaterThan(INT *i1, INT *i2)
     {
     return(*i1 - *i2);
     } 
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
extern void CanonicalPerformedRxn(PerformedRxn *performed)
     {
  
     qsort(performed->ReactantIDs,performed->NumberOfReactants,INTSize,
	   IntegerGreaterThan);

     qsort(performed->ProductIDs,performed->NumberOfProducts,INTSize,
	   IntegerGreaterThan);

     }
 
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
extern INT CanonicalPerformedRxnEqual(PerformedRxn *pr1,
				      PerformedRxn *pr2)
{
  INT count,done,*id1,*id2;
  
  done = 0;
  if(!strcmp(pr1->Name,pr2->Name)) {
    
    if(pr1->NumberOfReactants == pr2->NumberOfReactants &&
	pr1->NumberOfProducts == pr2->NumberOfProducts)
	  {
	  id1 = pr1->ReactantIDs;
	  id2 = pr2->ReactantIDs;
	  count = 0;
	  done = 1;
	  while(done == 1 && count < pr1->NumberOfReactants)
	       {
	       if(*id1 != *id2)
		    done = 0;
	       count++;
	       id1++;
	       id2++;
	       }
	  
	  id1 = pr1->ProductIDs;
	  id2 = pr2->ProductIDs;
	  count = 0;
	  while(done == 1 && count < pr1->NumberOfProducts)
	       {
	       if(*id1 != *id2)
		    done = 0;
	       count++;
	       id1++;
	       id2++;
	       }
	  }
     else
	  done = 0;
  }
  
     if(done == 1) {
       printf("Rxn1: %30s, Rxn2: %30s\n",pr1->Name,pr2->Name);
     }
     return(done);
     }




