** Purpose of reatestructure
The createstructure executable (defined in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/createstructures) read templates (*.def files in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/struct) to create utility routine files (*.c in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/genc and *.h files in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/genh).

*** Goal
To create two new standard structure routines, given a template (*.def file) to create a JSON object, as a string,  from the structure WriteJSON<Structure> and interpret a JSON string object and return the structure ReadJSON<Structure>. These will be generated from the *.def template as are the other standard structure definition routines.
*** Routines that will be modified:
1. OutputStructureSetdotH and OutputStructureSetdotC are the top level routines to produce the §*.c and *.h files for the structure definitions in the *.def template file.
2. OutputStaticDefinitions(set,file) will output the definitions of the two new standard routines to the files.
3. In the OutputStructureSetdotC routine, you need to call two new routines OutputWriteJSONRoutine and OutputReadJSONRoutine. These will produce the code from the template. 
4. The logic (meaning how the template is interpreted) of the new routine OutputWriteJSONRoutine will be modeled on OutputWriteBinRoutine(set,file);
5. The logic (meaning how the template is interpreted)of the new routine OutputReadJSONRoutine will be modeled on OutputReadBinRoutine(set,file);



*** Example template
For example, given the template (found in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/struct/chemdb/mech.def):
DetailedMechanism 02 detailedmechanism
   0 The set of reactions
     MechanismReactionSet RxnSet Pointer Create
   1 The set of molecules
     MechanismMoleculeSet MolSet Pointer Create
   2 Additional Molecules (not in database)
     MoleculeSet Molecules Pointer Create
   3 Additional Reactions (not in database)
     ReactionSet Reactions Pointer Create
   4 Additional Information Needed by a mechanism
     SetOfPropertyValues Values Pointer Create
   DONE

   *** Example *.h code generated
with in the mech.h file (/Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/genh/chemdb/mech.h), the definition templates are defined:

/*------------------------------------------*/
/*   Structures Defining a Mechanism   */
/* Structure:2:DetailedMechanism

                   RxnSet --(MechanismReactionSet) The set of reactions
                   MolSet --(MechanismMoleculeSet) The set of molecules
                Molecules --(MoleculeSet) Additional Molecules (not in database)
                Reactions --(ReactionSet) Additional Reactions (not in database)
                   Values --(SetOfPropertyValues) Additional Information Needed by a mechanism
*/
typedef struct detailedmechanism DetailedMechanism;
struct detailedmechanism {
     INT ID;
     CHAR *Name;
     MechanismReactionSet *RxnSet;
     MechanismMoleculeSet *MolSet;
     MoleculeSet *Molecules;
     ReactionSet *Reactions;
     SetOfPropertyValues *Values;
     };
#define DetailedMechanismSize sizeof(DetailedMechanism)
#define AllocateDetailedMechanism (DetailedMechanism *) Malloc(DetailedMechanismSize)
#define AllocArrayDetailedMechanism(n) (DetailedMechanism *) Calloc(n,DetailedMechanismSize)
#define DetailedMechanismPntrSize sizeof(DetailedMechanism **)
#define AllocPntrArrayDetailedMechanism(n) (DetailedMechanism **) Calloc(n,DetailedMechanismPntrSize)
#define SingCopyDetailedMechanism(out,in) memcpy(out,in,DetailedMechanismSize)
extern DetailedMechanism *CreateDetailedMechanism(DetailedMechanism *newstruct,
                                           INT id,
                                           CHAR *name,
                                           MechanismReactionSet *RxnSet,
                                           MechanismMoleculeSet *MolSet,
                                           MoleculeSet *Molecules,
                                           ReactionSet *Reactions,
                                           SetOfPropertyValues *Values);

extern CHAR *GetNameDetailedMechanism(DetailedMechanism *str);
extern INT  GetIDDetailedMechanism(DetailedMechanism *str);
extern void PrintDetailedMechanism(DetailedMechanism *eleptr);
extern void FreeDetailedMechanism(DetailedMechanism *eleptr);
extern void *AllocDetailedMechanism();
extern void WriteBinDetailedMechanism(DetailedMechanism *eleptr, DbaseLinkedList *file);
extern INT ReadBinDetailedMechanism(DetailedMechanism *eleptr, DbaseLinkedList *file);
extern void xdr_DetailedMechanism(XDR *stream, char **eleptr);
extern void CopyFullDetailedMechanism(DetailedMechanism *newstruct, DetailedMechanism *oldstruct);

*** Example of two utility routines generated ReadBINDetailedMechanism and WriteBinDetailedMechanism:
extern void WriteBinDetailedMechanism(DetailedMechanism *eleptr, DbaseLinkedList *file)
{

     if(eleptr == 0)
           {
           WriteBinINT(&(NoStructureCode),file);
           return;
           }
     WriteBinINT(&(eleptr->ID),file);
     WriteBinNAME(&(eleptr->Name),file);

     WriteBinMechanismReactionSet(eleptr->RxnSet,file);

     WriteBinMechanismMoleculeSet(eleptr->MolSet,file);

     WriteBinMoleculeSet(eleptr->Molecules,file);

     WriteBinReactionSet(eleptr->Reactions,file);

     WriteBinSetOfPropertyValues(eleptr->Values,file);

}
extern INT ReadBinDetailedMechanism(DetailedMechanism *eleptr,DbaseLinkedList *file)
     {

     ReadBinINT(&(eleptr->ID),file);
     if(eleptr->ID == NO_STRUCTURE_CODE)
            {
             return(NO_STRUCTURE_CODE);
            }
     ReadBinNAME(&(eleptr->Name),file);

     eleptr->RxnSet = AllocateMechanismReactionSet;
     if(ReadBinMechanismReactionSet(eleptr->RxnSet,file) == NO_STRUCTURE_CODE)
           {
           Free(eleptr->RxnSet);
           eleptr->RxnSet = 0;
           }

     eleptr->MolSet = AllocateMechanismMoleculeSet;
     if(ReadBinMechanismMoleculeSet(eleptr->MolSet,file) == NO_STRUCTURE_CODE)
           {
           Free(eleptr->MolSet);
           eleptr->MolSet = 0;
           }

     eleptr->Molecules = AllocateMoleculeSet;
     if(ReadBinMoleculeSet(eleptr->Molecules,file) == NO_STRUCTURE_CODE)
           {
           Free(eleptr->Molecules);
           eleptr->Molecules = 0;
           }

     eleptr->Reactions = AllocateReactionSet;
     if(ReadBinReactionSet(eleptr->Reactions,file) == NO_STRUCTURE_CODE)
           {
           Free(eleptr->Reactions);
           eleptr->Reactions = 0;
           }

     eleptr->Values = AllocateSetOfPropertyValues;
     if(ReadBinSetOfPropertyValues(eleptr->Values,file) == NO_STRUCTURE_CODE)
           {
           Free(eleptr->Values);
           eleptr->Values = 0;
           }

     return(STRUCTURE_READ);
     }

*** Notes on generation routines
1. Every structure has this set of routines, so nested structures are handled by calling the appropriate routines for the nested structure.
2. For example  the set of routines includes:
   - WriteBin<StructureName>
   - ReadBin<StructureName>
   - xdr_<StructureName>
   - CopyFull<StructureName>
3. A set of primitives (such as INT, FLOAT, CHAR, BYTE, FILE, FUNCTION) have their own definitions in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/standard/simple.h
4. The logic of ReadJSON<Structure> should be similar to ReadBin<Structure>, using JSON instead of BIN. So use OutputREADBinRoutine(set,file) and ; as a guide but replace the BIN primitives with JSON primitives. Both are found in 
5. The logic of WriteJSON<Structure> should be similar to WriteBin<Structure>, using JSON instead of BIN.So use OutputWriteBinRoutine(set,file); as a guide but replace the BIN primitives with JSON primitives.
6. The primitives are translated to strings.
7. OutputStaticDefinitions should be modified to include the ReadJSON<Structure> and WriteJSON<Structure> routines.
8. use 'createstructures chemdb Str' as the command (in the CCROOT directory to test.)
