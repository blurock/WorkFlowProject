#include "basic.h"
#include "comlib.h"
#include "datmat1.h"
#include "matrix0.h"
#include "cluster.h"

#include "statistics.h"
#include <math.h>

static DataSubSet *FindLessThanSubSet(SysSamVector *syssam,
				      FLOAT upper,
				      DataSubSet *set);

extern void ConvertStringToDivisions(CHAR *vardivs,
				     SysSamVector *syssam,
				     DatMatMaster *datmat,
				     UniVariateCluster *varinfo)
     {
     CHAR *string,*rest,*divisions;
     INT count,i,cnt;
     DataSubSet *subset, *previous, *lessthan, *missing, *nomissing, *range;
     SysSamVectorData *data;
     FLOAT div;
     
     missing = FindMissingPoints(datmat->DataSubSetElement,syssam);
     nomissing = BuildComplementSet(datmat->DataSubSetElement,missing,syssam->Name);
	  
     string = AllocateString(LINELENGTH);
     if(*(vardivs+9) == '(' && *(vardivs + strlen(vardivs) - 1) == ')')
	  {
	  divisions = CopyString(vardivs+10);
	  *(divisions + strlen(divisions) - 1) = ENDOFSTRING;
	  
	  rest = divisions;
	  count = 0;
	  while(strlen(rest) != 0)
	       {
	       rest = IsolateNextWord(rest,string,COMMA,LINELENGTH);
	       count++;
	       }

	  CreateUniVariateCluster(varinfo,syssam->ID,syssam->Name,
				  count,0,0);
	  
	  varinfo->Sets = AllocateDataSubSetVector;
	  CreateDataSubSetVector(varinfo->Sets,syssam->ID,syssam->Name,
				 count,0);

	  subset = varinfo->Sets->Vector;
	  data = varinfo->Statistics;
	  rest = divisions;
	  previous = 0;
	  cnt = 0;
	  LOOPi(count)
	       {
	       rest = IsolateNextWord(rest,string,COMMA,LINELENGTH);
	       div = atof(string);
	       lessthan = FindLessThanSubSet(syssam,div,nomissing);
	       
	       if(previous == 0)
		    {
		    if(lessthan->NumberOfPoints != 0)
			 {
			 CopyFullDataSubSet(subset,lessthan);
			 CalcSysSamVectorData(data,subset,syssam);
			 data++;
			 cnt++;
			 }
		    }
	       else
		    {
		    range = BuildComplementSet(lessthan,previous,0);
		    if(range->NumberOfPoints != 0)
			 {
			 CopyFullDataSubSet(subset,range);
			 CalcSysSamVectorData(data,subset,syssam);
			 data++;
			 cnt++;
			 }
		    FreeDataSubSet(previous);
		    Free(previous);
		    FreeDataSubSet(range);
		    Free(range);
		    }
	       
	       previous = lessthan;
	       
	       subset++;
	       }
	  varinfo->NumberOfClusters = cnt;
	  }
     else
	  CreateUniVariateCluster(varinfo,syssam->ID,syssam->Name,
				  0,0,0);
     }

extern void ConvertStatsToDivisions(SysSamVector *syssam,
				    DatMatMaster *datmat,
				    UniVariateCluster *varinfo)
     {
     CHAR *string,*rest,*divisions;
     INT count,i,cnt;
     DataSubSet *subset, *previous, *lessthan, *missing, *nomissing, *range;
     SysSamVectorData *data, *full;
     FLOAT div;
     
     missing = FindMissingPoints(datmat->DataSubSetElement,syssam);
     nomissing = BuildComplementSet(datmat->DataSubSetElement,missing,syssam->Name);
	  
     count = data->NumberDistinctValues;
     CreateUniVariateCluster(varinfo,syssam->ID,syssam->Name,
			     count,0,0);
     
     varinfo->Sets = AllocateDataSubSetVector;
     CreateDataSubSetVector(varinfo->Sets,syssam->ID,syssam->Name,
			    count,0);

     subset = varinfo->Sets->Vector;
     data = varinfo->Statistics;     
     previous = 0;
     cnt = 0;
     LOOPi(count)
	  {
	  div = data->Highest->Float;
	  lessthan = FindLessThanSubSet(syssam,div,nomissing);
	  
	  if(previous == 0)
	       {
	       if(lessthan->NumberOfPoints != 0)
		    {
		    CopyFullDataSubSet(subset,lessthan);
		    CalcSysSamVectorData(data,subset,syssam);
		    data++;
		    cnt++;
		    }
	       }
	  else
	       {
	       range = BuildComplementSet(lessthan,previous,0);
	       if(range->NumberOfPoints != 0)
		    {
		    CopyFullDataSubSet(subset,range);
		    CalcSysSamVectorData(data,subset,syssam);
		    data++;
		    cnt++;
		    }
	       FreeDataSubSet(previous);
	       Free(previous);
	       FreeDataSubSet(range);
	       Free(range);
	       }
	       
	  previous = lessthan;
	  
	  subset++;
	  }
     }
/* ConvertFloatDivision
   This is a help routine to create a subset of points given the division:

     1. Find the set of points that are less than the floating div (lessthan)
     2. Is there a previous subset 
            yes -- Subtract this from lessthan and put in range
            no  -- Make range the lessthan set
     3. Create the SysSamVectorData from range
    
static DataSubSet *ConvertFloatDivision(SysSamVectorData *data,
				 DataSubSet *subset,
				 FLOAT div,
				 SysSamVector *syssam,
				 DataSubSet *nomissing,
				 DataSubSet *previous)
*/			 
static DataSubSet *FindLessThanSubSet(SysSamVector *syssam,
				      FLOAT upper,
				      DataSubSet *set)
     {
     DataSubSet *subset;
     INT i,*point,*subpoint;
     FLOAT val;
     
     subset = AllocateDataSubSet;
     CreateDataSubSet(subset,syssam->ID,syssam->Name,
		      set->NumberOfPoints,set->NumberOfPoints,
		      0);
     subset->NumberOfPoints = 0;
     
     point  = set->Points;
     subpoint  = subset->Points;
     LOOPi(set->NumberOfPoints)
	  {
	  val = NthSysSamVectorAsFloat(syssam,*point);
	  if(val <= upper)
	       {
	       subset->NumberOfPoints += 1;
	       *subpoint = *point;
	       subpoint++;
	       }
	  point++;
	  }
     return(subset);
     }
