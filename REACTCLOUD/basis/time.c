/***************************************************************************/
/* Timing Routines
*/
#include "basic.h"
#include <ctype.h>
#include <stdlib.h>

#define NUMBER_OF_TIMING_SECTIONS     50

struct TimeData Total_Time[NUMBER_OF_TIMING_SECTIONS];

extern INT InitializeTiming(INT ID, CHAR *name)
     {
     INT err;
     
     err = 0;
     
     if(ID < NUMBER_OF_TIMING_SECTIONS)
	  {
	  time = TimeData[ID];
	  time->ID = ID;
	  if(name != 0)
	       CopyString(time->Name,name);
	  else
	       time->Name = 0;
	  }
     else
	  {
	  err = 1;
	  Error(ID,"Illegal Timing ID");
	  }
     
     return(err);
     }

extern  InitializeAllTimings()
     {
     INT i;
     

     LOOPi(NUMBER_OF_TIMING_SECTIONS)
	  {
	  InitializeTiming(i,0);
	  }
     
     return(0);
     }

