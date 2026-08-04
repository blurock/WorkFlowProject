#define SMALL int

#define ON  1
#define OFF 0

typedef struct strmas {
     INT ID;
     CHAR *Name;
     INT Type;
     CHAR *TypeName;
     CHAR *ElementName;
     FLAG Pointer;
     FLAG Create;
     CHAR *Array;
     CHAR *Return;
     } StructDefinition;

#define StructDefinitionSize sizeof(StructDefinition)
#define AllocateStructDefinition Malloc(StructureDefinitionSize)
#define AllocArrayStructDefinition(n) (StructDefinition *)\
			Calloc(n,StructDefinitionSize)
typedef struct strtyp {
     INT ID;
     CHAR *Name;
     SMALL Type;
     CHAR *TypeName;
     CHAR *PrintType;
     FLAG Simple;
     } StructureType;


typedef struct fileset {
     INT ID;
     CHAR *Name;
     CHAR *Comment;
     INT Flag;
     INT MaxNumberOfStructures;
     INT NumberOfStructures;
     CHAR *StructureName;
     FLAG SysList;
     StructDefinition *Structures;
     CHAR *DefFileName;
     FILE *DefFile;
     CHAR *FileName;
     FILE *File;
     FILE *SysFileC;
     FILE *SysFileH;
     } StructureSet;

#define StructureSetSize sizeof(StructureSet)
#define AllocateStructureSet Malloc(StructureSetSize)

#define NumberOfTypes   9

#define TypeINT         0
#define TypeFLOAT       1
#define TypeCHAR        2
#define TypeSTRING      3
#define TypeLL          4
#define TypeBYTE        5
#define TypeFILE        6
#define TypeSYMBOL      7
#define TypeFUNCTION    8
#define TypeNAME        9

#define NumberOfStructureKeys  4

#define KeyPNTR     0
#define KeyARRAY    1
#define KeyCREATE   2
#define KeyRETURN   3

#define STRUCTURES_ONLY    0
#define SYSTEM_LIST        1
#define BOTH               2
#define SIMPLE             3

extern StructureType Types[];
extern KeyWords TypeKeys[];
extern KeyWords StructureKeys[];
extern CHAR Blanks[];

extern void OutputTypeDefinitions(StructureType *types, FILE *file);
extern void ReadStructureDefinitions(StructureSet *structset,
                                     CHAR *FileLine);
extern void OutputStructureSetdotH(StructureSet *set, FILE *file);
extern void OutputStructureSetdotC(StructureSet *set, FILE *file);
extern void PrintStructure(StructDefinition *structure);
extern void PrintStructureSet(StructureSet *set);
extern void OutputSystemListFiles(StructureSet *set);

