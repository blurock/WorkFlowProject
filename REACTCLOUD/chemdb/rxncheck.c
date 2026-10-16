/*  FILE     rxncheck.c
**  PACKAGE     chemdb
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    FormatCheck, ExistenceCheck, and Store routines for
**    Reactions and Reaction Patterns.
**
**  COPYRIGHT (C) 2026 REACT Project / Edward S. Blurock
*/

#include "basic.h"
#include "cJSON.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"

static MoleculeInfo *FindMoleculeInSetByID(MoleculeSet *set, INT id) {
  INT i;
  MoleculeInfo *mol;
  if (set == 0 || set->Molecules == 0) return 0;
  mol = set->Molecules;
  for (i = 0; i < set->NumberOfMolecules; i++) {
    if (mol->ID == id) {
      return mol;
    }
    mol++;
  }
  return 0;
}



/*F ret = RxnPatternSubstructuresExist(bind, out)
**
**  DESCRIPTION
**    Reads the reaction pattern ASCII file line by line, isolates substructure
**    names (reactants and products), and checks whether each substructure exists
**    in SUBSTRUCTURE_DATABASE using DBFindMolSubFromString.
**    Outputs the substructures and their existence status to the out report file.
*/
static INT RxnPatternSubstructuresExist(BindStructure *bind, FILE *out) {
  CommandMaster *commandmaster;
  ChemDBMaster *master;
  DataBaseInformation *dinfo;
  FILE *file;
  CHAR *string, *name, *reactants, *products, *line, *next;
  MoleculeInfo *minfo;
  INT eout;
  INT num_checked = 0;
  INT num_missing = 0;

  commandmaster = GetBoundStructure(bind, BIND_COMMANDMASTER);
  if (commandmaster == NULL) return SYSTEM_ERROR_RETURN;

  master = GetBoundStructure(bind, BIND_CHEMDBASE);
  if (master == NULL) return SYSTEM_ERROR_RETURN;

  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo, SUBSTRUCTURE_DATABASE);
  if (dinfo == NULL) return SYSTEM_ERROR_RETURN;

  file = OpenReadFileFromCurrent(
      "RxnDirectory", "RootRxnName", RXN_FILE_LIST_SUFFIX, IGNORE,
      "List of Reactions/Reaction Patterns", commandmaster);

  if (file == NULL) {
    fprintf(out, "ERROR: Could not open reaction pattern list file.\n");
    return SYSTEM_ERROR_RETURN;
  }

  string = AllocateString(LINELENGTH);
  name = AllocateString(LINELENGTH);
  reactants = AllocateString(LINELENGTH);
  minfo = AllocateMoleculeInfo;

  fprintf(out, "\nSubstructures Database Existence Check:\n");
  fprintf(out, "%-35s %-35s\n", "Substructure_Name", "DB_Status");
  fprintf(out, "----------------------------------- -----------------------------------\n");

  line = NextNonBlankLine(file, string);
  while (line != NULL && *line != 0) {
    EliminateLeadingBlanks(line);

    next = IsolateNextWord(line, name, ' ', LINELENGTH);
    products = IsolateNextWordFromPhrase(next, reactants, " = ", LINELENGTH);

    /* Process Reactants */
    next = reactants;
    while (next != NULL && *next != 0) {
      next = IsolateNextWord(next, name, ' ', LINELENGTH);
      if (strcmp(name, "+") == 0 || name[0] == '\0')
        continue;
      eout = DBFindMolSubFromString(name, minfo, dinfo);
      num_checked++;
      if (eout == 0) {
        fprintf(out, "%-35.35s %-35s\n", name, "EXISTS");
      } else {
        fprintf(out, "%-35.35s %-35s\n", name, "NOT_FOUND");
        num_missing++;
      }
    }

    /* Process Products */
    next = products;
    while (next != NULL && *next != 0) {
      next = IsolateNextWord(next, name, ' ', LINELENGTH);
      if (strcmp(name, "+") == 0 || name[0] == '\0')
        continue;
      eout = DBFindMolSubFromString(name, minfo, dinfo);
      num_checked++;
      if (eout == 0) {
        fprintf(out, "%-35.35s %-35s\n", name, "EXISTS");
      } else {
        fprintf(out, "%-35.35s %-35s\n", name, "NOT_FOUND");
        num_missing++;
      }
    }

    /* Skip through the reaction pattern entry until line starts with $$$$ */
    line = NextNonBlankLine(file, string);
    while (line != NULL && strncmp(line, "$$$$", 4) != 0) {
      line = NextNonBlankLine(file, string);
    }
    if (line != NULL) {
      line = NextNonBlankLine(file, string);
    }
  }

  fclose(file);
  Free(string);
  Free(name);
  Free(reactants);
  Free(minfo);

  fprintf(out, "--------------------------------------------------------------------------------\n");
  if (num_missing > 0) {
    fprintf(out, "Substructure Check Result: %d of %d substructures NOT found in database.\n\n", num_missing, num_checked);
    return SYSTEM_ERROR_RETURN;
  } else {
    fprintf(out, "Substructure Check Result: All %d substructures exist in database.\n\n", num_checked);
    return SYSTEM_NORMAL_RETURN;
  }
}

/*F ret = ExistenceCheckRxnPatterns(bind)
**
**  DESCRIPTION
**    Checks DB existence for Reaction Patterns at 2 levels of equivalence.
**    Level 1: Substructure name match.
**    Level 2: 7-level classification search + CompareReactionInfo exact match.
**    Writes 3-column table to <RxnOutDir>/<RxnOutName>_Existence.out.
*/
extern INT ExistenceCheckRxnPatterns(BindStructure *bind) {
  CommandMaster *commandmaster;
  ChemDBMaster *master;
  DataBaseInformation *dinfo;
  FILE *out;
  ReactionSet *rxnpatset;
  DataSubSet *corrset;
  ReactionInfo *rxn, dbrxn;
  DbaseKeyword *key;
  INT *id, i, ret;

  commandmaster = GetBoundStructure(bind, BIND_COMMANDMASTER);
  out = OpenWriteFileFromCurrent("RxnOutDir", "RxnOutName", "Existence.out", IGNORE,
                                 "RxnPattern Existence Check", commandmaster);
  if (out == NULL) out = stdout;

  fprintf(out, "================================================================================\n");
  fprintf(out, "Reaction Patterns Existence Check Report\n");
  fprintf(out, "================================================================================\n");

  master = GetBoundStructure(bind, BIND_CHEMDBASE);
  if (master == NULL) {
    fprintf(out, "ERROR: ChemDBMaster (BIND_CHEMDBASE) is NULL. Open database first.\n");
    if (out != stdout) fclose(out);
    return SYSTEM_NORMAL_RETURN;
  }

  ret = RxnPatternSubstructuresExist(bind, out);
  if (ret != SYSTEM_NORMAL_RETURN) {
    fprintf(out, "Skipping reaction pattern database search because required substructures are missing from database.\n");
    fprintf(out, "================================================================================\n");
    if (out != stdout) fclose(out);
    return SYSTEM_NORMAL_RETURN;
  }

  ReadInRxnPatternsMolsFromDB(bind);
  rxnpatset = GetBoundStructure(bind, BIND_CURRENT_PATTERNS);

  if (rxnpatset == NULL || rxnpatset->NumberOfReactions == 0) {
    fprintf(out, "No reaction patterns currently loaded to check.\n");
    if (out != stdout) fclose(out);
    return SYSTEM_NORMAL_RETURN;
  }


  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo, PATTERN_DATABASE);

  if (FindClassification(PATTERN_DATABASE, DATABASE_CLASSIFICATIONS, bind) == NULL) {
    InitializeMoleculeClassifications(bind);
  }

  corrset = DetermineRxnPatternDatabaseCorrespondence(rxnpatset, PATTERN_DATABASE, bind);

  fprintf(out, "%-35s %-35s %-35s\n", "Reaction_Pattern_Name", "Substructure_Matches_In_DB", "Exact_Match_Name");
  fprintf(out, "----------------------------------- ----------------------------------- -----------------------------------\n");

  key = AllocateDbaseKeyword;
  rxn = rxnpatset->Reactions;
  if (corrset != NULL && corrset->Points != NULL) {
    id = corrset->Points;
    LOOPi(rxnpatset->NumberOfReactions) {
      CHAR *lvl1_str = "NONE";
      CHAR *lvl2_str = "NONE";

      printf("[ExistenceCheckRxnPatterns DEBUG] Reaction %d/%d: '%s', corrset *id = %d\n",
             i + 1, rxnpatset->NumberOfReactions, rxn->Name ? rxn->Name : "NULL", *id);

      if (*id != 0 && *id != -1) {
        memset(&dbrxn, 0, sizeof(ReactionInfo));
        ProduceRxnIDKey(*id, key);
        ret = SearchKeyElement(DB_ID_SEARCH, &dbrxn, key, dinfo);
        if (ret != SYSTEM_NORMAL_RETURN) {
          ProduceRxnNameKey(rxn->Name, key);
          ret = SearchKeyElement(DB_NAME_SEARCH, &dbrxn, key, dinfo);
        }

        if (ret == SYSTEM_NORMAL_RETURN && dbrxn.Name != NULL) {
          lvl1_str = dbrxn.Name;
          lvl2_str = dbrxn.Name;
        } else {
          lvl1_str = rxn->Name ? rxn->Name : "MATCH_FOUND";
          lvl2_str = rxn->Name ? rxn->Name : "MATCH_FOUND";
        }
        FreeDbaseKeyword(key);
      } else {
        printf("[ExistenceCheckRxnPatterns DEBUG] Reaction '%s': *id is %d (not found in DB), reporting NONE\n",
               rxn->Name ? rxn->Name : "NULL", *id);
      }

      fprintf(out, "%-35.35s %-35.35s %-35.35s\n",
              rxn->Name ? rxn->Name : "NULL", lvl1_str, lvl2_str);

      id++;
      rxn++;
    }
    FreeDataSubSet(corrset);
    Free(corrset);
  } else {
    LOOPi(rxnpatset->NumberOfReactions) {
      fprintf(out, "%-35.35s %-35s %-35s\n", rxn->Name ? rxn->Name : "NULL", "NONE", "NONE");
      rxn++;
    }
  }

  Free(key);
  fprintf(out, "================================================================================\n");

  if (out != stdout) fclose(out);
  return SYSTEM_NORMAL_RETURN;
}



/*F ret = ExistenceCheckReactions(bind)
**
**  DESCRIPTION
**    Checks DB existence for Reactions.
**    Checks molecule existence in MOLECULE_DATABASE and reports ALL missing molecules if any.
**    Checks reaction duplicate in REACTION_DATABASE.
**    Writes 3-column table to <RxnOutDir>/<RxnOutName>_Existence.out.
*/
extern INT ExistenceCheckReactions(BindStructure *bind) {
  CommandMaster *commandmaster;
  ChemDBMaster *master;
  DataBaseInformation *dinfo;
  FILE *out;
  ReactionSet *rxnset;
  MoleculeSet *molset;
  DataSubSet *corrset;
  ReactionInfo *rxn, dbrxn;
  MoleculeInfo *mol;
  DbaseKeyword *key;
  INT *id, i, k, ret;
  INT missing_count;

  commandmaster = GetBoundStructure(bind, BIND_COMMANDMASTER);
  out = OpenWriteFileFromCurrent("RxnOutDir", "RxnOutName", "Existence.out", IGNORE,
                                 "Reactions Existence Check", commandmaster);
  if (out == NULL) out = stdout;

  fprintf(out, "================================================================================\n");
  fprintf(out, "Reactions Database Existence Check Report\n");
  fprintf(out, "================================================================================\n");

  master = GetBoundStructure(bind, BIND_CHEMDBASE);
  if (master == NULL) {
    fprintf(out, "ERROR: ChemDBMaster (BIND_CHEMDBASE) is NULL. Open database first.\n");
    if (out != stdout) fclose(out);
    return SYSTEM_NORMAL_RETURN;
  }

  ReadInReactionsFromList(bind);
  rxnset = GetBoundStructure(bind, BIND_CURRENT_REACTIONS);
  molset = GetBoundStructure(bind, BIND_CURRENT_MOLECULES);

  if (rxnset == NULL || rxnset->NumberOfReactions == 0 || rxnset->Reactions == NULL || rxnset->Reactions[0].Name == NULL) {
    ReadInASCIISetOfReactions(bind);
    rxnset = GetBoundStructure(bind, BIND_CURRENT_REACTIONS);
    molset = GetBoundStructure(bind, BIND_CURRENT_MOLECULES);
  }

  if (rxnset == NULL || rxnset->NumberOfReactions == 0) {
    fprintf(out, "No reactions currently loaded to check.\n");
    if (out != stdout) fclose(out);
    return SYSTEM_NORMAL_RETURN;
  }


  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo, REACTION_DATABASE);

  if (FindClassification(REACTION_DATABASE, DATABASE_CLASSIFICATIONS, bind) == NULL) {
    InitializeMoleculeClassifications(bind);
  }

  corrset = DetermineRxnPatternDatabaseCorrespondence(rxnset, REACTION_DATABASE, bind);

  fprintf(out, "%-35s %-35s %-35s\n", "Reaction_Name", "Molecule_Status", "Reaction_Match_Status");
  fprintf(out, "----------------------------------- ----------------------------------- -----------------------------------\n");

  key = AllocateDbaseKeyword;
  rxn = rxnset->Reactions;
  id = (corrset != NULL && corrset->Points != NULL) ? corrset->Points : NULL;

  LOOPi(rxnset->NumberOfReactions) {
    missing_count = 0;
    CHAR missing_mols_buf[512] = "";

    if (molset != NULL && molset->Molecules != NULL) {
      if (rxn->Reactants != NULL) {
        for (k = 0; k < rxn->NumberOfReactants; k++) {
          mol = FindMoleculeInSetByID(molset, rxn->Reactants[k]);
          if (mol == NULL || mol->ID < 0) {
            missing_count++;
            if (strlen(missing_mols_buf) > 0) strcat(missing_mols_buf, ", ");
            strcat(missing_mols_buf, mol && mol->Name ? mol->Name : "UNKNOWN_REACTANT");
          }
        }
      }
      if (rxn->Products != NULL) {
        for (k = 0; k < rxn->NumberOfProducts; k++) {
          mol = FindMoleculeInSetByID(molset, rxn->Products[k]);
          if (mol == NULL || mol->ID < 0) {
            missing_count++;
            if (strlen(missing_mols_buf) > 0) strcat(missing_mols_buf, ", ");
            strcat(missing_mols_buf, mol && mol->Name ? mol->Name : "UNKNOWN_PRODUCT");
          }
        }
      }
    }

    CHAR mol_status[128];
    CHAR rxn_status[128];

    if (missing_count > 0) {
      snprintf(mol_status, sizeof(mol_status), "MISSING (%s)", missing_mols_buf);
      strcpy(rxn_status, "NOT_CHECKED");
    } else {
      strcpy(mol_status, "ALL_MOLECULES_IN_DB");

      INT match_id = (id != NULL) ? *id : -1;
      ret = SYSTEM_ERROR_RETURN;

      if (match_id != 0 && match_id != -1) {
        memset(&dbrxn, 0, sizeof(ReactionInfo));
        ProduceRxnIDKey(match_id, key);
        if (key->Name == NULL && rxn->Name != NULL)
          key->Name = CopyString(rxn->Name);
        ret = SearchKeyElement(DB_ID_SEARCH, &dbrxn, key, dinfo);
        FreeDbaseKeyword(key);
      }

      if (ret != SYSTEM_NORMAL_RETURN && match_id != 0 && match_id != -1) {
        memset(&dbrxn, 0, sizeof(ReactionInfo));
        ProduceRxnNameKey(rxn->Name, key);
        if (key->Name == NULL && rxn->Name != NULL)
          key->Name = CopyString(rxn->Name);
        ret = SearchKeyElement(DB_NAME_SEARCH, &dbrxn, key, dinfo);
        FreeDbaseKeyword(key);
      }

      if (ret == SYSTEM_NORMAL_RETURN && dbrxn.Name != NULL) {
        snprintf(rxn_status, sizeof(rxn_status), "%s", dbrxn.Name);
      } else if (match_id != 0 && match_id != -1) {
        snprintf(rxn_status, sizeof(rxn_status), "%s (ID %d)", rxn->Name ? rxn->Name : "EXISTS", match_id);
      } else {
        strcpy(rxn_status, "NEW_REACTION");
      }
    }

    fprintf(out, "%-35.35s %-35.35s %-35.35s\n",
            rxn->Name ? rxn->Name : "NULL", mol_status, rxn_status);

    if (id != NULL) id++;
    rxn++;
  }

  if (corrset != NULL) {
    FreeDataSubSet(corrset);
    Free(corrset);
  }
  Free(key);
  fprintf(out, "================================================================================\n");

  if (out != stdout) fclose(out);
  return SYSTEM_NORMAL_RETURN;
}

/*F ret = StoreRxnPatterns(bind)
**
**  DESCRIPTION
**    Reads reaction pattern file and stores patterns into PATTERN_DATABASE.
*/
extern INT StoreRxnPatterns(BindStructure *bind) {
  ReactionSet *rxnpatset;
  INT ret;

  ReadInRxnPatternsMolsFromDB(bind);
  rxnpatset = GetBoundStructure(bind, BIND_CURRENT_PATTERNS);
  if (rxnpatset == NULL || rxnpatset->NumberOfReactions == 0 || rxnpatset->Reactions == NULL || rxnpatset->Reactions[0].Name == NULL) {
    ReadInASCIISetOfRxnPatterns(bind);
    rxnpatset = GetBoundStructure(bind, BIND_CURRENT_PATTERNS);
  }
  if (rxnpatset == NULL || rxnpatset->NumberOfReactions == 0) return SYSTEM_ERROR_RETURN;

  ret = StoreReactionSetToDatabase(rxnpatset, PATTERN_DATABASE, bind);
  return ret;
}

/*F ret = StoreReactions(bind)
**
**  DESCRIPTION
**    Reads reaction file and stores reactions into REACTION_DATABASE.
*/
extern INT StoreReactions(BindStructure *bind) {
  ReactionSet *rxnset;
  INT ret;

  ReadInReactionsFromList(bind);
  rxnset = GetBoundStructure(bind, BIND_CURRENT_REACTIONS);
  if (rxnset == NULL || rxnset->NumberOfReactions == 0 || rxnset->Reactions == NULL || rxnset->Reactions[0].Name == NULL) {
    ReadInASCIISetOfReactions(bind);
    rxnset = GetBoundStructure(bind, BIND_CURRENT_REACTIONS);
  }
  if (rxnset == NULL || rxnset->NumberOfReactions == 0) return SYSTEM_ERROR_RETURN;

  ret = StoreReactionSetToDatabase(rxnset, REACTION_DATABASE, bind);
  return ret;
}

/*F ret = FormatCheckASCIIReactions(bind)
**
**  DESCRIPTION
**    Verifies format for ASCII Reactions file using ReadInASCIIReactions.
**    NO database access is used.
**    Prints report containing ASCIIReactionSet structure with molecule names.
*/
extern INT FormatCheckASCIIReactions(BindStructure *bind) {
  CommandMaster *commandmaster;
  FILE *file, *out;
  ASCIIReactionSet *asciirxnset;
  INT max;

  commandmaster = GetBoundStructure(bind, BIND_COMMANDMASTER);
  out = OpenWriteFileFromCurrent("RxnOutDir", "RxnOutName", "Format.out", IGNORE,
                                 "ASCII Reactions Format Check Report", commandmaster);
  if (out == NULL) out = stdout;

  fprintf(out, "================================================================================\n");
  fprintf(out, "ASCII Reactions Format Check Report\n");
  fprintf(out, "================================================================================\n");

  file = OpenReadFileFromCurrent("RxnDirectory", "RootRxnName", RXN_FILE_LIST_SUFFIX,
                                 IGNORE, "ASCII Reactions", commandmaster);
  max = GetCurrentIntegerArgument("ASCIIReactionMaxNum", commandmaster);

  if (file == NULL) {
    fprintf(out, "ERROR: Could not open ASCII reactions file.\n");
    if (out != stdout) fclose(out);
    return SYSTEM_ERROR_RETURN;
  }

  asciirxnset = ReadInASCIIReactions(file, max);
  fclose(file);

  if (asciirxnset == NULL || asciirxnset->NumberOfReactions == 0) {
    fprintf(out, "ERROR: Failed to parse ASCII reactions or no reactions found in file.\n");
    if (out != stdout) fclose(out);
    return SYSTEM_ERROR_RETURN;
  }

  BindStructureIntoMaster((VOID *)asciirxnset, BIND_ASCII_REACTIONS, bind);

  fprintf(out, "SUCCESS: Parsed %d ASCII reactions successfully.\n\n", asciirxnset->NumberOfReactions);
  PrintPrettyASCIIReactionSet(out, asciirxnset);

  if (out != stdout) fclose(out);
  return SYSTEM_NORMAL_RETURN;
}

/*F ret = FormatCheckASCIIRxnPatterns(bind)
**
**  DESCRIPTION
**    Verifies format for ASCII Reaction Patterns file using ReadInASCIIReactions.
**    NO database access is used.
**    Prints report containing ASCIIReactionSet structure with molecule names.
*/
extern INT FormatCheckASCIIRxnPatterns(BindStructure *bind) {
  CommandMaster *commandmaster;
  FILE *file, *out;
  ASCIIReactionSet *asciirxnset;
  INT max;

  commandmaster = GetBoundStructure(bind, BIND_COMMANDMASTER);
  out = OpenWriteFileFromCurrent("RxnOutDir", "RxnOutName", "Format.out", IGNORE,
                                 "ASCII RxnPatterns Format Check Report", commandmaster);
  if (out == NULL) out = stdout;

  fprintf(out, "================================================================================\n");
  fprintf(out, "ASCII Reaction Patterns Format Check Report\n");
  fprintf(out, "================================================================================\n");

  file = OpenReadFileFromCurrent("RxnDirectory", "RootRxnName", RXN_FILE_LIST_SUFFIX,
                                 IGNORE, "ASCII Reaction Patterns", commandmaster);
  max = GetCurrentIntegerArgument("ASCIIReactionMaxNum", commandmaster);

  if (file == NULL) {
    fprintf(out, "ERROR: Could not open ASCII reaction patterns file.\n");
    if (out != stdout) fclose(out);
    return SYSTEM_ERROR_RETURN;
  }

  asciirxnset = ReadInASCIIReactions(file, max);
  fclose(file);

  if (asciirxnset == NULL || asciirxnset->NumberOfReactions == 0) {
    fprintf(out, "ERROR: Failed to parse ASCII reaction patterns or no patterns found in file.\n");
    if (out != stdout) fclose(out);
    return SYSTEM_ERROR_RETURN;
  }

  BindStructureIntoMaster((VOID *)asciirxnset, BIND_ASCII_PATTERNS, bind);

  fprintf(out, "SUCCESS: Parsed %d ASCII reaction patterns successfully.\n\n", asciirxnset->NumberOfReactions);
  PrintPrettyASCIIReactionSet(out, asciirxnset);

  if (out != stdout) fclose(out);
  return SYSTEM_NORMAL_RETURN;
}

extern INT FormatCheckReactions(BindStructure *bind) {
  return FormatCheckASCIIReactions(bind);
}

extern INT FormatCheckRxnPatterns(BindStructure *bind) {
  return FormatCheckASCIIRxnPatterns(bind);
}


