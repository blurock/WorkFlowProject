#include "basic.h"
#include "comlib.h"

extern INT GetOldestAge()
     {
     return(AGE_BEGIN);
     }

extern INT InitializeAge(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     INT age;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     if(commandmaster != 0)
	  {
	  if(commandmaster->Source != 0)
	       commandmaster->Source->ID = AGE_BEGIN;
	  else
	       age = -1;
	  }
     else
	  age = -1;
     return(age);
     }

     

extern INT GetCurrentAge(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     INT age;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     if(commandmaster != 0)
	  {
	  if(commandmaster->Source != 0)
	       age = commandmaster->Source->ID;
	  else
	       age = AGE_ERROR;
	  }
     else
	  age = AGE_ERROR;
     return(age);
     }

extern void IncrementAge(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     INT age;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     if(commandmaster != 0)
	  {
	  if(commandmaster->Source != 0)
	       commandmaster->Source->ID += 1;
	  }
     }
