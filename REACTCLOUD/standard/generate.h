/*  FILE generate.h    
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**
**  REFERENCES
**
**  OVERVIEW
**       This is an overview
**
**  IMPLEMENTATION
**        The implementation 
**
**  COPYRIGHT (C) 2005  REACTION Project / Edward S. Blurock 
*/
 
 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/

#include "structgen/structgen.h"

/*V  . . . GLOBAL VARIABLES  . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#define BIND_GENERATE             2100
#define MAXNNUMBEROFELEMENTS  100
#define STRUCTGEN_FILE_SUFFIX    "lst"
#define SPECIFICATION_FILE_SUFFIX "txt"
#define R_GROUP_SPEC     320003001

/*
 */
extern FunctionList *MergeFunctMoleculesGenerate(FunctionList *old);
extern GenerateStructureMaster *InitializeGenerateStructureMaster();

extern INT GenerateStructureRead(BindStructure *bind);
extern INT GenerateStructurePrint(BindStructure *bind);
extern INT GenerateStructureFill(BindStructure *bind);
extern INT GenerateSingleMolecule(BindStructure *bind);
extern INT GenerateSetOfMolecules(BindStructure *bind);
/*
 */
extern MoleculeStructureSpecification *ReadMoleculeStructureSpecification(FILE *file,
									  BindStructure *bind);
extern CHAR *PrintStringMoleculeStructureSpecification(CHAR *string,
						CHAR *prefix,
						INT *length,
						MoleculeStructureSpecification *spec);
extern CHAR *PrintStringStructuralElement(CHAR *string,
					  CHAR *prefix,
					  INT *length,
					  StructuralElement *element);

/* generate.c
 */
extern int FillInFullElementSpecification(StructuralElement *element,
					  FullStructuralElement *full,
					  SetOfGraphMetaAtoms *graphmetaatoms,
					  BindStructure *bind);



