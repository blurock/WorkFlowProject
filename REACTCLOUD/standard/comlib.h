#include "comlib/commnd.h"
#include "comlib/runtime.h"
#include "comlib/bind.h"

#define BIND_COMMANDMASTER  100

#ifndef COMMANDY
#include "command.h"
#endif

typedef struct master 
     {
     INT CommandNumber;
     CHAR *CommandLine;
     CommandInfo *FlatCommand;
     CommandInfo *Command;
     VariableNameSet *SysLstSet;
     VariableNameSet *LabelSet;
     } Master;


/******************************************************************************/
#define FLAGNAME  0
#define VARIABLE  1

#define MAXNUMBEROFCOMMANDS 11

#define NUMCOMMANDSUBPARTS     10

#define ARGUMENT          1
#define KEYWORDARGUE       2
#define SYSTEMLIST         3
#define OUTPUT             4
#define CHECK              6
#define KEYWORD    9
#define COMMENT    10     

#define NORMAL_VERBOSE     0
#define VERBOSE_VERBOSE    1

/**************************************************************************/
#define AGE_BEGIN    1
#define AGE_ERROR    -2
#define AGE_NOT_FORMED -1
/**************************************************************************/
/* Constants for error return and recovery */
#define COMLIB_NORMAL_RETURN     1
#define COMLIB_ERROR_RETURN      -1

#define FOUND_COMMAND      0
#define NORMAL_RETURN      0
#define ERROR_COMMAND     -1
#define LEAVE_LEVEL       -2
#define LEAVE_COMPLETELY  -3
#define STANDARD_ERROR 0
#define ERROR_BUFFER_LENGTH    500
#define PRINT_BUFFER_LENGTH    5000
/**************************************************************************/
extern KeyWords COMMANDSUBPARTS[];
extern KeyWords ARGUMENTSUBPARTS[];
extern KeyWords ARGUMENTPARAMETERS[];

/**************************************************************************/
/*  Runtime Definitions
*/
#define BATCH_INPUT 0
#define X_INPUT     2

/**************************************************************************/
#define COMMAND_DIRECTORY "./command"
#define COMMAND_NAME      "system"

#define UTILITY_SUFFIX           "cmd"
#define COMMAND_SUFFIX           "cmd"
#define LIST_SUFFIX              "lst"
#define STANDARD_ALIAS_SUFFIX    "als"

/**************************************************************************/
#define UTILITY_ACTIVATED         0
#define UTILITY_DEACTIVATED       1
#define UTILITY_COMMANDS_FILE    "util"

extern FunctionList UTILITY_FUNCTIONS;

/**************************************************************************/
#define ALIAS_INCREMENT          20

/**************************************************************************/

#define HELP_COMMAND_NAME     "Help"
#define HELP_COMMAND           1000
#define UTILITY_COMMAND_NAME   "Util"
#define UTILITY_COMMAND        1001
#define QUIT_COMMAND_NAME     "Quit"
#define QUIT_COMMAND           1002
#define PARAMETERS_COMMAND_NAME     "Parameters"
#define PARAMETERS_COMMAND           1003
extern CommandInfo HELP_COMMANDINFO;
extern CommandInfo UTILITY_COMMANDINFO;

/**************************************************************************/
/* age.c */
/**************************************************************************/
extern INT GetOldestAge();
extern INT InitializeAge(BindStructure *bind);
extern INT GetCurrentAge(BindStructure *bind);
extern void IncrementAge(BindStructure *bind);

/**************************************************************************/
/* bind0.c */
/**************************************************************************/
extern BindStructure *InitializeBindStructure(INT n);
extern INT BindStructureIntoMaster(VOID structure,
				   INT structureflag,
				   BindStructure *bind);
extern VOID GetBoundStructure(BindStructure *bind,
			      INT flag);
extern INT GetOldestAge();
extern INT GetCurrentAge(BindStructure *bind);
extern void IncrementAge(BindStructure *bind);

/**************************************************************************/
/* alias.c */
/**************************************************************************/
extern INT GetMasterAliases(CHAR *aliasname,
			    CommandMaster *commandmaster,
			    CHAR *commanddirectory);
extern INT AddInAlias(CHAR *alias, CHAR *substitute,
		      CommandMaster *commandmaster);
extern CHAR *ConsiderAliases(CHAR *value,
			     CommandMaster *commandmaster);
/**************************************************************************/
/* errstat.c */
/**************************************************************************/

extern void ErrorStatusSet(CHAR *string, 
			  INT flag,
			   CommandMaster *commandmaster);
extern INT GetErrorFlag(CommandMaster *commandmaster);
extern INT ResetErrorFlag(CommandMaster *commandmaster);

/**************************************************************************/
/* files.c */
/**************************************************************************/
extern FILE *MasterOpenReadFile(CHAR *directory, CHAR *name, CHAR *suffix,
				INT flag,
				CHAR *description,
				CommandMaster *commandmaster);
extern FILE *MasterOpenWriteFile(CHAR *directory, CHAR *name, CHAR *suffix,
				 INT flag,
				 CHAR *description,
				 CommandMaster *commandmaster);
extern FILE *OpenReadFileFromCurrent(CHAR *directory, CHAR *name, CHAR *suffix,
				     INT flag,
				     CHAR *description,
				     CommandMaster *commandmaster);
extern FILE *OpenWriteFileFromCurrent(CHAR *directory, CHAR *name, CHAR *suffix,
				      INT flag,
				      CHAR *description,
				      CommandMaster *commandmaster);
extern CHAR *ProduceFileName(CHAR *directory, CHAR *name, CHAR *suffix);

/**************************************************************************/
/* setup0.c */
/**************************************************************************/
extern CommandInfo *MergeTwoCommandInfo(CommandInfo *com0,
					CommandInfo *com1,
					CommandInfo *com2);
extern FunctionList *MergeFunctionInfo(INT id, CHAR *name,
				       FunctionList *list1,
				       FunctionList *list2);
/**************************************************************************/
/* setup1.c */
/**************************************************************************/
extern void SetupCommandMaster(CommandSource *source,
			       FunctionList *functions,
			       BindStructure *programstructure,
			       INT (*InputValues)(),
			       CHAR *commanddirectory,
			       CHAR *commandlist,
			       CHAR *utilname);

/**************************************************************************/
/* argument.c */
/**************************************************************************/
extern CommandInfo *MergeArgumentSetInfoToCommandInfo(CommandInfo *newcommands,
						      CommandInfo *commands,
						      INT (*InputValues)());
extern ArgumentSetInfo *GetListOfArguments(CommandMaster *commandmaster);
extern ArgumentSetInfo *MergeArgumentSetInfo(ArgumentSetInfo *set1,
					     ArgumentSetInfo *set2);
extern CommandInfo *FormNewCommand(Master *master, CommandInfo *command);
extern ArgumentInfo 
         *FillInArgument(INT type, CHAR *name,
			 ArgumentSetInfo *argumentset);
extern BaseArgumentType
         *FillInBaseArgumentType(INT type,CHAR *name,
				 ArgumentSetInfo *argumentset);
extern BaseArgumentType *SetBaseArgumentType(INT type,
					     CHAR *name,
					     INT i,
					     FLOAT f,
					     STRING *s);
extern CHAR *PrintPrettyArgumentSetInfo(CHAR *buffer, INT *bufferleft,
				       CHAR *indent,
				       ArgumentSetInfo *set);
extern CHAR *PrintPrettyArgumentInfo(CHAR *buffer, INT *bufferleft,
				    CHAR *indent,
				    ArgumentInfo *argument);
extern void SetCurrentValueFromString(CHAR *name, CHAR *string, 
				      CommandMaster *commandmaster);
extern BaseArgumentType *GetCurrentArgument(CHAR *name,
					    CommandMaster *commandmaster);
extern CHAR *GetCurrentStringArgument(CHAR *name,
				      CommandMaster *commandmaster);
extern INT GetCurrentIntegerArgument(CHAR *name,
				     CommandMaster *commandmaster);
extern FLOAT GetCurrentFloatArgument(CHAR *name,
				     CommandMaster *commandmaster);
extern ArgumentSetInfo *GetArgInCommandInfo(CHAR *name,
					    CommandMaster *commandmaster);
/**************************************************************************/
/* execute.c */
/**************************************************************************/
extern INT SubMasterCommand(CHAR *type, BindStructure *bind);
extern CommandInfo *FindCurrentCommandInfo(CommandMaster *commandmaster);
extern CommandInfo *FindLastCommandInfo(CommandMaster *commandmaster);
extern INT MatchingNames(CHAR *name, CHAR *compare);
extern CommandInfo *SearchForCommandKeyWord(CommandInfo *command, CHAR *type);
extern KeyWordArray *ConvertCommandToKeyWords(CommandInfo *command,
					      CommandMaster *commandmaster);
/**************************************************************************/
/* levellib.c */
/**************************************************************************/
extern INT SetDefaultValue(BindStructure *bind);
extern INT SetInputValue(BindStructure *bind);
extern void PrintCurrentArgumentValue(CommandMaster *commandmaster,
				      BaseArgumentType *value);

/**************************************************************************/
/* aux.c */
/**************************************************************************/
extern INT LevelHelpCommand(BindStructure *bind);
extern INT QuitCommandLevel(BindStructure *bind);
extern INT UtilityCommand(BindStructure *bind);
extern INT ProtocolOutput(BindStructure *bind);
extern INT PrintParameterValue(BindStructure *bind);
extern INT PrintLevelSetOfArguments(BindStructure *bind);
extern INT PrintOutAliases(BindStructure *bind);
extern INT PrintOutTotalCommandTree(BindStructure *bind);
extern INT PrintOutCommandTree(BindStructure *bind);

/**************************************************************************/
/* level.c */
/**************************************************************************/
extern CommandLevel *GetLastLevel(CommandMaster *master);
extern CommandLevel *FormNextLevel(CommandInfo *inputa,
				   CommandMaster *commandmaster);
extern void FreeLastLevel(CommandMaster *commandmaster);


/**************************************************************************/
/* print.c */
/**************************************************************************/
extern void PrintOutputString(CHAR *line, CommandMaster *commandmaster);
extern void PrintProtocolString(CHAR *line, CommandMaster *commandmaster);
extern void PrintErrorString(CHAR *line, CommandMaster *commandmaster);
extern void StringStringBuffer(CHAR *line, StringBuffer *buffer);
extern void PrintPrettyVariableNameSet(CHAR *indent,
				       VariableNameSet *set,
				       CommandMaster *commandmaster);
extern void PrintPrettyKeyArgumentInfo(CHAR *indent,
				       KeyArgumentInfo *key,
				       CommandMaster *commandmaster);
extern void PrintPrettyKeyArgumentSet(CHAR *indent,
				      KeyArgumentSet *set,
				      CommandMaster *commandmaster);
extern void PrintPrettySysLstArgumentSet(CHAR *indent,
					 SysLstArgumentSet *set,
					 CommandMaster *master);
extern void PrintPrettyKeyWordSetInfo(CHAR *indent,
				      KeyWordSetInfo *set,
				      CommandMaster *commandmaster);
extern void PrintPrettyArgumentNames(CHAR *indent,
				     ArgumentSetInfo *set,
				     CommandMaster *commandmaster);
extern void PrintPrettyCommandInfo(CHAR *indent,
				   CommandInfo *command,
				   CommandMaster *commandmaster);
extern void ResetStringBuffer(StringBuffer *buffer, INT size);
extern StringBuffer *InitializeStringBuffer(INT id, CHAR *name, INT size);

/**************************************************************************/
/* sprint.c */
/**************************************************************************/
extern void StringBaseArgumentType(BaseArgumentType *base,
				   CHAR *string);
extern void StringVariableName(VariableName *name, 
				CHAR *string);
extern void StringFunctionInfo(FunctionInfo *func,
			       CHAR *string);
extern void StringTitleInfo(TitleInfo *title,
			       CHAR *string);
extern void StringKeyWordInfo(KeyWordInfo *key,
			      CHAR *string);
extern void StringTitleInfo(TitleInfo *title,
			    CHAR *string);
extern void StringKeyWordInfo(KeyWordInfo *key,
			      CHAR *string);
extern void StringSysLstArgumentInfo(SysLstArgumentInfo *argue,
				     CHAR *string);

/**************************************************************************/
/* batch.c */
/**************************************************************************/
extern INT StartStandardCommands(int argc, char *argv[],
				  CHAR *name,
				  CHAR *directory,
				  FunctionList *commandfunctions,
				  CommandSource *source,
				  BindStructure *bind);
extern void BatchCommandLoop(BindStructure *bind);
extern void AskQuestionBatch(CHAR *name,
			     BindStructure *bind);
extern CommandSource *SetUpStandardSource(CHAR *name, INT inputa);
extern BindStructure *StandardCommandBegin(int argc, 
					   char *argv[],
					   CHAR *prettyname,
					   INT version,
					   INT numberbind);
