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
#define RXNPATID_NUM_BONDCHANGES    10000
#define RXNPATID_NUM_REACTANT_ATOMS 1000000
#define RXNPATID_NUM_REACTANT_C     100000000
#define RXNPATID_NUM_REACTANT_HR   1000000000
#define RXNPATID_NUM_REACTANT_HET  1000000000

#define RXNPATID_MAX_NUM_REACTANTS      99
#define RXNPATID_MAX_NUM_PRODUCTS       99
#define RXNPATID_MAX_NUM_BONDCHANGES    99
#define RXNPATID_MAX_NUM_REACTANT_ATOMS 99
#define RXNPATID_MAX_NUM_REACTANT_C     99
#define RXNPATID_MAX_NUM_REACTANT_HR    99
#define RXNPATID_MAX_NUM_REACTANT_HET   99

static BindStructure *CurrentClassificationBind = NULL;

static MoleculeInfo *GetMoleculeInfoFromReactantID(INT id, BindStructure *bind, INT *must_free) {
  MoleculeSet *molset;
  MoleculeInfo *mol = NULL;
  ChemDBMaster *master;
  DataBaseInformation *dinfo;
  CHAR idstr[32];
  INT res;

  *must_free = 0;
  if (bind == NULL || id <= 0) return NULL;

  /* 1. Try BIND_CURRENT_MOLECULES */
  molset = GetBoundStructure(bind, BIND_CURRENT_MOLECULES);
  if (molset != NULL) {
    mol = FindMoleculeInMoleculeSet(id, molset);
  }

  /* 2. Try BIND_CURRENT_SUBSTRUCTURES */
  if (mol == NULL) {
    molset = GetBoundStructure(bind, BIND_CURRENT_SUBSTRUCTURES);
    if (molset != NULL) {
      mol = FindMoleculeInMoleculeSet(id, molset);
    }
  }

  /* 3. If not found in memory sets, fetch from SUBSTRUCTURE_DATABASE in database */
  if (mol == NULL) {
    master = GetBoundStructure(bind, BIND_CHEMDBASE);
    if (master != NULL && master->DatabaseInfo != NULL) {
      dinfo = GetDataBaseInfoFromID(master->DatabaseInfo, SUBSTRUCTURE_DATABASE);
      if (dinfo != NULL) {
        sprintf(idstr, "%d", id);
        mol = AllocateMoleculeInfo;
        memset(mol, 0, sizeof(MoleculeInfo));
        res = DBFindMolSubFromString(idstr, mol, dinfo);
        if (res == 0 && mol->Molfile != NULL) {
          *must_free = 1;
        } else {
          /* Try MOLECULE_DATABASE */
          dinfo = GetDataBaseInfoFromID(master->DatabaseInfo, MOLECULE_DATABASE);
          res = (dinfo != NULL) ? DBFindMolSubFromString(idstr, mol, dinfo) : -1;
          if (res == 0 && mol->Molfile != NULL) {
            *must_free = 1;
          } else {
            FreeMoleculeInfo(mol);
            Free(mol);
            mol = NULL;
          }
        }
      }
    }
  }

  return mol;
}

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
  INT numBonds = 0;
  if (rxn != NULL) {
    if (rxn->TotalCorr != NULL) {
      if (rxn->TotalCorr->BondChanges != NULL) {
        numBonds = rxn->TotalCorr->BondChanges->NumberBondChanges;
        printf("[DEBUG DetermineRxnPatternNumBondChanges] Rxn '%s': TotalCorr and BondChanges present, NumberBondChanges = %d\n",
               rxn->Name ? rxn->Name : "NULL", numBonds);
      } else {
        printf("[DEBUG DetermineRxnPatternNumBondChanges] Rxn '%s': TotalCorr present, but BondChanges is NULL -> 0\n",
               rxn->Name ? rxn->Name : "NULL");
      }
    } else {
      printf("[DEBUG DetermineRxnPatternNumBondChanges] Rxn '%s': TotalCorr is NULL -> 0\n",
             rxn->Name ? rxn->Name : "NULL");
    }
  } else {
    printf("[DEBUG DetermineRxnPatternNumBondChanges] rxn is NULL -> 0\n");
  }
  return numBonds;
}

static INT DetermineRxnPatternNumReactantAtoms(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  MoleculeInfo *mol;
  INT totalAtoms = 0, i, must_free;

  if (rxn == NULL || CurrentClassificationBind == NULL) return 0;

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    mol = GetMoleculeInfoFromReactantID(rxn->Reactants[i], CurrentClassificationBind, &must_free);
    if (mol != NULL && mol->Molfile != NULL) {
      totalAtoms += mol->Molfile->NAtoms;
    }
    if (must_free && mol != NULL) {
      FreeMoleculeInfo(mol);
      Free(mol);
    }
  }
  return totalAtoms;
}


static INT DetermineRxnPatternNumReactantCarbons(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  MoleculeInfo *mol;
  MolFileAtom *atm;
  INT carbons = 0, i, k, must_free;

  if (rxn == NULL || CurrentClassificationBind == NULL) return 0;

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    mol = GetMoleculeInfoFromReactantID(rxn->Reactants[i], CurrentClassificationBind, &must_free);
    if (mol != NULL && mol->Molfile != NULL) {
      atm = mol->Molfile->Atoms;
      for (k = 0; k < mol->Molfile->NAtoms; k++) {
        if (atm->AtomicNumber == 6)
          carbons++;
        atm++;
      }
    }
    if (must_free && mol != NULL) {
      FreeMoleculeInfo(mol);
      Free(mol);
    }
  }
  return carbons;
}

static INT DetermineRxnPatternNumReactantHandR(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  MoleculeInfo *mol;
  MolFileAtom *atm;
  INT count = 0, i, k, must_free;

  if (rxn == NULL || CurrentClassificationBind == NULL) return 0;

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    mol = GetMoleculeInfoFromReactantID(rxn->Reactants[i], CurrentClassificationBind, &must_free);
    if (mol != NULL && mol->Molfile != NULL) {
      atm = mol->Molfile->Atoms;
      for (k = 0; k < mol->Molfile->NAtoms; k++) {
        if (atm->AtomicNumber == 1 || atm->AtomicNumber > 100 || atm->AtomicNumber <= 0)
          count++;
        atm++;
      }
    }
    if (must_free && mol != NULL) {
      FreeMoleculeInfo(mol);
      Free(mol);
    }
  }
  return count;
}

static INT DetermineRxnPatternNumReactantHetero(VOID *object) {
  ReactionInfo *rxn = (ReactionInfo *)object;
  MoleculeInfo *mol;
  MolFileAtom *atm;
  INT hetero = 0, i, k, must_free;

  if (rxn == NULL || CurrentClassificationBind == NULL) return 0;

  for (i = 0; i < rxn->NumberOfReactants; i++) {
    mol = GetMoleculeInfoFromReactantID(rxn->Reactants[i], CurrentClassificationBind, &must_free);
    if (mol != NULL && mol->Molfile != NULL) {
      atm = mol->Molfile->Atoms;
      for (k = 0; k < mol->Molfile->NAtoms; k++) {
        if (atm->AtomicNumber > 1 && atm->AtomicNumber <= 100 && atm->AtomicNumber != 6)
          hetero++;
        atm++;
      }
    }
    if (must_free && mol != NULL) {
      FreeMoleculeInfo(mol);
      Free(mol);
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

static INT SubstructureMatches(INT id1, INT id2, BindStructure *bind) {
  MoleculeInfo *m1 = NULL, *m2 = NULL;
  INT free1 = 0, free2 = 0, match = 0;

  if (id1 == id2 && id1 > 0) return 1;

  m1 = GetMoleculeInfoFromReactantID(id1, bind, &free1);
  m2 = GetMoleculeInfoFromReactantID(id2, bind, &free2);

  if (m1 != NULL && m2 != NULL) {
    if (m1->ID == m2->ID && m1->ID > 0) {
      match = 1;
    } else if (m1->Name != NULL && m2->Name != NULL && strcmp(m1->Name, m2->Name) == 0) {
      match = 1;
    }
  }

  if (free1 && m1 != NULL) { FreeMoleculeInfo(m1); Free(m1); }
  if (free2 && m2 != NULL) { FreeMoleculeInfo(m2); Free(m2); }

  return match;
}

static INT CompareRxnSubstructures(INT num1, INT *list1, INT num2, INT *list2, BindStructure *bind) {
  INT i, j;
  INT *used;

  if (num1 != num2) return 0;
  if (num1 == 0) return 1;

  used = (INT *) Calloc(num2, sizeof(INT));
  for (i = 0; i < num1; i++) {
    INT found = 0;
    for (j = 0; j < num2; j++) {
      if (!used[j] && SubstructureMatches(list1[i], list2[j], bind)) {
        used[j] = 1;
        found = 1;
        break;
      }
    }
    if (!found) {
      Free(used);
      return 0;
    }
  }
  Free(used);
  return 1;
}

/*F ans = ReactionPatternEquivalence(pat1, pat2)
**
**  DESCRIPTION
**    Checks structural equivalence between two reaction patterns.
**    Compares reactant substructures (by name or ID) and product substructures (by name or ID).
**    Returns 0 if patterns are structurally identical.
*/
extern INT ReactionPatternEquivalence(VOID *pat1, VOID *pat2) {
  ReactionInfo *r1 = (ReactionInfo *)pat1;
  ReactionInfo *r2 = (ReactionInfo *)pat2;
  BindStructure *bind = CurrentClassificationBind;

  if (r1 == NULL || r2 == NULL) return -1;

  printf("[ReactionPatternEquivalence] Comparing Pattern1 '%s' (R=%d, P=%d) with Pattern2 '%s' (R=%d, P=%d)\n",
         r1->Name ? r1->Name : "NULL", r1->NumberOfReactants, r1->NumberOfProducts,
         r2->Name ? r2->Name : "NULL", r2->NumberOfReactants, r2->NumberOfProducts);

  if (r1->NumberOfReactants != r2->NumberOfReactants || r1->NumberOfProducts != r2->NumberOfProducts) {
    return -1;
  }

  if (!CompareRxnSubstructures(r1->NumberOfReactants, r1->Reactants, r2->NumberOfReactants, r2->Reactants, bind)) {
    return -1;
  }

  if (!CompareRxnSubstructures(r1->NumberOfProducts, r1->Products, r2->NumberOfProducts, r2->Products, bind)) {
    return -1;
  }

  printf("[ReactionPatternEquivalence] Reaction patterns match!\n");
  return 0;
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
    INT det_id = 0;
    printf("[DetermineRxnPatternDatabaseCorrespondence DEBUG] Reaction %d/%d: '%s' (reaction->ID=%d)\n",
           i + 1, rxnset->NumberOfReactions,
           reaction->Name ? reaction->Name : "NULL", reaction->ID);
    if (reaction != NULL && reaction->Name != NULL) {
      det_id = DetermineObjectID((VOID)reaction, classid, DATABASE_CLASSIFICATIONS, bind);
      printf("[DetermineRxnPatternDatabaseCorrespondence DEBUG] Reaction '%s': DetermineObjectID returned %d\n",
             reaction->Name, det_id);
      if (det_id == 0)
        *id = -1;
      else
        *id = det_id;
    } else {
      *id = -1;
    }
    printf("[DetermineRxnPatternDatabaseCorrespondence DEBUG] Reaction '%s': Set corrset point *id = %d\n",
           reaction->Name ? reaction->Name : "NULL", *id);
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
    if (reaction->ID != 0) {
      key->ID = reaction->ID;
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
