/*  File     pstore.c
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

#include "./property/props.c"

/*S Initialize
*/

 
/*F set = InitializeSetOfPropertyValues(types)
**
**  DESCRIPTION
**    types: The set of property types
**    set:  Values associated with each type
**    
**    For each property type, an PropertyValues structure
**    is set up in SetOfPropertyValues.
**
**  REMARKS
**   The initial number of allocated properties is PROP_VALUE_INCREMENT
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern SetOfPropertyValues
*InitializeSetOfPropertyValues(SetOfPropertyTypes *types)
     {
     SetOfPropertyValues *set;
     PropertyType *type;
     PropertyValues *values;
     INT i;
     
     set = AllocateSetOfPropertyValues;
     CreateSetOfPropertyValues(set,types->ID, types->Name,
			       types->NumberOfPropertyTypes,
			       0);
     type = types->Types;
     values = set->Properties;
     LOOPi(types->NumberOfPropertyTypes)
	  {
	  CreatePropertyValues(values,type->ID,type->Name,
			       PROP_VALUE_INITIAL_COUNT,
			       PROP_VALUE_INITIAL_COUNT,			       
			       0,0,
			       type->Text);
	  values->NumberOfValues = 0;
	  values++;
	  type++;
	  }
     return(set);
     }

 
/*F ret = FillInDefaultPropValue(element, set, types, bind)
**
**  DESCRIPTION
**    element:  The object for which the property will be calculated
**    set: The set of existing property values
**    types: The property types
**    bind: The BindStructure for additional info
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The default property routine is used to fill in 
**    a value for the property
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
extern INT FillInDefaultPropValue(VOID element,
				  SetOfPropertyValues *set,
				  SetOfPropertyTypes *types,
				  BindStructure *bind)
     {
     GenPropValue *value;
     PropertyValues *values;
     PropertyType *type;
     INT i;
     
     type = types->Types;
     values = set->Properties;
     LOOPi(types->NumberOfPropertyTypes)
	  {
	  value = (*(type->CalculateValue))(element,bind);
	  value->SrcType = PROP_VALUE_DEFAULT;
	  AddProperty(value,set);

	  FreeGenPropValue(value);
	  Free(value);

	  values++;
	  type++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

 
/*F value = StoreValueInPropValue(value, proptype, con, type, ref, text)
**
**  DESCRIPTION
**    value: The value of the property
**    proptype: The proptype
      con: Confidence level
**    type: The general property class  (exp,calc.trans.default..)
**    ref: Text with reference info
**    text: General text about the value
**    value: A GenPropValue structure filled in
**
**    The GenPropValue structure is created and filled in.
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
extern GenPropValue *StoreValueInPropValue(VOID element,
					INT proptype,
					INT con,
					INT srctype,
					STRING *ref,
					STRING *text,
					SetOfPropertyTypes *types)
     {
     GenPropValue *value;
     DbaseLinkedList *link,*single;
     PropertyType *type;
     
     
     type = FindPropertyTypeFromType(proptype,types);
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,proptype,0,
			   LINK_SIZE,LINK_SIZE,
			   0,0,0);
     link->Size = 0;
     
     (*(type->WriteBinValue))(element,link);
     
     single = LinkedListToSingle(link);
     
     value = AllocateGenPropValue;
     CreateGenPropValue(value,proptype,0,srctype,
		     con,single->Size,single->Element,
		     ref,text);

     FreeDbaseLinkedList(single);
     Free(single);
     FreeDbaseLinkedList(link);
     Free(link);
     
     return(value);
     }
 
/*F GetPropValue(element, value, types)
**
**  DESCRIPTION
**    element:  Allocated space for the element
**    value:    The GenPropValue structrue
**    types:    The list of property types
**
**    The value is translated from the Propvalue structure
**    and stored in the allocated space
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
extern void GetPropValue(VOID element, 
			 GenPropValue *value,
			 SetOfPropertyTypes *types)
     {
     DbaseLinkedList *link;
     PropertyType *type;
     
     
     type = FindPropertyTypeFromType(value->ID,types);
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,value->ID,0,
			   value->NumberOfBytes,
			   value->NumberOfBytes,			   
			   0,value->Value,0);
     (*(type->ReadBinValue))(element,link);
     
     FreeDbaseLinkedList(link);
     Free(link);
     }

/*S AddProperty
*/
/*F FillInPropertyValueFromStringFromID(line,proptype,set,types,bind)
**
**  DESCRIPTION
**    line: The sting line on which the property value lies
**    proptype: The property id
**    set: The set of values where property is to be inserted
**    types: The set of all possible property types
**    bind: The bind structure
**
**    From a string value of a property, translate it and fill in the value
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
extern INT FillInPropertyValueFromStringFromID(CHAR *line,
				       INT proptype,
				       SetOfPropertyValues *set,
				       SetOfPropertyTypes *types,
				       BindStructure *bind)
     {
     PropertyType *type;
     GenPropValue *value;
     INT ret;
     
     type = FindPropertyTypeFromType(proptype,types);
     value = AllocateGenPropValue;
     (*(type->TranslateString))(value,line,bind);
     
     value->ID = proptype;
     ret = AddProperty(value,set);     
     return(ret);
     }

/*F FillInPropertyValueFromStringFromName(line,proptype,set,types,bind)
**
**  DESCRIPTION
**    line: The sting line on which the property value lies
**    name: The property type as name
**    set: The set of values where property is to be inserted
**    types: The set of all possible property types
**    bind: The bind structure
**
**    From a string value of a property, translate it and fill in the value
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
extern INT FillInPropertyValueFromStringFromName(CHAR *line,
					 CHAR *name,
					 SetOfPropertyValues *set,
					 SetOfPropertyTypes *types,
					 BindStructure *bind)
     {
     PropertyType *type;
     GenPropValue *value;
     INT ret;
     CHAR *string;
     
     type = FindPropertyTypeFromName(name,types);
     if(type != 0)
	  {
	  value = AllocateGenPropValue;
	  (*(type->TranslateString))(value,line,bind);
	  
	  value->ID = type->ID;
	  ret = AddProperty(value,set);
	  FreeGenPropValue(value);
	  Free(value);
	  }
     else
	  {
	  string = AllocateString(LINELENGTH);
	  sprintf(string,"Property not found: %s",name);
	  Error(0,string);
	  ret = SYSTEM_NORMAL_RETURN;
	  Free(string);
	  }
     
     return(ret);
     }
/*F ret = AddProperty(value, set)
**
**  DESCRIPTION
**    value: The property to be added to the list
**    set: The current set of property values
**    ret:  SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The GenPropValue structure is placed in the proper place
**    in the list of property values (according to its type)
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
extern INT AddProperty(GenPropValue *value, 
		       SetOfPropertyValues *set)
     {
     INT ret;
     PropertyValues *values;
     
          
     values = FindValuesFromType(value->ID,set);
     if(values != 0)
	  ret = AddValueToPropertyValues(value,values);
     else
	  ret = SYSTEM_ERROR_RETURN;
     
     return(ret);
     }

 
/*F ret = AddValueToPropertyValues(value,values)
**
**  DESCRIPTION
**    value: The property value
**    value: The other values of the same property
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The property value is placed in the list with the other
**    property values .  More space is allocated
**    (AllocateMorePropertyValues).
**
**
**  REMARKS
**    No check is made if the value is repeated.  The value is copied
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
** 
*/
extern INT AddValueToPropertyValues(GenPropValue *value,
				    PropertyValues *set)
     {
     GenPropValue *position;
     
     AllocateMorePropertyValues(set);

     position = set->Values + set->NumberOfValues;
     CreateGenPropValue(position, value->ID, value->Name,
		     value->SrcType,
		     value->Confidence,
		     value->NumberOfBytes,
		     value->Value,
		     value->Reference,
		     value->Text);
     
     set->NumberOfValues += 1;
     
     return(SYSTEM_NORMAL_RETURN);
     }
