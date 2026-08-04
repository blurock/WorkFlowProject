#ifndef DEFINES_H
#define DEFINES_H

#define BYTE char
#define CHAR char
#define INT  int
#define FLOAT float
#define LOG  int
#define SYMBOL char *
#define ULong INT
#define FLAG char
#define NAME CHAR *
typedef void *VOID;
/*-----------------------------
Added from NeXt
*/
#define uint unsigned int

#define ALIGNED

#ifndef INT_MAX
#define INT_MAX 32767
#endif
#ifndef FLT_MAX
#define FLT_MAX 1E+37
#endif

#define PREDICATESTRINGLENGTH 5000
#define LINELENGTH 500
#define ENDOFLINE  '\n'
#define CARRIAGERETURN '\r'
#define BLANK ' '
#define ENDOFSTRING '\0'
#define LEFTBRACKET '['
#define RIGHTBRACKET ']'
#define COLON ':'
#define COMMA ','
#define DASH  '-'

#define NO_STRUCTURE_CODE   INT_MAX
#define STRUCTURE_READ      0
extern INT NoStructureCode;


/* Error Definitions */

#define DimError 100
#define IllegalInput 101

/* Debug Definitions */

extern int DEBUGPRINT;
#define DEBUG0 0
#define DEBUG1 1
#define DEBUG2 2
#define DEBUG3 3

#define FATAL -1
#define RECOVER 1
#define IGNORE              0
#define NO_ERROR            0

#define SYSTEM_NORMAL_RETURN   0
#define SYSTEM_ERROR_RETURN    1
#define SYSTEM_FATAL_RETURN    2

#define AllocateVOID (VOID) Malloc(sizeof(VOID))
#define AllocArrayVOID(n) (VOID) Calloc(n,sizeof(VOID))
#define FreeVOID(obj) Free(0)
#define PrintVOID(obj) printf("Void Variable\n")
/* #define CopyFullVOID(new,old) memcpy((VOID) new,(VOID) old,sizeof(VOID))*/
#define CopyFullVOID(new,old) printf("Trying to copy void structure");
#define VOIDSize sizeof(VOID)
#define xdr_VOID xdr_int
#define xdr_FILE xdr_int

#define xdr_CHAR xdr_char

#define NAMESIZE 80
#define CopyFullNAME(new,old) memcpy(*(new),*(old),strlen(old)+1)
#define PrintNAME(obj) printf("%s\n",*(obj))
#define FreeNAME(obj) Free(*(obj));Free((obj))
#define CopyNAME(name) (CHAR *) CopyString(name)

#define AllocateString(n) (char *) Malloc(n)
#define AllocArrayCharPntr(n) (char **) Calloc(n,sizeof(char *))
#define STRING CHAR
#define AllocateSTRING AllocateString(LINELENGTH)
/*
#define CopyFullSTRING(new,old) new = CopyString(old)
*/
#define CopyFullSTRING(new,old) memcpy(new,old,strlen(old)+1)
#define FreeSTRING(str) Free(str)
#define PrintSTRING(str) printf("%s",str)
#define STRINGSize sizeof(char *)
#define xdr_STRING xdr_wrapstring

typedef struct storeblk {
      BYTE *Block;
      int Size;
      } StorageBlock;

#define StorageBlockSize  sizeof(StorageBlock)
#define AllocateStorageBlock (StorageBlock *) Malloc(StorageBlockSize)
    

extern StorageBlock *StorageBlockInitialize(int size);
extern void *StorageBlockAllocate(int size,StorageBlock *block);

#define BlockAlloc(Type,Size,Name,Blk,Remaining)   \
        Name = Type Blk;                           \
        if((Remaining -= Size) < 0)                \
             Error(DimError,"BlockAlloc Error");   \
        else                                       \
             Blk += Size;

#define BlockAllocInteger(Name,Blk,Remaining)          \
        BlockAlloc((INT),IntSize,Name,Blk,Remaining)

#define BlockAllocIntArray(Name,Blk,Remaining,ArrSize)            \
        BlockAlloc((INT *),(ArrSize * IntSize),Name,Blk,Remaining)


/* Standard Loops */

#define LOOPi(Num) for(i=0; i < Num; i++)
#define LOOPj(Num) for(j=0; j<Num ; j++)
#define LOOPk(Num) for(k=0; k<Num ; k++)

/* Copy Routines */

#define COPYi(obj1,obj2,Num) LOOPi(Num) *obj1++ = *obj2++


#define ONE 1
#define TWO 2

#endif




