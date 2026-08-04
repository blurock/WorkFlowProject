#include "basic.h"
#include "comlib.h"

#include "comlib/bind.c"

extern BindStructure *InitializeBindStructure(INT n)
     {
     BindStructure *bind;
     
     bind = AllocateBindStructure;
     
     CreateBindStructure(bind,n,"master",
			 n,0,0,0);
     return(bind);
     }

extern INT BindStructureIntoMaster(VOID structure,
				   INT structureflag,
				   BindStructure *bind)
     {
     VOID *pntr;
     INT next,*flag,error;
     
     next = bind->NumberOfBoundStructures;
     if(next < bind->MaxNumberOfBoundStructures)
	  {
	  bind->NumberOfBoundStructures += 1;
	  
	  pntr = bind->Structures + next;
	  flag = bind->Flags + next;
	  
	  *pntr = structure;
	  *flag = structureflag;
	  error = 0;
	  }
     else 
	  {
	  Error(-1,"Bound Too Many Structures");
	  error = 1;
	  }

     return(error);
     }

extern VOID GetBoundStructure(BindStructure *bind,
			      INT flag)
     {
     INT count,*search;
     VOID *pntr;
     VOID done;
     CommandMaster *commandmaster;
     
     search = bind->Flags;
     pntr = bind->Structures;
     count = 0;
     done = 0;
     while(done == 0 && count < bind->NumberOfBoundStructures)
	  {
	  if(flag == *search) done = *pntr;
	  search++;
	  pntr++;
	  count++;
	  }
     return(done);
     }

