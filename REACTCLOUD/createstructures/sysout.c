#include "basic.h"

#include "strmas.h"

static void OutputSourceRoutine(StructureSet *set, FILE *file);
static void OutputSysLstStructure(StructureSet *set, FILE *file);
static void OutputSysLstStructureExtern(StructureSet *set, FILE *file);
static void OutputExternMaster(StructureSet *set, FILE *file);

extern void OutputSystemListFiles(StructureSet *set)
     {
     OutputExternMaster(set,set->SysFileH);
     OutputSysLstStructureExtern(set,set->SysFileH);

     OutputSourceRoutine(set,set->SysFileC);
     OutputSysLstStructure(set,set->SysFileC);
     }


static void OutputExternMaster(StructureSet *set, FILE *file)
{
CHAR *name;

     if( set->SysList == OFF ) return;

     name = set->StructureName;
     fprintf(file,"extern void **Source%s(MasterStructure *master);\n",name);
}

static void OutputSourceRoutine(StructureSet *set, FILE *file)
{
CHAR *name;

     if( set->SysList == OFF ) return;

     name = set->StructureName;

     fprintf(file,"\nvoid **Source%s(MasterStructure *master)\n",name);
     fprintf(file,"{\n");
     fprintf(file,"     return((void **) &(master->%sElement));\n",name);
     fprintf(file,"}\n");
}

static void OutputSysLstStructureExtern(StructureSet *set, FILE *file)
{
CHAR *name;

     if( set->SysList == OFF ) return;
       
     name = set->StructureName;

     fprintf(file,"extern SystemListStaticInfo SysLst%s;\n",name);
     }

static void OutputSysLstStructure(StructureSet *set, FILE *file)
{
CHAR *name;

     if( set->SysList == OFF ) return;
       
     name = set->StructureName;

     fprintf(file,"SystemListStaticInfo SysLst%s = {\n",name);
     fprintf(file,"      GetID%s,\n",name);
     fprintf(file,"      GetName%s,\n",name);
     fprintf(file,"      CopyFull%s,\n",name);
     fprintf(file,"      Alloc%s,\n",name);
     fprintf(file,"      Free%s,\n",name);
     fprintf(file,"      Print%s,\n",name);
     fprintf(file,"      Source%s,\n",name);
     fprintf(file,"      WriteBin%s,\n",name);
     fprintf(file,"      ReadBin%s\n",name);
     fprintf(file,"      };\n");
     fprintf(file,"\n");

     fprintf(file,"SystemListPair SysPair%s = {\n",name);
     fprintf(file,"      %d,\n",set->ID);
     fprintf(file,"      \"%s\",",name);
     fprintf(file,"      &SysLst%s,\n",name);
     fprintf(file,"      0\n");
     fprintf(file,"      };\n");

     fprintf(file,"\n");
}



