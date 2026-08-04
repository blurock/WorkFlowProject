/*  FILE     rxn1.c
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
#include "rxn.h"
#include "molprops.h"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static INT ReadInRxnsFromList(ReactionSet *reactions,MoleculeSet *molecules,
			      BindStructure *bind);
static INT MasterPrintRxns(ReactionSet *reactions,
			   BindStructure *bind);
/*S InitializeReactionSet
*/ 
/*F rxnset = InitializeReactionSet(id,name)
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
extern ReactionSet *InitializeReactionSet(INT id, CHAR *name)
     {
     ReactionSet *reactions;
     
     reactions = AllocateReactionSet;
     CreateReactionSet(reactions,id,name,INTIAL_CURRENT_RXNS,0,0);

     reactions->NumberOfReactions = 0;
     reactions->PropertyTypes = InitializeReactionPropertyTypes(id,name);
     
     return(reactions);
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
extern ReactionSet *ReplaceBindReactionSet(ReactionSet *rxnset,
					   BindStructure *bind)
     {
     ReactionSet *reactions;
     
     reactions = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);

     FreeReactionSet(reactions);
     
     memcpy(reactions,rxnset,ReactionSetSize);
     Free(rxnset);
     
     return(reactions);
     }

/*S ReadInReactionsFromList
*/
/*F  ret = ReadInReactionsFromList(bind)
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
extern INT ReadInReactionsFromList(BindStructure *bind)
     {
     ReactionSet *reactions;
     MoleculeSet *molecules;
     INT ret;
     
     reactions = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     
     ret = ReadInRxnsFromList(reactions,molecules,bind);
     return(ret);
     }

/*F  ret = ReadInRxnPatternsFromList(bind)
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
extern INT ReadInRxnPatternsFromList(BindStructure *bind)
     {
     ReactionSet *reactions;
     MoleculeSet *molecules;
     INT ret;
     
     reactions = GetBoundStructure(bind,BIND_CURRENT_PATTERNS);
     molecules = GetBoundStructure(bind,BIND_CURRENT_SUBSTRUCTURES);
     
     ret = ReadInRxnsFromList(reactions,molecules,bind);
     return(ret);
     }

/*f ret = ReadInRxnsFromList(reactions,molecules,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT ReadInRxnsFromList(ReactionSet *reactions,MoleculeSet *molecules,
			  BindStructure *bind)
     {
     CHAR *line,*string,*dir;
     FILE *file,*file1;
     MolFileReaction *rxnmolf;
     SetOfMolFileMetaAtoms *meta;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     dir = GetCurrentStringArgument("RxnDirectory",commandmaster);
     
     string = AllocateString(LINELENGTH);
     file = OpenReadFileFromCurrent("RxnDirectory","RootRxnName",
				    RXN_FILE_LIST_SUFFIX,
				    IGNORE,"List of Molfiles",commandmaster);
     if(file != 0)
	  {
	  meta =  GetMetaAtomMaster(bind);
	  line = NextNonBlankLine(file,string);
	  rxnmolf = AllocateMolFileReaction;
	  while(line != 0)
	       {
	       EliminateLeadingBlanks(line);

/*
	       FreeReactionSet(reactions);
	       FreeMoleculeSet(molecules);
	       Free(reactions);
	       Free(molecules);
	       PrintAllocSummary();
	       reactions = InitializeReactionSet(0,0);
	       molecules = InitializeMoleculeSet(0,0);
	       DEBUGPRINT  =  0;
*/
	       file1 = MasterOpenReadFile(dir,line,RXN_FILE_SUFFIX,
					  IGNORE,"MolFile for Reaction",
					  commandmaster);
	       if(file1 != 0)
		    {
		    ReadRXNMolFile(file1,rxnmolf,meta);
		    StoreReactionMolFileInfo(rxnmolf,reactions,molecules,1,bind);
		    fclose(file1);
		    }
	       FreeMolFileReaction(rxnmolf);
/*
	       FreeReactionSet(reactions);
	       FreeMoleculeSet(molecules);
	       Free(reactions);
	       Free(molecules);
	       DEBUGPRINT  =  0;
	       PrintAllocSummary();
	       
	       reactions = InitializeReactionSet(0,0);
	       molecules = InitializeMoleculeSet(0,0);
*/
	       line = NextNonBlankLine(file,string);
	       }
	  }
     Free(string);
     Free(dir);
     return(SYSTEM_NORMAL_RETURN);
     }
/*S MasterPrintReactions
*/
 
 
/*F  ret = MasterPrintReactionSet(bind)
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
extern INT MasterPrintReactionSet(BindStructure *bind)
     {
     ReactionSet *reactions;
     INT ret;
     
     reactions = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     ret = MasterPrintRxns(reactions,bind);
     return(ret);
     }
/*F  ret = MasterPrintRxnPatterns(bind)
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
extern INT MasterPrintRxnPatterns(BindStructure *bind)
     {
     ReactionSet *reactions;
     INT ret;
     
     reactions = GetBoundStructure(bind,BIND_CURRENT_PATTERNS);
     ret = MasterPrintRxns(reactions,bind);
     return(ret);
     }
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT MasterPrintRxns(ReactionSet *reactions,
			   BindStructure *bind)
     {
     FILE *out;
     CommandMaster *commandmaster;

     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     out = OpenWriteFileFromCurrent("RxnOutDir","RxnOutName",
				    REACTION_PRINT_OUT_SUFFIX,
				    IGNORE,"Reaction Print Filename",
				    commandmaster);
     
     if(out != 0)
	  {
	  PrintPrettyReactionSet("",out,reactions);
	  fclose(out);
	  }
     
     return(SYSTEM_NORMAL_RETURN);
     }
/*S ReactionExternMisc
*/
extern INT FindReactionPattern(BindStructure *bind)
     {
     printf("Not implemented\n");
     return(SYSTEM_NORMAL_RETURN);
     }

extern INT MasterReactionOrder(BindStructure *bind)
     {
     ReactionSet *set,*oldset;
     MoleculeSet *molecules;
     
     oldset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);

     set = FormCanonicalReactionSet(oldset,molecules);
     FreeReactionSet(oldset);
     memcpy(oldset,set,ReactionSetSize);
     Free(set);
     
     return(SYSTEM_NORMAL_RETURN);
     }


extern DataSubSet *GetListOfReactions(BindStructure *bind)
     {
     INT i,*list;
     ReactionSet *reactions;
     ReactionInfo *reaction;
     DataSubSet *subset;
     
     reactions = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);

     subset = AllocateDataSubSet;
     CreateDataSubSet(subset,reactions->ID,reactions->Name,
		      reactions->NumberOfReactions,
		      reactions->NumberOfReactions,
		      0);
     
     list = subset->Points;
     reaction = reactions->Reactions;
     LOOPi(reactions->NumberOfReactions)
	  {
	  *list = reaction->ID;
	  list++;
	  reaction++;
	  }
     return(subset);
     }

extern DataSubSet *ReadInReactionList(CHAR *dir,
				      CHAR *name,
				      CHAR *suffix,
				      INT flag,
				      ReactionSet *set,
				      BindStructure *bind)
     {
     FILE *file;
     DataSubSet *subset;
     CHAR *rxnname,*string;
     INT id;
     ReactionInfo *rxn;
     CommandMaster *commandmaster;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     file = OpenReadFileFromCurrent(dir,name,suffix,IGNORE,
				    "Reaction List",
				    commandmaster);

     rxnname = AllocateString(LINELENGTH);
     string = AllocateString(LINELENGTH);
     
     if(file != 0)
	  {
	  subset = AllocateDataSubSet;
	  CreateDataSubSet(subset,set->ID,set->Name,
			   0,set->NumberOfReactions,
			   0);
	  
	  subset->NumberOfPoints = 0;
	  
	  NextNonBlankLine(file,rxnname);
	  while(*rxnname != ENDOFLINE)
	       {
	       EliminateBlanks(rxnname);
	       rxn = 0;
	       switch(flag)
		    {
	       case RXN_ID_BY_NUMBER:
		    id = ConvertStringToInteger(rxnname);
		    rxn = FindReactionInReactionSet(id,set);
		    break;
	       case RXN_ID_BY_NAME:
		    rxn = FindReactionInReactionSetByName(rxnname,set);
		    break;
		    }
	       if(rxn == 0)
		    {
		    sprintf(string,"Reaction <%s> not found",rxnname);
		    Error(RECOVER,string);
		    Free(string);
		    }
	       else
		    {
		    *(subset->NumberOfPoints + subset->Points) = rxn->ID;
		    subset->NumberOfPoints += 1;
		    }
	       NextNonBlankLine(file,rxnname);
	       }
	  }
     else
	  {
	  subset = AllocateDataSubSet;
	  CreateDataSubSet(subset,set->ID,set->Name,
			   0,0,
			   0);
	  }
     
     Free(rxnname);
     Free(string);
     
     return(subset);
     }
