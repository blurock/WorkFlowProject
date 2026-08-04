#include "basic.h"

#if MSDOS
#include <malloc.h>
#endif

extern void FreeAlloc(void);
extern void StoreAddr(ULong addr,ULong size);
extern ULong FreeAddr(ULong addr);
extern void PrintAllocAddr(void);
extern void PrintAllocSummary(void);
extern void PrintMem(ULong m);
extern ULong totalmem, maxtotalmem,memcount;
extern ULong memprinted;


     
#define UNUSED  NULL
#define DELETED 1

#define ENTRY_FREE(e) ((e).addr==UNUSED || (e).addr==DELETED)
#define ENTRY_UNUSED(e) ((e).addr==UNUSED)
#define FREE_ENTRY(e) { (e).addr = DELETED; (e).size = 0;}

typedef struct mementry
{  long addr;
   long size;
} MemEntry;
   
static ULong totalmem, maxtotalmem,memcount;
static INT memprinted;

static MemEntry *mem;
static ULong    memlen;   

extern int DEBUGPRINT;

void *Malloc(size)
ULong size;
{  
   void *addr;

   if(size == 0) return(0);
   
   memcount++;
/*   if( !(memcount%1000)) printf("nth call:%d,%d\n",memcount,totalmem);*/

   addr = (void *)malloc(size);
   if( addr == NULL ) 
       Error(size,"Illegal Malloc");

   StoreAddr((ULong)addr, size);
   if(DEBUGPRINT != 0) printf("Malloc: (%d,%d)\n",addr,size);

   return(addr);
}
 

void *Calloc(nelem, elsize)
ULong nelem, elsize;
{
   void *addr;

   if(nelem == 0 || elsize == 0) return(0);
   memcount++;
/*   if( !(memcount%1000)) printf("nth call:%d,%d\n",memcount,totalmem);*/

   
   addr = (void *)calloc(nelem, elsize);
   if( addr == NULL ) 
       Error(nelem,"Illegal Calloc");

   StoreAddr((ULong)addr, nelem*elsize);
   if(DEBUGPRINT != 0)
         printf("Calloc: (%d,%d,%d)\n",addr,nelem,elsize);


   return(addr);
}


void Free(ptr)
void *ptr;
{
ULong size;
INT i;
char *ptr1;

   if(DEBUGPRINT != 0) printf("Free: (%d)\n",ptr);
   if(ptr !=0) 
       {
       size = FreeAddr((ULong)ptr);
       ptr1 = ptr;
       LOOPi(size)
           *ptr1++ = (char) -1;
       free(ptr);
       memcount--;
       }

}
 

void InitAlloc(len)
ULong len;
{  
   ULong i;
 
   mem = (MemEntry *)calloc(len,sizeof(MemEntry));
   memlen = len;
   totalmem = maxtotalmem = 0L; 
   memprinted = 0;

   for (i=0; i<len; i++) {
      mem[i].addr = UNUSED; 
      mem[i].size = 0;
   }
}
  

void FreeAlloc()
{
   free(mem);
}  

ULong max(ULong maxtotalmem, ULong totalmem)
{
     if(maxtotalmem >= totalmem)
         return(maxtotalmem);
     else
         return(totalmem);
}

void StoreAddr(addr,size)
ULong addr,size;
{  
   ULong s,i;

   i = addr%memlen;  
   s = i>0 ? i-1 : memlen-1;

   while (!ENTRY_FREE(mem[i]) && i != s) 
      i = (i+1)%memlen;

   if (i == s)
     printf ("Hashtable for MEM Watch full\n");
   else  
   {  mem[i].addr = addr;
      mem[i].size = size;

      totalmem += size;
      PrintMem(totalmem);
      maxtotalmem = max(maxtotalmem, totalmem);
   }
}


ULong FreeAddr(addr)
ULong addr;
{
   ULong s,i;
   ULong size;

   i = addr%memlen;  
   s = i>0 ? i-1 : memlen-1;

   while (mem[i].addr != addr && !ENTRY_UNUSED(mem[i]) && i != s) 
      i = (i+1)%memlen;
   
   size = 0;
   if (mem[i].addr == addr) 
   {  totalmem -= mem[i].size;
      size = mem[i].size;
      PrintMem(totalmem);
      FREE_ENTRY(mem[i]); 
   }
   else
     printf ("Illegal free %lx\n", addr);

   return(size);

}      


void PrintAllocSummary()
{
   printf("--------Maximum allocated memory: %d\n", maxtotalmem);

   if (totalmem!=0)
     printf("--------Memory not freed: %d\n", totalmem);
     printf("--------Total Nonfreed Calls: %d\n",memcount);
}

void PrintAllocAddr()
{
   ULong i;
      
   printf("*********************\n"); 
   printf("* Memory Statistics *\n");
   printf("*********************\n\n"); 

   printf("Maximum allocated memory: %d\n", maxtotalmem);

   if (totalmem!=0) {                        
     printf("Memory not freed: %d\n", totalmem);

     printf("\nAddr     Size\n");
     printf(  "-------------\n"); 
   
     for (i =0 ; i < memlen; i++)
       if (mem[i].size)
         printf("%lx %6d\n",mem[i].addr,mem[i].size);
   } 
   else  
      printf("All allocated memory cells freed.\n");
}  

int PrintAllocMem(INT kb)
{
/*     printf(" %d\n ",kb);*/
     return(1);
}      

void PrintMem(m)
ULong m;
{    
   INT kb; 

   kb = (m+1024/2)/1024;
   if (kb!=memprinted)
      if (PrintAllocMem(kb))
         memprinted = kb;
}

StorageBlock *StorageBlockInitialize(int size)
{
StorageBlock *name;

        name = AllocateStorageBlock;
        name->Block = Malloc(size);
        name->Size  = size;
     return(name);
}

void *StorageBlockAllocate(int size,StorageBlock *block) 
{
void *location;

/*        printf("Block: %10d, Size:%10d, Remaining:%10d\n",
                 block->Block,size,block->Size);*/
        location = block->Block;
        block->Size -= size;
        if( block->Size < 0 )
              Error(size,"StorageBlock Allocation Error");
        else
              block->Block += size;

     return(location);
}




