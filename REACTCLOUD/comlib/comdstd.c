#define PARAMETERS      100
#define PARAMETER_DEFAULT 101
#define PARAMETER_INPUT   102
#define PARAMETER_PRINT   103

/*************************************************************************/
FunctionInfo HELP_FUNCTION_INFO = 
     {
     HELP_COMMAND,HELP_COMMAND_NAME,
     LevelHelpCommand
	  };

CommandInfo HELP_COMMANDINFO = 
     {
     HELP_COMMAND,HELP_COMMAND_NAME,
     0,
     &(HELP_FUNCTION_INFO),
     0,0,0,0,0,0,0,0,0
	  };

/*************************************************************************/
FunctionInfo UTILITY_FUNCTION_INFO = 
     {
     UTILITY_COMMAND,UTILITY_COMMAND_NAME,
     UtilityCommand
     };

CommandInfo UTILITY_COMMANDINFO = 
     {
     UTILITY_COMMAND,UTILITY_COMMAND_NAME,
     0,
     &(UTILITY_FUNCTION_INFO),
     0,0,0,0,0,0,0,0,0
	  };

/*************************************************************************/

VariableName Parameter_Change_Flag = 
     {
     PARAMETERS,"Parameters"
     };

TitleInfo Parameter_Change_Title =
     {
     PARAMETERS,"Modify Parameter Values"
     };

CommandInfo Parameter_Change_Command = 
     {
     PARAMETERS,"Parameters",
     &(Parameter_Change_Flag),
     0,
     &(Parameter_Change_Title),
     0,0,0,0,0,0,0,0
	  };

VariableName Parameter_Default_Flag = 
     {
     PARAMETER_DEFAULT,"Default"
     };

TitleInfo Parameter_Default_Title =
     {
     PARAMETER_DEFAULT,"Use Default Values"
     };

FunctionInfo Parameter_Default_Function = 
     {
     PARAMETER_DEFAULT,"Default",
     SetDefaultValue
	  };

CommandInfo Parameter_Default_Input = 
     {
     PARAMETER_DEFAULT,"Default",
     &(Parameter_Default_Flag),
     &(Parameter_Default_Function),
     &(Parameter_Default_Title),
     0,0,0,0,0,0,0,0
	  };

VariableName Parameter_Input_Flag = 
     {
     PARAMETER_INPUT,"Input"
     };

TitleInfo Parameter_Input_Title =
     {
     0,"Input Value"
     };

FunctionInfo Parameter_Input_Function = 
     {
     PARAMETER_INPUT,"Input",
     SetInputValue
	  };

CommandInfo Parameter_Input_Command = 
     {
     PARAMETER_INPUT,"Input",
     &(Parameter_Input_Flag),
     &(Parameter_Input_Function),
     &(Parameter_Input_Title),
     0,0,0,0,0,0,0,0
	  };

VariableName Parameter_Print_Flag = 
     {
     PARAMETER_PRINT,"Print"
     };

TitleInfo Parameter_Print_Title =
     {
     PARAMETER_PRINT,"Print Value"
     };

FunctionInfo Parameter_Print_Function = 
     {
     PARAMETER_PRINT,"Print",
     PrintParameterValue
	  };

CommandInfo Parameter_Print_Command = 
     {
     PARAMETER_PRINT,"Print",
     &(Parameter_Print_Flag),
     &(Parameter_Print_Function),
     &(Parameter_Print_Title),
     0,0,0,0,0,0,0,0
	  };




