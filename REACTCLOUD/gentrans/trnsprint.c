/*  FILE     trnsprint.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Print as string or to file GraphTransform structures and substructures
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


extern void PrintPrettyLevelResult(PerformedRxnMaster *rxnpmaster)
     {
     printf("-----------------------------------------------------------------\n");
     PrintPrettySetOfGraphs("--->",stdout,rxnpmaster->Molecules);
     PrintPrettySetOfPerformedRxns("---> ",stdout,rxnpmaster->Performed);
     fflush(stdout);
     }

extern void PrintPrettySetOfPerformedRxns(CHAR *prefix, FILE *out,
					  SetOfPerformedRxns *prxns)
     {
     CHAR *string;
     PerformedRxn *prxn;
     INT i;
     
     if(prxns == 0)
	  {
	  fprintf(out,"%s: No Performed Reactions In SetOfPerformedRxns\n",prefix);
	  }
     else
	  {
	  string = AllocateString(LINELENGTH);
	  fprintf(out,"%s: SetOfPerformedRxns(%d::%s) -- %5d Results\n",
		  prefix,
		  prxns->ID,
		  prxns->Name,
		  prxns->NumberOfReactions);
	  
	  prxn = prxns->Reactions;
	  LOOPi(prxns->NumberOfReactions)
	       {
	       sprintf(string,"%s:%5d >>>  ",prefix,i);
	       PrintPrettyPerformedRxns(string,out,prxn);
	       prxn++;
	  }
	  Free(string);
	  }
     }

extern void PrintPrettyPerformedRxns(CHAR *prefix, FILE *out,
				     PerformedRxn *prxn)
{
  INT i,*id,prt;

  prt = 0;
     
  if(prxn->Info->Forward != 0)
    {
      if(prxn->Info->Forward->Aconstant > 1e-20)
	prt = 1;
    }
  else if(prxn->Info->Reverse != 0)
    {
      if(prxn->Info->Reverse->Aconstant > 1e-20)
	prt = 1;
    }
     
  if(prt == 1)
    {
    
      fprintf(out,"%s: (%8d::%-40s)   <%5d,%5d>\n",
	      prefix,prxn->ID,prxn->Name,
	      prxn->NumberOfReactants,
	      prxn->NumberOfProducts);
     
      if(prxn->Info->Forward != 0)
	{
	  if(prxn->Info->Forward->Aconstant > 1e-20)
	    fprintf(out,"%s:               Forward: %5d,  %5.2f (%10.3e %10.3e %10.3e)\n",
		    prefix,
		    prxn->Info->Forward->SymmetryFactor,
		    prxn->Info->Forward->Weight+0.0001,
		    prxn->Info->Forward->Aconstant,
		    prxn->Info->Forward->Energy,
		    prxn->Info->Forward->TempExp
		    );
	  else 
	    fprintf(out,"     No Forward Reaction\n");
	}
      else if(prxn->Info->Reverse != 0)
	{
	  if(prxn->Info->Reverse->Aconstant > 1e-20)
	    fprintf(out,"%s:               Reverse: %5d,  %5.2f (%10.3e %10.3e %10.3e)\n",
		    prefix,
		    prxn->Info->Reverse->SymmetryFactor,
		    prxn->Info->Reverse->Weight+0.001,
		    prxn->Info->Reverse->Aconstant,
		    prxn->Info->Reverse->Energy,
		    prxn->Info->Reverse->TempExp
		    );
	  else 
	    fprintf(out,"     No Reverse Reaction\n");
	}
      else 
	fprintf(out,"\n");
     
      fprintf(out,"%s:                      ",prefix);
      id = prxn->ReactantIDs;
      LOOPi(prxn->NumberOfReactants)
	{
	  if(i != 0) fprintf(out,"+");
	  fprintf(out," PP%d ",*id++);
	}
      fprintf(out," -> ");
     
      id = prxn->ProductIDs;
      LOOPi(prxn->NumberOfProducts)
	{
	  if(i != 0) fprintf(out,"+");
	  fprintf(out," PP%d ",*id++);
	}
      fprintf(out,"\n");
    }

}

extern void PrintPrettyGraphTransform(CHAR *prefix,
				      FILE *out,
				      GraphTransform *transform)
     {
     Graph *graph;
     INT i;
     CHAR *line;
     
     line = AllocateString(LINELENGTH);
     
     graph = transform->GraphLHS;
     LOOPi(transform->NumberLHS)
	  {
	  sprintf(line,"LHS Graph:%3d:",i);
	  PrintPrettyGraph(line,out,graph);
	  graph++;
	  }
     
     graph = transform->GraphRHS;
     LOOPi(transform->NumberRHS)
	  {
	  sprintf(line,"RHS Graph:%3d:",i);
	  PrintPrettyGraph(line,out,graph);
	  graph++;
	  }
     
     PrintPrettySetOfNodeTransforms("Transform",out,transform->Nodes);
     PrintPrettyBondTransformSet("Transform",out,transform->Bonds);
     Free(line);
     
     }

extern void PrintPrettySetOfNodeTransforms(CHAR *prefix,
					   FILE *out,
					   SetOfNodeTransforms *transform)
     {
     NodeTransform *nodet;
     GraphNode *unmatched;
     INT i;
     CHAR *string,*line;
     
     line = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);
     
     nodet = transform->Transforms;
     LOOPi(transform->NumberOfNodeTransforms)
	  {
	  sprintf(string,"%3d:",i);
	  StringNodeTransform(string,nodet,line);
	  fprintf(out,"%s\n",line);
	  nodet++;
	  }
     
     unmatched = transform->RUnmatched;
     LOOPi(transform->NumberRUnmatched)
	  {
	  sprintf(string,"LHS unmatched %3d:",i);
	  StringGraphNode(string,unmatched,line);
	  fprintf(out,"%s\n",line);
	  unmatched++;
	  }
     unmatched = transform->PUnmatched;
     LOOPi(transform->NumberPUnmatched)
	  {
	  sprintf(string,"RHS unmatched %3d:",i);
	  StringGraphNode(string,unmatched,line);
	  fprintf(out,"%s\n",line);
	  unmatched++;
	  }
     Free(string);
     Free(line);
     }

extern CHAR *StringNodeTransform(CHAR *prefix, NodeTransform *node, CHAR *line)
     {
     CHAR *lhs,*rhs;
     
     lhs = AllocateString(LINELENGTH);
     rhs = AllocateString(LINELENGTH);
     
     StringGraphNode("",node->LHSnode,lhs);
     StringGraphNode("",node->RHSnode,rhs);
     
     sprintf(line,"%s [ %20s ]->[ %20s ]",prefix,lhs,rhs);
     
     Free(lhs);
     Free(rhs);
     return(line);
     }
extern CHAR *StringGraphNode(CHAR *prefix, GraphNode *node, CHAR *line)
     {
     sprintf(line, "%s(%3d,%3d)",prefix,node->Molecule,node->GNode);
     return(line);
     }

extern void PrintPrettyBondTransformSet(CHAR *prefix, FILE *out, 
					BondTransformSet *set)
     {
     CHAR *string;
     
     string = AllocateString(LINELENGTH);
     
     sprintf(string,"%s:LHS >",prefix);
     PrintPrettyBondTransforms(string,out,set->LHStransform);
     sprintf(string,"%s:RHS >",prefix);
     PrintPrettyBondTransforms(string,out,set->RHStransform);

     Free(string);
     }
extern void PrintPrettyBondTransforms(CHAR *prefix, FILE *out,
				      BondTransforms *transform)
     {
     GraphBond *bond;
     CHAR *line,*string;
     INT i;
     
     line = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);
     
     bond = transform->BondsMade;
     LOOPi(transform->NumberOfBondsMade)
	  {
	  sprintf(string,"%s   Made: ",prefix);
	  StringGraphBond(string,bond,line);
	  fprintf(out,"%s\n",line);
	  
	  bond++;
	  }
     
     bond = transform->BondsBroken;
     LOOPi(transform->NumberOfBondsBroken)
	  {
	  sprintf(string,"%s Broken: ",prefix);
	  StringGraphBond(string,bond,line);
	  fprintf(out,"%s\n",line);
	  bond++;
	  }
     Free(line);
     Free(string);
     }

     
extern CHAR *StringGraphBond(CHAR *prefix, GraphBond *bond, CHAR *line)
     {
     sprintf(line, "%s[(%3d,%3d)-(%3d,%3d)]",prefix,
	     bond->MoleculeI,
	     bond->GNodeI,
	     bond->MoleculeJ,
	     bond->GNodeJ);
     return(line);
     }


