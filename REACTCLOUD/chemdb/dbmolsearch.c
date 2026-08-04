/*  FILE     REACTION    dbmolsearch.c
**  PACKAGE  chemdb
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Molecule Key Search
**
**   Database routines for the molecules and substructures.  For the most
**   part there is no difference between molecules and substructures in
**   terms of the data structures so paralell routines for both are made
**   (they share many routines - just the specific database info changes).
**
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
#include "dbase.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"
/*P static prototypes for this file
*/
static void InsertMolNameKey(VOID element,DbaseKeyword *key);
static void InsertMolIDKey(VOID element,DbaseKeyword *key);

/*S DefineMoleculeDatabase
**  DESCRIPTION   
**     This set of routines sets up the definitions of the standard databases
**     that are available.  This means setting up the SetOfSearchKeyTypes structure and
**     filling it in with the database definition.  The keys are not filled in 
**     however.
*/
/*F  ret = DBResetMoleculeSearchKeys(bind)  .  bind:define keys for Molecules
**
**  DESCRIPTION
**    bind: Bind Structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN 
**
**   Main menu routine to reset the search molecule key
**   structures to the standard set.  The existing keys are erased.  This
**   routine calls DBResetMolSubsSearchKeys.
**
** REMARKS
**    A Menu Function
**
** SEE ALSO
**     Main Local Function: DBResetMolSubsSearchKeys
**
** HEADERFILE
**      chemdatabase.h, comlib.h
*/
extern INT DBResetMoleculeSearchKeys(BindStructure *bind)
{
  INT ret;
  
  ret = DBResetMolSubsSearchKeys(bind,MOLECULE_DATABASE);
  return(ret);
}
/*F  ret = DBResetSubstructureSearchKeys(bind)  .  bind: define keys for Subs
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**       Main routine to produce the set of keys for the molecules.  This
**       routine calls DBProduceMolSubsSearchKeys to do the work.
**
**  REMARKS
**     A Menu function
**
**  SEE ALSO
**      Main Local Function: DBResetMolSubsSearchKeys
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
*/

extern INT DBResetSubstructureSearchKeys(BindStructure *bind)
     {
     INT ret;

     ret = DBResetMolSubsSearchKeys(bind,SUBSTRUCTURE_DATABASE);
     return(ret);
     }

 
/*F  ret = DBResetMolSubsSearchKeys(bind,dbflag)  . . .  extern: defines keys
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   Depending on the database flag (dbflag) the substructure or molecule
**   structures are initialized.  This means the SearchKeyType structure is
**   produced and the SearchKeyInfo structures are filled in with:
**     - DB_ID_SEARCH   - Search with ID
**     - DB_NAME_SEARCH - Search with Name
**
**  REMARKS
**
**  The only distinction between molecules and substructures is the
**  DatabaseInfo structure.
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**      "chemdatabase.h", "comlib.h"
**
*/
extern INT DBResetMolSubsSearchKeys(BindStructure *bind, INT dbflag)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     SetOfSearchKeyTypes *keytypes;
     SearchKeyInfo *keyinfo;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);

     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);

     keytypes = dinfo->Keys = AllocateSetOfSearchKeyTypes;
     
     CreateSetOfSearchKeyTypes(keytypes,0,0,
			       5,2,0);
     keytypes->NumberOfKeyTypes = 2;
     
     keyinfo = keytypes->KeyTypes;
     CreateSearchKeyInfo(keyinfo,DB_ID_SEARCH,"Search by ID",
			 20,10,0,InsertMolIDKey);
     keyinfo = keytypes->KeyTypes + 1;
     CreateSearchKeyInfo(keyinfo,DB_NAME_SEARCH,"Search by Name",
			 20,10,0,InsertMolNameKey);
     
     
     ResetSearchKeys(dinfo);
     
     return(SYSTEM_NORMAL_RETURN);
   }

 
/*f InsertMolNameKey(element,key) . . . . . . . . . . . . . . . name into key
**
**  DESCRIPTION
**   element:   The MoleculeInfo structure (VOID because of general
**              prototype)
**     key: The keyword to insert the information
**    
**   These are the routines to insert the Name into the database
**   keys.  These are used by both substructures and molecules.  
**
**  REMARKS
**   These
**   routines are the InsertKey routines of the databases.  These routines
**   call ProduceMolNameKey and ProduceMolIDKey routines, respectively.
*/
static void InsertMolNameKey(VOID element,DbaseKeyword *key)
     {
     MoleculeInfo *mol;
     
     mol = (MoleculeInfo *) element;
     ProduceMolNameKey(mol->Name,key);
     }
/*f InsertMolIDKey(element,key)  . . . . . . . . . . . . . . . .  id into key
**
**  DESCRIPTION
**   element:   The MoleculeInfo structure (VOID because of general
**              prototype)
**     key: The keyword to insert the information
**    
**   These are the routines to insert the ID into the database
**   keys.  These are used by both substructures and molecules.  
**
**  REMARKS
**   These
**   routines are the InsertKey routines of the databases.  These routines
**   call ProduceMolNameKey and ProduceMolIDKey routines, respectively.
**
*/
static void InsertMolIDKey(VOID element,DbaseKeyword *key)
     {
     MoleculeInfo *mol;
     
     mol = (MoleculeInfo *) element;
     ProduceMolIDKey(mol->ID,key);
   }

 
/*F ProduceMolNameKey(name,key) . . . . . . . . . . . . . . . . . . does work
**
**  DESCRIPTION
**   name: The name to insert
**   key: The key to insert the name
**
**   The external routine to insert the name or ID of the MoleculeInfo
**   structure into the DbaseKeyword structure.
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
extern void ProduceMolNameKey(CHAR *name,DbaseKeyword *key)
     {
     key->ID = 0;
     key->Name = CopyString(name);

     key->Size = strlen(name) + 1;
     key->KeyWord = (VOID) AllocateString(key->Size);
     memcpy((char *) key->KeyWord, name, (unsigned int) key->Size);
   }
    
/*F ProduceMolIDKey(id,key) . . . . . . . . . . . . . . . . . . . . does work
**
**  DESCRIPTION
**   id: The id to insert
**   key: The key into which to insert the id
**
**   The external routine to insert the name or ID of the MoleculeInfo
**   structure into the DbaseKeyword structure.
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
extern void ProduceMolIDKey(INT id, DbaseKeyword *key)
     {
     key->ID = id;
     key->Name = 0;

     key->Size = INTSize;
     key->KeyWord = (VOID) AllocateINT;
     memcpy((char *) key->KeyWord, (char *) &(id), (unsigned int) key->Size);
   }
    
 

/*S MolFillKeys 
**    The keys have been set up by the reset database commands and this routine
**    fills in the keys for the whole set of databases.  The main call is to
**    ProduceDataBaseSearchKeys
*/
/*F  ret = DBProduceMoleculeSearchKeys(bind) bind: fill in keys for Molecules
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Main routine to produce the set of keys for the molecules.  This
**    routine calls DBProduceMolSubsSearchKeys to do the work.
**
**  REMARKS
**     A Menu function:
**
**  SEE ALSO
**      Main Local Function: DBProduceMolSubsSearchKeys
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
extern INT DBProduceMoleculeSearchKeys(BindStructure *bind)
     {
     INT ret;

     ret = DBProduceMolSubsSearchKeys(bind,MOLECULE_DATABASE);
     return(ret);
     }
 
/*F  ret = DBProduceSubstructureSearchKeys(bind)  bind: fill in keys for Subs
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Main routine to produce the set of keys for the molecules.  This
**    routine calls DBProduceMolSubsSearchKeys to do the work.
**
**  REMARKS
**     A Menu function
**
**  SEE ALSO
**      Main Local Function: DBProduceMolSubsSearchKeys
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
*/
extern INT DBProduceSubstructureSearchKeys(BindStructure *bind)
     {
     INT ret;

     ret = DBProduceMolSubsSearchKeys(bind,SUBSTRUCTURE_DATABASE);
     return(ret);
     }

 
/*F  ret = DBProduceMolSubsSearchKeys(bind,dbflag)   extern:produces all keys
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag: The database info flag (GetDataBaseInfoFromID is used to
**            fetch the DatabaseInfo structure 
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   Once the search keys have been formed (DBResetMolSubsSearchKeys),
**   the actual keys can be be produced (call to general
**   ProduceDataBaseSearchKeys).  All the database elements are fetched
**   and the keywords are produced.
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: ProduceDataBaseSearchKeys
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
extern INT DBProduceMolSubsSearchKeys(BindStructure *bind, INT dbflag)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;

     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     ProduceDataBaseSearchKeys(dinfo);
     
     return(SYSTEM_NORMAL_RETURN);
     } 

/*S MolReadWriteCurrentKeys
*/
 
/*F  ret = InitializeMolStructDBKeys(bind)
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
extern INT InitializeMolStructDBKeys(BindStructure *bind)
     {
     
     DBResetMoleculeSearchKeys(bind);
     DBResetSubstructureSearchKeys(bind);
     ReadMoleculeDBKeys(bind);
     ReadSubStructureDBKeys(bind);
     return(SYSTEM_NORMAL_RETURN);
     }
/*F  ret = WriteMoleculeDBKeys(bind)
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
extern INT WriteMoleculeDBKeys(BindStructure *bind)
     {
     INT ret;
     
     ret = WriteCurrentMolStructKeys(bind,MOLECULE_DATABASE);
     
     return(ret);
     }
/*F  ret = WriteSubStructureDBKeys(bind)
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
extern INT WriteSubStructureDBKeys(BindStructure *bind)
     {
     INT ret;
     
     ret = WriteCurrentMolStructKeys(bind,SUBSTRUCTURE_DATABASE);
     
     return(ret);
     }
/*F  ret = ReadMoleculeDBKeys(bind)
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
extern INT ReadMoleculeDBKeys(BindStructure *bind)
     {
     INT ret;
     
     ret = ReadCurrentMolStructKeys(bind,MOLECULE_DATABASE);
     
     return(ret);
     }
/*F  ret = ReadSubStructureDBKeys(bind)
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
extern INT ReadSubStructureDBKeys(BindStructure *bind)
     {
     INT ret;
     
     ret = ReadCurrentMolStructKeys(bind,SUBSTRUCTURE_DATABASE);
     
     return(ret);
     }

/*F  ret = WriteCurrentMolStructKeys(bind,dbflag)
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag: the database id
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Using WriteAllDBSearchKeys the current set of keys are written
**    to the database.
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT WriteCurrentMolStructKeys(BindStructure *bind, INT dbflag)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     ret = WriteAllDBSearchKeys(dinfo);
     
     return(ret);
     }
 
/*F  ret = ReadCurrentMolStructKeys(bind,dbflag)
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag: the database id
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Using WriteAllDBSearchKeys  the keys DB_ID_SEARCH  DB_NAME_SEARCH are
**    read from the database. 
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
extern INT ReadCurrentMolStructKeys(BindStructure *bind, INT dbflag)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     ret = ReadKeyIntoMemory(DB_ID_SEARCH,dinfo);
     if(ret == SYSTEM_NORMAL_RETURN)
	  ReadKeyIntoMemory(DB_NAME_SEARCH,dinfo);
     
     return(ret);
     }

     

/*S MolExtractCurrent
**    A the molecule or substructure list file is opened and the names
**    (identified by name or id) are listed.  They
**    are extracted from the database and put into a newly
**    formed MoleculeInfo structure to be the new current
**    molecules.  The file with the names is formed with:
**    - Directory: DBDataDirectory
**    - RootName: DBDataMolRoot
**    - Suffix: .mol (MOLECULE_FILE_LIST_SUFFIX)
**
*/
/*F  ret = DBReadListOfMolecules(bind)  . . . . . bind: put list into current
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   These read a list of molecules or substructures to the current set of
**   molecules.
**
**  REMARKS
**     A Menu function
**
**  SEE ALSO
**      Main Local Function: DBReadListMolSubFromKeys
**
**  HEADERFILE
**      "chemdatabase.h", "comlib.h"
**
*/

extern INT DBReadListOfMolecules(BindStructure *bind)
     {
     INT ret;

     ret = DBReadListMolSubFromKeys(bind,MOLECULE_DATABASE);
     return(ret);
   }
 
/*F  ret = DBReadListOfSubstructures(bind)  . . . bind: put list into current
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   These read a list of molecules or substructures to the current set of
**   molecules.
**
**  REMARKS
**     A Menu function
**
**  SEE ALSO
**      Main Local Function: DBReadListMolSubFromKeys
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
extern INT DBReadListOfSubstructures(BindStructure *bind)
     {
     INT ret;

     ret = DBReadListMolSubFromKeys(bind,SUBSTRUCTURE_DATABASE);
     return(ret);
   }
/*F  ret = DBReadListMolSubFromKeys(bind,dbflag)  . extern: into current list
**
**  DESCRIPTION
**    bind: The bind structure
**    dbflag: The database info flag (GetDataBaseInfoFromID is used to
**            fetch the DatabaseInfo structure 
**    
**    
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    A the molecule list file is opened and the names
**    (identified by name or id) are listed.  The molecules
**    are extracted from the database and put into a newly
**    formed MoleculeInfo structure to be the new current
**    molecules
**
**  REMARKS
**       Filename derived from menu constants:
**                   DBDataDirectory, DBDataMolRoot
**        and the define:
**                   MOLECULE_FILE_LIST_SUFFIX
**       
**  SEE ALSO
**      Main Local Functions: 
**                  DBFindMolSubFromString
**                  IncrementMoleculeSet
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
extern INT DBReadListMolSubFromKeys(BindStructure *bind, INT dbflag)
     {
     FILE *file;
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     MoleculeSet *molset;
     MoleculeInfo *molinfo;
     CommandMaster *commandmaster;
     INT ret,nummols,incmols;
     CHAR *line,*string;

     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);

     nummols = MAX_CURRENT_MOLECULES;
     incmols = INC_CURRENT_MOLECULES;
     
     FreeMoleculeSet(molset);
     CreateMoleculeSet(molset,BIND_CURRENT_MOLECULES, "Current Molecules",
		       nummols,0,0,0);
     
     molset->NumberOfMolecules = 0;
     molset->PropertyTypes = InitializeMolecularPropertyTypes(molset->ID,molset->Name);

     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
     file = OpenReadFileFromCurrent("DBDataDirectory","DBDataMolRoot",
				    MOLECULE_FILE_LIST_SUFFIX,
				    RECOVER,"List of Molecules",
				    commandmaster);
     
     line = string = AllocateString(LINELENGTH);
     molinfo = molset->Molecules;
     if(file != 0)
	  {
	  line = NextNonBlankLine(file,string);
	  
	  while(line != 0)
	       {
	       printf("Molecule: %s\n",line);
	       ret = DBFindMolSubFromString(line,molinfo,dinfo);
	       if(ret == SYSTEM_NORMAL_RETURN)
		    {
		    printf("ID = %5d Name = %s\n",molinfo->ID, molinfo->Name);
		    }
	       
	       molinfo++;
	       molset->NumberOfMolecules +=1;
/*	       if(molset->NumberOfMolecules >= molset->NumberMoleculesAllocated)
		    IncrementMoleculeSet(molset);
*/		    
	       line = NextNonBlankLine(file,string);
	       }
	  fclose(file);
	  }
     Free(line);
     
     return(ret);
     }

   
/*F  ret = IncrementMoleculeSet(molset) . . . .  extern: reallocate molecules
**
**  DESCRIPTION
**    molset: The MoleculeSet structure to be expanded
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  The MoleculeSet structure is expanded by the MoleculeIncrement (to allow more
**  current molecules to be stored.
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/
 
extern INT IncrementMoleculeSet(MoleculeSet *molset)
     {
/*     INT incmols,nummols;
     unsigned int memsize;
     void *newset;

     nummols = molset->NumberOfMoleculesAllocated + molset->MoleculeIncrement;
     
     memsize = MoleculeInfoSize * molset->NumberOfMolecules;
     
     molset->NumberOfMoleculesAllocated = nummols;

     newset = Malloc(memsize);
     memcpy(newset, (void *) molset->Molecules, memsize);

     Free(molset->Molecules);
     molset->Molecules = newset;
*/     
     return(SYSTEM_NORMAL_RETURN);
     }
 
  
/*F  ret = IsAName(name)  . . determine if a name
**
**  DESCRIPTION
**    name: The string name
**    ret: true:  has a alphacharacter in name
**
**  REMARKS
*/
int IsAName(CHAR *name) 
{
  int anumber;
  anumber = 1;
  while(*name != '\0' && anumber) {
    if( (*name >= 'a' && *name <= 'z') ||
        (*name >= 'A' && *name <= 'Z') ||
        (*name == '-')                 ) {
	  anumber = 0;
	}
    name++;
  }
  return !anumber;
  }

/*F  ret = DBFindMolSubFromString(name,mol,dinfo)  . . extern: read database
**
**  DESCRIPTION
**    name: The string name of the 
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      ProduceMolNameKey, ProduceMolIDKey, SearchKeyElement
**
**  HEADERFILE
**      chemdatabase.h, comlib.h
**
*/

extern INT DBFindMolSubFromString(CHAR *name, MoleculeInfo *mol, 
				  DataBaseInformation *dinfo)
     {
     DbaseKeyword *key;
     INT id,ret;
     
     key = AllocateDbaseKeyword;
     ret = SYSTEM_ERROR_RETURN;

     if(!IsAName(name))          {
       sscanf(name,"%d",&id);
       ProduceMolIDKey(id,key);
       ret = SearchKeyElement(DB_ID_SEARCH,mol,key,dinfo);
     }
     if(ret == SYSTEM_ERROR_RETURN)  {
       ProduceMolNameKey(name,key);
       ret = SearchKeyElement(DB_NAME_SEARCH,mol,key,dinfo);
     }
     
     FreeDbaseKeyword(key);
     Free(key);
     
     return(ret);
     }

     
	  
	

