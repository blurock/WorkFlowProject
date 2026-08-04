#include "basic.h"
#include "comlib.h"

static CHAR *InputArgumentValue(CHAR *name,
				CommandMaster *commandmaster);
/**************************************************************************/
/* Routines for Argument Manipulation
*/

extern INT SetDefaultValue(BindStructure *bind)
     {
     CommandInfo *input;
     CHAR *name;
     ArgumentSetInfo *set;
     ArgumentInfo *info;
     BaseArgumentType *arg,*def;
     INT count;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     input = FindCurrentCommandInfo(commandmaster);
     
     name = input->Name + strlen("Default:");
     set = GetArgInCommandInfo(name,commandmaster);

     info = set->Set;
     count = 0;
     while(count < set->NumberOfArguments &&
	   MatchingNames(info->Name,name))
	  {
	  count++;
	  info++;
	  }
     arg = GetCurrentArgument(name,commandmaster);
     if(count < set->NumberOfArguments && info->Default != 0)
	  {
	  def = info->Default;
	  switch(arg->Type)
	       {
	  case INT_VALUE:
	       arg->Integer_Value = def->Integer_Value;
	       break;
	  case FLOAT_VALUE:
	       arg->Float_Value = def->Float_Value;
	       break;
	  case STRING_VALUE:
	  case INPUT_FILE_NAME:
	  case OUTPUT_FILE_NAME:
	       Free(arg->String_Value);
	       arg->String_Value = CopyString(def->String_Value);
	       break;
	       }
	  }
     PrintCurrentArgumentValue(commandmaster,arg);
     return(LEAVE_LEVEL);
     }

extern INT SetInputValue(BindStructure *bind)
     {
     CommandInfo *input;
     CHAR *name;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     input = FindCurrentCommandInfo(commandmaster);
     name = input->Name;
     
     InputArgumentValue(name,commandmaster);
     
     return(LEAVE_LEVEL);
     }
extern INT PrintParameterValue(BindStructure *bind)
     {
     BaseArgumentType *value;
     CommandInfo *input;
     CHAR *name;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     input = FindCurrentCommandInfo(commandmaster);
     name = input->Name + strlen("Print:");
     value = GetCurrentArgument(name,commandmaster);
     
     PrintCurrentArgumentValue(commandmaster,value);
     return(LEAVE_LEVEL);
     }

extern void PrintCurrentArgumentValue(CommandMaster *commandmaster,
				      BaseArgumentType *value)
     {
     CHAR *string,*val;
     
     string = AllocateString(LINELENGTH);
     sprintf(string,"Argument: %s = ",value->Name);
     PrintOutputString(string,commandmaster);

     switch(value->Type)
	  {
     case INT_VALUE:
	  sprintf(string,"%d\n",value->Integer_Value);
	  break;
     case FLOAT_VALUE:
	  sprintf(string,"%f\n",value->Float_Value);		  
	  break;
     case STRING_VALUE:
     case INPUT_FILE_NAME:
     case OUTPUT_FILE_NAME:
	  val = ConsiderAliases(value->String_Value,commandmaster);
	  sprintf(string,"%s\n",val);
	  Free(val);
	  break;
	  }
     PrintOutputString(string,commandmaster);
     Free(string);
     }

static CHAR *InputArgumentValue(CHAR *name,
				CommandMaster *commandmaster)
     {
     CHAR *string;
     CommandSource *source;
     CommandLevel *level;

     source = commandmaster->Source;
     level = GetLastLevel(commandmaster);

     fprintf(stdout,"%s>> ",name);
     fflush(stdout);

     NextNonBlankLine(source->File,&(source->Command->Line[0]));
     source->Command->Rest = &(source->Command->Line[0]);
     string = CommandIsolateString(source->Command,BLANK);

     SetCurrentValueFromString(name+strlen("Input:"),string,commandmaster);
     return(string);
     }


     
