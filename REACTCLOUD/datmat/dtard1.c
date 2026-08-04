#include "basic.h"
#include "datmat0.h"

/********************************************************************************/
/* Command Routines
*/

extern INT MasterGetSysSamVectorSet(DatMatMaster *master)
     {
     FILE *file;
     CHAR *filename;
     INT debug, max,error;
     
     max   = master->Constants->MaxNames;
     debug = master->Constants->ReadDebug;
     error = DATMAT_NORMAL_RETURN;
     
     if(master->SysSamVectorSetElement == 0)
	  {
	  filename = ProduceFileName(master->Constants->DataDirectory,
				     master->Constants->ControlFile,
				     "ctl");
	  file = OpenReadFile(filename,"",RECOVER);
	  Free(filename);
	  
	  if(file == 0)
	       error = DATMAT_ERROR_RETURN;
	  else
	       {
	       master->SysSamVectorSetElement = 
                    ReadSysSamVectorSet(file,debug,max);
	       if(master->SysSamVectorSetElement == 0)
		    error = DATMAT_ERROR_RETURN;
	       fclose(file);
	       }
	  }
     return(error);
     }

extern INT MasterFreeSysSamVectorSet(DatMatMaster *master)
     {
     if(master->SysSamVectorSetElement != 0)
	  {
	  FreeSysSamVectorSet(master->SysSamVectorSetElement);
          Free(master->SysSamVectorSetElement);
	  master->SysSamVectorSetElement = 0;
	  }
     return(DATMAT_NORMAL_RETURN);
     }

extern CHAR *PrintStringSysSamVectorSet(CHAR *out, CHAR *prefix,
					INT *bufferleft,
					SysSamVectorSet *syssamset,
					INT latex)
     {
     SysSamVector *sample;
     INT i,n;
     CHAR *string;
     
     if(syssamset == 0)
	  {
	  out = PrintStringString(out,bufferleft,"No Data Set\n");
	  }
     else
	  {
	    string = AllocateString(LINELENGTH);
	    if(latex)
	      {
		sprintf(string,"\\begin{center}\n");
		string = PrintStringString(string,bufferleft,string);
		sprintf(string,"{\\bf %s }\\\\\n",syssamset->Name);
		string = PrintStringString(string,bufferleft,string);
		sprintf(string,"\\begin{tabular}{|l|l|l|l|}\\hline\n");
		string = PrintStringString(string,bufferleft,string);
		sprintf(string,"# & Name & Total & Total Missing\\hline\n");
		string = PrintStringString(string,bufferleft,string);
	      }
	    else
	      {
		out = PrintStringString(out,bufferleft,"Data Set Information\n");
		sprintf(string,"Name: %20s   ",syssamset->Name);
		out = PrintStringString(out,bufferleft,string);
		sprintf(string,"%5d Variables\n",syssamset->NumSystemSamples);
		out = PrintStringString(out,bufferleft,string);
		sprintf(string,"  #  Name                Total     Total Missing\n");
		out = PrintStringString(out,bufferleft,string);
		sprintf(string,"------------------------------------------------\n");
		out = PrintStringString(out,bufferleft,string);
	      }
	  
	  sample = syssamset->Sets;
	  LOOPi(syssamset->NumSystemSamples)
	       {
	       n = NumberInBaseVector(sample->Data);
	       if(latex)
		 {
		   sprintf(string,"%4d & %20s & %10d & %10d\\\\\n",i,sample->Name,n,sample->NumNotMissing);
		   out = PrintStringString(out,bufferleft,string);
		 }
	       else
		 {
		   sprintf(string,"%4d:%20s%10d%10d\n",i,sample->Name,n,sample->NumNotMissing);
		   out = PrintStringString(out,bufferleft,string);
		 }
	    
	       sample++;
	       }
	    if(latex)
	      {
		sprintf(string,"\\hline\n");
		out = PrintStringString(out,bufferleft,string);
		sprintf(string,"\\end{tabular}\n");
		out = PrintStringString(out,bufferleft,string);
		sprintf(string,"\\end{center}\n");
		out = PrintStringString(out,bufferleft,string);
	      }
	    else
	      {
	  sprintf(string,"------------------------------------------------\n");
	  out = PrintStringString(out,bufferleft,string);
	      }
	    
	  Free(string);
	  }
     return(out);
     }



