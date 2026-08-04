#include "basic.h"
#include "comlib.h"
#include "datmat1.h"

/****************************************************************************/
/* VarLst routines */
/****************************************************************************/
extern INT GetPrereqSystemVariablePair(BindStructure *bind)
     {
     INT out;
     
     out = GetStructSysSamVectorSet(bind);

     GetConstantsSystemVariablePair(bind);
     
     return(out);
     }

extern INT GetConstantsSystemVariablePair(BindStructure *bind)
     {
     DatMatConstants *constants;
     DatMatMaster *datmatmaster;
     CommandMaster *commandmaster;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     
     constants = datmatmaster->Constants;
     constants->VarDirectory = GetCurrentStringArgument("VarDirectory",
							 commandmaster);     
     constants->GoalList = GetCurrentStringArgument("GoalList",
						     commandmaster);     
     constants->DescrList = GetCurrentStringArgument("DescrList",
						      commandmaster);     
     return(SYSTEM_NORMAL_RETURN);
     }
     
extern INT GetAgeSystemVariablePair(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT age;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);

     if(datmatmaster->SystemVariablePairElement != 0)
	  age = datmatmaster->SystemVariablePairElement->ID;
     else
	  age = AGE_NOT_FORMED;
     
     return(age);
     }

extern INT FreeStructSystemVariablePair(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out,system;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     out = MasterFreeSystemVariableList(datmatmaster);
     
     if(out == DATMAT_NORMAL_RETURN)
	  system = SYSTEM_NORMAL_RETURN;
     else
	  system = SYSTEM_ERROR_RETURN;
     
     return(system);
     }

extern INT GetStructSystemVariablePair(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out,age;
     
     out = GetPrereqSystemVariablePair(bind);
     
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  age = GetAgeSystemVariablePair(bind);
	  if(age == AGE_NOT_FORMED)
	       age = GetCurrentAge(bind);
	  
	  datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
	  if(datmatmaster->SystemVariablePairElement == 0 ||
	     GetAgeSysSamVectorSet(bind) > age)
	       {
	       out = FormStructSystemVariablePair(bind);
	       if(out == DATMAT_NORMAL_RETURN)
		    {
		    datmatmaster->SystemVariablePairElement->ID = GetCurrentAge(bind);
		    out = SYSTEM_NORMAL_RETURN;
		    }
	       }
	  }
     return(out);
     }

extern INT FormStructSystemVariablePair(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqSystemVariablePair(bind);
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  FreeStructSystemVariablePair(bind);

	  datmatmaster->SystemVariablePairElement = AllocateSystemVariablePair;
	  CreateSystemVariablePair(datmatmaster->SystemVariablePairElement,
				   GetCurrentAge(bind),
				   bind->Name,
				   0,0);
	  
	  out = MasterGetGoalVarList(datmatmaster);
	  if(out == SYSTEM_NORMAL_RETURN)
	       {
	       out = MasterGetDescrVarList(datmatmaster);
	       }
	  }
     
     if(datmatmaster->SystemVariablePairElement != 0)
	  if(out == SYSTEM_NORMAL_RETURN)
	       datmatmaster->SystemVariablePairElement->ID = GetCurrentAge(bind);
	  else
	       datmatmaster->SystemVariablePairElement->ID = GetOldestAge();
     
     return(out);
     }





