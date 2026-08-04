#include "datmat/dtard.h"
#include "datmat/samstr.h"
#include "datmat/subset.h"
#include "datmat/varlst.h"
#include "datmat/datmat.h"

#define DATMAT_NORMAL_RETURN     0
#define DATMAT_ERROR_RETURN      -1

/********************************************************************************/
/* System Sample Information
*/
/********************************************************************************/
/* Variable Type Definitions
*/
/* static float fltexp;*/
#define FLOATVAR         0
#define FLOATSIZE        sizeof(FLOAT)
#define FLOATMISSING     ((FLOAT) FLT_MAX)
#define FLOATGE          &GreaterEqualFloat
#define FLOATMISSINGPRED &MissingElementFloat

/*static INT intexp;*/
#define INTEGERVAR         1
#define INTEGERSIZE        sizeof(INT)
#define INTEGERMISSING     INT_MAX
#define INTEGERGE          &GreaterEqualInteger
#define INTEGERMISSINGPRED &MissingElementInteger

#define BaseTypeTransferFromPntr(type, dest, source) \
    switch(type) \
          { \
          case INTEGERVAR: \
               dest.Integer = source->Integer; \
               break; \
          case FLOATVAR:\
               dest.Float = source->Float;\
               break;\
          }

/********************************************************************************/
/* External Routines (dtard0)
*/
extern SysSamVectorSet *ReadSysSamVectorSet(FILE *file, INT debug, INT max);
extern INT NumberInBaseVector(BaseVector *vector);
extern int MissingElementInteger(int i, SysSamVector *master );
extern int MissingElementFloat(int i, SysSamVector *master );

/********************************************************************************/
/* Command Routines and Master Utility Routines  (dtard1)
*/
extern INT MasterGetSysSamVectorSet(DatMatMaster *master);
extern INT MasterFreeSysSamVectorSet(DatMatMaster *master);
extern CHAR *PrintStringSysSamVectorSet(CHAR *out, CHAR *prefix,
					INT *bufferleft,
					SysSamVectorSet *syssamset,
					INT latex);
/********************************************************************************/
/* External Routines (samstr0)
*/
extern FLOAT NthSysSamVectorAsFloat(SysSamVector *data, int ipoint);
extern void InsertFloatToSysSamVector(SysSamVector *data, int ipoint, FLOAT flt);
extern FLOAT *SysSamVecNthFloat(SysSamVector *data, int ipoint);
extern INT *SysSamVecNthInteger(SysSamVector *data, int ipoint);
extern INT MissingValueNth(INT n, SysSamVector *data);
extern void PrintNthData(SysSamVector *data, int ipoint);
extern void FilePrintNthData(FILE *file, SysSamVector *data, int ipoint);
extern int FindSystemVariableName(SysSamVectorSet *set, char *name);
extern SysSamVector *NthSysSamVec(INT n, SysSamVectorSet *syssampvec);
extern INT SysSamNumberOfSamples(SysSamVectorSet *set);
extern BaseType *ConvertStringToVector(int Type,int *count, char *string,int max);
extern CHAR *ConvertBaseTypeToString( int type, BaseType *base, char *string);
extern void ConvertString(int Type, char *string, BaseType *basis);
extern SysSamVectorSet *CombineSysSamVectorSet(INT id, CHAR *name,
					       SysSamVectorSet *set1,
					       SysSamVectorSet *set2);
extern CHAR *PrintStringBaseType(CHAR *string, CHAR *prefix, INT *length,
				 INT width,
				 BaseType *base);

/********************************************************************************/
/* External Routines (samstr1.c)
*/
extern DataSubSet *FindMissingPoints(DataSubSet *set, SysSamVector *data);
extern BaseVector *SetUpBaseVector(INT id,
                            CHAR *name,
                            INT type,
                            SysSamVector *data,
                            DataSubSet *subset);
extern SysSamVectorSet *DataSubSetToSysSam(DataSubSet *subset,
                                           DataSubSet *fullset);
extern BaseType *FindLowestValue(DataSubSet *set, SysSamVector *data);
extern void SetUpNthBaseTypeFromBaseVector(BaseType *base,
					   INT point,
					   BaseVector *data);

/********************************************************************************/
/* External Routines subset0.c
*/
extern DataSubSet *MergeDataSubSets(char *name, int id, 
				    DataSubSet *set1, 
				    DataSubSet *set2);
extern DataSubSet *BuildComplementSet(DataSubSet *original, 
                               DataSubSet *subset, 
                               char *name);
extern DataSubSet *CreateRandomSubSet(int percent, DataSubSet *data);
extern DataSubSet *CreateRandomSet(int *points, char *name,int number,int origsize,int max,
                            int *not, int notcount);
extern DataSubSet *CreateCompleteDataSubSet(INT id, CHAR *name, INT n);
extern int IntegerMemberOf(int new, int *points, int length);
extern int ComputeNumberOfPoints(IntegerRangeSet *set);
extern int *ExpandRange(IntegerRange *range, int *points);
extern int *NthDataSubSetPoint(DataSubSet *dataset, int n);

/********************************************************************************/
/* External Routines subset1.c
*/
extern INT MasterGetRawDataSubSet(DatMatMaster *master);
extern INT MasterFreeDataSubSet(DatMatMaster *master);
extern INT ReplaceRawDataSubSet(DatMatMaster *master, DataSubSet *data);
extern void PrintPrettyDataSubSet(FILE *file, CHAR* prefix, DataSubSet *set);
extern CHAR *PrintStringDataSubSet(CHAR *string, 
				 CHAR *prefix,
				 INT *bufferleft,
				   DataSubSet *data);
extern INT MasterGetDataSubSet(DatMatMaster *master);
extern INT MasterGetDataTestBlock(DatMatMaster *master);
extern INT NoMissingPointsInDescr(DatMatMaster *master);
extern INT NoMissingPointsInGoal(DatMatMaster *master);
extern INT FormRandomSetOfDataPoints(DatMatMaster *master);
extern void CreateDataSubSetFromRanges(DatMatMaster *master);
extern INT MasterFreeDataTestBlock(DatMatMaster *master);
/********************************************************************************/
/* External Routines subset2.c
*/
extern CHAR *PrintStringGoalValues(CHAR *string, CHAR *prefix,
				   INT *bufferleft,
				   INT namesize,
				   GoalValueElements *elements);
extern DatMatGoalValues *SetUpDatMatGoalValues(DataSubSet *set,
						 SystemVariableList *varlst,
						 INT style,
					       DatMatMaster *master);
extern void SetUpGoalValueElements(GoalValueElements *elements,
				   INT point,
				   SystemVariableList *varlst,
				   SysSamVectorSet *syssam,
				   INT style);

/********************************************************************************/
/* External Routines varlst0.c
*/
extern VarNames *FindVariableInSystemVariablePair(CHAR *varname, INT id,
						  SystemVariablePair *pair);
extern VarNames *FindVarNamesFromName(CHAR *varname,
				      SystemVariableList *varlist);
extern VarNames *FindVarNamesFromID(INT varid,
				    SystemVariableList *varlist);

/********************************************************************************/
/* External Routines varlst1.c
*/
extern INT MasterFreeSystemVariableList(DatMatMaster *master);
extern CHAR *PrintStringSystemVariableList(CHAR *string,
					   CHAR *prefix,
					   INT *bufferleft,
					   SystemVariableList *list,
					   INT latex);
extern INT MasterGetGoalVarList(DatMatMaster *master);
extern INT MasterGetDescrVarList(DatMatMaster *master);

/********************************************************************************/
/* External Routines varinfo.c
*/
extern void ReplaceSpecificVariableInformation(CHAR *varname, INT id,
					      CHAR *infotype,
					      CHAR *info,
					       DatMatMaster *master);
extern CHAR *GetSpecificVariableInformation(CHAR *varname, INT id,
					    CHAR *infotype,
					    DatMatMaster *master);
extern CHAR *GetVariableListInfo(CHAR *varname, INT id,
				 DatMatMaster *master);
