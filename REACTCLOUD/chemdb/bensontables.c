/*  FILE     bensontables.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
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
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"

#include "chemdb/thermo.c"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/

static void MergeAtomTranslationTables(SetOfBensonAtomTranslationPairs *total,
				       SetOfBensonAtomTranslationPairs *set); 
 

/*F  ret = StoreCurrentBensonTables(bind)
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
extern INT StoreCurrentBensonTables(BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     BensonTables *btable;
     SetOfTables *tables;
     SetOfBenson2ndOrderTables *bentables;
     ChemDBMaster *master;
     BensonSecondOrderTable *single;
     INT i;
     DbaseKeyword *key;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     bentables = tables->SecondOrder;
     if(bentables != 0)
	  {
	  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,BENSON_TABLES_DATABASE);

	  btable = AllocateBensonTables;
	  single = bentables->Tables;
	  LOOPi(bentables->NumberOfTables)
	       {
	       CreateBensonTables(btable,single->ID,single->Name,
				  single,
				  0,
				  tables->AtomTranslations);
	       key = ComputeBensonTable2ndOrderKey(single);
	       StoreElement((VOID *) btable,
			    key,
			    GDBM_REPLACE,
			    dinfo);
	       
	       if(dinfo->Keys != 0)
		    InsertSearchKeys((VOID) btable,key,dinfo->Keys);
	       FreeDbaseKeyword(key);
	       Free(key);
	       FreeBensonTables(btable);
	       
	       single++;
	       }
	  }
     else
	  Error(0,"No Benson Tables To Store");
     
     return(SYSTEM_NORMAL_RETURN);
     }
/*F  ret = StoreCurrentBensonTree(bind)
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
extern INT StoreCurrentBensonTree(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     DataBaseInformation *dinfo;
     BensonTables *btable;
     SetOfTables *tables;
     BensonCalculation *bentree;
     ChemDBMaster *master;
     DbaseKeyword *key;
     CHAR *name;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     bentree = tables->BensonTree;
     btable = AllocateBensonTables;
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,BENSON_TABLES_DATABASE);
     
     CreateBensonTables(btable,bentree->ID,bentree->Name,
		       0,
		       bentree,
		       0);
     name = GetCurrentStringArgument("BensonTreeName",commandmaster);

     printf("Current Benson Tree Name: %s  %s\n",name,bentree->Name);

     key = ComputeBensonTreeKey(name);
     StoreElement((VOID) btable,
		  key,
		  GDBM_REPLACE,
		  dinfo);
     
     if(dinfo->Keys != 0)
	  InsertSearchKeys((VOID) btable,key,dinfo->Keys);
     FreeDbaseKeyword(key);
     Free(key);
     FreeBensonTables(btable);
     
     return(SYSTEM_NORMAL_RETURN);
     }
/*F  ret = StoreCurrentChemkinValues(bind)
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
extern INT StoreCurrentChemkin(BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     SetOfTables *tables;
     SetOfChemkinThermoInformation *chemkin;
     ChemkinThermoRead *single;
     ChemDBMaster *master;
     INT i;
     DbaseKeyword *key;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     chemkin = tables->ChemkinThermo;
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,CHEMKIN_THERMO_DATABASE);
     single = chemkin->Thermo;
     LOOPi(chemkin->NumberOfMolecules) {
       if(single->Species != 0) {
	 key = ComputeChemkinValueKey(single);
	 StoreElement((VOID *) single,
		      key,
		      GDBM_REPLACE,
		      dinfo);
       
	 if(dinfo->Keys != 0)
	   InsertSearchKeys((VOID) single,key,dinfo->Keys);
	 FreeDbaseKeyword(key);
	 Free(key);
       } else {
	 printf("Error in reading the %d th chemkin\n",i);
       }
	 
       single++;
     }
     return(SYSTEM_NORMAL_RETURN);
     }

/*F
**
**  DESCRIPTION
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
extern INT FillInChemkinInCurrent(BindStructure *bind)
     {
     ChemDBMaster *dbmaster;
     DataBaseInformation *dinfo;
     MoleculeSet *molset;
     MoleculeInfo *mol;
     PropertyValues *values,*chemvalues;
     GenPropValue *value,*chemvalue,*cvalue;
     ChemkinThermoRead *chemkin,*fullchemkin;
     INT i,j,count,ret;
     DbaseKeyword *chemkey,*key;
     CHAR *ref,*text,*name;
     CHAR *valuename;
     
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);
     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     dinfo = GetDataBaseInfoFromID(dbmaster->DatabaseInfo,
				   CHEMKIN_THERMO_DATABASE);

     chemkin = AllocateChemkinThermoRead;
     fullchemkin = AllocateChemkinThermoRead;
     

     mol = molset->Molecules;
     LOOPi(molset->NumberOfMolecules) {
	  if(mol->ID >= 0) {
		 values = FindValuesFromType(ALTERNATIVE_NAMES_PROPERTY,
					     mol->Properties);
		 if(values != NULL) {
		   value = FindSpecificValueInPropertyValues("CHEMKIN",values);
		   if(value != 0) {
			  key = AllocateDbaseKeyword;
			  CreateDbaseKeyword(key,CHEMKIN_THERMO_DATABASE,value->Value,
					     (INT) strlen(value->Value) + 1,
					     value->Value);
			  ret = FetchElement(fullchemkin,key,dinfo);
			  if(ret ==  SYSTEM_ERROR_RETURN) {
			    printf("ERROR\n");
			    printf("Molecule: %s\n",  mol->Name);
			    valuename = (char *) value->Value;
			    EliminateBlanks(valuename);
			    printf("for molecule: %s (Chemkin: %s)\n", mol->Name,valuename);
			    printf("ERROR\n");
			  } else {
			    if(fullchemkin->Name == 0)
			      fullchemkin->Name = mol->Name;

			    chemvalues = FindValuesFromType(CHEMKIN_READTHERMO_PROPERTY,
							  mol->Properties);
			    cvalue = chemvalues->Values;
			    for(count = 0; count < chemvalues->NumberOfValues; count++)
			      {
				FreeGenPropValue(cvalue);
				cvalue++;
			      }
			    chemvalues->NumberOfValues = 0;

			    chemvalue = AllocateGenPropValue;
			    ProduceChemkinGenPropValue(chemvalue,fullchemkin);
			    chemvalue->Reference = CopyString(bind->Name);
			    AddValueToPropertyValues(chemvalue,chemvalues);
			  }
			} else {
			  printf("CHEMKIN type not found for '%s'\n",mol->Name);
			}
		      value++;
		 } else {
		   printf("Alternate names properties not found for '%s'\n",mol->Name);
		 }
	  }
	  mol++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }
/*F  ret = PrintChemkinNameCorrespondences(bind)
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
extern INT PrintChemkinNameCorrespondences(BindStructure *bind) {
     CommandMaster *commandmaster;
     FILE *file;
     MoleculeSet *molset;
     MoleculeInfo *mol;
     SetOfPropertyTypes *types;
     SetOfPropertyValues *valueset;
     PropertyValues *values;
     GenPropValue *value;
     INT ret;
     INT i;
     CHAR *name;

     ret = SYSTEM_NORMAL_RETURN;     
     types = InitializeMolecularPropertyTypes(molset->ID,molset->Name);
     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     name = GetCurrentStringArgument("AlternativeName",commandmaster);
     file = OpenWriteFileFromCurrent("ChemkinDirectory",
                                "RootChemkinName",
                                "lst",
                                IGNORE,
                                "Mechanism Definition",
                                 commandmaster);
     if(file != 0) {
       mol = molset->Molecules;
       LOOPi(molset->NumberOfMolecules) {
          if(mol->ID >= 0 && mol->Name != NULL) {
             valueset = mol->Properties;
             values = FindValuesFromType(ALTERNATIVE_NAMES_PROPERTY,valueset);
	     if( values != 0) {
	       value = FindSpecificValueInPropertyValues(name,values);
	       if(value != 0) {
		 fprintf(file,"%20s  %20s\n",mol->Name,value->Value);
	       } else {
		 fprintf(file,"%20s  %20s\n",mol->Name,mol->Name);
	       }
	     } else {
	       fprintf(file,"%20s  %20s\n",mol->Name,mol->Name);
	     }
	  }
	  mol++;
       } 
     } else {
       	  ret = SYSTEM_ERROR_RETURN;
     }
  return(ret);
}
		    
/*F  key = ComputeChemkinValueKey(thermo) extern
**
**  DESCRIPTION
**    molecule:
**      The chemkin value from which the keyword is to be derived
**    key:
**      The keyword to be used in the database (made from the Species name)
**    
**  REMARKS
**
*/
extern DbaseKeyword *ComputeChemkinValueKey(ChemkinThermoRead *thermo)
     {
     DbaseKeyword *key;
     
     key = AllocateDbaseKeyword;
     CreateDbaseKeyword(key,CHEMKIN_THERMO_DATABASE,thermo->Name,
			(INT) strlen(thermo->Species) + 1,
			thermo->Species);
     return(key);
     }
/*F  key = ComputeBensonTreeKey(thermo,name) 
**
**  DESCRIPTION
**    molecule:
**      The chemkin value from which the keyword is to be derived
**    key:
**      The keyword to be used in the database (made from the table name)
**    
**  REMARKS
**
*/
extern DbaseKeyword *ComputeBensonTreeKey(CHAR *name)
     {
     DbaseKeyword *key;
     
     key = AllocateDbaseKeyword;
     CreateDbaseKeyword(key,BENSON_TABLES_DATABASE,name,
			(INT) strlen(name) + 1,
			name);
     return(key);
     }
/*F  key = ComputeBensonTable2ndOrderKey(name) extern
**
**  DESCRIPTION
**    molecule:
**      The chemkin value from which the keyword is to be derived
**    key:
**      The keyword to be used in the database (made from the table name)
**    
**  REMARKS
**
*/
extern DbaseKeyword *ComputeBensonTable2ndOrderKey(BensonSecondOrderTable *thermo)
     {
     DbaseKeyword *key;
     
     key = AllocateDbaseKeyword;
     CreateDbaseKeyword(key,BENSON_TABLES_DATABASE,thermo->Name,
			(INT) strlen(thermo->Name) + 1,
			thermo->Name);
     return(key);
     }

/*S PrintThermoTables
*/

 
/*F  ret = PrintAllBensonTables(bind)
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
extern INT PrintAllBensonTables(BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     BensonTables *btable;
     DbaseKeyword *keyword;
     INT ret;
     ChemDBMaster *master;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,BENSON_TABLES_DATABASE);

     keyword = AllocateDbaseKeyword;
     btable = AllocateBensonTables;
     
     ret = FetchFirstElement((VOID *) btable,keyword,dinfo);
     
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  while(ret == SYSTEM_NORMAL_RETURN)
	       {
	       if(btable->SecondOrder != 0)
		    printf(": --> %10d: %s\n",
			   btable->SecondOrder->ID,
			   btable->SecondOrder->Name);
	       FreeBensonTables(btable);
	       ret = FetchNextElement((VOID *) btable,keyword,dinfo);
	       }
	  Free(btable);
	  FreeDbaseKeyword(keyword);
	  }
     Free(keyword);
	  
     return(SYSTEM_NORMAL_RETURN);
     }
/*F  ret = PrintAllBensonTables(bind)
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
extern INT PrintAllBensonTrees(BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     BensonTables *btable;
     DbaseKeyword *keyword;
     INT ret;
     ChemDBMaster *master;

     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,BENSON_TABLES_DATABASE);

     keyword = AllocateDbaseKeyword;
     btable = AllocateBensonTables;
     
     ret = FetchFirstElement((VOID *) btable,keyword,dinfo);
     
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  while(ret == SYSTEM_NORMAL_RETURN)
	       {
	       if(btable->BensonTree != 0)
		    printf("%10d: %s\n",
			   btable->BensonTree->ID,
			   btable->BensonTree->Name);
	       FreeBensonTables(btable);
	       ret = FetchNextElement((VOID *) btable,keyword,dinfo);
	       }
	  Free(btable);
	  FreeDbaseKeyword(keyword);
	  }
     Free(keyword);
	  
     return(SYSTEM_NORMAL_RETURN);
     }
/*F  ret = PrintAllChemkinValues(bind)
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
extern INT PrintAllChemkinValues(BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     ChemkinThermoRead *value;
     DbaseKeyword *keyword;
     INT ret;
     ChemDBMaster *master;
     ChemkinThermoRead *thermo;
     CHAR *string;

     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     string = AllocateString(4 * 80+10);

     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,CHEMKIN_THERMO_DATABASE);

     keyword = AllocateDbaseKeyword;
     value = AllocateChemkinThermoRead;
     
     ret = FetchFirstElement((VOID *) value,keyword,dinfo);
     
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  while(ret == SYSTEM_NORMAL_RETURN)
	       {
	       StringMoleculeStandardChemkinThermo(string,value);
	       printf("%s",string);
	       FreeChemkinThermoRead(value);
	       ret = FetchNextElement((VOID *) value,keyword,dinfo);
	       }
	  Free(value);
	  FreeDbaseKeyword(keyword);
	  }
     Free(keyword);
     Free(string);
     return(SYSTEM_NORMAL_RETURN);
     }


/*S ReadFromLists
*/
 
/*F  ret = ReadBensonTablesFromList(bind)
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
extern INT ReadBensonTablesFromList(BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     ChemDBMaster *master;
     CommandMaster *commandmaster;
     BensonTables *btable;
     SetOfTables *tables;
     INT maxnum,count;
     FILE *file;
     CHAR *string,*line;
     DbaseKeyword *key;
     SetOfBensonAtomTranslationPairs *atomtrans;
     SetOfBenson2ndOrderTables *set;
     BensonSecondOrderTable *benson;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     
     maxnum = GetCurrentIntegerArgument("MaxNumberOfTables",commandmaster);

     file = OpenReadFileFromCurrent("TablesDataDirectory","TablesDataBensonRoot",
				    MOL_FILE_LIST_SUFFIX,
				    IGNORE,"List of Molfiles",commandmaster);
     
     if(file != 0)
	  {
	  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,BENSON_TABLES_DATABASE);
	  
	  if(tables->SecondOrder != 0)
	       {
	       FreeSetOfBenson2ndOrderTables(tables->SecondOrder);
	       Free(tables->SecondOrder);
	       }
	  
	  set = tables->SecondOrder = AllocateSetOfBenson2ndOrderTables;
	  CreateSetOfBenson2ndOrderTables(set,master->ID,master->Name,
					  maxnum,0);
	  set->NumberOfTables = 0;
	  
	  string = AllocateString(LINELENGTH);
	  line = NextNonBlankLine(file,string);
	  
	  EliminateBlanks(line);
	  atomtrans = AllocateSetOfBensonAtomTranslationPairs;
	  CreateSetOfBensonAtomTranslationPairs(atomtrans,master->ID,line,
						0,0);
	  
	  line = NextNonBlankLine(file,string);
	  key = AllocateDbaseKeyword;
	  benson = set->Tables;
	  btable = AllocateBensonTables;
	  count = 0;
	  while(line != 0 && count < maxnum)
	       {
	       EliminateLeadingBlanks(line);
	       CreateDbaseKeyword(key,0,line,
				  (INT)strlen(line)+1,line);
	       
	       FetchElement((VOID) btable,
			    key,dinfo);
	       
	       set->NumberOfTables +=1;
	       if(btable->SecondOrder != 0)
		 {
		   printf("Read Table: %s\n",btable->Name);
		   CopyFullBensonSecondOrderTable(benson,btable->SecondOrder);
		 }
	       else
		 {
		   printf("SecondOrderTable not set up -- zero: %s\n",line);
		 }
	       if(btable->Translation != 0)
		 MergeAtomTranslationTables(atomtrans,btable->Translation);
	       else
		 {
		   printf("Atom Translation Zero: %s -- zero\n",line);
		 }
		 
	       FreeBensonTables(btable);
	       FreeDbaseKeyword(key);
	       
	       line = NextNonBlankLine(file,string);
	       benson++;
	       count++;
	       }
	  if(count == maxnum)
	       Error(0,"Not Enough Table Allocation, did not read all");
	  
	   fclose(file);
	   Free(key);
	   Free(btable);
	   Free(string);
	   }	

      return(SYSTEM_NORMAL_RETURN);
      }
/*f MergeAtomTranslationTables(total,set) 
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void MergeAtomTranslationTables(SetOfBensonAtomTranslationPairs *total,
				       SetOfBensonAtomTranslationPairs *set)
     {
     INT totalnum,i,done,count,oldsize;
     SetOfBensonAtomTranslationPairs *new;
     BensonTranslationPair *next,*newpair,*oldpair;
     CHAR *string;
     
     totalnum = total->NumberOfPairs + set->NumberOfPairs;
     
     new = AllocateSetOfBensonAtomTranslationPairs;
     CreateSetOfBensonAtomTranslationPairs(new,total->ID,total->Name,
					   totalnum,0);
     
     new->NumberOfPairs = total->NumberOfPairs;
     oldsize = BensonTranslationPairSize * total->NumberOfPairs;
     memcpy(new->Pairs,total->Pairs,(unsigned int) oldsize);
     Free(total->Pairs);
     Free(total->Name);

     next = set->Pairs;
     newpair = new->Pairs + new->NumberOfPairs;
     LOOPi(set->NumberOfPairs)
	  {
	  
	  oldpair = new->Pairs;
	  done = 0;
	  count = 0;
	  while(done == 0 && count < new->NumberOfPairs)
	       {
	       if(!strcmp(next->AtomName,oldpair->AtomName))
		    {
		    done = 1;
		    if(next->Valence != oldpair->Valence)
			 {
			 string = AllocateString(LINELENGTH);
			 sprintf(string,"For Atom %s two valence values %d %d (choosing first)\n",
				 next->AtomName,oldpair->Valence,next->Valence);
			 Error(0,string);
			 Free(string);
			 done = 0;
			 }
		    }
	       count++;
	       oldpair++;
	       }
	  if(done != 0)
	       {
	       CopyFullBensonTranslationPair(newpair,next);
	       newpair++;
	       new->NumberOfPairs += 1;
	       }
	  
	  next++;
	  }
     memcpy(total,new,SetOfBensonAtomTranslationPairsSize);
     
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
extern INT DBReadInBensonTree(BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     CommandMaster *commandmaster;
     ChemDBMaster *master;
     SetOfTables *tables;
     BensonTables *btable;
     DbaseKeyword *key;
     CHAR *name;
     BensonCalculation *tree;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,BENSON_TABLES_DATABASE);
     
     name = GetCurrentStringArgument("BensonTreeName",commandmaster);
     key = ComputeBensonTreeKey(name);

     btable = AllocateBensonTables;
     ret = FetchElement((VOID) btable,
		   key,dinfo);
     if(ret == SYSTEM_NORMAL_RETURN)
	  {
	  if(tables->BensonTree != 0)
	       {
	       FreeBensonCalculation(tables->BensonTree);
	       Free(tables->BensonTree);
	       }
	  
	  tree = tables->BensonTree = AllocateBensonCalculation;
	  if(btable->BensonTree != 0)
	    CopyFullBensonCalculation(tree,btable->BensonTree);
	  else
	    {
	      printf("Not BensonTree in %s\n",name);
	    }

	  FreeBensonTables(btable);
	  }
     
      Free(btable);
      FreeDbaseKeyword(key);
      Free(key);
      
      return(SYSTEM_NORMAL_RETURN);
      }

