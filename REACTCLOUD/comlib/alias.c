#include "basic.h"
#include "comlib.h"

#define SYSTEM_NAME_FLAG_STRING    "MASTER"

static AliasArray *ExpandAliasArray(CommandMaster *commandmaster);
static CHAR *FindAliasString(CHAR *name,CommandMaster *commandmaster);
static FILE *GetAliasFile(CommandMaster *commandmaster,
			  CHAR *commanddirectory);
static INT ReadInAliases(CommandMaster *commandmaster,
			 CHAR *commanddirectory);

extern INT GetMasterAliases(CHAR *aliasname,
			    CommandMaster *commandmaster,
			    CHAR *commanddirectory)
     {
     AliasArray *set;
     
     set = commandmaster->AliasSet;
     
     if(set == 0)
	  {
	  commandmaster->AliasSet = set = AllocateAliasArray;
	  CreateAliasArray(set,commandmaster->ID,
			   aliasname,
			   ALIAS_INCREMENT,ALIAS_INCREMENT,0);
	  set->NumberOfAliases = 0;
	  ReadInAliases(commandmaster, commanddirectory);
	  }
	  
     return(NORMAL_RETURN);
     }

extern INT AddInAlias(CHAR *alias, CHAR *substitute,
			CommandMaster *commandmaster)
     {
     AliasArray *set;
     AliasString *newalias;
     
     GetMasterAliases(0,commandmaster,0);
     set = commandmaster->AliasSet;
     
     if(set->NumberOfAliases >= set->MaxNumber)
	  set = ExpandAliasArray(commandmaster);
     
     newalias = set->Set + set->NumberOfAliases;
     set->NumberOfAliases +=1;
     CreateAliasString(newalias,set->NumberOfAliases,alias,alias,substitute);
     
     return(NORMAL_RETURN);
     }

extern CHAR *ConsiderAliases(CHAR *value,
			     CommandMaster *commandmaster)
     {
     CHAR *line,*string,*alias;
     
     line = CopyString(value);
     string = EliminateLeadingBlanks(line);
     
     if(!strcmp("MASTER",string))
	  alias = CopyString(commandmaster->Name);
     else
	  {
	  string = FindAliasString(string,commandmaster);
	  if(string == 0)
	       alias = CopyString(value);
	  else
	       alias = CopyString(string);
	  }
     
     Free(line);
     return(alias);
     }

static CHAR *FindAliasString(CHAR *name,CommandMaster *commandmaster)
     {
     AliasArray *set;
     CHAR *done;
     INT count;
     AliasString *alias;
     
     GetMasterAliases(0,commandmaster,0);
     set = commandmaster->AliasSet;

     alias = set->Set;
     done = 0;
     count = 0;
     while(done == 0 && count < set->NumberOfAliases)
	  {
	  if(!strcmp(alias->KeyWord,name))
	       done = alias->Alias;
	  alias++;
	  count++;
	  }
     return(done);
     }

     
static INT ReadInAliases(CommandMaster *commandmaster,
			 CHAR *commanddirectory)
     {
     FILE *file;
     CHAR *line,*alias,*substitute,*rest,*string;
     AliasArray *aliases;
     INT error;
     
     file  = GetAliasFile(commandmaster,
			  commanddirectory);
     error = NORMAL_RETURN;
     
     if(file != 0)
	  {
	  aliases = commandmaster->AliasSet;
	  
	  string = AllocateString(LINELENGTH);
	  alias = AllocateString(LINELENGTH);
	  substitute = AllocateString(LINELENGTH);
	  
	  line = NextNonBlankLine(file,string);
	  while(line != 0)
	       {
	       rest = IsolateNextWord(line,alias,BLANK,LINELENGTH);
	       rest = IsolateNextWord(rest,substitute,BLANK,LINELENGTH);
	       AddInAlias(alias,substitute,commandmaster);
	       line = NextNonBlankLine(file,string);
	       }
	  
	  Free(string);
	  Free(alias);
	  Free(substitute);
	  fclose(file);
	  }
     else
	  error = ERROR_COMMAND;
     
     return(error);
     }

static FILE *GetAliasFile(CommandMaster *commandmaster,
			  CHAR *commanddirectory)
     {
     FILE *file;
     
     file = MasterOpenReadFile(commanddirectory,
			       commandmaster->AliasSet->Name,
			       STANDARD_ALIAS_SUFFIX,
			       FATAL,"Alias Definitions",commandmaster);
     return(file);
     }

static AliasArray *ExpandAliasArray(CommandMaster *commandmaster)
     {
     AliasArray *set,*new;
     INT newsize,i;
     AliasString *oldalias,*newalias;
     
     GetMasterAliases(0,commandmaster,0);
     set = commandmaster->AliasSet;

     newsize = set->MaxNumber + ALIAS_INCREMENT;
     
     new = AllocateAliasArray;
     CreateAliasArray(new,set->ID,set->Name,newsize,newsize,0);

     newalias = new->Set;
     oldalias = set->Set;
     LOOPi(set->NumberOfAliases)
	  {
	  CopyFullAliasString(newalias,oldalias);
	  newalias++;
	  oldalias++;
	  }

     new->NumberOfAliases = set->NumberOfAliases;
     FreeAliasArray(commandmaster->AliasSet);
     Free(commandmaster->AliasSet);
     commandmaster->AliasSet = new;
     return(new);
     }





