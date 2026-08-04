#include "basic.h"
#include "comlib.h"

static CommandLevel *GetLastSubLevel(CommandLevel *level);

/*******************************************************************************/
/**   CommandLevel Utility Utility Routines                                         **/
/*******************************************************************************/

extern CommandLevel *GetLastLevel(CommandMaster *master)
     {
     CommandLevel *last;
     
     if(master->Levels == 0)
	  {
	  last = master->Levels = AllocateCommandLevel;
	  CreateCommandLevel(last,0,"main",0);
	  }
     else
	  {
	  last = GetLastSubLevel(master->Levels);
	  }
     return(last);
     }
extern CommandLevel *FormNextLevel(CommandInfo *input,
				   CommandMaster *commandmaster)
     {
     CommandLevel *level,*new;
     CHAR *string;
     
     level = GetLastLevel(commandmaster);
     new = level->Next = AllocateCommandLevel;
     string = AllocateString(LINELENGTH);
/*     sprintf(string,"%s.%s",level->Name,input->Name);*/
     CreateCommandLevel(new,
			level->ID + 1,
			input->Name,
			0);
     Free(string);
     return(new);
     }

extern void FreeLastLevel(CommandMaster *commandmaster)
     {
     CommandLevel *level0,*level1;
     
     level0 = commandmaster->Levels;
     if(level0 == 0) 
	  return;
     else
	  {
	  level1 = level0->Next;
	  if(level1 == 0)
	       {
	       FreeCommandLevel(level0);
	       Free(level0);
	       commandmaster->Levels = 0;
	       }
	  else
	       {
	       while(level1->Next != 0)
		    {
		    level0 = level1;
		    level1 = level1->Next;
		    }
	       FreeCommandLevel(level1);
	       Free(level1);
	       level0->Next = 0;
	       }
	  }
     return;
     }

static CommandLevel *GetLastSubLevel(CommandLevel *level)
     {
     CommandLevel *last;
     
     if(level->Next == 0) 
	  last = level;
     else
	  last = GetLastSubLevel(level->Next);
     return(last);
     }

