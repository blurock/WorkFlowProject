#include "basic.h"

void ReadCommandLine(KeyWords *commands,int numcommands,
                     CommandReturn *comret, FILE *file)
     {
     
     NextNonBlankLine(file, &(comret->Line[0]));
     
     comret->Rest = IsolateNextWord(&(comret->Line[0]),
                                    &(comret->Command[0]),
                                    BLANK,MAXKEYWORDLENGTH);
     
     comret->KeyWord = SearchForKeyWord( commands, &(comret->Command[0]),
					numcommands);
     
     if(comret->KeyWord == 0) 
          Error(0,"Unrecognized Statement");
     
     }

KeyWords *SearchForKeyWord(KeyWords *keywords, char *word, int max)
     {
     int compare;

     compare = 0;
     while( strncmp( keywords->KeyWord,
                        word,
                        strlen(keywords->KeyWord) )
            && compare <= max ) 
            {
            keywords++;
            compare++;
            }

     if(compare >= max)
          return(0);
     else
          return(keywords);
}     

extern INT CommandIsolateInteger(CommandReturn *comret, char delimitor)
{
INT integer;

     comret->Rest = IsolateNextWord(comret->Rest,
                                    &(comret->Command[0]),
                                    delimitor, 20);
     integer = ConvertStringToInteger(&(comret->Command[0]));
     return(integer);
}

extern FLOAT CommandIsolateFloat(CommandReturn *comret, char delimitor)
{
FLOAT number;

     comret->Rest = IsolateNextWord(comret->Rest,
                                    &(comret->Command[0]),
                                    delimitor, 20);
     number = ConvertStringToFloat(&(comret->Command[0]));
     return(number);
}

extern CHAR *CommandIsolateString(CommandReturn *comret, char delimitor)
{
char *string;

     comret->Rest = IsolateNextWord(comret->Rest,
                                    &(comret->Command[0]),
                                    delimitor,LINELENGTH);

     string = CopyString( &(comret->Command[0]) );

     return(string);
}

extern void SetINTParameters(CHAR *name, INT arg,
			     KeyWords *keywords,
			     INT NumberKeyWords,
			     INT *parameters
			     )
     {
     KeyWords *keyword;
     INT type;
     
     keyword = SearchForKeyWord(keywords,
                                name,
                                NumberKeyWords);
     if(keyword != 0)
	  {
	  type = keyword->Type;
	  *(parameters + type) = arg;
	  }
     else
	  {
	  Error(0, "Parameter Not Recognized");
	  }
     Free(name);
     }


extern void PrintHelpMenu(KeyWords *menu, INT size)
     {
     INT i;
     
     LOOPi(size)
	  {
	  printf("%-20s:%s\n",menu->KeyWord,menu->Description);
	  menu++;
	  }
     }

extern void PrintIntegerParameterStatus(KeyWords *menu, INT *params, INT size)
     {
     INT i, *point;
     
     LOOPi(size)
	  {
	  point = params + menu->Type;
	  printf("%-10d %-20s:%s\n",*point,menu->KeyWord,menu->Description);
	  menu++;
	  }
     }

extern void PrintFloatParameterStatus(KeyWords *menu, FLOAT *params, INT size)
     {
     INT i;
     FLOAT *point;
     
     LOOPi(size)
	  {
	  point = params + menu->Type;
	  printf("%-10f %-20s:%s\n",*point,menu->KeyWord,menu->Description);
	  menu++;
	  }
     }

