/*  FILE     readchain.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**  auxmol1, auxmol2, ... (or NONE)
**  rxn11, rxn12, ...; auxmol11, aux12, ...
**  rxn21, rxn22, ...; auxmol21, aux22, ...
**  .
**  .
**  .
**
**  where: 
**     auxmol1,auxmol2, ...  -   The list of molecules present in every reaction step
**     rxn11,rxn12, ...       -  Reactions of the 1st step
**     mol11,mol12, ...       -  Auxiliary molecules of only the 1st step
**     rxn21,rxn22, ...       -  Reactions of the 2nd step
**     mol21,mol22, ...       -  Auxiliary molecules of only the 2nd step
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

/*P  . . . PROTOTYPES . . . . . . . . . . . . . . . . . . . . . . . .  static
*/
static SetOfGraphs *GetSetOfAuxiliaryMolecules(CHAR *mols,
					       MoleculeSet *set,
					       INT molflag);
static TransformSet *GetSetOfStepReactions(CHAR *rxns,
					   ReactionSet *set,
					   INT rxnflag,
					   BindStructure *bind);
static void FillInReactionStep(CHAR *line, ReadChainReactionStep *step);
extern void DetermineSetOfMolecules(ReadChainSet *set);
extern void DetermineSetOfReactions(ReadChainSet *set);
static INT ReactionNotInSet(ReadInReactionSet *rxnset, ReadInReaction *addrxn);
static void MergeToTotalReadInReactionSets(ReadInReactionSet *total, 
					   ReadInReactionSet *toadd);

/*V  . . . Defines  . . . . . . . . . . . . . . . . . . . . . . . . . . . .  
*/


#define MAX_NUMBER_OF_STEPS     400
#define MAX_NUMBER_OF_MOLECULES 400
#define MAX_NUMBER_OF_REACTIONS 400

 
/*F sequence = ReadInChainSequenceList(dir,name,suffix,molflag,rxnflag,bind)
**
**  DESCRIPTION
**    dir: The directory name of the specification
**    name: The root name of the specification
**    suffix: The suffix of the specification
**    molflag:
**    rxnflag:
**    bind: The bind structure (for molecule and reaction data)
**
**    - Get Current molecules and reactions
**    - Open up chain specification file
**    - Create the ChainSequence structure
**    - Read and convert the Auxillary Molecules line
**    - Loop over the remaining sequence lines
**      - Create the ChainSequence Element
**      - Convert and insert the set of reactions
**      - Convert and insert the auxillary step molecules
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
extern ChainSequence *ReadInChainSequenceList(CHAR *dir,
					   CHAR *name,
					   CHAR *suffix,
					   INT molflag,
					   INT rxnflag,
					   BindStructure *bind)
     {
     CommandMaster *commandmaster;
     MoleculeSet *molset;
     ReactionSet *rxnset;
     CHAR *line,*rxns,*mols,*string;
     FILE *file;
     ChainSequence *set;
     ChainSequenceElement *step;
     
     printf("ReadInChainSequenceList\n");
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     file = OpenReadFileFromCurrent(dir,name,suffix,IGNORE,
				    "Chain Sequence List",
				    commandmaster);

     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     rxnset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);

     string = AllocateString(40*LINELENGTH);
     rxns = AllocateString(40*LINELENGTH);
     
     if(file != 0)
	  {
	  set = AllocateChainSequence;
	  CreateChainSequence(set,0,name,
			      MAX_NUMBER_OF_STEPS,
			      0,0);
	  
	  line = NextNonBlankLine(file,string);
	  set->Molecules = GetSetOfAuxiliaryMolecules(line,molset,molflag);

	  NextNonBlankLine(file,line);
	  step = set->Steps;
	  set->NumberOfSteps = 0;
	  printf("ReadInChainSequenceList -> Read in Lines\n");
	  while(line != 0)
	       {
		 printf("ReadInChainSequenceList -> Read in Lines\n---------------------------------------------------\n%s\n---------------------------------------------------\n",line);
	       CreateChainSequenceElement(step,set->NumberOfSteps,name,
					  0,0);
	       mols = IsolateNextWord(line,rxns,';',LINELENGTH);
	       step->Reactions = GetSetOfStepReactions(rxns,rxnset,
						       rxnflag,bind);
	       step->Molecules = GetSetOfAuxiliaryMolecules(mols,molset,molflag);
	       line = NextNonBlankLine(file,string);
	       step++;
	       set->NumberOfSteps += 1;
	       }
	  fclose(file);
	  }
     Free(string);
     Free(rxns);
     
     return(set);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static SetOfGraphs *GetSetOfAuxiliaryMolecules(CHAR *mols,
					       MoleculeSet *set,
					       INT molflag)
     {
     SetOfGraphs *setofgraphs;
     Graph *graph;
     CHAR *mol,*rest,*string;
     MoleculeInfo *molecule;
     
     setofgraphs = AllocateSetOfGraphs;
     CreateSetOfGraphs(setofgraphs,set->ID,set->Name,
		       MAX_NUMBER_OF_MOLECULES,0);
     setofgraphs->NumberOfGraphs = 0;
     if(!strncmp(mols,"NONE",4))
	  return(setofgraphs);
     
     mol = AllocateString(2*LINELENGTH);
     string = AllocateString(2*LINELENGTH);

     graph = setofgraphs->Graphs;     
     rest = mols;
     while(rest != 0 && strlen(rest) > 0)
	  {     
	  rest = IsolateNextWord(rest,mol,',',2*LINELENGTH);
	    printf("GetSetOfAuxiliaryMolecules: %s\n",mol);
	  molecule = FindMoleculeFromString(mol,set);
	  if(molecule == 0)
	       {
	       sprintf(string,"Molecule <%s> not found",mol);
	       Error(RECOVER,string);
	       Free(string);
	       }
	  else
	       {
	       GraphFromMolFileForArrays(graph,molecule,
					 VALENCE_STANDARD);
	       printf("GetSetOfAuxiliaryMolecules (Molecule found)->>> %s\n",graph->Name);
	       setofgraphs->NumberOfGraphs += 1;
	       graph++;
	       }
	  }
     return(setofgraphs);
     }
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static TransformSet *GetSetOfStepReactions(CHAR *rxns,
			     ReactionSet *set,
			     INT rxnflag,
			     BindStructure *bind)
     {
     TransformSet *transformset;
     GraphTransform *transform;
     CHAR *mol,*string,*rest,*rxn;
     ReactionInfo *reaction;
     
     transformset = AllocateTransformSet;
     CreateTransformSet(transformset,set->ID,set->Name,
			MAX_NUMBER_OF_REACTIONS,0);
     transformset->NumberOfTransforms  = 0;     

     mol = AllocateString(40*LINELENGTH);
     string = AllocateString(40*LINELENGTH);
     rxn = AllocateString(40*LINELENGTH);
     
     transform = transformset->Set;
     rest = rxns;
     while(rest != 0 && strlen(rest) > 0)
	  {     
	  rest = IsolateNextWord(rest,rxn,',',LINELENGTH);
	  reaction = FindReactionFromString(rxn,set);
	  if(reaction == 0)
	       {
	       sprintf(string,"Reaction <%s> not found",rxn);
	       Error(RECOVER,string);
	       Free(string);
	       }
	  else
	       {
	       ConvertReactionToGraphTransform(transform,
					       reaction,
					       bind);
	       transform++;
	       transformset->NumberOfTransforms += 1;
	       }
	  }
     Free(mol);
     Free(string);
     Free(rxn);
     
     return(transformset);
     }
 
/*S ReadInChainDefinition
*/
 
/*F def = ReadInChainDefinition(bind)
**
**  DESCRIPTION
**    This reads in the chain sequence definition into a
**    ReadChainSet structure (i.e. the molecules and 
**    reactions id's are left as strings).  The definition
**    if found in the file:
**    - directory: TransformDir
**    - rootname: TransformRxn
**    - suffix: TRANSFORM_LIST_SUFFIX
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
/* Helper to read non-blank, non-comment lines while handling '\\' continuation and tracking line numbers */
static char *NextChainLineWithLineNumber(FILE *in, char *line, int maxlen, int *currentLine, int *startLine) {
  char raw[LINELENGTH];
  int is_first = 1;
  int pos = 0;

  line[0] = '\0';

  while (fgets(raw, sizeof(raw), in) != NULL) {
    (*currentLine)++;

    /* Remove trailing \r and \n */
    size_t len = strlen(raw);
    while (len > 0 && (raw[len - 1] == '\n' || raw[len - 1] == '\r')) {
      raw[--len] = '\0';
    }

    char *lead = EliminateLeadingBlanks(raw);

    /* If this is the start of a logical line and it's a comment or empty, skip */
    if (is_first) {
      if (*lead == '\0' || !strncmp(lead, "%%", 2)) {
        continue;
      }
      *startLine = *currentLine;
      is_first = 0;
    } else {
      /* If continuing from previous line with '\', skip pure comment lines */
      if (!strncmp(lead, "%%", 2)) {
        continue;
      }
    }

    /* Check if this raw line ends with a continuation character '\' */
    len = strlen(lead);
    int has_cont = (len > 0 && lead[len - 1] == '\\');
    if (has_cont) {
      lead[--len] = '\0'; /* Remove trailing backslash */
    }

    /* Append to line buffer */
    if (pos + len < (size_t)maxlen - 1) {
      strcpy(line + pos, lead);
      pos += len;
    }

    /* If not continued with '\', this logical line is complete */
    if (!has_cont) {
      return line;
    }
  }

  if (!is_first && pos > 0) {
    return line;
  }
  return NULL;
}

extern ReadChainSet *ReadInChainDefinition(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     FILE *in;
     ReadChainSet *set;
     ReadChainReactionStep *step;
     CHAR *line,*word,*string,*rest,*name,*lead;
     int currentLine = 0;
     int startLine = 0;
     int format_error = 0;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     in = OpenReadFileFromCurrent("TransformDir","TransformRxn",
				  TRANSFORM_LIST_SUFFIX,
				  IGNORE,"Chain Definition",
				  commandmaster);
     if(in != 0)
	  {
	  string = AllocateString(40*LINELENGTH);
	  word = AllocateString(40*LINELENGTH);
	  
	  /* Line 1: Pathway Name */
	  line = NextChainLineWithLineNumber(in, string, 40*LINELENGTH, &currentLine, &startLine);
	  if(line == NULL) {
	       printf("ERROR: Empty chain definition file.\n");
	       fclose(in);
	       Free(string);
	       Free(word);
	       return NULL;
	  }

	  /* Extract name before ':' if present (strip descriptions like ': Hydrogen Abstraction from fuel alkane') */
	  rest = IsolateNextWord(line, word, COLON, 40*LINELENGTH);
	  EliminateBlanks(word);
	  if(strlen(word) > 0) {
	       name = CopyString(word);
	  } else {
	       EliminateBlanks(line);
	       name = CopyString(line);
	       if(strlen(name) > 0 && name[strlen(name)-1] == ':')
	            name[strlen(name)-1] = '\0';
	  }
	  
	  set = AllocateReadChainSet;
	  CreateReadChainSet(set,0,name,
			     MAX_NUMBER_OF_STEPS,
			     0,0,0,0);
	  
	  set->NumberOfSteps = 0;
	  
	  /* Line 2: ExtraMolecules (Global Auxiliary Molecules) */
	  line = NextChainLineWithLineNumber(in, string, 40*LINELENGTH, &currentLine, &startLine);
	  if(line != NULL) {
	       set->ExtraMolecules = ReadInMoleculesFromLine(line,',',MAX_NUMBER_OF_MOLECULES);
	  }
	  
	  /* Step lines */
	  line = NextChainLineWithLineNumber(in, string, 40*LINELENGTH, &currentLine, &startLine);
	  step = set->Steps;
	  while(line != 0)
	       {
	       lead = EliminateLeadingBlanks(line);

	       /* Check for syntax error: line starts with ':' without reaction patterns */
	       if(*lead == ':') {
	            printf("================================================================================\n");
	            printf("FORMAT ERROR on line %d in Chain Definition '%s':\n", startLine, name);
	            printf("  Line begins with ':' (auxiliary molecules) without preceding reaction patterns:\n");
	            printf("  '%s'\n", line);
	            printf("  Step %d has 0 reaction patterns. Missing continuation character '\\' on line %d?\n",
	                   set->NumberOfSteps + 1, startLine - 1);
	            printf("================================================================================\n");
	            format_error = 1;
	            break;
	       }

	       CreateReadChainReactionStep(step,set->NumberOfSteps,0,0,0);

	       rest = IsolateNextWord(line,word,COLON,40*LINELENGTH);
	       FillInReactionStep(word,step);

	       if(step->Reactions == NULL || step->Reactions->NumberOfReactions == 0) {
	            printf("================================================================================\n");
	            printf("FORMAT ERROR on line %d in Chain Definition '%s':\n", startLine, name);
	            printf("  Step %d contains 0 reaction patterns!\n", set->NumberOfSteps + 1);
	            printf("  Line content: '%s'\n", line);
	            if(strlen(rest) > 0) {
	                 printf("  Auxiliary molecules were found ('%s'), but no reaction patterns were specified.\n", rest);
	                 printf("  Check if the preceding reaction pattern line is missing a trailing continuation character '\\'.\n");
	            }
	            printf("================================================================================\n");
	            format_error = 1;
	            break;
	       }

	       step->Molecules = ReadInMoleculesFromLine(rest,',',MAX_NUMBER_OF_MOLECULES);
	       
	       step++;
	       set->NumberOfSteps += 1;
	       line = NextChainLineWithLineNumber(in, string, 40*LINELENGTH, &currentLine, &startLine);
	       }
	  fclose(in);

	  Free(string);
	  Free(word);

	  if(format_error) {
	       FreeReadChainSet(set);
	       Free(set);
	       return NULL;
	  }

	  DetermineSetOfMolecules(set);
	  DetermineSetOfReactions(set);
	  }
     return(set);
     }

 
/*f ReadChainReactions(line)
**
**  DESCRIPTION
**    Reads in the reaction sequence into ReadChainReactionStep (i.e.
**    storing only the reaction id's)
**
**  REMARKS
**
*/
static void FillInReactionStep(CHAR *line, ReadChainReactionStep *step) {
  CHAR *word,*wordnoblanks,*rest;
  ReadInReactionSet *reactions;
  ReadInReaction *reaction;
  
  word = AllocateString(LINELENGTH);
  wordnoblanks = AllocateString(LINELENGTH);
  
  reactions = step->Reactions = AllocateReadInReactionSet;
  CreateReadInReactionSet(reactions,step->ID,step->Name,MAX_NUMBER_OF_REACTIONS,0);
  reactions->NumberOfReactions = 0;
  
  rest = line;
  reaction = reactions->Reactions;
  while(strlen(rest) != 0 && reactions->NumberOfReactions < MAX_NUMBER_OF_REACTIONS) {
    rest = IsolateNextWord(rest,word,COMMA,LINELENGTH);
    IsolateNextWord(word,wordnoblanks,BLANK,LINELENGTH);
    if(strlen(wordnoblanks) > 0) {
      CreateReadInReaction(reaction,reactions->NumberOfReactions,wordnoblanks);
      reactions->NumberOfReactions += 1;
      reaction++;
    }
  }
  Free(word);
  Free(wordnoblanks);
}
 
/*f DetermineSetOfMolecules(set)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void DetermineSetOfMolecules(ReadChainSet *set)
     {
     INT i;
     ReadChainReactionStep *step;
     ReadInMoleculeSet *total,*newtotal;

     total = MergeReadInMoleculeSet(set->Molecules,set->ExtraMolecules);
     
     step = set->Steps;
     LOOPi(set->NumberOfSteps)
	  {
	  newtotal = MergeReadInMoleculeSet(total,step->Molecules);
	  FreeReadInMoleculeSet(total);
	  Free(total);
	  total = newtotal;
	  step++;
	  }
     set->Molecules = total;
     printf("DetermineSetOfMolecules: Set of Molecules\n");
     
     LOOPi(set->Molecules->NumberOfMolecules)
       {
	 printf(" Molecule %5d %s\n",i,(set->Molecules->Molecules + i)->Name);
       }
     }

 
/*f DetermineSetOfReactions(set)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void DetermineSetOfReactions(ReadChainSet *set)
     {
     INT i;
     ReadChainReactionStep *step;
     
     set->Reactions = AllocateReadInReactionSet;
     CreateReadInReactionSet(set->Reactions,set->ID,set->Name,MAX_NUMBER_OF_REACTIONS,0);
     set->Reactions->NumberOfReactions = 0;
     
     step = set->Steps;
     LOOPi(set->NumberOfSteps)
	  {
	  MergeToTotalReadInReactionSets(set->Reactions,step->Reactions);
	  step++;
	  }
     }

 
/*f MergeToTotalReadInReactionSets(total,toadd)
**
**  DESCRIPTION
**    
**  REMARKS
**  It is assumed that the total has enough space for those to add
**
*/
static void MergeToTotalReadInReactionSets(ReadInReactionSet *total, 
					   ReadInReactionSet *toadd)
     {
     INT i;
     ReadInReaction *rxn;
     
     rxn = toadd->Reactions;
     LOOPi(toadd->NumberOfReactions)
	  {
	  if(ReactionNotInSet(total,rxn))
	       {
	       CreateReadInReaction(total->Reactions + total->NumberOfReactions,
				    total->NumberOfReactions,
				    rxn->Name);
	       total->NumberOfReactions += 1;
	       }
	  rxn++;
	  }
     }
 
/*f notinset = ReactionNotInSet(rxnset,rxn)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT ReactionNotInSet(ReadInReactionSet *rxnset, ReadInReaction *addrxn)
     {
     INT notinset,count;
     ReadInReaction *rxn;
     
     notinset = 1;
     count = 0;
     rxn = rxnset->Reactions;
     while(notinset == 1 && count < rxnset->NumberOfReactions)
	  {
	  if(!strcmp(rxn->Name,addrxn->Name))
	       notinset = 0;
	  count++;
	  rxn++;
	  }
     return(notinset);
     }

