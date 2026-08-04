/*  FILE     molcalc.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Various Property Calculations with Molecules
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
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/

/*S SubGraphFromMolecule
*/ 
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
extern INT FillInSubGraphCurrentMolecules(BindStructure *bind)
     {
      MoleculeSet *molset;
      INT ret;
      
      molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
      ret = FillInSubGraphMolsSubs(molset);
      return(ret);
      }
extern INT FillInSubGraphCurrentSubStructures(BindStructure *bind)
     {
      MoleculeSet *molset;
      INT ret;
      
      molset = GetBoundStructure(bind,BIND_CURRENT_SUBSTRUCTURES);
      ret = FillInSubGraphMolsSubs(molset);
      return(ret);
      }

      
extern INT FillInSubGraphMolsSubs(MoleculeSet *molset)
     {
     MoleculeInfo *mol;
     INT i;
     GenPropValue *value;
     MoleculeSubGraph *molgraph;
     
     molgraph = AllocateMoleculeSubGraph;
     
     mol = molset->Molecules;
     LOOPi(molset->NumberOfMolecules)
       {
	 printf("Fill: %d \n",i);
	   CreateMoleculeSubGraph(molgraph,mol->ID,mol->Name,
				  0,0,0,0);
	 molgraph->HeavyAtoms = SetUpAtomSetForMolecule(HEAVY_ATOMS,mol);
	 molgraph->WithHydrogens = SetUpAtomSetForMolecule(ALL_ATOMS,mol);
	 molgraph->SubGraph = GraphFromMolFile(mol,VALENCE_STANDARD);
	 /*
	 molgraph->Symmetry = IterativeSubGraphPairs(molgraph->SubGraph,
						     molgraph->SubGraph);
	 */
	 value = StoreValueInPropValue((VOID) molgraph,
				       MOLECULE_SUBGRAPH_PROPERTY,
				       0,
				       PROP_VALUE_CALC,
				       "Calculated",
				       "",
					molset->PropertyTypes);
	  AddProperty(value,mol->Properties);
	  
	  FreeMoleculeSubGraph(molgraph);
	  FreeGenPropValue(value);
	  Free(value);
	  
	  mol++;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }
