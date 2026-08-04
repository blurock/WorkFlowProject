#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "cluster.h"
#include "math.h"

extern ClusterMaster *InitializeClusterCenterMaster(INT id, CHAR *name)
     {
     ClusterMaster *clustermaster;
     
     clustermaster = AllocateClusterMaster;
     CreateClusterMaster(clustermaster,id,name,
			 0,0,0);
     return(clustermaster);
     }

extern INT ClusterPrerequisites(BindStructure *bind)
     {
     INT out;
     DatMatMaster *datmat;
     
     out = GetStructDatMat(bind);
     return(out);
     }

extern INT ClusterParameters(BindStructure *bind)
     {
     ClusterMaster *center;
     CommandMaster *commandmaster;
     ClusterConstants *constants;
     
     center = GetBoundStructure(bind,BIND_CLUSTERMASTER);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     
     if(center->Constants == 0)
	  {
	  center->Constants = constants = AllocateClusterConstants;
	  CreateClusterConstants(constants,center->ID,center->Name,
				 0,0,0.0,0,0);
	  }
     else
	  {
	  constants = center->Constants;
	  Free(constants->Name);
	  constants->ID = center->ID;
	  constants->Name = CopyNAME(center->Name);
	  }
     
     constants->NumClusters = GetCurrentIntegerArgument("NumClusters",
							commandmaster);
     constants->MaxCycles = GetCurrentIntegerArgument("MaxCycles",
						      commandmaster);
     constants->Optimized = GetCurrentIntegerArgument("Optimized",
						    commandmaster);
     constants->Debug = GetCurrentIntegerArgument("Debug",
						      commandmaster);
     constants->Tiny = GetCurrentIntegerArgument("Tiny",
						      commandmaster);
     return(NORMAL_RETURN);
     }

extern INT GetClusterCenters(BindStructure *bind)
     {
     ClusterMaster *clustermaster;
     DatMatMaster *datmat;
     INT out;
     
     clustermaster = GetBoundStructure(bind,BIND_CLUSTERMASTER);
     datmat = GetBoundStructure(bind,BIND_DATMATMASTER);
     
     ClusterPrerequisites(bind);
     ClusterParameters(bind);
     
     if(clustermaster->Centers == 0)
	  out = FormCluster(clustermaster,datmat);
     else
	  out = SYSTEM_NORMAL_RETURN;
     
     return(out);
     }

extern INT FormCluster(ClusterMaster *master,
		       DatMatMaster *datmatmaster)
      {
     ClusterCenters *center;
     ClusterConstants *constants;
     INT numclusters,debug;
     CHAR *name;
     INT id,MaximumCycles,tiny,optimized;
     SystemVariableList *sysvarlst;
     SysSamVectorSet *syssamset;
     DataSubSet *fullset;
     FLOAT foptimized,ftiny;
     
     id     = datmatmaster->ID;
     name   = datmatmaster->Name;
     constants = master->Constants;
     numclusters   = constants->NumClusters;
     MaximumCycles = constants->MaxCycles;
     debug         = constants->Debug;
     tiny          = constants->Tiny;
     optimized     = constants->Optimized;

     syssamset = datmatmaster->SysSamVectorSetElement;
     fullset   = datmatmaster->DataSubSetElement;
     sysvarlst = datmatmaster->SystemVariablePairElement->Descriptors;
     
     if(numclusters >= fullset->NumberOfPoints)
          {
          Error(-1,"Illegal number of Clusters");
          return(SYSTEM_ERROR_RETURN);
          }
     ftiny      = pow(10.0 , -((double) tiny));
     foptimized = pow(10.0 , -((double) optimized));
     
     center = ComputeCluster(id,name,numclusters,MaximumCycles,
			     sysvarlst,syssamset,fullset,
			     ftiny, foptimized);
     
     if(master->Centers != 0)
	  {
          FreeClusterCenters(master->Centers);
	  Free(master->Centers);
	  }
     master->Centers = center;
     
     if(debug) PrintClusterCenters(master->Centers);

     return(SYSTEM_NORMAL_RETURN);
     }

extern CHAR *PrintStringClusterSet(CHAR *string, 
				   CHAR *prefix,
				   INT *length,
				   ClusterMaster *centers,
				   SysSamVectorSet *syssam)
     {
     DataSubSetVector *sets;
     DataSubSet *subset;
     INT i;
     CHAR *temp;
     
     temp = AllocateString(LINELENGTH);
     sets = centers->Centers->Sets;

     subset = sets->Vector;
     LOOPi(sets->NumberOfVectors)
	  {
	  sprintf(temp,"%s--------------- Cluster #%d ---------------\n",
		  prefix,i);
	  string = PrintStringString(string,length,temp);
	  
	  string = PrintStringDataSetWithNames(string,prefix,length,syssam,subset);
	  subset++;
	  }
     Free(temp);
     return(string);
     }
     
	  
extern CHAR *PrintStringDataSetWithNames(CHAR *string,
					 CHAR *prefix,
					 INT *length,
					 SysSamVectorSet *syssam,
					 DataSubSet *subset)
     {
     CHAR *temp;
     INT i,columns,*point;
     SysSamNameSet *names;
     SysSamName *name;
     
     temp = AllocateString(LINELENGTH);

     names = syssam->NameSet;
     if(names != 0)
	  columns = 3;
     else
	  columns = 5;
     
     point = subset->Points;
     LOOPi(subset->NumberOfPoints)
	  {
	  if(names != 0)
	       {
	       name = names->Names + *point;
	       sprintf(temp,"%20s",name->Name);
	       }
	  else 
	       sprintf(temp,"%5d",*point);
	       
	  if( !(i % columns) )
	       {
	       string = PrintStringString(string,length,"\n");
	       string = PrintStringString(string,length,prefix);
	       }
	  string = PrintStringString(string,length,temp);
	  point++;
	  }
     string = PrintStringString(string,length,"\n");
     Free(temp);
     return(string);
     }



