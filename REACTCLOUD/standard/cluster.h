#include "cluster/clstr.h"

#define BIND_CLUSTERMASTER 800

/************************************************************************/
/**** cluster1.c */
/************************************************************************/

extern ClusterMaster *InitializeClusterCenterMaster(INT id, CHAR *name);
extern INT ClusterParameters(BindStructure *bind);
extern INT GetClusterCenters(BindStructure *bind);
extern INT FormCluster(ClusterMaster *master,
		       DatMatMaster *datmatmaster);

extern INT ClusterPrerequisites(BindStructure *bind);
extern INT ClusterPrint(BindStructure *bind);
extern CHAR *PrintStringClusterSet(CHAR *string, 
				   CHAR *prefix,
				   INT *length,
				   ClusterMaster *centers,
				   SysSamVectorSet *set);
extern CHAR *PrintStringDataSetWithNames(CHAR *string,
					 CHAR *prefix,
					 INT *length,
					 SysSamVectorSet *syssam,
					 DataSubSet *subset);

/************************************************************************/
/**** cluster0.c */
/************************************************************************/
extern ClusterCenters *ComputeCluster(INT id, CHAR *name,
				      INT numclusters, INT MaximumCycles,
				      SystemVariableList *sysvarlst,
				      SysSamVectorSet *syssamset,
				      DataSubSet *fullset,
				      FLOAT tiny, FLOAT optimized);
