#include "basic.h"

INT NoStructureCode = NO_STRUCTURE_CODE;

extern CHAR *ProduceFileName(CHAR *directory, CHAR *name, CHAR *suffix)
     {
     CHAR *filename;

     filename = AllocateString(LINELENGTH);
     sprintf(filename,"%s/%s.%s",directory,name,suffix);
     EliminateBlanks(filename);
     
     return(filename);
     }

INT IsFile(CHAR *name, CHAR *directory, FLAG flag)
     {
FILE *file;
CHAR string[300];
INT out;

     sprintf(string,"%s%s",directory,name);

     out = 1;
     file = fopen(string,"r");
     if (file == 0)
          {
          if(flag != 0)
               {
               printf("File:%s",string);
	       if(flag == (FLAG) NULL)
		    Error(0,"Error in Opening File");
	       else
		    Error(-1,"Error in Opening File");
               }
          out = 0;
          }
     else
          fclose(file);

     return(out);
}

FILE *OpenReadFile(CHAR *name, CHAR *directory, FLAG flag)
{
FILE *file;
CHAR string[300];

     sprintf(string,"%s%s",directory,name);

     file = fopen(string,"r");
     if (file == 0)
          {
          printf("File:%s\n",string);
	  if(flag == (FLAG) NULL)
	       Error(0,"Error in Opening File");
	  else
	       Error(-1,"Error in Opening File");
          file = 0;
          }
     return(file);
}
     
FILE *OpenWriteFile(CHAR *name, CHAR *directory, FLAG flag)
{
FILE *file;
CHAR string[300];

     sprintf(string,"%s%s",directory,name);

     file = fopen(string,"w");
     if (file == 0)
          {
          printf("File:%s\n",string);
	  if(flag == (FLAG) NULL)
	       Error(0,"Error in Opening File");
	  else
	       Error(-1,"Error in Opening File");
          file = 0;
          }
     return(file);
}
     

/***************************************************************************/
/* Binary Input/Output
*/

extern void xdr_INT(XDR *xdrs, char **i)
     {
     xdr_int(xdrs,(int *) i);
     }

extern void xdr_FLOAT(XDR *xdrs, char **f)
     {
     xdr_float(xdrs,(float *) f);
     }

extern void xdr_NAME(XDR *xdrs, CHAR **name)
     {
     xdr_string(xdrs,name,LINELENGTH);
     }

/*
void WriteBin(void *object, INT size, FILE *file)
     {
     INT i;
     BYTE *byte,b1,b2;
     
     if(object == 0)
	  {
	  i = NO_STRUCTURE_CODE;
	  WriteBin(&(i),INTSize,file);
	  }
     
     byte = (BYTE *) object;
     if(byte != 0)
          LOOPi(size)
              {
              b1 = *byte & 15;
              b2 = *byte >> 4;
              fputc(b1,file);
              fputc(b2,file);
              byte++;
              }
     else
          LOOPi(size)
               {
                fputc(0,file);
               fputc(0,file);
               }

     if (ferror(file))
          {
          Error(-1,"Error in Writing Binary File");
          file = 0;
          }
}
*/
/*
void ReadBin(void *object, INT size, FILE *file)
     {
     INT i;
     BYTE *byte,b1,b2;
     
     byte = (BYTE *) object;
     LOOPi(size)
          {
          b1 = (BYTE) fgetc(file);
          b2 = (BYTE) fgetc(file);
          *byte = b1 + (b2 << 4);
          byte++;
          }

     if (ferror(file))
          {
          Error(-1,"Error in Reading Binary File");
          file = 0;
          }
}
*/


/*
       
void WriteBinSTRING(CHAR *string, FILE *file)
{
INT length;

     length = strlen(string) + 1;
     WriteBinINT(&length,file);
     WriteBin(string,length,file);
}

void ReadBinSTRING(CHAR *string, FILE *file)
{
INT length;

     ReadBinINT(&length,file);
     ReadBin(string,length,file);
}

void WriteBinNAME(CHAR **string, FILE *file)
{
INT length;

     length = strlen(*string) + 1;
     WriteBinINT(&length,file);
     WriteBin(*string,length,file);
}

void ReadBinNAME(CHAR **string, FILE *file)
{
INT length;

     ReadBinINT(&length,file);
     *string = AllocateString(length);

     ReadBin(*string,length,file);
}

CHAR **AllocateNAME()
{
CHAR **pntr;

     pntr = Malloc(sizeof(CHAR *));
     *pntr = Malloc(NAMESIZE);
     return(pntr);
}

void ReadBinVOID(VOID *obj,FILE *file)
{
return;
}
void WriteBinVOID(VOID *obj,FILE *file)
{
return;
}

*/
