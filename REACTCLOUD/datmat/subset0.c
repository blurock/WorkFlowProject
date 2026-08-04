#include "basic.h"
#include "datmat0.h"

#include "datmat/subset.c"

/*******************************************************************************/
extern DataSubSet *MergeDataSubSets(char *name, int id, 
				    DataSubSet *set1, 
				    DataSubSet *set2)
     {
     DataSubSet *merged;
     INT size,max,*new,*orig,i,count;
     
     merged = AllocateDataSubSet;
     size = set1->NumberOfPoints + set2->NumberOfPoints;
     max = set1->MaximumPoint;
     CreateDataSubSet(merged,id,name,max,size,0);

     count = 0;

     new = merged->Points;
     orig = set1->Points;
     LOOPi(set1->NumberOfPoints)
         {
         if(IntegerMemberOf(*orig,merged->Points,count) == 0)
              {
              count++;
              *new++ = *orig;
              }
         orig++;
         }

     orig = set2->Points;
     LOOPi(set2->NumberOfPoints)
         {
         if(IntegerMemberOf(*orig,merged->Points,count) == 0)
              {
              count++;
              *new++ = *orig;
              }
         orig++;
         }

     merged->NumberOfPoints = count;
     
     return(merged);
}

/**************************************************************************************/
extern DataSubSet *BuildComplementSet(DataSubSet *original, 
                               DataSubSet *subset, 
                               char *name)
{
DataSubSet *complement;
int size,*new,*orig,i;

     complement = AllocateDataSubSet;
     size = original->NumberOfPoints - subset->NumberOfPoints;
     CreateDataSubSet(complement,0,name,
                      original->MaximumPoint,size,0);

     new = complement->Points;
     orig = original->Points;
     LOOPi(original->NumberOfPoints)
          {
          if(IntegerMemberOf(*orig,subset->Points,subset->NumberOfPoints) == 0)
               *new++ = *orig++;
          else
               orig++;
          }

     return(complement);
}

/**************************************************************************************/
extern DataSubSet *CreateRandomSubSet(int percent, DataSubSet *data)
{
double apercent;
int *points, origsize,buildsize,max;
DataSubSet *subset;
int *not;

     apercent = ((double) percent) / 100.0;
     points = data->Points;
     origsize = data->NumberOfPoints;
     buildsize = (INT) origsize * apercent;
     max = data->MaximumPoint;

     not = 0;
     subset = CreateRandomSet(points,"SubSet",buildsize,origsize,max,not,0);

     return(subset);
}

/**************************************************************************************/
extern DataSubSet *CreateRandomSet(int *points, char *name,
				   int number,int origsize,int max,
				   int *not, int notcount)
{
DataSubSet *rnddata;
int *randompoints,count,new,random;

     rnddata = AllocateDataSubSet;
     CreateDataSubSet(rnddata,0,name,max,number,0);
     randompoints = rnddata->Points;
     count = 0;
     while(count < number)
          {
          random = rand() % origsize;
          new = *(points + random);
          if(IntegerMemberOf(new,rnddata->Points,count) == 0 &&
             IntegerMemberOf(new,not,notcount) == 0          )
               {  
               *randompoints++ = new;
               count++;
               }
          }
     return(rnddata);
}

/**************************************************************************************/
extern DataSubSet *CreateCompleteDataSubSet(INT id, CHAR *name, INT n)
{
DataSubSet *subset;
INT i,*points;

     subset = AllocateDataSubSet;
     CreateDataSubSet(subset,id,name,n,n,0);
     points = subset->Points;
     LOOPi(n)
          *points++ = i;

     return(subset);
}

/**************************************************************************************/
extern int IntegerMemberOf(int new, int *points, int length)
     {
     int i,done;
     
     done = 0;
     i = 0;
     while(done == 0 && i++ < length)
	  {
          if(*points++ == new) done = 1;
	  }
     return(done);
     }

/**************************************************************************************/
extern int *NthDataSubSetPoint(DataSubSet *dataset, int n)
     {
     if( n < dataset->NumberOfPoints )
          return(dataset->Points + n);

     Error(0,"Error DataSubSetPoint");
     return(0);
     }

