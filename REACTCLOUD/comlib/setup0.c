#include "basic.h"
#include "comlib.h"

#include "comlib/runtime.c"
#include "comlib/commnd.c"
     
static SysLstArgumentSet *MergeSysLstArgumentSet(SysLstArgumentSet *set1,
						 SysLstArgumentSet *set2);
static KeyArgumentSet *MergeKeyArgumentSet(KeyArgumentSet *set1,
					   KeyArgumentSet *set2);
static KeyWordSetInfo *MergeKeyWordSetInfo(KeyWordSetInfo *set1,
					   KeyWordSetInfo *set2);

/*****************************************************************************/
/* Merge Two CommandInfo structures
     The following are taken from the first structure listed
                FlagName
		Function
		Comment
*/
extern CommandInfo *MergeTwoCommandInfo(CommandInfo *new,
					CommandInfo *com1,
					CommandInfo *com2)
     {
     CommandInfo *newsubs, *subs;
     INT i,num;
     
     if(com1 == 0 && com2 == 0 ) return(0);
     if(com1 == 0)
	  {
	  CopyFullCommandInfo(new,com2);
	  return(new);
	  }
     
     if(com2 == 0)
	  {
	  CopyFullCommandInfo(new,com1);
	  return(new);
	  }
     

     num = com1->NumSubCommands + com2->NumSubCommands;
     
     CreateCommandInfo(new, com1->ID, com1->Name,
		       com1->FlagName,
		       com1->Function,
		       com1->Comment,
		       0,0,0,0,0,0,
		       num,0);
     
     new->Arguments = MergeArgumentSetInfo(com1->Arguments,
					    com2->Arguments);
     
     new->Keys = MergeKeyArgumentSet(com1->Keys,
				      com2->Keys);
     
     new->SysLstSet = MergeSysLstArgumentSet(com1->SysLstSet,
					      com2->SysLstSet);
     
     new->Output = MergeSysLstArgumentSet(com1->Output,
					   com2->Output);
     
     new->KeySetInfo = MergeKeyWordSetInfo(com1->KeySetInfo,
					       com2->KeySetInfo);
     
     new->Checks = MergeSysLstArgumentSet(com1->Checks,
					   com2->Checks);
     
     newsubs = new->SubCommands;

     subs = com1->SubCommands;
     LOOPi(com1->NumSubCommands)
	  CopyFullCommandInfo(newsubs++,subs++);
	  
     subs = com2->SubCommands;
     LOOPi(com2->NumSubCommands)
	  CopyFullCommandInfo(newsubs++,subs++);
	  
     return(new);
     }

static SysLstArgumentSet *MergeSysLstArgumentSet(SysLstArgumentSet *set1,
						 SysLstArgumentSet *set2)
     {
     INT i,num;
     SysLstArgumentSet *newset;
     SysLstArgumentInfo *newargument, *oldargument;
     
     if(set1 == 0 && set2 == 0 ) return(0);
     newset = AllocateSysLstArgumentSet;
     if(set1 == 0)
	  {
	  CopyFullSysLstArgumentSet(newset,set2);
	  return(newset);
	  }
     
     if(set2 == 0)
	  {
	  CopyFullSysLstArgumentSet(newset,set1);
	  return(newset);
	  }
     
     
     num = set1->NumSysLst + set2->NumSysLst;

     CreateSysLstArgumentSet(newset, set2->ID, set2->Name,
			   num,0);

     newargument = newset->SysLstArguments;
     oldargument = set1->SysLstArguments;
     LOOPi(set1->NumSysLst)
	  {
	  CopyFullSysLstArgumentInfo(newargument,oldargument);
	  oldargument++;
	  newargument++;
	  }
     
     oldargument = set2->SysLstArguments;
     LOOPi(set2->NumSysLst)
	  {
	  CopyFullSysLstArgumentInfo(newargument,oldargument);
	  oldargument++;
	  newargument++;
	  }
     return(newset);
     }

static KeyArgumentSet *MergeKeyArgumentSet(KeyArgumentSet *set1,
					   KeyArgumentSet *set2)
     {
     INT i,num;
     KeyArgumentSet *newset;
     KeyArgumentInfo *newKeyArgument, *oldKeyArgument;
     
     if(set1 == 0 && set2 == 0 ) return(0);
     newset = AllocateKeyArgumentSet;
     if(set1 == 0)
	  {
	  CopyFullKeyArgumentSet(newset,set2);
	  return(newset);
	  }
     
     if(set2 == 0)
	  {
	  CopyFullKeyArgumentSet(newset,set1);
	  return(newset);
	  }
     
     num = set1->NumberOfKeys + set2->NumberOfKeys;

     CreateKeyArgumentSet(newset, set1->ID, set1->Name,
			   num,0);

     newKeyArgument = newset->KeyArguments;
     oldKeyArgument = set1->KeyArguments;
     LOOPi(set1->NumberOfKeys)
	  {
	  CopyFullKeyArgumentInfo(newKeyArgument,oldKeyArgument);
	  oldKeyArgument++;
	  newKeyArgument++;
	  }
     
     oldKeyArgument = set2->KeyArguments;
     LOOPi(set2->NumberOfKeys)
	  {
	  CopyFullKeyArgumentInfo(newKeyArgument,oldKeyArgument);
	  oldKeyArgument++;
	  newKeyArgument++;
	  }
     return(newset);
     }

static KeyWordSetInfo *MergeKeyWordSetInfo(KeyWordSetInfo *set1,
					   KeyWordSetInfo *set2)
     {
     INT i,num;
     KeyWordSetInfo *newset;
     KeyWordInfo *newkey, *oldkey;
     
     if(set1 == 0 && set2 == 0 ) return(0);
     newset = AllocateKeyWordSetInfo;
     if(set1 == 0)
	  {
	  CopyFullKeyWordSetInfo(newset,set2);
	  return(newset);
	  }
     
     if(set2 == 0)
	  {
	  CopyFullKeyWordSetInfo(newset,set1);
	  return(newset);
	  }
     
     
     num = set1->NumberOfKeys + set2->NumberOfKeys;

     CreateKeyWordSetInfo(newset, set1->ID, set1->Name,
			   num,0);

     newkey = newset->Keys;
     oldkey = set1->Keys;
     LOOPi(set1->NumberOfKeys)
	  {
	  CopyFullKeyWordInfo(newkey,oldkey);
	  oldkey++;
	  newkey++;
	  }
     
     oldkey = set2->Keys;
     LOOPi(set2->NumberOfKeys)
	  {
	  CopyFullKeyWordInfo(newkey,oldkey);
	  oldkey++;
	  newkey++;
	  }
     return(newset);
     }

extern FunctionList *MergeFunctionInfo(INT id, CHAR *name,
				       FunctionList *list1,
				       FunctionList *list2)
     {
     FunctionInfo *info,*newinfo;
     FunctionList *new;
     INT i;
     
     new = AllocateFunctionList;
     CreateFunctionList(new,id,name,
			list1->NumberOfFunctions + list2->NumberOfFunctions,
			0);
     
     newinfo = new->Function;
     info = list1->Function;
     LOOPi(list1->NumberOfFunctions)
	  CopyFullFunctionInfo(newinfo++,info++);
     info = list2->Function;
     LOOPi(list2->NumberOfFunctions)
	  CopyFullFunctionInfo(newinfo++,info++);
     return(new);
     }

     
     
