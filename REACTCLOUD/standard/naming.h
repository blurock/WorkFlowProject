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
 
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#define HYDROGEN_VALENCE        1003001
#define OXYGEN_VALENCE          8043002
#define SP3_CARBON_VALENCE      6003004
#define CARBON_TRIPLE_VALENCE   6003101
#define CARBON_DOUBLE_VALENCE   6003012
#define OXYGEN_DOUBLE_VALENCE   8043010
#define CARBON_RADICAL_VALENCE  6009003
#define OXYGEN_RADICAL_VALENCE  8049001
#define CARBON_RADICAL_DOUBLE_VALENCE  6009011 
#define CARBON_DOUBLE_KETENE_VALENCE   6003020
#define OXYGEN_TRIPLE_RADICAL_VALENCE  8029100


#define EQUAL_GRAPH_OFFSET      10000

#define NUMBER_OF_CARBON_ROOTS   20
extern char *CARBONROOTS[];
#define NUMBER_OF_CARBON_ENDINGS 4
extern char *CARBON_ENDINGS[];

#define CYCLE_PREFIX  "cyclo"
SetOfGraphs *GenerateCarbonPaths();
char *NameOfMolecule(CHAR *molname,INT *molnamecount,MoleculeInfo *mol);
extern void NewNamesForMolecules(MoleculeSet *molset);
int CheckGraphInSetWithPairing(Graph *graph, DataSubSet *graphset, DataSubSet *checkset, SetOfGraphs *set);
int CheckGraphInSet(Graph *graph, SetOfGraphs *set);
extern CHAR *GenerateLongNameUsingSet(Graph *graph, SetOfGraphs *set);
extern SetOfGraphs *REFERENCE_SET_OF_MOLECULES;
extern CHAR *GenerateLongName(CHAR *molname,INT *molnamecount,MoleculeInfo *molinfo);
