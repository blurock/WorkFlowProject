#include "basic.h"
#include "comlib.h"
#include "datmat1.h"

INT DEBUGPRINT;
CommandInfo *Current_Command;
INT CommandDebug;
FILE *yyin;

int main(int argc, char *argv[])
     {
     CommandSource *source;
     BindStructure *bind;
     FunctionList *Xcommandfunctions,*commandfunctions,*empty;
     DatMatMaster *datmat;
     CHAR *commandinputfile;
     
     bind = StandardCommandBegin(argc,argv,
			  "DatMat Matrix",0,
			  2);
			  
     CommandDebug = 0;
     DEBUGPRINT = 0;
     
     datmat = InitializeDatMatMaster(bind->ID,bind->Name);

     BindStructureIntoMaster(datmat,BIND_DATMATMASTER,bind);
     
     empty = AllocateFunctionList;
     CreateFunctionList(empty,bind->ID,bind->Name,0,0);
     commandfunctions = MergeFunctDatMat(empty);
     
     source = SetUpStandardSource(bind->Name,bind->ID);
     
     StartStandardCommands(argc,argv,
			    "datmat",COMDIR,
			    commandfunctions,source,bind);
     
     return(0);
     }
