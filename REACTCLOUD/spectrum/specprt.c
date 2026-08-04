/*  FILE     spec0.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The basic spectra producing routines
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/

/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "molprops.h"
#include "spec0.h"
#include <math.h>

static void PrintDataSet(SpectrumSet *specset, CHAR*name, INT flag);
static void PrintMSDataLine(FILE *file,
			    SpectrumStandard *standard,
			    INT begin, INT end);
static void PrintDataControl(SpectrumSet *specset,
			     CHAR *filestring, 
			     FILE *dataout);
static void PrintPreamble(SpectrumSet *specset);

#define FILENAMESIZE      30

extern void PrintSpectrumDataBase(SpectrumSet *specset, CHAR *name,FILE *file)
     {
     PrintSpectrumSetStandard(specset->Standard);
     PrintDataSet(specset,name,1);
     PrintDataSet(specset,name,0);

     PrintDataControl(specset, specset->Name, file);
     fflush(file);
     }

static void PrintPreamble(SpectrumSet *specset)
     {
     CHAR *filestring;
     INT i,done,begin,first,end;
     FILE *dataout;
     SpectrumStandardSet *standardset;
     SpectrumStandard *standard;
     
     filestring = AllocateString(FILENAMESIZE);
     sprintf(filestring,"%s.preamble",specset->Name);
     dataout = OpenWriteFile(filestring,"",-1);

     fprintf(dataout,"Read %s.ctl\n",specset->Name);
     
     fprintf(dataout,"SubSet Range ");
     standardset = specset->Standards;
     standard = standardset->Standard;
     done = 0;
     begin = 0;
     first = 0;
     while(done == 0)
	  {
	  end = begin;
	  while(end < standardset->NumberOfSpectra &&
		standard->NumberOfFrequencies != 0)
	       {
	       standard++;
	       end++;
	       }
	  if( begin != end )
	       {
	       if(first) fprintf(dataout,", ");
	       fprintf(dataout,"%d-%d",begin,end - 1);
	       }
	  begin = end;
	  while( begin < standardset->NumberOfSpectra &&
		standard->NumberOfFrequencies == 0)
	       {
	       standard++;
	       begin++;
	       }
	  if(begin >= standardset->NumberOfSpectra) done = 1;
	  first = 1;
	  }
     fprintf(dataout,"\n");
     
     fprintf(dataout,"VarList None 0 Print\n");
     LOOPi(standardset->Standard->NumberOfFrequencies)
	  fprintf(dataout,"F%d\n",i+1);
     fprintf(dataout,"DONE\n");

     fclose(dataout);
     
     }

	  
     
	  
static void PrintDataControl(SpectrumSet *specset, 
			     CHAR *filestring,
			     FILE *dataout)
     {
     INT col,i,j,loop,begin,end,increment,numpoints,numsets;
     SpectrumStandardSet *standardset;
     SpectrumStandard *standard;
     
     standardset = specset->Standards;

     begin = 0;
     increment = 15;
     end = begin + increment - 1;
     numpoints = specset->Standard->NumberOfIntervals;
     numsets = floor((double) numpoints / increment);
     LOOPi(numsets)
	  {
	  if(i == 0)
	       fprintf(dataout,"%speak.dat\n",specset->Name);
	  else
	       fprintf(dataout,"SAME\n");
	  fprintf(dataout,"%5d %5d\n",
		  increment,
		  standardset->NumberOfSpectra);
	  col = 0;
	  LOOPj(increment)
	       {
	       fprintf(dataout,"%5d 6 F\n",col);
	       col += 6;
	       }
	  fprintf(dataout,"\n\n");
	  begin += increment;
	  end += increment;
	  }
     if(begin < numpoints)
	  {
	  loop = numpoints-begin+1;
	  if(begin == 0)
	       fprintf(dataout,"%speak.dat\n",specset->Name);
	  else
	       fprintf(dataout,"SAME\n");
	  fprintf(dataout,"%5d %5d\n",
		  loop,
		  standardset->NumberOfSpectra);
	  col = 0;
	  LOOPj(loop)
	       {
	       fprintf(dataout,"%5d 6 F\n",col);
	       col += 6;
	       }
	  fprintf(dataout,"\n\n");
	  }
     }

static void PrintDataSet(SpectrumSet *specset,
			 CHAR *name,
			 INT flag)
     {
     CHAR *filestring;
     FILE *dataout;
     INT i,j,loop,cntr,begin,end,increment,numpoints,numsets;
     SpectrumStandardSet *standardset;
     SpectrumStandard *standard;
     
     filestring = AllocateString(FILENAMESIZE);
     if(flag)
	  {
	  sprintf(filestring,"%speak.dat",specset->Name);
	  dataout = OpenWriteFile(filestring,"",-1);
	  }
     else
	  {
	  sprintf(filestring,"%sdiff.dat",specset->Name);
	  dataout = OpenWriteFile(filestring,"",-1);
	  }
	  
     standardset = specset->Standards;


     begin = 0;
     increment = 15;
     end = begin + increment - 1;
     numpoints = specset->Standard->NumberOfIntervals;
     numsets = floor((double) numpoints / increment);
     LOOPi(numsets)
	  {
	  cntr = begin + 1;
	  loop = end - begin + 1;
	  LOOPj(loop)
	       {
	       if(flag)
		    fprintf(dataout," P%s%-2d ",name,cntr++);
	       else
		    fprintf(dataout," D%s%-2d ",name,cntr++);
	       }
	  
	  fprintf(dataout,"\n");
	  if(flag)
	       standard = standardset->Standard;
	  else
	       standard = standardset->Difference;
	  LOOPj(standardset->NumberOfSpectra)
	       {
	       PrintMSDataLine(dataout,standard,begin,end);
	       standard++;
	       }
	  fprintf(dataout,"\n\n");
	  begin += increment;
	  end += increment;
	  }
     cntr = begin;
     loop = numpoints - begin + 1;
     LOOPi(loop)
	  {
	  if(flag)
	       fprintf(dataout," P%s%-2d ",name,cntr++);
	  else
	       fprintf(dataout," D%s%-2d ",name,cntr++);
	  }
     
     fprintf(dataout,"\n");
     
     if(flag)
	  standard = standardset->Standard;
     else
	  standard = standardset->Difference;
     LOOPj(standardset->NumberOfSpectra)
	  {
	  PrintMSDataLine(dataout,standard,begin,numpoints);
	  standard++;
	  }
     
     fclose(dataout);
     }

static void PrintMSDataLine(FILE *file,SpectrumStandard *standard,
			    INT begin, INT end)
     {
     INT i,loop;
     FLOAT *point;

     
     loop = end - begin + 1;
     
     if(standard->NumberOfFrequencies == 0)
	  {
	  LOOPi(loop) fprintf(file,"   .  ");
	  }
     else
	  {
	  point = standard->Heights + begin;
	  LOOPi(loop)
	       fprintf(file," %6.1f  ",*point++);
	  }
     fprintf(file,"\n");
     }
