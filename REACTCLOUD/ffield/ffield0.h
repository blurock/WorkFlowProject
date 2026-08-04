#include "mm2.h"

/*************************************************************************/
/*   ffield1.c routines                                                  */
/*************************************************************************/
extern INT MasterNormalizeMolFileCoordinates(MASTER_STRUCTURE);
extern INT MasterSetUpMM2Job(MASTER_STRUCTURE);


extern OutputMM2DatFile(MolFileMolecule *molfile,
			MM2Method *method,
			FILE *file);
extern OutputMM2DatFileHeader(MolFileMolecule *molfile,
			      MM2Method *method,
			      FILE *file);
extern OutputMM2DatFileCoordinates(MolFileMolecule *molfile,
				   FILE *file);
extern MM2Norms *SetUpMasterNorms(MASTER_STRUCTURE);
extern void NormalizeMolFile(MolFileMolecule *molfile, 
			     MM2Norms *norms);
extern INT ReadFFOutputData(MASTER_STRUCTURE);
