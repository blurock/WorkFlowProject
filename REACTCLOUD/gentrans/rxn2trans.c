/*  FILE     rxn2trans.c
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
static void AtomsInTransformForGraph(Graph *new,
				       INT flag, INT molid, Graph *graph,
				       GraphTransform *transform);
static SetOfNodeTransforms 
*CorrespondencesToSetOfNodeTransforms(ReactionInfo *rxn,
				      RxnCorrespondenceSet *corrs); 
static void TranslateAtomCorrespondences(RxnCorrespondenceSet *corrs,
					 SetOfNodeTransforms *nodetrans,
					 ReactionInfo *rxn);
static void TranslateUnmatch(RxnUnMatchedSet *unmatched, 
			     SetOfNodeTransforms *nodetrans,
			     INT flag,
			     ReactionInfo *rxn);
static BondTransformSet *CorrespondencesToBondTransformSet(ReactionInfo *rxn,
							   RxnBondChanges *bonds);
static void MakeBondChange(INT flag, GraphBond *gbond, RxnBond *rxnbond,
			   ReactionInfo *rxn);
static INT MoleculeGraphCorrespondence(INT flag, INT molid, 
				       ReactionInfo *rxn);


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
extern INT ReactionSetToGraphTransformSet(BindStructure *bind)
     {
     ReactionSet *rxnset;
     DataSubSet *rxnlist;
     TransformSet *transformset;
     INT *rxnid,i;
     ReactionInfo *rxn;
     GraphTransform *transform;
     INT result;
     INT ret;
     
     result = SYSTEM_NORMAL_RETURN;
     
     rxnset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     rxnlist = GetListOfReactions(bind);
     transformset = AllocateTransformSet;
     CreateTransformSet(transformset,rxnlist->ID,rxnlist->Name,
			rxnlist->NumberOfPoints,
			0);
     
     rxnid = rxnlist->Points;
     transform = transformset->Set;
     LOOPi(rxnlist->NumberOfPoints)
	  {
	  rxn = FindReactionInReactionSet(*rxnid,rxnset);	  

	  transform  = AllocateGraphTransform;
	  ret = ConvertReactionToGraphTransform(transform,rxn,bind);
	  if(ret == SYSTEM_NORMAL_RETURN)
	    {
	      /*PrintPrettyReactionInfo("Reaction",stdout,rxn,rxnset->PropertyTypes);*/
	      /*PrintPrettyGraphTransform("",stdout,transform);*/
	    }
	  else
	    {
	      printf("Error in transform in reaction: %d\n",*rxnid);
	      result = SYSTEM_ERROR_RETURN;
	    }
	  /*PrintPrettyGraphTransform("AtomsInTransformForGraph ->Transform: ",stdout,transform);*/

	  rxnid++;
	  transform++;
	  }
     
     return(result);
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
extern INT ConvertReactionToGraphTransform(GraphTransform *transform,
					    ReactionInfo *rxn,
					    BindStructure *bind)
{
  INT *rxnmol,i;
  Graph *lhs,*rhs;
  RxnCorrespondenceSet *rxncorr;
  Graph *graph;
  int success;
  
  success = SYSTEM_NORMAL_RETURN;
  
  CreateGraphTransform(transform,
		       rxn->ID,rxn->Name,
		       rxn->NumberOfReactants,
		       rxn->NumberOfProducts,
		       0,0,0,0);
  rxncorr = rxn->TotalCorr;
  transform->Nodes = CorrespondencesToSetOfNodeTransforms(rxn,rxncorr);
  transform->Bonds = 
    CorrespondencesToBondTransformSet(rxn,rxncorr->BondChanges);
  
  rxnmol = rxn->Reactants;
  lhs = transform->GraphLHS;
  LOOPi(transform->NumberLHS)
    {
      graph = GraphFromMolecule(*rxnmol,VALENCE_STANDARD,bind);
      /*PrintPrettyGraph("ConvertReactionToGraphTransform:  ",stdout,graph);*/
      if(graph != NULL)
	{
	  AtomsInTransformForGraph(lhs,REACTANT,i,graph,transform);
	  FreeGraph(graph);
	  Free(graph);
	}
      else
	{
	  printf("Problems in left hand side transformation: %s \n",rxn->Name);
	  success = SYSTEM_ERROR_RETURN;
	}
      
      lhs++;
      rxnmol++;
    }
  
  rxnmol = rxn->Products;
  rhs = transform->GraphRHS;
  LOOPi(transform->NumberRHS)
    {
      graph = GraphFromMolecule(*rxnmol,VALENCE_STANDARD,bind);
      /*PrintPrettyGraph("ConvertReactionToGraphTransform:  ",stdout,graph);*/
      if(graph != NULL)
	{
	  AtomsInTransformForGraph(rhs,PRODUCT,i,graph,transform);
	  FreeGraph(graph);
	  Free(graph);
	}
      else
	{
	  printf("Problems in right hand side transformation: %d \n",transform->ID);
	  success = SYSTEM_ERROR_RETURN;
	}
      rhs++;
      rxnmol++;
    }
  /*PrintPrettyGraphTransform("Transform: ",stdout,transform);*/
  return success;
}

/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void AtomsInTransformForGraph(Graph *new,
				       INT flag, INT molid, Graph *graph,
				       GraphTransform *transform) {
  SetOfNodeTransforms *set;
  Graph *reduced;
  DataSubSet *atomset;
  GraphNode *gnode;
  NodeTransform *node;
  INT i,*atomid,length;
  CHAR *str;
  /*PrintPrettyGraphTransform("AtomsInTransformForGraph ->Transform: ",stdout,transform);*/
  set = transform->Nodes;
  atomset = AllocateDataSubSet;
  CreateDataSubSet(atomset,graph->ID,graph->Name,
	 graph->NumberOfNodes,graph->NumberOfNodes,0);
  atomset->NumberOfPoints = 0;  
  atomid = atomset->Points;
  node = set->Transforms;
  LOOPi(set->NumberOfNodeTransforms) {
    switch(flag) {
    case REACTANT:
      gnode = node->LHSnode;
      break;
    case PRODUCT:
      gnode = node->RHSnode;
      break;
    default:
      gnode = 0;
      break;
    }
    if(gnode->Molecule == molid) {
      *atomid = gnode->GNode;
      atomid++;
      atomset->NumberOfPoints +=1;
    }
    node++;
  }
  if(atomset->NumberOfPoints < graph->NumberOfNodes) {
    printf("Not all Correspondences were specified.. could be problems\n");
    PrintPrettyGraph("Error--->",NULL,graph);
    str = AllocateString(1000);
    length = 1000;
    printf("DataSet: %d\n", atomset->NumberOfPoints);
    PrintStringDataSubSet(str,"Error->",&length,atomset);
    printf("%s\n",str);
    reduced = IsolateGraphWithDataSubSet(graph,atomset);
    CopyFullGraph(new,reduced);
    FreeGraph(reduced);
    Free(reduced);
  }
  else
    CopyFullGraph(new,graph);
}

/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/     
static SetOfNodeTransforms 
     *CorrespondencesToSetOfNodeTransforms(ReactionInfo *rxn,
					   RxnCorrespondenceSet *corrs)
     {
     SetOfNodeTransforms *nodetrans;
     RxnUnMatchedSet *unmatchedr;
     
     unmatchedr = corrs->UnMatched;
     nodetrans = AllocateSetOfNodeTransforms;
     CreateSetOfNodeTransforms(nodetrans,corrs->ID,corrs->Name,
			       corrs->NumberOfCorrs,
			       0,
			       unmatchedr->NumberUnMatchedAtoms,
			       0,
			       0,0);
     
     TranslateAtomCorrespondences(corrs,nodetrans,rxn);
     TranslateUnmatch(unmatchedr,nodetrans,REACTANT,rxn);
     return(nodetrans);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void TranslateAtomCorrespondences(RxnCorrespondenceSet *corrs,
					 SetOfNodeTransforms *nodetrans,
					 ReactionInfo *rxn)
     {
     RxnAtomCorrespondence *corratom;
     NodeTransform *node;
     GraphNode *lhs,*rhs;
     RxnAtom *reactant,*product;
     INT i,rmol,pmol;
     
     corratom = corrs->Corrs;
     node = nodetrans->Transforms;
     LOOPi(nodetrans->NumberOfNodeTransforms)
	  {
	  CreateNodeTransform(node,corratom->ID,corratom->Name,
			      0,0);
	  lhs = node->LHSnode = AllocateGraphNode;
	  rhs = node->RHSnode = AllocateGraphNode;
	  
	  reactant = corratom->Reactant;
	  product = corratom->Product;
	  
	  /*
	  rmol = MoleculeGraphCorrespondence(REACTANT,
					     reactant->MoleculeNumber,
					     rxn);
	  pmol = MoleculeGraphCorrespondence(PRODUCT,
					     product->MoleculeNumber,
					     rxn);
	  */
	  rmol = corratom->ReactantPosition;
	  pmol = corratom->ProductPosition;
	  CreateGraphNode(lhs,reactant->ID,reactant->Name,
			  rmol,reactant->AtomNumber);
	  CreateGraphNode(rhs,product->ID,product->Name,
			  pmol,product->AtomNumber);
	  
	  corratom++;
	  node++;
	  }
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void TranslateUnmatch(RxnUnMatchedSet *unmatched, 
			     SetOfNodeTransforms *nodetrans,
			     INT flag,
			     ReactionInfo *rxn)
     {
     RxnAtom *rxnunmatched;
     GraphNode *grpunmatched;
     INT i,mol;
     
     switch(flag)
	  {
     case PRODUCT:
	  grpunmatched = nodetrans->PUnmatched;
	  break;
     case REACTANT:
	  grpunmatched = nodetrans->RUnmatched;
	  break;
     default:
	  grpunmatched = 0;
	  break;
	  }
     
     rxnunmatched = unmatched->UnMatchedAtoms;
     LOOPi(nodetrans->NumberRUnmatched)
	  {
	  mol = MoleculeGraphCorrespondence(flag,
					    rxnunmatched->MoleculeNumber,
					    rxn);
	  CreateGraphNode(grpunmatched,i,rxnunmatched->Name,
			  mol,rxnunmatched->AtomNumber);
	  grpunmatched++;
	  rxnunmatched++;
	  }
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static BondTransformSet *CorrespondencesToBondTransformSet(ReactionInfo *rxn,
							 RxnBondChanges *bonds)
     {
     BondTransformSet *grpbonds;
     BondTransforms *lhsbond, *rhsbond;
     RxnBond *bond;
     INT i,type;
     GraphBond *lbond,*rbond;
     
     grpbonds = AllocateBondTransformSet;
     CreateBondTransformSet(grpbonds,bonds->ID,bonds->Name,
			    0,0);
     lhsbond = grpbonds->LHStransform = AllocateBondTransforms;
     rhsbond = grpbonds->RHStransform = AllocateBondTransforms;
     
     CreateBondTransforms(lhsbond,rxn->ID,rxn->Name,
			  bonds->NumberBondChanges,
			  0,
			  bonds->NumberBondChanges,
			  0);
     CreateBondTransforms(rhsbond,rxn->ID,rxn->Name,
			  bonds->NumberBondChanges,
			  0,
			  bonds->NumberBondChanges,
			  0);

     lhsbond->NumberOfBondsMade = 0;
     rhsbond->NumberOfBondsMade = 0;
     lhsbond->NumberOfBondsBroken = 0;
     rhsbond->NumberOfBondsBroken = 0;
     
     bond = bonds->Changes;
     LOOPi(bonds->NumberBondChanges)
	  {
	  type = bond->Type / 100;
	  switch(type)
	       {
	  case REACTANT:
	       lbond = lhsbond->BondsBroken + lhsbond->NumberOfBondsBroken;
	       rbond = rhsbond->BondsMade + rhsbond->NumberOfBondsMade;
	       rhsbond->NumberOfBondsMade += 1;
	       lhsbond->NumberOfBondsBroken += 1;
	       break;
	  case PRODUCT:
	  default:
	       lbond = lhsbond->BondsMade + lhsbond->NumberOfBondsMade;
	       rbond = rhsbond->BondsBroken + rhsbond->NumberOfBondsBroken;
	       lhsbond->NumberOfBondsMade += 1;
	       rhsbond->NumberOfBondsBroken += 1;
	       break;
	       }
	  
	  MakeBondChange(REACTANT,lbond,bond,rxn);
	  MakeBondChange(PRODUCT,rbond,bond,rxn);
	  bond++;
	  }
     return(grpbonds);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void MakeBondChange(INT flag, GraphBond *gbond, RxnBond *rxnbond,
			   ReactionInfo *rxn)
     {
     RxnAtom *rxnatom1,*rxnatom2;
     INT mol1,mol2;
     
     switch(flag)
	  {
     case PRODUCT:
       if(rxnbond->Atom1 == 0 || rxnbond->Atom2 == 0)
	 {
	   printf("Problem with Reaction Pattern (Reaction Bond): %s\n",rxnbond->Name);
	   rxnatom1 = 0;
	   rxnatom2 = 0;
	 }
       else
	 {
	  rxnatom1 = rxnbond->Atom1->Product;
	  rxnatom2 = rxnbond->Atom2->Product;
	  mol1 = rxnbond->Atom1->ProductPosition;	
	  mol2 = rxnbond->Atom2->ProductPosition;
	 }
	  break;
     case REACTANT:
       if(rxnbond->Atom1 == 0 || rxnbond->Atom2 == 0)
	 {
	   printf("Problem with Reaction Pattern (Reaction Bond): %s\n",rxnbond->Name);
	   rxnatom1 = 0;
	   rxnatom2 = 0;
	 }
       else
	 {
	  rxnatom1 = rxnbond->Atom1->Reactant;
	  rxnatom2 = rxnbond->Atom2->Reactant;
	  mol1 = rxnbond->Atom1->ReactantPosition;	
	  mol2 = rxnbond->Atom2->ReactantPosition;
	 }
	  break;
     default:
	  rxnatom1 = 0;
	  rxnatom2 = 0;
	  }
     
     /*    
     mol1 = MoleculeGraphCorrespondence(flag,rxnatom1->MoleculeNumber,rxn);
     mol2 = MoleculeGraphCorrespondence(flag,rxnatom2->MoleculeNumber,rxn);
     */
     CreateGraphBond(gbond,rxnbond->ID,rxnbond->Name,
		     mol1,
		     rxnatom1->AtomNumber,
		     mol2,
		     rxnatom2->AtomNumber,
		     rxnbond->Type);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT MoleculeGraphCorrespondence(INT flag, INT molid, 
				       ReactionInfo *rxn)
     {
     INT num,count,done,*mols;
     
     if(molid == -1)
	  return(-1);
     
     switch(flag)
	  {
     case PRODUCT:
	  num = rxn->NumberOfProducts;
	  mols = rxn->Products;
	  break;
     case REACTANT:
	  num = rxn->NumberOfReactants;
	  mols = rxn->Reactants;
	  break;
     default:
	  num = 0;
	  mols = 0;
	  break;
	  }
     
     done = -1;
     count = 0;
     while(done == -1 &&
	   count < num)
	  {
	  if(molid == *mols) 
	       done = count;
	  mols++;
	  count++;
	  }
     
     return(done);
     }

