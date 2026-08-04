/*  FILE     chemkinutil.c
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

#include <math.h>
/*S PrintOutChemkinThermo
*/
 
/*F ret = ChemkinThermPrintOutStandard(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**    
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      Main Functions: WriteOutStandardChemkinThermo
**
**  HEADERFILE
**
*/
extern INT ChemkinThermPrintOutStandard(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     SetOfTables *tables;
     FILE *file;
     INT ret;
     
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     if(tables->ChemkinThermo != 0)
	  {
	  file = OpenWriteFileFromCurrent("TablesOutputDirectory","TablesDataChemkinRoot",
					  CHEMKIN_THERMO_SUFFIX,
					  IGNORE,"Chemkin Thermodynamic Data",commandmaster);
	  if(file != 0)
	       ret = WriteOutStandardChemkinThermo(file,tables->ChemkinThermo);
	  else
	       ret = SYSTEM_ERROR_RETURN;
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;
     
     return(ret);
     }

 
/*F ret = WriteOutStandardChemkinThermo(file,set)
**
**  DESCRIPTION
**    file: File to write to
**    set: The set of molecules with thermodynamic data
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
extern INT WriteOutStandardChemkinThermo(FILE *file,
					 SetOfChemkinThermoInformation *set)
     {
     ChemkinThermoRead *thermo;
     INT i;
     CHAR *string;
     
     string = AllocateString(4 * 80+10);
     
     thermo = set->Thermo;
     LOOPi(set->NumberOfMolecules)
	  {
	  StringMoleculeStandardChemkinThermo(string,thermo);
	  fprintf(file,"%s",string);
	  thermo++;
	  }
     Free(string);
     return(SYSTEM_NORMAL_RETURN);
     }

 
 
/*F GenerateFirstThermoLine(thermo,string)
**
**  DESCRIPTION
**    thermo: The chemkin thermodynamic data
**    string: The string into which to write
**
**  REMARKS
**
*/
static void GenerateFirstThermoLine(ChemkinThermoRead *thermo, char *string)
{
  ChemkinAtomicInfo *atom1, *atom2, *atom3, *atom4;
  CHAR *line;
  INT size;

  size = strlen(thermo->Species);
  if(size > 17) 
    size = 17;
  line = AllocateString(25);
  IsolateString(thermo->Species,line,0,size);

  if(thermo->AtomicSet != 0)
    {    
      atom1 = thermo->AtomicSet->Atoms;
      atom2 = thermo->AtomicSet->Atoms + 1;
      atom3 = thermo->AtomicSet->Atoms + 2;
      atom4 = thermo->AtomicSet->Atoms + 3;
      
      sprintf(string,"%-18s      %-2s%3d%-2s%3d%-2s%3d%-2s%3d%1s%10.3f%10.3f%8.3f      1\n",
	      line,
	      atom1->Name,atom1->Formula,
	      atom2->Name,atom2->Formula,
	      atom3->Name,atom3->Formula,
	      atom4->Name,atom4->Formula,
	      "G",
	      thermo->LowTemperature,
	      thermo->HighTemperature,
	      thermo->CommonTemperature);
    }
  else
    {
      sprintf(string,"%18s                          %1s%10.3f%10.3f%8.3f      1\n",
	      line,
	      "G",
	      thermo->LowTemperature,
	      thermo->HighTemperature,
	      thermo->CommonTemperature);
    }
  Free(line);
}
/*F StringMoleculeStandardChemkinThermo(string,thermo)
**
**  DESCRIPTION
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
extern void StringMoleculeStandardChemkinThermo(CHAR *string,
						ChemkinThermoRead *thermo)
     {
     ThermoCoefficients *upper,*lower;
     
     GenerateFirstThermoLine(thermo,string);
     
     upper = thermo->UpperTempCoefficients;
     lower = thermo->LowerTempCoefficients;
     
     sprintf(string + 81,"%15.8e%15.8e%15.8e%15.8e%15.8e    2\n",
	     *(upper->Coefficients + 0),
	     *(upper->Coefficients + 1),
	     *(upper->Coefficients + 2),
	     *(upper->Coefficients + 3),
	     *(upper->Coefficients + 4));

     sprintf(string + 162,"%15.8e%15.8e%15.8e%15.8e%15.8e    3\n",
	     *(upper->Coefficients + 5),
	     *(upper->Coefficients + 6),
	     *(lower->Coefficients + 0),
	     *(lower->Coefficients + 1),
	     *(lower->Coefficients + 2));

     sprintf(string + 243,"%15.8e%15.8e%15.8e%15.8e                   4\n",
	     *(lower->Coefficients + 3),
	     *(lower->Coefficients + 4),
	     *(lower->Coefficients + 5),
	     *(lower->Coefficients + 6));
     }

extern INT ChemkinToBensonTest(BindStructure *bind)
     {
     FLOAT *temperatures;
     MoleculeSet *molset;
     CHAR *string;
     INT length;
     
     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     temperatures = AllocArrayFLOAT(7);
     *(temperatures + 0) = 300;
     *(temperatures + 1) = 400;
     *(temperatures + 2) = 500;
     *(temperatures + 3) = 600;
     *(temperatures + 4) = 800;
     *(temperatures + 5) = 1000;
     *(temperatures + 6) = 1500;

     
     string = AllocateString(500*PRINT_BUFFER_LENGTH);
     length = 500*PRINT_BUFFER_LENGTH;
     PrintChemkinToBensonFromMoleculeSet(string,&length,"",molset,7,temperatures);
     printf("%s",string);
     Free(string);
     return(SYSTEM_NORMAL_RETURN);
      }

extern CHAR *PrintChemkinToBensonFromMoleculeSet(CHAR *string, INT *length, CHAR *prefix,
						 MoleculeSet *molset,
						 INT numtemps,FLOAT *temperatures)
     {
     PropertyValues *values;
     GenPropValue *value;
     MoleculeInfo *mol;
     INT i,j;
     BensonSecondThermoTable *benson,*bensonback;
     ChemkinThermoRead *chemkin,*chemkinback;
     CHAR *chemkinorig,*chemkinconv;
     
     chemkin = AllocateChemkinThermoRead;
     benson = AllocateBensonSecondThermoTable;
     bensonback = AllocateBensonSecondThermoTable;
     chemkinorig = AllocateString(PRINT_BUFFER_LENGTH);
     chemkinconv = AllocateString(PRINT_BUFFER_LENGTH);
     
     mol = molset->Molecules;
     LOOPi(molset->NumberOfMolecules) {
	  values = FindValuesFromType(CHEMKIN_READTHERMO_PROPERTY,
				      mol->Properties);
	  if(values != 0) {
	       value = values->Values;
	       LOOPj(values->NumberOfValues) {
		    GetPropValue(chemkin,value,molset->PropertyTypes);
		    CalculateBensonFromChemkinThermoValue(benson,chemkin,numtemps,temperatures);
		    chemkinback = CalculateChemkinCoefficients(benson,temperatures,numtemps);
		    CalculateBensonFromChemkinThermoValue(bensonback,chemkinback,numtemps,temperatures);
		    
		    string = PrintStringBensonSecondThermoTable(string,length,"BensonTotal",benson);
		    string = PrintStringString(string,length,"\n");
		    string = PrintStringBensonSecondThermoTable(string,length,"BensonTotal",bensonback);
		    string = PrintStringString(string,length,"\n");
		    
		    StringMoleculeStandardChemkinThermo(chemkinorig,chemkin);
		    string = PrintStringString(string,length,chemkinorig);
		    StringMoleculeStandardChemkinThermo(chemkinconv,chemkinback);
		    string = PrintStringString(string,length,chemkinconv);
		    
		    FreeBensonSecondThermoTable(benson);
		    FreeChemkinThermoRead(chemkin);
		    value++;
		    }
	       }
	  mol++;
	  }
     Free(chemkin);
     Free(benson);
     Free(chemkinorig);
     Free(chemkinconv);
     
     return(string);
     
     }
/*#define RCONSTANT 8.3143*/
#define RCONSTANT  1.98717

extern INT CalculateBensonFromChemkinThermoValue(BensonSecondThermoTable *benson,
						 ChemkinThermoRead *chemkin,
						 INT numtemps,FLOAT *temperatures)
     {
     FLOAT hf298,s0298,*cpvalue;
     INT ret,i;
     
     if(chemkin != 0)
	  {
	  hf298 = ChemkinHFseries(chemkin,298.0);
	  s0298 = ChemkinS0series(chemkin,298.0);

	  CreateBensonSecondThermoTable(benson,chemkin->ID,chemkin->Name,
					hf298,s0298,numtemps,0);
	  cpvalue = benson->HeatCapacityValues;
	  LOOPi(numtemps)
	       {
	       *cpvalue = ChemkinCPseries(chemkin,*temperatures)*RCONSTANT;
	       temperatures++;
	       cpvalue++;
	       }
	  ret = SYSTEM_NORMAL_RETURN;
	  }
     else
	  {
	  CreateBensonSecondThermoTable(benson,-1,0,0.0,0.0,0,0);
	  ret = SYSTEM_ERROR_RETURN;
	  }
     
     return(ret);
     }

extern FLOAT ChemkinCPseries(ChemkinThermoRead *chemkin, FLOAT temperature)
     {
     ThermoCoefficients *coeffs;
     FLOAT *coeff;
     double temppow,ans,dcoeff;
     INT i;
     
     if(temperature < chemkin->CommonTemperature)
	  coeffs = chemkin->LowerTempCoefficients;
     else
	  coeffs = chemkin->UpperTempCoefficients;
     
     coeff = coeffs->Coefficients;
     temppow = 1.0;
     ans = 0.0;
     LOOPi(5)
	  {
	  dcoeff = (double) *coeff;
	  ans += temppow*dcoeff;
	  temppow *= temperature;
	  coeff++;
	  }
     return(ans);
     }

extern FLOAT ChemkinHFseries(ChemkinThermoRead *chemkin, FLOAT temperature)
     {
     ThermoCoefficients *coeffs;
     FLOAT *coeff;
     double dcoeff,temppow,ans,tdiv;
     INT i;
     
     if(temperature < chemkin->CommonTemperature)
	  coeffs = chemkin->LowerTempCoefficients;
     else
	  coeffs = chemkin->UpperTempCoefficients;
     
     coeff = coeffs->Coefficients;
     temppow = temperature;
     tdiv = 1.0;
     ans = 0.0;
     LOOPi(5)
	  {
	  dcoeff  = *coeff;
	  ans += temppow*(dcoeff)/tdiv;
	  tdiv += 1;
	  temppow *= temperature;
	  coeff++;
	  }
     ans += *(coeffs->Coefficients + 5);
     ans *= RCONSTANT;
     return(ans);
     }

extern FLOAT ChemkinS0series(ChemkinThermoRead *chemkin, FLOAT temperature)
     {
     FLOAT *coeffs;
     FLOAT ans;


     if(temperature < chemkin->CommonTemperature)
	  coeffs = chemkin->LowerTempCoefficients->Coefficients;
     else
	  coeffs = chemkin->UpperTempCoefficients->Coefficients;

     ans = *(coeffs + 0)*log10(temperature) +
	  temperature*(*(coeffs + 1) +
		       temperature*(*(coeffs+2)/2.0 + 
				    temperature*(*(coeffs+3)/3.0 +
						 temperature*(*(coeffs+4))/4.0)));
     ans += *(coeffs + 6);
     ans *= RCONSTANT;
     return(ans);
     }

		       





