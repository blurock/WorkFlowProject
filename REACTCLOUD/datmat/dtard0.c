#include "basic.h"
#include "datmat0.h"

static void GetVariableNames(FILE *file, FILE *namefile,
			     DataBlock *block,
			     INT debug);
static void IsolateNthBlock(int n, DataBlock *block, char *line);
static void IsolateDataBlock(DataBlock *block, FILE *file);
static void IsolateNthPoint(int n, DataPoint *point, char *line);
static DataBlock *IsolateBlock(FILE *control, FILE *file, 
			       DataBlock *block,
			       INT debug);
static CHAR *ReadInRanges(DataPoint *point,
			  FILE *control, CHAR *line, CHAR *element);
static void ConvertFloat(char *line);
static DataBlockSet *ReadDataBlockSet(FILE *control, INT debug, INT max);
static int CountVariableDataBlockSet(DataBlockSet *set);

static void TransferDataSet(DataBlockSet *datablockset, 
                            SysSamVector *syssam);
static SysSamVector *TransferDataBlock(DataBlock *block,
                                      SysSamVector *syssam);
static SysSamVectorSet 
                    *TransferDataBlock2SystemSample(DataBlockSet *datablockset);
static BaseVector *TransferData(BasisType *vector, 
                         INT id, CHAR *name,
                         INT type,
                         INT numpoints);
static void DeallocateDataPointArray(DataBlockSet *set);
static void AllocateDataPointArray(DataPoint *point);
static void ReadNameSet(FILE *file, INT size, DataBlockSet *set, INT max);
static void ConsistencyCheck(DataBlockSet *datablockset,
			     INT debug);
static void TransferNameSet(DataBlockSet *datablockset, SysSamVectorSet *syssam);

#include "datmat/dtard.c"

extern SysSamVectorSet *ReadSysSamVectorSet(FILE *file, INT debug, INT max)
     {
     DataBlockSet *set;
     SysSamVectorSet *syssam;
     
     set = ReadDataBlockSet(file,debug,max);
     syssam = TransferDataBlock2SystemSample(set);
     
     return(syssam);
     }

static DataBlockSet *ReadDataBlockSet(FILE *control, INT debug, INT max)
     {
     FILE *file; 
     DataBlockSet *set;
     DataBlock *block;
     char line[LINELENGTH];
     CHAR element[LINELENGTH];
     CHAR *name,*rest;
     int i,id,num;
     
     file = 0;

     NextNonBlankLine(control,line);
     rest = IsolateNextWord(line,element,BLANK,LINELENGTH);
     id = ConvertStringToInteger(element);
     EliminateLeadingBlanks(rest);
     name = CopyString(rest);

     NextNonBlankLine(control,line);
     rest = IsolateNextWord(line,element,BLANK,LINELENGTH);
     num = ConvertStringToInteger(element);
     rest = IsolateNextWord(rest,element,BLANK,LINELENGTH);
	     
	     
     set = AllocateDataBlockSet;
     CreateDataBlockSet(set,id,name,num,0,0);
     Free(name);

     if( !(strncmp(element,"NAME",4) ))
	  {
	  rest = IsolateNextWord(rest,element,BLANK,LINELENGTH);
	  num = ConvertStringToInteger(element);
	  rest = IsolateNextWord(rest,element,BLANK,LINELENGTH);
	  file = OpenReadFile(element,"",0);
	  if(file == 0)
	       {
	       sprintf(line,"Name Filename: %s Not Found. No Names Read In",
		       element);
	       }
	  else
	       {
	       if(debug >= DEBUG1)
		    {
		    sprintf(line,"Reading in Names from: %s\n",element);
		    printf("%s",line);
		    }
	       ReadNameSet(file,num,set,max);
	       }
	  }
     
     if(debug >= DEBUG1)
	  {
	  sprintf(line,"Will Read in %d Blocks\n",set->NumDataBlocks);
	  printf("%s",line);
	  }
     
     block = set->Blocks;
     LOOPi(set->NumDataBlocks)
          {
          if(debug > DEBUG2) 
	       {
	       sprintf(line,"Block #%d\n",i);
	       printf("%s",line);
	       }
          NextNonBlankLine(control,line);
          rest = IsolateNextWord(line,element,BLANK,LINELENGTH);

	  if( !(strncmp(element,"SAME",4)))
	       {
	       if(debug > DEBUG2) 
		    {
		    sprintf(line,"Continuing With Same File\n");
		    printf("%s",line);
		    }
	       }
	  else if( !(strncmp(element,"DONE",4) ) )
	       {
	       if(debug > DEBUG2) 
		    {
		    sprintf(line,"Finished Reading Files\n");
		    printf("%s",line);
		    }
	       if(file) fclose(file);
	       }
          else
               {
	       if(debug >= DEBUG2)
		    {
		    sprintf(line,"Open File: <%s>\n",element);
		    printf("%s",line);
		    }
	       if(file) fclose(file);
	       file = OpenReadFile(element,"",0);
	       if(file == 0)
		    {
		    sprintf(line,"File Not Found: %s ... Continuing",element);
		    printf("%s",line);
		    }
               }
	  block->ID = i;
	  block->Name = CopyString(element);
	  IsolateBlock(control,file,block,debug);
	  if(debug >= DEBUG2) 
	       printf("Finished Reading Block\n");
	  block++;
          }

     if(file) fclose(file);
     if(control) fclose(control);

     ConsistencyCheck(set,debug);
     
     return(set);
     }

static void ReadNameSet(FILE *file, INT size, DataBlockSet *set, INT max)
     {
     DataPointName *name;
     DataPointNameSet *names;
     CHAR *line, *string;
     
     string = AllocateString(LINELENGTH);
     names = AllocateDataPointNameSet;
     CreateDataPointNameSet(names, set->ID, set->Name,
			    max,
			    0);
     line = NextNonBlankLine(file,string);
     name = names->Names;
     names->NumberOfNames = 0;
     while( line != 0 && names->NumberOfNames < max)
	  {
	  *(line + size) = ENDOFSTRING;
	  CreateDataPointName(name,names->NumberOfNames,line);
	  line = NextNonBlankLine(file,string);
	  names->NumberOfNames += 1;
	  name++;
	  }
     set->NameSet = AllocateDataPointNameSet;
     CopyFullDataPointNameSet(set->NameSet,names);
     
     FreeDataPointNameSet(names);
     Free(names);
     Free(line);
     }

static void ConsistencyCheck(DataBlockSet *datablockset,
			     INT debug)
     {
     INT i,j,numberofpoints,bad;
     CHAR *string;
     DataBlock *block;
     DataPoint *column;
     
     string = AllocateString(LINELENGTH);
     
     bad = 0;
     
     if(datablockset->NameSet != 0)
	  numberofpoints = datablockset->NameSet->NumberOfNames;
     else
	  numberofpoints = datablockset->Blocks->NumberOfPoints;

     if(debug >= DEBUG1)
	  {
	  sprintf(string,"Checking Consistency of Number Of Points: Expecting %d\n",
		  numberofpoints);
	  printf("%s",string);
	  }
     
     block = datablockset->Blocks;
     LOOPi(datablockset->NumDataBlocks)
	  {
	  column = block->Columns;
	  LOOPj(block->NumberOfColumns)
	       {
	       if(column->NumberOfPoints != numberofpoints)
		    {
		    sprintf(string,
			    "Inconsistency in Variable:%s %d data points",
			    column->Name,
			    column->NumberOfPoints);
		    printf("%s",string);
		    bad = 1;
		    Error(0,string);
		    }
	       column++;
	       }
	  block++;
	  }
     if(datablockset->NameSet != 0)
	  if(datablockset->NameSet->NumberOfNames != numberofpoints)
	       {
	       sprintf(string,"Inconsistency in NameList: %d data points",
		       datablockset->NameSet->NumberOfNames);
	       bad = 1;
	       Error(0,string);
	       }
     if(bad == 0 && debug >= DEBUG1)
	  printf("Consistent\n");
     Free(string);
     }

     
static SysSamVectorSet *TransferDataBlock2SystemSample(DataBlockSet *datablockset)
     {
     int varcount;
     SysSamVectorSet *sysvarset;
     
     varcount = CountVariableDataBlockSet(datablockset);

     sysvarset = AllocateSysSamVectorSet;
     CreateSysSamVectorSet(sysvarset,
			   datablockset->ID,
			   datablockset->Name,
			   varcount,
			   datablockset->Blocks->NumberOfPoints,
			   0,0);

     TransferDataSet(datablockset,sysvarset->Sets);
     TransferNameSet(datablockset,sysvarset);

     DeallocateDataPointArray(datablockset);
     FreeDataBlockSet(datablockset);
     Free(datablockset);

     return(sysvarset);
     }

static void TransferNameSet(DataBlockSet *datablockset, SysSamVectorSet *syssam)
     {
     DataPointName *dataname;
     SysSamName *sysname;
     INT i;
     

     if(datablockset->NameSet != 0)
	  {
	  syssam->NameSet = AllocateSysSamNameSet;
	  CreateSysSamNameSet(syssam->NameSet, 
			      syssam->ID,syssam->Name,
			      syssam->NumSystemPoints,
			      0);
	  
	  sysname = syssam->NameSet->Names ;	  
	  dataname = datablockset->NameSet->Names;
	  LOOPi(syssam->NameSet->NumberOfNames)
	       {
	       CreateSysSamName(sysname,i,dataname->Name);
	       sysname++;
	       dataname++;
	       }
	  }
     }

static void TransferDataSet(DataBlockSet *datablockset, SysSamVector *syssam)
{
DataBlock *block;
int i;

     block = datablockset->Blocks;
     LOOPi(datablockset->NumDataBlocks)
          {
          syssam = TransferDataBlock(block,syssam);
          block++;
          }
}




static DataBlock *IsolateBlock(FILE *control, FILE *file, 
			       DataBlock *block, INT debug)
     {
     int i;
     char line[LINELENGTH],element[LINELENGTH];
     CHAR *rest;
     DataPoint *points;
     FILE *namefile;
     
     NextNonBlankLine(control,line);
     rest = IsolateNextWord(line,element,BLANK,LINELENGTH);
     block->NumberOfColumns = ConvertStringToInteger(element);
     rest = IsolateNextWord(rest,element,BLANK,LINELENGTH);
     block->NumberOfPoints = ConvertStringToInteger(element);
     
     rest = IsolateNextWord(rest,element,BLANK,LINELENGTH);
     namefile = 0;
     if(!strcmp("NAME",element))
	     {
	     rest = IsolateNextWord(rest,element,BLANK,LINELENGTH);
	     if(!strcmp("SAME",element))
		  {
		  namefile = file;
		  }
	     else
		  {
		  namefile = OpenReadFile(element,"",0);
		  }
	     }
	
     if(debug >= DEBUG2) 
	  {
	  sprintf(line,"Block Columns:%10d  Samples:%10d\n",
		 block->NumberOfColumns,
		 block->NumberOfPoints);
	  printf("%s",line);
	  }

     if(debug > DEBUG3) 
	  printf("Columns:");

     block->Columns = points = AllocArrayDataPoint(block->NumberOfColumns);
	       
     LOOPi(block->NumberOfColumns)
          {
          rest = ReadInRanges(points,control,line,element);

          IsolateNextWord(rest,element,BLANK,LINELENGTH);

          if(debug > DEBUG3) 
	       {
	       sprintf(line,"(%4d,%4d,%c) ",points->Range.BeginChar,
		       points->Range.Size,
		       element[0]);
	       if(!(i % 5))
		    printf("\n");
	       }
	  
	  switch(element[0])
	       {
	  case 'I':
	       points->Type = INTEGERVAR;
	       break;
	  case 'F':
	       points->Type = FLOATVAR;
	       }
          points++;
          }

     if(debug >= DEBUG3) 
	  printf("\n");
     
     GetVariableNames(file,namefile,block,debug);

     IsolateDataBlock(block,file);

     return(block);
}

static CHAR *ReadInRanges(DataPoint *point, FILE *control, CHAR *line, CHAR *element)
{
CHAR *rest;

     NextNonBlankLine(control,line);

     rest = IsolateNextWord(line,element,BLANK,LINELENGTH);
     point->Range.BeginChar = ConvertStringToInteger(element);
     rest = IsolateNextWord(rest,element,BLANK,LINELENGTH);
     point->Range.Size = ConvertStringToInteger(element);

     return(rest);
}

static void GetVariableNames(FILE *file, FILE *namefile,
			     DataBlock *block,
			     INT debug)
     {
     CHAR *name,*out,*line;
     DataPoint *point;
     int i,NameLength;
     
     line = AllocateString(LINELENGTH);
     if(debug >= DEBUG3) 
	  {
	  out = AllocateString(LINELENGTH);
	  sprintf(out,"Variables read from Block #%d:\n",block->ID);
	  printf("%s",out);
	  Free(out);
	  }
     
     if(namefile == 0)
	  {
	  NextNonBlankLine(file,line);
	  
	  point = block->Columns;
	  LOOPi(block->NumberOfColumns)
	       {
	       if(debug >= DEBUG3 && !(i % 5) ) printf("\n");
	       NameLength = point->Range.Size + 1;
	       name = point->Name = AllocateString(NameLength);
	       strncpy(name,(line + point->Range.BeginChar),NameLength-1);
	       *(name + NameLength - 1) = ENDOFSTRING;
	       EliminateBlanks(name);
	       if(debug >= DEBUG3)
		    {
		    printf("%s",point->Name);
		    printf("  ");
		    }
	       point++;
	       }
	  if(debug >= DEBUG3) printf("\n");
	  }
     else
	  {
	  point = block->Columns;
	  LOOPi(block->NumberOfColumns)
	       {
	       NextNonBlankLine(namefile,line);
	       EliminateBlanks(line);
	       point->Name = CopyString(line);
	       if(debug >= DEBUG3)
		    {
		    printf("%s",point->Name);
		    printf("  ");
		    }
	       point++;
	       }
	  }
     Free(line);
}

static void DeallocateDataPointArray(DataBlockSet *set)
{
DataBlock *blks;
DataPoint *columns;
BasisType *vector;
INT i,j;

     blks = set->Blocks;
     LOOPi(set->NumDataBlocks)
          {
          columns = blks->Columns;
          LOOPj(blks->NumberOfColumns)
               {
               vector = &(columns->Vector);
               switch(columns->Type)
                    {
                    case INTEGERVAR:
                         Free(vector->Integer);
                         break;
                    case FLOATVAR:
                         Free(vector->Float);
                         break;
                    }
               columns++;
               }
          blks++;
          }
}
               

static void AllocateDataPointArray(DataPoint *point)
{
BasisType *vector;

     vector = &(point->Vector);
     switch(point->Type)
          {
          case INTEGERVAR:
               vector->Integer =
                        AllocArrayINT(point->NumberOfPoints);
               break;
          case FLOATVAR:
               vector->Float =
                         AllocArrayFLOAT(point->NumberOfPoints);
               break;
           }
}

static void IsolateDataBlock(DataBlock *block, FILE *file)
     {
     DataPoint *point;
     int i;
     CHAR *line;
     
     line = AllocateString(10*LINELENGTH);
     
     point = block->Columns;
     LOOPi(block->NumberOfColumns)
          {
           point->NumberOfPoints = block->NumberOfPoints;
           AllocateDataPointArray(point);
           point++;
           }

     LOOPi(block->NumberOfPoints)
          {
          if( NextNonBlankLine(file,line) == 0 )
               { 
               printf("Insufficient Data after %d lines",i);
               return;
               }
          IsolateNthBlock(i,block,line);
          }
     Free(line);
}

static void IsolateNthBlock(int n, DataBlock *block, char *line)
{
int i;
DataPoint *point;

     point = block->Columns;
     LOOPi(block->NumberOfColumns)
          IsolateNthPoint(n,point++,line);
}          

static void IsolateNthPoint(int n, DataPoint *point, char *line)
{
char element[LINELENGTH];
int missing;
INT intpnt;
FLOAT fltpnt;

     strncpy(element,
             (line + point->Range.BeginChar),
             point->Range.Size);
     *(element + point->Range.Size) = ENDOFSTRING;
     EliminateBlanks(element);
     
     missing = *element == ENDOFSTRING ||
               !( strcmp(element,".") );

     switch(point->Type)
          {
          case INTEGERVAR:
               if(missing) 
                    intpnt = (INT) INTEGERMISSING;
               else
                    sscanf(element,"%d",&intpnt);
               *(point->Vector.Integer + n) = intpnt;
               break;
          case FLOATVAR:
               ConvertFloat(element);
               if(missing)
                    fltpnt = (FLOAT) FLOATMISSING;
               else
                    sscanf(element,"%f",&fltpnt);
               *(point->Vector.Float + n) = fltpnt;
               break;
          }
}

static void ConvertFloat(char *line)
{
char *line1;
     line1 = (char *) strchr( line, ',');
     if(line1) *line1 = '.';
}

void PrintNthElement(int n, int type, BasisType *vec)
{
   switch(type)
     {
     case INTEGERVAR:
          if( *(vec->Integer + n) == INTEGERMISSING )
               printf("   ---    ");
          else
               printf("%10d",*(vec->Integer + n));
          break;
     case FLOATVAR:
          if( *(vec->Float + n) == FLOATMISSING )
               printf("   ---    ");
          else
               printf("%10f",*(vec->Float + n));
          break;
     }
}


static int CountVariableDataBlockSet(DataBlockSet *set)
{
int icount,i;
DataBlock *block;

     icount = 0;
     block = set->Blocks;
     LOOPi(set->NumDataBlocks)
          {
          icount += block->NumberOfColumns;
          block++;
          }
     
     return(icount);
}

/******************************************************************************/
/* System Sample Routines
*/

/******************************************************************************/
/* Comparison Routines  ---- GreaterEqual
       Input:    i,j      - positions in vector
                master    - The SysSamVector

       Return:
                 -2       - One of values is missing
                 -1       - v(i) < v(j)
                  0       - v(i) = v(j)
                  1       - v(i) > v(j)
*/

/* --- GreaterEqualInteger
*/
int GreaterEqualInteger( int i, int j, SysSamVector *master)
{
INT *vector,v1,v2;
      
      vector = master->Data->Integer->Vector;
      v1 = *(vector + i);
      v2 = *(vector + j);

      if( v1 == v2 ) return(0);
 
      if( v1 == master->Missing->Integer) 
             return(-2);
      if( v2 == master->Missing->Integer )
          return(2);

      if( v1 >= v2 )
           return(1);
      else
           return(-1);
}

/* ----- GreaterEqualFloat
*/
int GreaterEqualFloat( int i, int j, SysSamVector *master)
{
FLOAT *vector,v1,v2;

      vector = master->Data->Float->Vector;
      v1 = *(vector + i);
      v2 = *(vector + j);

      if( v1 == v2 ) return(0);
 
      if( v1 == master->Missing->Float) 
             return(-2);
      if( v2 == master->Missing->Float )
          return(2);

      if( v1 >= v2 )
           return(1);
      else
           return(-1);
}

extern INT NumberInBaseVector(BaseVector *vector)
     {
     INT n;
     
     n = 0;
     switch(vector->Type)
	  {
     case INTEGERVAR:
	  n = vector->Integer->VectorLength;
	  break;
     case FLOATVAR:
	  n = vector->Float->VectorLength;
	  break;
	  }
     return(n);
     }

static SysSamVector *TransferDataBlock(DataBlock *block,
                                      SysSamVector *syssam)
{
int i;
DataPoint *column;
BaseType *missingtyp;
BaseVector *basvec;

     column = block->Columns;
     LOOPi(block->NumberOfColumns)
          {
          missingtyp = AllocateBaseType;
          CreateBaseType(missingtyp,
                         i,column->Name,
                         column->Type,
                         INTEGERMISSING,
                         FLOATMISSING);

          basvec = TransferData(&(column->Vector),
                                i,column->Name,
                                column->Type,
                                column->NumberOfPoints);

         CreateSysSamVector(syssam,
                            i,column->Name,
                            missingtyp,
                            0,
                            basvec);

          FreeBaseVector(basvec);
          Free(basvec);
          FreeBaseType(missingtyp);
          Free(missingtyp);

          syssam++;
          column++;
          }
      return(syssam);
}

static BaseVector *TransferData(BasisType *vector, 
                         INT id, CHAR *name,
                         INT type,
                         INT numpoints)
     {
     BaseIntVector *intvarvec;
     BaseFltVector   *fltvarvec;
     BaseVector *syssambase;
     
     intvarvec = 0;
     fltvarvec = 0;
     switch(type)
          {
          case INTEGERVAR:
               intvarvec = AllocateBaseIntVector;
               CreateBaseIntVector(intvarvec,
                                   id,name,
                                   numpoints,
                                   vector->Integer);
               break;
           case FLOATVAR:
               fltvarvec = AllocateBaseFltVector;
               CreateBaseFltVector(fltvarvec,
                                   id,name,
                                   numpoints,
                                   vector->Float);
               break;
            }
     syssambase = AllocateBaseVector;
     CreateBaseVector(syssambase,
                      id,name,
                      type,
                      intvarvec,fltvarvec);
     FreeBaseFltVector(fltvarvec);
     FreeBaseIntVector(intvarvec);
     Free(intvarvec);
     Free(fltvarvec);

     return(syssambase);

}

/******************************************************************************/
/* Check for MissingElement

        return:
                  1   - element is a missing element
                  0   - element is not a missing element
*/
extern int MissingElementInteger(int i, SysSamVector *master )
{

      if( *( SysSamVecNthInteger(master,i) ) == master->Missing->Integer )
          return(1);
      else
          return(0);
}

extern int MissingElementFloat(int i, SysSamVector *master )
{

      if( *( SysSamVecNthFloat(master,i) ) == master->Missing->Float )
          return(1);
      else
          return(0);
}





