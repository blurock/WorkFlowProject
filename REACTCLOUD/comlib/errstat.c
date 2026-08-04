#include "basic.h"
#include "comlib.h"

/*******************************************************************************/
/**   Error Utility Routines                                                  **/
/*******************************************************************************/

extern void ErrorStatusSet(CHAR *string, 
			  INT flag,
			  CommandMaster *commandmaster)
     {
     CommandSource *source;
     ErrorStatus *error;
     
     switch(flag)
	  {
     case FATAL:
	  fprintf(stderr,"FATAL ERROR..... ABORTING\n");
	  fprintf(stderr,"%s\n",string);
	  exit(flag);
	  break;
     case RECOVER:
	  source = commandmaster->Source;
	  error = source->ErrorStat;
	  error->EStatus = flag;
     case IGNORE:
	  PrintErrorString(string,commandmaster);
	  break;
	  }
     }

extern INT GetErrorFlag(CommandMaster *commandmaster)
     {
     ErrorStatus *error;
     CommandSource *source;

     source = commandmaster->Source;
     error = source->ErrorStat;
     
     return(error->EStatus);
     }

extern INT ResetErrorFlag(CommandMaster *commandmaster)
     {
     ErrorStatus *error;
     CommandSource *source;

     source = commandmaster->Source;
     error = source->ErrorStat;
     
     if(error != 0)
	  {
	  FreeErrorStatus(error);
	  Free(error);
	  }
     
     error = AllocateErrorStatus;
     CreateErrorStatus(error,commandmaster->ID,commandmaster->Name,
		       NO_ERROR,0);
     ResetStringBuffer(source->ErrorOut,0);

     return(NORMAL_RETURN);
     }




