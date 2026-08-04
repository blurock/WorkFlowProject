#include "basic.h"
#include "comlib.h"

extern void StringBaseArgumentType(BaseArgumentType *base,
				   CHAR *string)
     {
     if(base == 0) 
	  strcpy(string,"<No Base Type>");
     else
	  switch(base->Type)
	       {
	  case INT_VALUE:
	       sprintf(string,"%d",base->Integer_Value);
	       break;
	  case FLOAT_VALUE:
	       sprintf(string,"%f",base->Float_Value);
	       break;
	  case TITLE:
	       sprintf(string,"%s",base->String_Value);
	       break;
	       }
     }

extern void StringVariableName(VariableName *name, 
				CHAR *string)
     {
     if(name == 0) 
	  strcpy(string,"<No Name>");
     else
	  sprintf(string,"%s",name->Name);
     }

extern void StringFunctionInfo(FunctionInfo *func,
			       CHAR *string)
     {
     if(func == 0) 
	  strcpy(string,"<No Function>");
     else
	  sprintf(string,"%s",func->Name);
     }

extern void StringTitleInfo(TitleInfo *title,
			       CHAR *string)
     {
     if(title == 0) 
	  strcpy(string,"<No Title>");
     else 
	  sprintf(string,"%s",title->Name);
     }

extern void StringKeyWordInfo(KeyWordInfo *key,
			      CHAR *string)
     {
     CHAR *flagname;
     
     if(key == 0) 
     StringVariableName(key->KeyFlagName,string);
     flagname = CopyString(string);
     sprintf(string,"KeyWordInfo: %d:%s<%s>",key->ID,key->Name,flagname);
     Free(flagname);
     }

extern void StringSysLstArgumentInfo(SysLstArgumentInfo *argue,
				      CHAR *string)
     {
     CHAR *new;
     
     if(argue == 0) return;
     
     StringVariableName(argue->SysLstKey,string);
     new = CopyString(string);
     sprintf(string,"SysLst: %s<%s>",argue->Name,new);
     Free(new);
     }

