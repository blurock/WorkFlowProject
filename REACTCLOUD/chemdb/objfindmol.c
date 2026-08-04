/*  FILE     objfind.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Automatic Generation of Molecule ID
**    Find Identical Structures in Database
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
static INT DetermineNumberOfAtoms(MoleculeInfo *molecule);
static INT  DetermineNumberOfBonds(MoleculeInfo *molecule);
static INT  DetermineNumberOfCarbons(MoleculeInfo *molecule);
static INT  DetermineStructureType(MoleculeInfo *molecule);


/*S MoleculeClassifications
*/
 
/*F FindMoleculesInDatabase(molset)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern DataSubSet *ReplaceMoleculesFromDatabase(MoleculeSet *molset,
						BindStructure *bind)
     {
     ChemDBMaster *master;
     DataSubSet *corrset;
     DataBaseInformation *dinfo;
     DbaseKeyword *key;
     INT *id,i,ret;
     MoleculeInfo *mol;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,MOLECULE_DATABASE);
     corrset = DetermineDatabaseCorrespondence(molset,
					       MOLECULE_DATABASE,
					       bind);
     key = AllocateDbaseKeyword;
     id = corrset->Points;
     mol = molset->Molecules;
     LOOPi(corrset->NumberOfPoints)
	  {
	    if(*id >= 0)
	      {
		FreeMoleculeInfo(mol);
		ProduceMolIDKey(*id,key);
		ret = SearchKeyElement(DB_ID_SEARCH,mol,key,dinfo);
		if(ret != SYSTEM_NORMAL_RETURN)
		  {
		    printf("Abnormal Situation: Keyed Molecule %d not found\n",*id);
		  }
		
		FreeDbaseKeyword(key);
	      }
	    else
	      {
		printf("ReplaceMoleculesFromDatabase(no correspondence) %5d\n",mol->ID);
		*id = mol->ID;
	      }
	  id++;
	  mol++;
	  }
     return(corrset);
     }

/*F datasubset = DetermineDatabaseCorrespondence(molecules,classid,bind)
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
extern DataSubSet *DetermineDatabaseCorrespondence(MoleculeSet *molecules,
						   INT classid,
						   BindStructure *bind)
     {
     ObjectClassification *classification;
     DataBaseInformation *dinfo;
     ChemDBMaster *dbmaster;
     MoleculeInfo *molecule;
     DataSubSet *corrset;
     INT *id,i,ret;
     
     dbmaster = GetBoundStructure(bind,BIND_CHEMDBASE);
     classification = FindClassification(classid,DATABASE_CLASSIFICATIONS,bind);
     dinfo = GetDataBaseInfoFromID(dbmaster->DatabaseInfo,
				   classification->Description->Database);

     ret = ReadKeyIntoMemory(DB_ID_SEARCH,dinfo);
     if(ret == SYSTEM_NORMAL_RETURN)
	  ReadKeyIntoMemory(DB_NAME_SEARCH,dinfo);
     corrset = AllocateDataSubSet;
     CreateDataSubSet(corrset,molecules->ID,molecules->Name,
		      0,molecules->NumberOfMolecules,0);
     
     molecule = molecules->Molecules;
     id = corrset->Points;
     LOOPi(molecules->NumberOfMolecules)
	  {
	  if(molecule->ID >= 0)
	       {
	       *id = DetermineObjectID((VOID) molecule,
				       classid,
				       DATABASE_CLASSIFICATIONS,
				       bind);
	       if(*id == 0)
		    *id = -1;
	       }
	  else
	       *id = -1;
	  id++;
	  molecule++;
	  }
     return(corrset);
     }

	       
 
/*F id = PutMoleculeInDatabaseClass(molecule,source,bind)
**
**  DESCRIPTION
**    molecule    - The Molecule information
**    source      - The source of the classes
**                            MOLECULE_DATABASE,
**                            SUBSTRUCTURE_DATABASE
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
extern INT PutMoleculeInDatabaseClass(MoleculeInfo *molecule,
				      INT classid,
				      BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     ObjectClassification *classification;
     SearchKeyInfo *keytype;
     DbaseKeyword *key;
     ChemDBMaster *master;
     ObjectIDClass *class;
     INT id,ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     classification = FindClassification(classid,DATABASE_CLASSIFICATIONS,bind);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,
				   classification->Description->Database);
     ret = ReadKeyIntoMemory(DB_ID_SEARCH,dinfo);
     if(ret == SYSTEM_NORMAL_RETURN)
	  ReadKeyIntoMemory(DB_NAME_SEARCH,dinfo);
     id = DetermineObjectID((VOID) molecule,
			    classid,
			    DATABASE_CLASSIFICATIONS,
			    bind);
     if (id == 0)
	  {
	    dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,
					  classification->Description->Database);
	    class = FindOrCreateObjectIDClass(molecule,
					      classification->Description,
					      classification->TreeOfObjects);
	    molecule->ID = class->ID + class->NumberOfKeys;
	    keytype = FindKeyTypeFromID(classification->Description->KeyType,
					dinfo);
	    key = AllocateDbaseKeyword;
	    (*(keytype->InsertKey))(molecule,key);
	    id = AddIDKeyToClass(key,class);
	    WriteOutClassification(classid,bind);
	  }
     else
       {
	 printf("Found in database: %d\n",id);
	 molecule->ID = id;
       }
     return(molecule->ID);
     }
     
/*F ret = InitializeMoleculeClassifications(bind)
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

extern INT InitializeMoleculeClassifications(BindStructure *bind)
     {
     DataBaseInformation *dinfo;
     MoleculeSet *bindmols;
     MoleculeInfo *molinfo;
     INT i,id,ret;     
     ObjectClassification *classification;

     bindmols = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     classification = FindClassification(MOLECULE_DATABASE,LOCAL_CLASSIFICATIONS,bind);
     FreeObjectIDTreeNode(classification->TreeOfObjects);
     CreateObjectIDTreeNode(classification->TreeOfObjects,
			    classification->ID,classification->Name,
			    0,0,0);
     ret = ReadKeyIntoMemory(DB_ID_SEARCH,dinfo);
     if(ret == SYSTEM_NORMAL_RETURN)
	  ReadKeyIntoMemory(DB_NAME_SEARCH,dinfo);
     molinfo = bindmols->Molecules;
     LOOPi(bindmols->NumberOfMolecules)
	  {
	  id = DetermineObjectID((VOID) molinfo,
				 MOLECULE_DATABASE,
				 LOCAL_CLASSIFICATIONS,
				 bind);
	  if(id == 0)
	       molinfo->ID = AddObjectToIDClass(molinfo,classification,bind);
	  else
	       molinfo->ID = id;
	  
	  molinfo++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

/*S ClassTreeDescriptions
*/
/*F moldescr = InitializeMoleculeTreeDescription(id,name) . . . . . . . . .  
**
**  DESCRIPTION
**    id    - The id of the description (which database:
**                   MOLECULE_DATABASE,SUBSTRUCTURE_DATABASE
**    name  - The name of the description
**
**    This sets up the id description of a molecule
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
extern ListOfTreeLevelDescriptions *InitializeMoleculeTreeDescription(INT id, CHAR *name)
     {
     ListOfTreeLevelDescriptions *descr;
     TreeLevelDescription *level;
     
     descr = AllocateListOfTreeLevelDescriptions;
     CreateListOfTreeLevelDescriptions(descr,id,name,
				       4,0,BIND_CURRENT_MOLECULES,id,DB_ID_SEARCH);

     level = descr->Levels;
     CreateTreeLevelDescription(level,0,"Number of Bonds",
				MOLID_NUM_BONDS,MOLID_MAX_NUM_BONDS);
     level->LevelIDFunc = DetermineNumberOfBonds;
     
     level++;
     CreateTreeLevelDescription(level,1,"Number of Atoms",
				MOLID_NUM_ATOMS,MOLID_MAX_NUM_ATOMS);
     level->LevelIDFunc = DetermineNumberOfAtoms;
     
     level++;
     CreateTreeLevelDescription(level,2,"Number of Carbons",
				MOLID_NUM_CARBONS, MOLID_MAX_NUM_CARBONS);
     level->LevelIDFunc = DetermineNumberOfCarbons;
     
     level++;
     CreateTreeLevelDescription(level,3,"Structure Type",
				MOLID_STRUCTURE,MOLID_MAX_STRUCTURE);
     
     level->LevelIDFunc = DetermineStructureType;
     
     return(descr);
     }
 
/*f nbonds = DetermineNumberOfAtoms(molecule)
**
**  DESCRIPTION
**    molecule - The molecule
**    nbonds   - The number of bonds
**
**    The number of bonds of a molecule is returned (extracted from
**    the Molfile information.
**
**  REMARKS
**
*/
static INT DetermineNumberOfAtoms(MoleculeInfo *molecule)
     {
     MolFileMolecule *molfile;
     INT natoms;
     
     molfile = molecule->Molfile;
     natoms = molfile->NAtoms;
     return(natoms);
     }
/*f nbonds = DetermineNumberOfBonds(molecule)
**
**  DESCRIPTION
**    molecule - The molecule
**    natoms   - The number of atoms
**
**    The number of atoms of a molecule is returned (extracted from
**    the Molfile information.
**
**  REMARKS
**
*/
static INT  DetermineNumberOfBonds(MoleculeInfo *molecule)
     {
     MolFileMolecule *molfile;
     INT nbonds;
     
     molfile = molecule->Molfile;
     nbonds = molfile->NBonds;
     return(nbonds);
     }
/*f nbonds = DetermineNumberOfAtoms(molecule)
**
**  DESCRIPTION
**    molecule - The molecule
**    natoms   - The number of carbon atoms
**
**    The number of carbon atoms of a molecule is returned.
**
**  REMARKS
**    This routine calls  DetermineAtomCounts.... This structure
**    should be in the list of properties eventually
**
*/
static INT  DetermineNumberOfCarbons(MoleculeInfo *molecule)
     {
     MoleculeAtomCounts *atomcounts;
     AtomicNumberCount *atomcnt,*done;
     INT count,natoms;
     
     atomcounts = DetermineAtomCounts(molecule);
     done = 0;
     count = 0;
     atomcnt = atomcounts->AtomCounts;
     while(done == 0 && count < atomcounts->NumberOfAtomCounts)
	  {
	  if(atomcnt->ID == 6)
	       done = atomcnt;
	  atomcnt++;
	  count++;
	  }
     if(done != 0)
	  natoms = done->ACount;
     else
	  natoms = 0;
     	       
     return(natoms);
     }
/*f nbonds = DetermineStructureType(molecule)
**
**  DESCRIPTION
**    molecule - The molecule
**    natoms   - The number of carbon atoms
**
**    The number of carbon atoms of a molecule is returned.
**
**  REMARKS
**
*/
static INT  DetermineStructureType(MoleculeInfo *molecule)
     {
     MolFileMolecule *mlf;
     MolFileAtom *mlfatom;
     INT done,count,type;
     
     mlf = molecule->Molfile;

     mlfatom = mlf->Atoms;
     done = 0;
     count = 0;
     while(done == 0 && count < mlf->NAtoms)
	  {
	  if(mlfatom->Radical != 0)
	       done = 1;
	  mlfatom++;
	  count++;
	  }
     if(done == 1)
	  type = MOLID_MOLECULE_RADICAL;
     else
	  type = MOLID_MOLECULE;

     return(type);
     }




 
/*F FindMoleculeByKey(key,setofmolecules)
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
extern VOID FindMoleculeByKey(DbaseKeyword *key, VOID setofelements)
     {
     MoleculeInfo *molinfo;
     
     molinfo = FindMoleculeInMoleculeSetByName(key->Name,(MoleculeSet *) setofelements);
     
     return((VOID) molinfo);
     }

 
/*F MoleculeEquivalence(mol1,mol2)
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
extern INT MoleculeEquivalence(VOID mol1, VOID mol2)
     {
     Graph *grph1,*grph2;
     INT out;
     
     grph1 = GraphFromMolFile((MoleculeInfo *) mol1,
			      VALENCE_STANDARD);
     grph2 = GraphFromMolFile((MoleculeInfo *) mol2,
			      VALENCE_STANDARD);
     
     if(GraphsEqual(grph1,grph2))
	  out = 0;
     else
	  out = 1;
     /*
     PrintPrettyGraph("Graph 1:",stdout,grph1);
     PrintPrettyGraph("Graph 2:",stdout,grph2);
     */
     FreeGraph(grph1);
     FreeGraph(grph2);
     Free(grph1);
     Free(grph2);
     
     return(out);
     }
/*F SubStructureEquivalence(mol1,mol2)
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
extern INT SubStructureEquivalence(VOID mol1, VOID mol2)
     {
     Graph *grph1,*grph2;
     INT out;
     SetOfPairSets *pairsset;
     PairSet *pairs;
     Pair *pair;
     INT i,g1,g2;
     
     out = 0;
     
     grph1 = GraphFromMolFile((MoleculeInfo *) mol1,
			      VALENCE_ATOMIC_NUMBER);
     grph2 = GraphFromMolFile((MoleculeInfo *) mol2,
			      VALENCE_ATOMIC_NUMBER);
     
     pairsset = BasicSubGraph(grph1,grph2);
     printf("Equivalence: %10s %10s %5d\n", 
	    ((MoleculeInfo *) mol1)->Name, 
	    ((MoleculeInfo *) mol2)->Name,
	    pairsset->NumberOfSets);
     
     if(pairsset->NumberOfSets > 0)
       {
	 pairs = pairsset->Sets;
	 pair = pairs->Pairs;
	 i = 0;
	 while(i < pairs->NumberOfPairs && out == 0)
	   {
	     g1 = *(grph1->NodeTypes + pair->I);
	     g2 = *(grph1->NodeTypes + pair->J);
	     if(g1 != g2)
	       out = 1;
	     i++;
	     pair++;
	   }
       }
     else
       {
	 out = 1;
       }
     
     FreeGraph(grph1);
     FreeGraph(grph2);
     Free(grph1);
     Free(grph2);
     
     return(out);
     }



