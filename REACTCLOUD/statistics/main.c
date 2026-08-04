#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "matrix0.h"
#include "cluster.h"
#include "statistics.h"

INT DEBUGPRINT;
CommandInfo *Current_Command;
INT CommandDebug;
FILE *yyin;

int main(int argc, char *argv[])
     {
     CommandSource *source;
     BindStructure *bind;
     FunctionList *commandfunctions,*Xcommandfunctions,*empty;
     DatMatMaster *datmat;
     StatisticsMaster *top;
     CHAR *commandinputfile;
     
     bind = StandardCommandBegin(argc,argv,
			  "Statistics Analysis",0,
			  2);
			  
     CommandDebug = 0;
     DEBUGPRINT = 0;
     
     datmat = InitializeDatMatMaster(bind->ID,bind->Name);
     top = InitializeStatisticsMaster(bind->ID,bind->Name);

     BindStructureIntoMaster(datmat,BIND_DATMATMASTER,bind);
     BindStructureIntoMaster(top,BIND_STATISTICSMASTER,bind);
     
     empty = AllocateFunctionList;
     CreateFunctionList(empty,bind->ID,bind->Name,0,0);
     commandfunctions = MergeFunctDatMat(empty);
     commandfunctions = MergeFunctStatistics(commandfunctions);

     source = SetUpStandardSource(bind->Name,bind->ID);
     
     StartStandardCommands(argc,argv,
			    "statistics",COMDIR,
			    commandfunctions,
			    source,bind);
     
     return(0);
     }

