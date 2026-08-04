#include "basic.h"
#include "comlib.h"

static CommandInfo *LoopCurrentCommandInfo(CommandInfo *command,
					   CommandInfo *utilities,
					   CommandLevel *level,
					   INT last);
static CommandInfo *GetGeneralCommandInput(CommandSource *source, 
					   CommandInfo *command,
					   CommandMaster *commandmaster,
					   CHAR *type);
static void ProtocolCommandOutput(CommandInfo *input,
				  CommandMaster *commandmaster);
static INT CallCommandFunction(BindStructure *bind,
			       CommandInfo *input);
static FunctionInfo *FindFunctionInfo(CommandMaster *commandmaster,
				      CommandInfo *input);
static INT MatchingFunctions(FunctionInfo *function1, 
			     FunctionInfo *function2);

static CommandInfo ERROR_COMMANDINFO;

extern INT SubMasterCommand(CHAR *type, BindStructure *bind)
     {
     INT done;
     CommandInfo *command,*input;
     CommandLevel *level;
     CHAR *line;
     CommandMaster *commandmaster;
     
     IncrementAge(bind);
     commandmaster = (CommandMaster *) GetBoundStructure(bind,BIND_COMMANDMASTER);
     commandmaster->Source->ID = commandmaster->Source->ID + 1;
     command = FindCurrentCommandInfo(commandmaster);
     input = GetGeneralCommandInput(commandmaster->Source,
				    command,
				    commandmaster,
				    type);
     done = 0;
     if(input->ID == ERROR_COMMAND)
	  {
	  line = AllocateString(LINELENGTH);
	  sprintf(line,
		  "Can't Find Command (Use Help): %s\n",
		  command->Name);
	  ErrorStatusSet(line,RECOVER,commandmaster);
	  Free(line);
	  done = 0;
	  }
     else 
	  {
	  ProtocolCommandOutput(input,commandmaster);
	  level = FormNextLevel(input,commandmaster);
	  done = CallCommandFunction(bind,input);
	  
	  if(input->NumSubCommands == 0)
	       FreeLastLevel(commandmaster);
	  }

     return(done);
     }

static void ProtocolCommandOutput(CommandInfo *input,
				  CommandMaster *commandmaster)
     {
     CHAR *line;
     
     line = AllocateString(LINELENGTH);
     sprintf(line,"%s\n",input->Name);
     PrintProtocolString(line,commandmaster);
     
     switch(commandmaster->Source->Verbose)
	  {
     case NORMAL_VERBOSE:
	  sprintf(line,"Command:%s\n",input->Name);
	  PrintOutputString(line,commandmaster);
	  break;
     case VERBOSE_VERBOSE:
	  if(input->Comment == 0)
	       sprintf(line,
		       "Command:%s\n",
		       input->Name);	       
	  else
	       sprintf(line,
		       "Command:%s\n",
		       input->Comment->Name);	       
	  PrintOutputString(line,commandmaster);
	  break;
	  }
     Free(line);
     }
     
extern CommandInfo *FindCurrentCommandInfo(CommandMaster *commandmaster)
     {
     CommandInfo *commands,*current;
     CommandLevel *levels;
     
     commands = commandmaster->Commands;
     levels = commandmaster->Levels;
     if(levels != 0) 
	  current = LoopCurrentCommandInfo(commands,
					   commandmaster->Utilities,
					   levels->Next,
					   0);
     else
	  current = commands;
     return(current);
     }

extern CommandInfo *FindLastCommandInfo(CommandMaster *commandmaster)
     {
     CommandInfo *commands,*current;
     CommandLevel *levels;
     
     commands = commandmaster->Commands;
     levels = commandmaster->Levels;
     if(levels != 0) 
	  current = LoopCurrentCommandInfo(commands,
					   commandmaster->Utilities,
					   levels->Next,
					   1);
     else
	  current = commands;
     return(current);
     }

static CommandInfo *LoopCurrentCommandInfo(CommandInfo *command,
					   CommandInfo *utilities,
					   CommandLevel *level,
					   INT util)
     {
     CommandInfo *current,*newcommand;
     CommandLevel *newlevel;
     
     if(level == 0)
	  current = command;
     else
	  {
	  if(MatchingNames(UTILITY_COMMAND_NAME,level->Name) &&
	     MatchingNames(HELP_COMMAND_NAME,level->Name))
	       {
	       newcommand = SearchForCommandKeyWord(command,level->Name);
	       newlevel = level->Next;
	       current = LoopCurrentCommandInfo(newcommand,
						utilities,newlevel,
						util);
	       }
	  else
	       {
	       newlevel = level->Next;
	       current = LoopCurrentCommandInfo(utilities,utilities,
						newlevel,util);
	       }
	  }
     return(current);
     }

static CommandInfo *GetGeneralCommandInput(CommandSource *source, 
					   CommandInfo *command,
					   CommandMaster *commandmaster,
					   CHAR *type)
     {
     CommandInfo *input;

     input = SearchForCommandKeyWord(command,type);

     if(input == 0)
	  {
	  input = &(ERROR_COMMANDINFO);
	  if(input->Name != 0) Free(input->Name);
	  input->Name = CopyString(type);
	  input->ID = ERROR_COMMAND;
	  }
     
     return(input);
     }

/*******************************************************************************/
/**   Call Command                                                            **/
/*******************************************************************************/

static INT CallCommandFunction(BindStructure *bind,
			       CommandInfo *input)
    {
     FunctionInfo *function;
     INT (*call)();
     INT done;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     done = 0;
     function = FindFunctionInfo(commandmaster,input);
     if(function != 0)
	  {	  
	  call = function->FunctCall;
	  done = (*call)(bind);
	  }
     return(done);
     }

/* This routine finds the function in the list of functions and then calls it
   A major error occurs when the function is not found in the list of available 
   functions 
*/
static FunctionInfo *FindFunctionInfo(CommandMaster *commandmaster,
				      CommandInfo *input)
    {
    FunctionInfo *function,*functionlist,*call;
    FunctionList *usablefunctions;
    CHAR *functionname,*string;
    INT count;
    
     function = input->Function;
     if(function != 0)
	  {
	  if(function->FunctCall != 0)
	       call = function;
	  else
	       {
	       functionname = function->Name;
	       if(commandmaster->ID == UTILITY_DEACTIVATED)
		    usablefunctions = commandmaster->Functions;
	       else 
		    usablefunctions = &(UTILITY_FUNCTIONS);
	       
	       functionlist = usablefunctions->Function;
	       call = 0;
	       count = 0;
	       while(call == 0 && count < usablefunctions->NumberOfFunctions)
		    {
		    if(!MatchingFunctions(function,functionlist))
			 call = functionlist;
		    else
			 {
			 count++;
			 functionlist++;
			 }
		    }
	       if(call == 0)
		    {
		    string = AllocateString(LINELENGTH);
		    sprintf(string,"Can't find Command: %s ... Aborting",
			    functionname);
		    ErrorStatusSet(string,FATAL,commandmaster);
		    }
	       }
	  }
     else
	  call = 0;
     
     return(call);
     }

extern INT MatchingNames(CHAR *name, CHAR *compare)
     {
     INT out;
     
     out = strcmp(name,compare);
     return(out);
     }



static INT MatchingFunctions(FunctionInfo *function1, 
			     FunctionInfo *function2)
     {
     INT out;
     
     out = strcmp(function1->Name,function2->Name);
     return(out);
     }
	

extern CommandInfo *SearchForCommandKeyWord(CommandInfo *command, CHAR *type)
     {
     CommandInfo *subs;
     INT count;
     CHAR *name,*typename;
     
     name = AllocateString(LINELENGTH);
     typename = AllocateString(LINELENGTH);
     IsolateNextWord(type,typename,COLON,LINELENGTH);
     subs = command->SubCommands;
     count = command->NumSubCommands;
     while(count > 0)
	  {
	  IsolateNextWord(subs->Name,name,COLON,LINELENGTH);
	  if( !(MatchingNames(typename,name)) )
	       count = -1;
	  else
	       {
	       count--;
	       subs++;
	       }
	  }
     if(count == 0)
	  subs = 0;
     Free(name);
     Free(typename);
     return(subs);
     }

extern KeyWordArray *ConvertCommandToKeyWords(CommandInfo *command,
					      CommandMaster *commandmaster)
     {
     KeyWordArray *keywords;
     KeyWords *key;
     CommandInfo *com;
     INT i,num;
     FunctionInfo *function;
     
     num = command->NumSubCommands;
     keywords = AllocateKeyWordArray;
     keywords->ID = command->ID;
     keywords->Name = CopyString(command->Name);
     keywords->NumberOfKeyWords = num;
     keywords->Keys = Calloc(num,KeyWordSize);
     
     key = keywords->Keys;
     com = command->SubCommands;
     LOOPi(command->NumSubCommands)
	  {
	  strcpy(&(key->KeyWord[0]),com->Name);
	  key->Type = com->ID;
	  if(com->Comment == 0)
	       strcpy(&(key->Description[0]),com->Name);
	  else
	       strcpy(&(key->Description[0]),com->Comment->Name);
	  
	  function = FindFunctionInfo(commandmaster,com);
	  if(function == 0)
	       key->Function = 0;
	  else
	       key->Function = function->FunctCall;

	  com++;
	  key++;
	  }

     return(keywords);
     }



