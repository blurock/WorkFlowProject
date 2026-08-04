#include <stdio.h>
# define U(x) x
# define NLSTATE yyprevious=YYNEWLINE
# define BEGIN yybgin = yysvec + 1 +
# define INITIAL 0
# define YYLERR yysvec
# define YYSTATE (yyestate-yysvec-1)
# define YYOPTIM 1
# define YYLMAX BUFSIZ
#ifndef __cplusplus
# define output(c) (void)putc(c,yyout)
#else
# define lex_output(c) (void)putc(c,yyout)
#endif
/*#define YYDEBUG 1*/

#if defined(__cplusplus) || defined(__STDC__)

#if defined(__cplusplus) && defined(__EXTERN_C__)
extern "C" {
#endif
	int yyback(int *, int);
	int yyinput(void);
	int yylook(void);
	void yyoutput(int);
	int yyracc(int);
	int yyreject(void);
	void yyunput(int);
	int yylex(void);
#ifdef YYLEX_E
	void yywoutput(wchar_t);
	wchar_t yywinput(void);
#endif
#ifndef yyless
	int yyless(int);
#endif
#ifndef yywrap
	int yywrap(void);
#endif
#ifdef LEXDEBUG
	void allprint(char);
	void sprint(char *);
#endif
#if defined(__cplusplus) && defined(__EXTERN_C__)
}
#endif

#ifdef __cplusplus
extern "C" {
#endif
	void exit(int);
#ifdef __cplusplus
}
#endif

#endif
# define unput(c) {yytchar= (c);if(yytchar=='\n')yylineno--;*yysptr++=yytchar;}
# define yymore() (yymorfg=1)
#ifndef __cplusplus
# define input() (((yytchar=yysptr>yysbuf?U(*--yysptr):getc(yyin))==10?(yylineno++,yytchar):yytchar)==EOF?0:yytchar)
#else
# define lex_input() (((yytchar=yysptr>yysbuf?U(*--yysptr):getc(yyin))==10?(yylineno++,yytchar):yytchar)==EOF?0:yytchar)
#endif
#define ECHO fprintf(yyout, "%s",yytext)
# define REJECT { nstr = yyreject(); goto yyfussy;}
int yyleng;
char yytext[YYLMAX];
int yymorfg;
extern char *yysptr, yysbuf[];
int yytchar;
/*FILE *yyin = {stdin}, *yyout = {stdout};*/
FILE *yyin,*yyout;
extern int yylineno;
struct yysvf { 
	struct yywork *yystoff;
	struct yysvf *yyother;
	int *yystops;};
struct yysvf *yyestate;
extern struct yysvf yysvec[], *yybgin;

# line 3 "command.l"
/* ====================================================

                     scanner

   ==================================================== */
#include "basic.h"

extern INT NoStructureCode;

#include "comlib.h"

extern INT CommandDebug;
float yyy;
# define YYNEWLINE 10
yylex(){
int nstr; extern int yyprevious;
#ifdef __cplusplus
/* to avoid CC and lint complaining yyfussy not being used ...*/
static int __lex_hack = 0;
if (__lex_hack) goto yyfussy;
#endif
while((nstr = yylook()) >= 0)
yyfussy: switch(nstr){
case 0:
if(yywrap()) return(0); break;
case 1:

# line 19 "command.l"
 			{ return(DONE); }
break;
case 2:

# line 20 "command.l"
		{ return(COMMAND);}
break;
case 3:

# line 21 "command.l"
                 	{ return(ENDCOMMAND);}
break;
case 4:

# line 22 "command.l"
                     { return(FUNCTION);}
break;
case 5:

# line 23 "command.l"
                      { if(CommandDebug >= DEBUG1)
					printf("TITLE:%s\n",yytext);
				  yylval.string_value = yytext;
				  return(TITLE);}
break;
case 6:

# line 27 "command.l"
              {yylval.string_value = yytext;
				  return(DEFAULT_STRING);}
break;
case 7:

# line 30 "command.l"
                    { return(ARGUMENTS);}
break;
case 8:

# line 31 "command.l"
                    { return(INT_VALUE);}
break;
case 9:

# line 32 "command.l"
                  { return(FLOAT_VALUE);}
break;
case 10:

# line 33 "command.l"
                 { return(STRING_VALUE);}
break;
case 11:

# line 34 "command.l"
                        { return(LOWER);}
break;
case 12:

# line 35 "command.l"
                        { return(UPPER);}
break;
case 13:

# line 36 "command.l"
                      { return(DEFAULT);}
break;
case 14:

# line 37 "command.l"
                { return(END_ARGUMENTS);}
break;
case 15:

# line 38 "command.l"
              { return(INPUT_FILE_NAME);}
break;
case 16:

# line 39 "command.l"
             { return(OUTPUT_FILE_NAME);}
break;
case 17:

# line 41 "command.l"
                       { 
				  yylval.integer_value = ConvertStringToInteger(yytext);
                                  return(Y_Integer_Value); }
break;
case 18:

# line 44 "command.l"
            { 
				  yylval.float_value = ConvertStringToFloat(yytext);
                                  return(Y_Float_Value); 
				}
break;
case 19:

# line 48 "command.l"
                          { }
break;
case 20:

# line 49 "command.l"
                             { }
break;
case 21:

# line 50 "command.l"
	        { yylval.string_value = CopyString(yytext);
				  if(CommandDebug >= DEBUG1)
	                                  printf("ALPHADIGITS:%s\n",
						yylval.string_value);
				  return(BASIC_NAME);}
break;
case 22:

# line 55 "command.l"
                   	{ }
break;
case -1:
break;
default:
(void)fprintf(yyout,"bad switch yylook %d",nstr);
} return(0); }
/* end of yylex */

int yyvstop[] = {
0,

21,
0,

21,
0,

19,
0,

20,
0,

22,
0,

17,
21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

18,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

1,
21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

11,
21,
0,

21,
0,

21,
0,

5,
21,
0,

12,
21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

5,
0,

21,
0,

2,
21,
0,

13,
21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

4,
21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

7,
21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

8,
21,
0,

21,
0,

21,
0,

21,
0,

3,
21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

9,
21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

21,
0,

10,
21,
0,

21,
0,

14,
21,
0,

21,
0,

21,
0,

6,
21,
0,

21,
0,

21,
0,

6,
0,

15,
21,
0,

21,
0,

16,
21,
0,
0};
# define YYTYPE unsigned char
struct yywork { YYTYPE verify, advance; } yycrank[] = {
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	1,3,	1,4,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	1,3,	0,0,	0,0,	
0,0,	0,0,	1,5,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	1,6,	1,6,	1,6,	
1,6,	1,6,	1,6,	1,6,	
1,6,	1,6,	1,6,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	1,7,	1,8,	
1,9,	1,10,	1,11,	1,12,	
1,8,	1,8,	1,13,	1,8,	
1,8,	1,14,	1,8,	1,8,	
1,15,	1,8,	1,8,	1,8,	
1,16,	1,17,	1,18,	1,8,	
1,8,	1,8,	1,8,	1,8,	
8,8,	16,8,	9,21,	16,30,	
1,8,	9,8,	1,8,	1,8,	
1,8,	1,8,	1,8,	1,8,	
1,8,	1,8,	1,8,	1,8,	
1,8,	1,8,	1,8,	1,8,	
1,8,	1,8,	1,8,	1,8,	
1,8,	1,8,	1,8,	1,8,	
1,8,	1,8,	1,8,	1,8,	
5,5,	10,22,	11,24,	13,27,	
12,25,	30,45,	11,8,	13,8,	
5,5,	5,0,	12,8,	10,23,	
14,28,	12,26,	10,8,	14,8,	
15,8,	17,31,	18,32,	15,29,	
18,8,	23,37,	51,8,	58,72,	
24,38,	23,8,	17,8,	19,33,	
19,33,	19,33,	19,33,	19,33,	
19,33,	19,33,	19,33,	19,33,	
19,33,	21,35,	24,8,	28,8,	
25,39,	26,40,	21,8,	25,8,	
28,43,	26,8,	6,19,	5,5,	
6,6,	6,6,	6,6,	6,6,	
6,6,	6,6,	6,6,	6,6,	
6,6,	6,6,	27,41,	29,8,	
27,8,	29,44,	27,42,	62,76,	
5,5,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	31,8,	
32,47,	31,46,	32,8,	6,8,	
67,81,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	6,8,	
6,8,	6,8,	6,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	34,8,	35,49,	41,8,	
34,48,	72,8,	41,56,	35,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,20,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	44,59,	54,8,	
44,8,	54,68,	7,8,	76,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	7,8,	7,8,	
7,8,	7,8,	20,34,	22,36,	
36,50,	37,51,	39,54,	38,52,	
45,60,	40,55,	46,61,	49,64,	
42,8,	20,8,	43,58,	22,8,	
46,8,	45,8,	37,8,	47,62,	
90,8,	36,8,	38,8,	39,8,	
40,8,	42,57,	48,63,	43,8,	
49,8,	53,67,	50,8,	48,8,	
47,8,	50,65,	52,66,	38,53,	
55,8,	52,8,	55,69,	56,8,	
57,8,	56,70,	59,8,	60,74,	
57,71,	59,73,	53,8,	60,8,	
61,75,	63,77,	64,78,	65,79,	
68,8,	66,80,	64,8,	69,83,	
70,8,	65,8,	66,8,	71,85,	
74,87,	61,8,	63,8,	77,89,	
69,8,	68,82,	73,8,	77,8,	
73,86,	70,84,	75,88,	74,8,	
78,90,	79,8,	81,93,	79,91,	
71,8,	80,92,	75,88,	75,0,	
82,8,	84,96,	80,8,	85,97,	
82,94,	81,8,	78,8,	83,95,	
86,8,	85,8,	83,8,	87,8,	
88,0,	84,8,	89,8,	91,8,	
89,100,	92,102,	94,104,	93,8,	
96,106,	86,98,	93,103,	95,105,	
87,99,	104,114,	98,108,	95,8,	
91,101,	96,8,	97,8,	104,8,	
99,8,	97,107,	92,8,	94,8,	
99,109,	75,75,	98,8,	100,8,	
100,110,	101,8,	101,111,	102,112,	
103,113,	105,8,	106,115,	102,8,	
107,116,	103,8,	88,88,	108,117,	
106,8,	109,118,	75,75,	110,8,	
111,8,	112,120,	111,119,	113,121,	
108,8,	107,8,	114,8,	115,123,	
116,8,	114,122,	119,126,	88,88,	
117,124,	118,125,	109,8,	112,8,	
113,8,	120,8,	117,8,	118,8,	
115,8,	121,127,	122,128,	123,8,	
124,130,	121,8,	125,8,	128,8,	
129,134,	125,131,	126,132,	127,8,	
129,8,	127,133,	130,8,	122,8,	
123,129,	124,8,	131,136,	126,8,	
132,137,	133,8,	133,138,	134,139,	
132,8,	135,140,	136,8,	130,135,	
137,141,	135,8,	138,8,	131,8,	
139,142,	140,143,	141,144,	142,145,	
143,146,	139,8,	144,0,	137,8,	
134,8,	143,8,	141,144,	141,0,	
145,8,	146,147,	147,8,	0,0,	
142,8,	0,0,	140,8,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	146,8,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
144,144,	0,0,	0,0,	0,0,	
0,0,	141,141,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	0,0,	0,0,	0,0,	
0,0,	144,144,	0,0,	0,0,	
0,0,	0,0,	141,141,	0,0,	
0,0};
struct yysvf yysvec[] = {
0,	0,	0,
yycrank+1,	0,		yyvstop+1,
yycrank+0,	yysvec+1,	yyvstop+3,
yycrank+0,	0,		yyvstop+5,
yycrank+0,	0,		yyvstop+7,
yycrank+-123,	0,		yyvstop+9,
yycrank+124,	0,		yyvstop+11,
yycrank+199,	0,		yyvstop+14,
yycrank+10,	yysvec+7,	yyvstop+16,
yycrank+15,	yysvec+7,	yyvstop+18,
yycrank+56,	yysvec+7,	yyvstop+20,
yycrank+48,	yysvec+7,	yyvstop+22,
yycrank+52,	yysvec+7,	yyvstop+24,
yycrank+49,	yysvec+7,	yyvstop+26,
yycrank+57,	yysvec+7,	yyvstop+28,
yycrank+58,	yysvec+7,	yyvstop+30,
yycrank+11,	yysvec+7,	yyvstop+32,
yycrank+68,	yysvec+7,	yyvstop+34,
yycrank+62,	yysvec+7,	yyvstop+36,
yycrank+103,	0,		0,	
yycrank+251,	yysvec+7,	yyvstop+38,
yycrank+84,	yysvec+7,	yyvstop+40,
yycrank+253,	yysvec+7,	yyvstop+42,
yycrank+67,	yysvec+7,	yyvstop+44,
yycrank+80,	yysvec+7,	yyvstop+46,
yycrank+85,	yysvec+7,	yyvstop+48,
yycrank+87,	yysvec+7,	yyvstop+50,
yycrank+102,	yysvec+7,	yyvstop+52,
yycrank+81,	yysvec+7,	yyvstop+54,
yycrank+101,	yysvec+7,	yyvstop+56,
yycrank+47,	yysvec+7,	yyvstop+58,
yycrank+133,	yysvec+7,	yyvstop+60,
yycrank+136,	yysvec+7,	yyvstop+62,
yycrank+0,	yysvec+19,	yyvstop+64,
yycrank+175,	yysvec+7,	yyvstop+66,
yycrank+181,	yysvec+7,	yyvstop+68,
yycrank+259,	yysvec+7,	yyvstop+70,
yycrank+256,	yysvec+7,	yyvstop+72,
yycrank+260,	yysvec+7,	yyvstop+74,
yycrank+261,	yysvec+7,	yyvstop+76,
yycrank+262,	yysvec+7,	yyvstop+78,
yycrank+177,	yysvec+7,	yyvstop+80,
yycrank+250,	yysvec+7,	yyvstop+82,
yycrank+265,	yysvec+7,	yyvstop+84,
yycrank+210,	yysvec+7,	yyvstop+86,
yycrank+255,	yysvec+7,	yyvstop+88,
yycrank+254,	yysvec+7,	yyvstop+90,
yycrank+270,	yysvec+7,	yyvstop+92,
yycrank+269,	yysvec+7,	yyvstop+94,
yycrank+266,	yysvec+7,	yyvstop+96,
yycrank+268,	yysvec+7,	yyvstop+98,
yycrank+64,	yysvec+7,	yyvstop+100,
yycrank+275,	yysvec+7,	yyvstop+103,
yycrank+284,	yysvec+7,	yyvstop+105,
yycrank+209,	yysvec+7,	yyvstop+107,
yycrank+274,	yysvec+7,	yyvstop+109,
yycrank+277,	yysvec+7,	yyvstop+111,
yycrank+278,	yysvec+7,	yyvstop+113,
yycrank+65,	yysvec+7,	yyvstop+115,
yycrank+280,	yysvec+7,	yyvstop+117,
yycrank+285,	yysvec+7,	yyvstop+119,
yycrank+299,	yysvec+7,	yyvstop+121,
yycrank+105,	yysvec+7,	yyvstop+123,
yycrank+300,	yysvec+7,	yyvstop+125,
yycrank+292,	yysvec+7,	yyvstop+127,
yycrank+295,	yysvec+7,	yyvstop+129,
yycrank+296,	yysvec+7,	yyvstop+131,
yycrank+138,	yysvec+7,	yyvstop+133,
yycrank+290,	yysvec+7,	yyvstop+135,
yycrank+302,	yysvec+7,	yyvstop+137,
yycrank+294,	yysvec+7,	yyvstop+139,
yycrank+314,	yysvec+7,	yyvstop+141,
yycrank+179,	yysvec+7,	yyvstop+143,
yycrank+304,	yysvec+7,	yyvstop+146,
yycrank+309,	yysvec+7,	yyvstop+148,
yycrank+-389,	0,		yyvstop+150,
yycrank+213,	yysvec+7,	yyvstop+153,
yycrank+305,	yysvec+7,	yyvstop+156,
yycrank+324,	yysvec+7,	yyvstop+158,
yycrank+311,	yysvec+7,	yyvstop+160,
yycrank+320,	yysvec+7,	yyvstop+162,
yycrank+323,	yysvec+7,	yyvstop+164,
yycrank+318,	yysvec+7,	yyvstop+166,
yycrank+328,	yysvec+7,	yyvstop+168,
yycrank+331,	yysvec+7,	yyvstop+170,
yycrank+327,	yysvec+7,	yyvstop+172,
yycrank+326,	yysvec+7,	yyvstop+174,
yycrank+329,	yysvec+7,	yyvstop+176,
yycrank+-402,	yysvec+75,	yyvstop+178,
yycrank+332,	yysvec+7,	yyvstop+180,
yycrank+258,	yysvec+7,	yyvstop+182,
yycrank+333,	yysvec+7,	yyvstop+185,
yycrank+352,	yysvec+7,	yyvstop+188,
yycrank+337,	yysvec+7,	yyvstop+190,
yycrank+353,	yysvec+7,	yyvstop+192,
yycrank+345,	yysvec+7,	yyvstop+194,
yycrank+347,	yysvec+7,	yyvstop+196,
yycrank+348,	yysvec+7,	yyvstop+198,
yycrank+356,	yysvec+7,	yyvstop+200,
yycrank+350,	yysvec+7,	yyvstop+202,
yycrank+357,	yysvec+7,	yyvstop+204,
yycrank+359,	yysvec+7,	yyvstop+206,
yycrank+365,	yysvec+7,	yyvstop+208,
yycrank+367,	yysvec+7,	yyvstop+210,
yycrank+349,	yysvec+7,	yyvstop+212,
yycrank+363,	yysvec+7,	yyvstop+214,
yycrank+370,	yysvec+7,	yyvstop+217,
yycrank+379,	yysvec+7,	yyvstop+219,
yycrank+378,	yysvec+7,	yyvstop+221,
yycrank+388,	yysvec+7,	yyvstop+223,
yycrank+373,	yysvec+7,	yyvstop+225,
yycrank+374,	yysvec+7,	yyvstop+228,
yycrank+389,	yysvec+7,	yyvstop+230,
yycrank+390,	yysvec+7,	yyvstop+232,
yycrank+380,	yysvec+7,	yyvstop+234,
yycrank+394,	yysvec+7,	yyvstop+236,
yycrank+382,	yysvec+7,	yyvstop+238,
yycrank+392,	yysvec+7,	yyvstop+241,
yycrank+393,	yysvec+7,	yyvstop+243,
yycrank+384,	yysvec+7,	yyvstop+245,
yycrank+391,	yysvec+7,	yyvstop+247,
yycrank+399,	yysvec+7,	yyvstop+250,
yycrank+409,	yysvec+7,	yyvstop+252,
yycrank+397,	yysvec+7,	yyvstop+254,
yycrank+411,	yysvec+7,	yyvstop+256,
yycrank+400,	yysvec+7,	yyvstop+258,
yycrank+413,	yysvec+7,	yyvstop+260,
yycrank+405,	yysvec+7,	yyvstop+262,
yycrank+401,	yysvec+7,	yyvstop+264,
yycrank+406,	yysvec+7,	yyvstop+267,
yycrank+408,	yysvec+7,	yyvstop+269,
yycrank+425,	yysvec+7,	yyvstop+271,
yycrank+418,	yysvec+7,	yyvstop+273,
yycrank+415,	yysvec+7,	yyvstop+275,
yycrank+434,	yysvec+7,	yyvstop+277,
yycrank+423,	yysvec+7,	yyvstop+279,
yycrank+420,	yysvec+7,	yyvstop+281,
yycrank+433,	yysvec+7,	yyvstop+284,
yycrank+424,	yysvec+7,	yyvstop+286,
yycrank+431,	yysvec+7,	yyvstop+289,
yycrank+444,	yysvec+7,	yyvstop+291,
yycrank+-509,	0,		yyvstop+293,
yycrank+442,	yysvec+7,	yyvstop+296,
yycrank+435,	yysvec+7,	yyvstop+298,
yycrank+-504,	yysvec+141,	yyvstop+300,
yycrank+438,	yysvec+7,	yyvstop+302,
yycrank+452,	yysvec+7,	yyvstop+305,
yycrank+440,	yysvec+7,	yyvstop+307,
0,	0,	0};
struct yywork *yytop = yycrank+574;
struct yysvf *yybgin = yysvec+1;
char yymatch[] = {
  0,   1,   1,   1,   1,   1,   1,   1, 
  1,   9,  10,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  9,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
 48,  48,  48,  48,  48,  48,  48,  48, 
 48,  48,   1,   1,   1,   1,   1,   1, 
  1,  65,  65,  65,  65,  65,  65,  65, 
 65,  65,  65,  65,  65,  65,  65,  65, 
 65,  65,  65,  65,  65,  65,  65,  65, 
 65,  65,  65,   1,   1,   1,   1,  65, 
  1,  65,  65,  65,  65,  65,  65,  65, 
 65,  65,  65,  65,  65,  65,  65,  65, 
 65,  65,  65,  65,  65,  65,  65,  65, 
 65,  65,  65,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
  1,   1,   1,   1,   1,   1,   1,   1, 
0};
char yyextra[] = {
0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,
0};
/*	Copyright (c) 1989 AT&T	*/
/*	  All Rights Reserved  	*/

/*	THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF AT&T	*/
/*	The copyright notice above does not evidence any   	*/
/*	actual or intended publication of such source code.	*/

#pragma ident	"@(#)ncform	6.8	95/02/11 SMI"

int yylineno =1;
# define YYU(x) x
# define NLSTATE yyprevious=YYNEWLINE
struct yysvf *yylstate [YYLMAX], **yylsp, **yyolsp;
char yysbuf[YYLMAX];
char *yysptr = yysbuf;
int *yyfnd;
extern struct yysvf *yyestate;
int yyprevious = YYNEWLINE;
#if defined(__cplusplus) || defined(__STDC__)
int yylook(void)
#else
yylook()
#endif
{
	register struct yysvf *yystate, **lsp;
	register struct yywork *yyt;
	struct yysvf *yyz;
	int yych, yyfirst;
	struct yywork *yyr;
# ifdef LEXDEBUG
	int debug;
# endif
	char *yylastch;
	/* start off machines */
# ifdef LEXDEBUG
	debug = 0;
# endif
	yyfirst=1;
	if (!yymorfg)
		yylastch = yytext;
	else {
		yymorfg=0;
		yylastch = yytext+yyleng;
		}
	for(;;){
		lsp = yylstate;
		yyestate = yystate = yybgin;
		if (yyprevious==YYNEWLINE) yystate++;
		for (;;){
# ifdef LEXDEBUG
			if(debug)fprintf(yyout,"state %d\n",yystate-yysvec-1);
# endif
			yyt = yystate->yystoff;
			if(yyt == yycrank && !yyfirst){  /* may not be any transitions */
				yyz = yystate->yyother;
				if(yyz == 0)break;
				if(yyz->yystoff == yycrank)break;
				}
#ifndef __cplusplus
			*yylastch++ = yych = input();
#else
			*yylastch++ = yych = lex_input();
#endif
			if(yylastch > &yytext[YYLMAX]) {
				fprintf(yyout,"Input string too long, limit %d\n",YYLMAX);
				exit(1);
			}
			yyfirst=0;
		tryagain:
# ifdef LEXDEBUG
			if(debug){
				fprintf(yyout,"char ");
				allprint(yych);
				putchar('\n');
				}
# endif
			yyr = yyt;
			if ( (int)yyt > (int)yycrank){
				yyt = yyr + yych;
				if (yyt <= yytop && yyt->verify+yysvec == yystate){
					if(yyt->advance+yysvec == YYLERR)	/* error transitions */
						{unput(*--yylastch);break;}
					*lsp++ = yystate = yyt->advance+yysvec;
					if(lsp > &yylstate[YYLMAX]) {
						fprintf(yyout,"Input string too long, limit %d\n",YYLMAX);
						exit(1);
					}
					goto contin;
					}
				}
# ifdef YYOPTIM
			else if((int)yyt < (int)yycrank) {		/* r < yycrank */
				yyt = yyr = yycrank+(yycrank-yyt);
# ifdef LEXDEBUG
				if(debug)fprintf(yyout,"compressed state\n");
# endif
				yyt = yyt + yych;
				if(yyt <= yytop && yyt->verify+yysvec == yystate){
					if(yyt->advance+yysvec == YYLERR)	/* error transitions */
						{unput(*--yylastch);break;}
					*lsp++ = yystate = yyt->advance+yysvec;
					if(lsp > &yylstate[YYLMAX]) {
						fprintf(yyout,"Input string too long, limit %d\n",YYLMAX);
						exit(1);
					}
					goto contin;
					}
				yyt = yyr + YYU(yymatch[yych]);
# ifdef LEXDEBUG
				if(debug){
					fprintf(yyout,"try fall back character ");
					allprint(YYU(yymatch[yych]));
					putchar('\n');
					}
# endif
				if(yyt <= yytop && yyt->verify+yysvec == yystate){
					if(yyt->advance+yysvec == YYLERR)	/* error transition */
						{unput(*--yylastch);break;}
					*lsp++ = yystate = yyt->advance+yysvec;
					if(lsp > &yylstate[YYLMAX]) {
						fprintf(yyout,"Input string too long, limit %d\n",YYLMAX);
						exit(1);
					}
					goto contin;
					}
				}
			if ((yystate = yystate->yyother) && (yyt= yystate->yystoff) != yycrank){
# ifdef LEXDEBUG
				if(debug)fprintf(yyout,"fall back to state %d\n",yystate-yysvec-1);
# endif
				goto tryagain;
				}
# endif
			else
				{unput(*--yylastch);break;}
		contin:
# ifdef LEXDEBUG
			if(debug){
				fprintf(yyout,"state %d char ",yystate-yysvec-1);
				allprint(yych);
				putchar('\n');
				}
# endif
			;
			}
# ifdef LEXDEBUG
		if(debug){
			fprintf(yyout,"stopped at %d with ",*(lsp-1)-yysvec-1);
			allprint(yych);
			putchar('\n');
			}
# endif
		while (lsp-- > yylstate){
			*yylastch-- = 0;
			if (*lsp != 0 && (yyfnd= (*lsp)->yystops) && *yyfnd > 0){
				yyolsp = lsp;
				if(yyextra[*yyfnd]){		/* must backup */
					while(yyback((*lsp)->yystops,-*yyfnd) != 1 && lsp > yylstate){
						lsp--;
						unput(*yylastch--);
						}
					}
				yyprevious = YYU(*yylastch);
				yylsp = lsp;
				yyleng = yylastch-yytext+1;
				yytext[yyleng] = 0;
# ifdef LEXDEBUG
				if(debug){
					fprintf(yyout,"\nmatch ");
					sprint(yytext);
					fprintf(yyout," action %d\n",*yyfnd);
					}
# endif
				return(*yyfnd++);
				}
			unput(*yylastch);
			}
		if (yytext[0] == 0  /* && feof(yyin) */)
			{
			yysptr=yysbuf;
			return(0);
			}
#ifndef __cplusplus
		yyprevious = yytext[0] = input();
		if (yyprevious>0)
			output(yyprevious);
#else
		yyprevious = yytext[0] = lex_input();
		if (yyprevious>0)
			lex_output(yyprevious);
#endif
		yylastch=yytext;
# ifdef LEXDEBUG
		if(debug)putchar('\n');
# endif
		}
	}
#if defined(__cplusplus) || defined(__STDC__)
int yyback(int *p, int m)
#else
yyback(p, m)
	int *p;
#endif
{
	if (p==0) return(0);
	while (*p) {
		if (*p++ == m)
			return(1);
	}
	return(0);
}
	/* the following are only used in the lex library */
#if defined(__cplusplus) || defined(__STDC__)
int yyinput(void)
#else
yyinput()
#endif
{
#ifndef __cplusplus
	return(input());
#else
	return(lex_input());
#endif
	}
#if defined(__cplusplus) || defined(__STDC__)
void yyoutput(int c)
#else
yyoutput(c)
  int c; 
#endif
{
#ifndef __cplusplus
	output(c);
#else
	lex_output(c);
#endif
	}
#if defined(__cplusplus) || defined(__STDC__)
void yyunput(int c)
#else
yyunput(c)
   int c; 
#endif
{
	unput(c);
	}
