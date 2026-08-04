
# line 2 "command.y"
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

# line 18 "command.y"
typedef union
#ifdef __cplusplus
	YYSTYPE
#endif
 	{
	int integer_value;
	float float_value;
        char *string_value;
	CommandInfo *command_info;
	} YYSTYPE;
# define END_OF_FILE 257
# define SPACE 258
# define CR 259
# define BASIC_NAME 260
# define TITLE 261
# define title_string 262
# define DEFAULT_STRING 263
# define COMMAND 264
# define FUNCTION 265
# define ENDCOMMAND 266
# define DONE 267
# define ARGUMENTS 268
# define END_ARGUMENTS 269
# define Y_Integer_Value 270
# define Y_Float_Value 271
# define INT_VALUE 272
# define FLOAT_VALUE 273
# define STRING_VALUE 274
# define INPUT_FILE_NAME 275
# define OUTPUT_FILE_NAME 276
# define LOWER 277
# define UPPER 278
# define DEFAULT 279

#ifdef __STDC__
#include <stdlib.h>
#include <string.h>
#else
#include <malloc.h>
#include <memory.h>
#endif

//#include <values.h>

#ifdef __cplusplus

#ifndef yyerror
	void yyerror(const char *);
#endif

#ifndef yylex
#ifdef __EXTERN_C__
	extern "C" { int yylex(void); }
#else
	int yylex(void);
#endif
#endif
	int yyparse(void);

#endif
#define yyclearin yychar = -1
#define yyerrok yyerrflag = 0
extern int yychar;
extern int yyerrflag;
YYSTYPE yylval;
YYSTYPE yyval;
typedef int yytabelem;
#ifndef YYMAXDEPTH
#define YYMAXDEPTH 150
#endif
#if YYMAXDEPTH > 0
int yy_yys[YYMAXDEPTH], *yys = yy_yys;
YYSTYPE yy_yyv[YYMAXDEPTH], *yyv = yy_yyv;
#else	/* user does initial allocation */
int *yys;
YYSTYPE *yyv;
#endif
static int yymaxdepth = YYMAXDEPTH;
# define YYERRCODE 256

# line 308 "command.y"

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
yytabelem yyexca[] ={
-1, 1,
	0, -1,
	-2, 0,
-1, 22,
	266, 7,
	-2, 5,
	};
# define YYNPROD 47
# define YYLAST 96
yytabelem yyact[]={

    53,    70,    69,    47,    27,    28,    29,    30,    31,    68,
    66,    65,    21,    64,    33,     4,    54,    55,    56,    48,
    49,    50,    32,    15,    59,     7,    60,    14,    39,    38,
    37,    36,    35,    19,    11,     9,    57,    51,    45,    25,
     3,    12,    58,    52,    46,    44,    43,    42,    41,    40,
    26,    23,    18,    13,    24,    17,    20,    16,    10,     8,
     6,    22,     5,     2,     1,     0,    34,     0,     0,     0,
     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
    61,    62,     0,     0,     0,    63,     0,     0,     0,     0,
    67,     0,     0,     0,     0,    71 };
yytabelem yypact[]={

-10000000,-10000000,-10000000,  -252,-10000000,-10000000,  -239,  -225,  -226,-10000000,
  -238,-10000000,-10000000,  -238,  -227,-10000000,  -256,-10000000,-10000000,-10000000,
-10000000,-10000000,-10000000,  -268,  -244,  -255,  -268,  -228,  -229,  -230,
  -231,  -232,-10000000,-10000000,-10000000,-10000000,-10000000,-10000000,-10000000,-10000000,
  -258,  -261,  -237,  -237,  -237,-10000000,  -258,-10000000,  -257,  -259,
  -260,-10000000,  -261,-10000000,  -262,  -269,  -270,-10000000,  -237,-10000000,
-10000000,-10000000,-10000000,-10000000,-10000000,-10000000,-10000000,-10000000,-10000000,-10000000,
-10000000,-10000000 };
yytabelem yypgo[]={

     0,    64,    63,    40,    62,    60,    59,    58,    41,    57,
    56,    54,    53,    52,    51,    39,    50,    49,    38,    48,
    37,    47,    36,    46,    45,    44,    43,    42 };
yytabelem yyr1[]={

     0,     2,     1,     3,     3,     5,     9,    11,     4,     6,
     7,     8,     8,    12,    12,    13,    10,    14,    10,    15,
    15,    17,    16,    19,    16,    21,    16,    23,    16,    24,
    16,    18,    18,    25,    25,    25,    25,    20,    20,    26,
    26,    26,    26,    22,    22,    27,    27 };
yytabelem yyr2[]={

     0,     1,     7,     0,     4,     1,     1,     1,    21,     3,
     3,     0,     4,     4,     3,     3,     0,     1,     8,     0,
     4,     1,     8,     1,     8,     1,     8,     1,     8,     1,
     8,     0,     4,     3,     5,     5,     5,     0,     4,     3,
     5,     5,     5,     0,     4,     3,     3 };
yytabelem yychk[]={

-10000000,    -1,    -2,    -3,   267,    -4,    -5,   264,    -6,   260,
    -7,   260,    -8,   -12,   265,   261,    -9,    -8,   -13,   260,
   -10,   268,    -3,   -14,   -11,   -15,   -16,   272,   273,   274,
   275,   276,   266,   269,   -15,   260,   260,   260,   260,   260,
   -17,   -19,   -21,   -23,   -24,   -18,   -25,   261,   277,   278,
   279,   -20,   -26,   261,   277,   278,   279,   -22,   -27,   261,
   263,   -22,   -22,   -18,   270,   270,   270,   -20,   271,   271,
   271,   -22 };
yytabelem yydef[]={

     1,    -2,     3,     5,     2,     4,     0,     0,     0,     9,
    11,    10,     6,    11,     0,    14,    16,    12,    13,    15,
     3,    17,    -2,    19,     0,     0,    19,     0,     0,     0,
     0,     0,     8,    18,    20,    21,    23,    25,    27,    29,
    31,    37,    43,    43,    43,    22,    31,    33,     0,     0,
     0,    24,    37,    39,     0,     0,     0,    26,    43,    45,
    46,    28,    30,    32,    34,    35,    36,    38,    40,    41,
    42,    44 };
typedef struct
#ifdef __cplusplus
	yytoktype
#endif
{ char *t_name; int t_val; } yytoktype;
#ifndef YYDEBUG
#	define YYDEBUG	0	/* don't allow debugging */
#endif

#if YYDEBUG

yytoktype yytoks[] =
{
	"END_OF_FILE",	257,
	"SPACE",	258,
	"CR",	259,
	"BASIC_NAME",	260,
	"TITLE",	261,
	"title_string",	262,
	"DEFAULT_STRING",	263,
	"COMMAND",	264,
	"FUNCTION",	265,
	"ENDCOMMAND",	266,
	"DONE",	267,
	"ARGUMENTS",	268,
	"END_ARGUMENTS",	269,
	"Y_Integer_Value",	270,
	"Y_Float_Value",	271,
	"INT_VALUE",	272,
	"FLOAT_VALUE",	273,
	"STRING_VALUE",	274,
	"INPUT_FILE_NAME",	275,
	"OUTPUT_FILE_NAME",	276,
	"LOWER",	277,
	"UPPER",	278,
	"DEFAULT",	279,
	"-unknown-",	-1	/* ends search */
};

char * yyreds[] =
{
	"-no such reduction-",
	"command_tree : /* empty */",
	"command_tree : command_level DONE",
	"command_level : /* empty */",
	"command_level : command_level command",
	"command : /* empty */",
	"command : COMMAND command_name command_key command_info",
	"command : COMMAND command_name command_key command_info argument_parts command_level",
	"command : COMMAND command_name command_key command_info argument_parts command_level ENDCOMMAND",
	"command_name : BASIC_NAME",
	"command_key : BASIC_NAME",
	"command_info : /* empty */",
	"command_info : command_part command_info",
	"command_part : FUNCTION function_name",
	"command_part : TITLE",
	"function_name : BASIC_NAME",
	"argument_parts : /* empty */",
	"argument_parts : ARGUMENTS",
	"argument_parts : ARGUMENTS argument_list END_ARGUMENTS",
	"argument_list : /* empty */",
	"argument_list : argument_part argument_list",
	"argument_part : INT_VALUE BASIC_NAME",
	"argument_part : INT_VALUE BASIC_NAME integer_parts",
	"argument_part : FLOAT_VALUE BASIC_NAME",
	"argument_part : FLOAT_VALUE BASIC_NAME float_parts",
	"argument_part : STRING_VALUE BASIC_NAME",
	"argument_part : STRING_VALUE BASIC_NAME string_parts",
	"argument_part : INPUT_FILE_NAME BASIC_NAME",
	"argument_part : INPUT_FILE_NAME BASIC_NAME string_parts",
	"argument_part : OUTPUT_FILE_NAME BASIC_NAME",
	"argument_part : OUTPUT_FILE_NAME BASIC_NAME string_parts",
	"integer_parts : /* empty */",
	"integer_parts : integer_part integer_parts",
	"integer_part : TITLE",
	"integer_part : LOWER Y_Integer_Value",
	"integer_part : UPPER Y_Integer_Value",
	"integer_part : DEFAULT Y_Integer_Value",
	"float_parts : /* empty */",
	"float_parts : float_part float_parts",
	"float_part : TITLE",
	"float_part : LOWER Y_Float_Value",
	"float_part : UPPER Y_Float_Value",
	"float_part : DEFAULT Y_Float_Value",
	"string_parts : /* empty */",
	"string_parts : string_part string_parts",
	"string_part : TITLE",
	"string_part : DEFAULT_STRING",
};
#endif /* YYDEBUG */
# line	1 "/usr/ccs/bin/yaccpar"
/*
 * Copyright (c) 1993 by Sun Microsystems, Inc.
 */

#pragma ident	"@(#)yaccpar	6.12	93/06/07 SMI"

/*
** Skeleton parser driver for yacc output
*/

/*
** yacc user known macros and defines
*/
#define YYERROR		goto yyerrlab
#define YYACCEPT	return(0)
#define YYABORT		return(1)
#define YYBACKUP( newtoken, newvalue )\
{\
	if ( yychar >= 0 || ( yyr2[ yytmp ] >> 1 ) != 1 )\
	{\
		yyerror( "syntax error - cannot backup" );\
		goto yyerrlab;\
	}\
	yychar = newtoken;\
	yystate = *yyps;\
	yylval = newvalue;\
	goto yynewstate;\
}
#define YYRECOVERING()	(!!yyerrflag)
#define YYNEW(type)	malloc(sizeof(type) * yynewmax)
#define YYCOPY(to, from, type) \
	(type *) memcpy(to, (char *) from, yynewmax * sizeof(type))
#define YYENLARGE( from, type) \
	(type *) realloc((char *) from, yynewmax * sizeof(type))
#ifndef YYDEBUG
#	define YYDEBUG	1	/* make debugging available */
#endif

/*
** user known globals
*/
int yydebug;			/* set to 1 to get debugging */

/*
** driver internal defines
*/
#define YYFLAG		(-10000000)

/*
** global variables used by the parser
*/
YYSTYPE *yypv;			/* top of value stack */
int *yyps;			/* top of state stack */

int yystate;			/* current state */
int yytmp;			/* extra var (lasts between blocks) */

int yynerrs;			/* number of errors */
int yyerrflag;			/* error recovery flag */
int yychar;			/* current input token number */



#ifdef YYNMBCHARS
#define YYLEX()		yycvtok(yylex())
/*
** yycvtok - return a token if i is a wchar_t value that exceeds 255.
**	If i<255, i itself is the token.  If i>255 but the neither 
**	of the 30th or 31st bit is on, i is already a token.
*/
#if defined(__STDC__) || defined(__cplusplus)
int yycvtok(int i)
#else
int yycvtok(i) int i;
#endif
{
	int first = 0;
	int last = YYNMBCHARS - 1;
	int mid;
	wchar_t j;

	if(i&0x60000000){/*Must convert to a token. */
		if( yymbchars[last].character < i ){
			return i;/*Giving up*/
		}
		while ((last>=first)&&(first>=0)) {/*Binary search loop*/
			mid = (first+last)/2;
			j = yymbchars[mid].character;
			if( j==i ){/*Found*/ 
				return yymbchars[mid].tvalue;
			}else if( j<i ){
				first = mid + 1;
			}else{
				last = mid -1;
			}
		}
		/*No entry in the table.*/
		return i;/* Giving up.*/
	}else{/* i is already a token. */
		return i;
	}
}
#else/*!YYNMBCHARS*/
#define YYLEX()		yylex()
#endif/*!YYNMBCHARS*/

/*
** yyparse - return 0 if worked, 1 if syntax error not recovered from
*/
#if defined(__STDC__) || defined(__cplusplus)
int yyparse(void)
#else
int yyparse()
#endif
{
	register YYSTYPE *yypvt;	/* top of value stack for $vars */

#if defined(__cplusplus) || defined(lint)
/*
	hacks to please C++ and lint - goto's inside switch should never be
	executed; yypvt is set to 0 to avoid "used before set" warning.
*/
	static int __yaccpar_lint_hack__ = 0;
	switch (__yaccpar_lint_hack__)
	{
		case 1: goto yyerrlab;
		case 2: goto yynewstate;
	}
	yypvt = 0;
#endif

	/*
	** Initialize externals - yyparse may be called more than once
	*/
	yypv = &yyv[-1];
	yyps = &yys[-1];
	yystate = 0;
	yytmp = 0;
	yynerrs = 0;
	yyerrflag = 0;
	yychar = -1;

#if YYMAXDEPTH <= 0
	if (yymaxdepth <= 0)
	{
		if ((yymaxdepth = YYEXPAND(0)) <= 0)
		{
			yyerror("yacc initialization error");
			YYABORT;
		}
	}
#endif

	{
		register YYSTYPE *yy_pv;	/* top of value stack */
		register int *yy_ps;		/* top of state stack */
		register int yy_state;		/* current state */
		register int  yy_n;		/* internal state number info */
	goto yystack;	/* moved from 6 lines above to here to please C++ */

		/*
		** get globals into registers.
		** branch to here only if YYBACKUP was called.
		*/
	yynewstate:
		yy_pv = yypv;
		yy_ps = yyps;
		yy_state = yystate;
		goto yy_newstate;

		/*
		** get globals into registers.
		** either we just started, or we just finished a reduction
		*/
	yystack:
		yy_pv = yypv;
		yy_ps = yyps;
		yy_state = yystate;

		/*
		** top of for (;;) loop while no reductions done
		*/
	yy_stack:
		/*
		** put a state and value onto the stacks
		*/
#if YYDEBUG
		/*
		** if debugging, look up token value in list of value vs.
		** name pairs.  0 and negative (-1) are special values.
		** Note: linear search is used since time is not a real
		** consideration while debugging.
		*/
		if ( yydebug )
		{
			register int yy_i;

			printf( "State %d, token ", yy_state );
			if ( yychar == 0 )
				printf( "end-of-file\n" );
			else if ( yychar < 0 )
				printf( "-none-\n" );
			else
			{
				for ( yy_i = 0; yytoks[yy_i].t_val >= 0;
					yy_i++ )
				{
					if ( yytoks[yy_i].t_val == yychar )
						break;
				}
				printf( "%s\n", yytoks[yy_i].t_name );
			}
		}
#endif /* YYDEBUG */
		if ( ++yy_ps >= &yys[ yymaxdepth ] )	/* room on stack? */
		{
			/*
			** reallocate and recover.  Note that pointers
			** have to be reset, or bad things will happen
			*/
			int yyps_index = (yy_ps - yys);
			int yypv_index = (yy_pv - yyv);
			int yypvt_index = (yypvt - yyv);
			int yynewmax;
#ifdef YYEXPAND
			yynewmax = YYEXPAND(yymaxdepth);
#else
			yynewmax = 2 * yymaxdepth;	/* double table size */
			if (yymaxdepth == YYMAXDEPTH)	/* first time growth */
			{
				char *newyys = (char *)YYNEW(int);
				char *newyyv = (char *)YYNEW(YYSTYPE);
				if (newyys != 0 && newyyv != 0)
				{
					yys = YYCOPY(newyys, yys, int);
					yyv = YYCOPY(newyyv, yyv, YYSTYPE);
				}
				else
					yynewmax = 0;	/* failed */
			}
			else				/* not first time */
			{
				yys = YYENLARGE(yys, int);
				yyv = YYENLARGE(yyv, YYSTYPE);
				if (yys == 0 || yyv == 0)
					yynewmax = 0;	/* failed */
			}
#endif
			if (yynewmax <= yymaxdepth)	/* tables not expanded */
			{
				yyerror( "yacc stack overflow" );
				YYABORT;
			}
			yymaxdepth = yynewmax;

			yy_ps = yys + yyps_index;
			yy_pv = yyv + yypv_index;
			yypvt = yyv + yypvt_index;
		}
		*yy_ps = yy_state;
		*++yy_pv = yyval;

		/*
		** we have a new state - find out what to do
		*/
	yy_newstate:
		if ( ( yy_n = yypact[ yy_state ] ) <= YYFLAG )
			goto yydefault;		/* simple state */
#if YYDEBUG
		/*
		** if debugging, need to mark whether new token grabbed
		*/
		yytmp = yychar < 0;
#endif
		if ( ( yychar < 0 ) && ( ( yychar = YYLEX() ) < 0 ) )
			yychar = 0;		/* reached EOF */
#if YYDEBUG
		if ( yydebug && yytmp )
		{
			register int yy_i;

			printf( "Received token " );
			if ( yychar == 0 )
				printf( "end-of-file\n" );
			else if ( yychar < 0 )
				printf( "-none-\n" );
			else
			{
				for ( yy_i = 0; yytoks[yy_i].t_val >= 0;
					yy_i++ )
				{
					if ( yytoks[yy_i].t_val == yychar )
						break;
				}
				printf( "%s\n", yytoks[yy_i].t_name );
			}
		}
#endif /* YYDEBUG */
		if ( ( ( yy_n += yychar ) < 0 ) || ( yy_n >= YYLAST ) )
			goto yydefault;
		if ( yychk[ yy_n = yyact[ yy_n ] ] == yychar )	/*valid shift*/
		{
			yychar = -1;
			yyval = yylval;
			yy_state = yy_n;
			if ( yyerrflag > 0 )
				yyerrflag--;
			goto yy_stack;
		}

	yydefault:
		if ( ( yy_n = yydef[ yy_state ] ) == -2 )
		{
#if YYDEBUG
			yytmp = yychar < 0;
#endif
			if ( ( yychar < 0 ) && ( ( yychar = YYLEX() ) < 0 ) )
				yychar = 0;		/* reached EOF */
#if YYDEBUG
			if ( yydebug && yytmp )
			{
				register int yy_i;

				printf( "Received token " );
				if ( yychar == 0 )
					printf( "end-of-file\n" );
				else if ( yychar < 0 )
					printf( "-none-\n" );
				else
				{
					for ( yy_i = 0;
						yytoks[yy_i].t_val >= 0;
						yy_i++ )
					{
						if ( yytoks[yy_i].t_val
							== yychar )
						{
							break;
						}
					}
					printf( "%s\n", yytoks[yy_i].t_name );
				}
			}
#endif /* YYDEBUG */
			/*
			** look through exception table
			*/
			{
				register int *yyxi = yyexca;

				while ( ( *yyxi != -1 ) ||
					( yyxi[1] != yy_state ) )
				{
					yyxi += 2;
				}
				while ( ( *(yyxi += 2) >= 0 ) &&
					( *yyxi != yychar ) )
					;
				if ( ( yy_n = yyxi[1] ) < 0 )
					YYACCEPT;
			}
		}

		/*
		** check for syntax error
		*/
		if ( yy_n == 0 )	/* have an error */
		{
			/* no worry about speed here! */
			switch ( yyerrflag )
			{
			case 0:		/* new error */
				yyerror( "syntax error" );
				goto skip_init;
			yyerrlab:
				/*
				** get globals into registers.
				** we have a user generated syntax type error
				*/
				yy_pv = yypv;
				yy_ps = yyps;
				yy_state = yystate;
			skip_init:
				yynerrs++;
				/* FALLTHRU */
			case 1:
			case 2:		/* incompletely recovered error */
					/* try again... */
				yyerrflag = 3;
				/*
				** find state where "error" is a legal
				** shift action
				*/
				while ( yy_ps >= yys )
				{
					yy_n = yypact[ *yy_ps ] + YYERRCODE;
					if ( yy_n >= 0 && yy_n < YYLAST &&
						yychk[yyact[yy_n]] == YYERRCODE)					{
						/*
						** simulate shift of "error"
						*/
						yy_state = yyact[ yy_n ];
						goto yy_stack;
					}
					/*
					** current state has no shift on
					** "error", pop stack
					*/
#if YYDEBUG
#	define _POP_ "Error recovery pops state %d, uncovers state %d\n"
					if ( yydebug )
						printf( _POP_, *yy_ps,
							yy_ps[-1] );
#	undef _POP_
#endif
					yy_ps--;
					yy_pv--;
				}
				/*
				** there is no state on stack with "error" as
				** a valid shift.  give up.
				*/
				YYABORT;
			case 3:		/* no shift yet; eat a token */
#if YYDEBUG
				/*
				** if debugging, look up token in list of
				** pairs.  0 and negative shouldn't occur,
				** but since timing doesn't matter when
				** debugging, it doesn't hurt to leave the
				** tests here.
				*/
				if ( yydebug )
				{
					register int yy_i;

					printf( "Error recovery discards " );
					if ( yychar == 0 )
						printf( "token end-of-file\n" );
					else if ( yychar < 0 )
						printf( "token -none-\n" );
					else
					{
						for ( yy_i = 0;
							yytoks[yy_i].t_val >= 0;
							yy_i++ )
						{
							if ( yytoks[yy_i].t_val
								== yychar )
							{
								break;
							}
						}
						printf( "token %s\n",
							yytoks[yy_i].t_name );
					}
				}
#endif /* YYDEBUG */
				if ( yychar == 0 )	/* reached EOF. quit */
					YYABORT;
				yychar = -1;
				goto yy_newstate;
			}
		}/* end if ( yy_n == 0 ) */
		/*
		** reduction by production yy_n
		** put stack tops, etc. so things right after switch
		*/
#if YYDEBUG
		/*
		** if debugging, print the string that is the user's
		** specification of the reduction which is just about
		** to be done.
		*/
		if ( yydebug )
			printf( "Reduce by (%d) \"%s\"\n",
				yy_n, yyreds[ yy_n ] );
#endif
		yytmp = yy_n;			/* value to switch over */
		yypvt = yy_pv;			/* $vars top of value stack */
		/*
		** Look in goto table for next state
		** Sorry about using yy_state here as temporary
		** register variable, but why not, if it works...
		** If yyr2[ yy_n ] doesn't have the low order bit
		** set, then there is no action to be done for
		** this reduction.  So, no saving & unsaving of
		** registers done.  The only difference between the
		** code just after the if and the body of the if is
		** the goto yy_stack in the body.  This way the test
		** can be made before the choice of what to do is needed.
		*/
		{
			/* length of production doubled with extra bit */
			register int yy_len = yyr2[ yy_n ];

			if ( !( yy_len & 01 ) )
			{
				yy_len >>= 1;
				yyval = ( yy_pv -= yy_len )[1];	/* $$ = $1 */
				yy_state = yypgo[ yy_n = yyr1[ yy_n ] ] +
					*( yy_ps -= yy_len ) + 1;
				if ( yy_state >= YYLAST ||
					yychk[ yy_state =
					yyact[ yy_state ] ] != -yy_n )
				{
					yy_state = yyact[ yypgo[ yy_n ] ];
				}
				goto yy_stack;
			}
			yy_len >>= 1;
			yyval = ( yy_pv -= yy_len )[1];	/* $$ = $1 */
			yy_state = yypgo[ yy_n = yyr1[ yy_n ] ] +
				*( yy_ps -= yy_len ) + 1;
			if ( yy_state >= YYLAST ||
				yychk[ yy_state = yyact[ yy_state ] ] != -yy_n )
			{
				yy_state = yyact[ yypgo[ yy_n ] ];
			}
		}
					/* save until reenter driver code */
		yystate = yy_state;
		yyps = yy_ps;
		yypv = yy_pv;
	}
	/*
	** code supplied by user is placed in this switch
	*/
	switch( yytmp )
	{
		
case 1:
# line 39 "command.y"
{
				currentcommand = Current_Command;
				} break;
case 2:
# line 44 "command.y"
{
				yyval.command_info = currentcommand;
				} break;
case 5:
# line 56 "command.y"
{
				conum +=1;
				Conum[level] += 1;
				if(CommandDebug >= DEBUG1)
					printf("Command (%d,%d) Begining\n",
						level,Conum[level]);
				command = FormNewCommand(&master,currentcommand);
				} break;
case 6:
# line 68 "command.y"
{
				*(CommandLevelHistory + level) = currentcommand;
				level++;
				Conum[level] = 0;
				currentcommand = command;
				} break;
case 7:
# line 76 "command.y"
{
				level--;
				currentcommand = *(CommandLevelHistory + level);
				} break;
case 8:
# line 81 "command.y"
{
				if(CommandDebug >= DEBUG1)
					printf("Command (%d,%d) End:\n",
						level,Conum[level]);
				} break;
case 9:
# line 89 "command.y"
{
				if(CommandDebug >= DEBUG1) printf("BASIC_NAME\n");
				Free(command->Name);
				command->Name = yypvt[-0].string_value;
				} break;
case 10:
# line 98 "command.y"
{
				command->FlagName = AllocateVariableName;
				CreateVariableName(command->FlagName, 
					master.CommandNumber,
					yypvt[-0].string_value);
				Free(yypvt[-0].string_value);
				} break;
case 14:
# line 116 "command.y"
{
				command->Comment = AllocateTitleInfo;
				CreateTitleInfo(command->Comment, 
					command->ID,(yypvt[-0].string_value)+5);
				} break;
case 15:
# line 125 "command.y"
{
				command->Function = AllocateFunctionInfo;
				CreateFunctionInfo(command->Function,0,
					yypvt[-0].string_value,0);
				Free(yypvt[-0].string_value);
				} break;
case 17:
# line 134 "command.y"
{
				if(CommandDebug >= DEBUG1) printf("ARGUMENTS\n");
				command->Arguments =
					AllocateArgumentSetInfo;
				CreateArgumentSetInfo(command->Arguments,
					command->ID, command->Name,
					0,0,0);
				} break;
case 21:
# line 154 "command.y"
{
				if(CommandDebug >= DEBUG1) printf("ARG:%s\n",yypvt[-0].string_value);
				argument = FillInArgument(INT_VALUE,yypvt[-0].string_value,
					command->Arguments);
				value = FillInBaseArgumentType(INT_VALUE,
					yypvt[-0].string_value,
					command->Arguments);
				Free(yypvt[-0].string_value);
				} break;
case 23:
# line 166 "command.y"
{
				argument = FillInArgument(FLOAT_VALUE,yypvt[-0].string_value,
					command->Arguments);
				value = FillInBaseArgumentType(FLOAT_VALUE,
					yypvt[-0].string_value,
					command->Arguments);
				Free(yypvt[-0].string_value);
				} break;
case 25:
# line 177 "command.y"
{
				argument = FillInArgument(STRING_VALUE,yypvt[-0].string_value,
					command->Arguments);
				value = FillInBaseArgumentType(STRING_VALUE,
					yypvt[-0].string_value,
					command->Arguments);
				Free(yypvt[-0].string_value);
				} break;
case 27:
# line 188 "command.y"
{
				argument = FillInArgument(INPUT_FILE_NAME,yypvt[-0].string_value,
					command->Arguments);
				value = FillInBaseArgumentType(INPUT_FILE_NAME,
					yypvt[-0].string_value,
					command->Arguments);
				Free(yypvt[-0].string_value);
				} break;
case 29:
# line 199 "command.y"
{
				argument = FillInArgument(OUTPUT_FILE_NAME,yypvt[-0].string_value,
					command->Arguments);
				value = FillInBaseArgumentType(OUTPUT_FILE_NAME,
					yypvt[-0].string_value,
					command->Arguments);
				Free(yypvt[-0].string_value);
				} break;
case 33:
# line 216 "command.y"
{
				argument->Title = AllocateTitleInfo;
				CreateTitleInfo(argument->Title,
					argument->ID,
					(yypvt[-0].string_value)+6);
				} break;
case 34:
# line 223 "command.y"
{
				argument->LowerBound =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						yypvt[-0].integer_value,0,0);
				} break;
case 35:
# line 230 "command.y"
{
				argument->UpperBound =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						yypvt[-0].integer_value,0,0);
				} break;
case 36:
# line 237 "command.y"
{
				argument->Default =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						yypvt[-0].integer_value,0,0);
				FreeBaseArgumentType(value);
				CopyFullBaseArgumentType(value,
					argument->Default);
				} break;
case 39:
# line 254 "command.y"
{
				argument->Title = AllocateTitleInfo;
				CreateTitleInfo(argument->Title,
					argument->ID,
					(yypvt[-0].string_value)+6);
				} break;
case 40:
# line 261 "command.y"
{
				argument->LowerBound =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						0,yypvt[-0].float_value,0);
				} break;
case 41:
# line 268 "command.y"
{
				argument->UpperBound =
				SetBaseArgumentType(argument->Type,
						argument->Name,
						0,yypvt[-0].float_value,0);
				} break;
case 42:
# line 275 "command.y"
{
				argument->Default =	
				SetBaseArgumentType(argument->Type,
						argument->Name,
						0,yypvt[-0].float_value,0);
				FreeBaseArgumentType(value);
				CopyFullBaseArgumentType(value,
					argument->Default);
			} break;
case 45:
# line 291 "command.y"
{
				argument->Title = AllocateTitleInfo;
				CreateTitleInfo(argument->Title,
					argument->ID,
					(yypvt[-0].string_value)+6);
				} break;
case 46:
# line 298 "command.y"
{
				argument->Default =	
				SetBaseArgumentType(argument->Type,
						argument->Name,
						0,0.0,(yypvt[-0].string_value)+14);
				FreeBaseArgumentType(value);
				CopyFullBaseArgumentType(value,
					argument->Default);
			} break;
# line	532 "/usr/ccs/bin/yaccpar"
	}
	goto yystack;		/* reset registers in driver code */
}

