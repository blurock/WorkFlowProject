/*  FILE     molprp.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Setting up the property types for the molecules
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
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static void SetUpBensonThermoType(PropertyType *benson);
static CHAR *OnLineBensonSecondThermoTable(GenPropValue *value,
					   INT fieldsize,
					   INT *bufferleft,
					   CHAR *out,
					   BindStructure *bind);
static void PrintPropBensonSecondThermoTable(FILE *file, CHAR *prefix, GenPropValue *value,
					       BindStructure *bind); 
static void TranslatePropBensonSecondThermoTable(GenPropValue *value, CHAR *string,
						 BindStructure *bind);
static void SetUpMoleculeSubGraph(PropertyType *molsubgraph);
static void PrintPropMoleculeSubGraph(FILE *file, CHAR *prefix, GenPropValue *value,
				  BindStructure *bind);
static CHAR *OnLineMoleculeSubGraph(GenPropValue *value,
				    INT fieldsize,
				    INT *bufferleft,
				    CHAR *out,
				     BindStructure *bind);
static void SetUpChemkinThermoValues(PropertyType *chemkin);
static void TranslatePropChemkinThermoRead(GenPropValue *value, CHAR *string,
					   BindStructure *bind);
static CHAR *OnLineChemkinThermoRead(GenPropValue *value,
					   INT fieldsize,
					   INT *bufferleft,
					   CHAR *out,
				     BindStructure *bind);
static void PrintPropChemkinThermoRead(FILE *file, CHAR *prefix, GenPropValue *value,
				       BindStructure *bind);
static void SetUpCalculationThermoValues(PropertyType *calcthermo);
static void SetUpMiscMoleculeProperties(PropertyType *molfloats);

/*F molset = InitializeMoleculeSet(id,name) . . . . . . . . . Main Initialize
**
**  DESCRIPTION
**    id:  The id of the chemistry master structure
**    name: The name of the chemistry master structure
**    molset: The allocated and initialized molecule set structure
**
**  REMARKS
**     This routine is usually called in the main routine to 
**     initialize the MoleculeSet (bind) structure 
**
**  REFERENCES
**
**  SEE ALSO
**
**  HEADERFILE
**
*/
extern MoleculeSet *InitializeMoleculeSet(INT id, CHAR *name)
     {
     MoleculeSet *molset;
     INT nummols,incmols;
     
     nummols = MAX_CURRENT_MOLECULES;
     incmols = INC_CURRENT_MOLECULES;
     
     molset = AllocateMoleculeSet;
     CreateMoleculeSet(molset,BIND_CURRENT_MOLECULES, "Current Molecules",
		       nummols,0,0,0);
     
     molset->NumberOfMolecules = 0;

     molset->PropertyTypes = InitializeMolecularPropertyTypes(id,name);

     return(molset);
     }
 
 
/*F types = InitializeMolecularProperties(id,name)
**
**  DESCRIPTION
**    Set up the Property types for the Molecules:
**     - Benson
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
extern SetOfPropertyTypes *InitializeMolecularPropertyTypes(INT id, CHAR *name)
     {
     SetOfPropertyTypes *types;

     types = AllocateSetOfPropertyTypes;
     CreateSetOfPropertyTypes(types,id,name,
			      7,0);
     
     SetUpAlternativeNames(types->Types + 0);
     SetUpMoleculeSubGraph(types->Types + 1);
     SetUpBensonThermoType(types->Types + 2);
     SetUpChemkinThermoValues(types->Types + 3);
     SetUpCalculationThermoValues(types->Types + 4);
     SetUpMiscMoleculeProperties(types->Types + 5);
     SetUpArrheniusFormValues(types->Types + 6);
     return(types);
     }

/*S  SetUpBensonThermoType
*/
/*f SetUpBensonThermoType(benson)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void SetUpBensonThermoType(PropertyType *benson)
     {
     
     CreatePropertyType(benson,BENSON_THERMO_PROPERTY,
			"BensonThermodynamics",
			0,
			FreeBensonSecondThermoTable,
			ReadBinBensonSecondThermoTable,
			WriteBinBensonSecondThermoTable,
			TranslatePropBensonSecondThermoTable,
			PrintPropBensonSecondThermoTable,
			OnLineBensonSecondThermoTable,
			3,
			"Calculated Benson Thermodynamics Values");
     benson->ValueOnLine = OnLineBensonSecondThermoTable;
     }

static void TranslatePropBensonSecondThermoTable(GenPropValue *value, CHAR *string,
						 BindStructure *bind)
     {
     BensonSecondThermoTable *benson;
     DbaseLinkedList *link,*newlink;
     
     benson = AllocateBensonSecondThermoTable;
     FillInThermoValues(string,benson);
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,benson->ID,benson->Name,
			   BENSON_LINKED_LIST_SIZE,BENSON_LINKED_LIST_SIZE,
			   0,0,0);
     link->Size = 0;
     WriteBinBensonSecondThermoTable(benson,link);
     newlink = LinkedListToSingle(link);
     
     CreateGenPropValue(value,0,string, PROP_VALUE_EXP,0,
			newlink->Size,newlink->Element,0,"Table Input");

     FreeBensonSecondThermoTable(benson);
     Free(benson);
     FreeDbaseLinkedList(link);
     Free(link);
     FreeDbaseLinkedList(newlink);
     Free(newlink);
     }
 
/*f rest = OnLineBensonSecondThermoTable(value,fieldsize,bufferleft,out,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *OnLineBensonSecondThermoTable(GenPropValue *value,
					   INT fieldsize,
					   INT *bufferleft,
					   CHAR *out,
					   BindStructure *bind)
     {
     BensonSecondThermoTable *benson;
     DbaseLinkedList *link;
     
     benson = AllocateBensonSecondThermoTable;
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,0,0,
			   value->NumberOfBytes,value->NumberOfBytes,
			   0,value->Value,0);
     ReadBinBensonSecondThermoTable(benson,link);
     
     out = PrintStringBensonSecondThermoTable(out,bufferleft,"",benson);
     
     FreeBensonSecondThermoTable(benson);
     Free(benson);
     FreeDbaseLinkedList(link);
     Free(link);
     
     return(out);
     }
 
/*f PrintPropStringBensonSecondThermoTable(file,prefix,value,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void PrintPropBensonSecondThermoTable(FILE *file, CHAR *prefix, GenPropValue *value,
					       BindStructure *bind)
     {
     CHAR *string;
     INT length;
     
     string = AllocateString(2*LINELENGTH);
     length = 2*LINELENGTH;
     
     OnLineBensonSecondThermoTable(value,LINELENGTH,&length,string,bind);
     
     fprintf(file,string);
     Free(string);
     }

/*S SetUpMoleculeSubGraph
*/
 
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void SetUpMoleculeSubGraph(PropertyType *molsubgraph)
     {
     CreatePropertyType(molsubgraph,MOLECULE_SUBGRAPH_PROPERTY,
			"MoleculeSubGraph",
			0,
			FreeMoleculeSubGraph,
			ReadBinMoleculeSubGraph,
			WriteBinMoleculeSubGraph,
			0,
			PrintPropMoleculeSubGraph,
			OnLineMoleculeSubGraph,
			3,
			"The Molecule Represented as a Graph");
     molsubgraph->ValueOnLine = OnLineMoleculeSubGraph;
     }
     
 
/*f PrintPropMoleculeSubGraph(file,prefix,value,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void PrintPropMoleculeSubGraph(FILE *file, CHAR *prefix, GenPropValue *value,
				      BindStructure *bind)
     {
     MoleculeSubGraph *molsubgraph;
     DbaseLinkedList *link;
     CHAR *line;
     
     molsubgraph = AllocateMoleculeSubGraph;
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,0,0,
			   value->NumberOfBytes,value->NumberOfBytes,
			   0,value->Value,0);
     ReadBinMoleculeSubGraph(molsubgraph,link);
     
     line = AllocateString(LINELENGTH);
     sprintf(line,"%s Graph:          ",prefix);
/*
     PrintPrettyGraph(line, file, molsubgraph->SubGraph);
     sprintf(line,"%s Heavy Atoms:    ",prefix);
     PrintPrettyDataSubSet(file,line,molsubgraph->HeavyAtoms);
     sprintf(line,"%s With Hydrogens: ",prefix);
     PrintPrettyDataSubSet(file,line,molsubgraph->WithHydrogens);
*/     
     FreeDbaseLinkedList(link);
     Free(link);
     FreeMoleculeSubGraph(molsubgraph);
     Free(molsubgraph);
     Free(line);
     }

static CHAR *OnLineMoleculeSubGraph(GenPropValue *value,
				    INT fieldsize,
				    INT *bufferleft,
				    CHAR *out,
				    BindStructure *bind)
     {
     MoleculeSubGraph *molsubgraph;
     DbaseLinkedList *link;
     CHAR *line;
     
     molsubgraph = AllocateMoleculeSubGraph;
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,0,0,
			   value->NumberOfBytes,value->NumberOfBytes,
			   0,value->Value,0);
     ReadBinMoleculeSubGraph(molsubgraph,link);
     
     line = AllocateString(LINELENGTH);
     sprintf(line,"%5d:%s  ;%d Atoms, %d Heavy Atoms\n",
	     molsubgraph->ID,
	     molsubgraph->Name,
	     molsubgraph->WithHydrogens->NumberOfPoints,
	     molsubgraph->HeavyAtoms->NumberOfPoints);

     out = PrintStringString(out,bufferleft,line);
     
     FreeDbaseLinkedList(link);
     Free(link);
     FreeMoleculeSubGraph(molsubgraph);
     Free(molsubgraph);
     Free(line);

     return(out);
     }
/*S SetUpChemkinThermoValues
*/
static void SetUpChemkinThermoValues(PropertyType *chemkin)
     {
     CreatePropertyType(chemkin,CHEMKIN_READTHERMO_PROPERTY,
			"ChemkinThermo",
			0,
			FreeChemkinThermoRead,
			ReadBinChemkinThermoRead,
			WriteBinChemkinThermoRead,
			TranslatePropChemkinThermoRead,
			PrintPropChemkinThermoRead,
			OnLineChemkinThermoRead,
			5,
			"Chemkin Database Thermodynamic Values");
     chemkin->ValueOnLine = OnLineChemkinThermoRead;
     }

static void TranslatePropChemkinThermoRead(GenPropValue *value, CHAR *string,
					   BindStructure *bind)
     {
     ChemkinThermoRead *chemkin;
     CHAR *rest,*word,*name,*data;
     
     word = AllocateString(LINELENGTH);
     
     rest = IsolateNextWord(string,word,BLANK,LINELENGTH);
     name = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     data = CopyString(word);
     EliminateBlanks(data);
     
     chemkin = AllocateChemkinThermoRead;
     CreateChemkinThermoRead(chemkin,-1,data,0,0,0,0,0,0,0);
     chemkin->Species = CopyString(data);
     
     ProduceChemkinGenPropValue(value,chemkin);
     
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Reference = CopyString(word);
     rest = IsolateNextWord(rest,word,';',LINELENGTH);
     value->Text = CopyString(word);

     Free(data);
     Free(word);
     FreeChemkinThermoRead(chemkin);
     Free(chemkin);
     }

extern void ProduceChemkinGenPropValue(GenPropValue *value,
				       ChemkinThermoRead *chemkin)
     {
     DbaseLinkedList *link,*newlink;
     
     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,chemkin->ID,chemkin->Name,
			   CHEMKIN_LINKED_LIST_SIZE,CHEMKIN_LINKED_LIST_SIZE,
			   0,0,0);
     link->Size = 0;
     WriteBinChemkinThermoRead(chemkin,link);
     newlink = LinkedListToSingle(link);
     
     CreateGenPropValue(value,CHEMKIN_READTHERMO_PROPERTY,"Chemkin", PROP_VALUE_EXP,0,
			newlink->Size,newlink->Element,0,0);
     FreeDbaseLinkedList(link);
     Free(link);
     FreeDbaseLinkedList(newlink);
     Free(newlink);
     }

static CHAR *OnLineChemkinThermoRead(GenPropValue *value,
					   INT fieldsize,
					   INT *bufferleft,
					   CHAR *out,
					   BindStructure *bind)
     {
     DbaseLinkedList *link;
     ChemkinThermoRead *chemkin;
     CHAR *string;
     
     chemkin = AllocateChemkinThermoRead;

     link = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(link,0,0,
			   value->NumberOfBytes,value->NumberOfBytes,
			   0,value->Value,0);
     ReadBinChemkinThermoRead(chemkin,link);
     
     string = AllocateString(PRINT_BUFFER_LENGTH);
     StringMoleculeStandardChemkinThermo(string,chemkin);
     
     out = PrintStringString(out,bufferleft,string);
     
     Free(string);
     FreeDbaseLinkedList(link);
     Free(link);
     FreeChemkinThermoRead(chemkin);
     Free(chemkin);
     
     return(out);
     }

static void PrintPropChemkinThermoRead(FILE *file, CHAR *prefix, GenPropValue *value,
				       BindStructure *bind)
     {
     CHAR *out;
     INT length;
     
     out = AllocateString(PRINT_BUFFER_LENGTH);
     length = PRINT_BUFFER_LENGTH;
     OnLineChemkinThermoRead(value,0,&length,out,bind);
     fprintf(file,"%s\n",out);
     Free(out);
     }
/* SetUpCalculationThermoValues
*/
static void SetUpCalculationThermoValues(PropertyType *calcthermo)
     {
     CreatePropertyType(calcthermo,CALC_THERMO_PROPERTY,
			"CalcThermoValues",
			0,
			FreeChemkinThermoRead,
			ReadBinChemkinThermoRead,
			WriteBinChemkinThermoRead,
			TranslatePropChemkinThermoRead,
			PrintPropChemkinThermoRead,
			OnLineChemkinThermoRead,
			5,
			"Chosen Thermodynamic Values for a Mechanism Calculation");
     calcthermo->ValueOnLine = OnLineChemkinThermoRead;
     }
/* SetUpMiscMoleculeProperties
*/
static void SetUpMiscMoleculeProperties(PropertyType *molfloats)
     {
     SetUpFloatType(molfloats,
		    0,
		    MISC_MOLECULE_PROPERTIES,
		    "MiscMolProps",
		    10,
		    "Misc. Molecule Properties");
     }
	 



