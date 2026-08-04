/*  FILE     longname.c
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
#include "molprops.h"
#include "naming.h"

extern CHAR *GenerateSideGroupNames(Graph *graph, Graph *reference,SetOfGraphs *set);

SetOfGraphs *REFERENCE_SET_OF_MOLECULES;

/*F name = GenerateLongName(graph,set)
**
**  DESCRIPTION
**
**  REMARKS
**
*/
extern CHAR *GenerateLongName(CHAR *molname,INT *molnamecount,MoleculeInfo *molinfo)
{
  CHAR *name,*longname;
  INT ans,length;
  char *c;
  Graph *graph;
  
  graph = GraphFromMolFile(molinfo,VALENCE_STANDARD);
  if(REFERENCE_SET_OF_MOLECULES == NULL) {
    REFERENCE_SET_OF_MOLECULES = GenerateCarbonPaths();
  }
  name = GenerateLongNameUsingSet(graph,REFERENCE_SET_OF_MOLECULES);
  c = strchr(name,'X');
  if(c) {
    Free(name);
    name = AllocateString(LINELENGTH);
    length = LINELENGTH;
    NameOfMolecule(name,&length,molinfo);
  }
  FreeGraph(graph);
  Free(graph);
  PrintStringString(molname,molnamecount,name);
  Free(name);
  return molname;
}
/*F name = GenerateLongName(graph,set)
**
**  DESCRIPTION
**
**  REMARKS
**
*/
extern CHAR *GenerateLongNameUsingSet(Graph *graph, SetOfGraphs *set)
{
  CHAR *name,*longname;
  INT ans;

  name = AllocateString(LINELENGTH);
  longname = AllocateString(LINELENGTH);
  ans = CheckGraphInSet(graph,set);
  if(ans > EQUAL_GRAPH_OFFSET)
    ans -= EQUAL_GRAPH_OFFSET;
  if(ans != -1) {
    name = GenerateSideGroupNames(graph,set->Graphs+ans,set);
    sprintf(longname,"%s%s",name,(set->Graphs+ans)->Name);
  } else {
    sprintf(longname,"(X)");
    printf("no match %s\n",longname);
  }
  Free(name);
  return longname;
  
}
