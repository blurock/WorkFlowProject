/*  FILE     chemkinread.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The thermodynamic information in the form wanted by CHEMKIN is managed
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

#include "molprops/chemkin.c"

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static INT InterpretFirstLine(CHAR *string, ChemkinThermoRead *thermo);
static INT InterpretSecondLine(CHAR *string, ChemkinThermoRead *thermo);
static INT InterpretThirdLine(CHAR *string, ChemkinThermoRead *thermo);
static INT InterpretFourthLine(CHAR *string, ChemkinThermoRead *thermo);
static INT InterpretPhase(CHAR phase);
static SetOfChemkinAtomicInfo *ReadAtomicSet(CHAR *string);

/*S ReadInChemkinThermo
*/
/*F  ret = ReadInChemkinThermoFile(bind)  . . . . . . . . . . .  bind:read-in
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT ReadInChemkinThermoFile(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     SetOfTables *tables;
     FILE *file;
     INT max,ret;
     
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     file = OpenReadFileFromCurrent("TablesDataDirectory","TablesDataChemkinRoot",
				    CHEMKIN_THERMO_SUFFIX,
				    IGNORE,"Chemkin Thermodynamic Data",commandmaster);
     if(file != 0)
	  {
	  if(tables->ChemkinThermo != 0)
	       {
	       FreeSetOfChemkinThermoInformation(tables->ChemkinThermo);
	       Free(tables->ChemkinThermo);
	       }
	  
	  max = GetCurrentIntegerArgument("ChemkinMaxMolecules",commandmaster);
	  
	  tables->ChemkinThermo = ChemkinThermoReadSetOfMolecules(file,
								  tables->ID,tables->Name,
								  max);
	  ret = SYSTEM_NORMAL_RETURN;
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;
     return(ret);
     }

     
  
/*F set = ChemkinThermoReadSetOfMolecules(file,id,name,max) . . . extern:work
**
**  DESCRIPTION
**    file: File to read from
**    id: ID of the set
**    name: Name of the set
**    max: The maximum number of molecules to read
**
**
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern SetOfChemkinThermoInformation *ChemkinThermoReadSetOfMolecules(FILE *file,
								      INT id, CHAR *name,
								      INT max) {
  SetOfChemkinThermoInformation *set;
  INT ret,count;
  ChemkinThermoRead *thermo;
  
  set = AllocateSetOfChemkinThermoInformation;
  CreateSetOfChemkinThermoInformation(set,id,name,
				      max,0);
  
  set->NumberOfMolecules = 0;
  
  ret = SYSTEM_NORMAL_RETURN;
  thermo = set->Thermo;
  count = 0;
  while(ret == SYSTEM_NORMAL_RETURN && count < max) {
    ret = ChemkinMoleculeThermoRead(file,thermo);
    if(ret == SYSTEM_NORMAL_RETURN) {
      printf("Read in %d:%s\n",count,thermo->Species);
      set->NumberOfMolecules += 1;
      thermo++;
      count++;
    }
  }
  printf("Done Reading in Molecules\n");
  return(set);
}

/*F ret = ChemkinMoleculeThermoRead(file,thermo)  . . . . . . . . extern:work
**
**  DESCRIPTION
**    file: The file to read from
**    thermo: The structure to fill in
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    This reads the thermodynamic data in CHEMKIN form for a single molecule.
**
**  REMARKS
**    Note that the fgets statement reads the line in with: fgets(string+1,...).
**    This is to allow the use of the column FORTRAN positions given in the
**    standard description.  The difference, of course, is due to having the
**    first column zero or one.
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT ChemkinMoleculeThermoRead(FILE *file,
				     ChemkinThermoRead *thermo)
     {
     CHAR *string;
     INT ret;

     string = AllocateString(100);
     
     fgets(string+1,100,file);
     ret = InterpretFirstLine(string,thermo);
     if(ret == SYSTEM_NORMAL_RETURN) {
	  fgets(string+1,100,file);
	  ret = InterpretSecondLine(string,thermo);
	  if(ret == SYSTEM_NORMAL_RETURN) {
	       fgets(string+1,100,file);
	       ret = InterpretThirdLine(string,thermo);
	       if(ret == SYSTEM_NORMAL_RETURN) {
		    fgets(string+1,100,file);
		    ret = InterpretFourthLine(string,thermo);
		    if(ret != SYSTEM_NORMAL_RETURN) {
		      printf("Error in CHEMKIN line 4 (%s) : %s\n",thermo->Species,string);
		    }
	       } else {
		 printf("Error in CHEMKIN line 3 (%s) : %s\n",thermo->Species,string);
	       }
	  } else {
	    printf("Error in CHEMKIN line 2 (%s) : %s\n",thermo->Species,string);
	  }
     } else {
       /* printf("Error in CHEMKIN line 1: %s\n",string);*/
     }
     Free(string);
     return(ret);
     }

static INT InterpretFirstLine(CHAR *string, ChemkinThermoRead *thermo) {
  INT ret;
  CHAR phase,*namefield;
  
  if(*(string + 80) == '1') {
    namefield = AllocateString(19);
    thermo->Species = AllocateString(19);
    IsolateString(string,namefield,1,18);
    IsolateNextWord(namefield,thermo->Species,' ',18);
    thermo->AtomicSet = ReadAtomicSet(string);
	  
	  phase = (CHAR) *(string + 45);
	  thermo->Phase = InterpretPhase(phase);
	  
	  thermo->LowTemperature = IsolateFloat(string,46,55);
	  thermo->HighTemperature = IsolateFloat(string,56,65);
	  thermo->CommonTemperature = IsolateFloat(string,66,73);
	  ret = SYSTEM_NORMAL_RETURN;
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;

     return(ret);
     }

static INT InterpretSecondLine(CHAR *string, ChemkinThermoRead *thermo)
     {
     INT ret;
     FLOAT *upper;
     
     if(*(string + 80) == '2')
	  {
	  thermo->UpperTempCoefficients = AllocateThermoCoefficients;
	  thermo->LowerTempCoefficients = AllocateThermoCoefficients;
	  
	  CreateThermoCoefficients(thermo->UpperTempCoefficients, 
				 thermo->ID,thermo->Name,
				 7,0);
	  CreateThermoCoefficients(thermo->LowerTempCoefficients, 
				 thermo->ID,thermo->Name,
				 7,0);
	  upper = thermo->UpperTempCoefficients->Coefficients;
	  
	  *(upper + 0) = IsolateFloat(string,1,15);
	  *(upper + 1) = IsolateFloat(string,16,30);
	  *(upper + 2) = IsolateFloat(string,31,45);
	  *(upper + 3) = IsolateFloat(string,46,60);
	  *(upper + 4) = IsolateFloat(string,61,75);
	  ret = SYSTEM_NORMAL_RETURN;
	  }
     else 
	  ret = SYSTEM_NORMAL_RETURN;
     return(ret);
     }

static INT InterpretThirdLine(CHAR *string, ChemkinThermoRead *thermo)
     {
     INT ret;
     FLOAT *upper,*lower;
     
     if(*(string + 80) == '3')
	  {
	  upper = thermo->UpperTempCoefficients->Coefficients;
	  
	  *(upper + 5) = IsolateFloat(string,1,15);
	  *(upper + 6) = IsolateFloat(string,16,30);

	  lower = thermo->LowerTempCoefficients->Coefficients;
	  
	  *(lower + 0) = IsolateFloat(string,31,45);
	  *(lower + 1) = IsolateFloat(string,46,60);
	  *(lower + 2) = IsolateFloat(string,61,75);
	  ret = SYSTEM_NORMAL_RETURN;
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;

     return(ret);
     }

static INT InterpretFourthLine(CHAR *string, ChemkinThermoRead *thermo)
     {
     INT ret;
     FLOAT *lower;
     
     if(*(string + 80) == '4')
	  {
	  lower = thermo->LowerTempCoefficients->Coefficients;
	  
	  *(lower + 3) = IsolateFloat(string,1,15);
	  *(lower + 4) = IsolateFloat(string,16,30);
	  *(lower + 5) = IsolateFloat(string,31,45);
	  *(lower + 6) = IsolateFloat(string,46,60);
	  ret = SYSTEM_NORMAL_RETURN;
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;

     return(ret);
     }

static INT InterpretPhase(CHAR phase)
     {
     INT p;
     
     switch(phase)
	  {
     case 'G':
	  p = CHEMKIN_GAS;
	  break;
     case 'L':
	  p = CHEMKIN_LIQUID;
	  break;
     case 'S':
	  p = CHEMKIN_SOLID;
	  break;
     default:
	  p = CHEMKIN_UNKNOWN;
	  break;
	  }
     return(p);
     }

static SetOfChemkinAtomicInfo *ReadAtomicSet(CHAR *string)
     {
     INT n1,n2,n3,n4,num;
     CHAR *a1,*a2,*a3,*a4;
     SetOfChemkinAtomicInfo *set;
     ChemkinAtomicInfo *atom1,*atom2,*atom3,*atom4;
     
     a1 = AllocateString(5);
     a2 = AllocateString(5);
     a3 = AllocateString(5);
     a4 = AllocateString(5);
     
     a1 = IsolateString(string,a1,25,26);
     n1 = IsolateInteger(string,27,29);
     
     a2 = IsolateString(string,a2,30,31);
     n2 = IsolateInteger(string,32,34);
     
     a3 = IsolateString(string,a3,35,36);
     n3 = IsolateInteger(string,37,39);
     
     a4 = IsolateString(string,a4,40,41);
     n4 = IsolateInteger(string,42,44);

     if(strncmp(a4,"  ",2))
	  num = 4;
     else if(strncmp(a3,"  ",2))
	  num = 3;
     else if(strncmp(a2,"  ",2))
	  num = 2;
     else if(strncmp(a1,"  ",2))
	  num = 1;
     else
	  num = 0;
     
     set = AllocateSetOfChemkinAtomicInfo;
     CreateSetOfChemkinAtomicInfo(set,0,0,
				  4,0);
     atom1 = set->Atoms;
     atom2 = set->Atoms + 1;
     atom3 = set->Atoms + 2;
     atom4 = set->Atoms + 3;
     if(num > 0)
	  CreateChemkinAtomicInfo(atom1,1,a1,0,n1);
     else
	  CreateChemkinAtomicInfo(atom1,0,"  ",0,0);
     
     if(num > 1)
	  CreateChemkinAtomicInfo(atom2,2,a2,0,n2);
     else
	  CreateChemkinAtomicInfo(atom2,0,"  ",0,0);

     if(num > 2)
	  CreateChemkinAtomicInfo(atom3,3,a3,0,n3);
     else
	  CreateChemkinAtomicInfo(atom3,0,"  ",0,0);

     if(num > 3)
	  CreateChemkinAtomicInfo(atom4,4,a4,0,n4);
     else
	  CreateChemkinAtomicInfo(atom4,0,"  ",0,0);

     Free(a1);
     Free(a2);
     Free(a3);
     Free(a4);
     
     return(set);
     }


     
     
