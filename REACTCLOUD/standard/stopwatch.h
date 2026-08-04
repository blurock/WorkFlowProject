#define MAXLENGTH               50
typedef struct timer
     {
     INT ID;
     CHAR *Name;
     INT Begin;
     INT TotalTime;
     } Timer;

typedef struct timerset
     {
     INT NumberOfStopWatches;
     Timer *Set;
     } TimerSet;

extern TimerSet *InitializeStopWatchSet(INT number);
extern void FreeStopWatchSet(TimerSet *set);
extern void InitializeStopWatch(TimerSet *timer, INT n,
				CHAR *name);
extern void StartStopWatch(TimerSet *timer, INT n);
extern void StopStopWatch(TimerSet *timer, INT n);
extern void StringStopWatchElement(CHAR *string, TimerSet *timer,
				   INT n);
extern void PrintStopWatches(CHAR *prefix,TimerSet *timer, INT n);
