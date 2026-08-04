/*  FILE   main.c  
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
** The main program to test the reaction generation
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
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "chemdb.h"
 
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
     MoleculeSet *molset,*structset;
     ReactionSet *rxnset,*patterns;
/*     ChemDBMaster *dbmaster;*/
     SetOfTables *tables;
     
/*     DEBUGPRINT = 1;*/
     
     bind = StandardCommandBegin(argc,argv,
			  "Chemistry Database",0,
			  5);
			  
     CommandDebug = 0;
     DEBUGPRINT = 0;
     
     rootname = CopyString(bind->Name);
     inputtype = bind->ID;

/*     dbmaster = InitializeChemDBMaster(inputtype,rootname);*/
     molset = InitializeMoleculeSet(inputtype,rootname);
     structset = InitializeMoleculeSet(inputtype,rootname);
     tables = InitializeSetOfTables(inputtype,rootname);
     rxnset = InitializeReactionSet(inputtype,rootname);
     patterns = InitializeReactionSet(inputtype,rootname);
     
/*     BindStructureIntoMaster(dbmaster,BIND_CHEMDBASE,bind);*/
     BindStructureIntoMaster(molset,BIND_CURRENT_MOLECULES,bind);
     BindStructureIntoMaster(molset,BIND_CURRENT_SUBSTRUCTURES,bind);
     BindStructureIntoMaster(tables,BIND_THERMO_TABLES,bind);
     BindStructureIntoMaster(rxnset,BIND_CURRENT_REACTIONS,bind);
     BindStructureIntoMaster(patterns,BIND_CURRENT_PATTERNS,bind);
     
     empty = AllocateFunctionList;
     CreateFunctionList(empty,bind->ID,bind->Name,0,0);
/*     commandfunctions = MergeFunctChemDbase(empty);*/
     commandfunctions = MergeFunctMolProperties(empty);
     commandfunctions = MergeFunctMolecules(commandfunctions);
     commandfunctions = MergeFunctReactions(commandfunctions);
     commandfunctions = MergeFunctGenTrans(commandfunctions);
     
     InitializeStaticAtomInfo();

     source = SetUpStandardSource(bind->Name,bind->ID);

     StartStandardCommands(argc,argv,
			   "gentrans",
			   "/home/blurock/cc/command",
			   commandfunctions,
			   source,
			   bind);

     return(0);
     }


