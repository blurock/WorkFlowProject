/*  File     propertytypes.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
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

#include "./property/prptypes.c"

 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void TranslatePropNAME(GenPropValue *value, CHAR *string,
			      BindStructure *bind);
static CHAR *OnLineNAME(GenPropValue *value,
			INT fieldsize,
			INT *bufferleft,
			CHAR *out,
			BindStructure *bind);
static void PrintPropNAME(FILE *file, CHAR *prefix, GenPropValue *value,
			  BindStructure *bind);
static void TranslatePropArrheniusFormValue(GenPropValue *value, CHAR *string,
					    BindStructure *bind);
static CHAR *OnLineArrheniusFormValue(GenPropValue *value,
				      INT fieldsize,
				      INT *bufferleft,
				      CHAR *out,
				      BindStructure *bind);
static void PrintPropArrheniusFormValue(FILE *file, CHAR *prefix, 
					GenPropValue *value,
					BindStructure *bind);

/*S SetUpAlternativeNames
*/
extern void SetUpAlternativeNames(PropertyType *altnames)
     {
     CreatePropertyType(altnames,ALTERNATIVE_NAMES_PROPERTY,
			"AlternativeNames",
			0,
			Free,
			ReadBinNAME,
			WriteBinNAME,
			TranslatePropNAME,
			PrintPropNAME,
			OnLineNAME,
			5,
			"Alternative Names");
     altnames->ValueOnLine = OnLineNAME;
     }

static void TranslatePropNAME(GenPropValue *value, CHAR *string,
			      BindStructure *bind)
     {
     CHAR *rest,*name,*data,*word;
     
     word = AllocateString(LINELENGTH);
     
     rest = IsolateNextWord(string,word,BLANK,LINELENGTH);
     name = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     data = CopyString(word);
     
     EliminateBlanks(data);
     
     CreateGenPropValue(value,0,name, PROP_VALUE_EXP,0,
			(INT) strlen(data)+1,data,0,0);

     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Reference = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Text = CopyString(word);
     Free(word);
     
     Free(name);
     Free(data);
     }

static CHAR *OnLineNAME(GenPropValue *value,
			INT fieldsize,
			INT *bufferleft,
			CHAR *out,
			BindStructure *bind)
     {
     CHAR *string,*rest;
     
     string = AllocateString(value->NumberOfBytes + 1);
     memcpy(string,value->Value,(unsigned int) value->NumberOfBytes);
     *(string + value->NumberOfBytes) = '\000';

     out = PrintStringString(out,bufferleft,string);
     
     if(strlen(string) < fieldsize)
	  {
	  rest = StringOfBlanks(fieldsize - (INT) strlen(string));
	  out = PrintStringString(out,bufferleft,rest);
	  Free(rest);
	  }
     Free(string);
     return(out);
     }
static void PrintPropNAME(FILE *file, CHAR *prefix, GenPropValue *value,
			  BindStructure *bind)
     {
     CHAR *out;
     INT length;
     
     out = AllocateString(LINELENGTH);
     length = LINELENGTH;
     OnLineNAME(value,0,&length,out,bind);
     fprintf(file,"Name: '%s'\n",out);
     Free(out);
     }

/*S SetUpArrheniusFormValues
*/
extern void SetUpArrheniusFormValues(PropertyType *type)
     {
      CreatePropertyType(type,ARRENHIUS_FORM_CONSTANTS,
			 "ArrheniusForm",
			 0,
			 FreeArrheniusFormValue,
			 ReadBinArrheniusFormValue,
			 WriteBinArrheniusFormValue,
			 TranslatePropArrheniusFormValue,
			 PrintPropArrheniusFormValue,
			 OnLineArrheniusFormValue,
			 3,
			 "Exponetial (Arrenhius Form) Constants");
      type->ValueOnLine = OnLineArrheniusFormValue;
      }

static void TranslatePropArrheniusFormValue(GenPropValue *value, CHAR *string,
					    BindStructure *bind)
     {
     DbaseLinkedList *link,*newlink;
     ArrheniusFormValue *constants;
     CHAR *rest,*word,*name,*data;
     
     word = AllocateString(LINELENGTH);
     
     rest = IsolateNextWord(string,word,BLANK,LINELENGTH);
     name = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     data = CopyString(word);
     
     constants = AllocateArrheniusFormValue;
     FillInArrheniusFormValue(data,constants);
     if(constants->Name == 0)
	  constants->Name = CopyString(name);
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,constants->ID,constants->Name,
			   ARRHENIUS_LINKED_LIST_SIZE,ARRHENIUS_LINKED_LIST_SIZE,
			   0,0,0);
     link->Size = 0;
     WriteBinArrheniusFormValue(constants,link);
     newlink = LinkedListToSingle(link);
     
     CreateGenPropValue(value,0,name,PROP_VALUE_EXP,0,newlink->Size,newlink->Element,0,0);
     
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Reference = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Text = CopyString(word);

     FreeArrheniusFormValue(constants);
     Free(constants);
     FreeDbaseLinkedList(link);
     Free(link);
     FreeDbaseLinkedList(newlink);
     Free(newlink);
     Free(data);
     Free(word);
     Free(name);
     }
 
static CHAR *OnLineArrheniusFormValue(GenPropValue *value,
				      INT fieldsize,
				      INT *bufferleft,
				      CHAR *out,
				      BindStructure *bind)
     {
     DbaseLinkedList *link;
     ArrheniusFormValue *constants;
     
     constants = AllocateArrheniusFormValue;
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,0,0,
			   value->NumberOfBytes,value->NumberOfBytes,
			   0,value->Value,0);
     ReadBinArrheniusFormValue(constants,link);
     
     out = PrintStringArrheniusFormValue(out,bufferleft,"",constants);
     
     FreeArrheniusFormValue(constants);
     Free(constants);
     FreeDbaseLinkedList(link);
     Free(link);
     
     return(out);
     }
 
static void PrintPropArrheniusFormValue(FILE *file, CHAR *prefix, 
					GenPropValue *value,
					BindStructure *bind)
     {
     CHAR *string;
     INT length;
     
     string = AllocateString(2*LINELENGTH);
     length = 2*LINELENGTH;
     
     OnLineArrheniusFormValue(value,0,&length,string,bind);
     
     fprintf(file,string);
     Free(string);
     }

extern ArrheniusFormValue *FillInArrheniusFormValue(CHAR *string,
						    ArrheniusFormValue *constants)
     {
     FLOAT aconstant,tempconst,energy,symfact;
     CHAR *word,*rest,*name,*symmetry;
     
     word = AllocateString(LINELENGTH);
     
     rest = IsolateNextWord(string,word,BLANK,LINELENGTH);
     if(*word < '0' || *word > '9')
	  {
	  name = CopyString(word);
	  rest = IsolateNextWord(rest,word,BLANK,LINELENGTH);
	  }
     else
	  name = 0;
     
     aconstant = ConvertStringToFloat(word);
     
     rest = IsolateNextWord(rest,word,BLANK,LINELENGTH);
     tempconst = ConvertStringToFloat(word);

     rest = IsolateNextWord(rest,word,BLANK,LINELENGTH);
     energy = ConvertStringToFloat(word);

     rest = IsolateNextWord(rest,word,BLANK,LINELENGTH);
     symfact = ConvertStringToFloat(word);

     CreateArrheniusFormValue(constants,0,name,
			      aconstant,energy,tempconst,
			      symfact);
     if(name != 0) 
	  Free(name);
     Free(word);
     return(constants);
     }

extern CHAR *PrintStringArrheniusFormValue(CHAR *out, INT *length,
					   CHAR *prefix,
					   ArrheniusFormValue *constants)
     {
     CHAR *string;
     
     string = AllocateString(LINELENGTH);
     if(constants->Name == 0)
	  {
	  sprintf(string,"%s %10e %10.3f %10.2f (%5.1)",
		  prefix,
		  constants->Aconstant,
		  constants->Energy,
		  constants->TempExp,			     
		  constants->SymmetryFactor);
	  }
     else
	  {
	  sprintf(string,"%s %s %10e %10.3f %10.2f",
		  prefix,
		  constants->Name,
		  constants->Aconstant,
		  constants->Energy,
		  constants->TempExp,			     
		  constants->SymmetryFactor);
	  }
	  
     out = PrintStringString(out,length,string);
     Free(string);
     return(out);
     }

