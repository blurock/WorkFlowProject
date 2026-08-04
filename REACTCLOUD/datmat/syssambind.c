#include "basic.h"
#include "comlib.h"
#include "datmat1.h"

/****************************************************************************/
/* SysSamVectorSet routines */
/****************************************************************************/
extern INT GetPrereqSysSamVectorSet(BindStructure *bind)
     {
     GetConstantsSysSamVectorSet(bind);

     return(NORMAL_RETURN);
     }

extern INT GetConstantsSysSamVectorSet(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     DatMatConstants *constants;
     CommandMaster *commandmaster;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     constants = datmatmaster->Constants;
     constants->ReadDebug = GetCurrentIntegerArgument("ReadDebug",
					      commandmaster);     
     constants->MaxNames  = GetCurrentIntegerArgument("MaxNames",
					      commandmaster);     
     constants->ControlFile = GetCurrentStringArgument("ControlFile",
						     commandmaster);     
     constants->DataDirectory = GetCurrentStringArgument("DataDirectory",
						       commandmaster);     
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT GetAgeSysSamVectorSet(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT age;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     
     if(datmatmaster->SysSamVectorSetElement != 0)
	  age = datmatmaster->SysSamVectorSetElement->ID;
     else 
	  age = AGE_NOT_FORMED;
     return(age);
     }


extern INT FreeStructSysSamVectorSet(BindStructure *bind)
     {
     DatMatMaster *datmatmaster;
     INT system,out;
     
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     
     out = MasterFreeSysSamVectorSet(datmatmaster);
     
     if(out == DATMAT_NORMAL_RETURN)
	  system = SYSTEM_NORMAL_RETURN;
     else
	  system = SYSTEM_ERROR_RETURN;
     
     return(system);
     }

extern INT FormStructSysSamVectorSet(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqSysSamVectorSet(bind);
     datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

	  FreeStructSysSamVectorSet(bind);

	  out = MasterGetSysSamVectorSet(datmatmaster);
	  if(out == DATMAT_NORMAL_RETURN)
	       out = SYSTEM_NORMAL_RETURN;
	  else
	       out = SYSTEM_ERROR_RETURN;
	  }
     
     if(datmatmaster->SysSamVectorSetElement != 0)
	  if(out == SYSTEM_NORMAL_RETURN)
	       datmatmaster->SysSamVectorSetElement->ID = GetCurrentAge(bind);
	  else
	       datmatmaster->SysSamVectorSetElement->ID = GetOldestAge();
	  
     return(out);
     }

extern INT GetStructSysSamVectorSet(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     DatMatMaster *datmatmaster;
     INT out;
     
     out = GetPrereqSysSamVectorSet(bind);
     if(out == SYSTEM_NORMAL_RETURN)
	  {
	  datmatmaster = GetBoundStructure(bind,BIND_DATMATMASTER);
	  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
	  if(datmatmaster->SysSamVectorSetElement == 0)
	       out = FormStructSysSamVectorSet(bind);
	  }
     return(out);
     }

/****************************************************************************/
	 
