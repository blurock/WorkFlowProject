
/*****************************************************************************/
/* Atomic Information Routines */

#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"     

/****** InitializeStaticAtomInfo
     This routine reads in the data file with the static atom information
     and (allocates and) sets it into the StaticAtomInfoSet structure.

     The information is read into a (to this file) global structure
                             STATICATOMINFO

*/

extern StaticAtomInfoSet *STATICATOMINFO;

int InitializeStaticAtomInfo(char *StaticAtomInfoFile)
{
  FILE *file;      
  CHAR line[LINELENGTH];
  StaticAtomInfo *atoms;                         
  INT i,ret;                                     
  CHAR dummy;
  
  ret = SYSTEM_NORMAL_RETURN;
  
  STATICATOMINFO = (StaticAtomInfoSet *) Malloc(StaticAtomInfoSetSize);
  
  file = fopen(StaticAtomInfoFile,"r");
  if(file != NULL)
    {
      fgets(line,LINELENGTH,file);
      sscanf(line,"%d", &( STATICATOMINFO->NAtoms ));
      
      STATICATOMINFO->Atoms = atoms = 
	(StaticAtomInfo *) Calloc(STATICATOMINFO->NAtoms,
				  StaticAtomInfoSize);
      
      LOOPi( STATICATOMINFO->NAtoms )
	{
	  fgets(line,LINELENGTH,file);                               
	  sscanf(line,"%5d%c%c%c%5f", &(atoms->AtomicNumber),
		 &dummy,
		    &(atoms->Name[0]),
		 &(atoms->Name[1]),
		 &(atoms->CovalentRadius) );
	     atoms++;
	}
    }
  else
    {
      printf("Static Atom Information File not found: %s\n",StaticAtomInfoFile);
      ret = SYSTEM_ERROR_RETURN;
    }
  return ret;
  
}
/****** PrtStatAtomInfoSet
        start - the starting atomic number to print
        finish - the last atomic number to print
*/
void PrtStatAtomInfoSet(INT start,INT finish)
{
INT num,i;                          
StaticAtomInfo *atoms;

     printf("--------------------Atomic Information------------------\n");
     num = finish - start + 1;     
     atoms = STATICATOMINFO->Atoms + start -1;
     LOOPi(num)
          {
          printf("%10d    %c%c    %10.2f\n", atoms->AtomicNumber,
                                 atoms->Name[0],
                                 atoms->Name[1],
                                 atoms->CovalentRadius );
          atoms++;
          }                   
}

INT AtomicNumberFromSymbol(CHAR *symbol)
{
INT i;                         
StaticAtomInfo *atoms;             

     atoms = STATICATOMINFO->Atoms;
     LOOPi( STATICATOMINFO->NAtoms ) 
          {
          if( ( *(symbol)     == atoms->Name[0] &&
                *(symbol + 1) == atoms->Name[1] )   ||
              ( *symbol       == atoms->Name[1] &&
                *(symbol + 1) == BLANK          )   )
                   return(atoms->AtomicNumber);
          atoms++;
          }

     return(-1);
}

extern CHAR *AtomNameFromAtomicNumber(INT num)
     {
     StaticAtomInfo *inf;
     CHAR *name;
     
     if(num < STATICATOMINFO->NAtoms)
	  {
	  inf = STATICATOMINFO->Atoms + num - 1;
	  if(*(inf->Name) == ' ')
	    {
	      name = Malloc(4);
	      *(name) = *(inf->Name+1);
	      *(name+1) = ' ';
	      *(name+2) = '\0';
	    }
	  else
	    name = CopyString(inf->Name);
	  }
     else 
	  {
	  name = CopyString("M");
	  }
     return(name);
     }

                                   
          
          
