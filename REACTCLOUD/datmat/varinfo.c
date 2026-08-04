#include "basic.h"
#include "datmat0.h"

static CHAR *RemoveVariableInformation(CHAR *infotype,
				       CHAR *total);

#define VAR_DELIMITER ';'

/************************************************************************
  Variable Information
    In the Variable information, entities of the form:

         Type1(info1);Type2(info2);Type3(info3)

    are expected, where
      
       Type1,Type2,Type3   -  the information types
       info1,info1,info1   -  the corresponding information

  the delimiter is a semi-colon.

The information is retrieved via the name or the id of the variable.
   if the variable name (ASCII) is zero then the id is used.

Operations:
      ReplaceSpecificVariableInformation 
      GetSpecificVariableInformation
*************************************************************************/


/* ReplaceSpecificVariableInformation
      varname, id - The variable name or the id .  id used only
                    if varname is zero.
      infotype    - The information to replace
      info        - The information to replace (including the type
                    specification).  If zero, then the information
                    is just deleted.
      master      - The DatMatMaster

      No Return value
*/
extern void ReplaceSpecificVariableInformation(CHAR *var, INT id,
					      CHAR *infotype,
					      CHAR *info,
					      DatMatMaster *master)
     {
     CHAR *old,*new,*plus;
     INT length;
     VarNames *varname;
     
     varname = 
	  FindVariableInSystemVariablePair(var,id,
					   master->SystemVariablePairElement);
     
     if(varname != 0)
	  {
	  old = varname->Information->Info;
	  new = RemoveVariableInformation(infotype,old);
	  if(info != 0)
	       {
	       plus = AllocateString(strlen(new) + strlen(info) + 2);
	       strcat(plus,info);
	       Free(info);
	       }
	  else
	       plus = new;
	  varname->Information->Info = plus;
	  }
     }

/* GetSpecificVariableInformation
      varname, id - The variable name or the id .  id used only
                    if varname is zero.
      infotype    - The information to replace
      master      - The DatMatMaster

      RETURN      - The character string of the specific information
                    including the info type.
*/
extern CHAR *GetSpecificVariableInformation(CHAR *varname, INT id,
					    CHAR *infotype,
					    DatMatMaster *master)
     {
     CHAR *total,*info,*out;
     INT length;
     
     total = GetVariableListInfo(varname,id,master);
     length = strlen(infotype);
     if(total != 0)
	  {
	  out = 0;
	  info = AllocateString(LINELENGTH);
	  while(strlen(total) != 0 && out == 0)
	       {
	       total = IsolateNextWord(total,info,VAR_DELIMITER,LINELENGTH);
	       if(!strncmp(info,infotype,length))
		    out = CopyString(info);
	       }
	  Free(info);
	  }
     else
	  out = 0;

     return(out);
     }
	  

extern CHAR *GetVariableListInfo(CHAR *var, INT id,
			   DatMatMaster *master)
     {
     CHAR *info;
     VarNames *varname;
     
     varname = 
	  FindVariableInSystemVariablePair(var,id,
					   master->SystemVariablePairElement);
     
     if(varname == 0)
	  info = 0;
     else
	  info = CopyString(varname->Information->Info);
     return(info);
     }




static CHAR *RemoveVariableInformation(CHAR *infotype,
				       CHAR *total)
     {
     CHAR *string,*start,*info;
     INT length;
     
     string = start = AllocateString(LINELENGTH);
     length = strlen(infotype);
     info = AllocateString(LINELENGTH);
     while(strlen(total) != 0)
	  {
	  total = IsolateNextWord(total,info,VAR_DELIMITER,LINELENGTH);
	  if(strncmp(info,infotype,length))
	       string = strcat(string,info);
	  }
     Free(info);
     return(start);
     }


	  
