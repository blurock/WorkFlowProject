#ifndef BASIC_H
#define BASIC_H

#include <sys/types.h>
#include "defines.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <limits.h>
#include "simple.h"
#include "cJSON.h"

extern INT NoStructureCode;

#include "xdrrpc.h"


#include "dblink.h"

#define LINKED_SIZE     1000

/**********************************************************************/
/* linint */
/**********************************************************************/
typedef struct rng {
     int First;
     int Last;
     } IntegerRange;

typedef struct rngset {
     int NumberOfRanges;
     IntegerRange *Range;
     } IntegerRangeSet;

#define IntegerRangeSize sizeof(IntegerRange)
#define IntegerRangeSetSize sizeof(IntegerRangeSet)
#define AllocateIntegerRangeSet (IntegerRangeSet *) Malloc(IntegerRangeSetSize)
#define AllocArrayIntegerRange(n) (IntegerRange *) Calloc(n,IntegerRangeSize)


extern void EliminateBlanks(char *line);
extern char *EliminateLeadingBlanks(char *line);
extern char *NextNonBlankLine(FILE *file, char *line);

extern void ConvertToLower(CHAR *string);
extern void ConvertToUpper(CHAR *string);
extern CHAR *StringOfBlanks(INT len);
extern CHAR *PrintStringString(CHAR *string,
			       INT *bufferleft,
			       CHAR *out);
extern CHAR *ConcatenateStrings(CHAR *string1, CHAR *string2);
extern void PrintPrettyIntegerArray(CHAR *prefix, FILE *file, INT *array,
				    INT num, INT size);
extern void FreeIntegerRangeSet(IntegerRangeSet *set);
extern CHAR *IsolateString(CHAR *string, CHAR *out, INT start, INT finish);
extern FLOAT IsolateFloat(CHAR *line, INT start, INT finish);
extern INT IsolateInteger(CHAR *line, INT start, INT finish);
extern CHAR IsolateChar(CHAR *line, INT start);
/**********************************************************************/
/* keywrd */
/**********************************************************************/
#define MAXNUMBEROFVARIABLES 300
#define MAXKEYWORDLENGTH 50

typedef struct Keys {
     char KeyWord[MAXKEYWORDLENGTH];
     INT Type;
     INT (*Function)();
     CHAR Description[80];
     void *Data;
     } KeyWords;

#define KeyWordSize sizeof(KeyWords)
#define AllocateKeyWords (KeyWords *) Malloc(KeyWordSize)

typedef struct keywordarray 
     {
     INT ID;
     CHAR *Name;
     INT NumberOfKeyWords;
     KeyWords *Keys;
     } KeyWordArray;

#define KeyWordArraySize sizeof(KeyWordArray)
#define AllocateKeyWordArray (KeyWordArray *) Malloc(KeyWordArraySize)
#define CreateKeyWordArray(array,id,name,size)\
     array->ID = id;\
     array->Name = CopyString(name);\
     array->NumberOfKeyWords = size;\
     array->Keys = (KeyWords *) Calloc(size,KeyWordSize);

typedef struct ComRtn {
     char Line[LINELENGTH];
     char Command[LINELENGTH];
     char *Rest;
     KeyWords *KeyWord;
     } CommandReturn;

#define CommandReturnSize sizeof(CommandReturn)
#define AllocateCommandReturn (CommandReturn *) Malloc(CommandReturnSize)
#define CopyFullCommandReturn(new,old) memcpy(new,old,CommandReturnSize)
#define FreeCommandReturn(str) Free(str)
#define PrintCommandReturn(str) printf("CommandReturn: %s\n",str->Command)
#define WriteBinCommandReturn(str,file) WriteBin(str,CommandReturnSize,file)
#define ReadBinCommandReturn(new,file) ReadBin(new,CommandReturnSize,file)
#define WriteJSONCommandReturn(str) cJSON_CreateNull()
#define ReadJSONCommandReturn(new,json_item) STRUCTURE_READ

#define WriteJSONSTRING(str) ((str) ? cJSON_CreateString(str) : cJSON_CreateNull())
#define ReadJSONSTRING(new,json_item) if(cJSON_IsString(json_item) && (json_item)->valuestring) strcpy(new,(json_item)->valuestring)

#define WriteJSONNAME(ptr) ((*ptr) ? cJSON_CreateString(*ptr) : cJSON_CreateNull())
#define ReadJSONNAME(new,json_item) if(cJSON_IsString(json_item) && (json_item)->valuestring) *(new) = CopyString((json_item)->valuestring)

#define WriteJSONVOID(obj) cJSON_CreateNull()
#define ReadJSONVOID(new,json_item) STRUCTURE_READ
#define xdr_CommandReturn xdr_int



/**********************************************************************/
/* keywrd.c */
/**********************************************************************/
extern KeyWords *SearchForKeyWord(KeyWords *keywords, char *word, int max);
extern void ReadCommandLine(KeyWords *commands,int numcommands,
                     CommandReturn *comret, FILE *file);
extern CHAR   *CommandIsolateString(CommandReturn *comret, char delimitor);
extern INT     CommandIsolateInteger(CommandReturn *comret, char delimitor);
extern FLOAT   CommandIsolateFloat(CommandReturn *comret, char delimitor);
extern void PrintHelpMenu(KeyWords *menu, INT size);
extern void PrintIntegerParameterStatus(KeyWords *menu, INT *params, INT size);
extern void PrintFloatParameterStatus(KeyWords *menu, FLOAT *params, INT size);
extern void SetINTParameters(CHAR *name, INT arg,
			     KeyWords *keywords,
			     INT NumberKeyWords,
			     INT *parameters
			     );
/**********************************************************************/
/* util.c */
/**********************************************************************/
extern void Error(int n, char *message);

extern void *Malloc(INT size);
extern void *Calloc(INT nelem, INT elsize);
extern void Free(void *ptr);
extern void Cfree(void *ptr);
extern void InitAlloc(INT len);
extern void PrintAllocSummary();
extern CHAR *ConcatenateStrings(CHAR *string1, CHAR *string2);
extern char *CopyString(char *string);
extern void EliminateBlanks(char *line);
extern char *EliminateLeadingBlanks(char *line);
extern char *NextNonBlankLine(FILE *file, char *line);
extern char *IsolateNextWord(char *line, char *word, int delimitor,int max);
extern char *IsolateNextWordFromPhrase(char *line, char *word, char *phrase,int max);
extern INT ConvertStringToInteger(char *string);
extern FLOAT ConvertStringToFloat(char *string);
extern char *ConvertFloatToString(FLOAT flt,char *string);
extern char *ConvertIntegerToString(INT in,char *string);
extern INT ConvertStringToIntVec(INT *vec, char *line, char *word,
                           char delimitor,int max);
extern INT ConvertStringToFltVec(FLOAT *vec, char *line, char *word,
                           char delimitor,int max);
extern void PrintIntegerArray(int *array,int num);
extern INT ConvertStringToFltVec(FLOAT *vec, char *line, char *word,
                           char delimitor,int max);
extern void PrintIntegerArray(int *array,int num);
extern IntegerRangeSet *AllocInputIntegerRangeSet(char *line,int max);
extern void FreeIntegerRangeSet(IntegerRangeSet *set);
extern void InputIntegerRangeSet(char *line, char *word,char *dummy,
                                      IntegerRangeSet *set,
                                      IntegerRange *intrngarray,
                                      int max,int strmax);

/**********************************************************************/
/* fileio.c */
/**********************************************************************/
/*extern void WriteBin(void *object, INT size, FILE *file);
extern void ReadBin(void *object, INT size, FILE *file);
extern void ReadBinVOID(VOID *obj,FILE *file);
extern void WriteBinVOID(VOID *obj,FILE *file);
extern void ReadBinSTRING(CHAR *string, FILE *file);
extern void WriteBinSTRING(CHAR *string, FILE *file);
extern void ReadBinNAME(CHAR **string, FILE *file);
extern void WriteBinNAME(CHAR **string, FILE *file);
extern CHAR **AllocateNAME();
*/
extern FILE *OpenWriteFile(CHAR *name, CHAR *directory, FLAG flag);
extern FILE  *OpenReadFile(CHAR *name, CHAR *directory, FLAG flag);
extern CHAR *ProduceFileName(CHAR *directory, CHAR *name,
				CHAR *suffix);
/**********************************************************************/
/* dbaselink.c */
/**********************************************************************/

extern INT WriteBin(void *element,
		    INT size,
		    DbaseLinkedList *link);
extern INT ReadBin(void *element,
		   INT size,
		   DbaseLinkedList *link);
extern DbaseLinkedList *GetCurrentWriteLink(DbaseLinkedList *link);
extern DbaseLinkedList *GetCurrentReadLink(DbaseLinkedList *link);
extern INT DbaseLinkedListMemory(DbaseLinkedList *link);
extern DbaseLinkedList *LinkedListToSingle(DbaseLinkedList *link);


extern void WriteBinSTRING(CHAR *string, DbaseLinkedList *link);
extern INT ReadBinSTRING(CHAR *string, DbaseLinkedList *link);
extern void WriteBinNAME(CHAR **string, DbaseLinkedList *link);
extern INT ReadBinNAME(CHAR **string, DbaseLinkedList *link);
extern CHAR **AllocateNAME();
extern INT ReadBinVOID(VOID *obj,DbaseLinkedList *link);
extern void WriteBinVOID(VOID *obj,DbaseLinkedList *link);

#endif
