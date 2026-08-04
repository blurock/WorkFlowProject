/*  FILE     types.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Routines to set up special (frequent) property data types.
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/
 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "basic.h"
#include "comlib.h"
#include "property.h"

 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . .  static
*/
static INT ReadExINT(INT *i, DbaseLinkedList *link);
static void WriteExINT(INT *f, DbaseLinkedList *link);
static void FreeExINT(INT *i);
static void TranslatePropINT(GenPropValue *value, CHAR *string,
			     BindStructure *bind);
static void PrintSinglePropINT(FILE *file, CHAR *prefix, GenPropValue *value,
			     BindStructure *bind);
static CHAR *OnLinePropINT(GenPropValue *value,
			   INT fieldsize,
			   INT *bufferleft,
			   CHAR *out,
			   BindStructure *bind);
static INT ReadExFLOAT(FLOAT *f, DbaseLinkedList *link);
static void WriteExFLOAT(FLOAT *f, DbaseLinkedList *link);
static void FreeExFLOAT(FLOAT *f);
static void TranslatePropFLT(GenPropValue *value, CHAR *string,
			     BindStructure *bind);
static void PrintSinglePropFLOAT(FILE *file, CHAR *prefix, GenPropValue *value,
				 BindStructure *bind);
static CHAR *OnLinePropFLOAT(GenPropValue *value,
			     INT fieldsize,
			     INT *bufferleft,
			     CHAR *out,
			     BindStructure *bind);

/*F type = SetUpIntegerType(calc,len,text)
**
**  DESCRIPTION
**    calc:  calc(element,bind) to calculate the integer
**    minlen:   The minimum field length
**    text:     A text explanation of the data
**
**    The PropertyType structrue is set up with an INT 
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern void SetUpIntegerType(PropertyType *ptype,
			     GenPropValue *(*calc)(),
			     INT type,
			     CHAR *name,
			     INT len,
			     STRING *text)
     {
     CreatePropertyType(ptype,type,name,
			calc,
			FreeExINT,
			ReadExINT,
			WriteExINT,
			TranslatePropINT,
			PrintSinglePropINT,
			OnLinePropINT,
			len,
			text);
     ptype->CalculateValue = calc;
     ptype->ValueOnLine = OnLinePropINT;
     }
static INT ReadExINT(INT *i, DbaseLinkedList *link)
     {
     return(ReadBinINT(i,link));
     }
static void WriteExINT(INT *f, DbaseLinkedList *link)
     {
     WriteBinINT(f,link);
     }

static void FreeExINT(INT *i)
     {
     FreeINT(i);
     }

static void TranslatePropINT(GenPropValue *value, CHAR *string,
			     BindStructure *bind)
     {
     INT i;
     CHAR *word,*name,*rest;
     
     word = AllocateString(LINELENGTH);
     
     rest = IsolateNextWord(string,word,BLANK,LINELENGTH);
     name = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     i = ConvertStringToInteger(word);
     CreateGenPropValue(value,0,0,0,0,INTSize,(char *) &i,0,0);
     value->Name = name;
     
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Reference = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Text = CopyString(word);

     Free(word);
     
     }

static void PrintSinglePropINT(FILE *file, CHAR *prefix, GenPropValue *value,
			       BindStructure *bind)
     {
     INT i;
     
     i = (INT) *(value->Value);

     if(prefix != 0)
	  fprintf(file,"%s",prefix);
     
     if(value->Text != 0)
	  fprintf(file,"%20s",value->Text);

     fprintf(file,"%10d",i);

     if(value->Reference != 0)
	  fprintf(file,"%s\n",value->Reference);
     }

static CHAR *OnLinePropINT(GenPropValue *value,
			   INT fieldsize,
			   INT *bufferleft,
			   CHAR *out,
			   BindStructure *bind)
     {
     INT i;
     CHAR *rest, *form, *string;
     
     if(fieldsize == 0)
	  fieldsize = 10;
     
     form = AllocateString(10);
     sprintf(form,"%%%dd",fieldsize);
     
     memcpy(&i,value->Value,INTSize);
     string = AllocateString(fieldsize + 5);
     sprintf(string,form,i);
     
     rest = PrintStringString(string,bufferleft,out);

     Free(form);
     Free(string);

     return(rest);
     }

/*F SetUpFloatType(type,calc,len,text)
**
**  DESCRIPTION
**    type: The allocated space for PropertyType
**    calc:  calc(element,bind) to calculate the float
**    minlen:   The minimum field length
**    text:     A text explanation of the data
**
**    The PropertyType structrue is set up with an INT 
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern void SetUpFloatType(PropertyType *ptype,
			   GenPropValue *(*calc)(),
			   INT type,
			   CHAR *name,
			   INT len,
			   STRING *text)
     {
     CreatePropertyType(ptype,type,name,
			calc,
			FreeExFLOAT,
			ReadExFLOAT,
			WriteExFLOAT,
			TranslatePropFLT,
			PrintSinglePropFLOAT,
			OnLinePropFLOAT,
			len,
			text);
     ptype->CalculateValue = calc;
     ptype->ValueOnLine = OnLinePropFLOAT;
     }
static INT ReadExFLOAT(FLOAT *f, DbaseLinkedList *link)
     {
     return(ReadBinFLOAT(f,link));
     }
static void WriteExFLOAT(FLOAT *f, DbaseLinkedList *link)
     {
     WriteBinFLOAT(f,link);
     }
static void FreeExFLOAT(FLOAT *f)
     {
     FreeFLOAT(f);
     }
static void TranslatePropFLT(GenPropValue *value, CHAR *string,
			     BindStructure *bind)
     {
     FLOAT f;
     CHAR *word,*name,*rest;
     
     word = AllocateString(LINELENGTH);
     
     rest = IsolateNextWord(string,word,BLANK,LINELENGTH);
     name = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     f = ConvertStringToInteger(word);
     CreateGenPropValue(value,0,0,0,0,FLOATSize,(char *) &f,0,0);
     value->Name = name;
     
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Reference = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Text = CopyString(word);

     Free(word);
     }

static void PrintSinglePropFLOAT(FILE *file, CHAR *prefix, GenPropValue *value,
				 BindStructure *bind)
     {
     FLOAT f;
     
     f = (FLOAT) *(value->Value);

     if(prefix != 0)
	  fprintf(file,"%s",prefix);
     
     if(value->Text != 0)
	  fprintf(file,"%20s",value->Text);

     fprintf(file,"%10f",f);

     if(value->Reference != 0)
	  fprintf(file,"%s\n",value->Reference);
     }

static CHAR *OnLinePropFLOAT(GenPropValue *value,
			     INT fieldsize,
			     INT *bufferleft,
			     CHAR *out,
			     BindStructure *bind)
     {
     FLOAT f;
     CHAR *rest, *form, *string;
     
     if(fieldsize == 0)
	  fieldsize = 10;
     
     form = AllocateString(10);
     sprintf(form,"%%%de",fieldsize);
     
     memcpy(&f,value->Value,FLOATSize);
     string = AllocateString(fieldsize + 5);
     sprintf(string,form,f);
     
     rest = PrintStringString(out,bufferleft,string);

     Free(form);
     Free(string);

     return(rest);
     }




