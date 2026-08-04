#include "basic.h"
#include "datmat0.h"

#include "datmat/varlst.c"

extern VarNames *FindVariableInSystemVariablePair(CHAR *var, INT id,
						  SystemVariablePair *pair)
     {
     SystemVariableList *varlist;
     VarNames *varname;
     CHAR *string;
     
     varlist = pair->Goals;
     if(var == 0)
	  varname = FindVarNamesFromID(id,varlist);
     else
	  varname = FindVarNamesFromName(var,varlist);
     
     if(varname == 0)
	  {
	  varlist = pair->Descriptors;
	  if(var == 0)
	       varname = FindVarNamesFromID(id,varlist);
	  else
	       varname = FindVarNamesFromName(var,varlist);
	  }

     return(varname);
     }
     

extern VarNames *FindVarNamesFromName(CHAR *var,
				      SystemVariableList *varlist)
     {
     VarNames *varname,*done;
     INT count;
     
     varname = varlist->Variables;
     count = 0;
     done = 0;
     while(count < varlist->NumberOfVariables &&
	   done == 0)
	  {
	  if(!strcmp(var,varname->Variable->Variable))
	       done = varname;
	  varname++;
	  count++;
	  }
     return(done);
     }

extern VarNames *FindVarNamesFromID(INT varid,
				    SystemVariableList *varlist)
     {
     VarNames *varname,*done;
     INT count;
     
     varname = varlist->Variables;
     count = 0;
     done = 0;
     while(count < varlist->NumberOfVariables &&
	   done == 0)
	  {
	  if(varid == varname->Number)
	       done = varname;
	  varname++;
	  }
     return(done);
     }
     

