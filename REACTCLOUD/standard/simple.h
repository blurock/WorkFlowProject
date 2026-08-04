#define INTSize sizeof(INT)
#define AllocateINT (INT *) Malloc(INTSize)
#define AllocArrayINT(n) (INT *) Calloc(n,INTSize)
#define INTPntrSize sizeof(INT **)
#define AllocPntrArrayINT(n) (INT **) Calloc(n,INTPntrSize)
#define SingCopyINT(out,in) memcpy(out,in,INTSize)
#define FreeINT Free
#define CopyFullINT SingCopyINT
#define PrintINT(ptr)      printf("%d\n",*ptr)
#define WriteBinINT(ptr,file)\
          WriteBin(ptr,INTSize,file)

#define ReadBinINT(new,file)\
          ReadBin(new,INTSize,file)

#define FLOATSize sizeof(FLOAT)
#define AllocateFLOAT (FLOAT *) Malloc(FLOATSize)
#define AllocArrayFLOAT(n) (FLOAT *) Calloc(n,FLOATSize)
#define FLOATPntrSize sizeof(FLOAT **)
#define AllocPntrArrayFLOAT(n) (FLOAT **) Calloc(n,FLOATPntrSize)
#define SingCopyFLOAT(out,in) memcpy(out,in,FLOATSize)
#define FreeFLOAT Free
#define CopyFullFLOAT SingCopyFLOAT
#define PrintFLOAT(ptr)      printf("%f\n",*ptr)
#define WriteBinFLOAT(ptr,file)\
          WriteBin(ptr,FLOATSize,file)

#define ReadBinFLOAT(new,file)\
          ReadBin(new,FLOATSize,file)

#define CHARSize sizeof(CHAR)
#define AllocateCHAR (CHAR *) Malloc(CHARSize)
#define AllocArrayCHAR(n) (CHAR *) Calloc(n,CHARSize)
#define CHARPntrSize sizeof(CHAR **)
#define AllocPntrArrayCHAR(n) (CHAR **) Calloc(n,CHARPntrSize)
#define SingCopyCHAR(out,in) memcpy(out,in,CHARSize)
#define FreeCHAR Free
#define CopyFullCHAR SingCopyCHAR
#define PrintCHAR(ptr)      printf("%c\n",*ptr)
#define WriteBinCHAR(ptr,file)\
          WriteBin(ptr,CHARSize,file)

#define ReadBinCHAR(new,file)\
          ReadBin(new,CHARSize,file)

#define BYTESize sizeof(BYTE)
#define AllocateBYTE (BYTE *) Malloc(BYTESize)
#define AllocArrayBYTE(n) (BYTE *) Calloc(n,BYTESize)
#define BYTEPntrSize sizeof(BYTE **)
#define AllocPntrArrayBYTE(n) (BYTE **) Calloc(n,BYTEPntrSize)
#define SingCopyBYTE(out,in) memcpy(out,in,BYTESize)
#define FreeBYTE Free
#define CopyFullBYTE SingCopyBYTE
#define PrintBYTE(ptr)      printf("%d\n",*ptr)
#define WriteBinBYTE(ptr,file)\
          WriteBin(ptr,BYTESize,file)

#define ReadBinBYTE(new,file)\
          ReadBin(new,BYTESize,file)

#define FILESize sizeof(FILE)
#define AllocateFILE (FILE *) Malloc(FILESize)
#define AllocArrayFILE(n) (FILE *) Calloc(n,FILESize)
#define FILEPntrSize sizeof(FILE **)
#define AllocPntrArrayFILE(n) (FILE **) Calloc(n,FILEPntrSize)
#define SingCopyFILE(out,in) memcpy(out,in,FILESize)
#define FreeFILE Free
#define CopyFullFILE SingCopyFILE
#define PrintFILE(ptr)      printf("%d\n",*ptr)
#define WriteBinFILE(ptr,file)\
          WriteBin(ptr,FILESize,file)

#define ReadBinFILE(new,file)\
          ReadBin(new,FILESize,file)

#define FUNCTIONSize sizeof(FUNCTION)
#define AllocateFUNCTION (FUNCTION *) Malloc(FUNCTIONSize)
#define AllocArrayFUNCTION(n) (FUNCTION *) Calloc(n,FUNCTIONSize)
#define FUNCTIONPntrSize sizeof(FUNCTION **)
#define AllocPntrArrayFUNCTION(n) (FUNCTION **) Calloc(n,FUNCTIONPntrSize)
#define SingCopyFUNCTION(out,in) memcpy(out,in,FUNCTIONSize)
#define FreeFUNCTION Free
#define CopyFullFUNCTION SingCopyFUNCTION
#define PrintFUNCTION(ptr)      printf("%d\n",*ptr)
#define WriteBinFUNCTION(ptr,file)\
          WriteBin(ptr,FUNCTIONSize,file)

#define ReadBinFUNCTION(new,file)\
          ReadBin(new,FUNCTIONSize,file)

