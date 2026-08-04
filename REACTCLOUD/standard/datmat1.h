#include "datmat0.h"

/****************************************************************************/
/* Bound Structures */
/****************************************************************************/
#define BIND_DATMATMASTER          1001

/****************************************************************************/
/* datmat1.c routines */
/****************************************************************************/
extern FunctionList *MergeFunctSysSam(FunctionList *old);
extern FunctionList *MergeFunctVarList(FunctionList *old);
extern FunctionList *MergeFunctSubSet(FunctionList *old);
extern FunctionList *MergeFunctDatMat(FunctionList *old);
extern DatMatMaster *InitializeDatMatMaster(INT id, CHAR *name);
/****************************************************************************/
/* DatMat routines */
/****************************************************************************/
extern INT GetConstantsDatMat(BindStructure *bind);
extern INT GetPrereqDatMat(BindStructure *bind);
extern INT GetConstantsDatMat(BindStructure *bind);
extern INT GetAgeDatMat(BindStructure *bind);
extern INT FreeStructDatMat(BindStructure *bind);
extern INT GetStructDatMat(BindStructure *bind);
extern INT FormStructDatMat(BindStructure *bind);

/****************************************************************************/
/* SysSamVectorSet routines */
/****************************************************************************/
extern INT GetPrereqSysSamVectorSet(BindStructure *bind);
extern INT GetConstantsSysSamVectorSet(BindStructure *bind);
extern INT GetAgeSysSamVectorSet(BindStructure *bind);
extern INT FreeStructSysSamVectorSet(BindStructure *bind);
extern INT FormStructSysSamVectorSet(BindStructure *bind);
extern INT GetStructSysSamVectorSet(BindStructure *bind);
extern INT DatMatPrintSysSam(BindStructure *bind);
/****************************************************************************/
/* DataSubSet routines */
/****************************************************************************/
extern INT GetPrereqDataSubSet(BindStructure *bind);
extern INT GetPrereqDataTestBlock(BindStructure *bind);
extern INT GetConstantsDataSubSet(BindStructure *bind);
extern INT GetConstantsDataTestBlock(BindStructure *bind);
extern INT GetAgeDataSubSet(BindStructure *bind);
extern INT GetAgeDataTestBlock(BindStructure *bind);
extern INT FreeStructDataSubSet(BindStructure *bind);
extern INT FreeStructDataTestBlock(BindStructure *bind);
extern INT GetStructDataSubSet(BindStructure *bind);
extern INT FormStructDataSubSet(BindStructure *bind);
extern INT GetStructDataTestBlock(BindStructure *bind);
extern INT FormStructDataTestBlock(BindStructure *bind);

extern INT DatMatFormFromRanges(BindStructure *bind);
extern INT DatMatFormRandomly(BindStructure *bind);
extern INT DatMatGoalNoMissing(BindStructure *bind);
extern INT DatMatDescNoMissing(BindStructure *bind);

/****************************************************************************/
/* VarList routines */
/****************************************************************************/
extern INT GetPrereqSystemVariablePair(BindStructure *bind);
extern INT GetConstantsSystemVariablePair(BindStructure *bind);
extern INT GetAgeSystemVariablePair(BindStructure *bind);
extern INT FreeStructSystemVariablePair(BindStructure *bind);
extern INT GetStructSystemVariablePair(BindStructure *bind);
extern INT FormStructSystemVariablePair(BindStructure *bind);
extern INT DatMatVarListPrint(BindStructure *bind);


