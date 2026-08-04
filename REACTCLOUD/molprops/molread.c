/*  FILE     
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
#include "molprops.h"
#include "molecules/mlf.c"
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void ReadMFBond(FILE *file, MolFileBond *bond);
static INT ReadMFAtom(FILE *file, MolFileAtom *atom, 
		       SetOfMolFileMetaAtoms *meta);
static INT *ReadIntegerParameters(CHAR *line,INT number);


static void PrintPrettyBond(CHAR *prefix, FILE *file, MolFileBond *bond );
static void PrintPrettyAtom(CHAR *prefix, FILE *file, MolFileAtom *atom);

static void PrintPrettyMolFileMetaAtom(CHAR *string,
				       FILE *out,
				       MolFileMetaAtom *metaatom);
static MolFileMetaAtom *MetaAtomLoop(CHAR *name,
				     FILE *file, 
				     CHAR *line,
				     INT count);
static SetOfMolFileMetaAtoms *MetaAtomInfoReadLoop(CHAR *name,
						   FILE *file, CHAR *line,
						   INT count);
static INT FindMetaAtomSymbol(CHAR *symbol, SetOfMolFileMetaAtoms *set);

static INT MoleculeStored(INT id, 
			  MoleculeSet *molecules);

#define DEBUG  DEBUG3
#define ABSOLUTE_MAX_ATOMS 100
#define ABSOLUTE_MAX_BONDS 100
     
 
 
/*F  ret = ReadInMoleculesFromList(bind)
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
extern INT AddToCurrentMolecules(BindStructure *bind)
     {
     INT ret;
     ret = ReadInMoleculesFromList(bind,BIND_CURRENT_MOLECULES);
     return(ret);
     }
extern INT AddToCurrentSubStructures(BindStructure *bind)
     {
     INT ret;
     ret = ReadInMoleculesFromList(bind,BIND_CURRENT_SUBSTRUCTURES);
     return(ret);
     }

extern INT ReadInMoleculesFromList(BindStructure *bind,INT cflag)
     {
     CHAR *line,*string,*dir;
     FILE *file;
     MolFileMolecule *molmolf;
     MoleculeSet *molecules;
     CommandMaster *commandmaster;
     INT ret;
     
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     molecules = GetBoundStructure(bind,cflag);
     dir = GetCurrentStringArgument("MolDirectory",commandmaster);
     
     string = AllocateString(LINELENGTH);
     file = OpenReadFileFromCurrent("MolDirectory","RootMolName",
				    MOL_FILE_LIST_SUFFIX,
				    IGNORE,"List of Molfiles",commandmaster);
     
     ret = SYSTEM_NORMAL_RETURN;
     if(file != 0)
	  {
	  line = NextNonBlankLine(file,string);
	  molmolf = AllocateMolFileMolecule;
	  while(line != 0)
	       {
	       EliminateLeadingBlanks(line);
	       file = MasterOpenReadFile(dir,line,MOL_FILE_SUFFIX,
					 IGNORE,"MolFile for molecule",commandmaster);
	       if(file != 0)
		    {
		    ReadMFMol(file,molmolf,molecules->MetaAtoms);
		    StoreMolFileInfo(molmolf,molecules,molecules->PropertyTypes);
		    }
	       line = NextNonBlankLine(file,string);
	       FreeMolFileMolecule(molmolf);
	       }
	  }
	  else
	       Error(0,"No Molecules Read");
	  
     Free(string);
     Free(dir);
     return(ret);
     }
 
/*F  ret = ReadSDFMolecules(bind,cflag)
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
extern INT AddSDFToCurrentMolecules(BindStructure *bind)
     {
     INT ret;
     ret = ReadSDFMolecules(bind,BIND_CURRENT_MOLECULES);
     return(ret);
     }
extern INT AddSDFToCurrentSubStructures(BindStructure *bind)
     {
     INT ret;
     ret = ReadSDFMolecules(bind,BIND_CURRENT_SUBSTRUCTURES);
     return(ret);
     }

extern INT ReadSDFMolecules(BindStructure *bind, INT cflag) {
     INT done;
     FILE *file;
     MolFileMolecule *molmolf,*plushydrogens;
     MoleculeSet *molecules;
     SetOfMolFileMetaAtoms *metaatoms;
     CommandMaster *commandmaster;
     INT i;

     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     molecules = GetBoundStructure(bind,cflag);
     metaatoms = GetMetaAtomMaster(bind);

     file = OpenReadFileFromCurrent("MolDirectory","RootMolName",
				    SDF_FILE_LIST_SUFFIX,
				    RECOVER,"SDF File",
				    commandmaster);     
     if(file != 0) {
	  molmolf = AllocateMolFileMolecule;
	  done = SYSTEM_NORMAL_RETURN;
	  while(done == SYSTEM_NORMAL_RETURN) {
          done = ReadSDFMol(file,molmolf,metaatoms);
	       /*
	       if(cflag == BIND_CURRENT_MOLECULES) {
		   plushydrogens = AddHydrogens(molmolf);
		   FreeMolFileMolecule(molmolf);
		   Free(molmolf);
		   molmolf = plushydrogens;
               }
	       */
	       if(done == SYSTEM_NORMAL_RETURN) {
		    StoreMolFileInfo(molmolf,molecules,molecules->PropertyTypes);
		    FreeMolFileMolecule(molmolf);
	       }
	  }
	  Free(molmolf);
     }
     return(SYSTEM_NORMAL_RETURN);
}

static INT MoleculeStored(INT id, 
			  MoleculeSet *molecules)
     {
     MoleculeInfo *molecule;
     INT count;
     
     molecule = molecules->Molecules;
     count = 0;
     while(count < molecules->NumberOfMolecules &&
	   id != molecule->ID)
	  count++;
     
     if(count == molecules->NumberOfMolecules)
	  return(0);
     else
	  return(1);
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
extern void StoreMolFileInfo(MolFileMolecule *molfile,
			     MoleculeSet *molecules,
			     SetOfPropertyTypes *types)
     {
     MoleculeInfo *molecule;
     
     if(MoleculeStored(molfile->ID, molecules)) return;

     molecule = molecules->Molecules + molecules->NumberOfMolecules;
     molecules->NumberOfMolecules +=1;
     
     CreateMoleculeInfo(molecule, molfile->ID, molfile->Name,
			molfile,0,0);
     molecule->Properties = InitializeSetOfPropertyValues(types);

     FillInASCIIValue(molfile->Properties,
		      molecule->Properties,
		      types,
		      0);
     }

/*S MolFileReads
*/
 
/*F
**
**  DESCRIPTION
**     The MolFile has the following form:
**
**    line 1        : Name of Molecule
**    line 2        : Registry Number in Column 46
**    line 3        : Number of Atoms and Number of Bonds (%3d%3d)
**    line 4-nnn    : Atoms (See routine ReadMFAtom)
**    line nnn-mmm  : Bonds (See routine ReadMFBond)
**
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
extern void ReadMFMol( FILE *file, MolFileMolecule *molecule,
		      SetOfMolFileMetaAtoms *metaatomset)
     {
     INT i;
     MolFileAtom *atompntr;
     MolFileBond *bondpntr;
     CHAR *name,*line,*temp;
     
     INT Natoms,Nbonds,reg;
     
     line = AllocateString(LINELENGTH);
     
     fgets(line,LINELENGTH,file);

     temp = EliminateLeadingBlanks(line);
     if(*(temp + strlen(temp) - 1) == '\n')
	  *(temp + strlen(temp) - 1) = '\0';
     
     name = AllocateString(LINELENGTH);
     IsolateNextWord(line,name,BLANK,PRINT_BUFFER_LENGTH);
     //name = CopyNAME(temp);
     
     fgets(line,LINELENGTH,file);
     sscanf((line + 46),"%d", &reg  );
     
     fgets(line,LINELENGTH,file);
     
     fgets(line,LINELENGTH,file);
     sscanf(line,"%3d%3d",&Natoms,&Nbonds);
     
     CreateMolFileMolecule(molecule,reg,name,Natoms,Nbonds,0,0,0);
     
     atompntr = molecule->Atoms;
     LOOPi(molecule->NAtoms)
	  {
	  ReadMFAtom(file,atompntr,metaatomset);
	  atompntr->ID = i;
	  atompntr++;
	  }
     
     bondpntr = molecule->Bonds;
     LOOPi(molecule->NBonds)
	  {
	  ReadMFBond(file,bondpntr);
	  bondpntr->ID = i;
	  bondpntr->Name = CopyNAME("b");
	  bondpntr++;
	  }             
     Free(line);
     Free(name);
     }

/*** ReadMFAtom
 *
 * The information is in the following Columns:
 *      0-9    X Coordinate
       10-19  Y Coordinate
       20-29  Z Coordinate
       31-32  Atom Symbol
       37-39  Charge
 */     
static INT ReadMFAtom(FILE *file, MolFileAtom *atom, 
		       SetOfMolFileMetaAtoms *meta)
     {
     CHAR symb[2],*line;
     INT charge;
     
     line = AllocateString(LINELENGTH);
     
     NextNonBlankLine(file,line);

     atom->Name = 0;
     atom->ID = 0;
     
     atom->X = IsolateFloat(line, 0, 9);
     atom->Y = IsolateFloat(line,10,19);
     atom->Z = IsolateFloat(line,20,29);
     symb[0] = IsolateChar(line,31);
     symb[1] = IsolateChar(line,32);
     
     charge = (FLOAT) IsolateInteger(line,37,39);
     ChargeAndRadicalFromMolFileSpec(charge,atom);
     
     atom->AtomicNumber = AtomicNumberFromSymbol(&(symb[0]));
     if(atom->AtomicNumber == -1)
	  atom->AtomicNumber = FindMetaAtomSymbol(&(symb[0]),meta);
     if(atom->AtomicNumber == -1)
	  {
	  printf("Atomic Symbol Not Found: %s\n",&(symb[0]));
	  return(SYSTEM_ERROR_RETURN);
	  }
     
     atom->Parameters = ReadIntegerParameters(line+33,NUMBER_ATOM_PARAMETERS);
     atom->NumberOfParameters = NUMBER_ATOM_PARAMETERS;

     Free(line);
     return(SYSTEM_NORMAL_RETURN);
     }                

extern void ChargeAndRadicalFromMolFileSpec(INT charge,MolFileAtom *atom)
     {
     FLOAT chrg,rad;
     
     switch(charge)
	  {
     case 0:
	  chrg = 0.0;
	  rad = 0;
	  break;
     case 1:
	  chrg = 3.0;
	  rad = 0;
	  break;
     case 2:
	  chrg = 2.0;
	  rad = 0;
	  break;
     case 3:
	  chrg = 1.0;
	  rad = 0;
	  break;
     case 4:
	  chrg = 0.0;
	  rad = 1;
	  break;
     case 5:
	  chrg = -1.0;
	  rad = 0;
	  break;
     case 6:
	  chrg = -2.0;
	  rad = 0;
	  break;
     case 7:
	  chrg = -3.0;
	  rad = 0;
	  break;
     default:
	  Error(RECOVER,"Error in Charge of Input Atom");
	  chrg = 0.0;
	  rad = 0;
	  }
     atom->Charge = chrg;
     atom->Radical = rad;
     }



/****** ReadMFBond

This routine reads in a single bond information line from the MolFile.

   A Bond line has the form:

        Atom I, Atom J, Bond Order (%3d%3d%3d)

*/
static void ReadMFBond(FILE *file, MolFileBond *bond)
     {
     CHAR *line;

     line = AllocateString(LINELENGTH);
	       
     bond->Name = 0;
     NextNonBlankLine(file,line);
     sscanf(line,"%3d%3d%3d",&(bond->I),&(bond->J),&(bond->Order));     
     bond->I -= 1;
     bond->J -= 1;

     bond->Parameters = ReadIntegerParameters(line+9,NUMBER_BOND_PARAMETERS);
     bond->NumberOfParameters = NUMBER_BOND_PARAMETERS;
     
     Free(line);
}

static INT *ReadIntegerParameters(CHAR *line,INT number)
     {
     CHAR *word;
     INT *out;
     
     word = AllocateString(LINELENGTH);

     out = AllocArrayINT(5*number);
     ConvertStringToIntVec(out,line,word,BLANK,number);

     Free(word);
     
     return(out);
     }

/***************************************************************************/
/*                  MolFile Print Routines                                 */
/***************************************************************************/
/****** PrintPrettyMolFile
*/
extern void PrintPrettyMolFile(CHAR *prefix, FILE *file,
			       MolFileMolecule *molecule )
     {
     INT i;
     MolFileAtom *atompntr;
     MolFileBond *bondpntr;
     CHAR *string;
     
     fprintf(file,"~\n");
     if(molecule != 0)
	  {
	  string = StringOfBlanks((INT) strlen(prefix));
	  
	  fprintf(file,"%s:MolFile %d :%3d Atoms :%3d Bonds : ", 
		  prefix,
		  molecule->ID,
		  molecule->NAtoms,
		  molecule->NBonds);
	  
	  if( molecule->Name != 0 )
	       fprintf(file,"%s\n",molecule->Name);
	  else
	       fprintf(file,"\n");
	  
	  fprintf(file,"~\n");
	  atompntr = molecule->Atoms;
	  LOOPi(molecule->NAtoms)
	       {
	       PrintPrettyAtom(string,file,atompntr);
	       fprintf(file,"\n");
	       atompntr++;
	       }
	  fprintf(file,"~\n");
	  bondpntr = molecule->Bonds;
	  LOOPi(molecule->NBonds)
	       {
	       PrintPrettyBond(string,file,bondpntr);
	       fprintf(file,"\n");
	       bondpntr++;
	       }
	  fprintf(file,"~\n");
	  }
     }


/****** PrtMFAtom
 */
static void PrintPrettyAtom(CHAR *prefix, FILE *file, MolFileAtom *atom)
     {
       if(atom->Parameters != 0)
	 {
	   fprintf(file,"%s:Atom %5d:%10.3f:%10.3f:%10.3f:%2d   :%3.1f     :%10d",prefix,
		   atom->ID,
		   atom->X,
		   atom->Y,
		   atom->Z,
		   atom->AtomicNumber,
		   atom->Charge,
		   *(atom->Parameters + 9));
	 }
       else
	 {
	   fprintf(file,"%s:Atom %5d:%10.3f:%10.3f:%10.3f:%2d   :%3.1f:",prefix,
		   atom->ID,
		   atom->X,
		   atom->Y,
		   atom->Z,
		   atom->AtomicNumber,
		   atom->Charge);
	 }
       
     }                                               


/****** PrtMFBond
 */
static void PrintPrettyBond(CHAR *prefix, FILE *file, MolFileBond *bond )
     {
     CHAR *bondstr;
     
     switch(bond->Order)
	  {
     case 1:
	  bondstr = CopyString("  Single");
	  break;
     case 2:
	  bondstr = CopyString("  Double");
	  break;
     case 3:
	  bondstr = CopyString("  Triple");
	  break;
     default:
	  bondstr = CopyString("Multiple");
	  break;
	  }
	  if(bond->Parameters != 0)
	    {
	      fprintf(file,"%s:%s Bond :%3d :%3d   :%3d",prefix,bondstr,
		      bond->I,bond->J, *(bond->Parameters + 3));
	    }
	  else
	    {
	      fprintf(file,"%s:%s Bond :%3d :%3d : 0",prefix,bondstr,
		      bond->I,bond->J);
	    }

     Free(bondstr);
     
     }       

/****** ReadSDFMOL

 The MolFile has the following form:

line 1        : Ignore
line 2        : Ignore
line 3        : Ignore
line 4        : Number of Atoms and Number of Bonds (%3d%3d)
line 5-nnn    : Atoms (See routine ReadMFAtom)
line nnn-mmm  : Bonds (See routine ReadMFBond)


*/
extern INT ReadSDFMol( FILE *file, MolFileMolecule *molecule,
		      SetOfMolFileMetaAtoms *metaatoms) {
  int notdone;
  char *ans;
     INT i,id;
     MolFileAtom *atompntr;
     MolFileBond *bondpntr;
     CHAR *name,*line,*input;
     INT Natoms,Nbonds,ret;
     
     ret = SYSTEM_NORMAL_RETURN;
     input = AllocateString(LINELENGTH);
     
     line = fgets(input,LINELENGTH,file);
     if(line == 0) 
	  {
	  Free(input);
	  return(SYSTEM_ERROR_RETURN);
	  }
     
     EliminateBlanks(line);
     id = ConvertStringToInteger(line);
     
     if(strlen(line) == 0)
	  {
	  Free(input);
	  return(SYSTEM_ERROR_RETURN);
	  }
	  
     
     fgets(line,LINELENGTH,file);
     fgets(line,LINELENGTH,file);
     EliminateBlanks(line);
     if(*(line + strlen(line) - 1) == '\n')
	  *(line + strlen(line) - 1) = '\000';
     
     name = AllocateString(LINELENGTH);
     IsolateNextWord(line,name,BLANK,PRINT_BUFFER_LENGTH);
     //name = CopyString(line);
     printf("Read SDF Molecule: %s\n",name);

     fgets(line,LINELENGTH,file);
     sscanf(line,"%3d%3d",&Natoms,&Nbonds);
     
     if(Natoms < ABSOLUTE_MAX_ATOMS && Nbonds < ABSOLUTE_MAX_BONDS)
	  {
	  CreateMolFileMolecule(molecule,id,name,Natoms,Nbonds,0,0,0);
	  Free(name);
     
	  atompntr = molecule->Atoms;
	  LOOPi(molecule->NAtoms)
	       {
	       if(ret != SYSTEM_ERROR_RETURN)
		    {
		    ret = ReadMFAtom(file,atompntr,metaatoms);
		    }
	       atompntr->ID = i;
	       atompntr++;
	       }
	  
	  if(ret != SYSTEM_ERROR_RETURN)
	       {
	       bondpntr = molecule->Bonds;
	       LOOPi(molecule->NBonds)
		    {
		    ReadMFBond(file,bondpntr);
		    bondpntr->ID = i;
		    bondpntr++;
		    }             
	       molecule->Properties = AllocateASCIIProperties;
	       ReadInPropertyInfoSDF(file,line,molecule->Properties);
	       }
	  }
     else
	  {
	  printf("Error in Reading SDF File\n");
	  printf("Too many bonds or atoms detected: %d %d\n",Natoms,Nbonds);
	  ret = SYSTEM_ERROR_RETURN;
	  }
     if(ret == SYSTEM_ERROR_RETURN) 
       notdone = 0;
     else
       notdone = 1;
     while(notdone == 1) {
       EliminateLeadingBlanks(line);
       
       //printf("END: '%s' %d %d\n",line,strncmp("$$$$",line,4),strncmp("M  END",line,6)); 
       if(strncmp("$$$$",line,4) == 0) 
	 notdone = 0;
       if(strncmp("M  END",line,6) == 0)
	 notdone = 0;
       if(notdone) {
	 printf("Reading lines at end of SDF block: %s\n",line);
	 ans = fgets(line,LINELENGTH,file);
	 if(ans == NULL) notdone = 0;
       }
     }
     Free(line);
     return(ret);
     }



/************************************************************************/
/* Utility Routines
*/
extern MolFileAtom *AtomFromMolFile(INT id, MolFileMolecule *molecule)
     {
     MolFileAtom *atom;
     
     if( id >= molecule->NAtoms )
	  {
	  Error(-1, "Illegal Atom Reference");
	  atom = 0;
	  }
     else
	  atom = molecule->Atoms +id;
	  
     return(atom);
     }

/************************************************************************/
/*  MetaAtomInfoRead
      This routine reads in the MetaAtom information
      The form of the input is as follows:
  MetaAtom xxx
      Atom yyy zzz
      Atom yyy zzz
           .
           .
           .
  MetaAtom xxx
      Atom yyy zzz
      Atom yyy zzz
           .
           .
           .
*/   
/************************************************************************/
static KeyWords BOND_KEYWORDS[NUMBER_BOND_KEYWORDS] = 
     {
     {"Single", META_SINGLE,0,
	"Single Bonded Atom --- No multiple bonds"},
     {"Double", META_DOUBLE,0,
        "Single and Double Bonds"},
     {"Triple", META_TRIPLE,0,
        "Triple Bond and Single Bond"}
     };


extern SetOfMolFileMetaAtoms *MetaAtomInfoRead(CHAR *name, FILE *file)
     {
     CHAR *line;
     SetOfMolFileMetaAtoms *set;
     
     line = AllocateString(LINELENGTH);
     NextNonBlankLine(file,line);
     set = MetaAtomInfoReadLoop(name,file,line,0);
     Free(line);
#if DEBUG >= DEBUG2
     PrintPrettySetOfMolMetaAtoms("MetaAtoms",stdout,set);
#endif
     return(set);
     }

static SetOfMolFileMetaAtoms *MetaAtomInfoReadLoop(CHAR *name,
						   FILE *file, CHAR *line,
						   INT count)
     {
     SetOfMolFileMetaAtoms *set;
     CHAR *key,*rest;
     MolFileMetaAtom *metaatoms;
     
     key = AllocateString(LINELENGTH);
     
     set = 0;
     if(line == 0 || *line == ENDOFLINE)
	  {
	  set = AllocateSetOfMolFileMetaAtoms;
	  CreateSetOfMolFileMetaAtoms(set,0,name,
				      count,0);
	  return(set);
	  }
     rest = IsolateNextWord(line,key,BLANK,LINELENGTH);
     if(strncmp(key,META_ATOM_SET_KEYWORD,META_ATOM_SET_KEYWORD_LENGTH))
	  {
	  Error(0,"Expected MetaAtom Entry");
	  }
     else 
	  {
	  rest = IsolateNextWord(rest,key,BLANK,LINELENGTH);
	  NextNonBlankLine(file,line);
	  metaatoms = MetaAtomLoop(key,file,line,0);
	  metaatoms->ID = META_ATOM_OFFSET
	       + count
		    + MAX_NUMBER_OF_META_ATOMS 
			 * (*(metaatoms->AtomicNumbers));
	  set = MetaAtomInfoReadLoop(name,file,line,count+1);
	  CopyFullMolFileMetaAtom(set->MetaAtoms + count,metaatoms);
	  FreeMolFileMetaAtom(metaatoms);
	  Free(metaatoms);
	  }
     Free(key);
     return(set);
     }

static MolFileMetaAtom *MetaAtomLoop(CHAR *name,
				     FILE *file, 
				     CHAR *line,
				     INT count)
     {
     CHAR *rest,*key,*atomkey,*bondkey;
     MolFileMetaAtom *metaatom;
     KeyWords *bondkeyword;
     
     key = AllocateString(LINELENGTH);
     atomkey = AllocateString(LINELENGTH);
     bondkey = AllocateString(LINELENGTH);

     rest = IsolateNextWord(line,key,BLANK,LINELENGTH);
     if(strncmp(key,META_ATOM_KEYWORD,META_ATOM_KEYWORD_LENGTH))
	  {
	  metaatom = AllocateMolFileMetaAtom;
	  CreateMolFileMetaAtom(metaatom,0,name,
				count,0,0);
     return(metaatom);
	  }
     else
	  {
	  rest = IsolateNextWord(rest,atomkey,BLANK,LINELENGTH);
	  if(strlen(atomkey) == 1)
	       {
	       *(atomkey + 2) = ENDOFSTRING;
	       *(atomkey + 1) = BLANK;
	       }
	  rest = IsolateNextWord(rest,bondkey,BLANK,LINELENGTH);
	  
	  bondkeyword = SearchForKeyWord(BOND_KEYWORDS,
					 bondkey,
					 NUMBER_BOND_KEYWORDS);
	  NextNonBlankLine(file,line);
	  metaatom = MetaAtomLoop(name,file,line,count+1);
	  *(metaatom->AtomicNumbers + count) = AtomicNumberFromSymbol(atomkey);
	  *(metaatom->Bonding + count) = bondkeyword->Type;
	  }

     Free(key);
     Free(atomkey);
     Free(bondkey);
     return(metaatom);
     }

extern void PrintPrettySetOfMolMetaAtoms(CHAR *prefix,FILE *out,
					 SetOfMolFileMetaAtoms *set)
     {
     CHAR *string;
     INT i;
     MolFileMetaAtom *metaatom;
     
     fprintf(out,"Set Of %5d MolFile Meta Atoms (%5d:%s)\n",
	     set->NumberOfMetaAtoms,
	     set->ID,
	     set->Name);
     string = AllocateString(LINELENGTH);
     metaatom = set->MetaAtoms;
     LOOPi(set->NumberOfMetaAtoms)
	  {
	  sprintf(string,"%s:%5d:",prefix,i);
	  PrintPrettyMolFileMetaAtom(string,stdout,metaatom);
	  metaatom++;
	  }
     Free(string);
     }

static void PrintPrettyMolFileMetaAtom(CHAR *prefix,
				       FILE *out,
				       MolFileMetaAtom *metaatom)
     {
     INT i,*atoms,*bonds;
     
     fprintf(out,"%s:(%10s,%5d -> [ ",prefix,metaatom->Name,metaatom->ID);
     
     atoms = metaatom->AtomicNumbers;
     bonds = metaatom->Bonding;
     LOOPi(metaatom->NumberOfAliased)
	  fprintf(out,"(%5d,%5d) ",*atoms++,*bonds++);
	  
     fprintf(out," ]\n");
     }

static INT FindMetaAtomSymbol(CHAR *symbol, SetOfMolFileMetaAtoms *set)
     {
     INT done,count;
     MolFileMetaAtom *metaatom;
     CHAR *string;
     
     string = AllocateString(3);
     *string = *symbol;
     if(*(symbol+1) == BLANK)
	  {
	  *(string + 1) = ENDOFSTRING;
	  }
     else
	  {
	  *(string + 1) = *(symbol + 1);
	  *(string + 2) = ENDOFLINE;
	  }
     
     count = 0;
     done = -1;
     metaatom = set->MetaAtoms;
     while(count < set->NumberOfMetaAtoms && done == -1)
	  {
	  if(!strcmp(string,metaatom->Name))
	       done = metaatom->ID;
	  metaatom++;
	  count++;
	  }
     Free(string);
     
     return(done);
     }

