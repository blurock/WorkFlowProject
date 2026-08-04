#include "basic.h"
#include "comlib.h"
#include "datmat1.h"

/****************************************************************************/
/* DataSubSet routines */
/****************************************************************************/
extern INT GetPrereqDataSubSet(BindStructure *bind)
     {
     INT out;
     
     out = GetStructSysSamVectorSet(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  out = GetStructSystemVariablePair(bind);
     GetConstantsDataSubSet(bind);
     
     return(out);
     }



extern INT GetPrereqDataTestBlock(BindStructure *bind)
     {
     INT out;
     
     out = GetPrereqDataSubSet(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  out = GetStructDataSubSet(bind);
     GetConstantsDataTestBlock(bind);
     
     return(out);
     }

extern INT GetConstantsDataSubSet(BindStructure *bind)
     {
     DatMatConstants *constants;
     DatMatMaster *datmatmaster;
     CommandMaster *commandmaster;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     constants = datmatmaster->Constants;
     constants->SubSetNumRanges = GetCurrentIntegerArgument("SubSetNumRanges",
							    commandmaster);     
     constants->SubSetRanges = GetCurrentStringArgument("SubSetRanges",
							 commandmaster);     
     constants->RandomPercent = GetCurrentIntegerArgument("RandomPercent",
							  commandmaster);     
     constants->DescriptorMissing = GetCurrentIntegerArgument("DescriptorMissing",
							      commandmaster);     
     constants->GoalMissing = GetCurrentIntegerArgument("GoalMissing",
							commandmaster);     
     return(SYSTEM_NORMAL_RETURN);
    }
     
extern INT GetConstantsDataTestBlock(BindStructure *bind)
     {
     DatMatConstants *constants;
     DatMatMaster *datmatmaster;
     CommandMaster *commandmaster;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     constants = datmatmaster->Constants;

     GetConstantsDataSubSet(bind);
     constants->TrainPercent = GetCurrentIntegerArgument("TrainPercent",
							 commandmaster);     
     return(SYSTEM_NORMAL_RETURN);
     }     


extern INT GetAgeDataSubSet(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT age;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);

     if(datmatmaster->DataSubSetStandard != 0)
	  age = datmatmaster->DataSubSetStandard->ID;
     else
	  age = AGE_NOT_FORMED;
     
     return(age);
     }

extern INT GetAgeDataTestBlock(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT age;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);

     if(datmatmaster->DataTestBlockElement != 0)
	  age = datmatmaster->DataTestBlockElement->ID;
     else
	  age = AGE_NOT_FORMED;
     
     return(age);
     }

extern INT FreeStructDataSubSet(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out,system;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);

     out = MasterFreeDataSubSet(datmatmaster);
     
     if(out == DATMAT_NORMAL_RETURN)
	  system = SYSTEM_NORMAL_RETURN;
     else
	  system = SYSTEM_ERROR_RETURN;

     return(system);
     }

extern INT FreeStructDataTestBlock(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out,system;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);

     out = MasterFreeDataTestBlock(datmatmaster);
     
     if(out == DATMAT_NORMAL_RETURN)
	  system = SYSTEM_NORMAL_RETURN;
     else
	  system = SYSTEM_ERROR_RETURN;

     return(system);
     }

extern INT GetStructDataSubSet(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out,age;
     
     out = GetPrereqDataSubSet(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
	  if(out == DATMAT_NORMAL_RETURN)
	       {
	       age = GetAgeDataSubSet(bind);
	       if(GetAgeSysSamVectorSet(bind) > age ||
		  GetAgeSystemVariablePair(bind) > age ||
		  datmatmaster->DataSubSetStandard == 0)
		    out = FormStructDataSubSet(bind);
	       }
	  else
	       out = SYSTEM_ERROR_RETURN;
	  }
     return(out);
     }

extern INT FormStructDataSubSet(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqDataSubSet(bind);
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  out = MasterFreeDataSubSet(datmatmaster);
	  if(out == DATMAT_NORMAL_RETURN)
	       out = MasterGetDataSubSet(datmatmaster);
	  else
	       out = SYSTEM_ERROR_RETURN;
	  if(out == DATMAT_NORMAL_RETURN)
	       out = SYSTEM_NORMAL_RETURN;
	  }

     if(datmatmaster->DataSubSetElement != 0)
	  if(out == SYSTEM_NORMAL_RETURN)
	       datmatmaster->DataSubSetElement->ID = GetCurrentAge(bind);
	  else
	       datmatmaster->DataSubSetElement->ID = GetOldestAge();

     return(out);
     }

extern INT GetStructDataTestBlock(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqDataTestBlock(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
	  if(out == DATMAT_NORMAL_RETURN)
	       {
	       if(GetAgeDataSubSet(bind) > GetAgeDataTestBlock(bind) ||
		  datmatmaster->DataTestBlockElement == 0)
		    out = FormStructDataTestBlock(bind);
	       }
	  else
	       out = SYSTEM_ERROR_RETURN;
	  }
     return(out);
     }

extern INT FormStructDataTestBlock(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqDataTestBlock(bind);
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  out = MasterFreeDataTestBlock(datmatmaster);
	  if(out == DATMAT_NORMAL_RETURN)
	       out = MasterGetDataTestBlock(datmatmaster);
	  else
	       out = SYSTEM_ERROR_RETURN;
	  if(out == DATMAT_NORMAL_RETURN)
	       out = SYSTEM_NORMAL_RETURN;
	  }

     if(datmatmaster->DataTestBlockElement != 0)
	  if(out == SYSTEM_NORMAL_RETURN)
	       datmatmaster->DataTestBlockElement->ID = GetCurrentAge(bind);
	  else
	       datmatmaster->DataTestBlockElement->ID = GetOldestAge();


     return(out);
     }

	  




