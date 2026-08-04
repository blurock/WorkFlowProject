%{
#define COMMANDY
#include "basic.h"
/*#include "datmat0.h"*/
#include "comlib.h"
extern INT CommandDebug;
extern CommandInfo *Current_Command;
extern char *yytext;
int yywrap(char *msg);
INT level,Conum[10],conum;
extern CommandInfo *command, **CommandLevelHistory,*currentcommand;
extern Master master;
FILE *file;
ArgumentInfo *argument;
BaseArgumentType *value;
void yyerror(char *msg);
%}
%union 	{
	int integer_value;
	float float_value;
        char *string_value;
	CommandInfo *command_info;
	}
 
%token END_OF_FILE SPACE CR
%token <string_value> BASIC_NAME TITLE title_string DEFAULT_STRING
%token COMMAND  
%token  FUNCTION 
%token ENDCOMMAND DONE
%token ARGUMENTS END_ARGUMENTS
%token <integer_value> Y_Integer_Value 
%token <float_value> Y_Float_Value
%type <command_info> command_tree
%token INT_VALUE FLOAT_VALUE STRING_VALUE INPUT_FILE_NAME OUTPUT_FILE_NAME
%token LOWER UPPER DEFAULT
%%
command_tree
              :
				{
				currentcommand = Current_Command;
				}
		command_level
		DONE
				{
				$$ = currentcommand;
				}
		;

command_level  :
               |
                command_level
                command
               ;

command        :                                   
				{
				conum +=1;
				Conum[level] += 1;
				if(CommandDebug >= DEBUG1)
					printf("Command (%d,%d) Begining\n",
						level,Conum[level]);
				command = FormNewCommand(&master,currentcommand);
				}
                COMMAND
                command_name
                command_key
                command_info
				{
				*(CommandLevelHistory + level) = currentcommand;
				level++;
				Conum[level] = 0;
				currentcommand = command;
				}
		argument_parts
                command_level
				{
				level--;
				currentcommand = *(CommandLevelHistory + level);
				}
                ENDCOMMAND
				{
				if(CommandDebug >= DEBUG1)
					printf("Command (%d,%d) End:\n",
						level,Conum[level]);
				}

command_name   : 
                BASIC_NAME
				{
				if(CommandDebug >= DEBUG1) printf("BASIC_NAME\n");
				Free(command->Name);
				command->Name = $1;
				}
               ;

command_key    :
                BASIC_NAME      
				{
				command->FlagName = AllocateVariableName;
				CreateVariableName(command->FlagName, 
					master.CommandNumber,
					$1);
				Free($1);
				}
      
               ;

command_info   : 
               | command_part 
                 command_info
               ;

command_part   : 
                 FUNCTION function_name  
               | TITLE                   
				{
				command->Comment = AllocateTitleInfo;
				CreateTitleInfo(command->Comment, 
					command->ID,($1)+5);
				}
               ;

function_name  :                         
                 BASIC_NAME              
				{
				command->Function = AllocateFunctionInfo;
				CreateFunctionInfo(command->Function,0,
					$1,0);
				Free($1);
				}
               ;
argument_parts :
		| ARGUMENTS 
				{
				if(CommandDebug >= DEBUG1) printf("ARGUMENTS\n");
				command->Arguments =
					AllocateArgumentSetInfo;
				CreateArgumentSetInfo(command->Arguments,
					command->ID, command->Name,
					0,0,0);
				}
		  argument_list
                   END_ARGUMENTS

		;

argument_list   : 
                  | 
                    argument_part argument_list
                ;

argument_part	:
		  INT_VALUE BASIC_NAME
				{
				if(CommandDebug >= DEBUG1) printf("ARG:%s\n",$2);
				argument = FillInArgument(INT_VALUE,$2,
					command->Arguments);
				value = FillInBaseArgumentType(INT_VALUE,
					$2,
					command->Arguments);
				Free($2);
				}
		  integer_parts
		|
		  FLOAT_VALUE BASIC_NAME
				{
				argument = FillInArgument(FLOAT_VALUE,$2,
					command->Arguments);
				value = FillInBaseArgumentType(FLOAT_VALUE,
					$2,
					command->Arguments);
				Free($2);
				}
		  float_parts
		|
		  STRING_VALUE BASIC_NAME
				{
				argument = FillInArgument(STRING_VALUE,$2,
					command->Arguments);
				value = FillInBaseArgumentType(STRING_VALUE,
					$2,
					command->Arguments);
				Free($2);
				}
		  string_parts
		|
		  INPUT_FILE_NAME BASIC_NAME
				{
				argument = FillInArgument(INPUT_FILE_NAME,$2,
					command->Arguments);
				value = FillInBaseArgumentType(INPUT_FILE_NAME,
					$2,
					command->Arguments);
				Free($2);
				}
		  string_parts
		|
		  OUTPUT_FILE_NAME BASIC_NAME
				{
				argument = FillInArgument(OUTPUT_FILE_NAME,$2,
					command->Arguments);
				value = FillInBaseArgumentType(OUTPUT_FILE_NAME,
					$2,
					command->Arguments);
				Free($2);
				}
		  string_parts
		;

integer_parts	: 
		| 
                  integer_part integer_parts
		;
integer_part	:
		  TITLE
				{
				argument->Title = AllocateTitleInfo;
				CreateTitleInfo(argument->Title,
					argument->ID,
					($1)+6);
				}
		| LOWER Y_Integer_Value
				{
				argument->LowerBound =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						$2,0,0);
				}
		| UPPER Y_Integer_Value
				{
				argument->UpperBound =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						$2,0,0);
				}
		| DEFAULT Y_Integer_Value
				{
				argument->Default =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						$2,0,0);
				FreeBaseArgumentType(value);
				CopyFullBaseArgumentType(value,
					argument->Default);
				}
		;
		  
float_parts	:
		| float_part 
		  float_parts
		;
float_part	:
		  TITLE
				{
				argument->Title = AllocateTitleInfo;
				CreateTitleInfo(argument->Title,
					argument->ID,
					($1)+6);
				}
		| LOWER Y_Float_Value
				{
				argument->LowerBound =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						0,$2,0);
				}
		| UPPER Y_Float_Value
				{
				argument->UpperBound =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						0,$2,0);
				}
		| DEFAULT Y_Float_Value
				{
				argument->Default =	
				SetBaseArgumentType(argument->Type,
						argument->Name,
						0,$2,0);
				FreeBaseArgumentType(value);
				CopyFullBaseArgumentType(value,
					argument->Default);
			}
		;
string_parts	:
		| string_part string_parts
		;

string_part	:
		  TITLE
				{
				argument->Title = AllocateTitleInfo;
				CreateTitleInfo(argument->Title,
					argument->ID,
					($1)+6);
				}
		| DEFAULT_STRING
				{
				argument->Default =	
				SetBaseArgumentType(argument->Type,
						argument->Name,
						0,0.0,($1)+14);
				FreeBaseArgumentType(value);
				CopyFullBaseArgumentType(value,
					argument->Default);
			}
		;
%%
void yyerror(char *msg)
{
  fprintf(stderr,"%s\n",msg);
  return;
  }
int yywrap(char *msg)
{
  extern char *yytext;
  printf("yywrap\n");
  
  return(1);
  }
