#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "matrix0.h"
#include "cluster.h"
#include "statistics.h"

extern INT FreeStructStatisticsMaster(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     
     FreeStructSimpleStatistics(bind);
     FreeStructUniClusters(bind);
     FreeStructRegression(bind);
     FreeStructFactorAnalysis(bind);
     
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT FreeStructSimpleStatistics(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     if(statmaster->Simple != 0)
	  {
	  FreeSetOfSysSamData(statmaster->Simple);
	  Free(statmaster->Simple);
	  statmaster->Simple = 0;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT FreeStructFactorAnalysis(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     if(statmaster->FactorRun != 0)
	  {
	  FreeFactorAnalysis(statmaster->FactorRun);
	  Free(statmaster->FactorRun);
	  statmaster->FactorRun = 0;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT FreeStructRegression(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     if(statmaster->RegressionRun != 0)
	  {
	  FreeRegressionSet(statmaster->RegressionRun);
	  Free(statmaster->RegressionRun);
	  statmaster->RegressionRun = 0;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT FreeStructUniClusters(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     if(statmaster->UniClusters != 0)
	  {
	  FreeUniVariateClusterSet(statmaster->UniClusters);
	  Free(statmaster->UniClusters);
	  statmaster->UniClusters = 0;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT GetPrereqStatisticsMaster(BindStructure *bind)
     {
     INT out;
     
     out = GetPrereqSimpleStatistics(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  out = GetPrereqFactorAnalysis(bind);
	  if(out == SYSTEM_NORMAL_RETURN)
	       {
	       out = GetPrereqRegression(bind);
	       if(out == SYSTEM_NORMAL_RETURN)
		    {
		    out = GetPrereqUniClusters(bind);
		    }
	       }
	  }
     return(out);
     }

extern INT GetPrereqSimpleStatistics(BindStructure *bind)
     {
     INT out;
     
     out = GetStructDatMat(bind);
     SetStatisticsConstants(bind);
     return(out);
     }
extern INT GetPrereqFactorAnalysis(BindStructure *bind)
     {
     INT out;
     
     out = GetStructDatMat(bind);
     SetStatisticsConstants(bind);
     return(out);
     }
extern INT GetPrereqRegression(BindStructure *bind)
     {
     INT out;
     
     out = GetStructDatMat(bind);
     SetStatisticsConstants(bind);
     return(out);
     }
extern INT GetPrereqUniClusters(BindStructure *bind)
     {
     INT out;
     
     out = GetStructDatMat(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  out = GetStructSimpleStatistics(bind);

     SetStatisticsConstants(bind);
     return(out);
     }

extern INT GetAgeStatisticsMaster(BindStructure *bind)
     {
     INT age,newest;
     
     newest = GetAgeSimpleStatistics(bind);
     age = GetAgeFactorAnalysis(bind);
     if(age > newest) newest = age;
     age = GetAgeRegression(bind);
     if(age > newest) newest = age;
     age = GetAgeUniClusters(bind);
     if(age > newest) newest = age;
     return(newest);
     }

     
extern INT GetAgeSimpleStatistics(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     INT age;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     if(statmaster->Simple != 0)
	  age = statmaster->Simple->ID;
     else
	  age = AGE_NOT_FORMED;
     return(age);
     }
extern INT GetAgeFactorAnalysis(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     INT age;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     if(statmaster->FactorRun != 0)
	  age = statmaster->FactorRun->ID;
     else
	  age = AGE_NOT_FORMED;
     return(age);
     }

extern INT GetAgeRegression(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     INT age;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     if(statmaster->RegressionRun != 0)
	  age = statmaster->RegressionRun->ID;
     else
	  age = AGE_NOT_FORMED;
     return(age);
     }
extern INT GetAgeUniClusters(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     INT age;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     if(statmaster->UniClusters != 0)
	  age = statmaster->UniClusters->ID;
     else
	  age = AGE_NOT_FORMED;
     return(age);
     }

extern INT GetStructSimpleStatistics(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     INT out,age;
     
     out = GetPrereqSimpleStatistics(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  age = GetAgeSimpleStatistics(bind);
	  if(age == AGE_NOT_FORMED)
	       age = GetCurrentAge(bind);
	  statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
	  if(statmaster->Simple == 0 ||
	     GetAgeDatMat(bind) > age)
	       {
	       out = FormStructSimpleStatistics(bind);
	       }
	  }
     return(out);
     }

extern INT GetStructUniClusters(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     INT out,age;
     
     out = GetPrereqUniClusters(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  age = GetAgeUniClusters(bind);
	  if(age == AGE_NOT_FORMED)
	       age = GetCurrentAge(bind);
	  statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
	  if(statmaster->UniClusters == 0 ||
	     GetAgeDatMat(bind) > age     ||
             GetAgeSimpleStatistics(bind) > age)
	       out = FormStructUniClusters(bind);
	  }
     return(out);
     }

extern INT FormStructUniClusters(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     
     DatMatMaster *datmat;
     INT out;

     out = GetPrereqUniClusters(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
	  if(statmaster->UniClusters != 0)
	       {
	       FreeUniVariateClusterSet(statmaster->UniClusters);
	       Free(statmaster->UniClusters);
	       }
	  
	  datmat = GetBoundStructure(bind,BIND_DATMATMASTER);
	  statmaster->UniClusters = InitializeClusterSet(datmat,statmaster,
							 statmaster->Constants->Cluster->NumClusters);
	  CalculateUniVariateCluster(datmat,statmaster);
	  
	  if(statmaster->UniClusters != 0)
	       statmaster->UniClusters->ID = GetCurrentAge(bind);
	  else 
	       out = SYSTEM_ERROR_RETURN;
	  }
     return(out);
     }

extern INT FormStructSimpleStatistics(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqSimpleStatistics(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
	  if(statmaster->UniClusters != 0)
	       {
	       FreeSetOfSysSamData(statmaster->Simple);
	       Free(statmaster->Simple);
	       }

	  datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
	  statmaster->Simple 
	       = SetOfComputeDataStatistics(datmatmaster->DataSubSetElement,
					    datmatmaster->SysSamVectorSetElement);
	  if(statmaster->Simple != 0)
	       statmaster->Simple->ID = GetCurrentAge(bind);
	  else
	       out = SYSTEM_NORMAL_RETURN;
	  }


     return(out);
     }

extern INT GetStructStatisticsMaster(BindStructure *bind)
     {
     INT out;
     
     out = GetStructSimpleStatistics(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  GetStructUniClusters(bind);
     return(out);
     }

extern INT GetStructRegression(BindStructure *bind)
     {
     printf("Regression: Not Available at This Time\n");
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT GetStructFactorAnalysis(BindStructure *bind)
     {
     printf("Factor Analysis: Not Available at This Time\n");
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT FormStructRegression(BindStructure *bind)
     {
     printf("Regression: Not Available at This Time\n");
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT FormStructFactorAnalysis(BindStructure *bind)
     {
     printf("Factor Analysis: Not Available at This Time\n");
     return(SYSTEM_NORMAL_RETURN);
     }
extern INT FormStructStatisticsMaster(BindStructure *bind)
     {
     INT out;
     
     out = FormStructSimpleStatistics(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  FormStructUniClusters(bind);
     return(out);
     }


