#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "matrix0.h"
#include "cluster.h"

#include "statistics.h"
#include <math.h>
extern BaseType *FloatToBaseType(FLOAT value, INT type);

static void DetermineDistinctValues(SysSamVectorData *stat,
				    DataSubSet *subset,
				    SysSamVector *syssam);
static INT FloatComp(FLOAT *f1, FLOAT *f2);
static INT IntegerComp(INT *i1, INT *i2);
static void CondenseFloatVector(BaseVector *vector,
				SysSamVectorData *stat);
static void CondenseIntegerVector(BaseVector *vector,
				  SysSamVectorData *stat);


extern SetOfSysSamData *SetOfComputeDataStatistics(DataSubSet *subset,
						   SysSamVectorSet *syssamset)
     {
     SetOfSysSamData *statset;
     SysSamVectorData *stat;
     SysSamVector *syssam;
     INT i;
     
     statset = AllocateSetOfSysSamData;
     CreateSetOfSysSamData(statset, syssamset->ID, syssamset->Name,
			   syssamset->NumSystemSamples,
			   0);
     
     stat = statset->Stats;
     syssam = syssamset->Sets;
     LOOPi(statset->NumberOfVariables)
	  {
	  CalcSysSamVectorData(stat,subset,syssam);
	  stat->ID = i;
	  DetermineDistinctValues(stat,subset,syssam);
	  SetUpSimpleDivisions(stat);

	  syssam++;
	  stat++;
	  }
     return(statset);
     }

extern void CalcSysSamVectorData(SysSamVectorData *stat,
				 DataSubSet *subset,
				 SysSamVector *syssam)
     {
     FLOAT highest, lowest,value,count,sum,average;
     INT i, *point;
     
     highest = -(FLT_MAX);
     lowest = FLT_MAX;
     
     CreateSysSamVectorData(stat,syssam->ID,syssam->Name,
			    0,0,0,0,0,0,0);
     sum = 0.0;
     count = 0.0;
     point = subset->Points;
     LOOPi(subset->NumberOfPoints)
	  {
	  if(MissingValueNth(*point,syssam) == 0)
	       {
	       value = NthSysSamVectorAsFloat(syssam,*point);
	       
	       if(value > highest)
		    highest = value;
	       if(value < lowest)
		    lowest = value;
	       sum += value;
	       count += 1.0;
	       }
	  point++;
	  }
     average = sum / count;
     
     stat->Highest = FloatToBaseType(highest,syssam->Data->Type);
     stat->Lowest  = FloatToBaseType(lowest,syssam->Data->Type);
     stat->Average = FloatToBaseType(average,syssam->Data->Type);

     }


static INT FloatComp(FLOAT *f1, FLOAT *f2)
     {
     INT out;
     
     if( (*f1) > (*f2) )
	  out = 1;
     else if(*f1 < *f2)
	  out = -1;
     else
	  out = 0;
     return(out);
     }

static INT IntegerComp(INT *i1, INT *i2)
     {
     return( *i1 - *i2);
     }

static void RemoveMissingFromBaseVector(BaseVector *vector,
					BaseType *missing)
     {
     INT i,count,*ival,*inew;
     FLOAT *flt,*fnew;
     BaseFltVector *fltvec;
     BaseIntVector *intvec;
     
     if(vector->Type == FLOATVAR)
	  {
	  fltvec = vector->Float;
	  count = 0;
	  flt = fnew = fltvec->Vector;
	  LOOPi(fltvec->VectorLength)
	       {
	       if(*flt != missing->Float)
		    {
		    *fnew = *flt;
		    count++;
		    fnew++;
		    }
	       flt++;
	       }
	  fltvec->VectorLength = count;
	  }
     else
	  {
	  intvec = vector->Integer;
	  count = 0;
	  ival = inew = intvec->Vector;
	  LOOPi(intvec->VectorLength)
	       {
	       if(*ival != missing->Integer)
		    {
		    *inew = *ival;
		    count++;
		    inew++;
		    }
	       ival++;
	       }
	  intvec->VectorLength = count;
	  }
     }

static void DetermineDistinctValues(SysSamVectorData *stat,
				    DataSubSet *subset,
				    SysSamVector *syssam)
     {
     INT type;
     BaseVector *vector;
     int (*compfunc)();
     
     type = syssam->Data->Type;
     vector = SetUpBaseVector(stat->ID, stat->Name,
			      type,
			      syssam,
			      subset);
     
     RemoveMissingFromBaseVector(vector,syssam->Missing);
     if(type == FLOATVAR)
	  {
	  compfunc = (int (*)()) FloatComp; 
	  qsort(vector->Float->Vector, vector->Float->VectorLength,
		FLOATSize,compfunc);
	  CondenseFloatVector(vector,stat);
	  }
     else
	  {
	  compfunc = (int (*)()) IntegerComp; 
	  qsort(vector->Integer->Vector, vector->Integer->VectorLength,
		INTSize, compfunc);
	  CondenseIntegerVector(vector,stat);
	  }
     FreeBaseVector(vector);
     Free(vector);
     }


static void CondenseFloatVector(BaseVector *vector,
				SysSamVectorData *stat)
     {
     FLOAT *floats,*current;
     INT *counts,numdistinct,i,num,*countstart;
     BaseVector *newvector;
     
     floats = vector->Float->Vector;
     num = vector->Float->VectorLength;
     counts = countstart = stat->Counts = AllocArrayINT(num);
     
     current = floats;
     *counts = 0;
     numdistinct = 1;
     
     LOOPi(num)
	  {
	  if(*floats == *current)
	       *counts += 1;
	  else
	       {
	       counts++;
	       *counts = 1;
	       floats++;
	       *floats = *current;
	       numdistinct++;
	       }
	  current++;
	  }
     
     stat->NumberDistinctValues = numdistinct;
     
     stat->DistinctValues = newvector = AllocateBaseVector;
     CreateBaseVector(stat->DistinctValues, stat->ID, stat->Name,
		      FLOATVAR,0,0);
     newvector->Float = AllocateBaseFltVector;
     CreateBaseFltVector(newvector->Float, stat->ID,stat->Name,
			 numdistinct,vector->Float->Vector);
     }

static void CondenseIntegerVector(BaseVector *vector,
				SysSamVectorData *stat)
     {
     INT *ints,*current,*counts,numdistinct,i,num,*countstart;
     BaseVector *newvector;
     
     ints = vector->Integer->Vector;
     num = vector->Integer->VectorLength;
     counts = countstart = stat->Counts = AllocArrayINT(num);
     
     current = ints;
     *counts = 0;
     numdistinct = 1;
     
     LOOPi(num)
	  {
	  if(*ints == *current)
	       *counts += 1;
	  else
	       {
	       counts++;
	       *counts = 1;
	       ints++;
	       *ints = *current;
	       numdistinct++;
	       }
	  current++;
	  }
     
     stat->NumberDistinctValues = numdistinct;
     
     stat->DistinctValues = newvector = AllocateBaseVector;
     CreateBaseVector(stat->DistinctValues, stat->ID, stat->Name,
		      INTEGERVAR,0,0);
     newvector->Integer = AllocateBaseIntVector;
     CreateBaseIntVector(newvector->Integer, stat->ID,stat->Name,
			 numdistinct,vector->Integer->Vector);

/*
     new = newvector->Integer->Vector;
     old = vector->Integer->Vector;
     LOOPi(numdistinct)
	  *new++ = *old++;   
*/	  
     }


extern SysSamStats *ComputeSysSamStats(SysSamVectorData *stat,
				       DataSubSet *subset,
				       SysSamVector *syssam)
     {
     FLOAT value,sumsquared,sum,count,average,stddev2,stddev;
     INT i,*point;
     SysSamStats *syssamstats;
     
     sumsquared = 0.0;
     sum = 0.0;
     count = 0.0;
     
     point = subset->Points;
     LOOPi(subset->NumberOfPoints)
	  {
	  if(MissingValueNth(*point,syssam) == 0)
	       {
	       value = NthSysSamVectorAsFloat(syssam,*point);
	       
	       sum += value;
	       sumsquared += value*value;
	       count += 1.0;
	       
	       }
	  point++;
	  }
     
     average = sum / count;
     stddev2 = (count*sumsquared - sum*sum)/(count * (count - 1));
     stddev  = sqrt(stddev2);
     
     syssamstats = AllocateSysSamStats;
     CreateSysSamStats(syssamstats,stat->ID,stat->Name,
		       average,stddev);
     return(syssamstats);
     }

extern CHAR *PrintStringSimpleStatistics(CHAR *string, CHAR *prefix, INT *length,
					 SetOfSysSamData *set,int full)
     {
     SysSamVectorData *varstat;
     INT i;
     
     varstat = set->Stats;
     LOOPi(set->NumberOfVariables)
	  {
	  string = PrintStringSysSamVectorDataBasic(string,prefix,length,varstat);
          if(full)
               {
	       string = PrintStringSysSamVectorDataValues(string,prefix,length,varstat);
               }
	  varstat++;
	  }
     return(string);
     }
extern CHAR *PrintStringSysSamVectorDataBasic(CHAR *string, CHAR *prefix, INT *length,
					 SysSamVectorData *varstat)
     {
     CHAR *temp,*ave,*hi,*low,*values;
     FLOAT *fltvalue;
     INT i,*counts,type,*intvalue,clength;
     BaseVector *basevector;
     
     
     temp = AllocateString(LINELENGTH);
     
     sprintf(temp,"%s:(%d) %s\n",prefix,varstat->ID,varstat->Name);
     string = PrintStringString(string,length,temp);
     
     ave = AllocateString(LINELENGTH);
     hi  = AllocateString(LINELENGTH);
     low = AllocateString(LINELENGTH);
     
     ConvertBaseTypeToString(varstat->Average->Type, varstat->Average, ave);
     ConvertBaseTypeToString(varstat->Highest->Type,varstat->Highest,hi);
     ConvertBaseTypeToString(varstat->Lowest->Type,varstat->Lowest,low);
     
     sprintf(temp,"%s: High:%s Low:%s Ave:%s\n",
	     prefix,hi,low,ave);
     string = PrintStringString(string,length,temp);

     Free(hi);
     Free(low);
     Free(ave);
     Free(temp);

     return(string);
     }
extern CHAR *PrintStringSysSamVectorDataValues(CHAR *string, CHAR *prefix, INT *length,
                                               SysSamVectorData *varstat)
     {     
     CHAR *temp,*ave,*hi,*low,*values;
     FLOAT *fltvalue;
     INT i,*counts,type,*intvalue,clength;
     BaseVector *basevector;

     temp = AllocateString(LINELENGTH);

     sprintf(temp,"%s: Distinct Values",prefix);     
     string = PrintStringString(string,length,"Distinct Values\n");
     
     values = AllocateString(LINELENGTH);
     sprintf(temp,"%s:       ",prefix);
     
     counts = varstat->Counts;
     basevector = varstat->DistinctValues;
     type = basevector->Type;
     fltvalue = 0;
     intvalue = 0;
     
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
	  
     LOOPi(clength)
	  {
	  if(!( i % 3))
	       {
	       string = PrintStringString(string,length,"\n");
	       string = PrintStringString(string,length,temp);
	       }
	  if(type == FLOATVAR)
	       {
	       sprintf(values,"%10f (%5d) ",*fltvalue,*counts);
	       string = PrintStringString(string,length,values);
	       fltvalue++;
	       }
	  else
	       {
	       sprintf(values,"%10d (%5d) ",*intvalue,*counts);
	       string = PrintStringString(string,length,values);
	       intvalue++;
	       }
	  counts++;
	  }
     string = PrintStringString(string,length,"\n");
     return(string);
     }

