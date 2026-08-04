#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "matrix0.h"
#include "cluster.h"
#include "statistics.h"


#define NUMBER_STATISTIC_FUNCTIONS  4

static FunctionInfo STATISTIC_LIST[NUMBER_STATISTIC_FUNCTIONS] = {
     {1,"FormStructSimpleStatistics",FormStructSimpleStatistics},
     {2,"FormStructUniClusters",FormStructUniClusters},
     {3,"GetClusterCenters",GetClusterCenters},
     {4,"PrintSimpleStats",PrintSimpleStats}
     };

FunctionList STATISTIC_FUNCTIONS = {
        0,"System",
    	NUMBER_STATISTIC_FUNCTIONS,
	STATISTIC_LIST
	};
     
extern FunctionList *MergeFunctStatistics(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
			     old, &STATISTIC_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }


