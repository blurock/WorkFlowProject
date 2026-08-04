/*  FILE     prpfunc.c
**  PACKAGE  REACTION
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The list of functions for the menu system
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

#define NUMBER_MOLPROPS_FUNCTIONS  22

static FunctionInfo MOLPROPS_FUNCTION_LIST[NUMBER_MOLPROPS_FUNCTIONS] = {
     {1,"ReadInChemkinThermoFile",(INT (*)(void)) ReadInChemkinThermoFile},  
     {2,"ChemkinThermPrintOutStandard",(INT (*)(void)) ChemkinThermPrintOutStandard},
     {3,"BindReadIn2ndOrdBensonTable",(INT (*)(void)) BindReadIn2ndOrdBensonTable},
     {4,"PrintOutBensonTables",(INT (*)(void)) PrintOutBensonTables},
     {5,"ReadInBensonTranslationTables",(INT (*)(void)) ReadInBensonTranslationTables},
     {6,"PrintBensonAtomTranslation",(INT (*)(void)) PrintBensonAtomTranslation},
     {7,"SetUpSecondOrderTable",(INT (*)(void)) SetUpSecondOrderTable},
     {8,"PrintOut2ndOrderBensonTree",(INT (*)(void)) PrintOut2ndOrderBensonTree},
     {9,"CurrentMoleculeBensonThermo",(INT (*)(void)) CurrentMoleculeBensonThermo},
     {10,"PrintOutMolThermo",(INT (*)(void)) PrintOutMolThermo},
     {11,"FillInSubGraphCurrentMolecules",(INT (*)(void)) FillInSubGraphCurrentMolecules},
     {12,"FillInSubGraphCurrentSubStructures",(INT (*)(void)) FillInSubGraphCurrentSubStructures},
     {13,"ChemkinFromBensonCalc",(INT (*)(void))ChemkinFromBensonCalc },
     {14,"MasterPrintCurrentMolecules",(INT (*)(void)) MasterPrintCurrentMolecules},
     {15,"MasterPrintCurrentSubStructures",(INT (*)(void))MasterPrintCurrentSubStructures},
     {16,"AddToCurrentMolecules",(INT (*)(void)) AddToCurrentMolecules},
     {17,"AddToCurrentSubStructures",(INT (*)(void)) AddToCurrentSubStructures},
     {18,"AddSDFToCurrentMolecules",(INT (*)(void)) AddSDFToCurrentMolecules},
     {19,"AddSDFToCurrentSubStructures",(INT (*)(void)) AddSDFToCurrentSubStructures},
     {20,"ChemkinToBensonTest",(INT (*)(void)) ChemkinToBensonTest},
     {21,"LocalReadASCIIMoleculeProps",(INT (*)(void)) LocalReadASCIIMoleculeProps},
     {22,"TransferChemkinToTables",(INT (*)(void))TransferChemkinToTables }
     };

static FunctionList MOLPROPS_FUNCTIONS = {
        0,"ChemistryDatabase",
    	NUMBER_MOLPROPS_FUNCTIONS,
	MOLPROPS_FUNCTION_LIST
	};

/****************************************************************************/
extern FunctionList *MergeFunctMolProperties(FunctionList *old)
     {
     FunctionList *new;
     
     new = MergeFunctionInfo(old->ID,old->Name,
			     old, &MOLPROPS_FUNCTIONS);
     FreeFunctionList(old);
     Free(old);
     return(new);
     }
