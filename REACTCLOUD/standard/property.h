/*  FILE     property.h
**  PACKAGE  
**  AUTHOR  Edward S. Blurock 
**
**  CONTENT
**    
**
**  COPYRIGHT (C) 1995 REACTION Project / Edward S. Blurock
*/

#ifndef REACTION_PROPERTY_H
#define REACTION_PROPERTY_H
 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "property/props.h"
#include "property/asciiprop.h"
#include "property/prptypes.h"
 
/*V  . . . GLOBAL VARIABLES  . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#define MAX_ASCII_PROPERTIES 20

#define ALTERNATIVE_NAMES_PROPERTY  110
#define ARRENHIUS_FORM_CONSTANTS    111

#define ARRHENIUS_LINKED_LIST_SIZE 300

 
/*V MiscelaneousConstants
*/
#define PROP_VALUE_INCREMENT        2
#define PROP_VALUE_INITIAL_COUNT    2
#define LINK_SIZE                   1000    

/*V Property Source
**    The general class of source of the property
**    (used in the ordering routine)
*/
#define PROP_VALUE_EXP           0
#define PROP_VALUE_CALC          1
#define PROP_VALUE_TRANSLATED    2
#define PROP_VALUE_DEFAULT       3

/*V Default Property Classes (Defines)
**
**   The default classes of property types available
**   Standard sets of functions are available for these
*/
#define VALUE_TYPE_INT           0
#define VALUE_TYPE_FLT           1
#define VALUE_TYPE_INT_VEC       2
#define VALUE_TYPE_FLT_VEC       3
#define VALUE_TYPE_STRING        4

/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . .  pstore.c  
*/
extern SetOfPropertyValues
*InitializeSetOfPropertyValues(SetOfPropertyTypes *types);
extern INT FillInDefaultPropValue(VOID element,
				  SetOfPropertyValues *set,
				  SetOfPropertyTypes *types,
				  BindStructure *bind);
extern GenPropValue *StoreValueInPropValue(VOID value,
					INT proptype,
					INT con,
					INT type,
					STRING *ref,
					STRING *text,
					SetOfPropertyTypes *types);
extern void GetPropValue(VOID element, 
			 GenPropValue *value,
			 SetOfPropertyTypes *types);
extern INT AddProperty(GenPropValue *value, 
		       SetOfPropertyValues *set);
extern INT AddValueToPropertyValues(GenPropValue *value,
				    PropertyValues *set);
extern INT FillInPropertyValueFromStringFromID(CHAR *line,
				       INT proptype,
				       SetOfPropertyValues *set,
				       SetOfPropertyTypes *types,
				       BindStructure *bind);
extern INT FillInPropertyValueFromStringFromName(CHAR *line,
					 CHAR *name,
					 SetOfPropertyValues *set,
					 SetOfPropertyTypes *types,
					 BindStructure *bind); 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . .  util.c
*/
extern GenPropValue *FindSpecificValueInPropertyValues(CHAR *name,PropertyValues *values);
extern PropertyValues *FindValuesFromType(INT type,
					  SetOfPropertyValues *set);
extern PropertyType *FindPropertyTypeFromType(INT type,
					      SetOfPropertyTypes *set);
extern void AllocateMorePropertyValues(PropertyValues *values);
extern PropertyType *FindPropertyTypeFromName(CHAR *name,
					      SetOfPropertyTypes *set);

/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . . types.c
*/
extern void SetUpArrheniusFormValues(PropertyType *type);
extern void SetUpIntegerType(PropertyType *ptype,
			     GenPropValue *(*calc)(),
			     INT type,
			     CHAR *name,
			     INT len,
			     STRING *text);
extern void SetUpFloatType(PropertyType *ptype,
				    GenPropValue *(*calc)(),
				    INT type,
				    CHAR *name,
				    INT len,
				    STRING *text);

 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . propout.c
*/
extern CHAR *PrintStringAllPropertySets(CHAR *string, INT *length,
					SetOfPropertyTypes *types,
					SetOfPropertyValues *values,
					BindStructure *bind);
extern CHAR *ValuesAsTableLine(CHAR *string, INT *length, INT id,
			       CHAR *name, INT fieldsize,
			       SetOfPropertyValues *values,
			       SetOfPropertyTypes *types,
			       BindStructure *bind);

 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
extern CHAR *ReadInPropertyInfoSDF(FILE *file, CHAR *line, ASCIIProperties *propset);
extern void FillInASCIIValue(ASCIIProperties *asciipropset,
			     SetOfPropertyValues *propset,
			     SetOfPropertyTypes *types,
			     BindStructure *bind);
extern CHAR *FillInProperties(FILE *file, ASCIIProperties *props, CHAR *string);
extern ASCIIProperties *ReadInListOfNamesAndProps(FILE *file,
						  INT max,
						  CHAR delimitor);
extern ASCIIProperties *ReadListFromLine(CHAR *line,
					 INT max,
					 CHAR setdelimitor,
					 CHAR namedelimitor); 
/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . propertytypes.c
*/
extern void SetUpAlternativeNames(PropertyType *altnames);
extern void SetUpArrheniusFormValues(PropertyType *type);
extern ArrheniusFormValue *FillInArrheniusFormValue(CHAR *string,
						    ArrheniusFormValue *constants);
extern CHAR *PrintStringArrheniusFormValue(CHAR *out, INT *length,
					      CHAR *prefix,
					   ArrheniusFormValue *constants);

#endif
