#include "basic.h"
#include "datmat0.h"

static DataSubSet *FormNoMissing(INT id, CHAR *name,
				 DataSubSet *data,
				 SysSamVectorSet *syssamset,
				 SystemVariableList *varlst);

extern INT MasterFreeDataSubSet(DatMatMaster *master)
     {
     if(master->DataSubSetElement != 0)
          {
          FreeDataSubSet(master->DataSubSetElement);
          Free(master->DataSubSetElement);
	  master->DataSubSetElement = 0;
          }
     if(master->DataSubSetStandard != 0)
          {
          FreeDataSubSet(master->DataSubSetStandard);
          Free(master->DataSubSetStandard);
	  master->DataSubSetStandard = 0;
          }
     return(DATMAT_NORMAL_RETURN);
     }

extern INT MasterFreeDataTestBlock(DatMatMaster *master)
     {
     if(master->DataTestBlockElement != 0)
          {
          FreeDataTestBlock(master->DataTestBlockElement);
          Free(master->DataTestBlockElement);
	  master->DataTestBlockElement = 0;
          }
     return(DATMAT_NORMAL_RETURN);
     }

extern INT MasterGetRawDataSubSet(DatMatMaster *master)
     {
     INT error,max;
     
     error = DATMAT_NORMAL_RETURN;
     if(master->DataSubSetElement == 0)
	  {
	  error = MasterGetSysSamVectorSet(master);
	  if(error != DATMAT_ERROR_RETURN)
	       {
	       max = SysSamNumberOfSamples(master->SysSamVectorSetElement);
	       master->DataSubSetElement = 
		    CreateCompleteDataSubSet(master->ID, master->Name, max);
	       }
	  }
     return(error);
     }

extern INT ReplaceRawDataSubSet(DatMatMaster *master, DataSubSet *data)
     {
     if(master->DataSubSetElement != 0)
          {
          FreeDataSubSet(master->DataSubSetElement);
          Free(master->DataSubSetElement);
          }

     master->DataSubSetElement = data;

     if(master->DataSubSetStandard != 0)
          {
          FreeDataSubSet(master->DataSubSetStandard);
          Free(master->DataSubSetStandard);
          }
     master->DataSubSetStandard = AllocateDataSubSet;
     CopyFullDataSubSet(master->DataSubSetStandard,data);
     return(DATMAT_NORMAL_RETURN);
     }

static INT icompare(void *i1,void *i2)
{
  INT *ii1,*ii2,ans;
  ii1 = i1;
  ii2 = i2;

  if(*ii1 > *ii2)
    ans = 1;
  else if(*ii1 < *ii2)
    ans = -1;
  else
    ans = 0;
  
  return  ans;
}
extern void PrintPrettyDataSubSet(FILE *file, CHAR* prefix, DataSubSet *set) {
  CHAR *string;
  int length;
  int i;

  fprintf(file,"%s Number of Points: %d",prefix,set->NumberOfPoints);
  for(i=0;i<set->NumberOfPoints;i++) {
    if(!(i % 10)) fprintf(file,"\n%s ",prefix);
    fprintf(file," %5d ",*(set->Points +i));
  }
  fprintf(file,"\n");

}
extern CHAR *PrintStringDataSubSet(CHAR *string, 
				 CHAR *prefix,
				 INT *bufferleft,
				 DataSubSet *origdata)
     {
     INT i,*points;
     CHAR *line;
     DataSubSet *data;
     INT current,last,num,*next,unique;
     
     line = AllocateString(LINELENGTH);
     data = AllocateDataSubSet;
     CopyFullDataSubSet(data,origdata);
     qsort(data->Points,data->NumberOfPoints,sizeof(INT),(int (*)()) icompare);

     unique = 0;
     points = data->Points;
     current = *points;
     next = data->Points+1;
     LOOPi(data->NumberOfPoints-1)
       {
	 if(*next != current)
	   {
	     *points = current;
	     unique++;
	     points++;
	     current = *next;
	   }
	 next++;
       }
     if(current != *(points-1))
       {
	 *points = current;
	 unique++;
       }
     
     sprintf(line,"%s ",prefix);
     string = PrintStringString(string,bufferleft,line);

     num = 0;
     points = data->Points;
     current = -1000;
     last = *points;
     LOOPi(unique)
	  {
	    if(*points != last)
	      current++;
	    if(current != *points)
	      {
		if(current >= 0)
		  {
		    sprintf(line,"%d,",last);
		    string = PrintStringString(string,bufferleft,line);
		  }
		sprintf(line,"%d-",*points);
		string = PrintStringString(string,bufferleft,line);
		current = *points;
		num++;
	      }
	    last = *points;
	    points++;
	  }
     sprintf(line,"%d\n",current);
     string = PrintStringString(string,bufferleft,line);

     Free(line);
     return(string);
     }
/*
extern CHAR *PrintStringDataSubSet(CHAR *string, 
				 CHAR *prefix,
				 INT *bufferleft,
				 DataSubSet *data)
     {
     INT i,*points;
     CHAR *line;
     
     line = AllocateString(LINELENGTH);
     
     sprintf(line,"%s: ",prefix);
     string = PrintStringString(string,bufferleft,line);
     
     points = data->Points;
     LOOPi(data->NumberOfPoints)
	  {
	  sprintf(line," %5d ",*points);
	  string = PrintStringString(string,bufferleft,line);
	  
	  if( !( (i+1) % 10 ) )
	       {
	       sprintf(line,"\n%s: ",prefix);
	       string = PrintStringString(string,bufferleft,line);
	       }
	  points++;
	  }
     sprintf(line,"\n");
     string = PrintStringString(string,bufferleft,line);
     Free(line);
     return(string);
     }
*/
extern INT MasterGetDataSubSet(DatMatMaster *master)
     {
     INT id,descrmissing,goalmissing;
     CHAR *name;
     DataSubSet *data,*raw,*new;
     SystemVariablePair *pair;
     SystemVariableList *varlst;
     SysSamVectorSet *syssamset;
     
     descrmissing = master->Constants->DescriptorMissing;
     goalmissing  = master->Constants->GoalMissing;
     
     if(master->DataSubSetStandard == 0 ||
	master->DataSubSetElement == 0)
	  {
	  id     = master->ID;
	  name   = master->Name;

	  if(master->DataSubSetElement == 0)
	       MasterGetRawDataSubSet(master);
	  raw = master->DataSubSetElement;

	  data = AllocateDataSubSet;
	  CopyFullDataSubSet(data,raw);
	  
	  if( descrmissing > 0)
	       {
	       syssamset = master->SysSamVectorSetElement;
	       pair    = master->SystemVariablePairElement;
	       varlst = pair->Descriptors;
	       
	       new = FormNoMissing(id,name,data,syssamset,varlst);
	       FreeDataSubSet(data);
	       Free(data);
	       data = new;
	       }
	  
	  if(goalmissing > 0)
	       {
	       syssamset = master->SysSamVectorSetElement;
	       pair    = master->SystemVariablePairElement;
	       varlst = pair->Goals;
	       
	       new = FormNoMissing(id,name,data,syssamset,varlst);
	       FreeDataSubSet(data);
	       Free(data);
	       data = new;
	       }
	  master->DataSubSetStandard = data;
	  }
     return(DATMAT_NORMAL_RETURN);
     }

extern INT MasterGetDataTestBlock(DatMatMaster *master)
     {
     DataTestBlock *testblock;
     double percent;
     DataSubSet *data;
     INT max,*points,origsize,buildsize,*not,number,error;
     SysSamVectorSet *syssamset;
     
     error = MasterGetDataSubSet(master);
     if(error == DATMAT_NORMAL_RETURN)
	  {
	  error = MasterGetSysSamVectorSet(master);
	  if(error == DATMAT_NORMAL_RETURN)
	       {
	       number = master->Constants->TrainPercent;
	       data = master->DataSubSetStandard;
	       syssamset = master->SysSamVectorSetElement;
     
	       percent = ((double) number) * .01;
	       
	       points = data->Points;
	       origsize = data->NumberOfPoints;
	       buildsize = (INT) ((double) origsize) * percent;
	       max = SysSamNumberOfSamples(syssamset);

	       if(master->DataTestBlockElement != 0)
		    {
		    FreeDataTestBlock(master->DataTestBlockElement);
		    Free(master->DataTestBlockElement);
		    master->DataTestBlockElement = 0;
		    }
	  
	       testblock = AllocateDataTestBlock;
	       CreateDataTestBlock(testblock,0,0,
				   0,0);
	       
	       not = 0;
	       testblock->Build = CreateRandomSet(points,master->Name,
						  buildsize,origsize,max,not,0);
	       
	       testblock->Test  = BuildComplementSet(data,testblock->Build,"test");     
	       master->DataTestBlockElement = testblock;
	       }
	  }
     return(error);
     }




extern INT NoMissingPointsInDescr(DatMatMaster *master)
     {
     DataSubSet *data,*new;
     SystemVariablePair *pair;
     
     INT error;
     
     error = MasterGetSysSamVectorSet(master);
     
     if(error == DATMAT_NORMAL_RETURN)
	  {
	  error = MasterGetDescrVarList(master);
	  if(error == DATMAT_NORMAL_RETURN)
	       {
	       data      = master->DataSubSetStandard;
	       pair = master->SystemVariablePairElement;
	       
	       new = FormNoMissing(master->ID,master->Name,
				   master->DataSubSetStandard,
				   master->SysSamVectorSetElement,
				   pair->Descriptors);
	       ReplaceRawDataSubSet(master, new);
	       }
	  }
     
     return(error);
     }

extern INT NoMissingPointsInGoal(DatMatMaster *master)
     {
     DataSubSet *data,*new;
     SysSamVectorSet *syssamset;
     SystemVariablePair *pair;
     SystemVariableList *varlst;
     INT error;
     
     error = MasterGetSysSamVectorSet(master);
     
     if(error == DATMAT_NORMAL_RETURN)
	  {
	  error = MasterGetDescrVarList(master);
	  if(error == DATMAT_NORMAL_RETURN)
	       {
	       syssamset = master->SysSamVectorSetElement;
	       data      = master->DataSubSetStandard;
	       pair = master->SystemVariablePairElement;
	       varlst    = pair->Goals;
	       
	       new = FormNoMissing(master->ID,master->Name,data,syssamset,varlst);
	       ReplaceRawDataSubSet(master, new);
	       }
	  }
     return(DATMAT_NORMAL_RETURN);
     }


static DataSubSet *FormNoMissing(INT id, CHAR *name,
				 DataSubSet *data,
				 SysSamVectorSet *syssamset,
				 SystemVariableList *varlst)
     {
     INT i,numvars;
     DataSubSet *new,*nextdata,*combined,*notmissing;
     SysSamVector *sample;
     VarNames *varnums;
     
     combined = AllocateDataSubSet;
     CreateDataSubSet(combined,id,name,0,0,0);

     numvars =  varlst->NumberOfVariables;
     varnums = varlst->Variables;
     LOOPi(numvars)
	  {
	  sample = NthSysSamVec(varnums->Number,syssamset);
	  nextdata = FindMissingPoints(data,sample);
	  new = MergeDataSubSets(varlst->Name,varlst->ID,
			   combined,nextdata);
	  FreeDataSubSet(nextdata);
	  Free(nextdata);
	  FreeDataSubSet(combined);
	  Free(combined);
	  
	  combined = new;
	  varnums++;
	  }
     notmissing = BuildComplementSet(data,combined,name);
     return(notmissing);
     }

extern INT FormRandomSetOfDataPoints(DatMatMaster *master)
     {
     SysSamVectorSet *syssamset;
     INT max,number,*points,*not,origsize,percent,error;
     DataSubSet *data,*rnddata;
     
     error = MasterGetSysSamVectorSet(master);
     
     if(error == DATMAT_NORMAL_RETURN)
	  {
	  syssamset = master->SysSamVectorSetElement;
	  data      = master->DataSubSetStandard;
	  percent   = master->Constants->RandomPercent;
	  
	  points = data->Points;
	  origsize = data->NumberOfPoints;
	  number = (((double) percent) / 100.0) * ((double) origsize) ;
	  max = SysSamNumberOfSamples(syssamset);
	  not = 0;
	  rnddata = CreateRandomSet(points,master->Name,number,origsize,max,not,0);
	  
	  ReplaceRawDataSubSet(master, rnddata);
	  }
     return(error);
     }

static IntegerRangeSet *SetUpFullIntegerRangeSet(INT n)
     {
     IntegerRangeSet *set;
     IntegerRange *range;
     

     set = AllocateIntegerRangeSet;
     set->NumberOfRanges = 1;
     set->Range = range = AllocArrayIntegerRange(1);

     range->First = 0;
     range->Last = n-1;
     
     return(set);
     }

extern void CreateDataSubSetFromRanges(DatMatMaster *master)
     {
     SysSamVectorSet *syssamset;
     DataSubSet *data;
     IntegerRange *range;
     IntegerRangeSet *set;
     INT num,i,*points,max;
     CHAR *ranges,*ranges0;
     
     syssamset = master->SysSamVectorSetElement;
     max = master->Constants->SubSetNumRanges;

     ranges = CopyString(master->Constants->SubSetRanges);
     ranges0 = EliminateLeadingBlanks(ranges);
     if(!strcmp("TOTAL_SUBSET",ranges0))
	  set = SetUpFullIntegerRangeSet(syssamset->NumSystemPoints);
     else
	  set = AllocInputIntegerRangeSet(master->Constants->SubSetRanges,max);

     num = ComputeNumberOfPoints(set);
     data = AllocateDataSubSet;
     max = SysSamNumberOfSamples(syssamset);
     CreateDataSubSet(data,0,"Input",max,num,0);

     points = data->Points;
     range = set->Range;
     LOOPi(set->NumberOfRanges)
           {
           points = ExpandRange(range,points);
           range++;
           }
     FreeIntegerRangeSet(set);
     ReplaceRawDataSubSet(master,data);
}







