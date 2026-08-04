/*******************************************************************/
/*
 * -------  Timing Routines ---------
*/
#include "basic.h"
#include "sys/times.h"

#include "stopwatch.h"

static INT GetTime()
     {
     struct tms tbuffer;
     int err;
     INT out;
     
     err = times(&tbuffer);
     
     out = tbuffer.tms_stime;
     
     return(out);
     }


extern TimerSet *InitializeStopWatchSet(INT number)
     {
     TimerSet *set;
     Timer *timer;
     INT i;
     
     set = (TimerSet *) Malloc(sizeof(TimerSet));
     set->NumberOfStopWatches = number;
     
     timer = set->Set = (Timer *) Calloc(number,sizeof(Timer));
     
     LOOPi(number)
	  {
	  timer->ID = i;
	  timer->Name = CopyString("");
	  timer->Begin = 0;
	  timer->TotalTime = 0;
	  timer++;
	  }
     return(set);
     }

extern void FreeStopWatchSet(TimerSet *set)
     {
     Timer *timer;
     INT i;
     
     timer = set->Set;
     LOOPi(set->NumberOfStopWatches)
	  {
	  Free(timer->Name);
	  timer++;
	  }
     Free(set->Set);
     }

extern void InitializeStopWatch(TimerSet *timer, INT n,
				CHAR *name)
     {
     Timer *time;
     
     if(n >= timer->NumberOfStopWatches)
	  Error(n,"Illegal StopWatch");
     else
	  {
	  time = timer->Set + n;
	  Free(time->Name);
	  time->Name = CopyString(name);
	  time->Begin = 0;
	  time->TotalTime = 0;
	  }
     }


extern void StartStopWatch(TimerSet *timer, INT n)
     {
     Timer *time;
     
     if(n >= timer->NumberOfStopWatches)
	  Error(n,"Illegal StopWatch");
     else
	  {
	  time = timer->Set + n;
	  time->Begin = GetTime();
	  }
     }


extern void StopStopWatch(TimerSet *timer, INT n)
     {
     Timer *time;
     INT now,span;
     
     if(n >= timer->NumberOfStopWatches)
	  Error(n,"Illegal StopWatch");
     else
	  {
	  time = timer->Set + n;
	  now = GetTime();
	  span = now - time->Begin;
	  time->TotalTime += span;
	  time->Begin = 0;
	  }
     }

extern void StringStopWatchElement(CHAR *string, TimerSet *timer,
				   INT n)
     {
     Timer *time;
     FLOAT total;
     
     time = timer->Set + n;
     total = time->TotalTime;
     
     sprintf(string,"%10f:%10d:%s",total,n,time->Name);

     }

extern void PrintStopWatches(CHAR *prefix,TimerSet *timer, INT n)
     {
     CHAR *string;
     INT i;
     
     string = AllocateString(LINELENGTH);
     
     LOOPi(n)
	  {
	  StringStopWatchElement(string,timer,i);
	  printf("%s:%s\n",prefix,string);
	  }
     Free(string);
     fflush(stdout);
     }



