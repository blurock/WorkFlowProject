#include "basic.h"
#include "comlib.h"
#include "datmat1.h"

/****************************************************************************/
/* DatMat routines */
/****************************************************************************/

extern INT GetPrereqDatMat(BindStructure *bind)
     {
     GetConstantsDatMat(bind);
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT GetConstantsDatMat(BindStructure *bind)
     {
     INT out;
     
     out = GetConstantsSysSamVectorSet(bind);
	  if(out == SYSTEM_NORMAL_RETURN)
	       {
	       out = GetConstantsSystemVariablePair(bind);
	       if(out == SYSTEM_NORMAL_RETURN)
		    {
		    out = GetConstantsDataSubSet(bind);
		    if(out == SYSTEM_NORMAL_RETURN)
			 {
			 out = GetConstantsDataTestBlock(bind);
			 }
		    }
	       }
     return(out);
     }

extern INT GetAgeDatMat(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT max,age;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);

     max = GetAgeSysSamVectorSet(bind);
     age = GetAgeSystemVariablePair(bind);
     if(age > max) 
	  max = age;
     age = GetAgeDataSubSet(bind);
     if(age > max)
	  max = age;
     age = GetAgeDataTestBlock(bind);
     if(age > max)
	  max = age;
     return(max);
     }

extern INT FreeStructDatMat(BindStructure *bind)
     {
     INT out1,out2,out3,out4,out;
     
     out1 = FreeStructSysSamVectorSet(bind);
     out2 = FreeStructSystemVariablePair(bind);
     out3 = FreeStructDataSubSet(bind);
     out4 = FreeStructDataTestBlock(bind);

     if(out1 != SYSTEM_NORMAL_RETURN ||
	out1 != SYSTEM_NORMAL_RETURN ||
	out1 != SYSTEM_NORMAL_RETURN ||
	out1 != SYSTEM_NORMAL_RETURN)
	  out = SYSTEM_NORMAL_RETURN;
     else
	  out = SYSTEM_ERROR_RETURN;
	  
     return(out);
     }

extern INT GetStructDatMat(BindStructure *bind)
     {
     INT out;

     out = GetStructSysSamVectorSet(bind);
	  if(out == SYSTEM_NORMAL_RETURN)
	       {
	       out = GetStructSystemVariablePair(bind);
	       if(out == SYSTEM_NORMAL_RETURN)
		    {
		    out = GetStructDataSubSet(bind);
		    if(out == SYSTEM_NORMAL_RETURN)
			 {
			 out = GetStructDataTestBlock(bind);
			 }
		    }
	       }
     return(out);
     }

extern INT FormStructDatMat(BindStructure *bind)
     {
     INT out;

     out = FormStructSysSamVectorSet(bind);
	  if(out == SYSTEM_NORMAL_RETURN)
	       {
	       out = FormStructSystemVariablePair(bind);
	       if(out == SYSTEM_NORMAL_RETURN)
		    {
		    out = FormStructDataSubSet(bind);
		    if(out == SYSTEM_NORMAL_RETURN)
			 {
			 out = FormStructDataTestBlock(bind);
			 }
		    }
	       }
     return(out);
     }
