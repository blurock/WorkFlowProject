#include "basic.h"
#include "comlib.h"
#include "datmat1.h"

#define NUMBER_SYSSAM_FUNCTIONS  2
     
FunctionInfo SYSSAM_LIST[NUMBER_SYSSAM_FUNCTIONS] = {
     {1,"FormStructSysSamVectorSet",FormStructSysSamVectorSet},
     {2,"FreeStructSysSamVectorSet",FreeStructSysSamVectorSet}
};

/*
     {3,"DatMatPrintSysSam",DatMatPrintSysSam},
     {4,"DatMatVarListPrint",DatMatVarListPrint}
};
*/
FunctionList SYSSAM_FUNCTIONS = {
        0,"SysSam",
    	NUMBER_SYSSAM_FUNCTIONS,
	SYSSAM_LIST
	};

extern FunctionList *MergeFunctSysSam(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
			     old, &SYSSAM_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }

#define NUMBER_VARLIST_FUNCTIONS  2
     
FunctionInfo VARLIST_LIST[NUMBER_VARLIST_FUNCTIONS] = {
     {1,"FormStructSystemVariablePair",FormStructSystemVariablePair},
     {2,"FreeStructSystemVariablePair",FreeStructSystemVariablePair}
};


FunctionList VARLIST_FUNCTIONS = {
        0,"VarList",
    	NUMBER_VARLIST_FUNCTIONS,
	VARLIST_LIST
	};
extern FunctionList *MergeFunctVarList(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
			     old, &VARLIST_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }

#define NUMBER_SUBSET_FUNCTIONS  8
     
FunctionInfo SUBSET_LIST[NUMBER_SUBSET_FUNCTIONS] = {
     {1,"FormStructDataSubSet",FormStructDataSubSet},
     {2,"FormStructDataTestBlock",FormStructDataTestBlock},
     {3,"FreeStructDataSubSet",FreeStructDataSubSet},
     {4,"FreeStructDataTestBlock",FreeStructDataTestBlock},
     {5,"DatMatFormFromRanges",DatMatFormFromRanges},
     {6,"DatMatFormRandomly",DatMatFormRandomly},
     {7,"DatMatGoalNoMissing",DatMatGoalNoMissing},
     {8,"DatMatDescNoMissing",DatMatDescNoMissing}
};


FunctionList SUBSET_FUNCTIONS = {
        0,"SubSet",
    	NUMBER_SUBSET_FUNCTIONS,
	SUBSET_LIST
	};

extern FunctionList *MergeFunctSubSet(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
			     old, &SUBSET_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }

extern FunctionList *MergeFunctDatMat(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctSysSam(old);
     new = MergeFunctVarList(new);
     new = MergeFunctSubSet(new);
     return(new);
     }

/****************************************************************************/
/* General Routines */
/****************************************************************************/ 
extern DatMatMaster *InitializeDatMatMaster(INT id, CHAR *name)
    {
     DatMatMaster *datmat;
     
     datmat = AllocateDatMatMaster;
     CreateDatMatMaster(datmat,id,name,
			0,0,0,0,0,0);
     datmat->Constants = AllocateDatMatConstants;
     
     return(datmat);
     }
     
