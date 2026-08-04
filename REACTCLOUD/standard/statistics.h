#include "stats/simpstat.h"
#include "stats/factor.h"
#include "stats/regres.h"
#include "stats/statmaster.h"

#define BIND_STATISTICSMASTER 1003

/***************************************************************************/
/* statbind.c */
/***************************************************************************/
extern INT FreeStructStatisticsMaster(BindStructure *bind);
extern INT FreeStructSimpleStatistics(BindStructure *bind);
extern INT FreeStructFactorAnalysis(BindStructure *bind);
extern INT FreeStructRegression(BindStructure *bind);
extern INT FreeStructUniClusters(BindStructure *bind);
extern INT GetPrereqStatisticsMaster(BindStructure *bind);
extern INT GetPrereqSimpleStatistics(BindStructure *bind);
extern INT GetPrereqFactorAnalysis(BindStructure *bind);
extern INT GetPrereqRegression(BindStructure *bind);
extern INT GetPrereqUniClusters(BindStructure *bind);
extern INT GetAgeStatisticsMaster(BindStructure *bind);
extern INT GetAgeSimpleStatistics(BindStructure *bind);
extern INT GetAgeFactorAnalysis(BindStructure *bind);
extern INT GetAgeRegression(BindStructure *bind);
extern INT GetAgeUniClusters(BindStructure *bind);
extern INT GetStructStatisticsMaster(BindStructure *bind);
extern INT GetStructSimpleStatistics(BindStructure *bind);
extern INT GetStructUniClusters(BindStructure *bind);
extern INT GetStructRegression(BindStructure *bind);
extern INT GetStructFactorAnalysis(BindStructure *bind);
extern INT GetStructStatisticsMaster(BindStructure *bind);
extern INT FormStructUniClusters(BindStructure *bind);
extern INT FormStructSimpleStatistics(BindStructure *bind);
extern INT FormStructRegression(BindStructure *bind);
extern INT FormStructFactorAnalysis(BindStructure *bind);
extern INT FormStructStatisticsMaster(BindStructure *bind);


/***************************************************************************/
/* routines.c */
/***************************************************************************/
extern FunctionList *MergeFunctStatistics(FunctionList *old);
extern FunctionList *MergeXFunctStatistics(FunctionList *old);
/***************************************************************************/
/* simple.c */
/***************************************************************************/

extern SetOfSysSamData *SetOfComputeDataStatistics(DataSubSet *subset,
						   SysSamVectorSet *syssamset);
extern CHAR *PrintStringSimpleStatistics(CHAR *string, CHAR *prefix, INT *length,
					 SetOfSysSamData *set,int full);

extern CHAR *PrintStringSysSamVectorDataBasic(CHAR *string, CHAR *prefix, INT *length,
					 SysSamVectorData *varstat);
extern CHAR *PrintStringSysSamVectorDataValues(CHAR *string, CHAR *prefix, INT *length,
					 SysSamVectorData *varstat);
extern SysSamStats *ComputeSysSamStats(SysSamVectorData *stat,
				       DataSubSet *subset,
				       SysSamVector *syssam);
extern void CalcSysSamVectorData(SysSamVectorData *stat,
				 DataSubSet *subset,
				 SysSamVector *syssam);

/***************************************************************************/
/* statmain.c */
/***************************************************************************/

extern StatisticsMaster *InitializeStatisticsMaster(INT ID, CHAR *name);
extern INT SetStatisticsConstants(BindStructure *bind);
extern INT PrintSimpleStats(BindStructure *bind);

/***************************************************************************/
/* Xshow.c */
/***************************************************************************/

extern INT DrawChoiceOfVariablesForStats(BindStructure *bind);

/***************************************************************************/
/* univar.c */
/***************************************************************************/

extern INT GetUniVariateCluster(BindStructure *bind);
extern INT MasterComputeUniVariateCluster(BindStructure *bind);
extern UniVariateClusterSet *InitializeClusterSet(DatMatMaster *datmat,
						  StatisticsMaster *statmaster,
						  INT numclusters);
extern INT CalculateUniVariateCluster(DatMatMaster *datmat,
				      StatisticsMaster *statmaster);
extern void SetUpSimpleDivisions(SysSamVectorData *varstat);

/***************************************************************************/
/* divisions.c */
/***************************************************************************/

extern void ConvertStringToDivisions(CHAR *vardivs,
				     SysSamVector *syssam,
				     DatMatMaster *datmat,
				     UniVariateCluster *varinfo);
