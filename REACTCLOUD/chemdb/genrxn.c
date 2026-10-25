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
#include "cJSON.h"

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
  CHAR *string,*name,*transformName;
  INT length;
  SetOfTables *tables;
     
  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  bindrxnset = GetBoundStructure(bind,BIND_CURRENT_REACTIONS);
  metaatomset = GetMetaAtomMaster(bind);
  mechset = GetBoundStructure(bind,BIND_CURRENT_MECHANISMS);
  graphmetaatoms = TranslateSetOfMolfileMetaAtoms(metaatomset);

  transformName = GetCurrentStringArgument("TransformRxn", commandmaster);
  readchain = NULL;
  if (transformName != NULL && strlen(transformName) > 0) {
    printf("Checking Firestore for MechanismPathway '%s'...\n", transformName);
    readchain = FetchReadChainSetFromFirestore(transformName, bind);
  }
  if (readchain == NULL) {
    printf("MechanismPathway '%s' not found in Firestore. Reading from file definition...\n",
           transformName ? transformName : "UNKNOWN");
    readchain = ReadInChainDefinition(bind);
  }
  if (readchain == NULL) {
    printf("ERROR: Could not find or load MechanismPathway '%s' from Firestore or file.\n",
           transformName ? transformName : "UNKNOWN");
    return SYSTEM_ERROR_RETURN;
  }

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

/*S FirestoreChainInterface
*/

/*F FetchReadChainSetFromFirestore(name, bind)
**
**  DESCRIPTION
**    Fetches a MechanismPathway JSON record from Firestore via the Orchestrator
**    endpoint /api/db/fetch (collection: users/<uid>/databases/MechanismPathway/records/<name>).
**    Deserializes into a ReadChainSet structure and ensures total Molecules and Reactions
**    sets are calculated.
*/
extern ReadChainSet *FetchReadChainSetFromFirestore(const char *name, BindStructure *bind)
{
  CHAR body[1024];
  CHAR *resp;
  size_t resp_size = 4194304; /* 4 MB buffer */
  const char *uid;
  ReadChainSet *readchain = NULL;

  if (name == NULL || *name == '\0') return NULL;

  uid = getenv("REACT_USER_UID");
  if (uid == NULL || *uid == '\0') {
    uid = "user_default_local";
  }

  snprintf(body, sizeof(body),
           "{\"uid\":\"%s\",\"dbName\":\"MechanismPathway\",\"type\":\"string\",\"key\":\"%s\"}",
           uid, name);

  resp = (CHAR *) Malloc(resp_size);
  if (resp == NULL) return NULL;

  if (PostJSONToOrchestrator("/api/db/fetch", body, resp, resp_size) == 0) {
    char *json_body = strstr(resp, "\r\n\r\n");
    if (json_body != NULL) {
      json_body += 4;
      cJSON *parsed = cJSON_Parse(json_body);
      if (parsed != NULL) {
        cJSON *found = cJSON_GetObjectItemCaseSensitive(parsed, "found");
        cJSON *data = cJSON_GetObjectItemCaseSensitive(parsed, "data");
        if (found != NULL && !cJSON_IsNull(found) && (found->type == cJSON_True || found->valueint != 0) && data != NULL) {
          char *data_str = cJSON_PrintUnformatted(data);
          if (data_str != NULL) {
            readchain = AllocateReadChainSet;
            memset(readchain, 0, sizeof(ReadChainSet));
            if (ReadJSONReadChainSetFromString(readchain, data_str) == STRUCTURE_READ) {
              if (readchain->Molecules == NULL) {
                DetermineSetOfMolecules(readchain);
              }
              if (readchain->Reactions == NULL) {
                DetermineSetOfReactions(readchain);
              }
              printf("[Firestore Fetch] Successfully fetched MechanismPathway '%s' from Firestore.\n", name);
            } else {
              printf("[Firestore Fetch Error] Failed to parse MechanismPathway '%s' JSON.\n", name);
              FreeReadChainSet(readchain);
              Free(readchain);
              readchain = NULL;
            }
            cJSON_free(data_str);
          }
        }
        cJSON_Delete(parsed);
      }
    }
  }
  Free(resp);
  return readchain;
}

/*F StoreReadChainSetToFirestore(readchain, bind)
**
**  DESCRIPTION
**    Serializes a ReadChainSet structure to JSON and saves it in Firestore via Orchestrator
**    endpoint /api/db/store under dbName 'MechanismPathway' and key readchain->Name.
*/
extern INT StoreReadChainSetToFirestore(ReadChainSet *readchain, BindStructure *bind)
{
  CHAR *json_str;
  CHAR *body;
  size_t len;
  const char *uid;
  int res = SYSTEM_ERROR_RETURN;

  if (readchain == NULL || readchain->Name == NULL || *readchain->Name == '\0')
    return SYSTEM_ERROR_RETURN;

  uid = getenv("REACT_USER_UID");
  if (uid == NULL || *uid == '\0') {
    uid = "user_default_local";
  }

  if (readchain->Molecules == NULL) DetermineSetOfMolecules(readchain);
  if (readchain->Reactions == NULL) DetermineSetOfReactions(readchain);

  json_str = WriteJSONReadChainSetToString(readchain);
  if (json_str == NULL) return SYSTEM_ERROR_RETURN;

  len = strlen(uid) + strlen("MechanismPathway") + strlen(readchain->Name) + strlen(json_str) + 512;
  body = (CHAR *) Malloc(len);
  if (body == NULL) {
    cJSON_free(json_str);
    return SYSTEM_ERROR_RETURN;
  }

  sprintf(body, "{\"uid\":\"%s\",\"dbName\":\"MechanismPathway\",\"key\":\"%s\",\"keyId\":%d,\"jsonStr\":%s}",
          uid, readchain->Name, readchain->ID, json_str);

  if (PostJSONToOrchestrator("/api/db/store", body, NULL, 0) == 0) {
    printf("[Firestore Store] Successfully stored MechanismPathway '%s' in Firestore.\n", readchain->Name);
    res = SYSTEM_NORMAL_RETURN;
  } else {
    printf("[Firestore Store Error] Failed to store MechanismPathway '%s' in Firestore.\n", readchain->Name);
  }

  Free(body);
  cJSON_free(json_str);
  return res;
}

/*S ReadCheckAndStoreChain
*/

/*F DBReadCheckChain(bind)
**
**  DESCRIPTION
**    Reads a ReadChainSet pathway definition from the specified file (TransformDir/TransformRxn.lsr),
**    validates its formatting (non-empty name, NumberOfSteps > 0), and verifies that all molecules
**    exist in MOLECULE_DATABASE and all reaction patterns exist in PATTERN_DATABASE.
**    Writes a formatted report table to <TransformDir>/<TransformRxn>_Check.out and stdout.
*/
extern INT DBReadCheckChain(BindStructure *bind)
{
  CommandMaster *commandmaster;
  ChemDBMaster *master;
  DataBaseInformation *moldinfo, *patdinfo;
  FILE *out;
  ReadChainSet *readchain;
  MoleculeInfo minfo;
  ReactionInfo rinfo;
  INT i, ret;
  INT num_missing_mols = 0, num_checked_mols = 0;
  INT num_missing_rxns = 0, num_checked_rxns = 0;
  CHAR *pathwayName;

  commandmaster = GetBoundStructure(bind, BIND_COMMANDMASTER);
  if (commandmaster == NULL) return SYSTEM_ERROR_RETURN;

  master = GetBoundStructure(bind, BIND_CHEMDBASE);
  if (master == NULL) {
    printf("ERROR: ChemDBMaster (BIND_CHEMDBASE) is NULL. Initialize database first.\n");
    return SYSTEM_ERROR_RETURN;
  }

  moldinfo = GetDataBaseInfoFromID(master->DatabaseInfo, MOLECULE_DATABASE);
  patdinfo = GetDataBaseInfoFromID(master->DatabaseInfo, PATTERN_DATABASE);

  out = OpenWriteFileFromCurrent("TransformDir", "TransformRxn", "Check.out", IGNORE,
                                 "Mechanism Pathway Check Report", commandmaster);
  if (out == NULL) out = stdout;

  fprintf(out, "================================================================================\n");
  fprintf(out, "Mechanism Pathway Definition Check Report\n");
  fprintf(out, "================================================================================\n");

  readchain = ReadInChainDefinition(bind);
  if (readchain == NULL) {
    fprintf(out, "ERROR: Format error detected while reading Mechanism Pathway definition from file.\n");
    fprintf(out, "RESULT: FAILED - Format error in Mechanism Pathway definition.\n");
    fprintf(out, "================================================================================\n");
    if (out != stdout) {
      printf("ReadCheckChain: FAILED - Format error in Mechanism Pathway definition.\n");
      fclose(out);
    }
    return SYSTEM_ERROR_RETURN;
  }

  pathwayName = readchain->Name ? readchain->Name : "UNKNOWN";
  fprintf(out, "Pathway Name: %s\n", pathwayName);
  fprintf(out, "Number of Steps: %d\n", readchain->NumberOfSteps);
  if (readchain->ExtraMolecules != NULL) {
    fprintf(out, "Auxiliary Molecules for all steps: %d\n", readchain->ExtraMolecules->NumberOfMolecules);
  }
  fprintf(out, "--------------------------------------------------------------------------------\n");

  /* 1. Format check */
  if (readchain->NumberOfSteps <= 0 || readchain->Steps == NULL) {
    fprintf(out, "ERROR: Mechanism Pathway contains no steps (NumberOfSteps = %d).\n", readchain->NumberOfSteps);
    fprintf(out, "RESULT: FAILED - Mechanism Pathway contains no steps.\n");
    fprintf(out, "================================================================================\n");
    if (out != stdout) {
      printf("ERROR: Mechanism Pathway '%s' contains no steps.\n", pathwayName);
      fclose(out);
    }
    FreeReadChainSet(readchain);
    Free(readchain);
    return SYSTEM_ERROR_RETURN;
  }

  {
    INT step_format_error = 0;
    LOOPi(readchain->NumberOfSteps) {
      ReadChainReactionStep *s = readchain->Steps + i;
      if (s->Reactions == NULL || s->Reactions->NumberOfReactions == 0) {
        fprintf(out, "ERROR: Step %d contains 0 reaction patterns (Format error: missing continuation character '\\' before auxiliary molecules?).\n", i + 1);
        step_format_error = 1;
      }
    }
    if (step_format_error) {
      fprintf(out, "RESULT: FAILED - Format error: One or more steps contain 0 reaction patterns.\n");
      fprintf(out, "================================================================================\n");
      printf("ReadCheckChain: FAILED - Format error: One or more steps contain 0 reaction patterns.\n");
      if (out != stdout) fclose(out);
      FreeReadChainSet(readchain);
      Free(readchain);
      return SYSTEM_ERROR_RETURN;
    }
  }

  /* 2. Check Molecules in MOLECULE_DATABASE */
  fprintf(out, "\n[1] Molecule Existence Check (MOLECULE_DATABASE):\n");
  fprintf(out, "%-40s %-20s\n", "Molecule_Name", "Database_Status");
  fprintf(out, "---------------------------------------- --------------------\n");

  if (readchain->Molecules != NULL && readchain->Molecules->NumberOfMolecules > 0) {
    ReadInMolecule *mol = readchain->Molecules->Molecules;
    LOOPi(readchain->Molecules->NumberOfMolecules) {
      num_checked_mols++;
      memset(&minfo, 0, sizeof(MoleculeInfo));
      /* Check MOLECULE_DATABASE strictly (no substructure fallback) */
      ret = DBFindMolSubFromString(mol->Name, &minfo, moldinfo);
      if (ret == SYSTEM_NORMAL_RETURN) {
        fprintf(out, "%-40.40s %-20s\n", mol->Name ? mol->Name : "", "EXISTS");
      } else {
        fprintf(out, "%-40.40s %-20s\n", mol->Name ? mol->Name : "", "NOT_FOUND");
        num_missing_mols++;
      }
      mol++;
    }
  } else {
    fprintf(out, "No molecules defined in pathway.\n");
  }

  /* 3. Check Reaction Patterns in PATTERN_DATABASE */
  fprintf(out, "\n[2] Reaction Pattern Existence Check (PATTERN_DATABASE):\n");
  fprintf(out, "%-40s %-20s\n", "Reaction_Pattern_Name", "Database_Status");
  fprintf(out, "---------------------------------------- --------------------\n");

  if (readchain->Reactions != NULL && readchain->Reactions->NumberOfReactions > 0) {
    ReadInReaction *rxn = readchain->Reactions->Reactions;
    LOOPi(readchain->Reactions->NumberOfReactions) {
      num_checked_rxns++;
      memset(&rinfo, 0, sizeof(ReactionInfo));
      ret = DBFindRxnSetFromString(rxn->Name, &rinfo, patdinfo);
      if (ret == SYSTEM_NORMAL_RETURN) {
        fprintf(out, "%-40.40s %-20s\n", rxn->Name ? rxn->Name : "", "EXISTS");
      } else {
        fprintf(out, "%-40.40s %-20s\n", rxn->Name ? rxn->Name : "", "NOT_FOUND");
        num_missing_rxns++;
      }
      rxn++;
    }
  } else {
    fprintf(out, "No reaction patterns defined in pathway.\n");
  }

  fprintf(out, "\n--------------------------------------------------------------------------------\n");
  fprintf(out, "Summary for Pathway '%s':\n", pathwayName);
  fprintf(out, "  Molecules Checked: %d (Missing: %d)\n", num_checked_mols, num_missing_mols);
  fprintf(out, "  Reaction Patterns Checked: %d (Missing: %d)\n", num_checked_rxns, num_missing_rxns);

  if (num_missing_mols == 0 && num_missing_rxns == 0) {
    fprintf(out, "RESULT: SUCCESS - All molecules and reaction patterns exist in database.\n");
    fprintf(out, "================================================================================\n");
    printf("ReadCheckChain: SUCCESS - Mechanism Pathway '%s' is valid (%d mols, %d patterns).\n",
           pathwayName, num_checked_mols, num_checked_rxns);
    ret = SYSTEM_NORMAL_RETURN;
  } else {
    fprintf(out, "RESULT: FAILED - Missing %d molecules and %d reaction patterns in database.\n",
            num_missing_mols, num_missing_rxns);
    fprintf(out, "================================================================================\n");
    printf("ReadCheckChain: FAILED - Mechanism Pathway '%s' has missing items (%d mols missing, %d patterns missing).\n",
           pathwayName, num_missing_mols, num_missing_rxns);
    ret = SYSTEM_ERROR_RETURN;
  }

  if (out != stdout) fclose(out);
  FreeReadChainSet(readchain);
  Free(readchain);

  return ret;
}

/*F DBReadStoreChain(bind)
**
**  DESCRIPTION
**    Reads a ReadChainSet pathway definition from file (TransformDir/TransformRxn.lsr),
**    verifies that all molecules and reaction patterns exist in the database, and if so,
**    stores the pathway in Firestore under collection users/<uid>/databases/MechanismPathway.
**    Writes a status report to <TransformDir>/<TransformRxn>_Store.out and stdout.
*/
extern INT DBReadStoreChain(BindStructure *bind)
{
  CommandMaster *commandmaster;
  ChemDBMaster *master;
  DataBaseInformation *moldinfo, *patdinfo;
  FILE *out;
  ReadChainSet *readchain;
  MoleculeInfo minfo;
  ReactionInfo rinfo;
  INT i, ret;
  INT num_missing_mols = 0, num_checked_mols = 0;
  INT num_missing_rxns = 0, num_checked_rxns = 0;
  CHAR *pathwayName;

  commandmaster = GetBoundStructure(bind, BIND_COMMANDMASTER);
  if (commandmaster == NULL) return SYSTEM_ERROR_RETURN;

  master = GetBoundStructure(bind, BIND_CHEMDBASE);
  if (master == NULL) {
    printf("ERROR: ChemDBMaster (BIND_CHEMDBASE) is NULL. Initialize database first.\n");
    return SYSTEM_ERROR_RETURN;
  }

  moldinfo = GetDataBaseInfoFromID(master->DatabaseInfo, MOLECULE_DATABASE);
  patdinfo = GetDataBaseInfoFromID(master->DatabaseInfo, PATTERN_DATABASE);

  out = OpenWriteFileFromCurrent("TransformDir", "TransformRxn", "Store.out", IGNORE,
                                 "Mechanism Pathway Store Report", commandmaster);
  if (out == NULL) out = stdout;

  fprintf(out, "================================================================================\n");
  fprintf(out, "Mechanism Pathway Firestore Store Report\n");
  fprintf(out, "================================================================================\n");

  readchain = ReadInChainDefinition(bind);
  if (readchain == NULL) {
    fprintf(out, "ERROR: Format error detected while reading Mechanism Pathway definition from file.\n");
    fprintf(out, "RESULT: FAILED - Format error in Mechanism Pathway definition.\n");
    fprintf(out, "================================================================================\n");
    if (out != stdout) {
      printf("ReadStoreChain: FAILED - Format error in Mechanism Pathway definition from file.\n");
      fclose(out);
    }
    return SYSTEM_ERROR_RETURN;
  }

  pathwayName = readchain->Name ? readchain->Name : "UNKNOWN";
  fprintf(out, "Pathway Name: %s\n", pathwayName);
  fprintf(out, "Number of Steps: %d\n", readchain->NumberOfSteps);

  /* Step format check */
  if (readchain->NumberOfSteps <= 0 || readchain->Steps == NULL) {
    fprintf(out, "ERROR: Mechanism Pathway contains no steps (NumberOfSteps = %d).\n", readchain->NumberOfSteps);
    fprintf(out, "RESULT: FAILED - Mechanism Pathway contains no steps.\n");
    fprintf(out, "================================================================================\n");
    if (out != stdout) fclose(out);
    FreeReadChainSet(readchain);
    Free(readchain);
    return SYSTEM_ERROR_RETURN;
  }

  {
    INT step_format_error = 0;
    LOOPi(readchain->NumberOfSteps) {
      ReadChainReactionStep *s = readchain->Steps + i;
      if (s->Reactions == NULL || s->Reactions->NumberOfReactions == 0) {
        fprintf(out, "ERROR: Step %d contains 0 reaction patterns (Format error: missing continuation character '\\' before auxiliary molecules?).\n", i + 1);
        step_format_error = 1;
      }
    }
    if (step_format_error) {
      fprintf(out, "ERROR: Cannot store pathway in Firestore: format errors detected.\n");
      fprintf(out, "RESULT: FAILED - Run ReadCheck first to resolve formatting errors.\n");
      fprintf(out, "================================================================================\n");
      printf("ReadStoreChain: FAILED - Format errors detected (steps with 0 reaction patterns).\n");
      if (out != stdout) fclose(out);
      FreeReadChainSet(readchain);
      Free(readchain);
      return SYSTEM_ERROR_RETURN;
    }
  }

  /* Verify all molecules and reaction patterns exist in database before storing */
  if (readchain->Molecules != NULL && readchain->Molecules->NumberOfMolecules > 0) {
    ReadInMolecule *mol = readchain->Molecules->Molecules;
    LOOPi(readchain->Molecules->NumberOfMolecules) {
      num_checked_mols++;
      memset(&minfo, 0, sizeof(MoleculeInfo));
      /* Check MOLECULE_DATABASE strictly (no substructure fallback) */
      ret = DBFindMolSubFromString(mol->Name, &minfo, moldinfo);
      if (ret != SYSTEM_NORMAL_RETURN) {
        num_missing_mols++;
      }
      mol++;
    }
  }

  if (readchain->Reactions != NULL && readchain->Reactions->NumberOfReactions > 0) {
    ReadInReaction *rxn = readchain->Reactions->Reactions;
    LOOPi(readchain->Reactions->NumberOfReactions) {
      num_checked_rxns++;
      memset(&rinfo, 0, sizeof(ReactionInfo));
      ret = DBFindRxnSetFromString(rxn->Name, &rinfo, patdinfo);
      if (ret != SYSTEM_NORMAL_RETURN) {
        num_missing_rxns++;
      }
      rxn++;
    }
  }

  if (num_missing_mols > 0 || num_missing_rxns > 0) {
    fprintf(out, "ERROR: Cannot store pathway in Firestore: %d molecules and %d reaction patterns are missing from database.\n",
            num_missing_mols, num_missing_rxns);
    fprintf(out, "RESULT: FAILED - Run ReadCheck first to identify missing database records.\n");
    fprintf(out, "================================================================================\n");
    printf("ReadStoreChain: FAILED - Missing database records (%d mols, %d patterns).\n",
           num_missing_mols, num_missing_rxns);
    if (out != stdout) fclose(out);
    FreeReadChainSet(readchain);
    Free(readchain);
    return SYSTEM_ERROR_RETURN;
  }

  ret = StoreReadChainSetToFirestore(readchain, bind);
  if (ret == SYSTEM_NORMAL_RETURN) {
    fprintf(out, "RESULT: SUCCESS - Mechanism Pathway '%s' stored in Firestore.\n", pathwayName);
    fprintf(out, "Firestore Collection: users/<uid>/databases/MechanismPathway/records/%s\n", pathwayName);
    printf("ReadStoreChain: SUCCESS - Mechanism Pathway '%s' stored in Firestore.\n", pathwayName);
  } else {
    fprintf(out, "RESULT: FAILED - Error storing Mechanism Pathway '%s' in Firestore.\n", pathwayName);
    printf("ReadStoreChain: FAILED - Firestore storage error for '%s'.\n", pathwayName);
  }
  fprintf(out, "================================================================================\n");

  if (out != stdout) fclose(out);
  FreeReadChainSet(readchain);
  Free(readchain);

  return ret;
}

