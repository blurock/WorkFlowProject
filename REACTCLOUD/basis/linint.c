/***************************************************************************/
/* Line Interpret Routines
*/
#include "basic.h"
#include <ctype.h>
#include <stdlib.h>

static void ConvertToRange(char *charrange,char *element,IntegerRange *range);

#define NULLSTRING 0

/***************************************************************************/
extern void EliminateBlanks(char *line)
{
char *line1;

     line1 = line;
     while( *line1 != ENDOFSTRING )
          {
          if( *line != BLANK )
               *line1++ = *line++;
          else
               line++;
          }
     *line1 = ENDOFSTRING;
}

/***************************************************************************/
extern char *EliminateLeadingBlanks(char *line)
{
     while(*line == BLANK || *line == '\t')
          line++;

     return(line);
}

/***************************************************************************/
extern char *NextNonBlankLine(FILE *file, char *line)
     {
       char *line1,*line2;
     char *next,*success;
     
     line1 = line;
     *line1 = ENDOFLINE;
     
     while (*line1 == ENDOFLINE)
          {
	      /*if(file == stdin) printf("--> ");*/
          line1 = fgets(line,LINELENGTH,file);
          if( line1 == NULLSTRING )  return(0);
          line1 = EliminateLeadingBlanks(line1);
          }
     line1 = (char *) strchr(line,ENDOFLINE);
     line2 = (char *) strchr(line,CARRIAGERETURN);
     if(line2 != NULL && line2 < line1) line1=line2;
     if(line1 != NULL) 
       {
	 if(line1-line > 0)
	   {
	     if(*(line1 - 1) == '\\')
	       {
		 next = AllocateString(100*LINELENGTH);
		 success = NextNonBlankLine(file,next);
		 if(success)
		   strcpy(line1-1,next);
		 else
		   *(line1 - 1) = ENDOFSTRING;
		 Free(next);
	       }
	     else
	       *line1 = ENDOFSTRING;
	   }
	 else
	   *line1 = ENDOFSTRING;
       }
     
     if( !strncmp("%%",line,2) )
	line = NextNonBlankLine(file,line);
     return(line);
}

/***************************************************************************/
extern char *IsolateNextWord(char *line, char *word, int delim,int max)
     {
     char *next,delimitor;
     int icount;
     
     delimitor = (char) delim;
     
     next = EliminateLeadingBlanks(line);
     
     icount = 0;
     while(*next != delimitor          &&
           (*next != ENDOFSTRING)      &&
           (*next != ENDOFLINE)        &&
           (*next != CARRIAGERETURN)   &&
           (icount++ <= max) )
               *word++ = *next++;
     
     if( *next == delimitor )
          {
          *word = ENDOFSTRING;
          next++;
          }
     else
          *word = ENDOFSTRING;
     
     EliminateLeadingBlanks(next);
     return(next);
     }

/***************************************************************************/
extern char *CopyString(char *string)
     {
     char *dummy;
     int length;
     
     if(string == NULL)
	  dummy = NULL;
     else
	  {
	  length = strlen(string);
	  dummy = AllocateString(length+2);
	  strcpy(dummy,string);
	  }
     return(dummy);
     }

/***************************************************************************/
extern CHAR *ConcatenateStrings(CHAR *string1, CHAR *string2)
     {
     INT length;
     CHAR *dummy,*dummy1;
     
     length = strlen(string1) + strlen(string2) + 4;
     dummy = AllocateString(length);
     strcpy(dummy,string1);
     dummy1 = dummy + strlen(string1);
     strcpy(dummy1,string2);
     return(dummy);
     }
/***************************************************************************/
extern CHAR *PrintStringString(CHAR *string,
			       INT *bufferleft,
			       CHAR *out)
     {
     INT len;
     
     len = strlen(out);
     if(len >=  *bufferleft)
	  {
	  if(*bufferleft > 0)
	       len = *bufferleft - 1;
	  else
	       len = 0;
	  }
     *bufferleft -= len;
     strncpy(string,out,len);
     string += len;
     *string = '\0';
     return(string);
     }

	  
/***************************************************************************/
extern void ConvertToLower(CHAR *string)
     {
     INT length,i;
     
     length = strlen(string);
     LOOPi(length)
	  {
	  *string = tolower(*string);
	  string++;
	  }
     }
extern void ConvertToUpper(CHAR *string)
     {
     INT length,i;
     
     length = strlen(string);
     LOOPi(length)
	  {
	  *string = toupper(*string);
	  string++;
	  }
     }

/***************************************************************************/
extern INT ConvertStringToInteger(char *string)
     {
     INT num;
     
     if(*string == ENDOFSTRING) return(0);
     num = atoi(string);
     return(num);
     }

/***************************************************************************/
extern FLOAT ConvertStringToFloat(char *string)
{
FLOAT num;

     if(*string == ENDOFSTRING) return(0.0);
     sscanf(string,"%f",&num);
     return(num);
}

/***************************************************************************/
extern char *ConvertFloatToString(FLOAT flt,char *string)
{
     sprintf(string,"%5.3f",flt);
     return(string);
}

/***************************************************************************/
extern char *ConvertIntegerToString(INT in,char *string)
{
     sprintf(string,"%5d",in);
     return(string);
}

/***************************************************************************/
extern INT ConvertStringToIntVec(INT *vec, char *line, char *word,
                           char delimitor,int max)
     {
     int count;
     
     count = 0;
     while( *line != ENDOFSTRING &&
            *line != ENDOFLINE   &&
            count < max           )
          {
          line = IsolateNextWord(line,word,delimitor,LINELENGTH);
          *vec++ = ConvertStringToInteger(word);
          count++;
          }          
     return(count);
}
extern CHAR *StringOfBlanks(INT len)
     {
     CHAR *string, *str;
     INT i;
     
     string = str = AllocateString(len+2);
     LOOPi(len)
	  *str++ = BLANK;
     *str = ENDOFSTRING;
     return(string);
     }

/***************************************************************************/
extern INT ConvertStringToFltVec(FLOAT *vec, char *line, char *word,
                           char delimitor,int max)
{
int count;

     count = 0;
     while( *line != ENDOFSTRING &&
            *line != ENDOFLINE   &&
            count < max          )
          {
          line = IsolateNextWord(line,word,delimitor,LINELENGTH);
          *vec++ = ConvertStringToFloat(word);
          count++;
          }          
     return(count);
}

/***************************************************************************/
extern void PrintIntegerArray(int *array,int num)
{
int i;
     LOOPi(num)
          {
          if( !(i % 10) ) printf("\n");
          printf("%10d",*array++);
          }
     printf("\n");
}

extern void PrintPrettyIntegerArray(CHAR *prefix, FILE *file, INT *array,
				    INT num, INT size)
     {
     int i;
     CHAR *string,*form;
     
     string = StringOfBlanks(strlen(prefix));

     form = AllocateString(10);
     sprintf(form," \%%d ",size);
     
     LOOPi(num)
          {
          if( !(i % 10) ) 
	       {
	       if(i == 0) 
		    fprintf(file,"%s:",prefix);
	       else
		    fprintf(file,"\n%s:",string);
	       }
          fprintf(file,form,*array++);
          }
     fprintf(file,"\n");
     Free(string);
     Free(form);
}

/**************************************************************************************/
/* ComputeNumberOfPoints
*/
extern int ComputeNumberOfPoints(IntegerRangeSet *set)
{
int count,i;
IntegerRange *range;

     count = 0;
     range = set->Range;
     LOOPi(set->NumberOfRanges)
          {
          count += range->Last - range->First + 1;
          range++;
          }
     return(count);
}

/**************************************************************************************/
extern int *ExpandRange(IntegerRange *range, int *points)
{
int size,i,begin;

     size = range->Last - range->First + 1;
     begin = range->First;
     LOOPi(size)
          *points++ = begin++;
     return(points);
}

/***************************************************************************/
extern IntegerRangeSet *AllocInputIntegerRangeSet(char *line,int max)
{
char dummy1[LINELENGTH],dummy2[LINELENGTH];
IntegerRangeSet *set;
IntegerRange *ranges;

     set = AllocateIntegerRangeSet;
     ranges = set->Range = AllocArrayIntegerRange(max);

     InputIntegerRangeSet(line,dummy1,dummy2,set,ranges,max,LINELENGTH);

     return(set);
}

/***************************************************************************/
extern void FreeIntegerRangeSet(IntegerRangeSet *set)
{
     Free(set->Range);
     Free(set);
}

/***************************************************************************/
extern void InputIntegerRangeSet(char *line, char *word,char *dummy,
                                      IntegerRangeSet *set,
                                      IntegerRange *intrngarray,
                                      int max,int strmax)
{
int count;

     set->Range = intrngarray;
     count = 0;
     while( *line != ENDOFSTRING &&
            *line != ENDOFLINE   &&
            count < max   )
          {
          line = IsolateNextWord(line,word,COMMA,strmax);
          ConvertToRange(word,dummy,intrngarray);
          count++;
          intrngarray++;
          }          
     set->NumberOfRanges = count;
}

/***************************************************************************/
static void ConvertToRange(char *charrange,char *element,IntegerRange *range)
{
     charrange = IsolateNextWord(charrange,element,DASH,LINELENGTH);
     range->First = ConvertStringToInteger(element);
     IsolateNextWord(charrange,element,ENDOFLINE,LINELENGTH);
     range->Last = ConvertStringToInteger(element);
}
     

/***********************************************************************/
/*                  Character Isolating Routines                       */
/***********************************************************************/
extern CHAR *IsolateString(CHAR *string, CHAR *out, INT start, INT finish)
     {
     INT size;
     size = finish - start + 1;
     strncpy(out,(string + start),size);
     
     *(out + finish - start + 1) = '\0';
     
     return(out);
}

extern FLOAT IsolateFloat(CHAR *line, INT start, INT finish)
     {
     CHAR *out;
     FLOAT flt;
     INT size;

     size = finish - start + 4;
     out = AllocateString(size);
     IsolateString(line,out,start,finish);
     
     flt = (FLOAT) atof(out);

     Free(out);
     return(flt);
}

extern INT IsolateInteger(CHAR *line, INT start, INT finish)
     {
     CHAR *out;
     INT i,size;
     
     size = finish - start + 4;
     out = AllocateString(size);
     IsolateString(line,out,start,finish);
     i = atoi(out);
     Free(out);
     return(i);
}
             
extern CHAR IsolateChar(CHAR *line, INT start)
{
     return(*(line+start));
}

/***************************************************************************/
extern char *IsolateNextWordFromPhrase(char *line, char *word, char *phrase,int max)
     {
     char *next;
     int icount,phraselength;
     
     phraselength = strlen(phrase);
     
     next = EliminateLeadingBlanks(line);
     
     icount = 0;
     while(strncmp(next,phrase,phraselength) &&
           (*next != ENDOFSTRING)            &&
           (*next != ENDOFLINE)              &&
           (icount++ <= max) )
               *word++ = *next++;
     
     if( strncmp(next,phrase,phraselength) == 0)
          {
          *word = ENDOFSTRING;
          next += phraselength;
          }
     else
          *word = ENDOFSTRING;
     
     EliminateLeadingBlanks(next);
     return(next);
     }

