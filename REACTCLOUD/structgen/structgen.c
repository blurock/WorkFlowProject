/*  FILE     structgen.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**
**  REFERENCES
**
**  COPYRIGHT (C) 2005  REACTION Project / Edward S. Blurock 
*/
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"
#include "generate.h"

#include "structgen/structgen.c"

#define NUMBER_GENERATE_FUNCTIONS 5
static FunctionInfo GENERATE_LIST[NUMBER_GENERATE_FUNCTIONS] =
  {
    {1,"GenerateStructureRead",(INT (*)(VOID)) GenerateStructureRead},
    {2,"GenerateStructurePrint",(INT (*)(VOID)) GenerateStructurePrint},
    {3,"GenerateStructureFill",(INT (*)(VOID)) GenerateStructureFill},
    {4,"GenerateSingleMolecule",(INT (*)(VOID)) GenerateSingleMolecule},
    {5,"GenerateSetOfMolecules",(INT (*)(VOID)) GenerateSetOfMolecules}
  };

/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . .  static
*/
static FunctionList GENERATE_FUNCTIONS = {
        0,"StructureGenerationRead",
    	NUMBER_GENERATE_FUNCTIONS,
	GENERATE_LIST
	};

extern FunctionList *MergeFunctMoleculesGenerate(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
			     old, &GENERATE_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }
extern GenerateStructureMaster *InitializeGenerateStructureMaster() {
  GenerateStructureMaster *master = AllocateGenerateStructureMaster;
  CreateGenerateStructureMaster(master,1,"GenerateStructureSpecification",0,0);

  return master;
}

extern INT GenerateStructureRead(BindStructure *bind) {
     FILE *file;
     CommandMaster *commandmaster;
     GenerateStructureMaster *specmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     specmaster = GetBoundStructure(bind,BIND_GENERATE);
     file = OpenReadFileFromCurrent("SpecificationDirectory","SpecificationRoot",
				    SPECIFICATION_FILE_SUFFIX,
				    RECOVER,"Specification File",commandmaster);
     
     if(file != 0) {
       specmaster->BasicSpecification = ReadMoleculeStructureSpecification(file,bind);
     } else {
       fprintf(stderr,"ERROR: Specification file not found\n");
     }

     return(SYSTEM_NORMAL_RETURN);
     }
extern INT GenerateStructurePrint(BindStructure *bind) {
     FILE *file;
     CommandMaster *commandmaster;
     GenerateStructureMaster *specmaster;
     CHAR *string;
     INT length;

     specmaster = GetBoundStructure(bind,BIND_GENERATE);

     length = LINELENGTH*300;
     string = AllocateString(length);
     PrintStringMoleculeStructureSpecification(string,"-->",&length,specmaster->BasicSpecification);
     
     printf("%s\n\n",string);
     Free(string);
     return(SYSTEM_NORMAL_RETURN);
}



/*S MoleculeStructureSpecification
 */

/*F spec = ReadInMoleculeStructureSpecification(dir,name,suffix,bind)
**
**  DESCRIPTION
**    dir: The directory name of the specification
**    name: The root name of the specification
**    bind: The bind structure (for molecule and reaction data)
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
extern MoleculeStructureSpecification *ReadMoleculeStructureSpecification(FILE *file,
									  BindStructure *bind) {
     CommandMaster *commandmaster;
     CHAR *line,*part,*rest,*string;
     MoleculeStructureSpecification *spec;
     StructuralElement *element;
     INT i;

     printf("Read in Structure Specification\n");
     string = AllocateString(LINELENGTH);
     line = AllocateString(LINELENGTH);
     part = AllocateString(LINELENGTH);
     
     if(file != 0) {
       spec = AllocateMoleculeStructureSpecification;
       CreateMoleculeStructureSpecification(spec,1,"Specification",
					    MAXNNUMBEROFELEMENTS,0);


       line = NextNonBlankLine(file,string);
       element = spec->StructuralElements;
       spec->NumberOfElements = 0;
       printf("Read in Structure Specification -> Read in Lines\n");
	  while(line != 0)
	       {
		 CreateStructuralElement(element,spec->NumberOfElements,0,0,0,0);
                 rest = IsolateNextWord(line,part,' ',LINELENGTH);
		 element->Name = CopyString(part);
                 rest = IsolateNextWord(rest,part,' ',LINELENGTH);
		 element->Minimum = ConvertStringToInteger(part);
                 rest = IsolateNextWord(rest,part,' ',LINELENGTH);
		 element->Maximum = ConvertStringToInteger(part);
                 rest = IsolateNextWord(rest,part,' ',LINELENGTH);
		 element->Priority = ConvertStringToInteger(part);

	         line = NextNonBlankLine(file,string);
	         element++;
	         spec->NumberOfElements += 1;
	       }
	  fclose(file);
	  }
     Free(string);
     Free(part);
     Free(line);
     
     return(spec);
     }

/*F string = PrintStringMoleculeStructureSpecification(string,prefix,length,spec)
**
**  DESCRIPTION
**    spec: The MoleculeStructureSpecification specification
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
CHAR *PrintStringMoleculeStructureSpecification(CHAR *string,
						CHAR *prefix,
						INT *length,
						MoleculeStructureSpecification *spec) {
  StructuralElement *element;
  CHAR *temp;
  INT i;

  element = spec->StructuralElements;
  for(i=0;i<spec->NumberOfElements;i++) {
    string = PrintStringStructuralElement(string,prefix,length,element);
    element++;
  }
  return string;
}

/*F string = PrintStringStructuralElement(string,prefix,length,element)
**
**  DESCRIPTION
**    element: The StructuralElement specification
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
CHAR *PrintStringStructuralElement(CHAR *string,
						  CHAR *prefix,
						  INT *length,
						  StructuralElement *element) {
  CHAR *temp;

  temp = AllocateString(LINELENGTH);

  sprintf(temp,"%20s  %10d %10d %10d\n",
	  element->Name,
	  element->Minimum,
	  element->Maximum,
	  element->Priority);
  string = PrintStringString(string,length,temp);
  return string;
}

