#include "basic.h"
#include "comlib.h"
static CHAR *BatchGetCommandKeyWord(BindStructure *bind);
extern void AskQuestionBatch(CHAR *name,
			     BindStructure *bind);
INT DEBUGPRINT;

extern INT StartStandardCommands(int argc, char *argv[],
				  CHAR *name,
				  CHAR *directory,
				  FunctionList *commandfunctions,
				  CommandSource *source,
				  BindStructure *bind)
     {
     CHAR *commandinputfile;
     
     source->ID = 0;
     switch(bind->ID)
	  {
     case 1:
	  commandinputfile = ProduceFileName("./",bind->Name,"prg");
	  source->File = OpenReadFile(commandinputfile,"",FATAL);
      case 0:
	   SetupCommandMaster(source,commandfunctions,bind,
			      SetInputValue,
			      directory,
			      name,
			      "util");
	   BatchCommandLoop(bind);
	   break;
	  }

     return(0);
     }


/*******************************************************************************/
/**   Batch Master Command Call                                                     **/
/*******************************************************************************/
/* NOTE:   input->ID
              > 0              --  Found External Command to Execute
              < 0              --  Found Exit Loop Command (Exit to next Level)
              == 0             --  Found Standard Command (Continue at Level)
              == ERROR_COMMAND -- An Unknown Command was found
*/
extern void BatchCommandLoop(BindStructure *bind)
     {
     INT done;
     CHAR *type;

     done = 0;
     while(done == 0 || done == LEAVE_LEVEL)
	  {
	  type = BatchGetCommandKeyWord(bind);
	  if(!strcmp(type,"Commands"))
	       {
	       type = BatchGetCommandKeyWord(bind);
	       done = SubMasterCommand(type,bind);
	       }
	  else if(!strcmp(type,"Help"))
	       LevelHelpCommand(bind);
	  else if(!strcmp(type,"Util"))
	       UtilityCommand(bind);
	  else if(!strcmp(type,"Quit"))
	       done = QuitCommandLevel(bind);
	  else
	       done = SubMasterCommand(type,bind);
	  }
     }

static CHAR *BatchGetCommandKeyWord(BindStructure *bind)
     {
     CommandSource *source;
     CommandLevel *level;
     CHAR *type, *name;
     CommandMaster *commandmaster;

     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     source = commandmaster->Source;
     level = GetLastLevel(commandmaster);
     
     name = AllocateString(LINELENGTH);
     IsolateNextWord(level->Name,name,COLON,LINELENGTH);
     fprintf(source->StandardOut->OutputFile,"%s>> ",name);
     fflush(source->StandardOut->OutputFile);
     Free(name);
     
     NextNonBlankLine(source->File,&(source->Command->Line[0]));
     source->Command->Rest = &(source->Command->Line[0]);
     type = CommandIsolateString(source->Command,COLON);
     return(type);
     }

extern void AskQuestionBatch(CHAR *name,
			     BindStructure *bind)
     {
     CHAR *string;
     CommandSource *source;
     CommandLevel *level;
     CommandMaster *commandmaster;

     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     source = commandmaster->Source;
     level = GetLastLevel(commandmaster);
     
     fprintf(source->StandardOut->OutputFile,"Enter: %s>> ",name);
     fflush(source->StandardOut->OutputFile);
     
     NextNonBlankLine(source->File,&(source->Command->Line[0]));
     source->Command->Rest = &(source->Command->Line[0]);
     string = CommandIsolateString(source->Command,BLANK);

     SetCurrentValueFromString(name,string,commandmaster);
     }


extern CommandSource *SetUpStandardSource(CHAR *name, INT input)
     {
     CommandSource *source;
     
     source = AllocateCommandSource;
     CreateCommandSource(source,input,name,
			 0,0,0,0,0,0,0);
     
     source->File = stdin;
     
     source->ErrorStat = AllocateErrorStatus;
     source->StandardOut = InitializeStringBuffer(input,name,0);
     source->ProtocolOut = InitializeStringBuffer(input,name,0);
     source->ErrorOut = InitializeStringBuffer(input,name,0);
     
     source->ErrorOut->OutputFile = stderr;
     
     source->Command = AllocateCommandReturn;
     return(source);
     }

extern BindStructure *StandardCommandBegin(int argc, 
					   char *argv[],
					   CHAR *prettyname,
					   INT version,
					   INT numberbind)
     {
     CHAR *rootname;
     INT inputtype;
     BindStructure *bind;
     
     PrintAllocSummary();
     printf("-----------------%s ------------------\n",prettyname);
     printf("-----------------Version %d    --------------------\n",version);

     InitAlloc(15000);
     PrintAllocSummary();

     if(argc < 3)
	  {
	  printf("Call:\n");
	  printf("   %s root\n",argv[0]);
	  printf("           root - The root name of the run\n");
	  printf("          input - 0 Terminal\n");
          printf("                  1 File: root.prg\n");
          printf("                  2 X-Windows\n");
	  printf("Input:\n");
	  printf("   root.lst - a list of .cmd file root names (i.e. no .cmd)\n");
	  exit(-1);
	  }
     
     rootname = CopyString(argv[1]);
     inputtype = ConvertStringToInteger(argv[2]);

     bind = InitializeBindStructure(numberbind+5);

     bind->ID = inputtype;
     
     bind->Name = rootname;
     
     return(bind);
     }

extern BindStructure *StandardLibraryBegin(CHAR *jobname,
					   CHAR *prettyname,
					   INT version,
					   INT numberbind)
     {
     BindStructure *bind;
     
     PrintAllocSummary();
     printf("-----------------%s ------------------\n",prettyname);
     printf("-----------------Version %d    --------------------\n",version);

     InitAlloc(15000);
     PrintAllocSummary();

     bind = InitializeBindStructure(numberbind+5);

     bind->ID = version;
     
     bind->Name = CopyString(jobname);
     
     return(bind);
     }
