#include "basic.h"

#include "strmas.h"

static void ReadSetOfStructures(CHAR *set,INT flag);
static void ReadStructureMain(char *deffile, StructureSet *fileset);
static void ReadStructureElements(StructDefinition *structure,
		      FILE *file, CHAR *String);
static void IsolateKeyInformation(StructDefinition *structure,
			   CHAR *line,
			   KeyWords *keys, INT NumberOfKeys);

#define DIRh "./genh/"
#define DIRc "./genc/"
#define DIRstr "./struct/"


/*
Line 1:  Filename of output (extension .str will be given),
	 ID (zero if not given),
	 Name (empty if not given)
Line 2:  Structure Name, short structure name
Line 3:  Symbol Definitions
*/

int main(int argc, char *argv[])
     {
     char filename[LINELENGTH];
     INT flag;
     FILE *file;
     
     printf("--------------------Make Structure ------------------\n");
     printf("--------------------  Version 2.0  ------------------\n");
     
     InitAlloc(1000);
     PrintAllocSummary();
     
     if(argc < 2 )
	  {
	  printf("Call: %s Root RunType\n",
		 argv[0]);
	  printf("        Root    :  The root name of job\n");
	  printf("        RunType :  Str    = Create Structures\n");
	  printf("                   Sys    = Create System List\n");
	  printf("                   Both   = Create Both\n");
	  printf("                   simple = Create simple.h\n");
	  printf("Input File: Root.lst - list of structure definition files\n");
	  printf("Output    : ./genh/RootSysLst.h, ./genc/RootSysLst.c if system list\n");
	  printf("            ./genc/*.c, ./genh/*.h\n");
          Error(-1,"Exit");
	  }
     
     sprintf(filename,"%s",argv[1]);
     flag = ConvertStringToInteger(argv[2]);
     if(!strncmp(argv[2],"Str",3))
	  {
	  printf("Creating Structures Only\n");
	  flag = STRUCTURES_ONLY;
	  }
     else if(!strncmp(argv[2],"Sys",3))
	  {
	  printf("Creating System List Only\n");
	  flag = SYSTEM_LIST;
	  }
     else if(!strncmp(argv[2],"Both",4))
	  {
	  printf("Creating Both System List and Structures\n");
	  flag = BOTH;
	  }
     else if(!strncmp(argv[2],"simple",5))
	  {
	  printf("Creating simple.h\n");
	  flag = SIMPLE;
	  }
     else
	  Error(-1,"Unrecognizable Command\n");
     

     printf("Control File <%s.lst>\n",filename);

     if(flag != SIMPLE)
	  {
	  ReadSetOfStructures(filename,flag);
	  }
     else
	  {
	  file = OpenWriteFile("simple.h",DIRh,-1);
	  OutputTypeDefinitions(&(Types[0]),file);
	  fclose(file);
	  }
     return(0);
}

static void ReadSetOfStructures(CHAR *set,INT flag)
     {
     StructureSet *fileset;
     FILE *file;
     CHAR *String;
     CHAR *name;
     
     String = AllocateString(LINELENGTH);
     
     fileset = AllocateStructureSet;
     fileset->Flag = flag;
     
     if(fileset->Flag == SYSTEM_LIST || fileset->Flag == BOTH)
	  {
	  sprintf(String,"%sSys.h",set);
	  fileset->SysFileH = OpenWriteFile(String,DIRh,-1);

	  sprintf(String,"%sSys.c",set);
	  fileset->SysFileC = OpenWriteFile(String,DIRc,-1);
	  }
     else
	  {
	  printf("No structures to create\n");
	  }
	      
     sprintf(String,"%s.lst",set);
     file = OpenReadFile(String,DIRstr,0);
     if(file)
	  {
	  name = NextNonBlankLine(file,String);
	  while( name != NULL)
	       {
	       ReadStructureMain(name,fileset);
	       name = NextNonBlankLine(file,String);
	       }
	  }
     
     Free(String);
     if(fileset->Flag == SYSTEM_LIST || fileset->Flag == BOTH)
	  {
	  fclose(fileset->SysFileH);
	  fclose(fileset->SysFileC);
	  }
}

static void ReadStructureMain(char *deffile, StructureSet *fileset)
     {
     CHAR String[LINELENGTH];
     CHAR key[LINELENGTH];
     CHAR *FileLine,*rest;
     FILE *filec,*fileh,*filer;
     
     fileset->MaxNumberOfStructures = 20;
     fileset->NumberOfStructures = 0;

     fileset->Structures =
	      AllocArrayStructDefinition(fileset->MaxNumberOfStructures);

     fileset->DefFileName = CopyString(deffile);

     sprintf(String,"%s.def",deffile);
     fileset->DefFile = OpenReadFile(String,DIRstr,-1);

     if(fileset->Flag == STRUCTURES_ONLY || fileset->Flag == BOTH)
	  {
	  sprintf(String,"%s.h",fileset->DefFileName);
	  fileh = OpenWriteFile(String,DIRh,-1);
	  
	  sprintf(String,"%s.c",fileset->DefFileName);
	  filec =OpenWriteFile(String,DIRc,-1);
	  }
     
     FileLine = NextNonBlankLine(fileset->DefFile,String);
     fileset->Comment = CopyString(FileLine);

     FileLine = NextNonBlankLine(fileset->DefFile,String);

     rest = IsolateNextWord(FileLine,key,BLANK,LINELENGTH);

     rest = IsolateNextWord(rest,key,BLANK,LINELENGTH);
     fileset->Name = CopyString(key);

     FileLine = NextNonBlankLine(fileset->DefFile, String);
     FileLine = EliminateLeadingBlanks(FileLine);
     while( strcmp(FileLine,"DONE") )
          {
          ReadStructureDefinitions(fileset,FileLine);

	  if(fileset->Flag == STRUCTURES_ONLY || fileset->Flag == BOTH)
	       {
	       OutputStructureSetdotH(fileset,fileh);
	       OutputStructureSetdotC(fileset,filec);
	       }
	  
	       
	  if(fileset->Flag == SYSTEM_LIST || fileset->Flag == BOTH)
	       OutputSystemListFiles(fileset);
	  
          FileLine = NextNonBlankLine(fileset->DefFile, String);
          FileLine = EliminateLeadingBlanks(FileLine);
          printf("----Next---%s\n",FileLine);
          }

     if(fileset->Flag == STRUCTURES_ONLY || fileset->Flag == BOTH)
	  {
	  fclose(fileh);
	  fclose(filec);
	  }
     
     fclose(fileset->DefFile);
}

void ReadStructureDefinitions(StructureSet *structset, CHAR *FileLine)
{
CHAR String[LINELENGTH];
CHAR key[LINELENGTH];
CHAR *rest;
StructDefinition *structure;

     rest = IsolateNextWord(FileLine,key,BLANK,LINELENGTH);
     structset->StructureName = CopyString(key);

     rest = IsolateNextWord(rest,key,BLANK,LINELENGTH);
     structset->ID = ConvertStringToInteger(key);

     rest = IsolateNextWord(rest,key,BLANK,LINELENGTH);
     structset->Name = CopyString(key);

     rest = IsolateNextWord(rest,key,BLANK,LINELENGTH);
     if( strncmp("SystemList",key,10) )
          structset->SysList = OFF;
     else
          structset->SysList = ON;

     FileLine = NextNonBlankLine(structset->DefFile,String);
     rest = IsolateNextWord(FileLine,key,BLANK,LINELENGTH);

     structset->NumberOfStructures = 0;
     structure = structset->Structures;
     while(strcmp(key,"DONE") )
	  {
	  structure->ID = ConvertStringToInteger(key);

	  structure->Name = CopyString(rest);

	  ReadStructureElements(structure,structset->DefFile,String);

	  FileLine = NextNonBlankLine(structset->DefFile,String);
	  rest = IsolateNextWord(FileLine,key,BLANK,LINELENGTH);

	  PrintStructure(structure);
	  structure++;
	  structset->NumberOfStructures += 1;
	  }
}


static void ReadStructureElements(StructDefinition *structure,
		      FILE *file, CHAR *String)
{
CHAR *line,*rest,*restofline;
CHAR element[LINELENGTH];
KeyWords *key;

      line = NextNonBlankLine(file,String);

      restofline = IsolateNextWord(line,element,BLANK,LINELENGTH);
      key = SearchForKeyWord(TypeKeys,element,NumberOfTypes);

      if(key == 0)
	   structure->Type = -1;
      else
	   structure->Type = key->Type;

      structure->TypeName = CopyString(element);
      rest = IsolateNextWord(restofline,element,BLANK,LINELENGTH);
      structure->ElementName = CopyString(element);

      IsolateKeyInformation(structure,
			    rest,
			    StructureKeys,NumberOfStructureKeys);
}

void PrintStructureSet(StructureSet *set)
{
INT i;
StructDefinition *structure;

     printf("Structure Set:%d:%s\n",set->ID,set->Name);
     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  PrintStructure(structure++);
}
void PrintStructure(StructDefinition *structure)
{
     printf("Structure: %5d %s\n",structure->ID,structure->Name);
     printf("TypeName: %20s ElementName:%20s\n",structure->TypeName,structure->ElementName);
     printf("Create:%5d Pointer:%5d Array:%s\n",structure->Create,
			 structure->Pointer,
			 structure->Array);
}

static void IsolateKeyInformation(StructDefinition *structure,
			   CHAR *line,
			   KeyWords *keys, INT NumberOfKeys)
{
CHAR *rest;
KeyWords *key;
CHAR element[LINELENGTH];

     structure->Pointer = OFF;
     structure->Create  = 0;
     structure->Array   = NULL;
     structure->Return  = NULL;

     rest = line;
     while(*rest != 0)
	  {
	  rest = IsolateNextWord(rest,element,BLANK,LINELENGTH);
	  key = SearchForKeyWord(keys,element,NumberOfKeys);
	  if(key != 0)
	       {
	       switch(key->Type)
		    {
		    case KeyPNTR:
			 structure->Pointer = 1;
			 break;
		    case KeyCREATE:
			 structure->Create = 1;
			 break;
		    case KeyARRAY:
			 if( *(element+5) != '=' )
			      Error(0,"Syntax Error in Array Declaration");
			 else
			      structure->Array = CopyString(element+6);
			 break;
		    case KeyRETURN:
			 if( *(element+6) != '=' )
			      Error(0,"Syntax Error in Array Declaraction");
			 else
			      structure->Return = CopyString(element+7);
			 break;
		    }
	       }
	  else
	       {
		    printf("Element:%s not found",element);
		    Error(0,"Unknown Type in Element Declaration Keywords");
	       }
	  
	  }
}
