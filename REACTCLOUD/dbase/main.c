#include "basic.h"
#include <stdlib.h>
#include "dbase.h"

#include "example.h"

#include "example.c"

static DbaseKeyword *BuildExampleKey(Example1 *example);
static Example1 *BuildAnExampleElement(INT id, CHAR *name);
static void PrintPrettyExample1(Example1 *example);
static INT InitializeExampleDatabase(DbaseMaster *dbmaster);


static DbaseMaster *InitializeDbaseMaster(CHAR *name);

int main(int argc, char *argv[])
     {
     DbaseMaster *dbasemaster;
     DbaseKeyword *key1;
     Example1 *example1,*fexample1;
     INT i,id;
     
     dbasemaster = InitializeDbaseMaster("example");
     InitializeExampleDatabase(dbasemaster);
     
     srandom(0);
     
     printf("Create Database\n");
     CreateDataBase(dbasemaster->Databases);

     LOOPi(100)
	  {
/*	  printf("Create Element\n");*/
	  example1 = BuildAnExampleElement(i,"ex1");
	  key1 = BuildExampleKey(example1);
/*	  PrintPrettyExample1(example1);*/
	  if(i == 80)
	       PrintPrettyExample1(example1);
	  

/*	  printf("Convert Element\n");*/
	  StoreElement((VOID *) example1,key1,GDBM_REPLACE,dbasemaster->Databases);


/*	  printf("Retrieve Element\n");*/
	  fexample1 = AllocateExample1;
	  FetchElement((VOID *) fexample1,key1,dbasemaster->Databases);
/*	  PrintPrettyExample1(fexample1);*/
	  fflush(stdout);
	  
	  FreeExample1(example1);
	  Free(example1);
	  FreeExample1(fexample1);
	  Free(fexample1);
	  FreeDbaseKeyword(key1);
	  Free(key1);
	  }

     ResetSearchKeys(dbasemaster->Databases);
     ProduceDataBaseSearchKeys(dbasemaster->Databases);

     id = 80;
     key1 = AllocateDbaseKeyword;
     CreateDbaseKeyword(key1,0,0,INTSize,(VOID) &(id));

     
     example1 = BuildAnExampleElement(i,"ex1");

     printf("Write Key\n");
     WriteAllDBSearchKeys(dbasemaster->Databases);
     printf("Delete Key\n");
     DeleteKeyFromMemory(0,dbasemaster->Databases);
     printf("Read Key\n");
     ReadKeyIntoMemory(0,dbasemaster->Databases);
     printf("Search Key\n");
     SearchKeyElement(0,example1,key1,dbasemaster->Databases);
     PrintPrettyExample1(example1);

     return(0);
     }

/***********************************************************************
                       InitializeDbaseMaster
************************************************************************/
static DbaseMaster *InitializeDbaseMaster(CHAR *name)
     {
     DbaseMaster *dbasemaster;
     
     dbasemaster = AllocateDbaseMaster;
     CreateDbaseMaster(dbasemaster,0,name,
		       0,0);
     return(dbasemaster);
     }

static void InsertExampleKey(VOID element,DbaseKeyword *key)
     {
     Example1 *ele;
     
     ele = (Example1 *) element;
     key->Name = 0;
     key->ID = ele->ID;
     key->Size = INTSize;
     key->KeyWord = (VOID) AllocateINT;
     memcpy((char *) key->KeyWord, (char *) &(ele->ID), (unsigned int) key->Size);
     }

static void FillInExampleKeys(DataBaseInformation *dinfo)
     {
     SetOfSearchKeyTypes *keytypes;
     SearchKeyInfo *keyinfo;
     
     keytypes = dinfo->Keys = AllocateSetOfSearchKeyTypes;
     
     CreateSetOfSearchKeyTypes(keytypes,0,0,
			   4,4,0);
     keytypes->NumberOfKeyTypes = 1;
     
     keyinfo = keytypes->KeyTypes;
     CreateSearchKeyInfo(keyinfo,0,0,
			 20,10,0,InsertExampleKey);
     }

static INT InitializeExampleDatabase(DbaseMaster *dbmaster)
     {
     DataBaseInformation *info;

     CreateDbaseMaster(dbmaster,dbmaster->ID,dbmaster->Name,
		       1,0);
     
     info = dbmaster->Databases;
     
     CreateDataBaseInformation(info,0,"Example1",
			       "example1",
			       ".",
			       WriteBinExample1,
			       ReadBinExample1,
			       0,0,AllocExample1,FreeExample1);
     FillInExampleKeys(info);
     
     return(SYSTEM_NORMAL_RETURN);
     }



static DbaseKeyword *BuildExampleKey(Example1 *example)
     {
     DbaseKeyword *key;
     
     key = AllocateDbaseKeyword;
     CreateDbaseKeyword(key,example->ID,example->Name,
			sizeof(INT),
			(CHAR *) &(example->ID));
     
     return(key);
     }

static Example1 *BuildAnExampleElement(INT id, CHAR *name)
     {
     Example1 *example;
     INT num,i,*numbers;
     
     num = rand() % 20;
     
     example = AllocateExample1;
     CreateExample1(example,id,name,
		    num,0);

     numbers = example->Integers;
     LOOPi(num)
	  {
	  *numbers = rand() % 100;
	  numbers++;
	  }
     return(example);
     }
static void PrintPrettyExample1(Example1 *example)
     {
     INT i,*numbers;
     
     printf("Example: %5d %s (%5d elements)\n",
	    example->ID,example->Name,example->NumberOfIntegers);

     numbers = example->Integers;
     LOOPi(example->NumberOfIntegers)
	  {
	  if(i != 0)
	       printf(" ,");
	  
	  printf("%5d",*numbers++);
	  }
     printf("\n");
     
     }

     
