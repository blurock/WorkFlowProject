#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "matrix0.h"
#include "cluster.h"
#include "statistics.h"

extern INT PrintSimpleStats(BindStructure *bind)
     {
     StatisticsMaster *statmaster;
     CHAR *string;
     INT length;
     SysSamVectorData *varstat;
     INT i;
     
     GetStructSimpleStatistics(bind);
     string = AllocateString(5 * PRINT_BUFFER_LENGTH);
     length = 5 * PRINT_BUFFER_LENGTH;

     printf("Simple Variable Statistics\n");
     statmaster = GetBoundStructure(bind,BIND_STATISTICSMASTER);
     PrintStringSimpleStatistics(string,"",&length,statmaster->Simple,0);
     printf(string);

/*
     varstat = statmaster->Simple->Stats;
     LOOPi(set->NumberOfVariables)
	  {
	  string = PrintStringSysSamVectorDataBasic(string,prefix,length,varstat);
          printf(string);
	  varstat++;
	  }
*/   
     Free(string);
     
     return(NORMAL_RETURN);
     
     }
