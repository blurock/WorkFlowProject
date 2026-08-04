/*  FILE     
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
 
#include "basic.h"
#include "comlib.h"
#include "property.h"

/*S PropertyUtilities
*/

 
/*F values = FindValuesFromType(type,set)
**
**  DESCRIPTION
**    type: The property type
**    set: The set of property values
**    values: The set of values for this type
**
**    The SetOfPropertyValues structure is search for the 
**    proper type and the PropertyValues structure is returned
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
extern PropertyValues *FindValuesFromType(INT type,
					  SetOfPropertyValues *set)
     {
     INT count;
     PropertyValues *done, *values;

     if(set != 0)
	  {
	  done = 0;
	  count = 0;
	  values = set->Properties;
	  while(done == 0 && count < set->NumberOfProperties)
	       {
	       if(values->ID == type)
		    done = values;
	       values++;
	       count++;
	       }
	  }
     else
	  done = 0;
     
     return(done);
     }

 
/*F values = FindPropertyTypeFromType(type,set)
**
**  DESCRIPTION
**    type: The property type
**    set: The set of property values
**    values: The set of values for this type
** 
**    The SetOfPropertyValues structure is search for the 
**    proper type and the PropertyValues structure is returned
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
extern PropertyType *FindPropertyTypeFromType(INT type,
					      SetOfPropertyTypes *set)
     {
     INT count;
     PropertyType *done, *values;
     
     done = 0;
     count = 0;
     values = set->Types;
     while(done == 0 && count < set->NumberOfPropertyTypes)
	  {
	  if(values->ID == type)
	       done = values;
	  values++;
	  count++;
	  }
     return(done);
     }

/*F type = FindPropertyTypeFromName(name,set)
**
**  DESCRIPTION
**    name: The property type
**    set: The set of property values
**    type: The property type information
**
**    The PropertyType structure is search for the 
**    proper type and the PropertyValues structure is returned
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
extern PropertyType *FindPropertyTypeFromName(CHAR *name,
					      SetOfPropertyTypes *set)
     {
     INT count;
     PropertyType *done, *values;
     
     done = 0;
     count = 0;
     values = set->Types;
     while(done == 0 && count < set->NumberOfPropertyTypes)
	  {
	  if(!strcmp(values->Name,name))
	       done = values;
	  values++;
	  count++;
	  }
     return(done);
     }

 
/*F
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
extern GenPropValue *FindSpecificValueInPropertyValues(CHAR *name,PropertyValues *values)
     {
     GenPropValue *value, *done;
     INT count;
     
     value = values->Values;
     done = 0;
     count = 0;
     while(done == 0 && count<values->NumberOfValues)
	  {
	  if(value->Name != 0 && !strcmp(value->Name,name))
	       done = value;
	  count++;
	  value++;
	  }
     return(done);
     }

/*F AllocateMorePropertyValues(set)
**
**  DESCRIPTION
**    set: The set of PropertyValues
**
**    The number of allocated values is increased by 
**    PROP_VALUE_INCREMENT.
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
extern void AllocateMorePropertyValues(PropertyValues *values)
     {
     unsigned int memsize;
     INT size;
     char *new;
     
     size = values->NumberOfValues + 1;
     memsize = GenPropValueSize * values->NumberOfValues;
     
     new = (char *) AllocArrayGenPropValue(size);
     
     if(values->Values != 0)
	  memcpy(new,(char *) values->Values,memsize);
     
     Free(values->Values);
     values->Values = (GenPropValue *) new;
     values->NumberOfAllocatedValues = (INT) size;
     
     }

     
