#include "basic.h"
#include "datmat0.h"

static FLOAT *ExtractFloatVector(DataSubSet *subset,                                    
                          SysSamVector *data);
static INT *ExtractIntegerVector(DataSubSet *subset,
                          SysSamVector *data);

extern DataSubSet *FindMissingPoints(DataSubSet *set, SysSamVector *data)
     {
     DataSubSet *missing,*out;
     INT *points,*miss;
     INT cnt,i;
     
     missing = AllocateDataSubSet;
     CreateDataSubSet(missing,data->ID,data->Name,
		      set->MaximumPoint,
		      set->NumberOfPoints,
		      0);
     

     cnt = 0;
     points = set->Points;
     miss = missing->Points;
     LOOPi(set->NumberOfPoints)
	  {
	  if(MissingValueNth(*points,data))
	       {
	       *miss++ = *points;
	       cnt++;
	       }
	  points++;
	  }
     missing->NumberOfPoints = cnt;
     out = AllocateDataSubSet;
     CopyFullDataSubSet(out,missing);
     FreeDataSubSet(missing);
     Free(missing);
     
     return(out);
     }
     
/******************************************************************************/
extern BaseType *FindLowestValue(DataSubSet *set, SysSamVector *data)
{
INT *intvar;
FLOAT *fltvar;
BaseType *base;
INT i,*points,type;

     type = data->Data->Type;

     base = AllocateBaseType;
     CreateBaseType(base,set->ID,set->Name,
                    type,INT_MAX,FLT_MAX);

     points = set->Points;
     LOOPi(set->NumberOfPoints)
          {
          switch(type)
               {
               case INTEGERVAR:
                    intvar = SysSamVecNthInteger(data,*points);
                    if(*intvar != data->Missing->Integer &&
                       *intvar < base->Integer)
                            base->Integer = *intvar;
                    break;
               case FLOATVAR:
                    fltvar = SysSamVecNthFloat(data,*points);
                    if(*fltvar != data->Missing->Float &&
                       *fltvar < base->Float)
                              base->Float = *fltvar;
                    break;
               }
         points++;
         }
     return(base);
}

/***************************************************************************/
extern BaseVector *SetUpBaseVector(INT id,
                            CHAR *name,
                            INT type,
                            SysSamVector *data,
                            DataSubSet *subset)
{
BaseFltVector *basefloat;
BaseIntVector *baseinteger;
BaseVector *basvec;
INT *intvec;
FLOAT *fltvec;

      basvec = AllocateBaseVector;

basefloat = 0;
baseinteger = 0;

      switch(type)
           {
           case INTEGERVAR:
                baseinteger = AllocateBaseIntVector;
                intvec = ExtractIntegerVector(subset,data);
                CreateBaseIntVector(baseinteger,
                                    id,name,
                                    subset->NumberOfPoints,
                                    intvec);
                Free(intvec);
                break;
           case FLOATVAR:
                basefloat = AllocateBaseFltVector;
                fltvec = ExtractFloatVector(subset,data);
                CreateBaseFltVector(basefloat,
                                    id,name,
                                    subset->NumberOfPoints,
                                    fltvec);
                Free(fltvec);
                break;
           }

     CreateBaseVector(basvec,
                      id,name,type,
                      baseinteger,
                      basefloat);
     FreeBaseFltVector(basefloat);
     FreeBaseIntVector(baseinteger);
     Free(basefloat);
     Free(baseinteger);

     return(basvec);
}

static FLOAT *ExtractFloatVector(DataSubSet *subset,                                    
                          SysSamVector *data)
{
INT i,*n;
FLOAT *flt,*fltstart;


     flt = fltstart = 
           AllocArrayFLOAT(subset->NumberOfPoints);
     LOOPi(subset->NumberOfPoints)
          {
          n = NthDataSubSetPoint(subset,i);
          *flt = *(SysSamVecNthFloat(data,*n));
          flt++;
          }

     return(fltstart);
}

static INT *ExtractIntegerVector(DataSubSet *subset,
                          SysSamVector *data)
{
INT i,*n,*in,*instart;

     in = instart = 
           AllocArrayINT(subset->NumberOfPoints);
     LOOPi(subset->NumberOfPoints)
          {
          n = NthDataSubSetPoint(subset,i);
          *in = *(SysSamVecNthInteger(data,*n));
          in++;
          }

     return(instart);
}

extern SysSamVectorSet *DataSubSetToSysSam(DataSubSet *subset,
				    DataSubSet *fullset)
{
     SysSamVectorSet *syssamset;
     SysSamVector *syssam;
     INT *new,length;
     INT j,id;
     CHAR *name;
     BaseVector *base;
     
     name = subset->Name;
     id = subset->ID;
     length = subset->MaximumPoint;

     syssamset = AllocateSysSamVectorSet;
     CreateSysSamVectorSet(syssamset,
                           id,name,
                           1,subset->NumberOfPoints,
                           0,0);

      syssam = syssamset->Sets;

     CreateSysSamVector(syssam,id,name,
			0,0,0);
     syssam->Missing = AllocateBaseType;
     CreateBaseType(syssam->Missing,
		    id,name,
		    INTEGERVAR,
		    INTEGERMISSING,
		    FLOATMISSING);
     syssam->Data = base = AllocateBaseVector;
     CreateBaseVector(syssam->Data,
		      id,name,
		      INTEGERVAR,
		      0,0);

     base->Float = 0;
     base->Integer   = AllocateBaseIntVector;
     CreateBaseIntVector(base->Integer,
			 id,name,
			 length,
			 0);

     new = base->Integer->Vector;
     LOOPj(length)
	  {
	       if(IntegerMemberOf(j,subset->Points,subset->NumberOfPoints))
		    *new++ = 1;
	       else if(IntegerMemberOf(j,fullset->Points,fullset->NumberOfPoints))
		    *new++ = 0;
	       else
		    *new++ = INTEGERMISSING;
	       
	  }

     return(syssamset);
}

extern BaseType *FloatToBaseType(FLOAT value, INT type)
     {
     BaseType *base;
     
     base = AllocateBaseType;
     CreateBaseType(base,type,0,type,0,0.0);
     if(type == FLOATVAR)
	  {
	  base->Integer = 0;
	  base->Float = value;
	  }
     else
	  {
	  base->Integer = (INT) value;
	  base->Float  = 0;
	  }
     
     return(base);
     }

extern void SetUpNthBaseTypeFromBaseVector(BaseType *base,
					   INT point,
					   BaseVector *data)
     {
     CreateBaseType(base,data->Type,0,data->Type,0,0.0);

     if(data->Type == FLOATVAR)
	  {
	  base->Integer = 0;
	  base->Float = *(data->Float->Vector + point);
	  }
     else
	  {
	  base->Integer = *(data->Integer->Vector + point);
	  base->Float  = 0;
	  }
     }


