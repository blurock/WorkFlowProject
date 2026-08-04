#include "basic.h"
#include "comlib.h"

static void PrintOutCommandLevel(CommandInfo *command, CHAR *levelprefix,
				 INT level,
				 INT name, INT desc, INT func,
				 CommandMaster *commandmaster);

#define NUMBER_UTILITY_FUNCTIONS    6

static FunctionInfo UTILITY_FUNCTION_LIST[NUMBER_UTILITY_FUNCTIONS] = {
     {0,"ProtocolOutput",            ProtocolOutput},
     {1,"PrintLevelSetOfArguments",  PrintLevelSetOfArguments},
     {2,"PrintOutAliases",           PrintOutAliases},
     {3,"PrintOutTotalCommandTree",  PrintOutTotalCommandTree},
     {4,"PrintOutCommandTree",       PrintOutCommandTree},
     {5,"Help",                      LevelHelpCommand}
     };

FunctionList UTILITY_FUNCTIONS = {
     1,"Utility",
     NUMBER_UTILITY_FUNCTIONS,
     UTILITY_FUNCTION_LIST
     };


/**************************************************************************/
extern INT LevelHelpCommand(BindStructure *bind)
     {
     KeyWordArray *keywords;
     KeyWords *subs;
     CommandInfo *input;
     INT i;
     CHAR *line,*name;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     
     line = AllocateString(LINELENGTH);

     input = FindLastCommandInfo(commandmaster);
     keywords = ConvertCommandToKeyWords(input,commandmaster);
     
     PrintOutputString("Possible Commands\n",commandmaster);
     
     subs = keywords->Keys;
     LOOPi(keywords->NumberOfKeyWords)
	  {
	  name = AllocateString(LINELENGTH);
	  IsolateNextWord(&(subs->KeyWord[0]),name,COLON,LINELENGTH);
	  
	  sprintf(line,"%15s:",name);
	  PrintOutputString(line,commandmaster);
	  Free(name);
	  
	  sprintf(line,"%s\n",&(subs->Description[0]));
	  PrintOutputString(line,commandmaster);
	  
	  subs++;
	  }
     Free(keywords->Keys);
     Free(keywords->Name);
     Free(keywords);
     Free(line);
     return(NORMAL_RETURN);
     }
/**************************************************************************/
/* Quit Level Routine */
extern INT QuitCommandLevel(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     CommandInfo *command;
     CHAR *line;
     
     line = AllocateString(LINELENGTH);
     sprintf(line,"%s\n",QUIT_COMMAND_NAME);
     
     commandmaster = (CommandMaster *) GetBoundStructure(bind,BIND_COMMANDMASTER);
     PrintProtocolString(line, commandmaster);
     Free(line);
     if(commandmaster->Levels == 0) 
	  exit(0);
     
     command = FindCurrentCommandInfo(commandmaster);
     if(commandmaster->ID == UTILITY_ACTIVATED &&
	!MatchingNames(UTILITY_COMMAND_NAME,command->Name))
	  commandmaster->ID = UTILITY_DEACTIVATED;

     FreeLastLevel(commandmaster);
     if(commandmaster->Levels == 0) 
	  return(LEAVE_COMPLETELY);

     return(LEAVE_LEVEL);
     }

/**************************************************************************/
/* UTILITY Routine */
extern INT UtilityCommand(BindStructure *bind)
     {
     CommandMaster *commandmaster;

     commandmaster = (CommandMaster *) GetBoundStructure(bind,BIND_COMMANDMASTER);

     if(commandmaster->ID == UTILITY_DEACTIVATED)
	  {
	  commandmaster->ID = UTILITY_ACTIVATED;
	  FormNextLevel(&(UTILITY_COMMANDINFO),commandmaster);
	  }
     
     return(NORMAL_RETURN);
     }


/**************************************************************************/
extern INT ProtocolOutput(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     FILE *file;
     CommandSource *source;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     file = OpenWriteFileFromCurrent("ProtocolDirectory",
				     "ProtocolRoot",
				     "out",
				     RECOVER,
				     "Protocol Output File",
				     commandmaster);
     
     source = commandmaster->Source;
     
     if(file != 0)
	  {
	  fprintf(file,"%s\n",source->ProtocolOut->OutputBuffer);
	  fclose(file);
	  }
     
     return(NORMAL_RETURN);
     }

/**************************************************************************/
extern INT PrintLevelSetOfArguments(BindStructure *bind)
     {
     CommandInfo *command;
     ArgumentSetInfo *args;
     ArgumentInfo *arg;
     BaseArgumentType *value;
     INT i;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     command = FindLastCommandInfo(commandmaster);
     args = command->Arguments;
     
     if(args == 0)
	  PrintOutputString("----- No Arguments -----\n",commandmaster);
     else
	  {
	  arg = args->Set;
	  LOOPi(args->NumberOfArguments)
	       {
	       value = GetCurrentArgument(arg->Name,commandmaster);
	       PrintCurrentArgumentValue(commandmaster,value);
	       arg++;
	       }
	  }
     
     return(NORMAL_RETURN);
     }

/**************************************************************************/
extern INT PrintOutAliases(BindStructure *bind)
     {
     AliasArray *set;
     AliasString *alias;
     INT i;
     CHAR *out;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     out = AllocateString(LINELENGTH);
     GetMasterAliases(0,commandmaster,0);
     
     set = commandmaster->AliasSet;
     alias = set->Set;
     LOOPi(set->NumberOfAliases)
	  {
	  sprintf(out,"%20s:=%20s\n",alias->KeyWord,alias->Alias);
	  PrintOutputString(out,commandmaster);
	  alias++;
	  }
     Free(out);
     return(NORMAL_RETURN);
     }

/**************************************************************************/
extern INT PrintOutTotalCommandTree(BindStructure *bind)
     {
     INT name,desc,func;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     name = GetCurrentIntegerArgument("Pname",commandmaster);
     desc = GetCurrentIntegerArgument("Pdesc",commandmaster);
     func = GetCurrentIntegerArgument("Pfunc",commandmaster);
     
     PrintOutCommandLevel(commandmaster->Commands,
			   "    :",0,
			   name,desc,func,
			   commandmaster);
     return(NORMAL_RETURN);
     }

/**************************************************************************/
extern INT PrintOutCommandTree(BindStructure *bind)
     {
     CommandInfo *command;
     INT name,desc,func;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     name = GetCurrentIntegerArgument("Pname",commandmaster);
     desc = GetCurrentIntegerArgument("Pdesc",commandmaster);
     func = GetCurrentIntegerArgument("Pfunc",commandmaster);
     
     command = FindLastCommandInfo(commandmaster);
     PrintOutCommandLevel(command,"     :",0,
			  name,desc,func,
			  commandmaster);
     return(NORMAL_RETURN);
     }

/**************************************************************************/
/**************************************************************************/
static void PrintOutCommandLevel(CommandInfo *command, CHAR *levelprefix,
				 INT level,
				 INT name, INT desc, INT func,
				 CommandMaster *commandmaster)
     {
     CHAR *string;
     INT i;
     CommandInfo *sub;
     
     if(command == 0)
	  return;
     
     LOOPi(level)
	  PrintOutputString(levelprefix,commandmaster);

     string = AllocateString(LINELENGTH);
     if(name != 0)
	  {
	  PrintOutputString(command->Name,commandmaster);
	  PrintOutputString(" : ",commandmaster);
	  }
     if(desc != 0)
	  {
	  StringTitleInfo(command->Comment,string);
	  PrintOutputString(string,commandmaster);
	  PrintOutputString(" : ",commandmaster);
	  }
     
     if(func != 0)
	  {
	  StringFunctionInfo(command->Function,string);
	  PrintOutputString(string,commandmaster);
	  PrintOutputString(" : ",commandmaster);
	  }
     PrintOutputString("\n",commandmaster);

     sub = command->SubCommands;
     LOOPi(command->NumSubCommands)
	  {
	  PrintOutCommandLevel(sub,levelprefix,level+1,
			       name,desc,func,
			       commandmaster);
	  sub++;
	  }
     }
