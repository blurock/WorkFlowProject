#include "basic.h"
#include "comlib.h"
#include "datmat1.h"

extern INT DatMatFormFromRanges(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out;
     CommandMaster *commandmaster;
     
     out = GetPrereqDataSubSet(bind);
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
	  out = MasterGetRawDataSubSet(datmatmaster);
	  
	  if(out == DATMAT_NORMAL_RETURN)
	       {
	       CreateDataSubSetFromRanges(datmatmaster);
	       out = SYSTEM_NORMAL_RETURN;
	       }
	  else
	       out = SYSTEM_ERROR_RETURN;
	  }
     
     if(datmatmaster->DataSubSetStandard != 0)
	  if(out == SYSTEM_NORMAL_RETURN)
	       datmatmaster->DataSubSetStandard->ID = GetCurrentAge(bind);
	  else
	       datmatmaster->DataSubSetStandard->ID = GetOldestAge();

     return(out);
     }

extern INT DatMatFormRandomly(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqDataSubSet(bind);
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  out = MasterGetDataSubSet(datmatmaster);
	  
	  if(out == DATMAT_NORMAL_RETURN)
	       {
	       out = FormRandomSetOfDataPoints(datmatmaster);
	       
	       if(out == DATMAT_NORMAL_RETURN)
		    out = SYSTEM_NORMAL_RETURN;
	       else
		    out = SYSTEM_ERROR_RETURN;
	       }
	  else
	       out = SYSTEM_ERROR_RETURN;
	  }
     if(datmatmaster->DataSubSetStandard != 0)
	  if(out == SYSTEM_NORMAL_RETURN)
	       datmatmaster->DataSubSetStandard->ID = GetCurrentAge(bind);
	  else
	       datmatmaster->DataSubSetStandard->ID = GetOldestAge();
     return(out);
     }

extern INT DatMatGoalNoMissing(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqDataSubSet(bind);
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  out = MasterGetDataSubSet(datmatmaster);
	  if(out == DATMAT_NORMAL_RETURN)
	       {
	       out = NoMissingPointsInGoal(datmatmaster);
	       if(out == DATMAT_NORMAL_RETURN)
		    out = SYSTEM_NORMAL_RETURN;
	       else
		    out = SYSTEM_ERROR_RETURN;
	       }
	  else
	       out = SYSTEM_ERROR_RETURN;
	  }
     if(datmatmaster->DataSubSetStandard != 0)
	  if(out == SYSTEM_NORMAL_RETURN)
	       datmatmaster->DataSubSetStandard->ID = GetCurrentAge(bind);
	  else
	       datmatmaster->DataSubSetStandard->ID = GetOldestAge();

     return(out);
     }

extern INT DatMatDescNoMissing(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqDataSubSet(bind);
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  out = MasterGetDataSubSet(datmatmaster);
	  
	  if(out == DATMAT_NORMAL_RETURN)
	       {
	       out = NoMissingPointsInDescr(datmatmaster);
	       
	       if(out == DATMAT_NORMAL_RETURN)
		    out = SYSTEM_NORMAL_RETURN;
	       else
		    out = SYSTEM_ERROR_RETURN;
	       }
	  else
	       out = SYSTEM_ERROR_RETURN;
	  }
     if(datmatmaster->DataSubSetStandard != 0)
	  if(out == SYSTEM_NORMAL_RETURN)
	       datmatmaster->DataSubSetStandard->ID = GetCurrentAge(bind);
	  else
	       datmatmaster->DataSubSetStandard->ID = GetOldestAge();

     return(out);
     }

     
