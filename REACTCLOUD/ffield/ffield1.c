#include "compile.h"
#include "basic.h"

#include "chemistry.h"

#include "mm2.c"

static MM2Method *SetUpMM2Method(MASTER_STRUCTURE);
static void ScaleCoordinatesToStandardBond(MolFileMolecule *molfile, 
					   MM2Norms *norm);
static void NoiseToCoordinates(MolFileMolecule *molfile,
			       MM2Norms *norm);
static void CenterCoordinates(MolFileMolecule *molfile, 
			      MM2Norms *norm);
static FLOAT AverageBondLength(MolFileMolecule *molfile);


extern INT DEBUGPRINT;

extern INT MasterNormalizeMolFileCoordinates(MASTER_STRUCTURE)
     {
     MoleculeSet *moleculeset;
     MoleculeInfo *molecule;
     INT i;
     MolFileMolecule *molfile;
     ChemMasterStructure *master;
     MM2Norms *norms;
     
     master = GetChemistryData(MASTER);
     norms  = SetUpMasterNorms(MASTER);
     moleculeset = master->Molecules;

     molecule = moleculeset->Molecules;
     LOOPi(moleculeset->NumberOfMolecules)
	  {
	  NormalizeMolFile(molecule->Molfile,norms);
	  molecule++;
	  }
     Free(norms);
     }

#define FF_INPUT_SUFFIX                    "inp"
#define FF_LIST_SUFFIX                     "lst"

extern INT MasterSetUpMM2Job(MASTER_STRUCTURE)
     {
     INT i;
     MoleculeSet *moleculeset;
     MoleculeInfo *molecule;
     MolFileMolecule *molfile;
     ChemMasterStructure *master;
     MM2Method *method;
     CHAR *inputdir,*outputdir,*tempdir,*ffroot,*filename;
     FILE *file,*inplist;
     
     moleculeset = GetMoleculeSetMaster(MASTER);
     method  = SetUpMM2Method(MASTER);

     inputdir        = GetCurrentFileNameArgument("FFinputdir",MASTER);
     outputdir       = GetCurrentFileNameArgument("FFoutputdir",MASTER);
     tempdir         = GetCurrentFileNameArgument("FFtempdir",MASTER);
     ffroot          = GetCurrentFileNameArgument("RootffName",MASTER);
     
     filename = AllocateString(LINELENGTH);
     sprintf(filename,"%s.%s",ffroot,FF_LIST_SUFFIX);
     inplist = OpenWriteFile(filename,inputdir,RECOVER);
     
     molecule = moleculeset->Molecules;
     LOOPi(moleculeset->NumberOfMolecules)
	  {
	  sprintf(filename,"%s%d.%s",ffroot,molecule->ID,FF_INPUT_SUFFIX);
	  file = OpenWriteFile(filename,inputdir,RECOVER);
	  if(file != 0)
	       {
	       OutputMM2DatFile(molecule->Molfile,method,file);
	       sprintf(filename,"%s%d",ffroot,molecule->ID);
	       fprintf(inplist,"%s\n",filename);
	       fclose(file);
	       }
	  molecule++;
	  }
     fclose(inplist);
     
     Free(ffroot);
     Free(tempdir);
     Free(inputdir);
     Free(outputdir);
     Free(filename);
     }

static MM2Method *SetUpMM2Method(MASTER_STRUCTURE)
     {
     MM2Method *method;
     
     method = AllocateMM2Method;
     CreateMM2Method(method,0,"name",
		     25.0,4,2,1);
     return(method);
     }

extern OutputMM2DatFile(MolFileMolecule *molfile,
			MM2Method *method,
			FILE *file)
     {
     OutputMM2DatFileHeader(molfile,method,file);
     OutputMM2DatFileCoordinates(molfile,file);
     }

extern OutputMM2DatFileHeader(MolFileMolecule *molfile,
			      MM2Method *method,
			      FILE *file)
     {
     
     fprintf(file,"%5.1f%2d%2d%2d%3d%2d%3d%3d%5.1f%10.8f%10.8f%4d%4d%5.1f",
	     method->MaxTime,
	     method->OptMethod,
	     0,
	     method->ForceField,
	     0,
	     method->VarMin,
	     0,
	     0,
	     0.0,
	     0.0,
	     0.0,
	     0,
	     0,
	     25.0);
     fprintf(file,"00000000000000000000");
     fprintf(file,"\n");
     fprintf(file,"%s",molfile->Name);
     fprintf(file,"\n");
     fprintf(file,"%3d\n",molfile->NAtoms);
     }

extern OutputMM2DatFileCoordinates(MolFileMolecule *molfile,
			FILE *file)
     {
     MolFileAtom *atomdata;
     MolFileBond *bond;
     INT i,j,num,count;
     
     atomdata = molfile->Atoms;
     LOOPi(molfile->NAtoms)
	  {
	  fprintf(file,"%14.9f%14.9f%14.9f",
		  atomdata->X,
		  atomdata->Y,
		  atomdata->Z);
	  fprintf(file,"%3d%3d%3d",
		  atomdata->AtomicNumber,
		  atomdata->Charge,
		  0);
	  count = 0;
	  bond = molfile->Bonds;
	  LOOPj(molfile->NBonds)
	       {
	       if(i == bond->I)
		    {
		    count++;
		    fprintf(file,"%4d",(bond->J)+1);
		    }
	       else if(i == bond->J)
		    {
		    count++;
		    fprintf(file,"%4d",(bond->I)+1);
		    }	       
	       bond++;
	       }
	  num = 6 - count;
	  LOOPj(num)
	       {
	       fprintf(file,"   0");
	       }
	  fprintf(file,"%4d",(atomdata->ID)+1);
	  fprintf(file,"\n");
	  atomdata++;
	  }
     }

     

/***********************************************************************/
/* Setting Up Norms
/***********************************************************************/

extern MM2Norms *SetUpMasterNorms(MASTER_STRUCTURE)
     {
     MM2Norms *norms;
     
     norms = AllocateMM2Norms;
     
     norms->BondScale = GetCurrentIntegerArgument("EnableBondScale",MASTER);
     norms->Centering = GetCurrentIntegerArgument("EnableCentering",MASTER);
     norms->Noise     = GetCurrentIntegerArgument("EnableNoise",MASTER);

     norms->X = GetCurrentFloatArgument("NormXCenter",MASTER);
     norms->Y = GetCurrentFloatArgument("NormYCenter",MASTER);
     norms->Z = GetCurrentFloatArgument("NormZCenter",MASTER);
     
     norms->StandardBondLength = 1.5;
	  GetCurrentFloatArgument("StandardLength",MASTER);
     norms->NoiseLevel = 
	  GetCurrentFloatArgument("NoiseLevel",MASTER);
     return(norms);
     
     }

extern void NormalizeMolFile(MolFileMolecule *molfile, 
			     MM2Norms *norms)
     {
     if(norms->BondScale != 0)
	  ScaleCoordinatesToStandardBond(molfile, norms);
     if(norms->Centering != 0)
	  CenterCoordinates(molfile, norms);
     if(norms->Noise != 0)
	  NoiseToCoordinates(molfile,norms);
     }

static void ScaleCoordinatesToStandardBond(MolFileMolecule *molfile, 
			     MM2Norms *norm)
     {
     FLOAT ave,correction;
     INT i;
     MolFileAtom *atomdata;
     
     ave = AverageBondLength(molfile);
     correction = norm->StandardBondLength / ave;
     
     atomdata = molfile->Atoms;
     LOOPi(molfile->NAtoms)
	  {
	  atomdata->X *= correction;
	  atomdata->Y *= correction;
	  atomdata->Z *= correction;
	  atomdata++;
	  }
     }

#define RANDNOISE(noise) ((FLOAT) (random() % 1000))*noise/1000.0
static void NoiseToCoordinates(MolFileMolecule *molfile,
			     MM2Norms *norm)
     {
     MolFileAtom *atomdata;
     INT i;
     
     atomdata = molfile->Atoms;
     LOOPi(molfile->NAtoms)
	  {
	  atomdata->X += RANDNOISE(norm->NoiseLevel);
	  atomdata->Y += RANDNOISE(norm->NoiseLevel);
	  atomdata->Z += RANDNOISE(norm->NoiseLevel);
	  atomdata++;
	  }
     }

static void CenterCoordinates(MolFileMolecule *molfile, 
			     MM2Norms *norm)
     {
     MolFileAtom *atomdata;
     INT i;
     FLOAT sx,sy,sz,xcor,ycor,zcor;
     
     sx = 0.0;
     sy = 0.0;
     sz = 0.0;
     atomdata = molfile->Atoms;
     LOOPi(molfile->NAtoms)
	  {
	  sx -= atomdata->X;
	  sy -= atomdata->Y;
	  sz -= atomdata->Z;
	  atomdata++;
	  }

     xcor = sx/molfile->NAtoms + norm->X;
     ycor = sy/molfile->NAtoms + norm->Y;
     zcor = sz/molfile->NAtoms + norm->Z;
     atomdata = molfile->Atoms;
     LOOPi(molfile->NAtoms)
	  {
	  atomdata->X += xcor;
	  atomdata->Y += ycor;
	  atomdata->Z += zcor;
	  atomdata++;
	  }
     }

static FLOAT AverageBondLength(MolFileMolecule *molfile)
     {
     FLOAT bondsum,dx,dy,dz,len2;
     MolFileAtom *atm1,*atm2,*atoms;
     MolFileBond *bond;
     INT i;
     
     bondsum = 0.0;
     atoms = molfile->Atoms;
     bond = molfile->Bonds;
     LOOPi(molfile->NBonds)
	  {
	  atm1 = atoms + bond->I;
	  atm2 = atoms + bond->J;

	  dx = atm1->X - atm2->X;
	  dy = atm1->Y - atm2->Y;
	  dz = atm1->Z - atm2->Z;
	  
	  len2 = dx*dx + dy*dy + dz*dz;
	  bondsum += sqrt(len2);
	  
	  bond++;
	  }
     bondsum /= ((FLOAT) molfile->NBonds);
     return(bondsum);
     }

