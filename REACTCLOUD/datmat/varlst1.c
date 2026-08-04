#include "basic.h"
#include "datmat0.h"

static SystemVariableList *DetermineVariableList(INT id, CHAR *name, 
						 FILE *file,
						 SysSamVectorSet *syssamvec);
extern INT MasterFreeSystemVariableList(DatMatMaster *master)
     {
     if(master->SystemVariablePairElement != 0)
	  {
	  FreeSystemVariablePair(master->SystemVariablePairElement);
	  Free(master->SystemVariablePairElement);
	  master->SystemVariablePairElement = 0;
	  }
     return(DATMAT_NORMAL_RETURN);
     }


extern CHAR *PrintStringSystemVariableList(CHAR *string,
					   CHAR *prefix,
					   INT *bufferleft,
					   SystemVariableList *list,
					   INT latex)
     {
     CHAR *line;
     VarNames *variables;
     INT i;
     
     line = AllocateString(LINELENGTH);

     if(latex)
       {
	 sprintf(line,"\\begin{center}\n");
	 string = PrintStringString(string,bufferleft,line);
	 sprintf(line,"\\begin{tabular}{|l|l|}\\hline\n");
	 string = PrintStringString(string,bufferleft,line);
	 sprintf(line,"\n");
	 string = PrintStringString(string,bufferleft,line);
       }
     
     if(list == 0)
	  {
     if(latex)
       {
       }
     else
       {
       }
     
	  sprintf(line,"Variable List Empty\n");
	  string = PrintStringString(string,bufferleft,line);
	  }
     else
	  {
     if(latex)
       {
       }
     else
       {
       }
     
	  sprintf(line,"%s : %5d %s\n",prefix,list->ID,list->Name);
	  string = PrintStringString(string,bufferleft,line);

	  variables = list->Variables;
	  sprintf(line,"%s :",prefix);
	  string = PrintStringString(string,bufferleft,line);
	  LOOPi(list->NumberOfVariables)
	       {
	       sprintf(line, "%-15s ",
		       variables->Variable->Name);
	       string = PrintStringString(string,bufferleft,line);
	       if( !((i+ 1) % 4) ) 
		    {
		    sprintf(line,"\n%s :",prefix);
		    string = PrintStringString(string,bufferleft,line);
		    }
	       
	       variables++;
	       }
	  sprintf(line,"\n");
	  string = PrintStringString(string,bufferleft,line);
	  }
     Free(line);
     return(string);
     }

extern INT MasterGetGoalVarList(DatMatMaster *master)
     {
     INT done;
     CHAR *filename;
     FILE *file;
     SystemVariablePair *pair;
     
     done = MasterGetSysSamVectorSet(master);

     if(done != DATMAT_NORMAL_RETURN)
	  done = DATMAT_ERROR_RETURN;
     else
	  {
	  pair = master->SystemVariablePairElement;
	  if(pair->Goals != 0)
	       {
	       FreeSystemVariableList(pair->Goals);
	       Free(pair->Goals);
	       pair->Goals = 0;
	       }

	  filename = ProduceFileName(master->Constants->VarDirectory,
				     master->Constants->GoalList,
				     "gl");
	  file = OpenReadFile(filename,"",RECOVER);
	  Free(filename);
	  
	  if(file == 0)
	       done = DATMAT_ERROR_RETURN;
	  else
	       {
	       pair->Goals =
		    DetermineVariableList(master->ID,master->Name,
					  file,master->SysSamVectorSetElement);
	       if(pair->Goals == 0)
		    done = DATMAT_ERROR_RETURN;
	       fclose(file);
	       }
	  }
     
     return(done);
     }     

extern INT MasterGetDescrVarList(DatMatMaster *master)
     {
     FILE *file;
     INT done;
     CHAR *filename;
     SystemVariablePair *pair;

     done = MasterGetSysSamVectorSet(master);

     if(done != DATMAT_NORMAL_RETURN)
	  done = DATMAT_ERROR_RETURN;
     else
	  {
	  pair = master->SystemVariablePairElement;
	  if(pair->Descriptors != 0)
	       {
	       FreeSystemVariableList(pair->Descriptors );
	       Free(pair->Descriptors );
	       pair->Descriptors  = 0;
	       }
	  
	  filename = ProduceFileName(master->Constants->VarDirectory,
				     master->Constants->DescrList,
				     "ds");
	  file = OpenReadFile(filename,"",RECOVER);
	  Free(filename);
	  
	  if(file == 0)
	       done = DATMAT_ERROR_RETURN;
	  else
	       {
	       pair->Descriptors  =
		    DetermineVariableList(master->ID,master->Name,
					  file,master->SysSamVectorSetElement);
	       if(pair->Descriptors  == 0)
		    done = DATMAT_ERROR_RETURN;
	       
	       fclose(file);
	       }
	  }
     
     return(done);
     }

static SystemVariableList *DetermineVariableList(INT id, CHAR *name,
						 FILE *file,
						 SysSamVectorSet *syssamvec)
     {
     INT count,i,varnum;
     VarNames *info,*start;
     CHAR *line, *done,*strname,*strinfo;
     SystemVariableList *sysvarlist;
     
     line = AllocateString(LINELENGTH);
     strname = AllocateString(LINELENGTH);
     
     info = start = 
	  AllocArrayVarNames(MAXNUMBEROFVARIABLES);
     
     done = NextNonBlankLine(file,line);
     count = 0;
     
     while(done != 0)
          {
          if( count >= MAXNUMBEROFVARIABLES )
               {
               Error(count,"Maximum Number Of System Variables Exceeded");
               }
          strinfo = IsolateNextWord(done, strname, BLANK, LINELENGTH);

          varnum = FindSystemVariableName(syssamvec,strname);
          
	  if(varnum != -1)
	       {
	       info = CreateVarNames(info,id,name,
				     0,
				     varnum,
				     0);
	       
	       info->Information = AllocateVarInfo;
	       CreateVarInfo(info->Information,
			     count,strname,
			     strlen(strinfo)+1,
			     strinfo);
	       
	       info->Variable = AllocateVarName;
	       CreateVarName(info->Variable,
			     count,strname,
			     strlen(strname)+1,
			     strname);
	       
	       count++;
	       info++;
	       }
	  

          done = NextNonBlankLine(file,line);
	  if(done !=  0)
	       if( !strncmp(done,"DONE",4) ) 
		    done = 0;
          }

     sysvarlist = AllocateSystemVariableList;

     CreateSystemVariableList(sysvarlist,
                              id,name,
                              count,
                              start);
     info = start;
     LOOPi(count)
          FreeVarNames(info++);
     Free(start);
     Free(line);
     Free(strname);
     
     return(sysvarlist);
}


