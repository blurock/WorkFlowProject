/*  FILE     bind.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
** The bind routines for the spectral calculation and bind
**  function setup
**
**  REFERENCES
**
**  COPYRIGHT (C) 1999  REACTION Project / Edward S. Blurock 
*/
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "molprops.h"
#include "spec0.h"

static INT PrintSpectraSet(BindStructure *bind);
static INT ComputeMoleculeSpectraSet(BindStructure *bind);
static INT ComputeMoleculeBondSpectraSet(BindStructure *bind);
static INT ComputeMoleculeSpectraTotalSet(BindStructure *bind);

extern SpectrumSet *InitializeMoleculeSpectrumSet(INT id, CHAR *name)
     {
     SpectrumSet *set;

     set = AllocateSpectrumSet;
     CreateSpectrumSet(set,BIND_CURRENT_SPECTRASET,BIND_SPECTRASET_NAME,
		       MAXIMUM_SPECTRUM_MOLECULES,
		       0,0,0,0,0);
     set->NumberOfSpectra = 0;
     set->Standards = AllocateSpectrumStandardSet;
     CreateSpectrumStandardSet(set->Standards,id,name,
			       MAXIMUM_SPECTRUM_MOLECULES,
			       0,0);
     set->Standards->NumberOfSpectra = 0;
     return(set);
     }
#define NUMBER_SPEC_COMMANDS    4

#define MOLECULE_SPECTRA   0
#define PRINT_SPECTRA      1
#define BOND_SPECTRA       2
#define TOTAL_SET          3

/*          "From Current Set of Molecules, Compute ATOM SE-Spectra Set"},
          "From Current Set of Molecules, Compute BOND SE-Spectra Set"},
          "From Current Set of Molecules, compute all spectral quantities"},
          "Print Out Spectral Data"}
*/
static FunctionInfo SPEC_COMMANDS[NUMBER_SPEC_COMMANDS] = {
     {MOLECULE_SPECTRA,   "ComputeMoleculeSpectraSet",       (INT (*)(void)) ComputeMoleculeSpectraSet},
     {BOND_SPECTRA,       "ComputeMoleculeBondSpectraSet",   (INT (*)(void)) ComputeMoleculeBondSpectraSet},
     {TOTAL_SET,          "ComputeMoleculeSpectraTotalSet",  (INT (*)(void)) ComputeMoleculeSpectraTotalSet},
     {PRINT_SPECTRA,      "PrintSpectraSet",                 (INT (*)(void)) PrintSpectraSet},
     };
static FunctionList SPECTRUM_FUNCTIONS = {
        0,"SpectrumGenerationFunctions",
    	NUMBER_SPEC_COMMANDS,
	SPEC_COMMANDS
	};

extern FunctionList *MergeFunctMoleculeSpectrum(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
				  old, &SPECTRUM_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }
static INT PrintSpectraSet(BindStructure *bind)
     {
     CHAR *string;
     FILE *control;
     SpectrumSet *spectraset;

     spectraset = GetBoundStructure(bind,BIND_CURRENT_SPECTRASET);
     string = AllocateString(LINELENGTH);
     
     sprintf(string,"%s.ctl",bind->Name);
     control = OpenWriteFile(string,"",-1);
     
     PrintSpectrumDataBase(spectraset,"",control);
     Free(string);
     fclose(control);
     return(SYSTEM_NORMAL_RETURN);
     }

static INT ComputeMoleculeSpectraSet(BindStructure *bind) 
     {
     SpectrumSet *set;
     MoleculeSet *molset;

     set = GetBoundStructure(bind,BIND_CURRENT_SPECTRASET);
     molset = GetBoundStructure(bind, BIND_CURRENT_MOLECULES);

     ComputeMolBasicSpectrum(set,
			     molset,
			     CHARGE);
     ComputeSpectrumSetData(set);
     MoleculeSpectrumSetStandard(set,
				 MAXIMUM_SPECTRAL_INTERVALS,
				 MINIMMUM_SPECTRAL_INTERVALS,
				 BASIC_SPECTRAL_INCREMENT);
     
     ConvertSetToStandard(set->Spectra,
			  set->Standards->Standard,
			  set->Standard,
			  set->NumberOfSpectra);
     return(SYSTEM_NORMAL_RETURN);
     }

static INT ComputeMoleculeBondSpectraSet(BindStructure *bind)
     {
     SpectrumSet *set;
     MoleculeSet *molset;

     set = GetBoundStructure(bind,BIND_CURRENT_SPECTRASET);
     molset = GetBoundStructure(bind, BIND_CURRENT_MOLECULES);
    
     ComputeMolBondSpectrum(set,
			     molset,
			     POLARIZABILITY);
     ComputeSpectrumSetData(set);
     MoleculeSpectrumSetStandard(set,
				 MAXIMUM_SPECTRAL_INTERVALS,
				 MINIMMUM_SPECTRAL_INTERVALS,
				 BASIC_SPECTRAL_INCREMENT);
     
     ConvertSetToStandard(set->Spectra,
			  set->Standards->Standard,
			  set->Standard,
			  set->NumberOfSpectra);
     return(SYSTEM_NORMAL_RETURN);
     }


static INT ComputeMoleculeSpectraTotalSet(BindStructure *bind)
     {
     SpectrumSet *set;
     MoleculeSet *molset;
     INT max,min;
     CHAR *string;
     FLOAT inc;
     FILE *control;
     CommandMaster *commandmaster;
     
     string = AllocateString(LINELENGTH);

     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     set = GetBoundStructure(bind,BIND_CURRENT_SPECTRASET);
     molset = GetBoundStructure(bind, BIND_CURRENT_MOLECULES);

     max = GetCurrentIntegerArgument("MaximumNumberOfIntervals",commandmaster);
     min = GetCurrentIntegerArgument("MinimumNumberOfIntervals",commandmaster);
     inc = GetCurrentFloatArgument("IntervalIncrement",commandmaster);

     sprintf(string,"%s.ctl",bind->Name);
     control = OpenWriteFile(string,"",-1);
     
     ComputeMoleculePropertySpectrum(set,molset,CHARGE,
			     max,min,inc);
     sprintf(string,"%s.chrmol",bind->Name);
     set->Name = CopyString(string);
     PrintSpectrumDataBase(set,"ACHR",control);
     
     ComputeMoleculePropertySpectrum(set,molset,ELECTRONEGATIVITY,
			     max,min,inc);
     sprintf(string,"%s.elemol",bind->Name);
     set->Name = CopyString(string);
     PrintSpectrumDataBase(set,"AELE",control);

     ComputeMoleculeBondPropertySpectrum(set,molset,CHARGE,
					 max,min,inc);
     sprintf(string,"%s.chrbnd",bind->Name);
     set->Name = CopyString(string);
     PrintSpectrumDataBase(set,"BCHR",control);
     
     ComputeMoleculeBondPropertySpectrum(set,molset,ELECTRONEGATIVITY,
					 max,min,inc);
     sprintf(string,"%s.elebnd",bind->Name);
     set->Name = CopyString(string);
     PrintSpectrumDataBase(set,"BELE",control);

     Free(string);
     fclose(control);
     return(SYSTEM_NORMAL_RETURN);
     }
