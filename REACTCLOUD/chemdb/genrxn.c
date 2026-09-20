/*  FILE   genrxn.c  
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
#include "dbase.h"
#include "molprops.h"
#include "naming.h"
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"

#include <math.h> 

#define MAX_NUMBER_OF_MOLECULES  100
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
 */
static TransformSet *ReadInRxnsToTransformSet(ReadInReactionSet *asciirxnset,
					      ReactionSet *rxnset,
					      BindStructure *bind);
static SetOfGraphs *ReadInMoleculesToSetOfGraphs(ReadInMoleculeSet *asciimolset,
						 MoleculeSet *molset,
						 SetOfGraphMetaAtoms *metaatoms);
static ChainSequence *ReadChainSetToChainSequence(ReadChainSet *chainset,
						  MoleculeSet *molset,
						  ReactionSet *rxnset,
						  SetOfGraphMetaAtoms *metaatoms,
						  BindStructure *bind);
extern char *PrintChemkinValuesForMolecules(char *string, int *strlen,MoleculeSet *molset);
void OutputFinalMechanism(BindStructure *bind,
			  DetailedMechanism *mechanism,
			  PerformedRxnMaster *result);
static MechanismReactionSet *TransferReactionSet(PerformedRxnMaster *performed);
static void TransferToMechanismRxn(MechanismReaction *rxn,
				   PerformedRxn *prxn);
static ArrheniusFormValue *TransferPerformedInfoConstants(PerformedRxnInfoConstants *pinfo);
static MechanismMoleculeSet *TransferMoleculesToMechanism(MoleculeSet *molecules);
/*S ReadInMechanism
 */
/*F ret =GenerateChainMechanism(bind)  
**
**  DESCRIPTION
**    
**
**  REMARKS
**
*/

extern INT GenerateChainMechanism(BindStructure *bind)
{
  SetOfDetailedMechanisms *mechset;
  CommandMaster *commandmaster;
  DetailedMechanism *mechanism;
  ReadChainSet *readchain;
  MoleculeSet *molset,*rxnmolset,*subsmols;
  ReactionSet *rxnset,*bindrxnset;
  PerformedRxnMaster *result;
  SetOfGraphs *rxnmolgraphs,*molgraphs;
  ReadInMoleculeSet *asciimolset;
  ChainSequence *chainseq;
  SetOfGraphMetaAtoms *graphmetaatoms;
  SetOfMolFileMetaAtoms *metaatomset;
  CHAR *string,*name;
  INT length;
  SetOfTables *tables;
     
  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  bindrxnset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
  metaatomset = GetMetaAtomMaster(bind);
  mechset = GetBoundStructure(bind,BIND_CURRENT_MECHANISMS);
  graphmetaatoms = TranslateSetOfMolfileMetaAtoms(metaatomset);
  readchain = ReadInChainDefinition(bind);
  tables = GetBoundStructure(bind,BIND_THERMO_TABLES);

  rxnset = DetermineReactionSetFromASCII(readchain->Reactions,PATTERN_DATABASE,bind);
  molset = ReadSetOfMoleculesFromParameters("InitialMolecules",bind);
  if(molset != 0)
    {
      molset->MetaAtoms = AllocateSetOfMolFileMetaAtoms;
      CopyFullSetOfMolFileMetaAtoms(molset->MetaAtoms,metaatomset);
	 
      asciimolset = FindMoleculesInReactionSet(rxnset);
	 
      rxnmolset = DetermineMoleculeSetFromASCII(asciimolset,SUBSTRUCTURE_DATABASE,bind);
      rxnmolset->MetaAtoms = AllocateSetOfMolFileMetaAtoms;
      CopyFullSetOfMolFileMetaAtoms(rxnmolset->MetaAtoms,metaatomset);

      rxnmolgraphs = TranslateMoleculeSetToSetOfGraphs(rxnmolset,VALENCE_STANDARD,
						       graphmetaatoms);
      molgraphs = TranslateMoleculeSetToSetOfGraphs(molset,VALENCE_STANDARD,
						    graphmetaatoms);
      subsmols = ReplaceBindMoleculeSet(rxnmolset,bind);
      rxnset = ReplaceBindReactionSet(rxnset,bind);
	 
      chainseq = ReadChainSetToChainSequence(readchain,molset,rxnset,graphmetaatoms,bind);
	 
      result = ChainReactionSet(chainseq,REACTANT,molgraphs,bind);
      printf("Made new Mechanism\n");
      mechanism = SpaceToAddNewMechanismToSet(mechset);
      TransferGeneratedToMechanism(mechanism,result,rxnset,tables->BensonTree,bind);
      name = GetCurrentStringArgument("RootMechName",commandmaster);
      Free(mechanism->Name);
      mechanism->Name = CopyString(name);
      OutputFinalMechanism(bind,mechanism,result);
    }

  return(SYSTEM_NORMAL_RETURN);
}
 
/*F OutputFinalMechanism(bind,result,rxnset)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
void OutputFinalMechanism(BindStructure *bind,
			  DetailedMechanism *mechanism,
			  PerformedRxnMaster *result)
{

  printf("############################################################\n");
  printf("                        Final Result\n");
  PrintPrettyLevelResult(result);
  printf("############################################################\n");
  WriteOutDetailedMechanism(mechanism,bind);
}
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
#define RCONSTANT  1.98717

static char *PrintChemkinValuesForMolecule(CHAR *str, INT *strlen,
					   MoleculeInfo *molecule,
					   SetOfPropertyValues *valueset,
					   SetOfPropertyTypes *types)
{
  ChemkinThermoRead *chemkin;
  GenPropValue *chemkinvalue,*value;
  PropertyValues *values;
  char *string,*newname;

  INT numcount;
  values = FindValuesFromType(CHEMKIN_READTHERMO_PROPERTY,
			      valueset);
  value = values->Values;
  chemkin = AllocateChemkinThermoRead;
  if(value == NULL) {
    printf("ERROR: Expected CHEMKIN values for '%s': repair database\n", molecule->Name);
    str = PrintStringString(str,strlen,"ERROR: ");
    str = PrintStringString(str,strlen,molecule->Name);
    str = PrintStringString(str,strlen,"\n");
  } else {  
    GetPropValue(chemkin,value,types);
    printf("%20s     %9.3f %9.3f %9.3f      %9.3f %9.3f %9.3f       %9.3f %9.3f %9.3f\n",
	 chemkin->Species,
	 ChemkinS0series(chemkin,298.0),
	 ChemkinHFseries(chemkin,298.0),
	 (ChemkinHFseries(chemkin,298.0) - 298.0*ChemkinS0series(chemkin,298.0))/1000.0,
	 ChemkinS0series(chemkin,400.0),
	 ChemkinHFseries(chemkin,400.0),
	 (ChemkinHFseries(chemkin,400.0) - 400.0*ChemkinS0series(chemkin,400.0))/1000.0,
	 ChemkinS0series(chemkin,1500.0),
	 ChemkinHFseries(chemkin,1500.0),
	 (ChemkinHFseries(chemkin,1500.0) - 1500.0*ChemkinS0series(chemkin,1500.0))/1000.0);
	 
    string = AllocateString(30*LINELENGTH);
    StringMoleculeStandardChemkinThermo(string,chemkin);
    str = PrintStringString(str,strlen,string);
    Free(string);
  }
  return(str);
}
  
extern char *PrintChemkinValuesForMolecules(char *string, int *strlen,
					    MoleculeSet *molset)
{
  MoleculeInfo *mol;
  INT i;
  SetOfPropertyTypes *types;
  printf("Molecule           ");
  printf("                 298.0              ");
  printf("                 400.0              ");
  printf("                1500.0              ");
  printf("\n");
  mol = molset->Molecules;
  types = InitializeMolecularPropertyTypes(molset->ID,molset->Name);
  LOOPi(molset->NumberOfMolecules)
    {
      string = PrintChemkinValuesForMolecule(string,strlen,mol,mol->Properties,types);
      mol++;
    }
  return(string);
}


				   
/*f transformset =ReadInRxnsToTransformSet(asciirxnset,rxnset,bind) 
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static TransformSet *ReadInRxnsToTransformSet(ReadInReactionSet *asciirxnset,
					      ReactionSet *rxnset,
					      BindStructure *bind)
{
  TransformSet *transformset;
  GraphTransform *transform;
  ReadInReaction *asciirxn;
  ReactionInfo *reaction;
  INT i,result;

  transformset = AllocateTransformSet;
  CreateTransformSet(transformset,asciirxnset->ID,asciirxnset->Name,
		     asciirxnset->NumberOfReactions,0);
     
  transform = transformset->Set;
  asciirxn = asciirxnset->Reactions;
  LOOPi(asciirxnset->NumberOfReactions)
    {
      reaction = FindReactionFromString(asciirxn->Name,rxnset);
      if(reaction != 0) {
	result = ConvertReactionToGraphTransform(transform,
						 reaction,
						 bind);
	if(result == SYSTEM_NORMAL_RETURN) {
	  transform++;
	} else {
	  printf("********************************\n");
	  printf("ERROR: In Generating Transform Set: %s ignored\n",reaction->Name);
	  transformset->NumberOfTransforms -= 1;
	}
      } else
	transformset->NumberOfTransforms -= 1;
      
      asciirxn++;
    }
  return(transformset);
}

 
/*f setofgraphs = ReadInMoleculesToSetOfGraphs(asciimolset,molset)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static SetOfGraphs *ReadInMoleculesToSetOfGraphs(ReadInMoleculeSet *asciimolset,
						 MoleculeSet *molset,
						 SetOfGraphMetaAtoms *metaatoms)
{
  SetOfGraphs *setofgraphs;
  Graph *graph;
  MoleculeInfo *molecule;
  ReadInMolecule *asciimol;
  INT i;
     
  setofgraphs = AllocateSetOfGraphs;
  CreateSetOfGraphs(setofgraphs,asciimolset->ID,asciimolset->Name,
		    asciimolset->NumberOfMolecules,0);
     
  graph = setofgraphs->Graphs;     
  asciimol = asciimolset->Molecules;
  LOOPi(asciimolset->NumberOfMolecules)
    {
      molecule = FindMoleculeFromString(asciimol->Name,molset);
      if(molecule != 0)
	{
	  GraphFromMolFileForArrays(graph,molecule,
				    VALENCE_STANDARD);
	  graph->MetaAtoms = AllocateSetOfGraphMetaAtoms;
	  CopyFullSetOfGraphMetaAtoms(graph->MetaAtoms,metaatoms);
	  graph++;
	}
      else 
	{
	  printf("Molecule: %s  not found in list of molecules\n",asciimol->Name);
	  setofgraphs->NumberOfGraphs -= 1;
	}
      asciimol++;
    }
  return(setofgraphs);
}

 
/*f chainseq = ReadChainSetToChainSequence(chainset,molset,rxnset,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static ChainSequence *ReadChainSetToChainSequence(ReadChainSet *chainset,
						  MoleculeSet *molset,
						  ReactionSet *rxnset,
						  SetOfGraphMetaAtoms *metaatoms,
						  BindStructure *bind)
{
  ChainSequence *chainseq;
  ReadChainReactionStep *readstep;
  ChainSequenceElement *step;
  INT i;
     
  chainseq = AllocateChainSequence;
  CreateChainSequence(chainseq,chainset->ID,chainset->Name,
		      chainset->NumberOfSteps,0,
		      0);
  chainseq->Molecules = ReadInMoleculesToSetOfGraphs(chainset->Molecules,molset,metaatoms);
  printf("Number of Molecules - Read Chain(ReadChainSetToChainSequence): %d\n", chainset->Molecules->NumberOfMolecules);
  printf("Number of Molecules - Sequence  (ReadChainSetToChainSequence): %d\n", chainseq->Molecules->NumberOfGraphs);
  step = chainseq->Steps;
  readstep = chainset->Steps;
  LOOPi(chainseq->NumberOfSteps) {
    CreateChainSequenceElement(step,i,step->Name,0,0);
    step->Reactions = ReadInRxnsToTransformSet(readstep->Reactions,rxnset,bind);
    printf("Chain Step: ReadInMoleculesToSetOfGraphs\n");
    step->Molecules = ReadInMoleculesToSetOfGraphs(readstep->Molecules,molset,metaatoms);
    step++;
    readstep++;
  }
  return(chainseq);
}
 
/*F molset = ReadSetOfMoleculesFromParameters(parameter,bind)
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
extern MoleculeSet *ReadSetOfMoleculesFromParameters(CHAR *parameter,
						     BindStructure *bind)
{
  ChemDBMaster *master;
  CommandMaster *commandmaster;
  DataBaseInformation *dinfo;
  MoleculeSet *molset;
  MoleculeInfo *mol;
  ASCIIProperties *asciilist;
  ASCIIProperty *asciimol;
  CHAR *line;
  INT i,ret, final;
     
  final = SYSTEM_NORMAL_RETURN;

  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  master = GetBoundStructure(bind,BIND_CHEMDBASE);

  line = GetCurrentStringArgument(parameter,commandmaster);
  asciilist = ReadListFromLine(line,MAX_NUMBER_OF_MOLECULES,',',0);

  molset = AllocateMoleculeSet;
  CreateMoleculeSet(molset,0,parameter,asciilist->NumberOfProperties,0,0,0);
     
  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,MOLECULE_DATABASE);
  asciimol = asciilist->Properties;
  mol = molset->Molecules;
  LOOPi(asciilist->NumberOfProperties)
    {
      ret = DBFindMolSubFromString(asciimol->Name,mol,dinfo);
      if(ret != SYSTEM_NORMAL_RETURN) 
	{
	  printf("Molecule not found: '%s'\n",asciimol->Name);
	  final = SYSTEM_ERROR_RETURN;
	}
      mol++;
      asciimol++;
    }
  if(final != SYSTEM_NORMAL_RETURN)
    {
      FreeMoleculeSet(molset);
      Free(molset);
      molset = 0;
    }

  return(molset);
}

/*S WriteOUtMechanism
 */
 
/*F mechanism = TransferGeneratedToMechanism(performed,rxnpatterns,bentree,bind)
**
**  DESCRIPTION
**    
**
**  REMARKS
**
*/
extern DetailedMechanism 
*TransferGeneratedToMechanism(DetailedMechanism *mechanism,
			      PerformedRxnMaster *performed,
			      ReactionSet *rxnpatterns,
			      BensonCalculation *bentree,
			      BindStructure *bind)
{
  MoleculeInfo *mol;
  Graph *graph;
  INT i;

  CreateDetailedMechanism(mechanism,performed->ID,performed->Name,
			  0,0,0,0,0);
  printf("TransferGeneratedToMechanism\n");
  mechanism->Molecules = TransferSetOfGraphsToMoleculeSet(performed->Molecules);
  ReplaceMoleculesFromDatabase(mechanism->Molecules,bind);

  mol = mechanism->Molecules->Molecules;
  graph = performed->Molecules->Graphs;
  LOOPi(mechanism->Molecules->NumberOfMolecules)
    {
      printf("Molecules: %10d:%20s   %10d:%20s\n",graph->ID,graph->Name,mol->ID,mol->Name);
      graph->ID = mol->ID;
      Free(graph->Name);
      graph->Name = CopyString(mol->Name);
      graph++;
      mol++;
    }
  /*NewNamesForMolecules(mechanism->Molecules);*/
  mechanism->RxnSet = TransferReactionSet(performed);
  mechanism->Reactions = AllocateReactionSet;
  CopyFullReactionSet(mechanism->Reactions,rxnpatterns);
  if(bentree != 0) {
    MolSubBensonThermo(mechanism->Molecules,bentree,0);
    ChemkinFromBensonForSet(mechanism->Molecules);
  }
  mechanism->MolSet = TransferMoleculesToMechanism(mechanism->Molecules);
  return(mechanism);
}
/*f rxnset = TransferReactionSet(performed)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static MechanismReactionSet *TransferReactionSet(PerformedRxnMaster *performed)
{
  MechanismReactionSet *rxnset;
  MechanismReaction *rxn;
  SetOfPerformedRxns *prxns;
  PerformedRxn *prxn;
  INT i;

  prxns = performed->Performed;
     
  rxnset = AllocateMechanismReactionSet;
  CreateMechanismReactionSet(rxnset,performed->ID,performed->Name,
			     prxns->NumberOfReactions,0,0);
     
  prxn = prxns->Reactions;
  rxn = rxnset->Reactions;
  LOOPi(prxns->NumberOfReactions) {
    TransferToMechanismRxn(rxn,prxn);
    prxn++;
    rxn++;
  }
  return(rxnset);
}
 
/*f TransferToMechanismRxn(rxn,prxn)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void TransferToMechanismRxn(MechanismReaction *rxn,
				   PerformedRxn *prxn)
{
  PerformedRxnInfo *pinfo;
     
  CreateMechanismReaction(rxn,prxn->ID,prxn->Name,
			  0,0,0,0,0,0,0);
     
  rxn->Reactants = AllocateRxnReacProdSet;
  rxn->Products = AllocateRxnReacProdSet;
  CreateRxnReacProdSet(rxn->Reactants,prxn->ID,prxn->Name,
		       prxn->NumberOfReactants,prxn->ReactantIDs);
  CreateRxnReacProdSet(rxn->Products,prxn->ID,prxn->Name,
		       prxn->NumberOfProducts,prxn->ProductIDs);
     
  pinfo = prxn->Info;
  rxn->Forward = TransferPerformedInfoConstants(pinfo->Forward);
  rxn->Reverse = TransferPerformedInfoConstants(pinfo->Reverse);
}
 
/*f arrhenius = TransferPerformedInfoConstants(pinfo)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static ArrheniusFormValue *TransferPerformedInfoConstants(PerformedRxnInfoConstants *pinfo)
{
  ArrheniusFormValue *arrhenius;
     
  if(pinfo != 0) {
    arrhenius = AllocateArrheniusFormValue;
    CreateArrheniusFormValue(arrhenius,pinfo->ID,pinfo->Name,
			     pinfo->Aconstant,
			     pinfo->Energy,
			     pinfo->TempExp,
			     pinfo->Weight);
  } else
    arrhenius = 0;
     
  return(arrhenius);
}
 
/*f mechmolset = TransferMoleculesToMechanism(molecules)
**
**  DESCRIPTION
**    molecules: The set of molecules
**
**  REMARKS
**
*/
static MechanismMoleculeSet *TransferMoleculesToMechanism(MoleculeSet *molecules)
{
  MechanismMoleculeSet *mechmolset;
  MechanismMolecule *mechmol;
  MoleculeInfo *mol;
  INT i;
     
  mechmolset = AllocateMechanismMoleculeSet;
  CreateMechanismMoleculeSet(mechmolset,molecules->ID,molecules->Name,
			     molecules->NumberOfMolecules,0,0);
     
  mechmol = mechmolset->Molecules;
  mol = molecules->Molecules;
  LOOPi(mechmolset->NumberOfMolecules)
    {
      CreateMechanismMolecule(mechmol,mol->ID,mol->Name,
			      0,0,0,0,0,0);
      mechmol->AtomCounts = DetermineAtomCounts(mol);
      mechmol->AbbreviatedName = CopyString(mol->Name);
      InsertThermoValue(mechmol,mol->Properties,molecules->PropertyTypes);
      InsertEquilibriumValue(mechmol,mol->Properties,molecules->PropertyTypes);
      mol++;
      mechmol++;
    }
  return(mechmolset);
}
