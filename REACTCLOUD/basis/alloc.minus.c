#include "basic.h"

#if MSDOS
#include <malloc.h>
#endif

extern void FreeAlloc(void);
extern void StoreAddr(ULong addr,ULong size);
extern void FreeAddr(ULong addr);
extern void PrintAllocAddr(void);
extern void PrintAllocSummary(void);
extern void PrintMem(ULong m);
extern ULong memprinted;


     
#define UNUSED	NULL
#define DELETED 1

#define ENTRY_FREE(e) ((e).addr==UNUSED || (e).addr==DELETED)
#define ENTRY_UNUSED(e) ((e).addr==UNUSED)
#define FREE_ENTRY(e) { (e).addr = DELETED; (e).size = 0;}

typedef struct mementry
{  long addr;
   long size;
} MemEntry;
   

void *Malloc(ULong size)
     {  
     char *pntr,*start;
     int i;
     
     if(size == 0)
	  return(0);
     else
	  {
	  pntr = start = malloc((unsigned int) size);
	  LOOPi(size)
	       *pntr = (char) -1;
	  
	  return((void *) start);
	  }
     }


void *Calloc(ULong nelem, ULong elsize)
     {
     int size,i;
     char *pntr,*start;
     
     if(nelem && elsize)
	  {
	  pntr = start = calloc((unsigned int) nelem, (unsigned int) elsize);
	  size = nelem*elsize;
	  LOOPi(size)
	       *pntr = (char) -1;
	  
	  return((void *) start);
	  }
     else
	  return(0);
     }


void Free(void *ptr)
     {
	  free(ptr);
     }
 
void Cfree(ptr)
void *ptr;
{
   free(ptr);
}


void InitAlloc(len)
ULong len;
{  
  return;
}
  

void FreeAlloc()
{
  return;
}  

void StoreAddr(addr,size)
ULong addr,size;
{  
return;
}


void FreeAddr(addr)
ULong addr;
{
return;
}


void PrintAllocSummary()
{
return;
}

void PrintAllocAddr()
{
return;
}  

int PrintAllocMem(INT kb)
{
     return(1);
}

void PrintMem(m)
ULong m;
{    
return;
}

StorageBlock *StorageBlockInitialize(int size)
{
StorageBlock *name;

        name = AllocateStorageBlock;
/*        name->Block = Malloc(size);*/
        name->Block = Malloc(8);
        name->Size  = size;
     return(name);
}

void *StorageBlockAllocate(int size,StorageBlock *block) 
{
void *location;

/*        printf("Block: %10d, Size:%10d, Remaining:%10d\n",
                 block->Block,size,block->Size);*/
/*        location = block->Block;*/
        location = Malloc(size);
        block->Size -= size;
        if( block->Size < 0 )
              Error(size,"StorageBlock Allocation Error");
        else
              block->Block += size;

     return(location);
}
