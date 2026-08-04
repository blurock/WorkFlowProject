#include "basic.h"
#include "comlib.h"

/*************************************************************************/
static void ReadCommandStructure(INT id, CHAR *name,
				 CHAR *comdirectory, CHAR *commandlist,
				 CommandMaster *commandmaster);

extern FILE *yyin;
/*extern void yyrestart( FILE *input_file );*/
extern int yyparse();
CommandInfo *Current_Command;

extern INT DEBUGPRINT;
CommandInfo *command, **CommandLevelHistory,*currentcommand;
Master master;

extern void SetupCommandMaster(CommandSource *source,
			       FunctionList *functions,
			       BindStructure *programstructure,
			       INT (*InputValues)(),
			       CHAR *commanddirectory,
			       CHAR *commandlist,
			       CHAR *utilname)
     {
     CommandMaster *commandmaster;
     CommandInfo *parms;
     
     commandmaster = AllocateCommandMaster;
     CreateCommandMaster(commandmaster,
			 UTILITY_DEACTIVATED,
			 source->Name,
			 0,0,0,0,0,0,0);

     commandmaster->Source = source;
     commandmaster->Functions = functions;
     
     ReadCommandStructure(source->ID,source->Name,
			  commanddirectory,commandlist,
			  commandmaster);

     commandmaster->Commands = Current_Command;

     parms = AllocateCommandInfo;
     MergeArgumentSetInfoToCommandInfo(parms,Current_Command,InputValues);
     
     commandmaster->Commands = parms;
     FreeCommandInfo(Current_Command);
     Free(Current_Command);
     
     commandmaster->Utilities = Current_Command = AllocateCommandInfo;
     CreateCommandInfo(Current_Command,
		       UTILITY_DEACTIVATED,
		       UTILITY_COMMAND_NAME,
		       0,0,0,0,0,0,0,0,0,0,0);
     commandmaster->MasterProgInfo = programstructure;
     
     /*
     yyin = MasterOpenReadFile(commanddirectory,
			       utilname,
			       UTILITY_SUFFIX, 
			       FATAL,"Utility Command Definition",
			       commandmaster);
     yyrestart(yyin);
     yyparse();
     fclose(yyin);

     MergeArgumentSetInfoToCommandInfo(parms,Current_Command,InputValues);
     */
     parms = AllocateCommandInfo;
     CreateCommandInfo(parms,0,0,0,0,0,0,0,0,0,0,0,0,0);
     commandmaster->Utilities = parms;
    /*
     FreeCommandInfo(Current_Command);
     Free(Current_Command);
     */

     GetMasterAliases(commandlist,
		      commandmaster,
		      commanddirectory);
     BindStructureIntoMaster(commandmaster, 
			     BIND_COMMANDMASTER, 
			     programstructure);
     }

/* ReadInCommandStructure
  This routine creates a tree of CommandInfo structures by reading
  in a set of individual .cmd files specified by the input file given.
*/
static void ReadCommandStructure(INT id, CHAR *name,
				 CHAR *comdirectory, CHAR *commandlist,
				 CommandMaster *commandmaster)
     {
     CHAR *line,*next;
     INT second;
     FILE *file;
     
     file = MasterOpenReadFile(comdirectory,
			       commandlist,
			       LIST_SUFFIX,
			       FATAL,"Command Definitions",
			       commandmaster);
 
     line = AllocateString(LINELENGTH);
     
     Current_Command = AllocateCommandInfo;
     CreateCommandInfo(Current_Command,id,name,
		       0,0,0,0,0,0,0,0,0,0,0);
     
     next = NextNonBlankLine(file,line);
     master.CommandNumber = 1;
     master.CommandLine = 0;
     CommandLevelHistory = AllocPntrArrayCommandInfo(10);
     
     second = 0;
     while(next != 0)
	  {
	  yyin = MasterOpenReadFile(comdirectory,next,COMMAND_SUFFIX,
				    RECOVER,"Command Definitions",
				    commandmaster);
     	  if(yyin != 0)
	       {
		 /*if(second == 1) yyrestart(yyin);*/
	       yyparse();
	       fclose(yyin);
	       }

	  next = NextNonBlankLine(file,line);
	  second = 1;
	  }
     Free(line);
     Free(CommandLevelHistory);
     fclose(file);
     }

