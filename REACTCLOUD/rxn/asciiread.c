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
#include "basic.h"
#include "comlib.h"
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
extern ReadInMoleculeSet *DetermineSetOfASCIIMolecules(ASCIIReactionSet *rxnset)
     {
     ReadInMoleculeSet *molset,*set1;
     ASCIIReaction *rxn;
     INT i;
     
     molset = AllocateReadInMoleculeSet;
     CreateReadInMoleculeSet(molset,rxnset->ID,rxnset->Name,
			     0,0);
     
     rxn = rxnset->Reactions;
     LOOPi(rxnset->NumberOfReactions)
	  {
	  set1 = MergeReadInMoleculeSet(molset,rxn->Reactants);
	  FreeReadInMoleculeSet(molset);
	  Free(molset);
	  molset = MergeReadInMoleculeSet(set1,rxn->Products);
	  FreeReadInMoleculeSet(set1);
	  Free(set1);
	  rxn++;
	  }
     return(molset);
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
					     MoleculeSet *molset)
     {
     ReactionSet *rxnset;
     ReactionInfo *rxn;
     ASCIIReaction *ascii;
     INT i;
     
     rxnset = AllocateReactionSet;
     CreateReactionSet(rxnset,asciirxnset->ID,asciirxnset->Name,
		       asciirxnset->NumberOfReactions,0,0);
     rxnset->PropertyTypes = InitializeReactionPropertyTypes(asciirxnset->ID,
							     asciirxnset->Name);
     
     rxn = rxnset->Reactions;
     ascii =  asciirxnset->Reactions;
     LOOPi(asciirxnset->NumberOfReactions)
	  {
	  CreateReactionInfo(rxn,i,ascii->Name,
			     ascii->Reactants->NumberOfMolecules,
			     ascii->Products->NumberOfMolecules,
			     0,0,0,0,0,0);
	  FillInMolecules(rxn->Reactants,ascii->Reactants,molset);
	  FillInMolecules(rxn->Products,ascii->Products,molset);
	  rxn->Properties = InitializeSetOfPropertyValues(rxnset->PropertyTypes);
	  rxn++;
	  ascii++;
	  }
     return(rxnset);
     }
 
/*f FillInMolecules(molecules,asciimolset,molset)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void FillInMolecules(INT *molecules, 
			    ReadInMoleculeSet *asciimolset,
			    MoleculeSet *molset)
     {
     ReadInMolecule *ascii;
     INT i;

     ascii = asciimolset->Molecules;
     LOOPi(asciimolset->NumberOfMolecules)
	  {
	  *molecules = FindASCIIInMolSet(ascii,molset);
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
extern INT FindASCIIInMolSet(ReadInMolecule *asciimol, 
			     MoleculeSet *molset)
     {
     INT done,count;
     MoleculeInfo *mol;
     
     done = -1;
     count = 0;
     mol = molset->Molecules;
     while(done == -1 && count < molset->NumberOfMolecules)
	  {
	  if(!strcmp(mol->Name,asciimol->Name))
	     done = mol->ID;
	  count++;
	  mol++;
	  }
     return(done);
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
extern ASCIIReactionSet *ReadInASCIIReactions(FILE *file, INT max)
     {
     CHAR *string,*word,*line,*name,*rest;
     ASCIIReactionSet *rxnset;
     ASCIIReaction *rxn;
     INT id;
     printf("     ReadInASCIIReactions(FILE *file, INT max)");
     string = AllocateString(LINELENGTH);
     word = AllocateString(LINELENGTH);
     
     line = NextNonBlankLine(file,string);
     name = IsolateNextWord(line,word,BLANK,LINELENGTH);
     id = atoi(word);

     EliminateBlanks(name);
     
     rxnset = AllocateASCIIReactionSet;
     CreateASCIIReactionSet(rxnset,id,name,
			    max,0);
     
     
     line = NextNonBlankLine(file,string);
     rxnset->NumberOfReactions = 0;
     rxn = rxnset->Reactions;
     while(line != 0 &&  rxnset->NumberOfReactions < max)
	  {
	  rest = IsolateNextWord(line,word,BLANK,LINELENGTH);
	  
	  CreateASCIIReaction(rxn,rxnset->NumberOfReactions,word,
			      0,FORWARD_REVERSE,0,0);
	  
	  /*
	  rest = IsolateNextWord(rest,word,REACTION_DELIMITOR,LINELENGTH);
	  */
          rest = IsolateNextWordFromPhrase(rest,word," = ",LINELENGTH);
          printf("IsolateNextWordFromPhrase  '%s', '%s'", rest,word);
	  EliminateLeadingBlanks(rest);
	  if(*rest == FORWARD_DELIMITOR)
	       {
	       rxn->ReactionType = FORWARD_REACTION;
	       rest++;
	       }
	  

	  rxn->Reactants = ReadInMoleculesFromLine(word,'+',10);
	  rxn->Products = ReadInMoleculesFromLine(rest,'+',10);
	  
	  rxn->Properties = AllocateASCIIProperties;
	  line = FillInProperties(file,rxn->Properties,string);
	  
	  rxn++;
	  rxnset->NumberOfReactions += 1;
	  }
     Free(string);
     Free(word);
     return(rxnset);
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
					 BindStructure *bind)
     {
     ReactionInfo *rxn;
     ASCIIReaction *asciirxn;
     INT i;
     
     rxn = rxnset->Reactions;
     asciirxn = asciirxnset->Reactions;
     LOOPi(asciirxnset->NumberOfReactions)
	  {
	  FillInASCIIValue(asciirxn->Properties,
					 rxn->Properties,
					 rxnset->PropertyTypes,
					 bind);
	  
	  rxn++;
	  asciirxn++;
	  }
     }

 
extern INT AtomsInMolFileReaction(MolFileReaction *rxn)
     {
     INT total,i;
     MolFileMolecule *mol;
     
     total = 0;
     
     mol = rxn->Reactants;
     LOOPi(rxn->NumberOfReactants)
	  {
	  total += mol->NAtoms;
	  mol++;
	  }
     
     mol = rxn->Products;
     LOOPi(rxn->NumberOfProducts)
	  {
	  total += mol->NAtoms;
	  mol++;
	  }
     return(total);
     }

extern INT BondsInMolFileReaction(MolFileReaction *rxn)
     {
     INT total,i;
     MolFileMolecule *mol;
     
     total = 0;
     
     mol = rxn->Reactants;
     LOOPi(rxn->NumberOfReactants)
	  {
	  total += mol->NBonds;
	  mol++;
	  }
     
     mol = rxn->Products;
     LOOPi(rxn->NumberOfProducts)
	  {
	  total += mol->NBonds;
	  mol++;
	  }
     return(total);
     }

