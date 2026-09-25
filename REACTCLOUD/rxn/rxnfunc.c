#include "basic.h"

#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"



#define NUMBER_REACTIONS_FUNCTIONS 17

static FunctionInfo REACTIONS_FUNCTION_LIST[NUMBER_REACTIONS_FUNCTIONS] = 
     {
     {1,"MasterPrintReactionSet",(INT (*)(void)) MasterPrintReactionSet},
     {2,"MasterPrintRxnPatterns",(INT (*)(void)) MasterPrintRxnPatterns},
     {3,"ReadInReactionsFromList",(INT (*)(void)) ReadInReactionsFromList},
     {4,"ReadInRxnPatternsFromList",(INT (*)(void)) ReadInRxnPatternsFromList},
     {5,"ReadInASCIISetOfReactions",(INT (*)(void)) ReadInASCIISetOfReactions},
     {6,"ReadInASCIISetOfRxnPatterns",(INT (*)(void)) ReadInASCIISetOfRxnPatterns},
     {7,"FindReactionPattern",(INT (*)(void)) FindReactionPattern},
     {8,"MasterReactionOrder",(INT (*)(void)) MasterReactionOrder},
     {9,"MasterRxnPatternSetInDatabase",(INT (*)(void)) MasterRxnPatternSetInDatabase},
     {10,"ExistenceCheckReactions",(INT (*)(void)) ExistenceCheckReactions},
     {11,"ExistenceCheckRxnPatterns",(INT (*)(void)) ExistenceCheckRxnPatterns},
     {12,"StoreReactions",(INT (*)(void)) StoreReactions},
     {13,"StoreRxnPatterns",(INT (*)(void)) StoreRxnPatterns},
     {14,"FormatCheckASCIIReactions",(INT (*)(void)) FormatCheckASCIIReactions},
     {15,"FormatCheckASCIIRxnPatterns",(INT (*)(void)) FormatCheckASCIIRxnPatterns},
     {16,"FormatCheckReactions",(INT (*)(void)) FormatCheckReactions},
     {17,"FormatCheckRxnPatterns",(INT (*)(void)) FormatCheckRxnPatterns}
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




