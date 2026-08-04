#include "basic.h"
#include "comlib.h"

#include "graph.h"
#include "mol0.h"
#include "molprops.h"



static INT PrintMolFilePreamble(FILE *file, MolFileMolecule *mol);
static INT PrintMolFileAtoms(FILE *file, MolFileMolecule *mol);
static INT ChargeNumberFromRadChrg(FLOAT rad, FLOAT chrg);
static INT PrintMolFileBonds(FILE *file, MolFileMolecule *mol);

#define DEBUG DEBUG0


#define NUMBER_MOLECULES_FUNCTIONS 9

static FunctionInfo MOLECULES_LIST[NUMBER_MOLECULES_FUNCTIONS] =
     {
     {1,"ReadSDFMolecules",(INT (*)(void)) ReadSDFMolecules},  
     {2,"ReadMolFileMetaAtoms",(INT (*)(void))ReadMolFileMetaAtoms },
     {3,"ReadInMoleculesFromList",(INT (*)(void)) ReadInMoleculesFromList},  
     {4,"MasterPrintMetaAtoms",(INT (*)(void)) MasterPrintMetaAtoms},
     {5,"ComputeElectronicPropsMolecules",(INT (*)(void)) ComputeElectronicPropsMolecules},  
     {6,"ComputeElectronicPropsSubStructures",(INT (*)(void)) ComputeElectronicPropsSubStructures},  
     {7,"PrintMoleculeAsGraph",(INT (*)(void)) PrintMoleculeAsGraph},
     {8,"SetOfSubGraphs",(INT (*)(void)) SetOfSubGraphs},
     {9,"ExportMolecules",(INT (*)(void)) ExportMolecules}
};


static FunctionList MOLECULES_FUNCTIONS = {
        0,"Molecules",
    	NUMBER_MOLECULES_FUNCTIONS,
	MOLECULES_LIST
	};

extern FunctionList *MergeFunctMolecules(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
			     old, &MOLECULES_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }

 
/*F bindset = ExtractThenInitialMoleculeSet(bind)
**
**  DESCRIPTION
**    The bound set of molecules is given as returned and
**    a the bound set is initialized to zero molecules
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

extern MoleculeSet *ExtractThenInitialMoleculeSet(INT source,
						  BindStructure *bind)
     {
     MoleculeSet *molecules,*newmols;
     
     molecules = GetBoundStructure(bind,source);
     
     newmols = AllocateMoleculeSet;
     CreateMoleculeSet(newmols,molecules->ID,molecules->Name,
		       0,0,
		       molecules->PropertyTypes,
		       molecules->MetaAtoms);

     newmols->NumberOfMolecules = molecules->NumberOfMolecules;
     molecules->NumberOfMolecules = 0;
     
     newmols->Molecules = molecules->Molecules;
     molecules->Molecules = 0;

     return(newmols);
     }

extern MoleculeSet *ReplaceBindMoleculeSet(MoleculeSet *molset,BindStructure *bind)
     {
     MoleculeSet *molecules;
     
     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     
     FreeMoleculeSet(molecules);
     memcpy(molecules,molset,MoleculeSetSize);
     Free(molset);
     return(molecules);
     }
     
extern MoleculeSet *GetMoleculeSetMaster(BindStructure *bind)
     {
     MoleculeSet *molset;
     
     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     
     return(molset);
     }
     
extern SetOfMolFileMetaAtoms *GetMetaAtomMaster(BindStructure *bind)
     {
     MoleculeSet *molset;
     
     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     
     if(molset->MetaAtoms == 0)
	  ReadMolFileMetaAtoms(bind);

     if(molset->MetaAtoms == 0)
	  {
	  molset->MetaAtoms = AllocateSetOfMolFileMetaAtoms;
	  CreateSetOfMolFileMetaAtoms(molset->MetaAtoms,
				      molset->ID,
				      molset->Name,
				      0,0);
	  }
     
     return(molset->MetaAtoms);
     }
     
extern INT ReadMolFileMetaAtoms(BindStructure *bind)
     {
     FILE *file;
     MoleculeSet *molset;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     
     file = OpenReadFileFromCurrent("MolDirectory","RootMolName",
				    META_ATOM_FILE_SUFFIX,
				    RECOVER,"Meta Files",commandmaster);
     
     if(file != 0)
	  {
	  molset->MetaAtoms = MetaAtomInfoRead("MasterMetaAtom",
						     file);
	  }
     else 
	  molset->MetaAtoms = 0;
     
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT MasterPrintMetaAtoms(BindStructure *bind)
     {
     MoleculeSet *molset;

     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     
     if(molset->MetaAtoms != 0)
	  {
	  PrintPrettySetOfMolMetaAtoms("Master Meta Atoms",
				       stdout,
				       molset->MetaAtoms);
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

static char *PrintChemkinValuesForMolecule(CHAR *str, INT *strlen,
					   MoleculeInfo *molecule,
					   SetOfPropertyValues *valueset,
					   SetOfPropertyTypes *types)
{
  ChemkinThermoRead *chemkin;
  GenPropValue *chemkinvalue,*value;
  PropertyValues *values;
  char *string,*newname;
  INT numcount;
  values = FindValuesFromType(CHEMKIN_READTHERMO_PROPERTY,
			      valueset);
  value = values->Values;
  if(value != 0) {
    chemkin = AllocateChemkinThermoRead;
    GetPropValue(chemkin,value,types);
    
    printf("%20s     %9.3f %9.3f %9.3f      %9.3f %9.3f %9.3f       %9.3f %9.3f %9.3f\n",
	   chemkin->Species,
	   ChemkinS0series(chemkin,(FLOAT) 298.0),
	   ChemkinHFseries(chemkin,(FLOAT)298.0),
	   (ChemkinHFseries(chemkin,(FLOAT)298.0) - 298.0*ChemkinS0series(chemkin,(FLOAT) 298.0))/1000.0,
	   ChemkinS0series(chemkin,(FLOAT)400.0),
	   ChemkinHFseries(chemkin,(FLOAT)400.0),
	   (ChemkinHFseries(chemkin,(FLOAT)400.0) - 400.0*ChemkinS0series(chemkin,(FLOAT) 400.0))/1000.0,
	   ChemkinS0series(chemkin,(FLOAT)1500.0),
	   ChemkinHFseries(chemkin,(FLOAT)1500.0),
	   (ChemkinHFseries(chemkin,(FLOAT)1500.0) - 1500.0*ChemkinS0series(chemkin,(FLOAT) 1500.0))/1000.0);
    
    string = AllocateString(30*LINELENGTH);
    StringMoleculeStandardChemkinThermo(string,chemkin);
    str = PrintStringString(str,strlen,string);
    
    Free(string);
  }
  return(str);
}
static void ExportChemkinInp(CHAR *rootname, FILE *chemkin, MoleculeInfo *molecule, SetOfPropertyTypes *types) {
  INT length;
  CHAR *string;
  PropertyValues *values;
  GenPropValue *value;
  CHAR *chemkinname;
  
  string = AllocateString(100*PRINT_BUFFER_LENGTH);
  fprintf(chemkin,"%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n");
  fprintf(chemkin,"Instance: %d %s %s\n", molecule->ID, molecule->Name, molecule->Name);
  
  values = FindValuesFromType(ALTERNATIVE_NAMES_PROPERTY,molecule->Properties);
  if(values != 0) {
    value = FindSpecificValueInPropertyValues("CHEMKIN",values);
    if(value != 0) {
      chemkinname =  AllocateString(value->NumberOfBytes);
      memcpy(chemkinname,value->Value,(unsigned int) value->NumberOfBytes);
      fprintf(chemkin,"%s  ", chemkinname);
    } else {
      chemkinname = CopyString( molecule->Name);
    }
    value = FindSpecificValueInPropertyValues("Short",values);
    if(value != 0) {
      fprintf(chemkin,"%s  ", value->Value);
    } else {
      fprintf(chemkin,"%s  ", chemkinname);
    }
    Free(chemkinname);
  } else {
    fprintf(chemkin,"%s %s ", molecule->Name, molecule->Name);
  }
  fprintf(chemkin,"SourceREACT %s END \n",rootname);
  fprintf(chemkin,"Baulch.et.al.92 J. Phys. Chem. Ref. Data, 21:411-429,1992; D.L. Baulch, et. al.; Hydrocarbon Combustion Reaction Constants\n");
  length = 100*PRINT_BUFFER_LENGTH;
  PrintChemkinValuesForMolecule(string,&length,molecule,molecule->Properties,types);
  fprintf(chemkin,"%s",string);
  Free(string);
}
extern INT ExportMolecules(BindStructure *bind) 
{
  FILE *structures,*chemkin;
  MoleculeSet *molecules;
  MoleculeInfo *molecule;
  INT i;
  CHAR *cdir,*cname;
  CommandMaster *commandmaster;

  printf("******** ExportMolecules ************\n");

  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  cdir  = GetCurrentStringArgument("ReactionMolDirectory",commandmaster);
     
  structures = MasterOpenWriteFile(cdir,"structures","sdf",IGNORE,"Molecule Structure File",commandmaster);
  chemkin = MasterOpenWriteFile(cdir,"chemkin","inp",IGNORE,"Thermo Definition",commandmaster);

  molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
  molecule = molecules->Molecules;

  fprintf(chemkin, "InstanceSet  =====================A Set of Instances==========================\n");
  fprintf(chemkin,"Attributes:\n");
  LOOPi(molecules->NumberOfMolecules) {
    ExportChemkinInp(commandmaster->Name,chemkin,molecule,molecules->PropertyTypes);
    PrintMoleculeAsMolFile(structures,molecule);
    molecule++;
  }
  fprintf(chemkin,"END\n");
  Free(cdir);
  fclose(structures);
  fclose(chemkin);
  return(SYSTEM_NORMAL_RETURN);
}
/***********************************************************************
  ComputeSetElectronProps
         Compute the Electron Properties from the MolFile Information
************************************************************************/
extern INT ComputeElectronicPropsMolecules(BindStructure *bind)
     {
     return(ComputeElectronPropsMolSubs(bind,BIND_CURRENT_MOLECULES));
     }

extern INT ComputeElectronicPropsSubStructures(BindStructure *bind)
     {
     return(ComputeElectronPropsMolSubs(bind,BIND_CURRENT_SUBSTRUCTURES));
     }

extern INT ComputeElectronPropsMolSubs(BindStructure *bind,
					 INT dbflag)
     {
     INT i,numatoms;
     MoleculeSet *molecules;
     MoleculeInfo *molecule;
     MolFileMolecule *mol;
     MoleculeElectronic *electronic;
     
     molecules = GetBoundStructure(bind,dbflag);

     molecule = molecules->Molecules;
     LOOPi(molecules->NumberOfMolecules)
	  {
	  if(molecule->Electronic == 0)
	       {
	       numatoms = molecule->Molfile->NAtoms;
	       if(dbflag == BIND_CURRENT_MOLECULES)
		 mol = AddHydrogens(molecule->Molfile);
	       else
		 {
		   mol = AllocateMolFileMolecule;
		   CopyFullMolFileMolecule(mol,molecule->Molfile);
		 }
	       electronic = ElectronicFromMolFile(mol);
	       molecule->Electronic = electronic;

	       FreeMolFileMolecule(molecule->Molfile);
	       Free(molecule->Molfile);
	       molecule->Molfile = mol;
/*	       ComputePolarizability(molecule);*/
	       }
	  molecule++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }


extern DataSubSet *GetListOfMolecules(BindStructure *bind)
     {
     INT i,*list;
     MoleculeSet *molecules;
     MoleculeInfo *molecule;
     DataSubSet *subset;
     
     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);

     subset = AllocateDataSubSet;
     CreateDataSubSet(subset,molecules->ID,molecules->Name,
		      molecules->NumberOfMolecules,
		      molecules->NumberOfMolecules,
		      0);
     
     list = subset->Points;
     molecule = molecules->Molecules;
     LOOPi(molecules->NumberOfMolecules) {
       *list = molecule->ID;
       list++;
       molecule++;
     }
     return(subset);
     }

extern INT PrintMoleculeAsGraph(BindStructure *bind)
     {
     INT i,*mol;
     MoleculeSet *molecules;
     Graph *graph;
     DataSubSet *mollist;
     
     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     mollist = GetListOfMolecules(bind);
     
     mol = mollist->Points;
     LOOPi(molecules->NumberOfMolecules)
	  {
	  graph = GraphFromMolecule(*mol,VALENCE_STANDARD,bind);
	  PrintPrettyGraph("",stdout,graph);
	  mol++;
	  }
     FreeDataSubSet(mollist);
     Free(mollist);
     
     return(SYSTEM_NORMAL_RETURN);
     }

extern DataSubSet *SetUpAtomSet(INT id, INT flag,
				 BindStructure *bind)
     {
     MoleculeSet *molecules;
     MoleculeInfo *molecule;
     DataSubSet *subset;
     
     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     molecule = FindMoleculeInMoleculeSet(id,molecules);

     subset = SetUpAtomSetForMolecule(flag,molecule);
     
     return(subset);
     }

extern INT SetOfSubGraphs(BindStructure *bind)
     {
     INT i,j,*moli,*molj;
     MoleculeSet *molecules;
     Graph *graphi,*graphj;
     DataSubSet *patternlist,*moleculelist,*seti,*setj;
     SetOfPairSets *set;
     
     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     patternlist = ReadInMoleculeList("MolDirectory","SubGraphPatList","sgp",
				      MOL_ID_BY_NAME,
				      molecules,bind);
     moleculelist = ReadInMoleculeList("MolDirectory","SubGraphMainList","sgm",
				       MOL_ID_BY_NAME,
				       molecules,
				       bind);
     
#if DEBUG >= DEBUG1
     DEBUGPRINT = 1;
#endif     
     moli = moleculelist->Points;
     LOOPi(moleculelist->NumberOfPoints)
	  {
	  graphi = GraphFromMolecule(*moli,VALENCE_STANDARD,bind);
	  
	  seti = SetUpAtomSet(*moli,ALL_ATOMS,bind);
	  molj = patternlist->Points;
	  LOOPj(patternlist->NumberOfPoints)
	       {
#if DEBUG >= DEBUG1
	       PrintAllocSummary();
#endif	  
	       graphj = GraphFromMolecule(*molj,VALENCE_STANDARD,bind);
#if DEBUG >= DEBUG2
	       printf("Mol %5d:%s\n",graphi->ID,graphi->Name);
	       printf("Mol %5d:%s\n",graphj->ID,graphj->Name);
#endif	  
	       setj = SetUpAtomSet(*molj,ALL_ATOMS,bind);
	       set = FindSubGraphsRoot(0,"SubGraphs",
				       graphi,seti,
				       graphj,setj);
	       if(set != 0)
		    {
		    FreeSetOfPairSets(set);
		    Free(set);
		    }
	       else
		    printf("    0");
	       fflush(stdout);
	       molj++;
	       FreeGraph(graphj);
	       Free(graphj);
	       FreeDataSubSet(setj);
	       Free(setj);
#if DEBUG >= DEBUG1
	       PrintAllocSummary();
#endif	  
	       }
	  moli++;
	  FreeGraph(graphi);
	  Free(graphi);
	  FreeDataSubSet(seti);
	  Free(seti);
	  }
     FreeDataSubSet(moleculelist);
     Free(moleculelist);
     FreeDataSubSet(patternlist);
     Free(patternlist);
     return(SYSTEM_NORMAL_RETURN);
     }

extern DataSubSet *ReadInMoleculeList(CHAR *dir,
				      CHAR *name,
				      CHAR *suffix,
				      INT flag,
				      MoleculeSet *set,
				      BindStructure *bind)
     {
     FILE *file;
     DataSubSet *subset;
     CHAR *molname,*string,*line;
     INT id;
     MoleculeInfo *mol;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     file = OpenReadFileFromCurrent(dir,name,suffix,IGNORE,
				    "Molecule List",
				    commandmaster);

     line = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);
     
     if(file != 0)
	  {
	  subset = AllocateDataSubSet;
	  CreateDataSubSet(subset,set->ID,set->Name,
			   0,set->NumberOfMolecules,
			   0);
	  
	  subset->NumberOfPoints = 0;
	  
	  molname = NextNonBlankLine(file,line);
	  mol = 0;
	  while(molname != 0)
	       {
	       EliminateBlanks(molname);
	       switch(flag)
		    {
	       case MOL_ID_BY_NUMBER:
		    id = ConvertStringToInteger(molname);
		    mol = FindMoleculeInMoleculeSet(id,set);
		    break;
	       case MOL_ID_BY_NAME:
		    mol = FindMoleculeInMoleculeSetByName(molname,set);
		    break;
		    }
	       if(mol == 0)
		    {
		    sprintf(string,"Molecule <%s> not found",molname);
		    Error(RECOVER,string);
		    Free(string);
		    }
	       else
		    {
		    *(subset->NumberOfPoints + subset->Points) = mol->ID;
		    subset->NumberOfPoints += 1;
		    }
	       molname = NextNonBlankLine(file,line);
	       }
	  }
     else
	  {
	  subset = AllocateDataSubSet;
	  CreateDataSubSet(subset,set->ID,set->Name,
			   0,0,
			   0);
	  }
     
     Free(line);
     Free(string);
     
     return(subset);
     }

extern PropValue *MasterFindAtomProperty(INT id, INT atm, INT prop,
					 MoleculeSet *molecules)
     {
     MoleculeInfo *mol;
     PropValue *propvalue;
     
     mol = FindMoleculeInMoleculeSet(id,molecules);
     
     propvalue = FindAtomProperty(mol,atm,prop);
     
     return(propvalue);
     }

extern Graph *GraphFromMolecule(INT id, 
				INT valence,
				BindStructure *bind)
     {
     MoleculeSet *molecules;
     MoleculeInfo *molecule;
     MolFileMolecule *molfile;
     Graph *graph;
     SetOfMolFileMetaAtoms *metaatomset;
     
     metaatomset = GetMetaAtomMaster(bind);
     molecules = GetMoleculeSetMaster(bind);
     
     molecule = FindMoleculeInMoleculeSet(id,molecules);
     if(molecule != 0)
       {
	 molfile  = molecule->Molfile;
	 graph    = GraphFromMolFile(molecule,valence);
	 graph->MetaAtoms = TranslateSetOfMolfileMetaAtoms(metaatomset);
       }
     else
       {
	 printf("Molecule ID not found in list of molecules: %d\n",id);
	 graph = NULL;
       }
     
     return(graph);
     }

extern void GraphFromMoleculeForArrays(Graph *graph,
				       INT id, 
				       INT valence,
				       BindStructure *bind)
     {
     MoleculeSet *molecules;
     MoleculeInfo *molecule;
     MolFileMolecule *molfile;
     SetOfMolFileMetaAtoms *metaatomset;
     
     metaatomset = GetMetaAtomMaster(bind);
     molecules = GetMoleculeSetMaster(bind);
     
     molecule = FindMoleculeInMoleculeSet(id,molecules);
     molfile  = molecule->Molfile;
     GraphFromMolFileForArrays(graph,molecule,valence);

     graph->MetaAtoms = TranslateSetOfMolfileMetaAtoms(metaatomset);
     }

extern SetOfGraphs *PutMoleculeSetInSetOfGraphs(DataSubSet *molids,
						INT valence,
						BindStructure *bind)
     {
     SetOfGraphs *set;
     Graph *mol;
     INT *molid,i;
     
     set = AllocateSetOfGraphs;
     CreateSetOfGraphs(set,molids->ID,molids->Name,
		       molids->NumberOfPoints,0);
     
     mol = set->Graphs;
     molid = molids->Points;
     LOOPi(molids->NumberOfPoints)
	  {
	  GraphFromMoleculeForArrays(mol,*molid,valence,bind);
	  molid++;
	  mol++;
	  }
     return(set);
     }
extern SetOfGraphs *TranslateMoleculeSetToSetOfGraphs(MoleculeSet *molset,
						      INT valence,
						      SetOfGraphMetaAtoms *graphmetaatoms)
     {
     SetOfGraphs *set;
     MoleculeInfo *molinfo;
     Graph *mol;
     INT i;
     
     set = AllocateSetOfGraphs;
     CreateSetOfGraphs(set,molset->ID,molset->Name,
		       molset->NumberOfMolecules,0);
     
     mol = set->Graphs;
     molinfo = molset->Molecules;
     LOOPi(molset->NumberOfMolecules)
	  {
	  GraphFromMolFileForArrays(mol,molinfo,valence);
	  mol->MetaAtoms = AllocateSetOfGraphMetaAtoms;
	  CopyFullSetOfGraphMetaAtoms(mol->MetaAtoms,graphmetaatoms);
	  molinfo++;
	  mol++;
	  }
     return(set);
     }
 
/*F PrintMoleculeSetAsMolFile(file,molecules)
**
**  DESCRIPTION
**    file: The output file to print molecules
**    molecules: The set of molecules to print to file
**
**  REMARKS
**
*/
extern INT PrintMoleculeSetAsMolFile(FILE *file,MoleculeSet *molecules)
{
  INT i;
  MoleculeInfo *molinfo;
  
  molinfo = molecules->Molecules;
  LOOPi(molecules->NumberOfMolecules)
    {
      /*printf("Molecule: %5d %s\n",molinfo->ID,molinfo->Name);*/
      PrintMoleculeAsMolFile(file,molinfo);
      molinfo++;
    }
  return(SYSTEM_NORMAL_RETURN);
}
 
/*F PrintMoleculeAsMolFile(file,mol)
**
**  DESCRIPTION
**    file: The file to print to
**    mol: The molecule to print
**
**  REMARKS
**
*/
extern INT PrintMoleculeAsMolFile(FILE *file, MoleculeInfo *mol)
{
  int ret;

  ret = PrintMolFilePreamble(file,mol->Molfile);
  if(ret == SYSTEM_NORMAL_RETURN)
    ret = PrintMolFileAtoms(file,mol->Molfile);
  if(ret == SYSTEM_NORMAL_RETURN)
    ret = PrintMolFileBonds(file,mol->Molfile);
  fprintf(file,"M  END\n");
  return(ret);
}
 
/*F ret = PrintMolFilePreamble(file,mol)
**
**  DESCRIPTION
**    file: The print stream
**    mol: The MolFile molecule 
**    ret: Whether successful or not
**
**  REMARKS
**
*/
static INT PrintMolFilePreamble(FILE *file, MolFileMolecule *mol)
{
  int ret;
  ret = SYSTEM_NORMAL_RETURN;
  if(mol != 0)
    {
      fprintf(file,"%d\n",mol->ID);
      fprintf(file,"  -CPSS-  Generated\n");
      fprintf(file,"%s\n", mol->Name);
      fprintf(file,"%3d%3d\n",mol->NAtoms,mol->NBonds);
    }
  else
    {
      printf("No Molfile\n");
      ret = SYSTEM_ERROR_RETURN;
    }
  return(ret);
}
 
/*F ret = PrintMolFilePreamble(file,mol)
**
**  DESCRIPTION
**    file: The print stream
**    mol: The MolFile molecule 
**    ret: Whether successful or not
**    
**  REMARKS
**
*/
static INT PrintMolFileAtoms(FILE *file, MolFileMolecule *mol)
{
  MolFileAtom *atm;
  INT ret,i;
  
  ret = SYSTEM_NORMAL_RETURN;
  atm = mol->Atoms;
  if(atm != 0)
    {
      LOOPi(mol->NAtoms)
	{
	  fprintf(file,"%10.4f%10.4f%10.4f",atm->X,atm->Y,atm->Z);
	  fprintf(file,"%3s",AtomNameFromAtomicNumber(atm->AtomicNumber));
	  fprintf(file,"  0%3d  0  0  0  0  0  0  0  0  0  0  0  0  0  0\n",ChargeNumberFromRadChrg(atm->Radical,atm->Charge));
	  atm++;
	}
    }
  else 
    ret = SYSTEM_ERROR_RETURN;
  return(ret);
}
 
/*F ans = ChargeNumberFromRadChrg(rad,chrg)
**
**  DESCRIPTION
**    rad: Whether the atom is a radical or not
**    chrg: The charge of the atom
**    ans: The code to use in the MolFile
**
**  REMARKS
**
*/
static INT ChargeNumberFromRadChrg(FLOAT rad, FLOAT chrg)
{
  int ans;

  if(rad == 0.0)
    {
      if(chrg == 0.0)
	ans = 0;
      else
	ans = 4 - floor(chrg+.00001);
    }
  else
    {
      ans = 4;
    }
  return ans;
}
 
/*F ret = PrintMolFileBonds(file,mol)
**
**  DESCRIPTION
**    file: The print stream
**    mol: The MolFile molecule 
**    ret: Whether successful or not
**    
**  REMARKS
**
*/
static INT PrintMolFileBonds(FILE *file, MolFileMolecule *mol)
{
  MolFileBond *bond;
  INT ret,i;
  ret = SYSTEM_NORMAL_RETURN;

  bond = mol->Bonds;
  if(bond != 0)
    {
      LOOPi(mol->NBonds)
	{
	  fprintf(file,"%3d%3d%3d  0  0  0  0  0  0  0  0\n",bond->I+1,bond->J+1,bond->Order);
	  bond++;
	}
    }
  else
    ret = SYSTEM_ERROR_RETURN;
      return(ret);
}
