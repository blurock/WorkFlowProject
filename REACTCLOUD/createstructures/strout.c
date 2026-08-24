#include "basic.h"

#include "strmas.h"

static void OutputStructureDef(StructureSet *set, FILE *file);
static void OutputStandardDefs(StructureSet *set, FILE *file);
static void OutputStructureComments(StructureSet *set, FILE *file);
static void OutputCreateRoutine(StructureSet *set, FILE *file);
static void OutputNameIDRoutines(StructureSet *set, FILE *file);
static void OutputCopyRoutine(StructureSet *set, FILE *file);
static void OutputFunction(StructureSet *set, FILE *file,
			   CHAR *func, INT create);
static void OutputAssign(StructureSet *set, FILE *file);
static void OutputPreamble(StructureSet *set, FILE *file);
static void OutputLoopFunction(StructureSet *set, FILE *file,
			CHAR *func, INT create);
static void OutputDefsFromName(CHAR *name, FILE *file);
static void OutputPrintRoutine(StructureSet *set, FILE *file);
static void OutputFreeRoutine(StructureSet *set, FILE *file);
static void OutputWriteBinRoutine(StructureSet *set, FILE *file);
static void OutputReadBinRoutine(StructureSet *set, FILE *file);
static void OutputWriteJSONRoutine(StructureSet *set, FILE *file);
static void OutputReadJSONRoutine(StructureSet *set, FILE *file);
static void OutputVarType(StructDefinition *structure,
			  FILE *file, CHAR *blanks);
static void    OutputCreateFuncName(StructureSet *set, FILE *file);
static void OutputStaticDefinitions(StructureSet *set, FILE *file);
static void OutputAllocRoutine(StructureSet *set, FILE *file);
static void OutputXDRBinRoutine(StructureSet *set, FILE *file);

extern void OutputStructureSetdotH(StructureSet *set, FILE *file)
{
     PrintStructureSet(set);

     OutputStructureComments(set,file);
     OutputStructureDef(set,file);
     OutputStandardDefs(set,file);
     OutputStaticDefinitions(set,file);
}

extern void OutputStructureSetdotC(StructureSet *set, FILE *file)
{
     OutputNameIDRoutines(set,file);
     OutputCreateRoutine(set,file);
     OutputCopyRoutine(set,file);
     OutputPrintRoutine(set,file);
     OutputFreeRoutine(set,file);
     OutputWriteBinRoutine(set,file);
     OutputReadBinRoutine(set,file);
     OutputWriteJSONRoutine(set,file);
     OutputReadJSONRoutine(set,file);
     OutputXDRBinRoutine(set,file);
     OutputAllocRoutine(set,file);
}

extern void OutputTypeDefinitions(StructureType *types, FILE *file)
{
INT i;
CHAR quote = '"';
CHAR slash = 92;

     LOOPi(NumberOfTypes)
	  {
	  if(types->Simple == ON)
	       {
	       OutputDefsFromName(types->TypeName,file);
           fprintf(file,"#define Free%s Free\n",types->TypeName);

	       fprintf(file,"#define CopyFull%s SingCopy%s\n",
		     types->TypeName,
		     types->TypeName);

	       fprintf(file,"#define Print%s(ptr) ",
		       types->TypeName);
	       fprintf(file,"     printf(%c%s%cn%c,*ptr);\n",
					quote,
					types->PrintType,
					slash,quote);

	       fprintf(file,
			"#define WriteBin%s(ptr,link)%c\n",
			 types->TypeName,
			 slash);
	       fprintf(file,"          WriteBin(ptr,%sSize,link);\n",
			 types->TypeName);
	       fprintf(file,"\n");

	       fprintf(file,
			"#define ReadBin%s(new,link)%c\n",
			 types->TypeName,
			 slash);
	       fprintf(file,"          ReadBin(new,%sSize,link);\n",
			 types->TypeName);
	       fprintf(file,"\n");

	       fprintf(file,
			"#define WriteJSON%s(ptr) cJSON_CreateNumber((double)*(ptr))\n",
			 types->TypeName);
	       fprintf(file,"\n");

	       fprintf(file,
			"#define ReadJSON%s(new,json_item) if(cJSON_IsNumber(json_item)) *(new) = (int)(json_item)->valuedouble\n",
			 types->TypeName);
	       fprintf(file,"\n");
	       }
	  types++;
	  }
}


static void OutputStructureComments(StructureSet *set, FILE *file)
{
StructDefinition *structure;
INT i;

     fprintf(file,"/*------------------------------------------*/\n");
     fprintf(file,"/*   %s   */\n",set->Comment);
     fprintf(file,"/* Structure:%d:%s\n\n",set->ID,set->StructureName);

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  fprintf(file,"     %20s --(%s) %s\n",structure->ElementName,
						 structure->TypeName,
						 structure->Name);
	  structure++;
	  }
     fprintf(file,"*/\n");
}


static void OutputStructureDef(StructureSet *set, FILE *file)
{
StructDefinition *structure;
INT i;

     fprintf(file,"typedef struct %s %s;\n",
	     set->Name,
	     set->StructureName);
     fprintf(file,"struct %s {\n",set->Name);

     fprintf(file,"     INT ID;\n");
     fprintf(file,"     CHAR *Name;\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  OutputVarType(structure,file,"     ");
	  fprintf(file,";\n");
	  structure++;
	  }
fprintf(file,"     };\n");

}

static void OutputVarType(StructDefinition *structure, FILE *file, CHAR *blanks)
     {
     CHAR pntr,*ret;
     CHAR *Void;
     
     Void = CopyString("void");
     
     if( structure->Pointer == ON)
	  pntr = '*';
     else
	  pntr = ' ';
     switch(structure->Type)
	  {
	  case TypeFUNCTION:
	       if(structure->Return == 0)
		    ret = Void;
	       else
		    ret = structure->Return;
	       fprintf(file,"%s%s %c(*%s)()",
		       blanks,
		       ret,
		       pntr,
		       structure->ElementName);
	       break;
	  default:
	       fprintf(file,"%s%s %c%s",
			    blanks,
			    structure->TypeName,
			    pntr,
			    structure->ElementName);
	       break;
	  }
     Free(Void);
     }

static void OutputStandardDefs(StructureSet *set, FILE *file)
     {
     CHAR *name;
     
     name = set->StructureName;

     OutputDefsFromName(name,file);

     }
static void OutputDefsFromName(CHAR *name, FILE *file)
{
     fprintf(file,"#define %sSize sizeof(%s)\n",name,name);
     fprintf(file,"#define Allocate%s (%s *) Malloc(%sSize)\n",name,name,name);
     fprintf(file,"#define AllocArray%s(n) (%s *) Calloc(n,%sSize)\n",
			 name,name,name);
     fprintf(file,"#define %sPntrSize sizeof(%s **)\n",name,name);
     fprintf(file,"#define AllocPntrArray%s(n) (%s **) Calloc(n,%sPntrSize)\n",
			 name,name,name);
     fprintf(file,"#define SingCopy%s(out,in) memcpy(out,in,%sSize)\n",
			 name,name);
}

static void OutputCreateRoutine(StructureSet *set, FILE *file)
{
StructDefinition *structure;
INT i;


     fprintf(file,"\n");
     OutputCreateFuncName(set,file);
     fprintf(file,"\n{\n");

     OutputPreamble(set,file);

     fprintf(file,"     newstruct->Name = CopyNAME(name);\n");
     fprintf(file,"     newstruct->ID   = id;\n");
     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Create == ON &&
	     structure->Pointer == OFF)
	       {
	       fprintf(file,"     newstruct->%s = %s;\n",
			    structure->ElementName,
			    structure->ElementName);
	       }
	  structure++;
	  }

     OutputFunction(set,file,"CopyFull",ON);

     OutputLoopFunction(set,file,"CopyFull",ON);

     fprintf(file,"\n     return(newstruct);\n");
     fprintf(file,"}\n");
     fprintf(file,"\n");
}

static void OutputCreateFuncName(StructureSet *set, FILE *file)
{
CHAR *name;
StructDefinition *structure;
INT i,length;

     name = set->StructureName;
     length = strlen(Blanks) - (2 * strlen(name) + 9);

     fprintf(file,"extern %s *Create%s(%s *newstruct,\n",name,name,name);
     fprintf(file,"%sINT id,\n",&(Blanks[length]));
     fprintf(file,"%sCHAR *name",&(Blanks[length]));

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Create == ON)
	       {
	       fprintf(file,",\n");
	       OutputVarType(structure,file,&(Blanks[length]));
	       }
	  structure++;
	  }
     fprintf(file,")");
}

static void OutputStaticDefinitions(StructureSet *set, FILE *file)
{
CHAR *name;

     OutputCreateFuncName(set,file);
     fprintf(file,";\n");

     name = set->StructureName;

     fprintf(file,"\n");
     fprintf(file,"extern CHAR *GetName%s(%s *str);\n",name,name);
     fprintf(file,"extern INT  GetID%s(%s *str);\n",name,name);
     fprintf(file,"extern void Print%s(%s *eleptr);\n",name,name);
     fprintf(file,"extern void Free%s(%s *eleptr);\n",name,name);
     fprintf(file,"extern void *Alloc%s();\n",name);
     fprintf(file,"extern void WriteBin%s(%s *eleptr, DbaseLinkedList *file);\n",
		   name,name);
     fprintf(file,"extern INT ReadBin%s(%s *eleptr, DbaseLinkedList *file);\n",
		   name,name);
     fprintf(file,"extern cJSON *WriteJSON%s(%s *eleptr);\n",
		   name,name);
     fprintf(file,"extern INT ReadJSON%s(%s *eleptr, cJSON *json_obj);\n",
		   name,name);
     fprintf(file,"extern CHAR *WriteJSON%sToString(%s *eleptr);\n",
		   name,name);
     fprintf(file,"extern INT ReadJSON%sFromString(%s *eleptr, CHAR *json_str);\n",
		   name,name);
     fprintf(file,"extern void xdr_%s(XDR *stream, char **eleptr);\n",
		   name);
     fprintf(file,"extern void CopyFull%s(%s *newstruct, %s *oldstruct);\n",
		   name,name,name);
}

static void OutputAllocRoutine(StructureSet *set, FILE *file)
{
CHAR *name;

     name = set->StructureName;

     fprintf(file,"\nextern void *Alloc%s()\n",name);
     fprintf(file,"{\n");
     fprintf(file,"     return((void *) Allocate%s);\n",name);
     fprintf(file,"}\n");
}

static void OutputNameIDRoutines(StructureSet *set, FILE *file)
{
CHAR *name;

     name = set->StructureName;

     fprintf(file,"\nextern CHAR *GetName%s(%s *str)\n",name,name);
     fprintf(file,"{\n");
     fprintf(file,"     return(str->Name);\n");
     fprintf(file,"}\n");

     fprintf(file,"\nextern INT GetID%s(%s *str)\n",name,name);
     fprintf(file,"{\n");
     fprintf(file,"     return(str->ID);\n");
     fprintf(file,"}\n");

}

static void OutputCopyRoutine(StructureSet *set, FILE *file)
{
CHAR *name;

     name = set->StructureName;

     fprintf(file,"\nextern void CopyFull%s(%s *newstruct, %s *oldstruct)\n",
		   name,name,name);
     fprintf(file,"{\n");

     OutputPreamble(set,file);

     fprintf(file,"     newstruct->ID = oldstruct->ID;\n");
     fprintf(file,"     newstruct->Name = CopyNAME(oldstruct->Name);\n");

     OutputAssign(set,file);

     OutputFunction(set,file,"CopyFull",OFF);

     OutputLoopFunction(set,file,"CopyFull",OFF);

     fprintf(file,"}\n");

}




static void OutputPreamble(StructureSet *set, FILE *file)
{
StructDefinition *structure;
INT i;
INT flag;

     structure = set->Structures;
     flag = 0;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Pointer == ON &&
	     structure->Array != NULL)
	       {
	       fprintf(file,"%s *old%s,*new%s;\n",
			    structure->TypeName,
			    structure->ElementName,
			    structure->ElementName);
	       flag = 1;
	       }
	  structure++;
	  }
     if(flag == 0)
	  fprintf(file,"\n");
     else
	  fprintf(file,"INT i;\n\n");
}

static void OutputAssign(StructureSet *set, FILE *file)
{
StructDefinition *structure;
INT i;

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Pointer == OFF)
	       {
	       fprintf(file,"     newstruct->%s = oldstruct->%s;\n",
			    structure->ElementName,
			    structure->ElementName);
	       }
	  structure++;
	  }

     fprintf(file,"\n");

}

static void OutputFunction(StructureSet *set, FILE *file, CHAR *func, INT create)
     {
     StructDefinition *structure;
     INT i;
     CHAR *str;
     static CHAR StrStruct[]="oldstruct->";
     static CHAR null = '\0';
     
     if(create == ON)
	  str = CopyString("");
     else
	  str = CopyString("oldstruct->");
     
     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if((structure->Create == ON || create == OFF) &&
	     structure->Type != TypeFUNCTION &&
	     structure->Pointer == ON &&
	     structure->Array == NULL)
	       {
	       fprintf(file,"     if(%s%s != 0)\n",
		       str,
		       structure->ElementName);
	       fprintf(file,"          {\n");
	       fprintf(file,"          newstruct->%s = Allocate%s;\n",
		       structure->ElementName,
		       structure->TypeName);
	       fprintf(file,"          %s%s(newstruct->%s, %s%s);\n",
		       func,
		       structure->TypeName,
		       structure->ElementName,
		       str,
		       structure->ElementName);
	       fprintf(file,"          }\n");
	       fprintf(file,"     else\n");
	       fprintf(file,"          newstruct->%s = 0;\n",
		       structure->ElementName);
	       
	       }
	  structure++;
	  }
     fprintf(file,"\n");
     }

static void OutputLoopFunction(StructureSet *set, FILE *file,
			CHAR *func, INT create)
     {
     StructDefinition *structure;
     INT i;
     CHAR *str;
     
     if(create == ON)
	  str = CopyString("");
     else
	  str = CopyString("oldstruct->");
     
     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if((structure->Create == ON || create == OFF) &&
	     structure->Type != TypeFUNCTION &&
	     structure->Array != NULL)
	       {
	       fprintf(file,"     newstruct->%s = AllocArray%s",
			    structure->ElementName,
			    structure->TypeName);
	       fprintf(file,"(newstruct->%s);\n",
			    structure->Array);
	       fprintf(file,"     if(%s%s != 0)\n",
			    str,
			    structure->ElementName);
	       fprintf(file,"          {\n");
	       if(create == ON)
		    fprintf(file,"          old%s = %s;\n",
			    structure->ElementName,
			    structure->ElementName);
	       else
		    fprintf(file,"          old%s = oldstruct->%s;\n",
			    structure->ElementName,
			    structure->ElementName);
	       fprintf(file,"          new%s = newstruct->%s;\n",
			    structure->ElementName,
			    structure->ElementName);

	       fprintf(file,"          LOOPi(newstruct->%s)\n",
			    structure->Array);
	       fprintf(file,"               %s%s(new%s++, old%s++);\n",
			    func,
			    structure->TypeName,
			    structure->ElementName,
			    structure->ElementName);
	       fprintf(file,"          }\n");
	       fprintf(file,"\n");
	       }

	  structure++;
	  }
     Free(str);
     
     fprintf(file,"\n");
     }

static void OutputPrintRoutine(StructureSet *set, FILE *file)
{
CHAR quote = '"';
CHAR slash = 92;
StructDefinition *structure;
StructureType *type;
INT i;
INT flag;

     fprintf(file,"extern void Print%s(%s *eleptr)\n",
	    set->StructureName,
	    set->StructureName);

     fprintf(file,"{\n");

     structure = set->Structures;
     flag = 0;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	     structure->Array != NULL)
	       {
	       fprintf(file,"%s *ptr%s;\n",
			    structure->TypeName,
			    structure->ElementName);
	       flag = 1;
	       }
	  structure++;
	  }
     if(flag == 0)
	  fprintf(file,"\n");
     else
	  fprintf(file,"INT i;\n\n");

     fprintf(file,"     if(eleptr == 0) return;\n");

     fprintf(file,"     printf(\"ID  :%%20d\\n\",eleptr->ID);\n");
     fprintf(file,"     printf(\"Name:%%20s\\n\",eleptr->Name);\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Type != -1 &&
	     structure->Type != TypeFUNCTION &&
	     structure->Pointer == OFF)
	       {
	       fprintf(file,"     printf(%c%20s:%c);\n",
		       quote,structure->Name,quote);
	       type = &(Types[structure->Type]);
	       fprintf(file,"     printf(%c%s%cn%c,eleptr->%s);\n"
					,quote,
					type->PrintType,
					slash,
					quote,
					structure->ElementName);
	       }
	  structure++;
	  }
     fprintf(file,"\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array == NULL)
	       {
	       fprintf(file,"     printf(%c%20s:%cn%c);\n",
		       quote,structure->Name,slash,quote);
	       fprintf(file,"     Print%s(eleptr->%s);\n",
			    structure->TypeName,
			    structure->ElementName);
	       fprintf(file,"\n");
	       }
	  structure++;
	  }

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array != NULL)
	       {
	       fprintf(file,"     printf(%c%20s:%cn%c);\n",
		       quote,structure->Name,slash,quote);
	       fprintf(file,"     if(eleptr->%s != 0)\n",
			    structure->ElementName);
	       fprintf(file,"          {\n");
	       fprintf(file,"          ptr%s = eleptr->%s;\n",
			    structure->ElementName,
			    structure->ElementName);

	       fprintf(file,"          LOOPi(eleptr->%s)\n",
				       structure->Array);
	       fprintf(file,"               Print%s(ptr%s++);\n",
			    structure->TypeName,
			    structure->ElementName);
	       fprintf(file,"          }\n");
	       fprintf(file,"\n");
	       fprintf(file,"\n");
	       }
	  structure++;
	  }

     fprintf(file,"}\n");
}

static void OutputFreeRoutine(StructureSet *set, FILE *file)
{
StructDefinition *structure;
INT i;
INT flag;
INT t;

     fprintf(file,"extern void Free%s(%s *eleptr)\n",
	    set->StructureName,
	    set->StructureName);

     fprintf(file,"{\n");

     structure = set->Structures;
     flag = 0;
     LOOPi(set->NumberOfStructures)
	  {
/*	  if(structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	     structure->Array != NULL)
*/
	  if(structure->Array != NULL &&
	     structure->Type == -1)
	       {
	       fprintf(file,"%s *ptr%s;\n",
			    structure->TypeName,
			    structure->ElementName);

	       flag = 1;
	       }
	  structure++;
	  }
     if(flag == 0)
	  fprintf(file,"\n");
     else
	  fprintf(file,"INT i;\n\n");


     fprintf(file,"     if(eleptr == 0) return;\n");
     fprintf(file,"     Free(eleptr->Name);\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array != NULL)
	       {
	       t = structure->Type;
	       if(t == -1)
		    flag = ON;
	       else
		   {
		   if((Types[t]).Simple == ON)
			flag = OFF;
		   else
			flag = ON;
		   }
	       if(flag == ON)
		    {
		    fprintf(file,"     ptr%s = eleptr->%s;\n",
			    structure->ElementName,
			    structure->ElementName);

		    fprintf(file,"     LOOPi(eleptr->%s)\n",
				       structure->Array);
		    fprintf(file,"          Free%s(ptr%s++);\n",
			    structure->TypeName,
			    structure->ElementName);
		    }
	       fprintf(file,"     Free(eleptr->%s);\n",
			    structure->ElementName);
	       fprintf(file,"\n");
	       }
	  structure++;
	  }

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array == NULL)
	       {
	       t = structure->Type;
	       if(t == -1)
		    flag = ON;
	       else
		   {
		   if((Types[t]).Simple == ON)
			flag = OFF;
		   else
			flag = ON;
		   }
	       if( flag == ON )
    		    fprintf(file,"     Free%s(eleptr->%s);\n",
	                         structure->TypeName,
                             structure->ElementName);
        
	       if(flag == OFF || t == -1)
                fprintf(file,"     Free(eleptr->%s);\n",
			            structure->ElementName);
	       fprintf(file,"\n");
	       }
	  structure++;
	  }

     fprintf(file,"}\n");
}

static void OutputWriteBinRoutine(StructureSet *set, FILE *file)
     {
     StructDefinition *structure;
     INT i;
     INT flag;
     CHAR *func;

     func = CopyString("WriteBin");
     

     fprintf(file,"extern void %s%s(%s *eleptr, DbaseLinkedList *file)\n",
	    func,
	    set->StructureName,
	    set->StructureName);

     fprintf(file,"{\n");

     structure = set->Structures;
     flag = 0;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Pointer == ON &&
	     structure->Array != NULL)
	       {
	       fprintf(file,"%s *ptr%s;\n",
			    structure->TypeName,
			    structure->ElementName);
	       flag = 1;
	       }
	  structure++;
	  }
     if(flag == 0)
	  fprintf(file,"\n");
     else
	  fprintf(file,"INT i;\n\n");


     fprintf(file,"     if(eleptr == 0)\n");
     fprintf(file,"           {\n");
     fprintf(file,"           WriteBinINT(&(NoStructureCode),file);\n");
     fprintf(file,"           return;\n");
     fprintf(file,"           }\n");
     
     fprintf(file,"     WriteBinINT(&(eleptr->ID),file);\n");
     fprintf(file,"     WriteBinNAME(&(eleptr->Name),file);\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Type != -1 &&
	     structure->Type != TypeFUNCTION &&
	     structure->Pointer == OFF)
	       {
	       fprintf(file,"     %s%s(&(eleptr->%s),file);\n",
			    func,
			    structure->TypeName,
			    structure->ElementName);
	       }
	  structure++;
	  }
     fprintf(file,"\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array == NULL)
	       {
	       fprintf(file,"     %s%s(eleptr->%s,file);\n",
			    func,
			    structure->TypeName,
			    structure->ElementName);
	       fprintf(file,"\n");
	       }
	  structure++;
	  }

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array != NULL)
	       {
	       fprintf(file,"     if(eleptr->%s != 0)\n",
			    structure->ElementName);
	       fprintf(file,"          {\n");
	       fprintf(file,"          ptr%s = eleptr->%s;\n",
			    structure->ElementName,
			    structure->ElementName);

	       fprintf(file,"          LOOPi(eleptr->%s)\n",
				       structure->Array);
	       fprintf(file,"               %s%s(ptr%s++,file);\n",
			    func,
			    structure->TypeName,
			    structure->ElementName);
	       fprintf(file,"          }\n");
	       fprintf(file,"\n");
	       }
	  structure++;
	  }

     fprintf(file,"}\n");
     Free(func);
     
     }


static void OutputReadBinRoutine(StructureSet *set, FILE *file)
     {
     StructDefinition *structure;
     INT i;
     INT flag;
     CHAR *func;
     
     func = CopyString("ReadBin");
     
     fprintf(file,"extern INT %s%s(%s *eleptr,DbaseLinkedList *file)\n",
	    func,
	    set->StructureName,
	    set->StructureName);

     fprintf(file,"     {\n");

     structure = set->Structures;
     flag = 0;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	     structure->Array != NULL)
	       {
	       fprintf(file,"%s *ptr%s;\n",
			    structure->TypeName,
			    structure->ElementName);
	       flag = 1;
	       }
	  structure++;
	  }
     if(flag == 0)
	  fprintf(file,"\n");
     else
	  fprintf(file,"INT i;\n\n");


     fprintf(file,"     ReadBinINT(&(eleptr->ID),file);\n");
     fprintf(file,"     if(eleptr->ID == NO_STRUCTURE_CODE)\n");
     fprintf(file,"            {\n");
     fprintf(file,"             return(NO_STRUCTURE_CODE);\n");
     fprintf(file,"            }\n");

     fprintf(file,"     ReadBinNAME(&(eleptr->Name),file);\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Type != -1 &&
	     structure->Type != TypeFUNCTION &&
	     structure->Pointer == OFF)
	       {
	       fprintf(file,"     %s%s(&(eleptr->%s),file);\n",
			    func,
			    structure->TypeName,
			    structure->ElementName);
	       }
	  structure++;
	  }
     fprintf(file,"\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array == NULL)
	       {
	       fprintf(file,"     eleptr->%s = Allocate%s;\n",
			    structure->ElementName,
			    structure->TypeName);
	       fprintf(file,"     if(%s%s(eleptr->%s,file) == NO_STRUCTURE_CODE)\n",
			    func,
			    structure->TypeName,
			    structure->ElementName);
	       fprintf(file,"           {\n");
	       fprintf(file,"           Free(eleptr->%s);\n",
		       structure->ElementName);
	       fprintf(file,"           eleptr->%s = 0;\n",
		       structure->ElementName);
	       fprintf(file,"           }\n");
	       fprintf(file,"\n");
	       }
	  structure++;
	  }

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array != NULL)
	       {
	       fprintf(file,"          eleptr->%s = AllocArray%s",
			    structure->ElementName,
			    structure->TypeName);
	       fprintf(file,"(eleptr->%s);\n",
			    structure->Array);
	       fprintf(file,"          ptr%s = eleptr->%s;\n",
			    structure->ElementName,
			    structure->ElementName);

	       fprintf(file,"          LOOPi(eleptr->%s)\n",
				       structure->Array);
	       fprintf(file,"               %s%s(ptr%s++,file);\n",
			    func,
			    structure->TypeName,
			    structure->ElementName);
	       fprintf(file,"\n");
	       }
	  structure++;
	  }

     Free(func);
     fprintf(file,"     return(STRUCTURE_READ);\n");
     fprintf(file,"     }\n");
     }

static void OutputXDRBinRoutine(StructureSet *set, FILE *file)
     {
     StructDefinition *structure;
     INT i;
     INT flag;
     CHAR *func;
     
     func = CopyString("xdr_");
     fprintf(file,"extern void %s%s(XDR *stream, char **eleptrp)\n",
	     func,
	     set->StructureName);
     
     fprintf(file,"{\n");

     fprintf(file,"     %s *eleptr;\n",
	     set->StructureName);
/*
     structure = set->Structures;
     flag = 0;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	     structure->Array != NULL)
	       {
	       fprintf(file,"%s *ptr%s;\n",
			    structure->TypeName,
			    structure->ElementName);
	       flag = 1;
	       }
	  structure++;
	  }
     if(flag == 0)
	  fprintf(file,"\n");
     else
	  fprintf(file,"INT i;\n\n");
*/
     fprintf(file,"     eleptr = (%s *) eleptrp;\n",
	     set->StructureName);

     fprintf(file,"     xdr_INT(stream,(char **) &(eleptr->ID));\n");
     fprintf(file,"     if(eleptr->ID == NO_STRUCTURE_CODE)\n");
     fprintf(file,"            {\n");
     fprintf(file,"             eleptr = 0;\n");
     fprintf(file,"             return;\n");
     fprintf(file,"            }\n");

     fprintf(file,"     xdr_NAME(stream,(char **) &(eleptr->Name));\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if(structure->Type != -1 &&
	     structure->Type != TypeFUNCTION &&
	     structure->Pointer == OFF)
	       {
	       fprintf(file,"     %s%s(stream,(char **) &(eleptr->%s));\n",
			    func,
			    structure->TypeName,
			    structure->ElementName);
	       }
	  structure++;
	  }
     fprintf(file,"\n");

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array == NULL)
	       {

	       fprintf(file,"     xdr_pointer(stream,\n");
	       fprintf(file,"          (char **) &(eleptr->%s),\n",
		       structure->ElementName);
	       fprintf(file,"          %sSize,\n",
		       structure->TypeName);
	       fprintf(file,"                 (xdrproc_t) xdr_%s);\n",
		       structure->TypeName);
	       }
	  structure++;
	  }

     structure = set->Structures;
     LOOPi(set->NumberOfStructures)
	  {
	  if( structure->Pointer == ON &&
	     structure->Type != TypeFUNCTION &&
	      structure->Array != NULL)
	       {
	       fprintf(file,"     xdr_array(stream,(char **) &(eleptr->%s),\n",
		       structure->ElementName);
	       fprintf(file,"             (uint *) &(eleptr->%s),eleptr->%s,\n",
		       structure->Array,
		       structure->Array);
	       fprintf(file,"               %sSize,(xdrproc_t) xdr_%s);\n",
		       structure->TypeName,
		       structure->TypeName);
	       }
	  structure++;
	  }

     fprintf(file,"}\n");
     Free(func);
     }

static void OutputWriteJSONRoutine(StructureSet *set, FILE *file)
{
    StructDefinition *structure;
    INT i, flag;
    CHAR *name = set->StructureName;

    fprintf(file, "extern cJSON *WriteJSON%s(%s *eleptr)\n{\n", name, name);
    fprintf(file, "     cJSON *obj, *arr;\n");

    structure = set->Structures;
    flag = 0;
    LOOPi(set->NumberOfStructures) {
        if (structure->Pointer == ON && structure->Type != TypeFUNCTION && structure->Array != NULL) {
            fprintf(file, "     %s *ptr%s;\n", structure->TypeName, structure->ElementName);
            flag = 1;
        }
        structure++;
    }
    if (flag != 0) fprintf(file, "     INT i;\n");
    fprintf(file, "\n");

    fprintf(file, "     if(eleptr == NULL) return cJSON_CreateNull();\n");
    fprintf(file, "     obj = cJSON_CreateObject();\n");
    fprintf(file, "     if(obj == NULL) return NULL;\n\n");

    fprintf(file, "     cJSON_AddNumberToObject(obj, \"ID\", eleptr->ID);\n");
    fprintf(file, "     if(eleptr->Name != NULL)\n");
    fprintf(file, "          cJSON_AddStringToObject(obj, \"Name\", eleptr->Name);\n");
    fprintf(file, "     else\n");
    fprintf(file, "          cJSON_AddNullToObject(obj, \"Name\");\n\n");

    /* Single non-pointer primitives */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Type != -1 && structure->Type != TypeFUNCTION && structure->Pointer == OFF && structure->Array == NULL) {
            if (structure->Type == TypeINT || structure->Type == TypeBYTE) {
                fprintf(file, "     cJSON_AddNumberToObject(obj, \"%s\", eleptr->%s);\n",
                        structure->ElementName, structure->ElementName);
            } else if (structure->Type == TypeFLOAT) {
                fprintf(file, "     cJSON_AddNumberToObject(obj, \"%s\", eleptr->%s);\n",
                        structure->ElementName, structure->ElementName);
            } else if (structure->Type == TypeCHAR) {
                fprintf(file, "     {\n");
                fprintf(file, "     char str[2] = { eleptr->%s, 0 };\n", structure->ElementName);
                fprintf(file, "     cJSON_AddStringToObject(obj, \"%s\", str);\n", structure->ElementName);
                fprintf(file, "     }\n");
            } else if (structure->Type == TypeFILE) {
                fprintf(file, "     cJSON_AddNullToObject(obj, \"%s\");\n", structure->ElementName);
            }
        }
        structure++;
    }

    /* Single pointer primitives (including STRING, NAME, SYMBOL, and INT*, FLOAT* pointers) */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Type != -1 && structure->Type != TypeFUNCTION && structure->Pointer == ON && structure->Array == NULL) {
            if (structure->Type == TypeSTRING || structure->Type == TypeNAME || structure->Type == TypeSYMBOL) {
                fprintf(file, "     if(eleptr->%s != NULL)\n", structure->ElementName);
                fprintf(file, "          cJSON_AddStringToObject(obj, \"%s\", eleptr->%s);\n",
                        structure->ElementName, structure->ElementName);
                fprintf(file, "     else\n");
                fprintf(file, "          cJSON_AddNullToObject(obj, \"%s\");\n", structure->ElementName);
            } else if (structure->Type == TypeINT || structure->Type == TypeBYTE) {
                fprintf(file, "     if(eleptr->%s != NULL)\n", structure->ElementName);
                fprintf(file, "          cJSON_AddNumberToObject(obj, \"%s\", *(eleptr->%s));\n",
                        structure->ElementName, structure->ElementName);
                fprintf(file, "     else\n");
                fprintf(file, "          cJSON_AddNullToObject(obj, \"%s\");\n", structure->ElementName);
            } else if (structure->Type == TypeFLOAT) {
                fprintf(file, "     if(eleptr->%s != NULL)\n", structure->ElementName);
                fprintf(file, "          cJSON_AddNumberToObject(obj, \"%s\", *(eleptr->%s));\n",
                        structure->ElementName, structure->ElementName);
                fprintf(file, "     else\n");
                fprintf(file, "          cJSON_AddNullToObject(obj, \"%s\");\n", structure->ElementName);
            } else if (structure->Type == TypeFILE) {
                fprintf(file, "     cJSON_AddNullToObject(obj, \"%s\");\n", structure->ElementName);
            }
        }
        structure++;
    }

    /* Array primitives */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Type != -1 && structure->Type != TypeFUNCTION && structure->Array != NULL) {
            fprintf(file, "     if(eleptr->%s != NULL)\n", structure->ElementName);
            fprintf(file, "          {\n");
            fprintf(file, "          arr = cJSON_CreateArray();\n");
            fprintf(file, "          ptr%s = eleptr->%s;\n", structure->ElementName, structure->ElementName);
            fprintf(file, "          LOOPi(eleptr->%s)\n", structure->Array);
            fprintf(file, "               cJSON_AddItemToArray(arr, WriteJSON%s(ptr%s++));\n",
                    structure->TypeName, structure->ElementName);
            fprintf(file, "          cJSON_AddItemToObject(obj, \"%s\", arr);\n", structure->ElementName);
            fprintf(file, "          }\n");
        }
        structure++;
    }

    /* Single custom structures */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Pointer == ON && structure->Type == -1 && structure->Type != TypeFUNCTION && structure->Array == NULL) {
            fprintf(file, "     cJSON_AddItemToObject(obj, \"%s\", WriteJSON%s(eleptr->%s));\n",
                    structure->ElementName, structure->TypeName, structure->ElementName);
        }
        structure++;
    }

    /* Array custom structures */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Pointer == ON && structure->Type == -1 && structure->Type != TypeFUNCTION && structure->Array != NULL) {
            fprintf(file, "     if(eleptr->%s != NULL)\n", structure->ElementName);
            fprintf(file, "          {\n");
            fprintf(file, "          arr = cJSON_CreateArray();\n");
            fprintf(file, "          ptr%s = eleptr->%s;\n", structure->ElementName, structure->ElementName);
            fprintf(file, "          LOOPi(eleptr->%s)\n", structure->Array);
            fprintf(file, "               cJSON_AddItemToArray(arr, WriteJSON%s(ptr%s++));\n",
                    structure->TypeName, structure->ElementName);
            fprintf(file, "          cJSON_AddItemToObject(obj, \"%s\", arr);\n", structure->ElementName);
            fprintf(file, "          }\n");
        }
        structure++;
    }

    fprintf(file, "\n     return obj;\n}\n\n");

    fprintf(file, "extern CHAR *WriteJSON%sToString(%s *eleptr)\n{\n", name, name);
    fprintf(file, "     cJSON *json = WriteJSON%s(eleptr);\n", name);
    fprintf(file, "     CHAR *str = NULL;\n");
    fprintf(file, "     if(json != NULL)\n");
    fprintf(file, "          {\n");
    fprintf(file, "          str = cJSON_Print(json);\n");
    fprintf(file, "          cJSON_Delete(json);\n");
    fprintf(file, "          }\n");
    fprintf(file, "     return str;\n}\n\n");
}

static void OutputReadJSONRoutine(StructureSet *set, FILE *file)
{
    StructDefinition *structure;
    INT i, flag;
    CHAR *name = set->StructureName;

    fprintf(file, "extern INT ReadJSON%s(%s *eleptr, cJSON *json_obj)\n{\n", name, name);
    fprintf(file, "     cJSON *item, *arr_item;\n");

    structure = set->Structures;
    flag = 0;
    LOOPi(set->NumberOfStructures) {
        if (structure->Pointer == ON && structure->Type != TypeFUNCTION && structure->Array != NULL) {
            fprintf(file, "     %s *ptr%s;\n", structure->TypeName, structure->ElementName);
            flag = 1;
        }
        structure++;
    }
    if (flag != 0) fprintf(file, "     INT i;\n");
    fprintf(file, "\n");

    fprintf(file, "     if(json_obj == NULL || cJSON_IsNull(json_obj) || eleptr == NULL)\n");
    fprintf(file, "          return NO_STRUCTURE_CODE;\n\n");

    fprintf(file, "     item = cJSON_GetObjectItemCaseSensitive(json_obj, \"ID\");\n");
    fprintf(file, "     if(cJSON_IsNumber(item)) eleptr->ID = item->valueint;\n");
    fprintf(file, "     if(eleptr->ID == NO_STRUCTURE_CODE) return NO_STRUCTURE_CODE;\n\n");

    fprintf(file, "     item = cJSON_GetObjectItemCaseSensitive(json_obj, \"Name\");\n");
    fprintf(file, "     if(cJSON_IsString(item) && item->valuestring != NULL)\n");
    fprintf(file, "          eleptr->Name = CopyString(item->valuestring);\n\n");

    /* Single non-pointer primitives */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Type != -1 && structure->Type != TypeFUNCTION && structure->Pointer == OFF && structure->Array == NULL) {
            fprintf(file, "     item = cJSON_GetObjectItemCaseSensitive(json_obj, \"%s\");\n", structure->ElementName);
            if (structure->Type == TypeINT || structure->Type == TypeBYTE) {
                fprintf(file, "     if(cJSON_IsNumber(item)) eleptr->%s = item->valueint;\n", structure->ElementName);
            } else if (structure->Type == TypeFLOAT) {
                fprintf(file, "     if(cJSON_IsNumber(item)) eleptr->%s = (FLOAT)item->valuedouble;\n", structure->ElementName);
            } else if (structure->Type == TypeCHAR) {
                fprintf(file, "     if(cJSON_IsString(item) && item->valuestring != NULL) eleptr->%s = item->valuestring[0];\n", structure->ElementName);
            } else if (structure->Type == TypeFILE) {
                fprintf(file, "     eleptr->%s = NULL;\n", structure->ElementName);
            }
        }
        structure++;
    }

    /* Single pointer primitives */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Type != -1 && structure->Type != TypeFUNCTION && structure->Pointer == ON && structure->Array == NULL) {
            fprintf(file, "     item = cJSON_GetObjectItemCaseSensitive(json_obj, \"%s\");\n", structure->ElementName);
            if (structure->Type == TypeSTRING || structure->Type == TypeNAME || structure->Type == TypeSYMBOL) {
                fprintf(file, "     if(cJSON_IsString(item) && item->valuestring != NULL) eleptr->%s = CopyString(item->valuestring);\n", structure->ElementName);
            } else if (structure->Type == TypeINT || structure->Type == TypeBYTE) {
                fprintf(file, "     if(cJSON_IsNumber(item)) { eleptr->%s = AllocateINT; *(eleptr->%s) = item->valueint; }\n",
                        structure->ElementName, structure->ElementName);
            } else if (structure->Type == TypeFLOAT) {
                fprintf(file, "     if(cJSON_IsNumber(item)) { eleptr->%s = AllocateFLOAT; *(eleptr->%s) = (FLOAT)item->valuedouble; }\n",
                        structure->ElementName, structure->ElementName);
            } else if (structure->Type == TypeFILE) {
                fprintf(file, "     eleptr->%s = NULL;\n", structure->ElementName);
            }
        }
        structure++;
    }

    /* Array primitives */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Type != -1 && structure->Type != TypeFUNCTION && structure->Array != NULL) {
            fprintf(file, "     item = cJSON_GetObjectItemCaseSensitive(json_obj, \"%s\");\n", structure->ElementName);
            fprintf(file, "     if(cJSON_IsArray(item))\n");
            fprintf(file, "          {\n");
            fprintf(file, "          eleptr->%s = cJSON_GetArraySize(item);\n", structure->Array);
            fprintf(file, "          eleptr->%s = AllocArray%s(eleptr->%s);\n",
                    structure->ElementName, structure->TypeName, structure->Array);
            fprintf(file, "          ptr%s = eleptr->%s;\n", structure->ElementName, structure->ElementName);
            fprintf(file, "          cJSON_ArrayForEach(arr_item, item)\n");
            fprintf(file, "               {\n");
            fprintf(file, "               ReadJSON%s(ptr%s++, arr_item);\n", structure->TypeName, structure->ElementName);
            fprintf(file, "               }\n");
            fprintf(file, "          }\n");
        }
        structure++;
    }

    /* Single custom structures */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Pointer == ON && structure->Type == -1 && structure->Type != TypeFUNCTION && structure->Array == NULL) {
            fprintf(file, "     item = cJSON_GetObjectItemCaseSensitive(json_obj, \"%s\");\n", structure->ElementName);
            fprintf(file, "     if(item != NULL && !cJSON_IsNull(item))\n");
            fprintf(file, "          {\n");
            fprintf(file, "          eleptr->%s = Allocate%s;\n", structure->ElementName, structure->TypeName);
            fprintf(file, "          if(ReadJSON%s(eleptr->%s, item) == NO_STRUCTURE_CODE)\n", structure->TypeName, structure->ElementName);
            fprintf(file, "               {\n");
            fprintf(file, "               Free(eleptr->%s);\n", structure->ElementName);
            fprintf(file, "               eleptr->%s = NULL;\n", structure->ElementName);
            fprintf(file, "               }\n");
            fprintf(file, "          }\n");
        }
        structure++;
    }

    /* Array custom structures */
    structure = set->Structures;
    LOOPi(set->NumberOfStructures) {
        if (structure->Pointer == ON && structure->Type == -1 && structure->Type != TypeFUNCTION && structure->Array != NULL) {
            fprintf(file, "     item = cJSON_GetObjectItemCaseSensitive(json_obj, \"%s\");\n", structure->ElementName);
            fprintf(file, "     if(cJSON_IsArray(item))\n");
            fprintf(file, "          {\n");
            fprintf(file, "          eleptr->%s = cJSON_GetArraySize(item);\n", structure->Array);
            fprintf(file, "          eleptr->%s = AllocArray%s(eleptr->%s);\n",
                    structure->ElementName, structure->TypeName, structure->Array);
            fprintf(file, "          ptr%s = eleptr->%s;\n", structure->ElementName, structure->ElementName);
            fprintf(file, "          i = 0;\n");
            fprintf(file, "          cJSON_ArrayForEach(arr_item, item)\n");
            fprintf(file, "               {\n");
            fprintf(file, "               ReadJSON%s(ptr%s++, arr_item);\n", structure->TypeName, structure->ElementName);
            fprintf(file, "               }\n");
            fprintf(file, "          }\n");
        }
        structure++;
    }

    fprintf(file, "\n     return STRUCTURE_READ;\n}\n\n");

    fprintf(file, "extern INT ReadJSON%sFromString(%s *eleptr, CHAR *json_str)\n{\n", name, name);
    fprintf(file, "     cJSON *json;\n");
    fprintf(file, "     INT status;\n");
    fprintf(file, "     if(json_str == NULL) return NO_STRUCTURE_CODE;\n");
    fprintf(file, "     json = cJSON_Parse(json_str);\n");
    fprintf(file, "     if(json == NULL) return NO_STRUCTURE_CODE;\n");
    fprintf(file, "     status = ReadJSON%s(eleptr, json);\n", name);
    fprintf(file, "     cJSON_Delete(json);\n");
    fprintf(file, "     return status;\n}\n\n");
}

