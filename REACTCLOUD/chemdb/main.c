/*  FILE     
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
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "spec0.h"
#include "chemdb.h"
#include "generate.h"
 
/*V  . . . GLOBAL VARIABLES  . . . . . . . . . . . . . . . . . . . . . . . . 
*/
CommandInfo *Current_Command;
INT CommandDebug;

StaticAtomInfoSet *STATICATOMINFO;
INT NoStructureCode;

INT DEBUGPRINT;
/*#define StaticAtomInfoFile "/home/reaction/react/data/stat-inf.dat"*/
 
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
     ChemDBMaster *dbmaster;
     SetOfTables *tables;
     SetOfDetailedMechanisms *mechanisms;
     SetOfObjectClassifications *classifications;     
     SpectrumSet *molspectra;
     GenerateStructureMaster *genmaster;

     bind = StandardCommandBegin(argc,argv,
			  "Chemistry Database",0,
			  9);
			  
     srand(time(NULL));
     InitAlloc(100000);
     DEBUGPRINT = 0;
     NoStructureCode = NO_STRUCTURE_CODE;
     CommandDebug = 0;
     
     rootname = CopyString(bind->Name);
     inputtype = bind->ID;

     dbmaster = InitializeChemDBMaster(inputtype,rootname);
     BindStructureIntoMaster(dbmaster,BIND_CHEMDBASE,bind);

     molset = InitializeMoleculeSet(inputtype,rootname);
     BindStructureIntoMaster(molset,BIND_CURRENT_MOLECULES,bind);

     structset = InitializeMoleculeSet(inputtype,rootname);
     BindStructureIntoMaster(molset,BIND_CURRENT_SUBSTRUCTURES,bind);

     tables = InitializeSetOfTables(inputtype,rootname);
     BindStructureIntoMaster(tables,BIND_THERMO_TABLES,bind);

     rxnset = InitializeReactionSet(inputtype,rootname);
     BindStructureIntoMaster(rxnset,BIND_CURRENT_REACTIONS,bind);

     patterns = InitializeReactionSet(inputtype,rootname);
     BindStructureIntoMaster(patterns,BIND_CURRENT_PATTERNS,bind);

     mechanisms = InitializeSetOfDetailedMechanisms(inputtype,rootname);
     BindStructureIntoMaster(mechanisms,BIND_CURRENT_MECHANISMS,bind);

     classifications = InitializeSetOfObjectClassifications(inputtype,rootname);
     BindStructureIntoMaster(classifications,BIND_ID_CLASSIFICATIONS,bind);

     molspectra = InitializeMoleculeSpectrumSet(inputtype,rootname);
     BindStructureIntoMaster(molspectra,BIND_CURRENT_SPECTRASET,bind);

     genmaster = InitializeGenerateStructureMaster();
     BindStructureIntoMaster(genmaster,BIND_GENERATE,bind);

     empty = AllocateFunctionList;
     CreateFunctionList(empty,bind->ID,bind->Name,0,0);
     commandfunctions = MergeFunctMolProperties(empty);
     commandfunctions = MergeFunctChemDbase(commandfunctions);
     commandfunctions = MergeFunctMolecules(commandfunctions);
     commandfunctions = MergeFunctReactions(commandfunctions);
     commandfunctions = MergeFunctDBMolecule(commandfunctions);
     commandfunctions = MergeFunctDBBensonTables(commandfunctions);
     commandfunctions = MergeFunctDBReaction(commandfunctions);
     commandfunctions = MergeFunctDBRSubMechanism(commandfunctions);
     commandfunctions = MergeFunctMoleculeSpectrum(commandfunctions);
     commandfunctions = MergeFunctMoleculesGenerate(commandfunctions);

     if(argc == 5)
       {
	 InitializeStaticAtomInfo(argv[4]);
	 
	 source = SetUpStandardSource(bind->Name,bind->ID);
	 
	 StartStandardCommands(argc,argv,
			       "chemdb",
			       argv[3],
			       commandfunctions,
			       source,
			       bind);
       }
     else
       {
	 printf("Not enough arguments: expecting (additionally to the normal input)\n");
	 printf("         The directory of the commands\n");
	 printf("         The static atom information\n");
       }
     
     return(0);
     }

