#include "basic.h"

#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "rxn.h"

#define NUMBER_REACTIONS_FUNCTIONS 8

static FunctionInfo REACTIONS_FUNCTION_LIST[NUMBER_REACTIONS_FUNCTIONS] = 
     {
     {1,"MasterPrintReactionSet",(INT (*)(void)) MasterPrintReactionSet},
     {2,"MasterPrintRxnPatterns",(INT (*)(void)) MasterPrintRxnPatterns},
     {3,"ReadInReactionsFromList",(INT (*)(void)) ReadInReactionsFromList},
     {4,"ReadInRxnPatternsFromList",(INT (*)(void)) ReadInRxnPatternsFromList},
     {5,"ReadInASCIISetOfReactions",(INT (*)(void)) ReadInASCIISetOfReactions},
     {6,"ReadInASCIISetOfRxnPatterns",(INT (*)(void)) ReadInASCIISetOfRxnPatterns},
     {7,"FindReactionPattern",(INT (*)(void)) FindReactionPattern},
     {8,"MasterReactionOrder",(INT (*)(void)) MasterReactionOrder}
};


static FunctionList REACTIONS_FUNCTIONS = {
        0,"System",
    	NUMBER_REACTIONS_FUNCTIONS,
	REACTIONS_FUNCTION_LIST
	};

extern FunctionList *MergeFunctReactions(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
			     old, &REACTIONS_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }




