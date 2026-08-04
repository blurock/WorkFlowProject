/*  FILE     structgen.c
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
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "spec0.h"
#include "chemdb.h"
#include "generate.h"

StaticAtomInfoSet *STATICATOMINFO;
  INT CommandDebug;

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
  MoleculeStructureSpecification *spec;
  CHAR *rootname;
  int inputtype;
  BindStructure *bind;
  CommandSource *source;
  CommandMaster *commandmaster;
  GenerateStructureMaster *genmaster;
  FunctionList *commandfunctions,*empty;
  ChemDBMaster *dbmaster;

  CommandDebug = 0;
  bind = StandardCommandBegin(argc,argv,
			      "Chemistry Database",0,
			      9);
  InitAlloc(100000);
  DEBUGPRINT = 0;
  NoStructureCode = NO_STRUCTURE_CODE;
     
  genmaster = InitializeGenerateStructureMaster();
  BindStructureIntoMaster(genmaster,BIND_GENERATE,bind);
  dbmaster = InitializeChemDBMaster(inputtype,rootname);
  BindStructureIntoMaster(dbmaster,BIND_CHEMDBASE,bind);

  
  empty = AllocateFunctionList;
  CreateFunctionList(empty,bind->ID,bind->Name,0,0);
  commandfunctions = MergeFunctMoleculesGenerate(empty);
  commandfunctions = MergeFunctChemDbase(commandfunctions);
  commandfunctions = MergeFunctMolecules(commandfunctions);
  commandfunctions = MergeFunctDBMolecule(commandfunctions);

  if(argc == 4) {
    source = SetUpStandardSource(bind->Name,bind->ID);
    
    StartStandardCommands(argc,argv,
			  "chemdb",
			  argv[3],
			  commandfunctions,
			  source,
			  bind);
  } else {
    printf("Not enough arguments: expecting (additionally to the normal input)\n");
    printf("         The directory of the commands\n");
  }
  return(0);
}
