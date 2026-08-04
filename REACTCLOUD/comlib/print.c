#include "basic.h"
#include "comlib.h"

extern void PrintOutputString(CHAR *line, CommandMaster *commandmaster)
     {
     StringStringBuffer(line,commandmaster->Source->StandardOut);
     }

extern void PrintProtocolString(CHAR *line, CommandMaster *commandmaster)
     {
     StringStringBuffer(line,commandmaster->Source->ProtocolOut);
     }

extern void PrintErrorString(CHAR *line, CommandMaster *commandmaster)
     {
     StringStringBuffer(line,commandmaster->Source->ErrorOut);
     }

extern StringBuffer *InitializeStringBuffer(INT id, CHAR *name, INT size)
     {
     StringBuffer *buffer;
     
     buffer = AllocateStringBuffer;

     if(size <= 0)
	  size = PRINT_BUFFER_LENGTH;

     CreateStringBuffer(buffer,id,name,size,0,0);
     buffer->OutputFile = stdout;
     buffer->OutputBuffer = AllocateString(size);
     return(buffer);
     }


extern void ResetStringBuffer(StringBuffer *buffer, INT size)
     {

     if(buffer->OutputBuffer != 0)
	  Free(buffer->OutputBuffer);
     if(size <= 0)
	  size = PRINT_BUFFER_LENGTH;
     
     buffer->OutputBuffer = AllocateString(size);
     }

extern void StringStringBuffer(CHAR *line, StringBuffer *buffer)
     {
     INT len,linelen,size;
     CHAR *new;
     
     len = strlen(buffer->OutputBuffer);
     linelen = strlen(line);
     if(len >= buffer->BufferLeft)
	  {
	  size = len + PRINT_BUFFER_LENGTH;
	  new = AllocateString(size);
	  strcpy(new,buffer->OutputBuffer);
	  Free(buffer->OutputBuffer);
	  buffer->OutputBuffer = new;
	  }
     
     PrintStringString(buffer->OutputBuffer + len,&(buffer->BufferLeft),line);
     
     if(buffer->OutputFile != 0)
	  {
	  fprintf(buffer->OutputFile,"%s",line);
	  }
     }

extern void PrintPrettyVariableNameSet(CHAR *indent,
				       VariableNameSet *set,
				       CommandMaster *commandmaster)
     {
     VariableName *name;
     CHAR *string,*line;
     INT i;
     
     if(set != 0)
	  {
	  string = AllocateString(LINELENGTH);
	  line = AllocateString(LINELENGTH);
	  
	  name = set->Names;
	  LOOPi(set->NumberOfNames)
	       {
	       StringVariableName(name++,string);
	       sprintf(line,"%s %d:%s\n",indent, i, string);
	       PrintOutputString(line,commandmaster);
	       }
	  Free(string);
	  Free(line);
	  }
     }


extern void PrintPrettyKeyArgumentInfo(CHAR *indent,
				       KeyArgumentInfo *key,
				       CommandMaster *commandmaster)
     {
     CHAR *string,*line;
     
     if(key != 0)
	  {     
	  line = AllocateString(LINELENGTH);
	  string = AllocateString(LINELENGTH);

	  sprintf(line,"%s KeyArgumentInfo: %d:%s\n",indent,key->ID, key->Name);
	  PrintOutputString(line,commandmaster);

	  StringVariableName(key->KeySetName, string);
	  sprintf(line,"%s     :KeySetName %s\n",indent,string);
	  PrintOutputString(line,commandmaster);

	  StringTitleInfo(key->Title, string);
	  sprintf(line,"%s     :Title %s\n",indent,string);
	  PrintOutputString(line,commandmaster);
	  
	  Free(line);
	  Free(string);
	  }
     }

extern void PrintPrettyKeyArgumentSet(CHAR *indent,
				      KeyArgumentSet *set,
				      CommandMaster *commandmaster)
     {
     CHAR *newindent,*line;
     KeyArgumentInfo *argument;
     INT i;
     
     line = AllocateString(LINELENGTH);
     newindent = AllocateString(LINELENGTH);
     
     if(set == 0)
	  {
	  sprintf(line,"%s<KeyArgumentSet> empty\n",indent);
	  PrintOutputString(line,commandmaster);
	  }
     else
	  {
	  sprintf(line,"%s KeyArgumentSetInfo: %d:%s\n",
		  indent,set->ID, set->Name);
	  PrintOutputString(line,commandmaster);
	  
	  argument = set->KeyArguments;
	  LOOPi(set->NumberOfKeys)
	       {
	       sprintf(line,"%s<%d>\n",indent,i);
	       PrintOutputString(line,commandmaster);
	       sprintf(newindent,"%s      :",indent);
	       PrintPrettyKeyArgumentInfo(newindent,argument++,commandmaster);
	       }
	  }
     }

extern void PrintPrettySysLstArgumentSet(CHAR *indent,
					 SysLstArgumentSet *set,
					 CommandMaster *commandmaster)
     {
     CHAR *string,*line;
     SysLstArgumentInfo *syslst;
     INT i;
     
     line = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);
     
     if(set != 0)
	  {
	  sprintf(line,"%s SysLstArgumentSet :%d:%s\n",indent,set->ID,set->Name);
	  PrintOutputString(line,commandmaster);
	  
	  syslst = set->SysLstArguments;
	  LOOPi(set->NumSysLst)
	       {
	       StringSysLstArgumentInfo(syslst++,string);
	       sprintf(line,"%s     <%5d>%s\n",indent,i,string);
	       PrintOutputString(line,commandmaster);
	       }
	  }
     Free(line);
     Free(string);
     }


extern void PrintPrettyKeyWordSetInfo(CHAR *indent,
				      KeyWordSetInfo *set,
				      CommandMaster *commandmaster)
     {
     CHAR *string,*line;
     KeyWordInfo *argument;
     INT i;
     
     line = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);
     
     if(set == 0)
	  {
	  sprintf(line,"%s<KeyWordSetInfo> empty\n",indent);
	  PrintOutputString(line,commandmaster);
	  }
     else
	  {
	  sprintf(line,"%s KeyWordSetInfo: %d:%s (%d in total)\n",
	     indent,set->ID, set->Name, set->NumberOfKeys);
	  PrintOutputString(line,commandmaster);

	  argument = set->Keys;
	  LOOPi(set->NumberOfKeys)
	       {
	       StringVariableName(argument->KeyFlagName, string);
	       sprintf(line,"%s     :%5d:%s<%s>\n",
		       indent,argument->ID,
		       string,argument->Name);
	       PrintOutputString(line,commandmaster);
	       argument++;
	       }
	  }
     Free(line);
     Free(string);
     }

extern void PrintPrettyArgumentNames(CHAR *indent,
				     ArgumentSetInfo *set,
				     CommandMaster *commandmaster)
     {
     INT i;
     BaseArgumentType *args;
     CHAR *line;
     
     
     line = AllocateString(LINELENGTH);

     if(set != 0)
	  {
	  sprintf(line,"%s: %d Arguments-> ",indent,set->NumberOfArguments);
	  PrintOutputString(line,commandmaster);

	  args = set->Values;
	  LOOPi(set->NumberOfArguments)
	       {
	       sprintf(line,"(%d:%s)",i,args->Name);
	       PrintOutputString(line,commandmaster);
	       args++;
	       }
	  sprintf(line,"\n");
	  PrintOutputString(line,commandmaster);
	  }
     Free(line);
     }

extern void PrintPrettyCommandInfo(CHAR *indent,
				   CommandInfo *command,
				   CommandMaster *commandmaster)
     {
     CHAR *string,*line;
     CommandInfo *subcommand;
     INT i;
     

     line = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);

     if(command != 0)
	  {
	  sprintf(line,"\n%s :Command Information  %d:%s\n",
		  indent, command->ID, command->Name);
	  PrintOutputString(line,commandmaster);
	  
	  StringVariableName(command->FlagName,string);
	  sprintf(line,"%s :FlagName %s\n",indent,string);
	  PrintOutputString(line,commandmaster);
     
	  if(command->Function != 0)
	       {
	       StringFunctionInfo(command->Function,string);
	       sprintf(line,"%s :Function %s\n",indent,string);
	       PrintOutputString(line,commandmaster);
	       }

	  sprintf(string,"%s          ",indent);
	  
	  if(command->KeySetInfo !=0)
	       {
	       sprintf(line,"%s :The Set of Key Definitions\n",indent);
	       PrintOutputString(line,commandmaster);
	       PrintPrettyKeyWordSetInfo(string,command->KeySetInfo,
					 commandmaster);
	       }
	  if(command->Arguments != 0)
	       {
	       sprintf(line,"%s :The Set of Arguments\n",indent);
	       PrintOutputString(line,commandmaster);
	       PrintPrettyArgumentNames(string,command->Arguments,
					commandmaster);
	       }
	  if(command->Keys != 0)
	       {
	       sprintf(line,"%s :The Set of Key Arguments\n",indent);
	       PrintOutputString(line,commandmaster);
	       PrintPrettyKeyArgumentSet(string,command->Keys,
					 commandmaster);
	       }
	  if(command->SysLstSet != 0)
	       {
	       sprintf(line,"%s :The Set of System List Arguments\n",indent);
	       PrintOutputString(line,commandmaster);
	       PrintPrettySysLstArgumentSet(string,command->SysLstSet,
					    commandmaster);
	       }
	  if(command->Output != 0)
	       {
	       sprintf(line,"%s :The Set of Output Arguments\n",indent);
	       PrintOutputString(line,commandmaster);
	       PrintPrettySysLstArgumentSet(string,command->Output,
					    commandmaster);
	       }
	  if(command->Checks != 0)
	       {
	       sprintf(line,"%s :The Set of Check Arguments\n",indent);
	       PrintOutputString(line,commandmaster);
	       PrintPrettySysLstArgumentSet(string,command->Checks,
					    commandmaster);
	       }
	  
	  if(command->NumSubCommands != 0)
	       {
	       sprintf(line,"%s :The SubCommands (%d in total)\n",
		       indent,command->NumSubCommands);
	       PrintOutputString(line,commandmaster);
	       subcommand = command->SubCommands;
	       LOOPi(command->NumSubCommands)
		    {
		    sprintf(line,"%s<%5d>\n",indent,i);
		    PrintOutputString(line,commandmaster);
		    sprintf(string,"%s           :",indent);
		    PrintPrettyCommandInfo(string,subcommand++,
					   commandmaster);
		    }
	       }
	  Free(string);
	  }
     Free(line);
     }

     
