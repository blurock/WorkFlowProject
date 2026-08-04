/*  FILE     main.c
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
#include <stdlib.h>
#include "property.h"

#include "example.h"

#include "example.c"

/*V Global Variables
*/

CommandInfo *Current_Command;
INT CommandDebug;

 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static SetOfPropertyTypes *InitializeExampleTypes();
static PropValue *calcint(VOID element, BindStructure *bind);
static PropValue *calcflt(VOID element, BindStructure *bind);



/*F main(argc,argv)
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

int main(int argc, char *argv[])
     {
     SetOfPropertyTypes *types;
     SetOfPropertyValues *set;
     BindStructure *bind;
     INT exint;
     FLOAT exflt;
     Example1 *example;
     
     bind = StandardCommandBegin(argc,argv,
				 "Example Bind",0,
				 5);
			  
     CommandDebug = 0;
     DEBUGPRINT = 0;

/*     srandom(0);*/
     
     types = InitializeExampleTypes();
     set = InitializeSetOfPropertyValues(types);
     
     BindStructureIntoMaster(types,3000,bind);
     
     example = AllocateExample1;
     CreateExample1(example,1,"Example",
		    123,567.89);
     
     FillInDefaultPropValue((VOID) example,set,types,bind);
     
     GetPropValue(&exint,set->Properties->Values,types);
     printf("Extracted %d\n",exint);
     
     GetPropValue(&exflt,(set->Properties + 1)->Values,types);
     printf("Extracted %f\n",exflt);
     
     return(0);
     }

 
/*f ret = InitializeExampleTypes()
**
**  DESCRIPTION
**    ret: A example set of types
**
**    Setup a sample SetOfPropertyTypes structure
**    
**  REMARKS
**
*/
static SetOfPropertyTypes *InitializeExampleTypes()
     {
     SetOfPropertyTypes *types;
     PropertyType *type1,*type2;

     types = AllocateSetOfPropertyTypes;
     CreateSetOfPropertyTypes(types,1,"Example",
			      2,0);
     
     type1 = types->Types;
     type2 = types->Types + 1;
     
     SetUpIntegerType(type1,calcint,0,"IntegerExample",5,"An Integer Example");
     SetUpFloatType(type2,calcflt,1,"FloatExample",10,"An Float Example");

     return(types);
     }

static PropValue *calcint(VOID element, BindStructure *bind)
     {
     Example1 *example;
     SetOfPropertyTypes *types;
     PropValue *value;
     
     example = (Example1 *) element;
     
     types = GetBoundStructure(bind,3000);
     
     value = StoreValueInPropValue((VOID) &(example->Integers),
				   0,
				   10,
				   0,
				   "Just Extracted Integer",
				   "An Example of an Integer Extraction",
				   types);
     return(value);
     }
static PropValue *calcflt(VOID element, BindStructure *bind)
     {
     Example1 *example;
     SetOfPropertyTypes *types;
     PropValue *value;
     
     example = (Example1 *) element;
     
     types = GetBoundStructure(bind,3000);
     
     value = StoreValueInPropValue((VOID) &(example->Float),
				   1,
				   20,
				   0,
				   "Just Extracted Float",
				   "An Example of the Float Extraction",
				   types);
     return(value);
     }

				  
