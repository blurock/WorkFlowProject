/*  FILE     asciiread.c
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
#include <ctype.h>
#include "basic.h"
#include "comlib.h"
#include "property.h"
#include "graph.h"
#include "mol0.h"
#include "dbase.h"
#include "molprops.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"

#include "rxn/rxnascii.c"

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . .
 */
/*S ReadInASCIIReactions
 */
/* ASCIIMoleculesInReaction
 */

/*f molset = DetermineSetOfASCIIMolecules(rxnset)
**
**  DESCRIPTION
**    rxnset: The set of ASCII reactions
**    molset: The set of molecules used in the reactions
**
**    The product and reactant names of all the reactions
**    are merged together in one list of ReadInMolecules
**
**  REMARKS
**
*/
extern ReadInMoleculeSet *
DetermineSetOfASCIIMolecules(ASCIIReactionSet *rxnset) {
  ReadInMoleculeSet *molset, *set1;
  ASCIIReaction *rxn;
  INT i;

  molset = AllocateReadInMoleculeSet;
  CreateReadInMoleculeSet(molset, rxnset->ID, rxnset->Name, 0, 0);

  rxn = rxnset->Reactions;
  LOOPi(rxnset->NumberOfReactions) {
    set1 = MergeReadInMoleculeSet(molset, rxn->Reactants);
    FreeReadInMoleculeSet(molset);
    Free(molset);
    molset = MergeReadInMoleculeSet(set1, rxn->Products);
    FreeReadInMoleculeSet(set1);
    Free(set1);
    rxn++;
  }
  return (molset);
}

/*f rxnset = ASCIIMoleculesInReaction(asciirxnset,asciimolset,molset)
**
**  DESCRIPTION
**
**  REMARKS
**
*/
extern ReactionSet *ASCIIMoleculesInReaction(ASCIIReactionSet *asciirxnset,
                                             ReadInMoleculeSet *asciimolset,
                                             MoleculeSet *molset) {
  ReactionSet *rxnset;
  ReactionInfo *rxn;
  ASCIIReaction *ascii;
  INT i;

  rxnset = AllocateReactionSet;
  CreateReactionSet(rxnset, asciirxnset->ID, asciirxnset->Name,
                    asciirxnset->NumberOfReactions, 0, 0);
  rxnset->PropertyTypes =
      InitializeReactionPropertyTypes(asciirxnset->ID, asciirxnset->Name);

  rxn = rxnset->Reactions;
  ascii = asciirxnset->Reactions;
  LOOPi(asciirxnset->NumberOfReactions) {
    CreateReactionInfo(rxn, i, ascii->Name, ascii->Reactants->NumberOfMolecules,
                       ascii->Products->NumberOfMolecules, 0, 0, 0, 0, 0, 0);
    FillInMolecules(rxn->Reactants, ascii->Reactants, molset);
    FillInMolecules(rxn->Products, ascii->Products, molset);
    rxn->Properties = InitializeSetOfPropertyValues(rxnset->PropertyTypes);
    rxn++;
    ascii++;
  }
  return (rxnset);
}

/*f FillInMolecules(molecules,asciimolset,molset)
**
**  DESCRIPTION
**
**  REMARKS
**
*/
extern void FillInMolecules(INT *molecules, ReadInMoleculeSet *asciimolset,
                            MoleculeSet *molset) {
  ReadInMolecule *ascii;
  INT i;

  ascii = asciimolset->Molecules;
  LOOPi(asciimolset->NumberOfMolecules) {
    *molecules = FindASCIIInMolSet(ascii, molset);
    ascii++;
    molecules++;
  }
}

/*f molecule = FindASCIIMolSet(asciimol,molset)
**
**  DESCRIPTION
**    asciimol: The ASCII name of the molecule
**    molset: The set of molecules to find name
**    molecule: The molecule id matching the name
**
**    The MoleculeSet is searched for the namee of the
**    molecule given in the ReadInMolecule structure
**
**  REMARKS
**
*/
extern INT FindASCIIInMolSet(ReadInMolecule *asciimol, MoleculeSet *molset) {
  INT done, count;
  MoleculeInfo *mol;

  done = -1;
  count = 0;
  if (molset == NULL || molset->Molecules == NULL || asciimol == NULL)
    return done;
  mol = molset->Molecules;
  while (done == -1 && count < molset->NumberOfMolecules) {
    if (mol->Name != NULL && asciimol->Name != NULL &&
        !strcmp(mol->Name, asciimol->Name))
      done = mol->ID;
    count++;
    mol++;
  }
  return (done);
}

/*S ReadInASCIIRxns
 */
/*f set = ReadInASCIIReaction(file,max)
**
**  DESCRIPTION
**    file: File from which to read reaction
**    max: The maximum number of reactions in file
**    set: The reaction set
**
**    The file consists of a set of reactions.  The reaction itself
**    is on the first line with the name, the reactants and products.
**    One the following lines are the properties each begining with a
**    dash.
**
**  REMARKS
**
*/
extern ASCIIReactionSet *ReadInASCIIReactions(FILE *file, INT max) {
  CHAR *string, *word, *line, *name, *rest;
  ASCIIReactionSet *rxnset;
  ASCIIReaction *rxn;
  ASCIIProperty *aprop;
  INT id, pidx;

  printf("[ReadInASCIIReactions] Starting ReadInASCIIReactions...\n");
  string = AllocateString(LINELENGTH);
  word = AllocateString(LINELENGTH);

  line = NextNonBlankLine(file, string);
  printf("[ReadInASCIIReactions] Initial line read: '%s'\n", line ? line : "(NULL)");

  if (line != 0) {
    rest = IsolateNextWord(line, word, BLANK, LINELENGTH);
    printf("[ReadInASCIIReactions] First word: '%s', rest: '%s'\n", word, rest);

    if (strstr(line, " = ") != 0 || strstr(line, " =") != 0 || !isdigit((unsigned char)word[0])) {
      printf("[ReadInASCIIReactions] First line is a reaction, not a set header.\n");
      id = 0;
      name = "Reactions";
      rxnset = AllocateASCIIReactionSet;
      CreateASCIIReactionSet(rxnset, id, name, max, 0);
      /* Keep line intact for the while loop */
    } else {
      printf("[ReadInASCIIReactions] First line is a set header (ID=%s, Name=%s).\n", word, rest);
      id = atoi(word);
      EliminateBlanks(rest);
      name = rest;
      rxnset = AllocateASCIIReactionSet;
      CreateASCIIReactionSet(rxnset, id, name, max, 0);
      line = NextNonBlankLine(file, string);
    }
  } else {
    rxnset = AllocateASCIIReactionSet;
    CreateASCIIReactionSet(rxnset, 0, "Reactions", max, 0);
  }

  rxnset->NumberOfReactions = 0;
  rxn = rxnset->Reactions;
  while (line != 0 && rxnset->NumberOfReactions < max) {
    printf("[ReadInASCIIReactions] Loop #%d line: '%s'\n", rxnset->NumberOfReactions, line);
    rest = IsolateNextWord(line, word, BLANK, LINELENGTH);

    CreateASCIIReaction(rxn, rxnset->NumberOfReactions, word, 0,
                        FORWARD_REVERSE, 0, 0);

    rest = IsolateNextWordFromPhrase(rest, word, " = ", LINELENGTH);
    printf("[ReadInASCIIReactions] Reactants part: '%s', Products part: '%s'\n", word, rest);
    EliminateLeadingBlanks(rest);
    if (*rest == FORWARD_DELIMITOR) {
      rxn->ReactionType = FORWARD_REACTION;
      rest++;
    }

    CHAR rdelim = (strchr(word, '+') != NULL) ? '+' : ' ';
    CHAR pdelim = (strchr(rest, '+') != NULL) ? '+' : ' ';
    rxn->Reactants = ReadInMoleculesFromLine(word, rdelim, 10);
    rxn->Products = ReadInMoleculesFromLine(rest, pdelim, 10);

    rxn->Properties = AllocateASCIIProperties;
    line = FillInProperties(file, rxn->Properties, string);

    if (rxn->Properties != 0) {
      aprop = rxn->Properties->Properties;
      for (pidx = 0; pidx < rxn->Properties->NumberOfProperties; pidx++) {
        if (aprop->Name != 0 && (!strcmp(aprop->Name, "ID") || !strcmp(aprop->Name, "- ID"))) {
          if (aprop->PropertyValue != 0)
            rxn->ID = atoi(aprop->PropertyValue);
          break;
        }
        aprop++;
      }
    }

    rxn++;
    rxnset->NumberOfReactions += 1;
  }
  Free(string);
  Free(word);
  printf("[ReadInASCIIReactions] Finished reading %d reactions.\n", rxnset->NumberOfReactions);
  return (rxnset);
}

/*S ReactionPropertyValues
 */

/*f FillInPropertyValues(asciirxnset,rxnset,bind)
**
**  DESCRIPTION
**
**  REMARKS
**
*/
extern void FillInReactionPropertyValues(ASCIIReactionSet *asciirxnset,
                                         ReactionSet *rxnset,
                                         BindStructure *bind) {
  ReactionInfo *rxn;
  ASCIIReaction *asciirxn;
  INT i;

  rxn = rxnset->Reactions;
  asciirxn = asciirxnset->Reactions;
  LOOPi(asciirxnset->NumberOfReactions) {
    FillInASCIIValue(asciirxn->Properties, rxn->Properties,
                     rxnset->PropertyTypes, bind);

    rxn++;
    asciirxn++;
  }
}

extern INT AtomsInMolFileReaction(MolFileReaction *rxn) {
  INT total, i;
  MolFileMolecule *mol;

  total = 0;

  mol = rxn->Reactants;
  LOOPi(rxn->NumberOfReactants) {
    total += mol->NAtoms;
    mol++;
  }

  mol = rxn->Products;
  LOOPi(rxn->NumberOfProducts) {
    total += mol->NAtoms;
    mol++;
  }
  return (total);
}

extern INT BondsInMolFileReaction(MolFileReaction *rxn) {
  INT total, i;
  MolFileMolecule *mol;

  total = 0;

  mol = rxn->Reactants;
  LOOPi(rxn->NumberOfReactants) {
    total += mol->NBonds;
    mol++;
  }

  mol = rxn->Products;
  LOOPi(rxn->NumberOfProducts) {
    total += mol->NBonds;
    mol++;
  }
  return (total);
}

/*f PrintPrettyASCIIReactionSet(out, rxnset)
**
**  DESCRIPTION
**    Prints the ASCIIReactionSet structure.
**    For reactants and products, prints only the molecule names.
*/
extern void PrintPrettyASCIIReactionSet(FILE *out, ASCIIReactionSet *rxnset) {
  INT i, j;
  ASCIIReaction *rxn;
  ReadInMolecule *mol;
  ASCIIProperty *prop;

  if (out == NULL) out = stdout;

  if (rxnset == NULL) {
    fprintf(out, "ASCIIReactionSet is NULL\n");
    return;
  }

  fprintf(out, "================================================================================\n");
  fprintf(out, "ASCII Reaction Set: %s (ID: %d, Reactions: %d)\n",
          rxnset->Name ? rxnset->Name : "(NULL)", rxnset->ID, rxnset->NumberOfReactions);
  fprintf(out, "================================================================================\n");

  rxn = rxnset->Reactions;
  for (i = 0; i < rxnset->NumberOfReactions; i++) {
    fprintf(out, "Reaction #%d: %s\n", i + 1, rxn->Name ? rxn->Name : "UNNAMED");

    fprintf(out, "  Reactants: ");
    if (rxn->Reactants != NULL && rxn->Reactants->Molecules != NULL && rxn->Reactants->NumberOfMolecules > 0) {
      mol = rxn->Reactants->Molecules;
      for (j = 0; j < rxn->Reactants->NumberOfMolecules; j++) {
        fprintf(out, "%s%s", mol->Name ? mol->Name : "(NULL)",
                (j < rxn->Reactants->NumberOfMolecules - 1) ? " + " : "");
        mol++;
      }
    } else {
      fprintf(out, "(None)");
    }
    fprintf(out, "\n");

    fprintf(out, "  Products:  ");
    if (rxn->Products != NULL && rxn->Products->Molecules != NULL && rxn->Products->NumberOfMolecules > 0) {
      mol = rxn->Products->Molecules;
      for (j = 0; j < rxn->Products->NumberOfMolecules; j++) {
        fprintf(out, "%s%s", mol->Name ? mol->Name : "(NULL)",
                (j < rxn->Products->NumberOfMolecules - 1) ? " + " : "");
        mol++;
      }
    } else {
      fprintf(out, "(None)");
    }
    fprintf(out, "\n");

    if (rxn->Properties != NULL && rxn->Properties->Properties != NULL && rxn->Properties->NumberOfProperties > 0) {
      fprintf(out, "  Properties:\n");
      prop = rxn->Properties->Properties;
      for (j = 0; j < rxn->Properties->NumberOfProperties; j++) {
        fprintf(out, "    %-25s : %s\n",
                prop->Name ? prop->Name : "UNNAMED",
                prop->PropertyValue ? prop->PropertyValue : "");
        prop++;
      }
    }
    fprintf(out, "--------------------------------------------------------------------------------\n");
    rxn++;
  }
}

