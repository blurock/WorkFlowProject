#include "basic.h"
#include "comlib.h"
extern CHAR *PrintStringString(CHAR *buffer, INT *bufferleft, CHAR *string);

static CommandInfo *ConvertArgumentSetInfoToCommandInfo(ArgumentSetInfo *set,
							INT (*InputValues)());
static void ArgumentInfoToCommandInfo(ArgumentInfo *info,
				      BaseArgumentType *value,
				      CommandInfo *command,
				      INT (*InputValues)());
static void ArgumentInfoSubCommands(ArgumentInfo *info,
				    CommandInfo *command,
				    INT (*InputValues)());

static ArgumentSetInfo *LoopCurrentArgumentSetInfo(CommandInfo *command,
						   ArgumentSetInfo *list,
						   CommandInfo *utilities,
						   CommandLevel *level);
static ArgumentInfo *CopyArgumentSetInfoArray(ArgumentInfo *new,
					      ArgumentInfo *old,
					      INT num);
static BaseArgumentType *CopyBaseArgumentTypeArray(BaseArgumentType *new,
						   BaseArgumentType *old,
						   INT num);
static BaseArgumentType *SearchForArgument(CommandMaster *commandmaster,
					   CHAR *name);
static CHAR *IsolateNameFromCompoundName(CHAR *name);
static CommandLevel *StringNameToCommandLevels(CHAR *name);
static ArgumentSetInfo *GetArgumentFromAliases(CHAR *name, 
					       CommandMaster *commandmaster);
static ArgumentSetInfo *GetArgLoop(CHAR *name,
				   CommandInfo *command,
				   CommandInfo *utilities,
				   CommandLevel *level);
static BaseArgumentType *IsArgumentInCommand(CommandInfo *command,
			     CHAR *name);

#include "comdstd.c"

extern CommandInfo *MergeArgumentSetInfoToCommandInfo(CommandInfo *newcommands,
						      CommandInfo *commands,
						      INT (*InputValues)())
     {
     CommandInfo *args, *newsubs, *newstart, *command;
     INT i;
     
     if(commands->Arguments != 0)
	  {
	  args = ConvertArgumentSetInfoToCommandInfo(commands->Arguments,
						     InputValues);
	  MergeTwoCommandInfo(newcommands,commands,args);
	  FreeCommandInfo(args);
	  Free(args);
	  }
     else 
	  CopyFullCommandInfo(newcommands,commands);
     
     
     newsubs = newstart = AllocArrayCommandInfo(newcommands->NumSubCommands);
     command = newcommands->SubCommands;
     LOOPi(newcommands->NumSubCommands)
	  {
	  MergeArgumentSetInfoToCommandInfo(newsubs,command,InputValues);
	  FreeCommandInfo(command);
	  newsubs++;
	  command++;
	  }
     Free(newcommands->SubCommands);
     newcommands->SubCommands = newstart;
     return(newcommands);
     }

static CommandInfo *ConvertArgumentSetInfoToCommandInfo(ArgumentSetInfo *set,
							INT (*InputValues)())
     {
     CommandInfo *base,*command,*subs;
     ArgumentInfo *info;
     BaseArgumentType *value;
     INT i;
     
     base = AllocateCommandInfo;
     CreateCommandInfo(base,set->ID,set->Name,
		       0,0,0,0,0,0,0,0,0,
		       1,&(Parameter_Change_Command));
     
     subs = base->SubCommands;
     subs->NumSubCommands = set->NumberOfArguments;
     subs->SubCommands = command = AllocArrayCommandInfo(set->NumberOfArguments);
     info = set->Set;
     value = set->Values;
     LOOPi(set->NumberOfArguments)
	  {
	  ArgumentInfoToCommandInfo(info++,value++,command++,InputValues);
	  }

     return(base);
     }

static void ArgumentInfoToCommandInfo(ArgumentInfo *info,
				      BaseArgumentType *value,
				      CommandInfo *command,
				      INT (*InputValues)())
     {
     
     CreateCommandInfo(command,info->ID,info->Name,
		       0,0,0,0,0,0,0,0,0,0,0);
		       
     if(info->FlagName != 0)
	  {
	  command->FlagName = AllocateVariableName;
	  CopyFullVariableName(command->FlagName,info->FlagName);
	  }
     
     if(info->Title != 0)
	  {
	  command->Comment = AllocateTitleInfo;
	  CopyFullTitleInfo(command->Comment,info->Title);
	  }
/*
	  command->Arguments = AllocateArgumentSetInfo;
	  CreateArgumentSetInfo(command->Arguments,info->ID,info->Name,
				1,info,value);
*/   
     ArgumentInfoSubCommands(info,command,InputValues);     
     }

static void ArgumentInfoSubCommands(ArgumentInfo *info,
				    CommandInfo *command,
				    INT (*InputValues)())
     {
     CommandInfo *commands;
     CHAR *name;
     
     name = AllocateString(LINELENGTH);

     command->NumSubCommands = 3;
     command->SubCommands = commands = AllocArrayCommandInfo(3);
     
     CopyFullCommandInfo(commands,&(Parameter_Default_Input));
     sprintf(name,"Default:%s",command->Name);
     Free(commands->Name);
     commands->Name = CopyString(name);
     commands->ID = LEAVE_LEVEL;

     commands++;
     CopyFullCommandInfo(commands,&(Parameter_Input_Command));
     if(InputValues != 0)
	  commands->Function->FunctCall = InputValues;
     sprintf(name,"Input:%s",command->Name);
     Free(commands->Name);
     commands->Name = CopyString(name);
     commands->ID = LEAVE_LEVEL;

     commands++;
     CopyFullCommandInfo(commands,&(Parameter_Print_Command));
     sprintf(name,"Print:%s",command->Name);
     Free(commands->Name);
     commands->Name = CopyString(name);
     commands->ID = LEAVE_LEVEL;
     }

extern ArgumentSetInfo *GetListOfArguments(CommandMaster *commandmaster)
     {
     CommandInfo *commands;
     CommandLevel *levels;
     ArgumentSetInfo *current;
     
     commands = commandmaster->Commands;
     levels = commandmaster->Levels;
     current = MergeArgumentSetInfo(0,commands->Arguments);
     if(levels != 0) 
	  current = LoopCurrentArgumentSetInfo(commands,
					   current,
					   commandmaster->Utilities,
					   levels->Next);
     return(current);
     }

static ArgumentSetInfo *LoopCurrentArgumentSetInfo(CommandInfo *command,
						   ArgumentSetInfo *list,
						   CommandInfo *utilities,
						   CommandLevel *level)
     {
     CommandInfo *newcommand;
     CommandLevel *newlevel;
     ArgumentSetInfo *current,*newargs;
     
     if(level == 0)
	  current = MergeArgumentSetInfo(list,command->Arguments);
     else
	  {
	  if(MatchingNames(UTILITY_COMMAND_NAME,level->Name))
	       {
	       newcommand = SearchForCommandKeyWord(command,level->Name);
	       newlevel = level->Next;
	       newargs = MergeArgumentSetInfo(list,command->Arguments);
	       current = LoopCurrentArgumentSetInfo(newcommand,newargs,
						utilities,newlevel);
	       }
	  else
	       {
	       newlevel = level->Next;
	       newargs = MergeArgumentSetInfo(list,command->Arguments);
	       current = LoopCurrentArgumentSetInfo(utilities,newargs,
						utilities,newlevel);
	       }
	  }
     return(current);
     }

     
extern ArgumentSetInfo *MergeArgumentSetInfo(ArgumentSetInfo *set1,
					       ArgumentSetInfo *set2)
     {
     INT num;
     ArgumentSetInfo *newset;
     ArgumentInfo *newargument;
     BaseArgumentType *newbase;
     
     if(set1 == 0 && set2 == 0 ) return(0);
     newset = AllocateArgumentSetInfo;
     if(set1 == 0)
	  {
	  CopyFullArgumentSetInfo(newset,set2);
	  return(newset);
	  }
     
     if(set2 == 0)
	  {
	  CopyFullArgumentSetInfo(newset,set1);
	  return(newset);
	  }
     
     
     num = set1->NumberOfArguments + set2->NumberOfArguments;

     CreateArgumentSetInfo(newset, set1->ID, set1->Name,
			   num,0,0);

     newargument = CopyArgumentSetInfoArray(newset->Set,
					     set1->Set,
					     set1->NumberOfArguments);
     
     newargument = CopyArgumentSetInfoArray(newargument,
					     set2->Set,
					     set2->NumberOfArguments);
     newbase = CopyBaseArgumentTypeArray(newset->Values,
				    set1->Values,
     				    set1->NumberOfArguments);
     
     newbase = CopyBaseArgumentTypeArray(newset->Values,
				    set2->Values,
				    set2->NumberOfArguments);
     
     return(newset);
     }

static ArgumentInfo *CopyArgumentSetInfoArray(ArgumentInfo *new,
					      ArgumentInfo *old,
					      INT num)
     {
     INT i;
     
     LOOPi(num)
	  {
	  CopyFullArgumentInfo(new,old);
	  old++;
	  new++;
	  }
     return(new);
     }

static BaseArgumentType *CopyBaseArgumentTypeArray(BaseArgumentType *new,
						   BaseArgumentType *old,
						   INT num)
     {
     INT i;
     
     LOOPi(num)
	  {
	  CopyFullBaseArgumentType(new,old);
	  old++;
	  new++;
	  }
     return(new);
     }

/*******************************************************************************/
extern CommandInfo *FormNewCommand(Master *master, CommandInfo *command)
     {
     CommandInfo *oldcommand, *newcommand, *newstart;
     INT i;

     newcommand = newstart =
	  AllocArrayCommandInfo(command->NumSubCommands + 1);
     oldcommand = command->SubCommands;
     LOOPi(command->NumSubCommands)
	  {
	  CopyFullCommandInfo(newcommand,oldcommand);
	  newcommand++;
	  FreeCommandInfo(oldcommand++);
	  }
     Free(command->SubCommands);
     command->SubCommands = newstart;
     command->NumSubCommands +=1;

     CreateCommandInfo(newcommand,master->CommandNumber,
		       "Form",
		       0,0,
		       0,0,0,0,0,0,0,0,0);	
     master->CommandNumber +=1;
     return(newcommand);
     }

extern ArgumentInfo 
         *FillInArgument(INT type, CHAR *name,
			  ArgumentSetInfo *argumentset)
     {
     INT i,num;
     ArgumentInfo *newset, *oldset, *newsetstart;

     num = argumentset->NumberOfArguments +  1;
     newset = newsetstart = 
	  AllocArrayArgumentInfo(num);
     oldset = argumentset->Set;
     LOOPi(argumentset->NumberOfArguments)
	  {
	       CopyFullArgumentInfo(newset++,oldset);
	       FreeArgumentInfo(oldset++);
	  }
     argumentset->NumberOfArguments += 1;
     Free(argumentset->Set);
     argumentset->Set = newsetstart;
     CreateArgumentInfo(newset,num,name,type,0,0,0,0,0,0);

     return(newset);
     }

extern BaseArgumentType
         *FillInBaseArgumentType(INT type,CHAR *name,
			  ArgumentSetInfo *argumentset)
     {
     BaseArgumentType *newvalue, *oldvalue, *newvaluestart;
     INT i,num;
     
     newvalue = newvaluestart = 
	  AllocArrayBaseArgumentType(argumentset->NumberOfArguments);
     oldvalue = argumentset->Values;
     num = argumentset->NumberOfArguments - 1;
     LOOPi(num)
	  {
	       CopyFullBaseArgumentType(newvalue++,oldvalue);
	       FreeBaseArgumentType(oldvalue++);
	  }
     Free(argumentset->Values);
     argumentset->Values = newvaluestart;
     CreateBaseArgumentType(newvalue,argumentset->NumberOfArguments,
		name,type,0,0.0,0);
     return(newvalue);
     }

extern BaseArgumentType *SetBaseArgumentType(INT type,
					     CHAR *name,
					     INT i,
					     FLOAT f,
					     STRING *s)
     {
     BaseArgumentType *base;
     
     base = AllocateBaseArgumentType;
     CreateBaseArgumentType(base,type,name,type,i,f,s);
     return(base);
     }



/**************************************************************************/
extern CHAR *PrintPrettyArgumentSetInfo(CHAR *buffer, INT *bufferleft,
					CHAR *indent,
					ArgumentSetInfo *set)
     {
     CHAR *newindent, *outstring;
     ArgumentInfo *argument;
     INT i;
     
     newindent = AllocateString(LINELENGTH);
     outstring = AllocateString(LINELENGTH);
     
     if(set == 0)
	  {
	  sprintf(outstring,"%s<ArgumentSetInfo> empty\n",indent);
	  buffer = PrintStringString(buffer,bufferleft,outstring);
	  }
     else
	  {
	  sprintf(outstring, "%s ArgumentSetInfo:%d:%s\n",
		  indent, set->ID, set->Name);
	  buffer = PrintStringString(buffer,bufferleft,outstring);
	  argument = set->Set;
	  LOOPi(set->NumberOfArguments)
	       {
	       sprintf(outstring,"%s<%d>\n",indent, i);
	       buffer = PrintStringString(buffer,bufferleft,outstring);
	       sprintf(newindent,"%s      :",indent);
	       PrintPrettyArgumentInfo(buffer,bufferleft,newindent,argument++);
	       }
	  }
     Free(newindent);
     Free(outstring);
     return(buffer);
     }

extern CHAR *PrintPrettyArgumentInfo(CHAR *buffer, INT *bufferleft,
				    CHAR *indent,
				    ArgumentInfo *argument)
     {
     CHAR string[LINELENGTH], *outstring;
     
     if(argument == 0) return(buffer);
     
     outstring = AllocateString(LINELENGTH);
     
     sprintf(outstring,"%s :ArgumentInfo %d:%s\n",
	     indent,
	     argument->ID,
	     argument->Name);
     buffer = PrintStringString(buffer,bufferleft,outstring);

     sprintf(outstring,"%s     :Type     :%d\n",indent, 
	     argument->Type);
     buffer = PrintStringString(buffer,bufferleft,outstring);

     StringVariableName(argument->FlagName,string);
     sprintf(outstring,"%s     :FlagName :%s\n",indent, string);
     buffer = PrintStringString(buffer,bufferleft,outstring);
     
     StringTitleInfo(argument->Title,string);
     sprintf(outstring,"%s     :Title    :%s\n",indent, string);
     buffer = PrintStringString(buffer,bufferleft,outstring);
     
     StringBaseArgumentType(argument->Default,string);
     sprintf(outstring,"%s     :Default  :%s\n",indent, string);
     buffer = PrintStringString(buffer,bufferleft,outstring);
     
     StringBaseArgumentType(argument->LowerBound,string);
     sprintf(outstring,"%s     :Lower    :%s\n",indent, string);
     buffer = PrintStringString(buffer,bufferleft,outstring);
     
     StringBaseArgumentType(argument->UpperBound,string);
     sprintf(outstring,"%s     :Upper    :%s\n",indent, string);
     buffer = PrintStringString(buffer,bufferleft,outstring);
     
     if(argument->SetFlag != 0)
	  {
	  sprintf(outstring,"%s     :Set\n",indent);
	  buffer = PrintStringString(buffer,bufferleft,outstring);
	  }

     Free(outstring);
     return(buffer);
     }

extern void SetCurrentValueFromString(CHAR *name, CHAR *string, 
				      CommandMaster *commandmaster)
     {
     BaseArgumentType *currentvalue;
     CHAR *line;
     
     currentvalue = GetCurrentArgument(name,commandmaster);
     
     if(currentvalue != 0)
	  {
	  line = AllocateString(2*LINELENGTH);
	  sprintf(line,"Set Value: %s to %s\n",name,string);
	  PrintOutputString(line,commandmaster);
	  PrintProtocolString(string,commandmaster);
	  PrintProtocolString("\n",commandmaster);
	  
	  Free(line);
	  
	  switch(currentvalue->Type)
	       {
	  case INT_VALUE:
	       currentvalue->Integer_Value = ConvertStringToInteger(string);
	       break;
	  case FLOAT_VALUE:
	       currentvalue->Float_Value = ConvertStringToFloat(string);
	       break;
	  case STRING_VALUE:
	       if(currentvalue->String_Value != 0)
		    Free(currentvalue->String_Value);
	       currentvalue->String_Value = CopyString(string);
	       break;
	  case INPUT_FILE_NAME:
	       if(currentvalue->String_Value != 0)
		    Free(currentvalue->String_Value);
	       currentvalue->String_Value = CopyString(string);
	       break;
	  case OUTPUT_FILE_NAME:
	       if(currentvalue->String_Value != 0)
		    Free(currentvalue->String_Value);
	       currentvalue->String_Value = CopyString(string);
	       break;
	       }
	  }
     }

extern CHAR *GetCurrentStringArgument(CHAR *name,
				      CommandMaster *commandmaster)
     {
     BaseArgumentType *base;
     CHAR *string,*new,*new1;
     
     base = GetCurrentArgument(name,commandmaster);
     if(base == 0)
	  string = 0;
     else
	  string = base->String_Value;
     
     if(string != 0)
	  new = ConsiderAliases(string,commandmaster);
     else
	  {
	  new1 = ConsiderAliases(name,commandmaster);
	  new = ConsiderAliases(new1,commandmaster);
	  }
     
     return(new);
     }

extern INT GetCurrentIntegerArgument(CHAR *name,
				     CommandMaster *commandmaster)
     {
     BaseArgumentType *base;
     INT arg;
     CHAR *new;
     
     if(commandmaster->Commands != 0)
	  {
	  base = GetCurrentArgument(name,commandmaster);
	  if(base == 0)
	       arg = 0;
	  else
	       arg = base->Integer_Value;
	  }
     else
	  {
	  new = ConsiderAliases(name,commandmaster);
	  arg = ConvertStringToInteger(new);
	  }
     
     return(arg);
     }

extern FLOAT GetCurrentFloatArgument(CHAR *name,
				     CommandMaster *commandmaster)
     {
     BaseArgumentType *base;
     FLOAT arg;
     CHAR *new;
     
     if(commandmaster->Commands != 0)
	  {
	  base = GetCurrentArgument(name,commandmaster);
	  if(base == 0)
	       arg = 0;
	  else
	       arg = base->Float_Value;
	  }
     else
	  {
	  new = ConsiderAliases(name,commandmaster);
	  arg = ConvertStringToFloat(new);
	  }
     
     return(arg);
     }

extern BaseArgumentType *GetCurrentArgument(CHAR *name,
					    CommandMaster *commandmaster)
     {
     BaseArgumentType *currentvalue;
     CHAR *line;
     
     if(commandmaster->Commands != 0)
	  {
	  currentvalue = SearchForArgument(commandmaster,name);
	  
	  if(currentvalue == 0)
	       {
	       line = AllocateString(LINELENGTH);
	       sprintf(line,
		       "Can't Find Variable Name: %s\n",
		       name);
	       PrintErrorString(line,commandmaster);
	       Free(line);
	       currentvalue = 0;
	       }
	  }
     else
	  currentvalue = 0;
     
     return(currentvalue);
     }

static BaseArgumentType *SearchForArgument(CommandMaster *commandmaster,
					   CHAR *name)
     {
     ArgumentSetInfo *set;
     BaseArgumentType *arg;
     INT count;
     
     set = GetArgInCommandInfo(name,commandmaster);

     arg = set->Values;
     count = 0;
     while(count < set->NumberOfArguments &&
	   MatchingNames(arg->Name,name))
	  {
	  count++;
	  arg++;
	  }
     if(count >= set->NumberOfArguments)
	  arg = 0;
     
     return(arg);
     }

/****************************************************************************/
extern ArgumentSetInfo *GetArgInCommandInfo(CHAR *name,
					    CommandMaster *commandmaster)
     {
     CommandInfo *commands;
     CommandLevel *levels;
     ArgumentSetInfo *current;
     
     commands = commandmaster->Commands;
     levels = commandmaster->Levels;
     if(levels != 0) 
	  current = GetArgLoop(name,
					   commands,
					   commandmaster->Utilities,
					   levels->Next);
     else
	  current = 0;
     if(current == 0)
	  current = GetArgumentFromAliases(name,commandmaster);
     
     return(current);
     }

static CHAR *IsolateNameFromCompoundName(CHAR *name)
     {
     CHAR *isolated, *iso, *rest;
     
     if(name == 0) 
	  isolated = 0;
     else
	  {
	  rest = AllocateString(LINELENGTH);
	  iso = IsolateNextWord(name,rest,')',LINELENGTH);
	  isolated = CopyString(iso);
	  Free(rest);
	  }
     return(isolated);
     }

static CommandLevel *StringNameToCommandLevels(CHAR *name)
     {
     CommandLevel *level,*toplevel;
     CHAR *rest,*string,*levellist,*topstring;
     INT count;
     
     if(name == 0) 
	  toplevel = 0;
     else
	  {
	  levellist = AllocateString(LINELENGTH);
	  rest = IsolateNextWord(name,levellist,')',LINELENGTH);
	  string = topstring = CopyString(levellist + 1);
	  toplevel = level = AllocateCommandLevel;
	  CreateCommandLevel(level,0,"main",0);
	  count = 1;
	  while(*string != ENDOFSTRING)
	       {
	       rest = IsolateNextWord(string,levellist,'.',LINELENGTH);
	       level = level->Next = AllocateCommandLevel;
	       CreateCommandLevel(level,count,levellist,0);
	       string = rest;
	       count++;
	       }
	  Free(topstring);
	  Free(levellist);
	  }
     return(toplevel);
     }
	  
static ArgumentSetInfo *GetArgumentFromAliases(CHAR *name, 
					       CommandMaster *commandmaster)
     {
     
     CommandInfo *commands;
     CommandLevel *levels;
     ArgumentSetInfo *current;
     CHAR *newname,*isolatedname;
     
     commands = commandmaster->Commands;

     newname = ConsiderAliases(name,commandmaster);
     levels  = StringNameToCommandLevels(newname);
     isolatedname = IsolateNameFromCompoundName(newname);
     
     if(levels == 0)
	  current = 0;
     else
	  current = GetArgLoop(isolatedname,commands,commandmaster->Utilities,
			       levels->Next);
     Free(isolatedname);
     FreeCommandLevel(levels);
     Free(levels);
     Free(newname);

     return(current);
     }

static ArgumentSetInfo *GetArgLoop(CHAR *name,
				   CommandInfo *command,
				   CommandInfo *utilities,
				   CommandLevel *level)
     {
     CommandInfo *newcommand;
     CommandLevel *newlevel;
     ArgumentSetInfo *current;
     
     if(IsArgumentInCommand(command,name))
	  {
	  current = command->Arguments;
	  }
     else if(level == 0)
	  current = 0;
     else if(MatchingNames(UTILITY_COMMAND_NAME,level->Name))
	  {
	  newcommand = SearchForCommandKeyWord(command,level->Name);
	  newlevel = level->Next;
	  current = GetArgLoop(name,newcommand,utilities,newlevel);
	  }
     else
	  {
	  newlevel = level->Next;
	  current = GetArgLoop(name,utilities,utilities,newlevel);
	  }
     return(current);
     }

static BaseArgumentType *IsArgumentInCommand(CommandInfo *command,
			     CHAR *name)
     {
     ArgumentSetInfo *set;
     BaseArgumentType *arg;
     INT count;
     
     set = command->Arguments;
     if(set == 0)
	  arg = 0;
     else
	  {
	  arg = set->Values;
	  count = 0;
	  while(count < set->NumberOfArguments &&
		MatchingNames(arg->Name,name))
	       {
	       count++;
	       arg++;
	       }
	  if(count >= set->NumberOfArguments)
	       arg = 0;
	  }
     return(arg);
     }






