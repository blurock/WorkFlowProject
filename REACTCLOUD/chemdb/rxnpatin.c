/*  FILE     moldb.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    These routines are the bind and work routines for reading in and storing a set
**    of molecules and for printing molecules from a database
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


static void ReactionMolfileUsingDB(int id,
			      char *line, 
			      DataBaseInformation *dinfo,
			      MolFileReaction *rxn);
static INT ReadInRxnsMolsFromDB(DataBaseInformation *dinfo,
				ReactionSet *reactions,
				MoleculeSet *molecules,
				BindStructure *bind);
static int ReadMolCorrespondences(FILE *file,
				  MolFileMolecule *mol);
static int ReadCorrespondences(FILE *file, 
			       MolFileReaction *rxnmolf);
static int ReadRxnID(FILE *file, 
		     MolFileReaction *rxnmolf);

/*F ret = ReadInRxnPatternsMolsFromDB(bind)
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
extern INT ReadInRxnPatternsMolsFromDB(BindStructure *bind)
     {
     ChemDBMaster *master;
     DataBaseInformation *dinfo;
     ReactionSet *reactions;
     MoleculeSet *molecules;
     INT ret;
     
     master = GetBoundStructure(bind,BIND_CHEMDBASE);
     dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,SUBSTRUCTURE_DATABASE);
     reactions = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
     molecules = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);

     ret = ReadInRxnsMolsFromDB(dinfo,reactions,molecules,bind);
     return(ret);
     }

/*f ret = ReadInRxnsFromListAndDB(dinfo,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT ReadInRxnsMolsFromDB(DataBaseInformation *dinfo,
				ReactionSet *reactions,
				MoleculeSet *molecules,
				BindStructure *bind)
     {
     CHAR *line,*string,*dir;
     FILE *file,*file1;
     MolFileReaction *rxnmolf;
     SetOfMolFileMetaAtoms *meta;
     CommandMaster *commandmaster;
     int count;
     count = 0;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     dir = GetCurrentStringArgument("RxnDirectory",commandmaster);
     
     string = AllocateString(LINELENGTH);
     file = OpenReadFileFromCurrent("RxnDirectory","RootRxnName",
				    RXN_FILE_LIST_SUFFIX,
				    IGNORE,"List of Molfiles",commandmaster);
     meta =  GetMetaAtomMaster(bind);
     rxnmolf = AllocateMolFileReaction;
     if(file != 0)
	  {
	    line = NextNonBlankLine(file,string);
	    while(line != 0)
	      {
		EliminateLeadingBlanks(line);
		ReactionMolfileUsingDB(count,line,dinfo,rxnmolf);
		ReadRxnID(file,rxnmolf);
		ReadCorrespondences(file,rxnmolf);

		rxnmolf->Properties = AllocateASCIIProperties;
		ReadInPropertyInfoSDF(file,line,rxnmolf->Properties);
		rxnmolf->Properties->ID = rxnmolf->ID;
		rxnmolf->Properties->Name = CopyString(rxnmolf->Name);

		StoreReactionMolFileInfo(rxnmolf,reactions,molecules,1,bind);
		FreeMolFileReaction(rxnmolf);
		line = NextNonBlankLine(file,string);		
	      }
	  }
     Free(string);
     Free(dir);
     return(SYSTEM_NORMAL_RETURN);
     }
 
/*f ReadCorrespondences(file,rxnmolf)
**
**  DESCRIPTION
**    file: The input stream
**    rxnmolf: The MolFile Reaction
**
**  REMARKS
**
*/
static int ReadCorrespondences(FILE *file, 
			       MolFileReaction *rxnmolf)
{
  char *line,*string;
  int i,err;
  MolFileMolecule *mol;

  string = AllocateString(LINELENGTH);
  
  err = 0;
  
  line = NextNonBlankLine(file,string);
  if(line != 0)
    {
  
      if(!strncmp("- Correspondences",line,17))
	{
	  
	  mol = rxnmolf->Reactants;
	  for(i=0;
	      i<rxnmolf->NumberOfReactants && err == 0;i++)
	    {
	       err = ReadMolCorrespondences(file,mol);
		PrintPrettyMolFile("Reactant Molfile: ",stdout,mol);
	       mol++;
	     }
	  mol = rxnmolf->Products;
	  for(i=0;
	      i<rxnmolf->NumberOfProducts && err == 0;i++)
	    {
	      err = ReadMolCorrespondences(file,mol);
		PrintPrettyMolFile("Product Molfile: ",stdout,mol);
	      mol++;
	    }
	}
      else
	{
	  printf("Expecting: '- Correspondences' got '%s'\n",
		 line);
	  err = 1;
	}
    }
  Free(string);
  
  return err;
}
/*f ReadRxnID(file,rxnmolf)
**
**  DESCRIPTION
**    file: The input stream
**    rxnmolf: The MolFile Reaction
**
**  REMARKS
**
*/
static int ReadRxnID(FILE *file, 
		     MolFileReaction *rxnmolf)
{
  char *line,*string,*word,*next;
  int i,err;

  string = AllocateString(LINELENGTH);
  word = AllocateString(LINELENGTH);
  
  err = 0;
  
  line = NextNonBlankLine(file,string);
  if(line != 0)
    {
      EliminateLeadingBlanks(line);
      if(!strncmp("- ID",line,4))
	{
	  next = IsolateNextWord(line+4,word,' ',LINELENGTH);
	  rxnmolf->ID = ConvertStringToInteger(word);
	}
      else
	{
	  printf("Expected '- ID', got '%s'\n",line);
	  err = 1;
	}
    }
  else
    {
      err = 1;
    }
  if(err == 1)
    printf("Error in reading reaction ID\n");
  
  Free(word);
  Free(string);
  return err;
}

/*f ReadMolCorrespondences(file,mol)
**
**  DESCRIPTION
**    file: The file stream
**    mol: The Molfile 
**
**  REMARKS
**
*/
static int ReadMolCorrespondences(FILE *file,
				  MolFileMolecule *mol)
{
  char *line,*word,*next,*string;
  int i,err,*corrs;
  MolFileAtom *atm;
  MolFileBond *bnd;
  string = AllocateString(LINELENGTH);
  
  err = 0;
  word = AllocateString(LINELENGTH);
  
  line = NextNonBlankLine(file,string);
  next = line;
  if(line != 0)
    {
      atm = mol->Atoms;
      for(i=0;i<mol->NAtoms && err == 0;i++)
	{
	  next = IsolateNextWord(next,word,' ',LINELENGTH);
	  corrs = atm->Parameters + 9;
	  *corrs = ConvertStringToInteger(word);
	  if(*corrs <= 0)
	    {
	      printf("Error in Atom Correspondences for %s\n", mol->Name);
	      err = 1;
	    }
	  
	  atm++;
	}
      bnd = mol->Bonds;
      for(i=0;i<mol->NBonds && err == 0;i++)
	{
	  next = IsolateNextWord(next,word,' ',LINELENGTH);
	  corrs = bnd->Parameters + 3;
	  *corrs = ConvertStringToInteger(word);
	  printf("Bond Parameter: %10d\n",*(bnd->Parameters+3));
	  
	  if(*corrs <= 0)
	    {
	      printf("Error in Bond Correspondences for %s\n", mol->Name);
	      err = 1;
	    }
	  
	  bnd++;
	}
    }
  Free(string);
  Free(word);
  
  return err;
}
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void ReactionMolfileUsingDB(int id,
			      char *line, 
			      DataBaseInformation *dinfo,
			      MolFileReaction *rxn)
{
  char *reactants,*products,*name,*next;
  MolFileReaction *readrxn;
  MoleculeInfo *minfo;
  MolFileMolecule *mlf;
  int eout;
  
  minfo = AllocateMoleculeInfo;
  
  name = AllocateString(LINELENGTH);
  reactants = AllocateString(LINELENGTH);
  
  next = IsolateNextWord(line,name,' ',LINELENGTH);
  /*
  products = IsolateNextWord(next,reactants,'=',LINELENGTH);
  */
  products = IsolateNextWordFromPhrase(next,reactants," = ",LINELENGTH);
  readrxn = AllocateMolFileReaction;
  CreateMolFileReaction(readrxn,id,name,20,20,0,0,0);
  readrxn->NumberOfReactants = 0;
  readrxn->NumberOfProducts = 0;
  
  next = reactants;
  while(*next != 0)
    {
      next = IsolateNextWord(next,name,' ',LINELENGTH);
      eout = DBFindMolSubFromString(name,minfo,dinfo);
      if(eout == 0) {
	  mlf = readrxn->Reactants + readrxn->NumberOfReactants;
	  
	  CopyFullMolFileMolecule(mlf,minfo->Molfile);
	  readrxn->NumberOfReactants++;
	  if(readrxn->NumberOfReactants > 20)
	    {
	      printf("Number of Reactants Exceeded \n");
	      break;
	    }
      } else {
	printf("reactant substructure not found: '%s'\n", name);
      }
    }
  next = products;
  while(*next != 0)
    {
      next = IsolateNextWord(next,name,' ',LINELENGTH);
      eout = DBFindMolSubFromString(name,minfo,dinfo);
      if(eout == 0)
	{
	  mlf = readrxn->Products + readrxn->NumberOfProducts;
	  CopyFullMolFileMolecule(mlf,minfo->Molfile);
	  readrxn->NumberOfProducts++;
	  if(readrxn->NumberOfProducts > 20)
	    {
	      printf("Number of Products Exceeded \n");
	      break;
	    }
	} else {
	printf("product substructure not found: '%s'\n", name);
      }
    }
  CopyFullMolFileReaction(rxn,readrxn);
  FreeMolFileReaction(readrxn);
  Free(readrxn);
}

