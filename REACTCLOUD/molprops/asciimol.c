/*  FILE     asciimol.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Read in ASCII file for molecule information
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

 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
/*F ret = LocalReadASCIIMoleculeProps(bind)
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
INT LocalReadASCIIMoleculeProps(BindStructure *bind)
     {
     INT ret;
     MoleculeSet *orig;
     orig = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);

     ret = LocalReadInASCIIMols(orig,bind);
     return(ret);
     }
/*f ret = ReadInASCIIMols(dbflag,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern INT LocalReadInASCIIMols(MoleculeSet *orig,
				BindStructure *bind) {
     CommandMaster *commandmaster;
     FILE *file;
     ReadInMoleculeSet *asciimolset;
     MoleculeSet *molset;
     INT max;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
    
     file = OpenReadFileFromCurrent("MolDirectory","RootMolName",
				    MOL_FILE_LIST_SUFFIX,
				    IGNORE,"ASCII Molecules",commandmaster);
     max = GetCurrentIntegerArgument("ASCIIMoleculeMaxNum",commandmaster);
     
     if(file != 0) {
       asciimolset = ReadInASCIIMolecules(file,max);
       FillInMoleculePropertyValues(asciimolset,orig,bind);
       FreeReadInMoleculeSet(asciimolset);
       Free(asciimolset);
       fclose(file);
     }
     return(SYSTEM_NORMAL_RETURN);
}
/*f molset = ReadInASCIIMolecules(file,max)
**
**  DESCRIPTION
**    file:  The ASCII source of the 
**    max:   The maximum 
**
**  REMARKS
**
*/
extern ReadInMoleculeSet *ReadInASCIIMolecules(FILE *file, INT max)
     {
     CHAR *string,*word,*line,*name,*rest;
     ReadInMoleculeSet *molset;
     ReadInMolecule *mol;
     INT id;
     
     string = AllocateString(PRINT_BUFFER_LENGTH);
     word = AllocateString(PRINT_BUFFER_LENGTH);
     
     NextNonBlankLine(file,string);
     name = IsolateNextWord(string,word,BLANK,PRINT_BUFFER_LENGTH);
     id = atoi(word);
     EliminateBlanks(name);

     molset = AllocateReadInMoleculeSet;
     CreateReadInMoleculeSet(molset,id,name,
			     max,0);
     molset->NumberOfMolecules = 0;
     
     NextNonBlankLine(file,string);
     mol = molset->Molecules;
     line = string;
     while(line != 0 && molset->NumberOfMolecules < max)
	  {
	  rest = IsolateNextWord(line,word,BLANK,PRINT_BUFFER_LENGTH);
	  
	  CreateReadInMolecule(mol,molset->NumberOfMolecules,word,
			       rest,0);
	  
	  mol->Properties = AllocateASCIIProperties;
	  line = FillInProperties(file,mol->Properties,string);
	  
	  mol++;
	  molset->NumberOfMolecules += 1;
	  }
     Free(string);
     Free(word);
     return(molset);
     }    
 
/*f FillInMoleculePropertyValues(asciimolset,molset,bind);
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void FillInMoleculePropertyValues(ReadInMoleculeSet *asciimolset,
				    MoleculeSet *molset,
				    BindStructure *bind)
     {
     ReadInMolecule *asciimol;
     MoleculeInfo *mol;
     INT i;
     
     asciimol = asciimolset->Molecules;
     mol = molset->Molecules;
     LOOPi(asciimolset->NumberOfMolecules)
	  {
	  if(mol->ID != -1)
	       {
	       FillInASCIIValue(asciimol->Properties,
				mol->Properties,
				molset->PropertyTypes,
				bind);
	       }
	  mol++;
	  asciimol++;
	  }
     }


