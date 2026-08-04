/*  FILE     moldb.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    These routines are the bind and work routines for reading in and storing a set
**    of molecules and for printing molecules from a database
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
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static INT DBReadMolSubsFromList(BindStructure *bind,
				 INT dbflag);
static INT DBReadSDFMolSubs(BindStructure *bind,
			    INT dbflag);
static INT StoreMolFileInDataBase(MolFileMolecule *molmolf,
				  INT dbflag,
				  ChemDBMaster *master);
static DbaseKeyword *ComputeMoleculeKeyWord(MoleculeInfo *molecule,
					    INT dbflag,
					    ChemDBMaster *master);
static INT DBPrintAllMolSubs(BindStructure *bind, INT dbflag);

/*S CurrentToDatabase
*/
/*F  ret = StoreCurrentMoleculeSet(bind)  . . bind:current molecules to dbase
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The current set of molecules are added to the database (with keys)
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT StoreCurrentMoleculeSet(BindStructure *bind)
     {
     MoleculeSet *set;
     INT ret;
     
     set = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);

     ret = StoreMoleculeSetToDatabase(set,MOLECULE_DATABASE,bind);
     
     return(ret);
     }
/*F  ret = StoreCurrentSubStructureSet(bind)  . . . . . . . . . . . . .  bind
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The current set of substructures are added to the database (with keys)
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT StoreCurrentSubStructureSet(BindStructure *bind)
     {
     MoleculeSet *set;
     INT ret;
     
     set = GetBoundStructure(bind,BIND_CURRENT_SUBSTRUCTURES);

     ret = StoreMoleculeSetToDatabase(set,SUBSTRUCTURE_DATABASE,bind);
     
     return(ret);
     }
/*F ret = StoreMoleculeSetToDatabase(set,dbflag,master) . . . . . . .  extern
**
**  DESCRIPTION
**    set:
**       The set of molecules/structures to store to the database
**    dbflag:
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    master:
**      The master chemical database informaton
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**    
**  REMARKS
**      The molecule/structure data is replaced if already exists.
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern INT StoreMoleculeSetToDatabase(MoleculeSet *set,
				      INT dbflag,
				      BindStructure *bind)
     {
      DataBaseInformation *dinfo;
      MoleculeInfo *molecule;
      INT i,id;
      DbaseKeyword *key;
      ChemDBMaster *master;
      
      master = GetBoundStructure(bind,BIND_CHEMDBASE);
      dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
      
      molecule = set->Molecules;
      LOOPi(set->NumberOfMolecules)
	   {
	   if(molecule->ID >= 0)
		{
		printf("Store: %10d:%s\n",molecule->ID,molecule->Name);
		fflush(stdout);
		id =PutMoleculeInDatabaseClass(molecule,dbflag,bind);
		molecule->ID = id;
		molecule->Molfile->ID = id;
		molecule->Electronic->ID = id;
		molecule->Properties->ID = id;
		
		printf("New ID: %10d\n",id);
		key = ComputeMoleculeKeyWord(molecule,dbflag,master);
		
		/*PrintPrettyDbaseKeyword(key);*/
		StoreElement((VOID *) molecule,
			     key,
			     GDBM_REPLACE,
			     dinfo);
		InsertSearchKeys((VOID) molecule,key,dinfo->Keys);
		FreeDbaseKeyword(key);
		Free(key);
		}
	   
	   molecule++;
	   }
      return(SYSTEM_NORMAL_RETURN);
      }
/*S MolFilesToDatabase
**     A list of MolFiles are given in a file.  Each one is opened and read and put
**     put into the database.  The filename of the list is constructed with:
**     - Directory: DBDataDirectory
**     - Rootname:  DBDataMolRoot
**     - Suffix:    .lst
**     The Molfile with the same, but with extension .mol
*/
/*F  ret = DBReadInMoleculesFromList(bind)  . .  bind: read list of molecules
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Read in a set molecules from a single file of molfile specifications
**    and add them (replacing molelcules if repeated) into the database
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBReadMolSubsFromList
**
**  HEADERFILE
**        comlib.h chemdb.h
*/
extern INT DBReadInMoleculesFromList(BindStructure *bind)
{
  INT ret;
  
  ret = DBReadMolSubsFromList(bind,MOLECULE_DATABASE);
  return(ret);
}

 
/*F  ret = DBReadInSubstructuresFromList(bind)  . . . bind: read list of subs
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Read in a set substructures from a single file of molfile specifications
**    and add them (replacing substructures if repeated) into the database
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBReadMolSubsFromList
**
**  HEADERFILE
**        comlib.h chemdb.h
*/
extern INT DBReadInSubstructuresFromList(BindStructure *bind)
{
  INT ret;
  
  ret = DBReadMolSubsFromList(bind,SUBSTRUCTURE_DATABASE);
  return(ret);
}

 
/*f ret = DBReadMolSubsFromList(bind,dbflag)  . . . . . . . static: read list
**
**  DESCRIPTION
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    This is the main work routine to read in a set of molecules or substructures.
**    The list file is opened and each molfile is read with ReadMFMol and
**    stored with StoreMolFileInDataBase.
**
**  REMARKS
**
*/
static INT DBReadMolSubsFromList(BindStructure *bind,
				 INT dbflag)
     {
     ChemDBMaster *master;
     MoleculeSet *set;
     CHAR *line,*string,*dir;
     FILE *file;
     MolFileMolecule *molmolf;
     CommandMaster *commandmaster;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     set = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     dir = GetCurrentStringArgument("DBDataDirectory",commandmaster);
     
     string = AllocateString(LINELENGTH);
     file = OpenReadFileFromCurrent("DBDataDirectory","DBDataMolRoot",
				    MOL_FILE_LIST_SUFFIX,
				    IGNORE,"List of Molfiles",commandmaster);
     
     line = NextNonBlankLine(file,string);
     molmolf = AllocateMolFileMolecule;
     while(line != 0)
	  {
	  EliminateLeadingBlanks(line);
	  file = MasterOpenReadFile(dir,line,MOL_FILE_SUFFIX,
				    IGNORE,"MolFile for molecule",
				    commandmaster);
	  if(file != 0)
	       {
	       ReadMFMol(file,molmolf,set->MetaAtoms);
	       StoreMolFileInDataBase(molmolf,dbflag,master);
	       }
	  line = NextNonBlankLine(file,string);
	  FreeMolFileMolecule(molmolf);
	  }
     Free(string);
     Free(dir);
     return(SYSTEM_NORMAL_RETURN);
     }
/*S ReadSDFFiles
**     A list of MolFiles are given in a single file.  Each one is opened put
**     put into the database.  The filename of the list is constructed with:
**     - Directory: DBDataDirectory
**     - Rootname:  DBDataMolRoot
**     - Suffix:    .sdf (SDF_FILE_LIST_SUFFIX)
*/
 
/*F  ret = DBReadSDFMolecules(bind) . . . . . . bind: read list of molelcules
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Read in a set molecules from a single SDF file of molfile specifications
**    and add them (replacing molecules if repeated) into the database
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBReadSDFMolSubs
**
**  HEADERFILE
**        comlib.h chemdb.h
*/
extern INT DBReadSDFMolecules(BindStructure *bind)
{
  INT ret;
  
  ret = DBReadSDFMolSubs(bind,MOLECULE_DATABASE);
  return(ret);
}

 
/*F  ret = DBReadSDFSubstructures(bind) . . . . . . . bind: read list of subs
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Read in a set substructures from a single file of molfile specifications
**    and add them (replacing substructures if repeated) into the database
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBReadSDFMolSubs
**
**  HEADERFILE
**        comlib.h chemdb.h
*/
extern INT DBReadSDFSubstructures(BindStructure *bind)
{
  INT ret;
  
  ret = DBReadSDFMolSubs(bind,SUBSTRUCTURE_DATABASE);
  return(ret);
}

 
/*f ret = DBReadSDFMolSubs(bind,dbflag) . . . . . . . . static: read SDF file
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    This is the main work routine for reading a single SDF file.  This
**    routine calls ReadSDFMol repeatedly through the whole file.  The
**    molecules are stored with StoreMolFileInDataBase.
**    
**  REMARKS
**
*/
static INT DBReadSDFMolSubs(BindStructure *bind,
			      INT dbflag)
     {
     MoleculeSet *set;
     ChemDBMaster *master;
     INT done;
     FILE *file;
     MolFileMolecule *molmolf;
     SetOfMolFileMetaAtoms *metaatoms;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     set = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     metaatoms = set->MetaAtoms;
     
     file = OpenReadFileFromCurrent("DBDataDirectory","DBDataMolRoot",
				    SDF_FILE_LIST_SUFFIX,
				    RECOVER,"List of Molfiles",
				    commandmaster);
     
     if(file != 0)
	  {
	  molmolf = AllocateMolFileMolecule;
	  done = 0;
	  while(done == 0)
	       {
	       done = ReadSDFMol(file,molmolf,metaatoms);
	       if(done == 0)
		    {
		    StoreMolFileInDataBase(molmolf,dbflag,master);
		    FreeMolFileMolecule(molmolf);
		    }
	       }
	  fclose(file);
	  Free(molmolf);
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

/*f ret = StoreMolFileInDataBase(molmolf,dbflag,master) static: store
**
**  DESCRIPTION
**    molmolf:
**      The Molfile read to be stored
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    master:
**      The master chemical database informaton
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**    
**  REMARKS
**
*/
static INT StoreMolFileInDataBase(MolFileMolecule *molmolf,
				  INT dbflag,
				  ChemDBMaster *master)
     {
     MoleculeInfo *molecule;
/*     MolFileMolecule *mol;*/
     DbaseKeyword *key;
     DataBaseInformation *dinfo;
     
     molecule = AllocateMoleculeInfo;
     CreateMoleculeInfo(molecule, molmolf->ID, molmolf->Name,
			molmolf,0,0);
 
/*
     mol = AddHydrogens(molecule->Molfile);
     molecule->Electronic = ElectronicFromMolFile(mol);
     Free(molecule->Molfile);
     molecule->Molfile = mol;
     ComputePolarizability(molecule);
*/

     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     key = ComputeMoleculeKeyWord(molecule,dbflag,master);
     
     StoreElement((VOID *) molecule,
		  key,
		  GDBM_REPLACE,
		  dinfo);
     
     FreeMoleculeInfo(molecule);
     Free(molecule);
     FreeDbaseKeyword(key);
     Free(key);
     
     return(SYSTEM_NORMAL_RETURN);
    }

 
/*f  key = ComputeMoleculeKeyWord(molecule,dbflag,master) static mol keyword
**
**  DESCRIPTION
**    molecule:
**      The molecule from which the keyword is to be derived
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    master:
**      The master chemical database informaton
**    key:
**      The keyword to be used in the database
**    
**  REMARKS
**
*/
static DbaseKeyword *ComputeMoleculeKeyWord(MoleculeInfo *molecule,
					    INT dbflag,
					    ChemDBMaster *master)
     {
     DbaseKeyword *key;
     MolFileMolecule *molmolf;
     
     
     molmolf = molecule->Molfile;
     
     key = AllocateDbaseKeyword;
     /*
     CreateDbaseKeyword(key,dbflag,molecule->Name,
			sizeof(INT),0);
     memcpy(key->KeyWord,&(molecule->ID),sizeof(INT));
     */
     ProduceMolIDKey(molecule->ID,key);
     return(key);
     }
/*S ReadMetaAtoms
*/
/*F  ret = DBReadMolFileMetaAtoms(bind) . . . . . . . . bind: read meta atoms
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Initialization routine for the meta-atoms.  The meta-atom filename is
**    determined with:
**    - Directory: DBDataDirectory
**    - Rootname: DBMolRoot
**    - Suffix: .mta (META_ATOM_FILE_SUFFIX)
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: MetaAtomInfoRead
**
**  HEADERFILE
**
*/
extern INT DBReadMolFileMetaAtoms(BindStructure *bind)
     {
     FILE *file;
     ChemDBMaster *master;
     CommandMaster *commandmaster;
     MoleculeSet *set,*substruct;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     set = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     substruct = GetBoundStructure(bind,BIND_CURRENT_SUBSTRUCTURES);
     
     file = OpenReadFileFromCurrent("DBDataDirectory","DBMolRoot",
				    META_ATOM_FILE_SUFFIX,
				    RECOVER,"List of Molfiles",commandmaster);
     
     if(file != 0)
	  {
	  set->MetaAtoms = MetaAtomInfoRead("MasterMetaAtom",file);
	  CopyFullSetOfMolFileMetaAtoms(substruct->MetaAtoms,set->MetaAtoms);
	  fclose(file);
	  }
     else 
	  {
	  substruct->MetaAtoms = 0;
	  set->MetaAtoms = 0;
	  }
     
     return(SYSTEM_NORMAL_RETURN);
     }

/*S PrintOutDatabase
**    This is a basic check of the database.  Each name of the structure or
**    molecule is printed out to stdout.
**
**
*/
/*F  ret = DBPrintAllMolecules(bind)  . . . . . . . . bind: print molecules
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Print out the names of the molecules in the database (to stdout)
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBPrintAllMolSubs
**
**  HEADERFILE
**
*/
extern INT DBPrintAllMolecules(BindStructure *bind)
     {
     INT ret;
     
     ret = DBPrintAllMolSubs(bind,MOLECULE_DATABASE);
     return(ret);
     }
/*F  ret = DPrintAllSubstructures(bind)  . . . . . bind: print substructures
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Print out the names of the molecules in the database (to stdout)
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBPrintAllMolSubs
**
**  HEADERFILE
**
*/
extern INT DBPrintAllSubstructures(BindStructure *bind)
{
  INT ret;
  
  ret = DBPrintAllMolSubs(bind,SUBSTRUCTURE_DATABASE);
  return(ret);
}
/*f  ret = DBPrintAllMolSubs(bind,dbflags)  . . . . . . . . . . static: print
**  DESCRIPTION
**
**    bind: The bind structure
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The main work routine for printing out a list of molecules or structures.
**    The database is looped through using FetchFirstElement and FetchNextElement.
**
**  REMARKS
**
*/
static INT DBPrintAllMolSubs(BindStructure *bind, INT dbflag)
     {
     MoleculeInfo *molecule;
     DbaseKeyword *keyword;
     DataBaseInformation *dinfo;
     INT ret;
     ChemDBMaster *master;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     molecule = AllocateMoleculeInfo;
     keyword = AllocateDbaseKeyword;
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     ret = FetchFirstElement((VOID *) molecule,keyword,dinfo);
     
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  while(ret == SYSTEM_NORMAL_RETURN)
	       {
	       printf("%10d: -->%s<--\n",molecule->ID,molecule->Name);
	       ret = FetchNextElement((VOID *) molecule,keyword,dinfo);
	       }
	  Free(molecule);
	  FreeDbaseKeyword(keyword);
	  }
     
     Free(keyword);
	  
     return(SYSTEM_NORMAL_RETURN);
     }
/*S MoleculeSetFromDatabase
*/
/*f molset = DetermineMoleculeSetFromASCII(asciimolset,dbflag,bind);
**
**  DESCRIPTION
**    asciimolset: The set of molecule names (ids)
**    bind: The bind structure
**    molset: The set of molecules from the database
**
**    From the list of names, a list of molecules from 
**    the database is formed
**
**  REMARKS
**
*/
extern MoleculeSet *DetermineMoleculeSetFromASCII(ReadInMoleculeSet *asciimolset,
						  INT dbflag,
						  BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     MoleculeSet *molset;
     MoleculeInfo *mol;
     ReadInMolecule *ascii;
     INT i,error;
     ChemDBMaster *master;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);

     molset = AllocateMoleculeSet;
     CreateMoleculeSet(molset,asciimolset->ID,asciimolset->Name,
		       asciimolset->NumberOfMolecules,0,0,0);
     molset->NumberOfMolecules = 0;
     molset->MetaAtoms = AllocateSetOfMolFileMetaAtoms;
     CreateSetOfMolFileMetaAtoms(molset->MetaAtoms,
				 asciimolset->ID,asciimolset->Name,
				 0,0);
     
     mol = molset->Molecules;
     ascii = asciimolset->Molecules;
     LOOPi(asciimolset->NumberOfMolecules)
	  {
	  error = DBFindMolSubFromString(ascii->Name,mol,dinfo);
	  molset->NumberOfMolecules +=1;
	  mol++;
	  ascii++;
	  }
     return(molset);
     }
