/*  FILE     main.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
** The main program of the Chemistry Database system   
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
#include "molprops.h"

/*V  . . . GLOBAL VARIABLES  . . . . . . . . . . . . . . . . . . . . . . . . 
*/
CommandInfo *Current_Command;
INT CommandDebug;
StaticAtomInfoSet *STATICATOMINFO;
/*F ret = main(argc,argv)
**
**  DESCRIPTION
**    argc: Should be three arguments:
                 programname runname menutype
**    argv: The arguments
**    
**    ret: The exit value
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
     CHAR *rootname;
     INT inputtype;
     CommandSource *source;
     FunctionList *commandfunctions,*empty;
     BindStructure *bind;
     SetOfTables *tables;
     BensonCalculation *benson;
     MoleculeSet *molset;
     
     bind = StandardCommandBegin(argc,argv,
			  "Chemistry Database",0,
			  5);
			  
     CommandDebug = 0;
     DEBUGPRINT = 0;
     
     rootname = CopyString(bind->Name);
     inputtype = bind->ID;

     tables = InitializeSetOfTables(inputtype,rootname);
     benson = InitializeBensonCalculation(inputtype,rootname);
     molset = InitializeMoleculeSet(inputtype,rootname);

     BindStructureIntoMaster(tables,BIND_THERMO_TABLES,bind);
     BindStructureIntoMaster(benson,BIND_BENSONCALC,bind);
     BindStructureIntoMaster(molset,BIND_CURRENT_MOLECULES,bind);
     
     InitializeStaticAtomInfo();

     empty = AllocateFunctionList;
     CreateFunctionList(empty,bind->ID,bind->Name,0,0);
     commandfunctions = MergeFunctMolProperties(empty);
     commandfunctions = MergeFunctMolecules(commandfunctions);
     
     source = SetUpStandardSource(bind->Name,bind->ID);

     StartStandardCommands(argc,argv,
			   "molprops",
			   "/home/blurock/cc/command",
			   commandfunctions,
			   source,
			   bind);

     return(0);
     }


