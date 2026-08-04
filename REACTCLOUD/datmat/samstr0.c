#include "basic.h"
#include "datmat0.h"

#include "datmat/samstr.c"
static BaseType *ConvertIntVecToBaseTypeVec(INT *intvec,int num);
static BaseType *ConvertFltVecToBaseTypeVec(FLOAT *fltvec,int num);

/******************************************************************************/
/* Nth Element in Vector
*/
extern FLOAT NthSysSamVectorAsFloat(SysSamVector *data, int ipoint)
     {
     FLOAT out;
     
     out = 0;
    switch(data->Data->Type)
         {
         case INTEGERVAR:
              out = (FLOAT) *( SysSamVecNthInteger(data,ipoint) );
              break;
         case FLOATVAR:
              out = (FLOAT) *( SysSamVecNthFloat(data,ipoint) );
              break;
         }

     return(out);
}

extern void InsertFloatToSysSamVector(SysSamVector *data, int ipoint, FLOAT flt)
{
     
    switch(data->Data->Type)
         {
         case INTEGERVAR:
              *( SysSamVecNthInteger(data,ipoint) ) = (INT) flt + 0.5;
              break;
         case FLOATVAR:
              *( SysSamVecNthFloat(data,ipoint) ) = flt;
              break;
         }
}

extern FLOAT *SysSamVecNthFloat(SysSamVector *data, int ipoint)
{
     if( ipoint >= data->Data->Float->VectorLength )
          Error(ipoint,"Illegal Index in SysSamVector");
     return( ( ((FLOAT *) data->Data->Float->Vector) + ipoint ) );
}

extern INT *SysSamVecNthInteger(SysSamVector *data, int ipoint)
{
     if( ipoint >= data->Data->Integer->VectorLength )
          Error(ipoint,"Illegal Index in SysSamVector");
     return( ( ((INT *) data->Data->Integer->Vector) + ipoint ) );
}

extern INT MissingValueNth(INT n, SysSamVector *data)
{
INT *intvar;
FLOAT *fltvar;
INT miss;
     
miss = 1;

    switch(data->Data->Type)
         {
         case INTEGERVAR:
              intvar = SysSamVecNthInteger(data,n);
              if(*intvar == data->Missing->Integer) 
                   miss = 1;
              else
                   miss = 0;
               break;
         case FLOATVAR:
              fltvar = SysSamVecNthFloat(data,n);
              if(*fltvar == data->Missing->Float)
                   miss = 1;
              else
                   miss = 0;
               break;
         }

     return(miss);
}
              

/******************************************************************************/
extern void PrintNthData(SysSamVector *data, int ipoint)
{
INT *intvar;
FLOAT *fltvar;

     switch(data->Data->Type)
          {
          case INTEGERVAR:
               intvar = SysSamVecNthInteger(data,ipoint);
               if(*intvar == data->Missing->Integer)
                    printf("     .      ");
               else
                    printf(" %10d ", *intvar );
               break;
          case FLOATVAR:
               fltvar = SysSamVecNthFloat(data,ipoint);
               if(*fltvar == data->Missing->Float)
                    printf("      .     ");
               else
                    printf(" %10f ", *fltvar );
               break;
          }
}
extern void FilePrintNthData(FILE *file, SysSamVector *data, int ipoint)
{
INT *intvar;
FLOAT *fltvar,flt;

     switch(data->Data->Type)
          {
          case INTEGERVAR:
               intvar = SysSamVecNthInteger(data,ipoint);
               if(*intvar == data->Missing->Integer)
                    fprintf(file,"     .      ");
               else
		    {
		    flt = *intvar;
                    fprintf(file," %3.1f, ", flt );
		    }
               break;
          case FLOATVAR:
               fltvar = SysSamVecNthFloat(data,ipoint);
               if(*fltvar == data->Missing->Float)
                    fprintf(file,"      .     ");
               else
                    fprintf(file," %10f ", *fltvar );
               break;
          }
}
/******************************************************************************/
extern int FindSystemVariableName(SysSamVectorSet *set, char *name)
{
int count,done,ans;
SysSamVector *var;

    count = 0;
    var = set->Sets;
    done = 0;
    while( done == 0 )
         {
         ans = strcmp(name,var->Name);
         if( ans == 0 )
              done = 1;
         else
              {
               count++;
               var++;
               if(count >= set->NumSystemSamples) done = 1;
              }
         }
     if(count < set->NumSystemSamples)
          return(count);
     else
          {
          printf("Variable To Find \"%s\":",name);
          Error(0,"Variable Name Not Found ");
          return(-1);
          }
}

extern SysSamVector *NthSysSamVec(INT n, SysSamVectorSet *syssampvec)
{
SysSamVector *vec;

    if( n < syssampvec->NumSystemSamples )
         vec = syssampvec->Sets + n;
    else
         {
         Error(n,"Illegal SysSamVector");
         vec = 0;
         }
     return(vec);
}



extern INT SysSamNumberOfSamples(SysSamVectorSet *set)
{
BaseVector *data;
INT type,ret;

     data = set->Sets->Data;
     type = data->Type;

ret = 0;

     switch(type)
          {
          case INTEGERVAR:
               ret = data->Integer->VectorLength;
               break;
          case FLOATVAR:
               ret = data->Float->VectorLength;
               break;
          }
     return(ret);
}

extern void ConvertString(int Type, char *string, BaseType *basis)
{

     switch(Type)
          {
          case INTEGERVAR:
               basis->Integer = ConvertStringToInteger(string);
               break;
          case FLOATVAR:
               basis->Float   = ConvertStringToFloat(string);
               break;
          }
}

extern CHAR *PrintStringBaseType(CHAR *string, CHAR *prefix, INT *length,
				 INT width,
				 BaseType *base)
     {
     CHAR *form,*line;
     
     form = AllocateString(10);
     line = AllocateString(LINELENGTH);
     
     switch(base->Type)
          {
     case INTEGERVAR:
	  sprintf(form," %%%dd ",width-2);
	  sprintf(line,form,base->Integer);
	  break;
     case FLOATVAR:
	  sprintf(form," %%%df ",width-2);
	  sprintf(line,form,base->Float);
	  break;
          }
     string = PrintStringString(string,length,line);
     Free(form);
     Free(line);
     return(string);
     }
     
extern CHAR *ConvertBaseTypeToString( int type, BaseType *base, char *string)
{
     switch(type)
          {
          case INTEGERVAR:
               ConvertIntegerToString(base->Integer,string);
               break;
          case FLOATVAR:
               ConvertFloatToString(base->Float,string);
               break;
          }
     return(string);
}

extern BaseType *ConvertStringToVector(int Type,int *count, char *string,int max)
{
BaseType *basis;
char dummy[LINELENGTH];
INT *intvec;
FLOAT *fltvec;

basis = 0;

     switch(Type)
          {
          case INTEGERVAR:
               intvec = AllocArrayINT(max);
               *count = ConvertStringToIntVec(intvec,string,dummy,COMMA,max);
               basis = ConvertIntVecToBaseTypeVec(intvec,*count);
               Free(intvec);
               break;
           case FLOATVAR:
               fltvec = AllocArrayFLOAT(max);
               *count = ConvertStringToFltVec(fltvec,string,dummy,COMMA,max);
               basis = ConvertFltVecToBaseTypeVec(fltvec,*count);
               Free(fltvec);
               break;
            }
     return(basis);
}

static BaseType *ConvertIntVecToBaseTypeVec(INT *intvec,int num)
{
int i;
BaseType *basis,*start;

      basis = start = AllocArrayBaseType(num);

      LOOPi(num)
           {
		basis->Name = CopyString("vec");
		basis->ID = i;
		basis->Integer = *intvec;
		basis++;
		intvec++;
           }

       return(start);
}

static BaseType *ConvertFltVecToBaseTypeVec(FLOAT *fltvec,int num)
{
int i;
BaseType *basis,*start;

      basis = start = AllocArrayBaseType(num);

      LOOPi(num)
           {
		basis->Name = CopyString("vec");
		basis->ID = i;
		basis->Float = *fltvec;
		basis++;
		fltvec++;
           }

       return(start);
}

extern SysSamVectorSet *CombineSysSamVectorSet(INT id, CHAR *name,
					       SysSamVectorSet *set1,
					       SysSamVectorSet *set2)
     {
     INT i,size;
     SysSamVector *newsyssam,*syssam;
     SysSamVectorSet *new;
     

     size = set1->NumSystemSamples + set2->NumSystemSamples;
     new = AllocateSysSamVectorSet;
     CreateSysSamVectorSet(new,id,name,
			   size,
			   set1->NumSystemPoints,
			   0,0);

     newsyssam = new->Sets;

     syssam = set1->Sets;
     LOOPi(set1->NumSystemSamples)
	  CopyFullSysSamVector(newsyssam++, syssam++);

     syssam = set2->Sets;
     LOOPi(set2->NumSystemSamples)
	  CopyFullSysSamVector(newsyssam++, syssam++);

     return(new);
}


