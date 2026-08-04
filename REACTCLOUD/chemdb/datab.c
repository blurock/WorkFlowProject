/*  FILE     datab.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The chemical database routines for the master structure and those 
**    routines that are close to the basic database routines.
**    The database is initialized, opened, etc.
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

#include "chemdb/chemdatab.c"

 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static INT InitializeMoleculeDB(DataBaseInformation *dinfo,
				ChemDBMaster *dbmaster);
static INT InitializeSubstructuresDB(DataBaseInformation *dinfo,
				     ChemDBMaster *dbmaster);

static INT InitializeBensonTablesDB(DataBaseInformation *dinfo,
				     ChemDBMaster *dbmaster);
static INT InitializeChemkinThermoDB(DataBaseInformation *dinfo,
				     ChemDBMaster *dbmaster);
static INT InitializeRxnPatternDB(DataBaseInformation *dinfo,
				  ChemDBMaster *dbmaster);
static INT InitializeReactionDB(DataBaseInformation *dinfo,
				ChemDBMaster *dbmaster);
static INT InitializeReactionMechanismDB(DataBaseInformation *dinfo,
					 ChemDBMaster *dbmaster);
/*S Initialization
*/
/*F  ret = GetConstantsChemDB(bind) . . . . . . . . . . . . .  menu constants
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**             The constants for the menu are set up
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: GetCurrentStringArgument
**
**  HEADERFILE
**
*/

extern INT GetConstantsChemDB(BindStructure *bind)
     {
     ChemDBMaster *dbmaster;
     CommandMaster *commandmaster;
     ChemDBConstants *constants;
     
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     constants = dbmaster->Constants; 

     constants->DBDirectory = GetCurrentStringArgument("DBDirectory",
						       commandmaster);
      return(SYSTEM_NORMAL_RETURN);
    } 
 
/*F  ret = (bind)
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
extern INT InitializeAllDatabases(BindStructure *bind)
     {
     INT readkey;
     CommandMaster *commandmaster;

     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     InitializeChemDBInfo(bind);

     OpenChemDBFiles(bind);

     DBResetMoleculeSearchKeys(bind);
     DBResetReactionSearchKeys(bind);
     DBResetSubstructureSearchKeys(bind);
     DBResetRxnPatternSearchKeys(bind);
     readkey = GetCurrentIntegerArgument("KeyRead",commandmaster);
     
     if(readkey != 0)
	  {
	  ReadMoleculeDBKeys(bind);
	  ReadReactionDBKeys(bind);
	  ReadSubStructureDBKeys(bind);
	  ReadRxnPatternDBKeys(bind);
	  }

     return(SYSTEM_NORMAL_RETURN);
     }


/*F master = InitializeChemDBMaster(id,name)  . . . . . . . master initialize
**
**  DESCRIPTION
**    id: The id of the chemistry master structure
**    name: The name of the chemistry master structure
**    master: The allocated and initialized master structure
**
**  REMARKS
**     This routine is usually called in the main routine to 
**     initialize the master (bind) structure 
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern ChemDBMaster *InitializeChemDBMaster(INT id, CHAR *name)
     {
     ChemDBMaster *dbmaster;
     
     dbmaster = AllocateChemDBMaster;
     CreateChemDBMaster(dbmaster,id,name,
			0,0);
     
     dbmaster->Constants = AllocateChemDBConstants;
     CreateChemDBConstants(dbmaster->Constants,id,name,
			   0,0,0,0,0,0,0);
     return(dbmaster);
     }
 
/*S StartingDatabase
*/
/*F  ret = CreateChemDBFiles(bind)  . . . . . . . . . . . . . .  create dbase
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    This routine loops through all the databases and creates them
**
**  REMARKS
**   The database files are left open after they are created
**
**  SEE ALSO
**      Main Functions: CreateDataBase
**
**  HEADERFILE
**
*/    
extern INT CreateChemDBFiles(BindStructure *bind)
     {
     ChemDBMaster *dbmaster;
     DataBaseInformation *dinfo;
     INT i;
     
     InitializeChemDBInfo(bind);
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = dbmaster->DatabaseInfo->Databases;
     LOOPi(dbmaster->DatabaseInfo->NumberOfDatabases)
	  {
	  CreateDataBase(dinfo);
	  dinfo++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }
 
/*F  ret = OpenChemDBFiles(bind)  . . . . . . . . . . . . . . . .  open dbase
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  This routine loops through all the databases and creates them
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: OpenDataBase
**
**  HEADERFILE
**
*/

extern INT OpenChemDBFiles(BindStructure *bind)
     {
     ChemDBMaster *dbmaster;
     DataBaseInformation *dinfo;
     INT i;
     
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = dbmaster->DatabaseInfo->Databases;
     LOOPi(dbmaster->DatabaseInfo->NumberOfDatabases)
	  {
	  OpenDataBase(dinfo);
	  dinfo++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

 
/*F  ret = CloseChemDBFiles(bind) . . . . . . . . . . . . . . . . close dbase
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  This routine loops through all the databases and closes them
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: OpenDataBase
**
**  HEADERFILE
**
*/
extern INT CloseChemDBFiles(BindStructure *bind) 
     {
     ChemDBMaster *dbmaster;
     DataBaseInformation *dinfo;
     INT i;
     
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);

     dinfo = dbmaster->DatabaseInfo->Databases;
     LOOPi(dbmaster->DatabaseInfo->NumberOfDatabases)
	  {
	  CloseDataBase(dinfo);
	  dinfo++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }


 
/*S DefineChemistryDatabase
    This set of routines sets up the definitions of the chemistry database.
    This basically entails creating the DBMaster structure with the 
*/
/*F  ret = InitializeChemDBInfo(bind) . . . . . . . . .  initialize database 
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   This is the initialization routine to setup all the databases
**   
**  REMARKS
**
**  SEE ALSO
**      Main Functions: InitializeMoleculeDB, InitializeSubstructuresDB
**
**  HEADERFILE
**
*/
extern INT InitializeChemDBInfo(BindStructure *bind)
     {
     DbaseMaster *db;
     INT ret;
     ChemDBMaster *dbmaster;
     
     GetConstantsChemDB(bind);
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);

     db = dbmaster->DatabaseInfo = AllocateDbaseMaster;
     CreateDbaseMaster(db,dbmaster->ID,dbmaster->Name,
		       7,0);
     
     ret = InitializeMoleculeDB(db->Databases + 0,
				dbmaster);
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  ret = InitializeSubstructuresDB(db->Databases + 1,
					 dbmaster);
	  if(ret == SYSTEM_NORMAL_RETURN)
	       {
	       ret = InitializeBensonTablesDB(db->Databases + 2,
					      dbmaster);
	       if(ret == SYSTEM_NORMAL_RETURN)
		    {
		    ret = InitializeChemkinThermoDB(db->Databases + 3,
						    dbmaster);
		    if(ret == SYSTEM_NORMAL_RETURN)
			 {
			 ret = InitializeReactionDB(db->Databases + 4,
						    dbmaster);
			 if(ret == SYSTEM_NORMAL_RETURN)
			      {
			      ret = InitializeRxnPatternDB(db->Databases + 5,
							   dbmaster);
			      if(ret == SYSTEM_NORMAL_RETURN)
				   {
				   ret = InitializeReactionMechanismDB(db->Databases + 6,
								dbmaster);
				   }
			      }
			 }
		    }
	       }
	  }
     
     return(ret);
     }
 
/*f  ret = InitializeMoleculeDB(dinfo,dbmaster)  . . . . . . molecule database
**
**  DESCRIPTION
**    dinfo: The database information file to fill in
**    dbmaster: The chemistry master structure
**
**  REMARKS
**
*/
static INT InitializeMoleculeDB(DataBaseInformation *dinfo,
				ChemDBMaster *dbmaster)
     {
     ChemDBConstants *constants;
     
     constants = dbmaster->Constants;
     EliminateBlanks(constants->DBDirectory);
     
     CreateDataBaseInformation(dinfo,MOLECULE_DATABASE,
			       "Molecules",
			       "Molecules",
			       constants->DBDirectory,
			       WriteBinMoleculeInfo,
			       ReadBinMoleculeInfo,
			       0,
			       0,AllocMoleculeInfo,FreeMoleculeInfo);

     return(SYSTEM_NORMAL_RETURN);
     }
 
/*f  ret = InitializeSubstructuresDB(dinfo,dbmaster) . . Substructure database
**
**  DESCRIPTION
**    dinfo: The database information file to fill in
**    dbmaster: The chemistry master structure
**
**  REMARKS
**
*/
static INT InitializeSubstructuresDB(DataBaseInformation *dinfo,
				     ChemDBMaster *dbmaster)

     {
     ChemDBConstants *constants;
     
     constants = dbmaster->Constants;
     
     EliminateBlanks(constants->DBDirectory);
     
     CreateDataBaseInformation(dinfo,SUBSTRUCTURE_DATABASE,
			       "Substructures",
			       "SubStructures",
			       constants->DBDirectory,
			       WriteBinMoleculeInfo,
			       ReadBinMoleculeInfo,
			       0,
			       0,AllocMoleculeInfo,FreeMoleculeInfo);
     
     return(SYSTEM_NORMAL_RETURN);
     }
/*f  ret = InitializeBensonTablesDB(dinfo,dbmaster) . . Substructure database
**
**  DESCRIPTION
**    dinfo: The database information file to fill in
**    dbmaster: The chemistry master structure
**
**  REMARKS
**
*/
static INT InitializeBensonTablesDB(DataBaseInformation *dinfo,
				    ChemDBMaster *dbmaster)
     {
     ChemDBConstants *constants;
     
     constants = dbmaster->Constants;
     
     EliminateBlanks(constants->DBDirectory);
     
     CreateDataBaseInformation(dinfo,BENSON_TABLES_DATABASE,
			       "BensonTables",
			       "BensonTables",
			       constants->DBDirectory,
			       WriteBinBensonTables,
			       ReadBinBensonTables,
			       0,0,
			       AllocBensonTables,
			       FreeBensonTables);
     
     return(SYSTEM_NORMAL_RETURN);
     }
/*f  ret = InitializeChemkinThermoDB(dinfo,dbmaster) . . Substructure database
**
**  DESCRIPTION
**    dinfo: The database information file to fill in
**    dbmaster: The chemistry master structure
**
**  REMARKS
**
*/
static INT InitializeChemkinThermoDB(DataBaseInformation *dinfo,
				     ChemDBMaster *dbmaster)
     {
     ChemDBConstants *constants;
     
     constants = dbmaster->Constants;
     
     EliminateBlanks(constants->DBDirectory);
     
     CreateDataBaseInformation(dinfo,CHEMKIN_THERMO_DATABASE,
			       "ChemkinThermo",
			       "ChemkinThermo",
			       constants->DBDirectory,
			       WriteBinChemkinThermoRead,
			       ReadBinChemkinThermoRead,
			       0,
			       0,
			       AllocChemkinThermoRead,
			       FreeChemkinThermoRead);
     
     return(SYSTEM_NORMAL_RETURN);
     }

/*f  ret = InitializeReactionDB(dinfo,dbmaster)
**
**  DESCRIPTION
**    dinfo: The database information file to fill in
**    dbmaster: The chemistry master structure
**
**  REMARKS
**
*/
static INT InitializeReactionDB(DataBaseInformation *dinfo,
				     ChemDBMaster *dbmaster)
     {
     ChemDBConstants *constants;
     
     constants = dbmaster->Constants;
     
     EliminateBlanks(constants->DBDirectory);
     
     CreateDataBaseInformation(dinfo,REACTION_DATABASE,
			       "Reactions",
			       "Reactions",
			       constants->DBDirectory,
			       WriteBinReactionInfo,
			       ReadBinReactionInfo,
			       0,
			       0,
			       AllocReactionInfo,
			       FreeReactionInfo);
     
     return(SYSTEM_NORMAL_RETURN);
     }

/*f  ret = InitializeRxnPatternDB(dinfo,dbmaster)
**
**  DESCRIPTION
**    dinfo: The database information file to fill in
**    dbmaster: The chemistry master structure
**
**  REMARKS
**
*/
static INT InitializeRxnPatternDB(DataBaseInformation *dinfo,
				  ChemDBMaster *dbmaster)
     {
     ChemDBConstants *constants;
     
     constants = dbmaster->Constants;
     
     EliminateBlanks(constants->DBDirectory);
     
     CreateDataBaseInformation(dinfo,PATTERN_DATABASE,
			       "ReactionPatterns",
			       "ReactionPatterns",
			       constants->DBDirectory,
			       WriteBinReactionInfo,
			       ReadBinReactionInfo,
			       0,
			       0,
			       AllocReactionInfo,
			       FreeReactionInfo);     
     return(SYSTEM_NORMAL_RETURN);
     }
/*f  ret = InitializeRxnPatternDB(dinfo,dbmaster)
**
**  DESCRIPTION
**    dinfo: The database information file to fill in
**    dbmaster: The chemistry master structure
**
**  REMARKS
**
*/
static INT InitializeReactionMechanismDB(DataBaseInformation *dinfo,
					 ChemDBMaster *dbmaster)
     {
     ChemDBConstants *constants;
     
     constants = dbmaster->Constants;
     
     EliminateBlanks(constants->DBDirectory);
     
     CreateDataBaseInformation(dinfo,MECHANISM_DATABASE,
			       "RxnMechanism",
			       "RxnMechanism",
			       constants->DBDirectory,
			       WriteBinDetailedMechanism,
			       ReadBinDetailedMechanism,
			       0,
			       0,
			       AllocDetailedMechanism,
			       FreeDetailedMechanism);     
     return(SYSTEM_NORMAL_RETURN);
     }





