/*  FILE     propout.c
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

/* PrintProperty
*/
 
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
extern CHAR *PrintStringAllPropertySets(CHAR *string, INT *length,
					SetOfPropertyTypes *types,
					SetOfPropertyValues *values,
					BindStructure *bind)
     {
     PropertyType *type;
     PropertyValues *valueset;
     GenPropValue *value;
     CHAR *text;
     INT i,j;

     if(values != 0)
	  {
	  text = AllocateString(PRINT_BUFFER_LENGTH);
	  
	  type = types->Types;
	  valueset = values->Properties;
	  LOOPi(types->NumberOfPropertyTypes)
	       {
		 string = PrintStringString(string,length,"~\n");

	       string = PrintStringString(string,length,valueset->Text);
	       string = PrintStringString(string,length,"\n");
	       
	       if(valueset->NumberOfValues == 0)
		    {
		    string = PrintStringString(string,length,"      No values Given\n");
		    }
	       else
		    {
		    value = valueset->Values;
		    LOOPj(valueset->NumberOfValues)
			 {
			 sprintf(text,"    %4d     %s   %s; %s\n",
				 j,value->Name,value->Reference,value->Text);
			 string = PrintStringString(string,length,text);
			 
			 string = PrintStringString(string,length,"             ");
			 string = (*(type->ValueOnLine))(value,0,length,string,bind);
			 
			 string = PrintStringString(string,length,"\n");
			 value++;
			 }
		    }
	       
	       type++;
	       valueset++;
	       }
	  Free(text);
	  }
     
     return(string);
     }
     

/*F new = ValuesAsTableLine(string,length,id,name,fieldsize,values,types,bind)
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
extern CHAR *ValuesAsTableLine(CHAR *string, INT *length, INT id,
			       CHAR *name, INT fieldsize,
			       SetOfPropertyValues *values,
			       SetOfPropertyTypes *types,
			       BindStructure *bind)
     {
     PropertyValues *propvalues;
     PropertyType *type;
     GenPropValue *value;
     INT i;
     
     type = FindPropertyTypeFromType(id,types);
     propvalues = FindValuesFromType(id,values);
     
     value = propvalues->Values;
     LOOPi(propvalues->NumberOfValues)
	  {
	  string = (*(type->ValueOnLine))(value,fieldsize,length,string,bind);
	  string = PrintStringString(string,length,"\n");
	  value++;
	  }
     return(string);
     }

     
