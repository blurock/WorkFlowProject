/*  FILE     
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
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
#include "matrix0.h"

#include <math.h>
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/

void extrapolateCpValues(FLOAT *temperatures,FLOAT *hvalues,
			 FLOAT *extrapolateT,FLOAT *extrapolateCp);

 
static FLOAT CpFiniteDiff(FLOAT temp1, FLOAT h1,
			  FLOAT temp2, FLOAT h2,
			  FLOAT temp3, FLOAT h3);
static void a1to5(FLOAT temp1, FLOAT temp2, FLOAT temp3, FLOAT temp4,
		  FLOAT cp1, FLOAT cp2, FLOAT cp3, FLOAT cp4, FLOAT cpd,
		  FLOAT *answer);;
static void CalculateA6(ThermoCoefficients *lower,
			ThermoCoefficients *upper,
			FLOAT heat,
			FLOAT temp0,
			FLOAT tempC);
static FLOAT CalculateHeatWith5(FLOAT a1,FLOAT a2,FLOAT a3,FLOAT a4,FLOAT a5,
				FLOAT temp);
static void CalculateA7(ThermoCoefficients *lower,
			ThermoCoefficients *upper,
			FLOAT heat,
			FLOAT temp0,
			FLOAT tempC);
static FLOAT CalculateEntropyWith6(FLOAT a1,FLOAT a2,FLOAT a3,
			     FLOAT a4,FLOAT a5,FLOAT a6,
			     FLOAT temp);
static void PutInAtomCounts(ChemkinThermoRead *chemkin,MoleculeInfo *mol);

#define RCONSTANT  1.98717

/*F  ret =ChemkinFromBensonCalc (bind)
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
extern INT ChemkinFromBensonCalc(BindStructure *bind)
     {
     MoleculeSet *molset;

     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     ChemkinFromBensonForSet(molset);
     return(SYSTEM_NORMAL_RETURN);
     }

/*F  ret =ChemkinFromBensonCalc (bind)
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Transfer the chemkin values from the molecule properties
**    to the thermodynamic tables
**
**  HEADERFILE
**
*/
extern INT TransferChemkinToTables(BindStructure *bind) {
  MoleculeSet *molset;
  SetOfTables *tables;
  PropertyValues *values;
  MoleculeInfo *molecule;
  INT i;
  ChemkinThermoRead *chemkin;

  molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
  tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
  
  if(tables->ChemkinThermo != 0) {
    FreeSetOfChemkinThermoInformation(tables->ChemkinThermo);
    Free(tables->ChemkinThermo);
  }
  tables->ChemkinThermo = AllocateSetOfChemkinThermoInformation;
  CreateSetOfChemkinThermoInformation(tables->ChemkinThermo,molset->ID,molset->Name,
				      molset->NumberOfMolecules,0);
  
  chemkin = tables->ChemkinThermo->Thermo;
  tables->ChemkinThermo->NumberOfMolecules = 0;
  molecule = molset->Molecules;
  LOOPi(molset->NumberOfMolecules) {
    if(molecule->ID >= 0) {
      values = FindValuesFromType(CHEMKIN_READTHERMO_PROPERTY,
				  molecule->Properties);
      if(values->NumberOfValues > 0) {
	GetPropValue(chemkin,values->Values,molset->PropertyTypes);
      chemkin++;
      tables->ChemkinThermo->NumberOfMolecules++;
      } else {
	printf("%20s: No CHEMKIN NASA polynomials\n",molecule->Name);
      }
    }
    molecule++;
  }
  
     return(SYSTEM_NORMAL_RETURN);
}
/*F
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
extern void  ChemkinFromBensonForSet(MoleculeSet *molset) {
     FLOAT *temperatures;
     MoleculeInfo *mol;
     INT i;
     
     temperatures = AllocArrayFLOAT(7);
     *(temperatures + 0) = 298;
     *(temperatures + 1) = 400;
     *(temperatures + 2) = 500;
     *(temperatures + 3) = 600;
     *(temperatures + 4) = 800;
     *(temperatures + 5) = 1000;
     *(temperatures + 6) = 1500;
 
     mol = molset->Molecules;
     LOOPi(molset->NumberOfMolecules) {
       if(mol->ID >= 0) 
	 ChemkinFromBensonMolecule(mol,molset->PropertyTypes,temperatures,7);
       mol++;
     }
     Free(temperatures);
     }

static float CalculateCpWithCoeffs(float temperature,float *coefficients)
{
  float cp;

  cp = 	  
    *(coefficients + 0)
    + (*(coefficients + 1))*temperature 
    + (*(coefficients + 2))*pow(temperature,2.0) 
    + (*(coefficients + 3))*pow(temperature,3.0) 
    + (*(coefficients + 4))*pow(temperature,4.0);
  return cp;
}
/*F
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
extern void ChemkinFromBensonMolecule(MoleculeInfo *molecule,
				      SetOfPropertyTypes *types,
				      FLOAT *temperatures, INT NumberOfTemps) {
  ChemkinThermoRead *chemkin;
  BensonSecondThermoTable *bentable;
  GenPropValue *chemkinvalue,*value,*namevalue;
  PropertyValues *values,*names;
  INT i;
  CHAR *name;
  
  values = FindValuesFromType(BENSON_THERMO_PROPERTY,
			      molecule->Properties);
  names = FindValuesFromType(ALTERNATIVE_NAMES_PROPERTY,
			     molecule->Properties);
  
  name = CopyString("");
  namevalue = names->Values;
  LOOPi(names->NumberOfValues) {
    if(!strcmp(namevalue->Name,"CHEMKIN"))
	 {
	   Free(name);
	   name = CopyString(namevalue->Value);
	 }
    namevalue++;
  }
  if(strlen(name) == 0) {
    Free(name);
    name = CopyString(molecule->Name);
  }
  bentable = AllocateBensonSecondThermoTable;
  value = values->Values;
  LOOPi(values->NumberOfValues) {
    GetPropValue(bentable,value,types);
    printf("Molecule: %s  (%d)\n",molecule->Name,values->NumberOfValues);
    chemkin = CalculateChemkinCoefficients(bentable,
					   temperatures,
					   NumberOfTemps);
    Free(chemkin->Species);
    chemkin->Species = CopyString(name);
    PutInAtomCounts(chemkin,molecule);
    chemkinvalue = StoreValueInPropValue((VOID) chemkin,
					 CHEMKIN_READTHERMO_PROPERTY,
					 0,
					 PROP_VALUE_CALC,
					 value->Reference,
					 "Calculated From Benson Estimate",
					 types);
    chemkinvalue->Name = CopyString("Benson");
    AddProperty(chemkinvalue,molecule->Properties);
    
    FreeChemkinThermoRead(chemkin);
    Free(chemkin);
    FreeBensonSecondThermoTable(bentable);
    FreeGenPropValue(chemkinvalue);
    Free(chemkinvalue);
    value++;
  }
  Free(bentable);
}
 
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void PutInAtomCounts(ChemkinThermoRead *chemkin,MoleculeInfo *mol)
{
  MoleculeAtomCounts *counts;
  AtomicNumberCount *count;
  SetOfChemkinAtomicInfo *atominfo;
  ChemkinAtomicInfo *atom;
  int i,used;
  char *aname;

  atominfo = chemkin->AtomicSet = AllocateSetOfChemkinAtomicInfo;
  CreateSetOfChemkinAtomicInfo(atominfo,chemkin->ID,chemkin->Name,
			       4,0);

  used = 0;
  atom = atominfo->Atoms;
  counts = DetermineAtomCounts(mol);
  count = counts->AtomCounts;
  LOOPi(counts->NumberOfAtomCounts)
    {
      aname = AtomNameFromAtomicNumber(count->ID);
      CreateChemkinAtomicInfo(atom,i,aname,count->ID,count->ACount);
      count++;
      used++;
      atom++;
    }
  while(used < 4)
    {
      CreateChemkinAtomicInfo(atom,used,"",0,0);
      atom++;
      used++;
    }
}
void SampleEquil(ChemkinThermoRead *chemkin)
{
  FLOAT k,t,hf,sf;
  int i;
  t = 298.0;
      hf = ChemkinHFseries(chemkin,298.0);
      sf = ChemkinS0series(chemkin,298.0);
      k = hf - 298.0 * sf;
      printf("T=%10.2f   Hf=%10.5f     Sf=%10.5f  Keq=%10.5f\n",t,hf,sf);
  t = 300.0;
  LOOPi(10)
    {
      hf = ChemkinHFseries(chemkin,t);
      sf = ChemkinS0series(chemkin,t);
      k = hf - t * sf;
      printf("T=%10.2f   Hf=%10.5f     Sf=%10.5f\n",t,hf,sf);
      t += 100.0;
    }
} 
		       
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern ChemkinThermoRead *CalculateChemkinCoefficients(BensonSecondThermoTable *bentable,
						       FLOAT *temperatures, INT NumberOfTemps)

    {
     ChemkinThermoRead *chemkin;
     ThermoCoefficients *lower,*upper;
     FLOAT cpd,conversion;
     FLOAT *extrapolateT,*extrapolateCp;

     extrapolateT = AllocArrayFLOAT(5);
     *(extrapolateT + 0) = 1000;
     *(extrapolateT + 1) = 1500;
     *(extrapolateT + 2) = 2000;
     *(extrapolateT + 3) = 2500;
     *(extrapolateT + 4) = 3000;

     extrapolateCp = AllocArrayFLOAT(5);
     
     chemkin = AllocateChemkinThermoRead;
     CreateChemkinThermoRead(chemkin,bentable->ID,bentable->Name,
			     0,0,
			     *(temperatures+0),
			     *(temperatures+6),
			     *(temperatures+5),
			     0,0);
     chemkin->Species = CopyString(bentable->Name);
     
     lower = chemkin->LowerTempCoefficients = AllocateThermoCoefficients;
     upper = chemkin->UpperTempCoefficients = AllocateThermoCoefficients;

     CreateThermoCoefficients(lower,bentable->ID,bentable->Name,
			     7,0);
     CreateThermoCoefficients(upper,bentable->ID,bentable->Name,
			     7,0);
     
     conversion = 1.0/(RCONSTANT);

     cpd = CpFiniteDiff(*(temperatures+4),
			*(bentable->HeatCapacityValues + 4)*conversion,
			*(temperatures+5),
			*(bentable->HeatCapacityValues + 5)*conversion,
			*(temperatures+6),
			*(bentable->HeatCapacityValues + 6))*conversion;
     a1to5(*(temperatures+0),
	   *(temperatures+2),
	   *(temperatures+4),
	   *(temperatures+5),
	   *(bentable->HeatCapacityValues + 0)*conversion,
	   *(bentable->HeatCapacityValues + 2)*conversion,
	   *(bentable->HeatCapacityValues + 4)*conversion,
	   *(bentable->HeatCapacityValues + 5)*conversion,
	   cpd,
	   lower->Coefficients);

     extrapolateCpValues(temperatures,bentable->HeatCapacityValues,
			 extrapolateT,extrapolateCp);

     a1to5(*(extrapolateT+3),
	   *(extrapolateT+2),
	   *(extrapolateT+1),
	   *(extrapolateT+0),
	   *(extrapolateCp + 3)*conversion,
	   *(extrapolateCp + 2)*conversion,
	   *(extrapolateCp + 1)*conversion,
	   *(extrapolateCp + 0)*conversion,
	   cpd,
	   upper->Coefficients);
     /*
     printf("Extrapolated: %10.3f %10.3f %10.3f %10.3f     %10.3f %10.3f %10.3f %10.3f\n",
	    *(extrapolateT+3),
	    *(extrapolateT+2),
	    *(extrapolateT+1),
	    *(extrapolateT+0),
	    *(extrapolateCp + 3),
	    *(extrapolateCp + 2),
	    *(extrapolateCp + 1),
	    *(extrapolateCp + 0));
	   
     printf("Hf Compare: %10.3f %10.3f %10.3f %10.3f\n            %10.3f %10.3f %10.3f %10.3f\n",
	   *(bentable->HeatCapacityValues + 0),
	   *(bentable->HeatCapacityValues + 1),
	   *(bentable->HeatCapacityValues + 4),
	   *(bentable->HeatCapacityValues + 5),
	    CalculateCpWithCoeffs(*(temperatures+0),lower->Coefficients)/conversion,
	    CalculateCpWithCoeffs(*(temperatures+1),lower->Coefficients)/conversion,
	    CalculateCpWithCoeffs(*(temperatures+4),lower->Coefficients)/conversion,
	    CalculateCpWithCoeffs(*(temperatures+5),lower->Coefficients)/conversion);
     */
     CalculateA6(lower,upper,
		 bentable->HeatOfFormation,
		 *(temperatures),
		 1000.0);
     CalculateA7(lower,upper,
		 bentable->Entropy,
		 298.0,
		 1000.0);
     /*
     SampleEquil(chemkin);
     */
     return(chemkin);
     }
double Extrapolated(FLOAT *coeffs,FLOAT temperature)
{
  double v1;

  v1 = *(coeffs + 0) +
    *(coeffs + 1) * log(temperature) +
    *(coeffs + 2) * 1.0/(temperature) +
    *(coeffs + 3) * 1.0/(temperature*temperature) +
    *(coeffs + 4) * 1.0/(temperature*temperature*temperature);
  return v1;
}
  
/*f
**
**  DESCRIPTION
**    mat:  Matrix of temp exponents (5x5)
**           1.0, log(T),T(-1),T(-2),T(-3)
**    extmat: matrix of Cp values (5x1)
**    
**  REMARKS
**
*/
void extrapolateCpValues(FLOAT *temperatures,FLOAT *hvalues,
			 FLOAT *extrapolateT,FLOAT *extrapolateCp)
{
  FullMatrixFLT *mat,*invmat,*matcpy,*unit,*extmat,*coeffs;
  FLOAT *pnt,tp,cp,val;
  int i;

  mat = AllocateFullMatrixFLT;
  CreateFullMatrixFLT(mat,0,0,5,5,25,0);
  invmat = AllocateFullMatrixFLT;
  CreateFullMatrixFLT(invmat,0,0,5,5,25,0);
  matcpy = AllocateFullMatrixFLT;

  extmat = AllocateFullMatrixFLT;
  CreateFullMatrixFLT(extmat,0,0,5,1,5,0);
  LOOPi(5)
    {
      tp = *(temperatures + i + 2);
      cp = *(hvalues + i + 2);
      pnt = mat->Elements + i*5;

      *(pnt + 0) = 1.0;
      *(pnt + 1) = log(tp);
      *(pnt + 2) = 1.0/tp;
      *(pnt + 3) = 1.0/(tp*tp);
      *(pnt + 4) = 1.0/(tp*tp*tp);
      *(extmat->Elements + i) = cp;
    }
  CopyFullFullMatrixFLT(matcpy,mat);
  ComputeInverse(mat,invmat);
  unit = MatrixMultFLT(0,0,matcpy,invmat);
  coeffs = MatrixMultFLT(0,0,invmat,extmat);
  /*  
  PrintFullMatrixFLOAT((FullMatrixFLT *) unit,(CHAR *) "This should be the unit matrix",(CHAR *) "%10.2f");
  PrintFullMatrixFLOAT(extmat,(CHAR *) "Cp Matrix",(CHAR *) "%10.2f");
  PrintFullMatrixFLOAT(coeffs,(CHAR *) "Coefficient Matrix",(CHAR *) "%10.2f");
  */
  
  printf("Temperature    Extrapolated: \n");
  LOOPi(4)
    {
      *(extrapolateCp + i) = Extrapolated(coeffs->Elements,*(extrapolateT + i));
      /* printf("%10.0f     %15.4f\n",*(extrapolateT + i),*(extrapolateCp + i));*/
    }
}

/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static FLOAT CpFiniteDiff(FLOAT temp1, FLOAT h1,
			  FLOAT temp2, FLOAT h2,
			  FLOAT temp3, FLOAT h3)
     {
     FLOAT diff1,diff2,diff;
     
     diff1 = (temp1 - temp2)/(h1 - h2);
     diff2 = (temp2 - temp3)/(h2 - h3);
     
     diff = (diff1 + diff2)/2.0;
     return(diff);
     }
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void a1to5(FLOAT ftemp1, FLOAT ftemp2, FLOAT ftemp3, FLOAT ftemp4,
		  FLOAT fcp1, FLOAT fcp2, FLOAT fcp3, FLOAT fcp4, FLOAT fcpd,
		  FLOAT *answer)
{
  /*
    double s1,s2,s3,s4;
    double cpsolution[6][2];
    double cp1,cp2,cp3,cp4,cpd,temp1,temp2,temp3,temp4;
    
    cp1 = fcp1;
    cp2 = fcp2;
    cp3 = fcp3;
    cp4 = fcp4;
    temp1 = ftemp1;
    temp2 = ftemp2;
    temp3 = ftemp3;
    temp4 = ftemp4;

    #include"maple.benson.c"

   *(answer + 0) = cpsolution[1][1];
   *(answer + 1) = cpsolution[2][1];
   *(answer + 2) = cpsolution[3][1];
   *(answer + 3) = cpsolution[4][1];
   *(answer + 4) = cpsolution[5][1];
   /*
   printf("a1to5 Coefficients:  %10.3g  %10.3g  %10.3g  %10.3g  %10.3g \n",
   *(answer + 0),
   *(answer + 1),
   *(answer + 2),
   *(answer + 3),
   *(answer + 4));
   */
  FLOAT t1,t2,t3,t4,t5;
  FullMatrixFLT *mat,*matinv,*matcpy,*unit,*extmat,*coeffs;
  int i;
  FLOAT temp[5];
  mat = AllocateFullMatrixFLT;
  CreateFullMatrixFLT(mat,0,0,5,5,25,0);
  matinv = AllocateFullMatrixFLT;
  CreateFullMatrixFLT(matinv,0,0,5,5,25,0);
  extmat = AllocateFullMatrixFLT;
  CreateFullMatrixFLT(extmat,0,0,5,1,25,0);

  temp[0] = ftemp1;
  temp[1] = ftemp2;
  temp[2] = ftemp3;
  temp[3] = ftemp4;

  *(extmat->Elements + 0) = fcp1;
  *(extmat->Elements + 1) = fcp2;
  *(extmat->Elements + 2) = fcp3;
  *(extmat->Elements + 3) = fcp4;

  LOOPi(4)
    {      
      t1 = temp[i];
      t2 = t1*t1;
      t3 = t2*t1;
      t4 = t3*t1;

      *(mat->Elements + i*5 + 0) = 1.0;  
      *(mat->Elements + i*5 + 1) = t1;  
      *(mat->Elements + i*5 + 2) = t2;  
      *(mat->Elements + i*5 + 3) = t3;  
      *(mat->Elements + i*5 + 4) = t4;  
    }
  *(mat->Elements + 4*5 + 0) = 0.0;  
  *(mat->Elements + 4*5 + 1) = 1.0;  
  *(mat->Elements + 4*5 + 2) = 2.0*temp[3];  
  *(mat->Elements + 4*5 + 3) = 3.0*temp[3]*temp[3];  
  *(mat->Elements + 4*5 + 4) = 4.0*temp[3]*temp[3]*temp[3];  
  
  ComputeInverse(mat,matinv);
  coeffs = MatrixMultFLT(0,0,matinv,extmat);
  /*
  PrintFullMatrixFLOAT(coeffs,"Coefficient Matrix","%10.2f");
  */
  LOOPi(5)
    {
      *(answer +i) = *(coeffs->Elements +i);
    }
  /*
   printf("a1to5 Coefficients:  %10.3g  %10.3g  %10.3g  %10.3g  %10.3g \n",
   *(answer + 0),
   *(answer + 1),
   *(answer + 2),
   *(answer + 3),
   *(answer + 4));
  */
}  
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void CalculateA6(ThermoCoefficients *lower,
			ThermoCoefficients *upper,
			FLOAT heat,
			FLOAT temp0,
			FLOAT tempC)
     {
     FLOAT lower5Zero, lower5Com, upper5;
     FLOAT alower,hlower,aupper;
/*
     printf("LowerCoefficients:  %10.3g  %10.3g  %10.3g  %10.3g  %10.3g \n",
	    *(lower->Coefficients + 0),
	    *(lower->Coefficients + 1),
	    *(lower->Coefficients + 2),
	    *(lower->Coefficients + 3),
	    *(lower->Coefficients + 4));
	    */
     lower5Zero = CalculateHeatWith5(*(lower->Coefficients + 0),
				 *(lower->Coefficients + 1),
				 *(lower->Coefficients + 2),
				 *(lower->Coefficients + 3),
				 *(lower->Coefficients + 4),
				 temp0);
     lower5Com = CalculateHeatWith5(*(lower->Coefficients + 0),
				    *(lower->Coefficients + 1),
				    *(lower->Coefficients + 2),
				    *(lower->Coefficients + 3),
				    *(lower->Coefficients + 4),
				    tempC);
     upper5 = CalculateHeatWith5(*(upper->Coefficients + 0),
				 *(upper->Coefficients + 1),
				 *(upper->Coefficients + 2),
				 *(upper->Coefficients + 3),
				 *(upper->Coefficients + 4),
				 tempC);

     alower = heat/RCONSTANT - lower5Zero*temp0;
     /*
     printf("CalculateA6: %10.3f %10.3f: %10.3f  %10.3f  %10.3f\n",heat,lower5Zero,heat/RCONSTANT,lower5Zero*temp0,alower);
     printf("CalculateA6: %10.3f %10.3f %10.3f %10.3f\n               (%5f %10.3f) (%5f %10.3f)\n",
	    lower5Com,alower,lower5Com*tempC*RCONSTANT,alower*RCONSTANT,
	    temp0,lower5Zero*temp0*RCONSTANT+alower*RCONSTANT,
	    tempC,lower5Com*tempC*RCONSTANT+alower*RCONSTANT);
     */
     hlower = lower5Com*tempC*RCONSTANT+alower*RCONSTANT;
     
     aupper = hlower/RCONSTANT - upper5*tempC;
     
     *(upper->Coefficients + 5) = aupper;
     *(lower->Coefficients + 5) = alower;
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static FLOAT CalculateHeatWith5(FLOAT a1,FLOAT a2,FLOAT a3,FLOAT a4,FLOAT a5,
				FLOAT temp)
     {
     FLOAT cpheat;
     cpheat = a1 + temp*(a2/2.0 + 
			 temp*(a3/3.0 +
			       temp*(a4/4.0 +
				     temp*(a5/5.0))));

     return(cpheat);
     }
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void CalculateA7(ThermoCoefficients *lower,
			ThermoCoefficients *upper,
			FLOAT entropy,
			FLOAT temp0,
			FLOAT tempC)
     {
     FLOAT lower6Zero, lower6Com, upper6;
     FLOAT alower,elower,aupper;
     
     lower6Zero = CalculateEntropyWith6(*(lower->Coefficients + 0),
					*(lower->Coefficients + 1),
					*(lower->Coefficients + 2),
					*(lower->Coefficients + 3),
					*(lower->Coefficients + 4),
					*(lower->Coefficients + 5),
					temp0);
     lower6Com = CalculateEntropyWith6(*(lower->Coefficients + 0),
				    *(lower->Coefficients + 1),
				    *(lower->Coefficients + 2),
				    *(lower->Coefficients + 3),
				    *(lower->Coefficients + 4),
				    *(lower->Coefficients + 5),
				    tempC);
     upper6 = CalculateEntropyWith6(*(upper->Coefficients + 0),
				 *(upper->Coefficients + 1),
				 *(upper->Coefficients + 2),
				 *(upper->Coefficients + 3),
				 *(upper->Coefficients + 4),
				 *(upper->Coefficients + 5),
				 tempC);
     
     alower = entropy/(RCONSTANT) - lower6Zero;
     elower = lower6Com + alower;
     
     aupper = elower - upper6;
     
     *(upper->Coefficients + 6) = aupper;
     *(lower->Coefficients + 6) = alower;
     }
  
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static FLOAT CalculateEntropyWith6(FLOAT a1,FLOAT a2,FLOAT a3,
				   FLOAT a4,FLOAT a5,FLOAT a6,
				   FLOAT temp)
     {
     FLOAT entropy;
     
     entropy = a1*log(temp) +
	  a2*temp +
	       a3*pow(temp,2.0)/2.0 + 
		    a4*pow(temp,3.0)/3.0 + 
			 a5*pow(temp,4.0)/4.0;
     return(entropy);
     }
