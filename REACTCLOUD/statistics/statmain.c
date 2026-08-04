#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "matrix0.h"
#include "cluster.h"
#include "statistics.h"

extern StatisticsMaster *InitializeStatisticsMaster(INT id, CHAR *name)
     {
     StatisticsMaster *statmaster;
     
     statmaster = AllocateStatisticsMaster;
     CreateStatisticsMaster(statmaster,id,name,
			    0,0,0,0,0);
     return(statmaster);
     }


extern INT SetStatisticsConstants(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     StatisticsMaster *statmaster;
     StatisticsConstants *constants;
     ClusterConstants *cluster;
     
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     if(statmaster->Constants == 0)
	  constants = statmaster->Constants = AllocateStatisticsConstants;
     else
	  {
	  constants = statmaster->Constants;
	  FreeStatisticsConstants(constants);
	  }
     CreateStatisticsConstants(constants,statmaster->ID, statmaster->Name,0);

     cluster = constants->Cluster = AllocateClusterConstants;
     CreateClusterConstants(cluster,statmaster->ID,statmaster->Name,
			    0,0,0.0,0,0);
     cluster->NumClusters = GetCurrentIntegerArgument("NumClusters",
						      commandmaster);
     cluster->MaxCycles = GetCurrentIntegerArgument("MaxCycles",
						    commandmaster);
     cluster->Optimized = GetCurrentIntegerArgument("Optimized",
						    commandmaster);
     cluster->Debug = GetCurrentIntegerArgument("Debug",
						commandmaster);
     cluster->Tiny = GetCurrentIntegerArgument("Tiny",
					       commandmaster);

     return(NORMAL_RETURN);
     }
     

