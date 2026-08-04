/*  FILE     specmol.c
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

static ExtractMolecularSpectrum(MoleculeInfo *mol,
				Spectrum *spec,
				INT prop);
static ExtractMolecularBondSpectrum(MoleculeInfo *mol,
				    Spectrum *spec,
				    INT prop);

extern void ComputeMoleculePropertySpectrum(SpectrumSet *set,
					    MoleculeSet *molecules,
					    INT prop,
					    INT max_intervals,
					    INT min_intervals,
					    FLOAT increment)
     {
     
     ComputeMolBasicSpectrum(set,molecules,prop);

     ComputeSpectrumSetData(set);
     MoleculeSpectrumSetStandard(set,
				 max_intervals,
				 min_intervals,
				 increment);
     
     set->Standards->NumberOfSpectra = set->NumberOfSpectra;
     ConvertSetToStandard(set->Spectra,
			  set->Standards->Standard,
			  set->Standard,
			  set->NumberOfSpectra);
     }

extern void ComputeMoleculeBondPropertySpectrum(SpectrumSet *set,
					    MoleculeSet *molecules,
					    INT prop,
					    INT max_intervals,
					    INT min_intervals,
					    FLOAT increment)
     {
     
     ComputeMolBondSpectrum(set,molecules,prop);

     ComputeSpectrumSetData(set);
     MoleculeSpectrumSetStandard(set,
				 max_intervals,
				 min_intervals,
				 increment);
     
     ConvertSetToStandard(set->Spectra,
			  set->Standards->Standard,
			  set->Standard,
			  set->NumberOfSpectra);
     }

extern SpectrumSet *ComputeMolBasicSpectrum(SpectrumSet *set,
					    MoleculeSet *molecules, 
					    INT atomproperty)
     {
     INT i;
     MoleculeInfo *molecule;
     Spectrum *spec;
     
     molecule = molecules->Molecules;
     molecule = molecules->Molecules;
     spec = set->Spectra;
     set->NumberOfSpectra = molecules->NumberOfMolecules;
     LOOPi(molecules->NumberOfMolecules)
	  {
	  printf("%5d%40s\n",molecule->ID,molecule->Name);
	  ExtractMolecularSpectrum(molecule,spec,atomproperty);
	  spec++;
	  molecule++;
	  }
     return(set);
     }

static ExtractMolecularSpectrum(MoleculeInfo *mol,
				Spectrum *spec,
				INT prop)
     {
     PropValue *value;
     INT i,natoms;
     SpectrumPair *pair;
     
     natoms = mol->Electronic->NAtoms;
     CreateSpectrum(spec,mol->ID,mol->Name,
		    natoms,0);

     pair = spec->Points;
     LOOPi(natoms)
	  {
	  value = FindAtomProperty(mol,i,prop);
	  CreateSpectrumPair(pair,i,mol->Name,value->Float,1);
	  pair++;
	  }
     }
/***********************************************************************/
extern SpectrumSet *ComputeMolBondSpectrum(SpectrumSet *set,
					   MoleculeSet *molecules, 
					   INT atomproperty)
     {
     INT i;
     MoleculeInfo *molecule;
     Spectrum *spec;
     
     molecule = molecules->Molecules;
     
     spec = set->Spectra;
     set->NumberOfSpectra = molecules->NumberOfMolecules;
     LOOPi(molecules->NumberOfMolecules)
	  {
	  ExtractMolecularBondSpectrum(molecule,spec,atomproperty);
	  spec++;
	  molecule++;
	  }
     return(set);
     }

static ExtractMolecularBondSpectrum(MoleculeInfo *mol,
				    Spectrum *spec,
				    INT prop)
     {
     MolFileMolecule *mlf;
     PropValue *valueI,*valueJ;
     INT i,nbonds;
     SpectrumPair *pair;
     MolFileBond *bond;
     FLOAT diff;
     
     mlf = mol->Molfile;
     nbonds = mlf->NBonds;
     CreateSpectrum(spec,mol->ID,mol->Name,
		    nbonds,0);

     pair = spec->Points;
     bond = mlf->Bonds;
     LOOPi(nbonds)
	  {
	  valueI = FindAtomProperty(mol,bond->I,prop);
	  valueJ = FindAtomProperty(mol,bond->J,prop);
	  diff = valueI->Float - valueJ->Float;
	  if(diff < 0 ) diff = -diff;
	  CreateSpectrumPair(pair,i,mol->Name,diff,1);
	  bond++;
	  pair++;
	  }
     }

/*************************************************************************/

extern void MoleculeSpectrumSetStandard(SpectrumSet *specset,
					INT MaxNumberOfIntervals,
					INT MinNumberOfIntervals,
					FLOAT BasicIncrement)
     {
     INT numintervals;
     FLOAT range,increment,begin,end;
     SpectrumSetData *data;
     double ans,nints;

     data = specset->Data;

     increment = BasicIncrement;

     range = data->LargestSetFrequency - data->SmallestSetFrequency;
     ans = (double) range /((double) increment);
     nints = floor(ans) + 1;
     numintervals = (INT) ans + 1.5;
     
     while(numintervals < MinNumberOfIntervals)
	  {
	  increment /= 2.0;
	  nints = range / increment + 1.5;
	  numintervals = (INT) nints;
	  }
     
     while(numintervals > MaxNumberOfIntervals)
	  {
	  increment *= 2.0;
	  nints = range / increment + 1.5;
	  numintervals = (INT) nints;
	  }
     
     if(numintervals < MinNumberOfIntervals)
	  Error(numintervals,"Inconsistent Interval Range Determination");

     begin = floor(data->SmallestSetFrequency / increment) * increment;
     end   = ceil(data->LargestSetFrequency  / increment) * increment;
     
     specset->Standard = AllocateSpectrumSetStandard;
     CreateSpectrumSetStandard(specset->Standard, specset->ID,specset->Name,
			       begin,end,numintervals,increment);
     }

