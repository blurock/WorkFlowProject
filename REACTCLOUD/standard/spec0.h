#include "spectrum/spec.h"

#define MAXIMUM_SPECTRUM_MOLECULES    1000
#define BIND_CURRENT_SPECTRASET       2200
#define BIND_SPECTRASET_NAME          "CurrentSpectrumSet"

#define MAXIMUM_SPECTRAL_INTERVALS    20
#define MINIMMUM_SPECTRAL_INTERVALS   10
#define BASIC_SPECTRAL_INCREMENT     0.1

#define SMALLFREQ     -10000.00
#define SMALLHEIGHT   -10000.00
#define LARGEFREQ      10000.00
#define LARGEHEIGHT    10000.00
#define DEFAULTINTERVAL    1.0
#define MINIMUM_DISTANCE   24.0

extern void ComputeSpectrumSetData(SpectrumSet *specset);
extern void ConvertSetToStandard(Spectrum *spectrum,
                                   SpectrumStandard *standard,
				   SpectrumSetStandard *specinfo,
				   INT numspectra);
extern void ConvertSetToDifference(Spectrum *spectrum,
                                   SpectrumStandard *difference,
				   SpectrumSetStandard *specinfo,
				   INT numspectra);
extern SpectrumSet *ComputeMolBasicSpectrum(SpectrumSet *set,
					    MoleculeSet *molecules, 
					    INT atomproperty);
extern void MoleculeSpectrumSetStandard(SpectrumSet *specset,
					INT MaxNumberOfIntervals,
					INT MinNumberOfIntervals,
					FLOAT BasicIncrement);
extern void PrintSpectrumDataBase(SpectrumSet *specset,
				  CHAR *name,
                                  FILE *file);
extern SpectrumSet *ComputeMolBondSpectrum(SpectrumSet *set,
					    MoleculeSet *molecules, 
					    INT atomproperty);


extern void ComputeMoleculeBondPropertySpectrum(SpectrumSet *set,
					    MoleculeSet *molecules,
					    INT prop,
					    INT max_intervals,
					    INT min_intervals,
					    FLOAT increment);
extern void ComputeMoleculePropertySpectrum(SpectrumSet *set,
					    MoleculeSet *molecules,
					    INT prop,
					    INT max_intervals,
					    INT min_intervals,
					    FLOAT increment);
/* bind.c
 */
extern SpectrumSet *InitializeMoleculeSpectrumSet(INT id, CHAR *name);
extern FunctionList *MergeFunctMoleculeSpectrum(FunctionList *old);






