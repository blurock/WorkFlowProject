#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "matrix0.h"
#include "cluster.h"

#include "statistics.h"
#include <math.h>

static void ConvertClusterInfoToDivisions(UniVariateCluster *cluster,
					  SysSamVectorData *stats);
static void SetBoundariesInStats(FLOAT *boundary, INT num, 
				 SimpleVarDivisions *divisions);
static FLOAT BaseTypeToFloat(BaseType *base);
static void ComputeUniVariate(UniVariateCluster *cluster,
			      SysSamVector *syssam,
			      DataSubSet *subset,
			      ClusterConstants *constants,
			      SystemVariableList *singlevar,
			      SysSamVectorSet *syssamset);

static CHAR *IntervalDivisions(SysSamVectorData *varstat, 
			       INT numclusters);
static FLOAT GetNthBaseVectorAsFloat(INT n,BaseVector *vector);

extern UniVariateClusterSet *InitializeClusterSet(DatMatMaster *datmat,
						  StatisticsMaster *statmaster,
						  INT numclusters)
     {
     SysSamVectorSet *syssamset;
     UniVariateClusterSet *varset;
     UniVariateCluster *varinfo;
     SysSamVector *selected;
     SysSamVectorData *stats;
     INT i;
     CHAR *vardivs,*divisions;
     
     syssamset = datmat->SysSamVectorSetElement;

     varset = AllocateUniVariateClusterSet;
     CreateUniVariateClusterSet(varset,syssamset->ID, syssamset->Name,
				syssamset->NumSystemSamples,0);

     varinfo =  varset->VarClusters;
     selected = syssamset->Sets;
     stats = statmaster->Simple->Stats;
     LOOPi(syssamset->NumSystemSamples)
	  {
	  vardivs = GetSpecificVariableInformation(selected->Name,selected->ID,
						   "Divisions",datmat);

	  if(vardivs == 0)
	       divisions = IntervalDivisions(stats,numclusters);
	  else
	       {
	       divisions = CopyString(vardivs);
	       EliminateBlanks(divisions);
	       }
	  
	  ConvertStringToDivisions(divisions,selected,datmat,varinfo);
	  Free(divisions);
	  
	  stats++;
	  varinfo++;
	  selected++;
	  }
     return(varset);
     }

static CHAR *IntervalDivisions(SysSamVectorData *varstat, 
			       INT numclusters)
     {
     INT *count,i,runningcount,length,numelements,intervalsize;
     CHAR *string,*total,*start;
     FLOAT value;
     
     count = varstat->Counts;
     numelements = 0;
     LOOPi(varstat->NumberDistinctValues)
	  {
	  numelements += *count;
	  count++;
	  }

     if(varstat->NumberDistinctValues < numclusters*1.2)
	  intervalsize = 0;
     else
	  {
	  intervalsize = numelements/numclusters;
	  }
     total = start = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);
     length = LINELENGTH;
     *string = BLANK;
     
     count = varstat->Counts;
     runningcount = 0;
     LOOPi(varstat->NumberDistinctValues)
	  {
	  runningcount += *count;
	  if(runningcount >= intervalsize)
	       {
	       runningcount -= intervalsize;
	       value = GetNthBaseVectorAsFloat(i,varstat->DistinctValues);
	       if(*string == BLANK)
		    sprintf(string,"%f",value);
	       else
		    sprintf(string,",%f",value);
	       total = PrintStringString(total,&length,string);
	       }
	  count++;
	  }
     printf("%s Divisions(%s);Predicates(>=);\n",varstat->Name,start);
     
     return(start);
     }

static FLOAT GetNthBaseVectorAsFloat(INT n,BaseVector *vector)
     {
     FLOAT ret;
     
     switch(vector->Type)
          {
          case INTEGERVAR:
               ret = (FLOAT) *(vector->Integer->Vector + n);
               break;
          case FLOATVAR:
               ret = *(vector->Float->Vector + n);
               break;
          }
     return(ret);
}
     

extern INT CalculateUniVariateCluster(DatMatMaster *datmat,
				      StatisticsMaster *statmaster)
				       
     {
     ClusterConstants *constants;
     UniVariateClusterSet *varset;
     UniVariateCluster *varinfo;
     SystemVariableList *singlevar;
     SysSamVectorSet *syssamset;
     SysSamVectorData *stats;
     SysSamVector *selected;
     VarNames *var;
     DataSubSet *subset,*missing,*nomissing;
     INT i;
     
     syssamset = datmat->SysSamVectorSetElement;
     subset = datmat->DataSubSetElement;
     varset = statmaster->UniClusters;
     constants = statmaster->Constants->Cluster;
     
     varinfo =  varset->VarClusters;
     stats = statmaster->Simple->Stats;
     selected = syssamset->Sets;
     LOOPi(syssamset->NumSystemSamples)
	  {
	  if(FindVariableInSystemVariablePair(varinfo->Name,0,
					      datmat->SystemVariablePairElement) != 0)
	       {
	       singlevar = AllocateSystemVariableList;
	       CreateSystemVariableList(singlevar,syssamset->ID,syssamset->Name,
					1,0);
	       singlevar->Variables = AllocateVarNames;
	       CreateVarNames(singlevar->Variables,selected->ID,selected->Name,
			      0,selected->ID,0);
	       
	       missing = FindMissingPoints(subset,selected);
	       nomissing = BuildComplementSet(subset,missing,selected->Name);
	       
	       if(varinfo->NumberOfClusters == 0)
		    {
		    ComputeUniVariate(varinfo,
				      selected,
				      nomissing,
				      constants,
				      singlevar,
				      syssamset);
		    }
	       
	       ConvertClusterInfoToDivisions(varinfo,stats);
	       
	       FreeSystemVariableList(singlevar);
	       Free(singlevar);
	       
	       /*	  FreeVarNames(singlevar->Variables);*/
	       FreeDataSubSet(missing);
	       Free(missing);
	       FreeDataSubSet(nomissing);
	       Free(nomissing);
	       }
	  stats++;
	  varinfo++;
	  var++;
	  selected++;
	  }
     
     return(SYSTEM_NORMAL_RETURN);
     }

static void EliminateEmptyClusters(UniVariateCluster *cluster)
     {
     DataSubSet *new,*subset;
     INT count,i;
     
     subset = new = cluster->Sets->Vector;
     count = 0;
     LOOPi(cluster->NumberOfClusters)
	  {
	  if(subset->NumberOfPoints > 0)
	       {
	       if(count != i)
		    CopyFullDataSubSet(new,subset);
	       count++;
	       new++;
	       }
	  else
	       FreeDataSubSet(subset);
	  
	  subset++;
	  }
     cluster->NumberOfClusters = count;
     }

static void ComputeUniVariate(UniVariateCluster *cluster,
			      SysSamVector *syssam,
			      DataSubSet *subset,
			      ClusterConstants *constants,
			      SystemVariableList *singlevar,
			      SysSamVectorSet *syssamset)
     {
     ClusterCenters *centers;
     SysSamVectorData *stat;
     INT i;
     FLOAT tiny,optimized,tinyexp,optexp;

     tinyexp = (FLOAT) constants->Tiny;
     optexp = (FLOAT) constants->Optimized;
     tinyexp = -tinyexp;
     optexp = -optexp;
     
     tiny = .00000001;
     optimized = .0000001;
     
     centers = ComputeCluster(singlevar->ID,singlevar->Name,
			      constants->NumClusters,
			      constants->MaxCycles,
			      singlevar,syssamset,
			      subset,
			      tiny,optimized);
     CreateUniVariateCluster(cluster,singlevar->ID, singlevar->Name,
			     centers->NumberOfClusters,centers->Sets,0);

     EliminateEmptyClusters(cluster);
     
     stat = cluster->Statistics;
     subset = cluster->Sets->Vector;
     LOOPi(cluster->NumberOfClusters)
	  {
	  CalcSysSamVectorData(stat,subset,syssam);
	  stat++;
	  subset++;
	  }
     }

	  
static INT FloatComp(const void *f1, const void *f2)
     {
     INT out;
     const FLOAT *fp1 = (const FLOAT *)f1;
     const FLOAT *fp2 = (const FLOAT *)f2;
     
     if( (*fp1) > (*fp2) )
	  out = 1;
     else if(*fp1 < *fp2)
	  out = -1;
     else
	  out = 0;
     return(out);
     }

static void ConvertClusterInfoToDivisions(UniVariateCluster *cluster,
					  SysSamVectorData *stats)
     {
     INT num,i,count;
     FLOAT *boundary,*boundaries,*current,*next;
     SysSamVectorData *stat;
     
     num = cluster->NumberOfClusters;
     if(num > 1)
	  num--;
     
     boundaries = boundary = AllocArrayFLOAT(num);
     
     stat = cluster->Statistics;
     LOOPi(num)
	  {
/*	  *boundary++ = BaseTypeToFloat(stat->Lowest);*/
	  *boundary++ = BaseTypeToFloat(stat->Highest);
	  stat++;
	  }
     
     qsort(boundaries,num,FLOATSize,FloatComp);
     
     current = boundaries;
     next = current+1;
     count = 0;
     LOOPi(num)
	  {
	  if(*next != *current)
	       {
	       current++;
	       *current = *next;
	       count++;
	       }
	  next++;
	  }

     SetBoundariesInStats(boundaries,count,stats->Divisions);

     }

static FLOAT BaseTypeToFloat(BaseType *base)
     {
     FLOAT flt;
     
     if(base->Type == FLOATVAR)
	  flt = base->Float;
     else
	  flt = (FLOAT) base->Integer;
     return(flt);
     }


static void SetBoundariesInStats(FLOAT *boundary, INT num, 
				 SimpleVarDivisions *divisions)
     {
     StatDivisionChoice *div;
     INT i;
     
     div = divisions->DivInfo;
     LOOPi(divisions->NumberOfDivisions)
	  {
	  if(*boundary == div->Division)
	       {
	       div->BoundarySet = 1;
	       boundary++;
	       }
	  else
	       div->BoundarySet = 0;
	  div++;
	  }
     }


extern void SetUpSimpleDivisions(SysSamVectorData *varstat)
     {
     FLOAT value,*fltvalue;
     INT type,i,*intvalue,clength,length;
     SimpleVarDivisions *divisions;
     BaseVector *basevector;
     StatDivisionChoice *info;
     
     if(varstat->Divisions == 0)
	  {
	  basevector = varstat->DistinctValues;
	  type = basevector->Type;
	  if(type == FLOATVAR)
	       {
	       clength = basevector->Float->VectorLength;
	       fltvalue = basevector->Float->Vector;
	       }
	  else
	       {
	       clength = basevector->Integer->VectorLength;
	       intvalue = basevector->Integer->Vector;	  
	       }  
	  
	  length = clength;
	  varstat->Divisions = divisions = AllocateSimpleVarDivisions;
	  CreateSimpleVarDivisions(divisions,varstat->ID,varstat->Name,
				   length,
				   0);
	  info = divisions->DivInfo;
	  LOOPi(length)
	       {
	       if(type == FLOATVAR)
		    {
		    value = *fltvalue;
		    fltvalue++;
		    }
	       else
		    {
		    value = (FLOAT) *intvalue;
		    intvalue++;
		    }
	       CreateStatDivisionChoice(info,varstat->ID,0,1,value);
	       info++;
	       }
	  }
     }
