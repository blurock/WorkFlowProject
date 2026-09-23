/*  FILE     objfindrxn.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Automatic Generation of Reaction Pattern ID
**    Find Identical Reaction Patterns in Database
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

#define RXNPATID_NUM_REACTANTS          1
#define RXNPATID_NUM_PRODUCTS         100
#define RXNPATID_NUM_BONDCHANGES     1000
#define RXNPATID_NUM_REACTANT_ATOMS 10000
#define RXNPATID_NUM_REACTANT_C     100000
#define RXNPATID_NUM_REACTANT_HR   1000000
#define RXNPATID_NUM_REACTANT_HET  10000000

#define RXNPATID_MAX_NUM_REACTANTS      99
#define RXNPATID_MAX_NUM_PRODUCTS       99
#define RXNPATID_MAX_NUM_BONDCHANGES    99
#define RXNPATID_MAX_NUM_REACTANT_ATOMS 999
#define RXNPATID_MAX_NUM_REACTANT_C     999
#define RXNPATID_MAX_NUM_REACTANT_HR    999
#define RXNPATID_MAX_NUM_REACTANT_HET   999

static BindStructure *CurrentClassificationBind = NULL;

static INT DetermineRxnPatternNumReactants(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  return rxn ? rxn->NumberOfReactants : 0;
}

static INT DetermineRxnPatternNumProducts(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  return rxn ? rxn->NumberOfProducts : 0;
}

static INT DetermineRxnPatternNumBondChanges(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  if (rxn != NULL && rxn->TotalCorr != NULL && rxn->TotalCorr->BondChanges != NULL)
    return rxn->TotalCorr->BondChanges->NumberBondChanges;
  return 0;
}

static INT DetermineRxnPatternNumReactantAtoms(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  MoleculeSet *molset;
  MoleculeInfo *mol;
  INT totalAtoms = 0, i;

  if (rxn == NULL || CurrentClassificationBind == NULL) return 0;
  molset = GetBoundStructure(CurrentClassificationBind, BIND_CURRENT_MOLECULES);
  if (molset == NULL) return 0;

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    mol = FindMoleculeInMoleculeSet(rxn->Reactants[i], molset);
    if (mol != NULL && mol->Molfile != NULL) {
      totalAtoms += mol->Molfile->NAtoms;
    }
  }
  return totalAtoms;
}

static INT DetermineRxnPatternNumReactantCarbons(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  MoleculeSet *molset;
  MoleculeInfo *mol;
  MolFileAtom *atm;
  INT carbons = 0, i, k;

  if (rxn == NULL || CurrentClassificationBind == NULL) return 0;
  molset = GetBoundStructure(CurrentClassificationBind, BIND_CURRENT_MOLECULES);
  if (molset == NULL) return 0;

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    mol = FindMoleculeInMoleculeSet(rxn->Reactants[i], molset);
    if (mol != NULL && mol->Molfile != NULL) {
      atm = mol->Molfile->Atoms;
      for (k = 0; k < mol->Molfile->NAtoms; k++) {
        if (atm->AtomicNumber == 6)
          carbons++;
        atm++;
      }
    }
  }
  return carbons;
}

static INT DetermineRxnPatternNumReactantHandR(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  MoleculeSet *molset;
  MoleculeInfo *mol;
  MolFileAtom *atm;
  INT count = 0, i, k;

  if (rxn == NULL || CurrentClassificationBind == NULL) return 0;
  molset = GetBoundStructure(CurrentClassificationBind, BIND_CURRENT_MOLECULES);
  if (molset == NULL) return 0;

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    mol = FindMoleculeInMoleculeSet(rxn->Reactants[i], molset);
    if (mol != NULL && mol->Molfile != NULL) {
      atm = mol->Molfile->Atoms;
      for (k = 0; k < mol->Molfile->NAtoms; k++) {
        if (atm->AtomicNumber == 1 || atm->AtomicNumber > 100 || atm->AtomicNumber <= 0)
          count++;
        atm++;
      }
    }
  }
  return count;
}

static INT DetermineRxnPatternNumReactantHetero(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  MoleculeSet *molset;
  MoleculeInfo *mol;
  MolFileAtom *atm;
  INT hetero = 0, i, k;

  if (rxn == NULL || CurrentClassificationBind == NULL) return 0;
  molset = GetBoundStructure(CurrentClassificationBind, BIND_CURRENT_MOLECULES);
  if (molset == NULL) return 0;

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    mol = FindMoleculeInMoleculeSet(rxn->Reactants[i], molset);
    if (mol != NULL && mol->Molfile != NULL) {
      atm = mol->Molfile->Atoms;
      for (k = 0; k < mol->Molfile->NAtoms; k++) {
        if (atm->AtomicNumber > 1 && atm->AtomicNumber <= 100 && atm->AtomicNumber != 6)
          hetero++;
        atm++;
      }
    }
  }
  return hetero;
}

/*F ret = InitializeReactionClassifications(BindStructure *bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern INT InitializeReactionClassifications(BindStructure *bind)
     {
     ReactionSet *bindrxns;
     ReactionInfo *rxninfo;
     INT i,id;
     ObjectClassification *classification;
     
     CurrentClassificationBind = bind;
     bindrxns = GetBoundStructure(bind, BIND_CURRENT_PATTERNS);
     classification = FindClassification(PATTERN_DATABASE, LOCAL_CLASSIFICATIONS, bind);
     FreeObjectIDTreeNode(classification->TreeOfObjects);
     CreateObjectIDTreeNode(classification->TreeOfObjects,
			    classification->ID, classification->Name,
			    0, 0, 0);
     
     rxninfo = bindrxns->Reactions;
     LOOPi(bindrxns->NumberOfReactions)
	  {
	  id = DetermineObjectID((VOID) rxninfo,
				 PATTERN_DATABASE,
				 LOCAL_CLASSIFICATIONS,
				 bind);
	  if(id == 0)
	       rxninfo->ID = AddObjectToIDClass(rxninfo, classification, bind);
	  else
	       rxninfo->ID = id;
	  
	  rxninfo++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }

/*F ListOfTreeLevelDescriptions = InitializeReactionTreeDescription(id, name)
**
**  DESCRIPTION
**    Sets up the classification tree description levels for reaction patterns (7 levels):
**      Level 0: Number of Reactants
**      Level 1: Number of Products
**      Level 2: Number of Bond Changes
**      Level 3: Total Reactant Atoms
**      Level 4: Reactant Carbons
**      Level 5: Reactant H and R Atoms
**      Level 6: Reactant Heteroatoms (O, N, S, etc.)
**
*/
extern ListOfTreeLevelDescriptions *InitializeReactionTreeDescription(INT id, CHAR *name)
     {
     ListOfTreeLevelDescriptions *descr;
     TreeLevelDescription *level;
     INT bindstruct;

     bindstruct = (id == REACTION_DATABASE) ? BIND_CURRENT_REACTIONS : BIND_CURRENT_PATTERNS;

     descr = AllocateListOfTreeLevelDescriptions;
     CreateListOfTreeLevelDescriptions(descr, id, name,
				       7, 0, bindstruct, id, DB_ID_SEARCH);

     level = descr->Levels;
     CreateTreeLevelDescription(level, 0, "Number of Reactants", RXNPATID_NUM_REACTANTS,
                                RXNPATID_MAX_NUM_REACTANTS);
     level->LevelIDFunc = DetermineRxnPatternNumReactants;

     level++;
     CreateTreeLevelDescription(level, 1, "Number of Products", RXNPATID_NUM_PRODUCTS,
                                RXNPATID_MAX_NUM_PRODUCTS);
     level->LevelIDFunc = DetermineRxnPatternNumProducts;

     level++;
     CreateTreeLevelDescription(level, 2, "Number of Bond Changes", RXNPATID_NUM_BONDCHANGES,
                                RXNPATID_MAX_NUM_BONDCHANGES);
     level->LevelIDFunc = DetermineRxnPatternNumBondChanges;

     level++;
     CreateTreeLevelDescription(level, 3, "Total Reactant Atoms", RXNPATID_NUM_REACTANT_ATOMS,
                                RXNPATID_MAX_NUM_REACTANT_ATOMS);
     level->LevelIDFunc = DetermineRxnPatternNumReactantAtoms;

     level++;
     CreateTreeLevelDescription(level, 4, "Reactant Carbons", RXNPATID_NUM_REACTANT_C,
                                RXNPATID_MAX_NUM_REACTANT_C);
     level->LevelIDFunc = DetermineRxnPatternNumReactantCarbons;

     level++;
     CreateTreeLevelDescription(level, 5, "Reactant H and R Atoms", RXNPATID_NUM_REACTANT_HR,
                                RXNPATID_MAX_NUM_REACTANT_HR);
     level->LevelIDFunc = DetermineRxnPatternNumReactantHandR;

     level++;
     CreateTreeLevelDescription(level, 6, "Reactant Heteroatoms", RXNPATID_NUM_REACTANT_HET,
                                RXNPATID_MAX_NUM_REACTANT_HET);
     level->LevelIDFunc = DetermineRxnPatternNumReactantHetero;

     return(descr);
     }

/*F ans = ReactionPatternEquivalence(pat1, pat2)
**
**  DESCRIPTION
**    Checks structural equivalence between two reaction patterns using CompareReactionInfo.
**    Returns 0 if patterns are structurally identical.
*/
extern INT ReactionPatternEquivalence(VOID *pat1, VOID *pat2) {
  ReactionInfo *r1 = (ReactionInfo *)pat1;
  ReactionInfo *r2 = (ReactionInfo *)pat2;
  INT ans;

  if (r1 == NULL || r2 == NULL) return -1;

  printf("[ReactionPatternEquivalence] Comparing Pattern1 '%s' (ID %d, R=%d, P=%d) with Pattern2 '%s' (ID %d, R=%d, P=%d)\n",
         r1->Name ? r1->Name : "NULL", r1->ID, r1->NumberOfReactants, r1->NumberOfProducts,
         r2->Name ? r2->Name : "NULL", r2->ID, r2->NumberOfReactants, r2->NumberOfProducts);

  ans = CompareReactionInfo(r1, r2, 0, NULL);
  printf("[ReactionPatternEquivalence] Comparison result = %d (0 means MATCH)\n", ans);

  return ans;
}

/*F FindReactionPatternByKey(key, setofelements)
**
**  DESCRIPTION
**    Finds a ReactionInfo within a ReactionSet using the key name.
*/
extern VOID *FindReactionPatternByKey(DbaseKeyword *key, VOID *setofelements) {
  ReactionInfo *rxninfo;

  if (key == NULL || setofelements == NULL) return NULL;
  rxninfo = FindReactionInReactionSetByName(key->Name, (ReactionSet *)setofelements);
  return ((VOID *)rxninfo);
}

/*F datasubset = DetermineRxnPatternDatabaseCorrespondence(rxnset, classid, bind)
**
**  DESCRIPTION
**    Queries the database classification tree for reaction patterns to find matching IDs.
*/
extern DataSubSet *DetermineRxnPatternDatabaseCorrespondence(ReactionSet *rxnset,
                                                              INT classid,
                                                              BindStructure *bind) {
  ObjectClassification *classification;
  DataBaseInformation *dinfo;
  ChemDBMaster *dbmaster;
  ReactionInfo *reaction;
  DataSubSet *corrset;
  INT *id, i, ret;

  CurrentClassificationBind = bind;

  dbmaster = GetBoundStructure(bind, BIND_CHEMDBASE);
  classification = FindClassification(classid, DATABASE_CLASSIFICATIONS, bind);
  if (classification == NULL || classification->Description == NULL) return NULL;

  dinfo = GetDataBaseInfoFromID(dbmaster->DatabaseInfo,
                                classification->Description->Database);

  ret = ReadKeyIntoMemory(DB_ID_SEARCH, dinfo);
  if (ret == SYSTEM_NORMAL_RETURN)
    ReadKeyIntoMemory(DB_NAME_SEARCH, dinfo);

  corrset = AllocateDataSubSet;
  CreateDataSubSet(corrset, rxnset->ID, rxnset->Name, 0,
                   rxnset->NumberOfReactions, 0);

  reaction = rxnset->Reactions;
  id = corrset->Points;
  LOOPi(rxnset->NumberOfReactions) {
    if (reaction->ID >= 0) {
      *id = DetermineObjectID((VOID)reaction, classid, DATABASE_CLASSIFICATIONS,
                              bind);
      if (*id == 0)
        *id = -1;
    } else
      *id = -1;
    id++;
    reaction++;
  }
  return (corrset);
}

/*F id = PutReactionInDatabaseClass(reaction, classid, bind)
**
**  DESCRIPTION
**    Determines classification tree node for a reaction pattern and stores/updates
**    the classification index in Firestore.
*/
extern INT PutReactionInDatabaseClass(ReactionInfo *reaction, INT classid,
                                      BindStructure *bind) {
  DataBaseInformation *dinfo;
  ObjectClassification *classification;
  SearchKeyInfo *keytype;
  DbaseKeyword *key;
  ChemDBMaster *master;
  ObjectIDClass *class;
  ObjectIDInfo *info;
  INT id, ret;

  CurrentClassificationBind = bind;

  master = GetBoundStructure(bind, BIND_CHEMDBASE);
  classification = FindClassification(classid, DATABASE_CLASSIFICATIONS, bind);
  if (classification == NULL || classification->Description == NULL)
    return (reaction ? reaction->ID : 0);

  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,
                                classification->Description->Database);
  ret = ReadKeyIntoMemory(DB_ID_SEARCH, dinfo);
  if (ret == SYSTEM_NORMAL_RETURN)
    ReadKeyIntoMemory(DB_NAME_SEARCH, dinfo);

  id = DetermineObjectID((VOID)reaction, classid, DATABASE_CLASSIFICATIONS, bind);
  if (id == 0) {
    dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,
                                  classification->Description->Database);
    class = FindOrCreateObjectIDClass((VOID)reaction, classification->Description,
                                      classification->TreeOfObjects);
    if (reaction->ID <= 0)
      reaction->ID = class->ID + class->NumberOfKeys;

    keytype = FindKeyTypeFromID(classification->Description->KeyType, dinfo);
    key = AllocateDbaseKeyword;
    if (keytype != NULL && keytype->InsertKey != NULL) {
      (*(keytype->InsertKey))(reaction, key);
    } else {
      ProduceRxnIDKey(reaction->ID, key);
    }
    if (key->Name == NULL && reaction->Name != NULL) {
      key->Name = CopyString(reaction->Name);
    }
    id = AddIDKeyToClass(key, class);
    reaction->ID = id;

    info = DetermineObjectIDInfo(classification->Description, (VOID)reaction);
    StoreObjectIDClassToFirestore(DATABASE_CLASSIFICATIONS,
                                  classification->Name, info, class);
    FreeObjectIDInfo(info);
    Free(info);

    WriteOutClassification(classid, bind);
    printf("[PutReactionInDatabaseClass] Stored reaction '%s' in classification under ID %d\n",
           reaction->Name ? reaction->Name : "NULL", reaction->ID);
  } else {
    printf("[PutReactionInDatabaseClass] Reaction '%s' already in classification under ID %d\n",
           reaction->Name ? reaction->Name : "NULL", id);
    reaction->ID = id;
  }
  return (reaction->ID);
}
