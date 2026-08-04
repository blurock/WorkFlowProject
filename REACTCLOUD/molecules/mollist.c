/*  FILE     mollist.c
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

#include "molecules/mollst.c"
 
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static INT MoleculeInSet(ReadInMoleculeSet *total, ReadInMolecule *addmol);

/*S ReadInMoleculeSet
*/
/*F molecules = ReadInMoleculeNamesFromFile(bind,max)
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
extern ReadInMoleculeSet *ReadInMoleculeNamesFromFile(BindStructure *bind,INT max)
     {
     CommandMaster *commandmaster;
     FILE *file;
     ReadInMoleculeSet *molecules;
     ReadInMolecule *molecule;
     CHAR *line,*word,*rest,*string;
     INT count;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     file = OpenReadFileFromCurrent("MolDirectory","RootMolName",
				    MOL_FILE_LIST_SUFFIX,
				    IGNORE,"List of Molecules",commandmaster);
     
     string = AllocateString(LINELENGTH);
     word = AllocateString(LINELENGTH);
     
     molecules = AllocateReadInMoleculeSet;
     CreateReadInMoleculeSet(molecules,0,0,
			      max,0);
     molecules->NumberOfMolecules = 0;
     
     molecule = molecules->Molecules;
     if(file != 0)
	  {
	  line = NextNonBlankLine(file,string);
	  count = 0;
 	  while(line != 0 && count < max)
	       {
	       EliminateLeadingBlanks(line);
	       rest = IsolateNextWord(line,word,BLANK,LINELENGTH);
	       CreateReadInMolecule(molecule,molecules->NumberOfMolecules,word,
				    rest,0);
	       molecule++;
	       count++;
	       line = NextNonBlankLine(file,string);
	       }
	  fclose(file);
	  }
     else
	  molecules = 0;

     Free(word);
     Free(string);

     return(molecules);
     }

/*F set = ReadInMoleculesFromLine(line,max)
**
**  DESCRIPTION
**    Given a line, the molecule id's (names or numbers) separated by
**    commas are isolated and put into  ReadMoleculeSet
**
**  REMARKS
**
*/
extern ReadInMoleculeSet *ReadInMoleculesFromLine(CHAR *line, 
						  CHAR delimitor,
						  INT max)
     {
     CHAR *word,*rest;
     ReadInMoleculeSet *molecules;
     ReadInMolecule *molecule;
     
     word = AllocateString(LINELENGTH);
     
     molecules = AllocateReadInMoleculeSet;
     CreateReadInMoleculeSet(molecules,0,0,
			     max,0);
     molecules->NumberOfMolecules = 0;
     
     if(strncmp("NONE",line,4))
	  {
	  rest = line;
	  molecule = molecules->Molecules;
	  while(strlen(rest) != 0)
	       {
	       rest = IsolateNextWord(rest,word,delimitor,LINELENGTH);
	       EliminateBlanks(word);
	       CreateReadInMolecule(molecule,molecules->NumberOfMolecules,word,0,0);
	       molecules->NumberOfMolecules += 1;
	       molecule++;
	       }
	  }
     return(molecules);
     }

/*f new = MergeReadInMoleculeSet(set1,set2)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern ReadInMoleculeSet *MergeReadInMoleculeSet(ReadInMoleculeSet *set1, 
						 ReadInMoleculeSet *set2)
     {
     INT i;
     ReadInMoleculeSet *total;
     ReadInMolecule *new,*old,*mol;

     total = AllocateReadInMoleculeSet;
     if(set1 == 0)
	  {
	  if(set2 == 0)
	       CreateReadInMoleculeSet(total,0,0,0,0);
	  else
	       CopyFullReadInMoleculeSet(total,set2);
	  }
     else if(set2 == 0)
	  CopyFullReadInMoleculeSet(total,set1);
     else 
	  {
	  CreateReadInMoleculeSet(total,set1->ID,set1->Name,
				  set1->NumberOfMolecules + set2->NumberOfMolecules,
				  0);
	  
	  old = set1->Molecules;
	  new = total->Molecules;
	  LOOPi(set1->NumberOfMolecules)
	       {
	       CopyFullReadInMolecule(new,old);
	       new++;
	       old++;
	       }
	  total->NumberOfMolecules = set1->NumberOfMolecules;
	  
	  mol = set2->Molecules;
	  LOOPi(set2->NumberOfMolecules)
	       {
	       if(MoleculeInSet(total,mol) < 0)
		    {
		    CreateReadInMolecule(new,
					 total->NumberOfMolecules,
					 mol->Name,mol->Rest,0);
		    total->NumberOfMolecules += 1;
		    new++;
		    }
	       mol++;
	       }
	  }
     
     return(total);
     }
/* inset = MoleculeInSet(total,addmol)
**
**  DESCRIPTION
**    total: The total number of ReadInMolecule structures
**    addmol: The molecule to check in list
**    inset: >0 if in set, 0 otherwise
**
**  REMARKS
**
*/
static INT MoleculeInSet(ReadInMoleculeSet *total, ReadInMolecule *addmol)
     {
     INT inset,count;
     ReadInMolecule *mol;
     
     inset = -1;
     count = 0;
     mol = total->Molecules;
     while(inset == -1 && count < total->NumberOfMolecules)
	  {
	  if(!strcmp(mol->Name,addmol->Name))
	       inset = count;
	  count++;
	  mol++;
	  }
     return(inset);
     
     }



