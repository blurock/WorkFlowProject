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
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"

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
     fprintf(file,"~\n");
     PrintMoleculeAsMolFile(file,molecule);
     fprintf(file,"~\n");
     PrintPrettyMoleculeElectronic(string,file,molecule->Electronic);
     Free(string);
     string = AllocateString(PRINT_BUFFER_LENGTH);
     length = PRINT_BUFFER_LENGTH;
     if(types != 0)
       PrintStringAllPropertySets(string,&length,types,molecule->Properties,0);
     fprintf(file,"%s",string);
     
     Free(string);
     }

extern INT MasterMoleculeSetInDatabase(BindStructure *bind)
     {
     INT ret;
     ret = MasterDetermineMolSubInDatabase(bind, BIND_CURRENT_MOLECULES, MOLECULE_DATABASE);
     return(ret);
     }

extern INT MasterSubstructureInDatabase(BindStructure *bind)
     {
     INT ret;
     ret = MasterDetermineMolSubInDatabase(bind, BIND_CURRENT_SUBSTRUCTURES, SUBSTRUCTURE_DATABASE);
     return(ret);
     }

extern INT MasterDetermineMolSubInDatabase(BindStructure *bind, INT cflag, INT classid)
     {
     MoleculeSet *molset;
     FILE *out;
     CommandMaster *commandmaster;

     molset = GetBoundStructure(bind, cflag);

     commandmaster = GetBoundStructure(bind, BIND_COMMANDMASTER);

     out = OpenWriteFileFromCurrent("MolOutDir", "MolOutName",
                                    MOLECULE_PRINT_OUT_SUFFIX,
                                    IGNORE, "Molecule Database Check Filename",
                                    commandmaster);

     if (out != 0)
          {
          DetermineMolSubInDatabase(out, molset, classid, bind);
          fclose(out);
          }

     return (SYSTEM_NORMAL_RETURN);
     }

extern void DetermineMolSubInDatabase(FILE *file, MoleculeSet *set, INT classid, BindStructure *bind)
     {
     ChemDBMaster *master;
     DataSubSet *corrset;
     DataBaseInformation *dinfo;
     DbaseKeyword *key;
     MoleculeInfo *mol;
     MoleculeInfo dbmol;
     INT *id, i, ret;
     ObjectClassification *classification;

     if (set == 0 || file == 0) return;

     master = GetBoundStructure(bind, BIND_CHEMDBASE);
     if (master == NULL)
          {
          fprintf(file, "ERROR: ChemDBMaster structure (BIND_CHEMDBASE) is NULL. Did you run 'CreateOpenClose Start'?\n");
          return;
          }

     classification = FindClassification(classid, DATABASE_CLASSIFICATIONS, bind);
     if (classification == NULL)
          {
          fprintf(file, "ERROR: ObjectClassification for classid %d not found.\n", classid);
          return;
          }

     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo, classification->Description->Database);
     if (dinfo == NULL)
          {
          fprintf(file, "ERROR: DataBaseInformation is NULL.\n");
          return;
          }

     corrset = DetermineDatabaseCorrespondence(set, classid, bind);
     if (corrset == NULL)
          {
          fprintf(file, "ERROR: DetermineDatabaseCorrespondence returned NULL.\n");
          return;
          }

     fprintf(file, "%-35s %-35s\n", "Name_in_SDF", "Name_in_Database");
     fprintf(file, "----------------------------------- -----------------------------------\n");

     key = AllocateDbaseKeyword;
     id = corrset->Points;
     mol = set->Molecules;

     LOOPi(set->NumberOfMolecules)
          {
          if (*id >= 0)
               {
               memset(&dbmol, 0, sizeof(MoleculeInfo));
               ProduceMolIDKey(*id, key);
               ret = SearchKeyElement(DB_ID_SEARCH, &dbmol, key, dinfo);
               if (ret == SYSTEM_NORMAL_RETURN && dbmol.Name != NULL)
                    {
                    fprintf(file, "%-35s %-35s\n", mol->Name ? mol->Name : "NULL", dbmol.Name);
                    }
               else
                    {
                    fprintf(file, "%-35s %-35s\n", mol->Name ? mol->Name : "NULL", "NOT_FOUND");
                    }
               FreeDbaseKeyword(key);
               }
          else
               {
               fprintf(file, "%-35s %-35s\n", mol->Name ? mol->Name : "NULL", "NOT_FOUND");
               }
          id++;
          mol++;
          }

     Free(key);
     FreeDataSubSet(corrset);
     Free(corrset);
     }





