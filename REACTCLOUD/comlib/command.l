%{
/* ====================================================

                     scanner

   ==================================================== */
#include "basic.h"

extern INT NoStructureCode;

#include "comlib.h"

extern INT CommandDebug;
float yyy;
%}
DIGITS      [0-9]+
ALPHDIGITS  [_a-zA-Z0-9]*
%%
"DONE"  			{ return(DONE); }
"COMMAND"			{ return(COMMAND);}
"ENDCOMMAND"                  	{ return(ENDCOMMAND);}
"FUNCTION"                      { return(FUNCTION);}
"TITLE".*                       { if(CommandDebug >= DEBUG1)
					printf("TITLE:%s\n",yytext);
				  yylval.string_value = yytext;
				  return(TITLE);}
"DEFAULT_STRING".*               {yylval.string_value = yytext;
				  return(DEFAULT_STRING);}

"ARGUMENTS"                     { return(ARGUMENTS);}
"INT_VALUE"                     { return(INT_VALUE);}
"FLOAT_VALUE"                   { return(FLOAT_VALUE);}
"STRING_VALUE"                  { return(STRING_VALUE);}
"LOWER"                         { return(LOWER);}
"UPPER"                         { return(UPPER);}
"DEFAULT"                       { return(DEFAULT);}
"END_ARGUMENTS"                 { return(END_ARGUMENTS);}
"INPUT_FILE_NAME"               { return(INPUT_FILE_NAME);}
"OUTPUT_FILE_NAME"              { return(OUTPUT_FILE_NAME);}

{DIGITS}                        { 
				  yylval.integer_value = ConvertStringToInteger(yytext);
                                  return(Y_Integer_Value); }
{DIGITS}"."{DIGITS}             { 
				  yylval.float_value = ConvertStringToFloat(yytext);
                                  return(Y_Float_Value); 
				}
[ \t]                           { }
\n                              { }
{ALPHDIGITS}		        { yylval.string_value = CopyString(yytext);
				  if(CommandDebug >= DEBUG1)
	                                  printf("ALPHADIGITS:%s\n",
						yylval.string_value);
				  return(BASIC_NAME);}
\%.*                    	{ }
%%

