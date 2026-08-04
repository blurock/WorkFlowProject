/*  FILE     genfunc.c
**  PACKAGE  chemdb
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The list of functions for the menu system
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

#define NUMBER_GENTRANS_FUNCTIONS  1

static FunctionInfo GENTRANS_FUNCTION_LIST[NUMBER_GENTRANS_FUNCTIONS] = {
     {1,"PerformChain",(INT (*)(void)) PerformChain} 
     };

static FunctionList GENTRANS_FUNCTIONS = {
        0,"ReactionGeneration",
    	NUMBER_GENTRANS_FUNCTIONS,
	GENTRANS_FUNCTION_LIST
	};

/****************************************************************************/
extern FunctionList *MergeFunctGenTrans(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
				  old, &GENTRANS_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }
