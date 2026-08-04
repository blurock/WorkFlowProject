/*  FILE     molprt.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Setting up the property types for the molecules
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

/*S PrintMoleculeSet
*/
extern INT MasterPrintCurrentMolecules(BindStructure *bind)
     {
     INT ret;
     
     ret = MasterPrintMoleculeSet(bind,BIND_CURRENT_MOLECULES);
     return(ret);
     }

extern INT MasterPrintCurrentSubStructures(BindStructure *bind)
     {
     INT ret;
     
     ret = MasterPrintMoleculeSet(bind,BIND_CURRENT_SUBSTRUCTURES);
     return(ret);
     }

extern INT MasterPrintMoleculeSet(BindStructure *bind, INT cflag)
     {
     MoleculeSet *molset;
     FILE *out;
     CHAR *name,*dir;
     CommandMaster *commandmaster;
     
     molset = GetBoundStructure(bind,cflag);
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     name = GetCurrentStringArgument("MolOutName",commandmaster);
     dir = GetCurrentStringArgument("MolOutDir",commandmaster);
     
     out = OpenWriteFileFromCurrent("MolOutDir","MolOutName",
				    MOLECULE_PRINT_OUT_SUFFIX,
				    IGNORE,"Molecule Print Filename",
				    commandmaster);
     
     if(out != 0)
	  {
	  PrintPrettyMoleculeSet("",out,molset);
	  fclose(out);
	  }
     
     return(SYSTEM_NORMAL_RETURN);
     }

extern void PrintPrettyMoleculeSet(CHAR *prefix, FILE *file,
				   MoleculeSet *set)
     {
     CHAR *string;
     MoleculeInfo *mol;
     INT i; 
    
     if(set == 0) 
	  {
	  fprintf(file,"%s: No Molecule Set\n",prefix);
	  return;
	  }
     
     fprintf(file,"%s:%5d Molecules\n",prefix,set->NumberOfMolecules);
     string = StringOfBlanks(strlen(prefix)+5);
     mol = set->Molecules;
     LOOPi(set->NumberOfMolecules)
	  {
	  PrintPrettyMoleculeInfo(string,file,mol++,set->PropertyTypes);
	  fprintf(file,"\n");
	  }
     }


extern void PrintPrettyMoleculeInfo(CHAR *prefix, FILE *file, 
				    MoleculeInfo *molecule,
				    SetOfPropertyTypes *types)
     {
     CHAR *string;
     INT length;
     
     if(molecule == 0) 
	  {
	  fprintf(file,"%s: No Molecule\n",prefix);
	  return;
	  }
     
     fprintf(file,"%s:Mol %5d\n",prefix,molecule->ID);
     string = StringOfBlanks(strlen(prefix)+10);
     PrintPrettyMolFile(string,file,molecule->Molfile);
     PrintPrettyMoleculeElectronic(string,file,molecule->Electronic);
     Free(string);
     string = AllocateString(PRINT_BUFFER_LENGTH);
     length = PRINT_BUFFER_LENGTH;
     if(types != 0)
       PrintStringAllPropertySets(string,&length,types,molecule->Properties,0);
     fprintf(file,"%s",string);
     
     Free(string);
     }




