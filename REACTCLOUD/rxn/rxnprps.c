/*  FILE     rxnprps.c
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
#include "graph.h"
#include "mol0.h"
#include "rxn.h"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void SetUpReactionForward(PropertyType *type);
static void SetUpReactionReverse(PropertyType *type);
static void TranslatePropReactionDataConstants(GenPropValue *value, CHAR *string,
					       BindStructure *bind);
static CHAR *OnLineReactionDataConstantsForward(GenPropValue *value,
						INT fieldsize,
						INT *bufferleft,
						CHAR *out,
						BindStructure *bind);
static CHAR *OnLineReactionDataConstantsReverse(GenPropValue *value,
						INT fieldsize,
						INT *bufferleft,
						CHAR *out,
						BindStructure *bind);
static CHAR *OnLineReactionDataConstants(CHAR *text,
					 GenPropValue *value,
					 INT fieldsize,
					 INT *bufferleft,
					 CHAR *out,
					 BindStructure *bind);
static void PrintPropReactionDataConstantsForward(FILE *file, CHAR *prefix, 
						  GenPropValue *value,
						  BindStructure *bind);
static void PrintPropReactionDataConstantsReverse(FILE *file, CHAR *prefix, 
						  GenPropValue *value,
						  BindStructure *bind);
/*S  InitializeReactionPropertyTypes
*/
/*F rxnprops = InitializeReactionPropertyTypes(id,name)
**
**  DESCRIPTION
**    
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
extern SetOfPropertyTypes *InitializeReactionPropertyTypes(INT id, CHAR *name)
     {
     SetOfPropertyTypes *types;

     types = AllocateSetOfPropertyTypes;
     CreateSetOfPropertyTypes(types,id,name,
			      3,0);
     
     SetUpReactionForward(types->Types + 0);
     SetUpReactionReverse(types->Types + 1);
     SetUpArrheniusFormValues(types->Types + 2);
     
     return(types);
     }

 
/*f SetUpForward(type)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void SetUpReactionForward(PropertyType *type)
     {
      CreatePropertyType(type,FORWARD_REACTION_CONSTANTS,
			 "ForwardRxn",
			 0,
			 FreeReactionDataConstants,
			 ReadBinReactionDataConstants,
			 WriteBinReactionDataConstants,
			 TranslatePropReactionDataConstants,
			 PrintPropReactionDataConstantsForward,
			 OnLineReactionDataConstantsForward,
			 3,
			 "Reaction Constants in the Forward Direction");
      type->ValueOnLine = OnLineReactionDataConstantsForward;
      }

 
/*f SetUpReverse(type)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void SetUpReactionReverse(PropertyType *type)
     {
      CreatePropertyType(type,REVERSE_REACTION_CONSTANTS,
			 "ReverseRxn",
			 0,
			 FreeReactionDataConstants,
			 ReadBinReactionDataConstants,
			 WriteBinReactionDataConstants,
			 TranslatePropReactionDataConstants,
			 PrintPropReactionDataConstantsReverse,
			 OnLineReactionDataConstantsReverse,
			 3,
			 "Reaction Constants in the Reverse Direction");
      type->ValueOnLine = OnLineReactionDataConstantsReverse;
      }

static void TranslatePropReactionDataConstants(GenPropValue *value, CHAR *string,
					       BindStructure *bind)
     {
     DbaseLinkedList *link,*newlink;
     ReactionDataConstants *constants;
     CHAR *rest,*word,*name,*data;
     
     word = AllocateString(LINELENGTH);
     
     rest = IsolateNextWord(string,word,BLANK,LINELENGTH);
     name = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     data = CopyString(word);
     
     constants = AllocateReactionDataConstants;
     FillInReactionDataConstants(data,constants);
     constants->Name = name;
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,constants->ID,constants->Name,
			   RXNCONSTANTS_LINKED_LIST_SIZE,RXNCONSTANTS_LINKED_LIST_SIZE,
			   0,0,0);
     link->Size = 0;
     WriteBinReactionDataConstants(constants,link);
     newlink = LinkedListToSingle(link);
     
     CreateGenPropValue(value,0,name,PROP_VALUE_EXP,0,newlink->Size,newlink->Element,0,0);
     
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Reference = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Text = CopyString(word);

     FreeReactionDataConstants(constants);
     Free(constants);
     FreeDbaseLinkedList(link);
     Free(link);
     FreeDbaseLinkedList(newlink);
     Free(newlink);
     Free(data);
     Free(word);
     }
 
/*f OnLineReactionDataConstantsForward(value,fieldsize,bufferleft,out,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *OnLineReactionDataConstantsForward(GenPropValue *value,
						INT fieldsize,
						INT *bufferleft,
						CHAR *out,
						BindStructure *bind)
     {
     out = OnLineReactionDataConstants("Forward:     ",
				       value,fieldsize,bufferleft,out,bind);
     return(out);
     }

/*f OnLineReactionDataConstantsReverse(value,fieldsize,bufferleft,out,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *OnLineReactionDataConstantsReverse(GenPropValue *value,
						INT fieldsize,
						INT *bufferleft,
						CHAR *out,
						BindStructure *bind)
     {
     out = OnLineReactionDataConstants("Reverse:     ",
				       value,fieldsize,bufferleft,out,bind);
     return(out);
     }

/*f OnLineReactionDataConstants(text,value,fieldsize,bufferleft,out,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *OnLineReactionDataConstants(CHAR *text,
					 GenPropValue *value,
					 INT fieldsize,
					 INT *bufferleft,
					 CHAR *out,
					 BindStructure *bind)
     {
     DbaseLinkedList *link;
     ReactionDataConstants *constants;
     
     constants = AllocateReactionDataConstants;
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,0,0,
			   value->NumberOfBytes,value->NumberOfBytes,
			   0,value->Value,0);
     ReadBinReactionDataConstants(constants,link);
     
     out = PrintStringReactionDataConstants(out,bufferleft,text,constants);
     
     FreeReactionDataConstants(constants);
     Free(constants);
     FreeDbaseLinkedList(link);
     Free(link);
     
     return(out);
     }
 
/*f PrintPropReactionDataConstantsForward(file,prefix,value,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void PrintPropReactionDataConstantsForward(FILE *file, CHAR *prefix, 
						  GenPropValue *value,
						  BindStructure *bind)
     {
     CHAR *string;
     INT length;
     
     string = AllocateString(2*LINELENGTH);
     length = 2*LINELENGTH;
     
     OnLineReactionDataConstantsForward(value,LINELENGTH,&length,string,bind);
     
     fprintf(file,string);
     Free(string);
     }

/*f PrintPropReactionDataConstantsReverse(file,prefix,value,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void PrintPropReactionDataConstantsReverse(FILE *file, CHAR *prefix, 
						  GenPropValue *value,
						  BindStructure *bind)
     {
     CHAR *string;
     INT length;
     
     string = AllocateString(2*LINELENGTH);
     length = 2*LINELENGTH;
     
     OnLineReactionDataConstantsReverse(value,LINELENGTH,&length,string,bind);
     
     fprintf(file,string);
     Free(string);
     }
extern ReactionDataConstants *FillInReactionDataConstants(CHAR *string,
							  ReactionDataConstants *constants)
     {
     FLOAT aconstant,tempconst,energy;
     INT sym;
     CHAR *word,*rest;
     
     word = AllocateString(LINELENGTH);
     
     rest = IsolateNextWord(string,word,BLANK,LINELENGTH);
     aconstant = ConvertStringToFloat(word);
     
     rest = IsolateNextWord(rest,word,BLANK,LINELENGTH);
     tempconst = ConvertStringToFloat(word);

     rest = IsolateNextWord(rest,word,BLANK,LINELENGTH);
     energy = ConvertStringToFloat(word);

     rest = IsolateNextWord(rest,word,BLANK,LINELENGTH);
     sym = ConvertStringToInteger(word);
     
     CreateReactionDataConstants(constants,0,0,
				 sym,1.0,
				 aconstant,energy,tempconst);
     
     Free(word);
     return(constants);
     }
/*f constants = TransferReactionConstants(value,types,bind);
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern ArrheniusFormValue *TransferReactionConstants(GenPropValue *value,
						     SetOfPropertyTypes *types)
     {
     ReactionDataConstants *constants;
     ArrheniusFormValue *arrconstants;
     
     if(value != 0)
	  {
	  constants = AllocateReactionDataConstants;
	  GetPropValue(constants,value,types);
	  arrconstants = AllocateArrheniusFormValue;
	  CreateArrheniusFormValue(arrconstants,constants->ID,constants->Name,
				   constants->Aconstant,
				   constants->Energy,
				   constants->TempExp,
				   1.0);
	  }
     else 
	  arrconstants = 0;

     return(arrconstants);
     }

	  
/*f value = FindBestReactionValue(flag,values)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern GenPropValue *FindBestReactionValue(INT flag,SetOfPropertyValues *values)
     {
     PropertyValues *props;
     GenPropValue *value;
     
     props = FindValuesFromType(flag,values);
     
     if(props->NumberOfValues > 0)
	  value = props->Values + (props->NumberOfValues - 1);
     else
	  value = 0;
     
     return(value);
     }
 

