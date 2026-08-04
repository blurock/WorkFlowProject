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
static void DetermineSetOfMolecules(ReadChainSet *set);
static void DetermineSetOfReactions(ReadChainSet *set);
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
extern ReadChainSet *ReadInChainDefinition(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     FILE *in;
     ReadChainSet *set;
     ReadChainReactionStep *step;
     CHAR *line,*word,*string,*rest,*name;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     in = OpenReadFileFromCurrent("TransformDir","TransformRxn",
				  TRANSFORM_LIST_SUFFIX,
				  IGNORE,"Chain Definition",
				  commandmaster);
     if(in != 0)
	  {
	  string = AllocateString(40*LINELENGTH);
	  word = AllocateString(40*LINELENGTH);
	  
	  line = NextNonBlankLine(in,string);
	  EliminateBlanks(line);
	  name = CopyString(line);
	  
	  set = AllocateReadChainSet;
	  CreateReadChainSet(set,0,name,
			     MAX_NUMBER_OF_STEPS,
			     0,0,0,0);
	  
	  set->NumberOfSteps = 0;
	  
	  line = NextNonBlankLine(in,string);
	  
	  set->ExtraMolecules = ReadInMoleculesFromLine(line,',',MAX_NUMBER_OF_MOLECULES);
	  
	  line = NextNonBlankLine(in,string);
	  step = set->Steps;
	  while(line != 0)
	       {
	       CreateReadChainReactionStep(step,set->NumberOfSteps,0,0,0);

	       rest = IsolateNextWord(line,word,COLON,40*LINELENGTH);
	       FillInReactionStep(word,step);
	       printf("Molecules of Chain Step:\n%s\n",rest);
	       step->Molecules = ReadInMoleculesFromLine(rest,',',MAX_NUMBER_OF_MOLECULES);
	       
	       step++;
	       set->NumberOfSteps += 1;
	       line = NextNonBlankLine(in,string);
	       }
	  fclose(in);

	  DetermineSetOfMolecules(set);
	  DetermineSetOfReactions(set);
	  
	  Free(string);
	  Free(word);
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
    
    CreateReadInReaction(reaction,reactions->NumberOfReactions,wordnoblanks);
    reactions->NumberOfReactions += 1;
    reaction++;
  }
  Free(word);
}
 
/*f DetermineSetOfMolecules(set)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void DetermineSetOfMolecules(ReadChainSet *set)
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
static void DetermineSetOfReactions(ReadChainSet *set)
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

