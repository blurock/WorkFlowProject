/*  FILE     objfind.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Automatic Generation of Molecule ID
**    Find Identical Structures in Database
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

 
/*F ret = InitializeReactionClassifications(BindStructure *bind)
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
extern INT InitializeReactionClassifications(BindStructure *bind)
     {
     ReactionSet *bindrxns;
     ReactionInfo *rxninfo;
     INT i,id;
     ObjectClassification *classification;
     
     bindmols = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     classification = FindClassification(REACTION_DATABASE,LOCAL_CLASSIFICATIONS,bind);
     FreeObjectIDTreeNode(classification->TreeOfObjects);
     CreateObjectIDTreeNode(classification->TreeOfObjects,
			    classification->ID,classification->Name,
			    0,0,0);
     
     rxninfo = bindrxns->Reactions;
     LOOPi(bindmols->NumberOfReactions)
	  {
	  id = DetermineObjectID((VOID) rxninfo,
				 REACTION_DATABASE,
				 LOCAL_CLASSIFICATIONS,
				 bind);
	  if(id == 0)
	       rxninfo->ID = AddObjectToIDClass(rxninfo,classification,bind);
	  else
	       rxninfo->ID = id;
	  
	  rxninfo++;
	  }
     return(SYSTEM_NORMAL_RETURN);
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
extern ListOfTreeLevelDescriptions *InitializeReactionTreeDescription(INT id, CHAR *name)
     {
     ListOfTreeLevelDescriptions *descr;
     TreeLevelDescription *level;
     
     descr = AllocateListOfTreeLevelDescriptions;
     CreateListOfTreeLevelDescriptions(descr,id,name,
				       4,0,BIND_CURRENT_REACTIONS,id,DB_NAME_SEARCH);

     level = descr->Levels;
      
