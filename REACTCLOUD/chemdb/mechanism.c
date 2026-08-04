/*  FILE   mechanism.c  
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
#include "rxn.h"
#include "gentrans.h"
#include "chemdb.h"

#include "chemdb/mech.c"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static CHAR *PrintStringSpeciesNameCorrespondences(CHAR *string, INT *length, CHAR *prefix,
						   DetailedMechanism *mechanism);
static MechanismReactionSet *TransferReactionSet(ASCIIProperties *asciimech,
						 BindStructure *bind);
static MechanismMoleculeSet *SetUpMechanismMolecule(MechanismReactionSet *rxnset,
						    BindStructure *bind);
static INT DetermineIfThirdBodyInteraction(MechanismReaction *rxn);
static void InsertAbbreviatedName(MechanismMolecule *mol,
				  SetOfPropertyValues *valueset,
				  SetOfPropertyTypes *types);
static void FillInAuxilliaryConstants(MechanismReaction *rxn,
				      ReactionInfo *rxninfo);
static INT DetermineMoleculesInReaction(MechanismReactionSet *rxnset,
					INT *uniquemols,
					INT max);
static INT IntegerArrayMerge(INT *total, INT numtotal, INT *additional, INT numadd);
static CHAR *PrintStringMechReaction(CHAR *string,INT *length,CHAR *prefix,
				     MechanismReaction *rxn,
				     MechanismMoleculeSet *molset,
				     INT nameflag,
				     INT thirdbody);
static CHAR *OutputMechMolecules(CHAR *string,INT *length,
				 RxnReacProdSet *molecules,
				 INT nameflag,
				 MechanismMoleculeSet *molset);
static CHAR *PrintStringMechArrConstants(CHAR *string, INT *length, 
					 ArrheniusFormValue *constants);
static CHAR *PrintStringAtomList(CHAR *string, INT *length, CHAR *prefix,
				 DetailedMechanism *mechanism);
static INT DetermineSetOfAtoms(MechanismMoleculeSet *molset,INT *atomstart, INT max);
static INT NotMemberAtomList(INT atmnum, INT *atomlist, INT length);
static MechanismMolecule *FindMolInMechMolSet(INT id,
					      MechanismMoleculeSet *molset);
static DbaseKeyword *ComputeMechanismKeyWord(DetailedMechanism *mechanism);
static CHAR *PrintStringSpeciesList(CHAR *string, INT *length, CHAR *prefix,
				    DetailedMechanism *mechanism);
static CHAR *PrintStringAuxilliaryData(CHAR *string, INT *length, CHAR *prefix,
				       SetOfPropertyValues *valset,
				       SetOfPropertyTypes *types,
				       MechanismMoleculeSet *molset);
static MechanismMolecule *FindMolInMechMolSetByName(CHAR *name, MechanismMoleculeSet *molset);
static DbaseKeyword *ProduceKeywordFromName(char *name);
static INT DBPrintAllMechs(BindStructure *bind, INT dbflag);
/*S Mechanisms
 */
 
/*F set = InitializeSetOfDetailedMechanisms(id,name)
**
**  DESCRIPTION
**    id: The id of the bind structure
**    name: The name of the bind structure
**
**  REMARKS
**
*/
extern SetOfDetailedMechanisms *InitializeSetOfDetailedMechanisms(INT id, CHAR *name)
{
  SetOfDetailedMechanisms *set;

  set = AllocateSetOfDetailedMechanisms;
  CreateSetOfDetailedMechanisms(set,id,name,0,0,0);
  return(set);
}
 
/*F SpaceToAddNewMechanismToSet(mechanism)
**
**  DESCRIPTION
**    mechanism: The set of mechanisms 
**
**  REMARKS
**
*/
extern DetailedMechanism *SpaceToAddNewMechanismToSet(SetOfDetailedMechanisms *set)
{
  unsigned int size;
  DetailedMechanism *newarray;
     
  size = set->NumberOfMechanisms * DetailedMechanismSize;
  newarray = AllocArrayDetailedMechanism(set->NumberOfMechanisms + 1);
  memcpy(newarray,set->Mechanisms,size);
     
  Free(set->Mechanisms);
  set->Mechanisms = newarray;
  set->NumberOfMechanisms += 1;

  return(set->Mechanisms + set->NumberOfMechanisms - 1);
}
/*F InsertDetailedMechanismInSet(mechanism)
**
**  DESCRIPTION
**    mechanism: The mechanism
**
**  REMARKS
**
*/
extern int InsertDetailedMechanismInSet(BindStructure *bind,
					DetailedMechanism *mechanism)
{
  SetOfDetailedMechanisms *mechset;
  DetailedMechanism *newmech;

  mechset = GetBoundStructure(bind,BIND_CURRENT_MECHANISMS);

  newmech = SpaceToAddNewMechanismToSet(mechset);
  CopyFullDetailedMechanism(newmech,mechanism);

  return(SYSTEM_NORMAL_RETURN);
}

/*S InputReactionMechanism
*/
/*F  ret = ReadInMechanism(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT ReadInMechanism(BindStructure *bind)
{
  CommandMaster *commandmaster;
  SetOfDetailedMechanisms *mechset;
  FILE *file;
  ASCIIProperties *asciimech;
  DetailedMechanism *mechanism;
  INT max,ret;
     
  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  mechset = GetBoundStructure(bind,BIND_CURRENT_MECHANISMS);
     
  file = OpenReadFileFromCurrent("MechDirectory","RootMechName",
				 MECH_FILE_LIST_SUFFIX,
				 IGNORE,"Mechanism Definition",commandmaster);
  max = GetCurrentIntegerArgument("MechanismMaxNum",commandmaster);
     
  if(file != 0)
    {
      asciimech = ReadInListOfNamesAndProps(file,max,';');
	  
      mechanism = SpaceToAddNewMechanismToSet(mechset);
      ret = TransferASCIIMechanism(asciimech,mechanism,bind);
	  
      fclose(file);
    }
  return(SYSTEM_NORMAL_RETURN);
}
 
/*F TransferASCIIMechanism(asciimech,mechanism,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern INT TransferASCIIMechanism(ASCIIProperties *asciimech,
				  DetailedMechanism *mechanism,
				  BindStructure *bind)
{
     
  CreateDetailedMechanism(mechanism,0,asciimech->Name,
			  0,0,0,0,0);
  mechanism->RxnSet = TransferReactionSet(asciimech,bind);
  mechanism->MolSet = SetUpMechanismMolecule(mechanism->RxnSet,bind);
  return(SYSTEM_NORMAL_RETURN);
}
 
/*F MasterPrintSetOfMechanisms(bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern INT MasterPrintSetOfMechanisms(BindStructure *bind)
{
  CommandMaster *commandmaster;
  SetOfDetailedMechanisms *mechset;
  DetailedMechanism *mechanism;
  FILE *mech,*chemkin,*molecs,*corrs;
  CHAR *string;
  char *dirname,*rootname;
  INT length,i;

  printf("----------------------------------------------------\n");
  printf("               Print out Mechanism\n");
  printf("----------------------------------------------------\n");

  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  mechset = GetBoundStructure(bind,BIND_CURRENT_MECHANISMS);
  
  mech = 0;
  chemkin = 0;
  molecs = 0;
  
  mech = OpenWriteFileFromCurrent("MechDirectory","RootMechName",
				  "mech",
				  IGNORE,"Mechanism Definition",commandmaster);
  chemkin = OpenWriteFileFromCurrent("MechDirectory","RootMechName",
				     "thm",
				     IGNORE,"Thermo Definition",commandmaster);
  molecs = OpenWriteFileFromCurrent("MechDirectory","RootMechName",
				    "sdf",
				    IGNORE,"Molecule in MolFile Form",commandmaster);
  corrs = OpenWriteFileFromCurrent("MechDirectory","RootMechName",
				    "corrs",
				    IGNORE,"Molecule Name Correspondences",commandmaster);
  
  string = AllocateString(500*PRINT_BUFFER_LENGTH);
  length = 500*PRINT_BUFFER_LENGTH;
  mechanism = mechset->Mechanisms;
  LOOPi(mechset->NumberOfMechanisms)
    {
      printf("---------   Printing %20s  ------------------\n",mechanism->Name);
      if(corrs)
	{
	  printf("---------   Printing Correspondences %20s  ------------------\n",mechanism->Name);
	  length = 500*PRINT_BUFFER_LENGTH;
	  PrintStringSpeciesNameCorrespondences(string,&length,"",mechanism);
	  fprintf(corrs,"%s",string);
	  fclose(corrs);
	}
      else
	{
	  printf("Molecule Name Correspondences could not be written out\n");
	}
      if(molecs)
	{
	  PrintMoleculeSetAsMolFile(molecs,mechanism->Molecules);
	  fclose(molecs);
	}
      else
	{
	  printf("Molecules could not be written out\n");
	}
      if(mech)
	{
	  length = 500*PRINT_BUFFER_LENGTH;
	  PrintStringDetailedMechanism(string,&length,"",mechanism,bind);
	  fprintf(mech,"%s",string);
	  fclose(mech);
	}
      if(chemkin)
	{
	  length = 500*PRINT_BUFFER_LENGTH;
	  
	  PrintChemkinValuesForMolecules(string,&length,mechanism->Molecules);
	  fprintf(chemkin,"%s",string);
	  
	  fclose(chemkin);
	}
      mechanism++;
    }
  Free(string);

  return(SYSTEM_NORMAL_RETURN);
}
/*f rxnset = TransferReactionSet(asciimech)
**
**  DESCRIPTION
**    
**
**  REMARKS
**
*/
static MechanismReactionSet *TransferReactionSet(ASCIIProperties *asciimech,
						 BindStructure *bind)
{
  ReactionInfo *rxninfo;
  DataBaseInformation *dinfo;
  GenPropValue *value;
  SetOfPropertyTypes *types;
  ChemDBMaster *master;
  INT i,ret;
  ASCIIProperty *prop;
  MechanismReactionSet *rxnset;
  MechanismReaction *rxn;
     
  master = GetBoundStructure(bind,BIND_CHEMDBASE);
  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,REACTION_DATABASE);
  rxninfo = AllocateReactionInfo;
     
  rxnset = AllocateMechanismReactionSet;
  CreateMechanismReactionSet(rxnset,0,asciimech->Name,
			     asciimech->NumberOfProperties,
			     0,0);
  rxnset->PropTypes = InitializeMechRxnPropertyTypes(asciimech->ID,asciimech->Name);
     
  rxnset->NumberOfReactions = 0;
  types = InitializeReactionPropertyTypes(asciimech->ID,asciimech->Name);

  rxn = rxnset->Reactions;
  prop = asciimech->Properties;
  LOOPi(asciimech->NumberOfProperties)
    {
      ret = DBFindRxnSetFromString(prop->Name,rxninfo,dinfo);
      if(ret == SYSTEM_NORMAL_RETURN)
	{
	  CreateMechanismReaction(rxn,rxnset->NumberOfReactions,prop->Name,
				  0,0,0,0,0,0,0);
	  rxn->Values = InitializeSetOfPropertyValues(rxnset->PropTypes);
	  value = FindBestReactionValue(FORWARD_REACTION_CONSTANTS,rxninfo->Properties);
	  if(value != 0)
	    {
	      rxn->ForwardReference = CopyString(value->Reference);
	      rxn->Forward = TransferReactionConstants(value,types);
	    }
	       
	  value = FindBestReactionValue(REVERSE_REACTION_CONSTANTS,rxninfo->Properties);
	  if(value != 0)
	    {
	      rxn->ForwardReference = CopyString(value->Reference);
	      rxn->Forward = TransferReactionConstants(value,types);
	    }
	       
	  rxn->Reactants = AllocateRxnReacProdSet;
	  CreateRxnReacProdSet(rxn->Reactants,rxnset->NumberOfReactions,prop->Name,
			       rxninfo->NumberOfReactants,rxninfo->Reactants);
	  rxn->Products = AllocateRxnReacProdSet;
	  CreateRxnReacProdSet(rxn->Products,rxnset->NumberOfReactions,prop->Name,
			       rxninfo->NumberOfProducts,rxninfo->Products);
	       
	  FillInAuxilliaryConstants(rxn,rxninfo);
	       
	  FreeReactionInfo(rxninfo);
	       
	  rxnset->NumberOfReactions += 1;
	  rxn++;
	}
      else
	{
	  printf("Reaction Not found:%s\n",prop->Name);
	}
	  
      prop++;
    }
     
  FreeSetOfPropertyTypes(types);
  Free(types);
  Free(rxninfo);
     
  return(rxnset);
}
 
/*f FillInAuxilliaryConstants(rxn,rxninfo)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void FillInAuxilliaryConstants(MechanismReaction *rxn,
				      ReactionInfo *rxninfo)
{
  PropertyValues *props;
  GenPropValue *value;
  INT i;
     
  props = FindValuesFromType(ARRENHIUS_FORM_CONSTANTS,rxninfo->Properties);
  value = props->Values;
  LOOPi(props->NumberOfValues)
    {
      if(!strcmp(value->Name,"ThirdBody"))
	AddProperty(value,rxn->Values);
      value++;
    }
}
     
/*f molset = SetUpMechanismMolecule(rxnset,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**  As an overestimate of the number of molecules, 3 times the number of 
**  reactions is used.
*/
static MechanismMoleculeSet *SetUpMechanismMolecule(MechanismReactionSet *rxnset,
						    BindStructure *bind)
{
  DataBaseInformation *dinfo;
  DbaseKeyword *key;
  ChemDBMaster *master;
  INT overestimate,*uniquemols,numuniquemols,i,ret;
  MechanismMoleculeSet *molset;
  MechanismMolecule *mol;
  MoleculeInfo *molecule;
  SetOfPropertyTypes *types;
     
  master = GetBoundStructure(bind,BIND_CHEMDBASE);
  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,MOLECULE_DATABASE);
  types = InitializeMolecularPropertyTypes(rxnset->ID,rxnset->Name);
     
  overestimate = rxnset->NumberOfReactions * 4;
  uniquemols = AllocArrayINT(overestimate);
  numuniquemols = DetermineMoleculesInReaction(rxnset,uniquemols,overestimate);
     
  molset = AllocateMechanismMoleculeSet;
  CreateMechanismMoleculeSet(molset,rxnset->ID,rxnset->Name,
			     numuniquemols,0,0);
     
  key = AllocateDbaseKeyword;
  molecule = AllocateMoleculeInfo;
     
  mol = molset->Molecules;
  LOOPi(molset->NumberOfMolecules)
    {
      ProduceMolIDKey(*uniquemols,key);
      ret = SearchKeyElement(DB_ID_SEARCH,molecule,key,dinfo);
      if(ret == SYSTEM_NORMAL_RETURN)
	{
	  CreateMechanismMolecule(mol,molecule->ID,molecule->Name,
				  0,0,0,0,0,0);
	  InsertAbbreviatedName(mol,molecule->Properties,types);
	  mol->AtomCounts = DetermineAtomCounts(molecule);
	  InsertThermoValue(mol,molecule->Properties,types);
	  InsertEquilibriumValue(mol,molecule->Properties,types);
	}
      FreeMoleculeInfo(molecule);
      FreeDbaseKeyword(key);
      uniquemols++;
      mol++;
    }
  return(molset);
}
 
/*f InsertAbbreviatedName(mol,values,types)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void InsertAbbreviatedName(MechanismMolecule *mol,
				  SetOfPropertyValues *valueset,
				  SetOfPropertyTypes *types)
{
  PropertyValues *values;
  GenPropValue *value;
     
  values = FindValuesFromType(ALTERNATIVE_NAMES_PROPERTY,valueset);
  value = FindSpecificValueInPropertyValues("Chemkin",values);
  if(value != 0)
    {
      mol->AbbreviatedName = AllocateString(value->NumberOfBytes);
      memcpy(mol->AbbreviatedName,value->Value,(unsigned int) value->NumberOfBytes);
    }
}
/*F InsertThemoValue(mol,values,types)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void InsertThermoValue(MechanismMolecule *mol,
			      SetOfPropertyValues *valueset,
			      SetOfPropertyTypes *types)
{
  PropertyValues *values;
  GenPropValue *value;
     
  values = FindValuesFromType(CHEMKIN_READTHERMO_PROPERTY,valueset);
  value = FindSpecificValueInPropertyValues("Chemkin",values);
  if(value == 0)
    {
      value = FindSpecificValueInPropertyValues("Benson",values);
      if(value != 0)
	value = values->Values;
    }
  if(value != 0)
    {
      mol->ThermoReference = CopyString(value->Reference);

      mol->ThermoConstants = AllocateChemkinThermoRead;
      GetPropValue(mol->ThermoConstants,value,types);
      if(mol->ThermoConstants->Name != 0)
	Free(mol->ThermoConstants->Name);
      mol->ThermoConstants->Name = CopyString(mol->AbbreviatedName);
    }
}
/*f InsertEquilibriumValue(mol,values,types);
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void InsertEquilibriumValue(MechanismMolecule *mol,
				   SetOfPropertyValues *valueset,
				   SetOfPropertyTypes *types)
{
  PropertyValues *values;
  GenPropValue *value;
     
  values = FindValuesFromType(ARRENHIUS_FORM_CONSTANTS,valueset);
     
  value = FindSpecificValueInPropertyValues("Equilibrium",values);
  if(value != 0)
    {
      mol->Equilibrium = AllocateArrheniusFormValue;
      GetPropValue(mol->Equilibrium,value,types);
    }
}

     
/*f numuniquemols = DetermineMoleculesInReaction(rxnset,uniquemols,overestimate)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT DetermineMoleculesInReaction(MechanismReactionSet *rxnset,
					INT *uniquemols,
					INT max)
{
  INT count,i;
  MechanismReaction *rxn;
     
  count = 0;
  rxn = rxnset->Reactions;
  LOOPi(rxnset->NumberOfReactions)
    {
      count = IntegerArrayMerge(uniquemols,count,
				rxn->Reactants->Molecules,
				rxn->Reactants->NumberOfMolecules);
      count = IntegerArrayMerge(uniquemols,count,
				rxn->Products->Molecules,
				rxn->Products->NumberOfMolecules);
      rxn++;
    }
  return(count);
}
 
/*f newcount = IntegerArrayMerge(total,numtotal,additional,numadd)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT IntegerArrayMerge(INT *total, INT numtotal, INT *additional, INT numadd)
{
  INT i,count,done,*newtotal;
     
  LOOPi(numadd)
    {
      count = 0;
      done = 0;
      newtotal = total;
      while(done == 0 && count < numtotal)
	{
	  if(*newtotal == *additional)
	    done = 1;
	  count++;
	  newtotal++;
	}
      if(done == 0)
	{
	  *(total+numtotal) = *additional;
	  numtotal++;
	}
      additional++;
    }
  return(numtotal);
}

	      
     

/*S OutputReactionMechanism
*/
 
/*F string = PrintStringChemkinRxn(string,length,prefix,comment,mechanism,rxnset,thirdbody,constants)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
char *PrintStringChemkinRxn(char *string,int *length,
			    char *prefix,
			    MechanismReaction *rxn,
			    char *comment,
			    DetailedMechanism *mechanism,
			    MechanismReactionSet *rxnset,
			    int thirdbody,
			    int constants)
{
  if(rxn->ForwardReference != 0)
    {
      string = PrintStringString(string,length,comment);
      string = PrintStringString(string,length,rxn->ForwardReference);
      string = PrintStringString(string,length,"\n");
    }
  string = PrintStringMechReaction(string,length,prefix,
				   rxn,mechanism->MolSet,
				   CHEMKIN_NAMES,thirdbody);
  if(constants)
    {
      string = PrintStringString(string,length,"     ");
      string = PrintStringMechArrConstants(string,length,rxn->Forward);
      string = PrintStringAuxilliaryData(string,length,"",
					 rxn->Values,
					 rxnset->PropTypes,
					 mechanism->MolSet);
    }
  string = PrintStringString(string,length,"\n");

  return string;
}
/*F string = PrintStringFabianRxn(string,length,prefix,comment,mechanism,rxnset,thirdbody,constants)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
char *PrintStringFabianRxn(char *string,int *length,
			   char *prefix,
			   MechanismReaction *rxn,
			   char *comment,
			   DetailedMechanism *mechanism,
			   MechanismReactionSet *rxnset,
			   int thirdbody,
			   int constants)
{
  char *temp;

  temp = AllocateString(LINELENGTH);
  if(rxn->Forward != 0)
    {
      sprintf(temp,"%5.0f ",rxn->Forward->SymmetryFactor+.001);
      string = PrintStringString(string,length,temp);
    }
  else
    string = PrintStringString(string,length,"  0.0 ");
  Free(temp);
  string = PrintStringMechReaction(string,length,prefix,
				   rxn,mechanism->MolSet,
				   FULL_NAMES,thirdbody);
  if(constants)
    {
      string = PrintStringString(string,length,"     ");
      string = PrintStringMechArrConstants(string,length,rxn->Forward);
      string = PrintStringString(string,length,"   ");
      string = PrintStringMechArrConstants(string,length,rxn->Reverse);
      string = PrintStringAuxilliaryData(string,length,"",
					 rxn->Values,
					 rxnset->PropTypes,
					 mechanism->MolSet);
    }
  string = PrintStringString(string,length,"\n");
    
  return string;
}

/*f ans = OrderReactions(r1,r2)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static int OrderReactions(void *r1, void *r2)
{
  MechanismReaction *rxn1 = (MechanismReaction *) r1;
  MechanismReaction *rxn2 = (MechanismReaction *) r2;
    if(rxn1->ID > rxn2->ID)
    return 1;
  else if(rxn1->ID < rxn2->ID)
    return -1;
  else
    return 0;
}
/*f PrintStringReactionClassInfo(outstr,outlen,rxn)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *PrintStringReactionClassInfo(CHAR *outstr, INT *outlen,MechanismReaction *rxn)
{
  char *temp;
  temp = AllocateString(LINELENGTH);
  /*
  printf("%80s\n",rxn->ForwardReference);
  printf("%80s\n",rxn->ReverseReference);
 
  sprintf(temp,"%80s\n%80s\n",rxn->ForwardReference,rxn->ReverseReference);
*/
  sprintf(temp,"%-40s = ",rxn->Name);
  outstr = PrintStringString(outstr,outlen,temp);
  outstr = PrintStringMechArrConstants(outstr,outlen,rxn->Forward);
  outstr = PrintStringMechArrConstants(outstr,outlen,rxn->Reverse);
  outstr = PrintStringString(outstr,outlen,"\n");
  return outstr;
}
/*f PrintTotalClassInfo(outstr,outlen,mechanism)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static char *PrintTotalClassInfo(CHAR *outstr, INT *outlen,DetailedMechanism *mechanism)
{
  int i,slen,rxnnum,rxncnt;
  MechanismReaction *rxn;
  MechanismReactionSet *rxnset;

  rxncnt = 0;
  rxnset = mechanism->RxnSet;
  if(rxnset != 0)
    {
      rxnnum = -1000;
      rxncnt++;
      rxn = rxnset->Reactions;
      LOOPi(rxnset->NumberOfReactions)
	{
	  if(rxnnum != rxn->ID)
	    {
	      rxnnum = rxn->ID;
	      slen = 30*LINELENGTH;
	      outstr = PrintStringReactionClassInfo(outstr,outlen,rxn);
	      rxncnt++;
	    }
	  rxn++;
	}
    }

  return outstr;
}
/*F new = PrintStringReactionMechanismEquations(string,length,prefix,mechanism,bind)
**
**  DESCRIPTION
**    
**
**  REMARKS
**
*/
extern CHAR *PrintStringReactionMechanismEquations(CHAR *string, INT *length, CHAR *prefix,
						   DetailedMechanism *mechanism,
						   BindStructure *bind)
{
  MechanismReactionSet *rxnset;
  MechanismReaction *rxn;
  CHAR *comment,*s,*start;
  INT i,thirdbody,rxnnum,rxncnt,rxnstr,slen;
     
  s = start = AllocateString(30*LINELENGTH);

  string = PrintStringString(string,length,"REACTIONS\n");
  slen = 30*LINELENGTH;
  PrintTotalClassInfo(start,&slen,mechanism);
  printf("%s",start);
  rxnset = mechanism->RxnSet;
  if(rxnset != 0)
    {
      comment = AllocateString(LINELENGTH);
      sprintf(comment,"! - %s",prefix);
      qsort(rxnset->Reactions,
	    rxnset->NumberOfReactions,
	    sizeof(MechanismReaction),
	    OrderReactions);

      rxn = rxnset->Reactions;
      rxnnum = -1000;
      rxncnt = 1;
      LOOPi(rxnset->NumberOfReactions)
	{
	  if(rxnnum != rxn->ID)
	    {
	      rxnnum = rxn->ID;
	      if(rxncnt != 1)
		printf("END\n");
	      printf("REACTIONCLASS  = %s\n",rxn->Name);
	      rxncnt++;
	      printf("",start);
	    }
	  rxnstr = 1000;
				       
	  if(rxn->Forward != 0)
	    {

	      thirdbody = DetermineIfThirdBodyInteraction(rxn);
	      slen = 30*LINELENGTH;
	      s = PrintStringChemkinRxn(start,&slen,prefix,
					rxn,comment,mechanism,rxnset,thirdbody,0);
	      printf("%s",start);
	      slen = 30*LINELENGTH;
	      s = PrintStringChemkinRxn(start,&slen,prefix,
					rxn,comment,mechanism,rxnset,thirdbody,1);
		     

	      string = PrintStringString(string,length,start);
	    }
	  rxn++;
	}
      Free(comment);
    }
  printf("END\n");
  string = PrintStringString(string,length,"END\n");
  return(string);
}
/*f ret = DetermineIfThirdBodyInteraction(rxn)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT DetermineIfThirdBodyInteraction(MechanismReaction *rxn)
{
  PropertyValues *values;
  GenPropValue *value;
  INT ret;
     
  values = FindValuesFromType(ARRENHIUS_FORM_CONSTANTS,rxn->Values);
  if(values != 0)
    {
      value = FindSpecificValueInPropertyValues("ThirdBody",values);
      if(value == 0)
	ret = 0;
      else
	ret = 1;
    }
  else 
    ret = 0;
     
  return(ret);
}
/*f string = CommentLineWithFullReactionNames(string,length,prefix,rxn,molset,nameflag,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
** */
static CHAR *PrintStringMechReaction(CHAR *string,INT *length,CHAR *prefix,
				     MechanismReaction *rxn,
				     MechanismMoleculeSet *molset,
				     INT nameflag,
				     INT thirdbody)
{
  string = PrintStringString(string,length,prefix);
  if(thirdbody == 1)
    string = PrintStringString(string,length," M + ");
  string = OutputMechMolecules(string,length,rxn->Reactants,nameflag,molset);
  string = PrintStringString(string,length," = ");
  if(thirdbody == 1)
    string = PrintStringString(string,length," M + ");
  string = OutputMechMolecules(string,length,rxn->Products,nameflag,molset);

  return(string);
}
 
/*f new = OutputMechMolecules(string,length,molecules,nameflag)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *OutputMechMolecules(CHAR *string,INT *length,
				 RxnReacProdSet *molecules,
				 INT nameflag,
				 MechanismMoleculeSet *molset)
{
  MechanismMolecule *mol;
  INT i,*molecule,molid;
     
  molecule = molecules->Molecules;
  LOOPi(molecules->NumberOfMolecules)
    {
      if(i != 0)
	string = PrintStringString(string,length," + "); 
      molid = *molecule;
      if(molid >= GENERATED_MOLECULE)
	molid = molid - GENERATED_MOLECULE;
      mol = FindMolInMechMolSet(molid,molset);
      if(mol != 0)
	{
	  string = PrintStringString(string,length,"{");
	  switch(nameflag)
	    {
	    case FULL_NAMES:
	      string = PrintStringString(string,length,mol->Name);
	      break;
	    case CHEMKIN_NAMES:
	      if(mol->AbbreviatedName != 0)
		string = PrintStringString(string,length,mol->AbbreviatedName);
	      else
		string = PrintStringString(string,length,mol->Name);
	      break;
	    }
	  string = PrintStringString(string,length,"}");
	}
      else
	{
	  printf("Molecule %d (%d) in reaction %s not found\n", *molecule,molid,molecules->Name);
	  string = PrintStringString(string,length,"NotFound");
	}

      molecule++;
    }
  return(string);
}

 
/*f string = PrintStringAuxilliaryData(string,length,prefix,valset,types,molset)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *PrintStringAuxilliaryData(CHAR *string, INT *length, CHAR *prefix,
				       SetOfPropertyValues *valset,
				       SetOfPropertyTypes *types,
				       MechanismMoleculeSet *molset)
{
  ArrheniusFormValue *arrconstant;
  PropertyValues *values;
  GenPropValue *value;
  MechanismMolecule *mol;
  INT i;
  CHAR *line;
     
  values = FindValuesFromType(ARRENHIUS_FORM_CONSTANTS,valset);
  if(values != 0)
    {
      line = AllocateString(LINELENGTH);
	  
      string = PrintStringString(string,length,prefix);
      arrconstant = AllocateArrheniusFormValue;
      value = values->Values;
      LOOPi(values->NumberOfValues)
	{
	  GetPropValue(arrconstant,value,types);
	  mol = FindMolInMechMolSetByName(arrconstant->Name,molset);
	  if(mol != 0)
	    {
	      sprintf(line," %s/%e/ ",mol->AbbreviatedName,arrconstant->Aconstant);
	      string = PrintStringString(string,length,line);
	    }
	  FreeArrheniusFormValue(arrconstant);
	  value++;
	}
      if(values->NumberOfValues > 0)
	string = PrintStringString(string,length,"\n");
     
      Free(line);
      Free(arrconstant);
    }
     
  return(string);
}
/*f new = PrintStringMechArrConstants(string,length,constants)
**
**  DESCRIPTION
**    It is assumed that the Energy is in Calories and it is printed in KiloJoules
**  REMARKS
**
*/
static CHAR *PrintStringMechArrConstants(CHAR *string, INT *length, 
					 ArrheniusFormValue *constants)
{
  CHAR *line;
     
  line = AllocateString(LINELENGTH);
  sprintf(line,"%15.4e %10.4f %10.2f",
	  constants->Aconstant,
	  constants->TempExp,
	  4.182 * (constants->Energy)/1000.0);
     
  string = PrintStringString(string,length,line);
     
  Free(line);
  return(string);
}
 
 
/*f mol = FindMolInMechMolSet(id,molset)
**
**  DESCRIPTION
**    
**  REMARKS
**      Molecule ID cannot be zero
*/
static MechanismMolecule *FindMolInMechMolSet(INT id,
					      MechanismMoleculeSet *molset)
{
  INT count;
  MechanismMolecule *mol,*done;
  int dummy;

  if(id <= molset->NumberOfMolecules)
    done = molset->Molecules + id;
  else
    done = 0;

  if(done == 0)
    {
      count = 0;
      mol = molset->Molecules;
      while(done == 0 && count < molset->NumberOfMolecules)
	{
	  if(mol->ID == id)
	    done = mol;
	  mol++;
	  count++;
	}
    }
  
  return(done);
}
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static MechanismMolecule *FindMolInMechMolSetByName(CHAR *name, MechanismMoleculeSet *molset)
{
  INT count;
  MechanismMolecule *mol,*done;
     
  done = 0;
  count = 0;
  mol = molset->Molecules;
  while(done == 0 && count < molset->NumberOfMolecules)
    {
      if(!strcmp(name,mol->Name))
	done = mol;
      mol++;
      count++;
    }
  return(done);
}
     
/*f notinlist = NotMemberAtomList(atmnum,atomlist,length)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT NotMemberAtomList(INT atmnum, INT *atomlist, INT length)
{
  INT count,notinlist;
     
  count = 0;
  notinlist = 1;
  while(notinlist == 1 && count < length)
    {
      if(atmnum == *atomlist)
	notinlist = 0;
      count++;
      atomlist++;
    }
  return(notinlist);
}
 
/*f numatoms = DetermineSetOfAtoms(molset,atomstart,max)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT DetermineSetOfAtoms(MechanismMoleculeSet *molset,INT *atomstart, INT max)
{
  INT numatoms,i,j;
  MechanismMolecule *mol;
  MoleculeAtomCounts *atomtypes;
  AtomicNumberCount *atomtype;
     
  numatoms = 0;
     
  mol = molset->Molecules;
  LOOPi(molset->NumberOfMolecules)
    {
      atomtypes = mol->AtomCounts;
      if(atomtypes != 0)
	{
	  atomtype = atomtypes->AtomCounts;
	  LOOPj(atomtypes->NumberOfAtomCounts)
	    {
	      if(NotMemberAtomList(atomtype->ID,atomstart,numatoms))
		{
		  *(atomstart+numatoms) = atomtype->ID;
		  numatoms++;
		}
	      atomtype++;
	    }
	}
      else
	printf("No atom count for (%d) %s\n",mol->ID,mol->Name);
      mol++;
    }
  return(numatoms);
}
 
/*f string = PrintStringAtomList(string,&length,"",mechanism);
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *PrintStringAtomList(CHAR *string, INT *length, CHAR *prefix,
				 DetailedMechanism *mechanism)
{
  CHAR *line,*name;
  MechanismMoleculeSet *molset;
  INT max,*atoms,*start,numatoms,i;
     
  line = AllocateString(LINELENGTH);
  molset = mechanism->MolSet;
  max = 5*molset->NumberOfMolecules;
  atoms = start = AllocArrayINT(max);
  numatoms = DetermineSetOfAtoms(molset,atoms,max);

  string = PrintStringString(string,length,prefix);
  string = PrintStringString(string,length,"ELEMENTS");
     
  LOOPi(numatoms)
    {
      if(i%10 == 0)
	{
	  string = PrintStringString(string,length,"\n");
	  string = PrintStringString(string,length,prefix);
	}
      name = AtomNameFromAtomicNumber(*atoms);
      sprintf(line," %s ",name);
      string = PrintStringString(string,length,line);
      atoms++;
    }
  string = PrintStringString(string,length,"\nEND\n");
  Free(start);
  Free(line);
     
  return(string);
}
/*f new = PrintStringSpeciesList(string,length,prefix,mechanism)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *PrintStringSpeciesList(CHAR *string, INT *length, CHAR *prefix,
				    DetailedMechanism *mechanism)
{
  MechanismMoleculeSet *molset;
  MechanismMolecule *mol;
  INT i;
     
  molset = mechanism->MolSet;

  string = PrintStringString(string,length,"SPECIES");
     
  mol = molset->Molecules;
  LOOPi(molset->NumberOfMolecules)
    {
      string = PrintStringString(string,length,"\n");
      if(mol->AbbreviatedName != 0)
	string = PrintStringString(string,length,mol->AbbreviatedName);
      else
	string = PrintStringString(string,length,mol->Name); 
      string = PrintStringString(string,length,"   ");
      mol++;
    }
  string = PrintStringString(string,length,"\nEND\n");
  return(string);
}
/*f new = PrintStringSpeciesNameCorrespondences(string,length,prefix,mechanism)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static CHAR *PrintStringSpeciesNameCorrespondences(CHAR *string, INT *length, CHAR *prefix,
						   DetailedMechanism *mechanism)
{
  MechanismMoleculeSet *molset;
  MechanismMolecule *mol;
  INT i;
  ChemkinThermoRead *chemkin;
  GenPropValue *chemkinvalue,*value;
  PropertyValues *values;
  SetOfPropertyTypes *types;

  molset = mechanism->MolSet;
  types = InitializeMolecularPropertyTypes(molset->ID,molset->Name);

  mol = molset->Molecules;
  LOOPi(molset->NumberOfMolecules)
    {
      string = PrintStringString(string,length,"\n");
      string = PrintStringString(string,length,mol->Name); 
      string = PrintStringString(string,length,"   ");

      if(mol->ThermoConstants)
	{
	  string = PrintStringString(string,length,mol->ThermoConstants->Species); 
	}
      else
	{
	   string = PrintStringString(string,length,mol->AbbreviatedName); 
	}
      mol++;
    }
  /*  string = PrintStringString(string,length,"\nEND\n");*/

  FreeSetOfPropertyTypes(types);
  Free(types);

  return(string);
}
      
 
 
 
/*f string = ReactionLoopFabian(string,length,prefix,rxnset,mechanism)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static char *ReactionLoopFabian(CHAR *string, INT *length, CHAR *prefix,
				MechanismReactionSet *rxnset,
				DetailedMechanism *mechanism)
{
  MechanismReaction *rxn;
  CHAR *s,*comment;
  INT i,thirdbody,rxnnum,rxncnt,rxnstr;

  comment = AllocateString(LINELENGTH);
  sprintf(comment,"! - %s",prefix);
  s = AllocateString(LINELENGTH);
  rxnnum = -1000;
  rxncnt = 1;
  rxn = rxnset->Reactions;
  LOOPi(rxnset->NumberOfReactions)
    {
      if(rxnnum != rxn->ID)
	{
	  rxnnum = rxn->ID;
	  if(rxncnt != 1)
	    string = PrintStringString(string,length,"END\n");
	  sprintf(s,"REACTIONCLASS  = %s\n",rxn->Name);
	  string = PrintStringString(string,length,s);
	  rxncnt++;
	}
      rxnstr = 1000;
				       
      thirdbody = DetermineIfThirdBodyInteraction(rxn);
      string = PrintStringFabianRxn(string,length,prefix,
				    rxn,comment,mechanism,
				    rxnset,thirdbody,0);
      rxn++;
    }
  string = PrintStringString(string,length,"END\n");
  Free(comment);
  Free(s);
  return string;
}
/*F new = PrintStringReactionMechanismEquationsFabian(string,length,prefix,mechanism,bind)
**
**  DESCRIPTION
**    
**
**  REMARKS
**
*/
extern CHAR *PrintStringReactionMechanismEquationsFabian(CHAR *string, INT *length, CHAR *prefix,
							 DetailedMechanism *mechanism,
							 BindStructure *bind)
{
  MechanismReactionSet *rxnset;
  MechanismReaction *rxn;
  CHAR *comment,*s,*start;
  INT i,thirdbody,rxnnum,rxncnt,rxnstr,slen;
  
  start = AllocateString(30*LINELENGTH);
     
  rxnset = mechanism->RxnSet;
  if(rxnset != 0)
    {
      qsort(rxnset->Reactions,
	    rxnset->NumberOfReactions,
	    sizeof(MechanismReaction),
	    OrderReactions);
      string = PrintStringString(string,length,"CLASSCOEFFICIENTS\n");
      string = PrintTotalClassInfo(string,length,mechanism);
      string = PrintStringString(string,length,"END\n");

      string = PrintStringString(string,length,"CLASSEQUIVALENT\n");
      string = PrintStringString(string,length,"END\n");
      string = ReactionLoopFabian(string,length,prefix,rxnset,mechanism);
    }
  return(string);
}
/*F str = PrintStringDetailedMechanism(string,length,prefix,mechanism,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern CHAR *PrintStringDetailedMechanism(CHAR *string, INT *length, CHAR *prefix,
					  DetailedMechanism *mechanism,
					  BindStructure *bind)
{
  /*string = PrintStringAtomList(string,length,prefix,mechanism);*/
  /*  string = PrintStringSpeciesList(string,length,prefix,mechanism);*/
  string = PrintStringReactionMechanismEquationsFabian(string,length,prefix,mechanism,bind);
  return(string);
}
 
/*F WriteOutDetailedMechanism(mechanism,bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern void WriteOutDetailedMechanism(DetailedMechanism *mechanism,
				      BindStructure *bind)
{
  char *string;
  int length;
  CommandMaster *commandmaster;
  FILE *mech,*chemkin,*molecs,*corrs;
  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

  printf("------------------------------------------------------------\n");
  printf("                  Write Out Detailed Mechanism\n");
  printf("------------------------------------------------------------\n");

  mech = 0;
  chemkin = 0;
  molecs = 0;

  mech = OpenWriteFileFromCurrent("MechDirectory","RootMechName",
				  "mech",
				  IGNORE,"Mechanism Definition",commandmaster);
  chemkin = OpenWriteFileFromCurrent("MechDirectory","RootMechName",
				     "thm",
				     IGNORE,"Thermo Definition",commandmaster);
  molecs = OpenWriteFileFromCurrent("MechDirectory","RootMechName",
				    "sdf",
				    IGNORE,"Molecule in MolFile Form",commandmaster);
  corrs = OpenWriteFileFromCurrent("MechDirectory","RootMechName",
				    "corrs",
				    IGNORE,"Molecule in MolFile Form",commandmaster);
  string = AllocateString(100*PRINT_BUFFER_LENGTH);

  if(corrs)
    {
      length = 100*PRINT_BUFFER_LENGTH;
      PrintStringSpeciesNameCorrespondences(string,&length,"",mechanism);
      fprintf(corrs,"%s",string);
      
      fclose(corrs);
    }
  else
    {
      printf("Molecules could not be written out\n");
    }
  if(molecs)
    {
      PrintMoleculeSetAsMolFile(molecs,mechanism->Molecules);
      fclose(molecs);
    }
  else
    {
      printf("Molecules could not be written out\n");
    }
  if(mech)
    {
      length = 100*PRINT_BUFFER_LENGTH;
      PrintStringDetailedMechanism(string,&length,"",mechanism,bind);
      fprintf(mech,"%s",string);
      fclose(mech);
    }
  if(chemkin)
    {
      length = 100*PRINT_BUFFER_LENGTH;

      PrintChemkinValuesForMolecules(string,&length,mechanism->Molecules);
      fprintf(chemkin,"%s",string);

      fclose(chemkin);
    }
  Free(string);
}

/*S InitializeTheProperties
*/
/*F types = InitializeMechRxnPropertyTypes(id,name)
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
extern SetOfPropertyTypes *InitializeMechRxnPropertyTypes(INT id, CHAR *name)
{
  SetOfPropertyTypes *types;

  types = AllocateSetOfPropertyTypes;
  CreateSetOfPropertyTypes(types,id,name,
			   1,0);
     
  SetUpArrheniusFormValues(types->Types + 0);
  return(types);
}

     

/*S MechanismDataBase
*/
 
/*F  ret = StoreSetOfMechanismsInDatabase(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT StoreSetOfMechanismsInDatabase(BindStructure *bind)
{
  ChemDBMaster *master;
  SetOfDetailedMechanisms *mechset;
  DetailedMechanism *mechanism;
  INT i;
  
  master = GetBoundStructure(bind,BIND_CHEMDBASE);
  mechset = GetBoundStructure(bind,BIND_CURRENT_MECHANISMS);
  
  mechanism = mechset->Mechanisms;
  LOOPi(mechset->NumberOfMechanisms)
    {
      mechanism->ID = 
	mechanism->Reactions->NumberOfReactions*1000+
	mechanism->Molecules->NumberOfMolecules;
      printf("Mechanism to Store: %10d: %s\n",mechanism->ID,mechanism->Name);
      StoreMechanismToDatabase(mechanism,master);
      mechanism++;
    }
  return(SYSTEM_NORMAL_RETURN);
}
/*F ret = StoreMechanismToDatabase(mechanism,master)
**
**  DESCRIPTION
**      mechanism: The mechanism to store
**      master: The master information of the database
**
**      This stores the mechanism into the database
**
**  REMARKS
**
*/
extern INT StoreMechanismToDatabase(DetailedMechanism *mechanism,
				    ChemDBMaster *master)
{
  DetailedMechanism *mech;
  DataBaseInformation *dinfo;
  DbaseKeyword *key;
     
  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,MECHANISM_DATABASE);
  key = ComputeMechanismKeyWord(mechanism);
      
  StoreElement((VOID) mechanism,
	       key,GDBM_REPLACE,
	       dinfo);
  FreeDbaseKeyword(key);
  Free(key);
  return(SYSTEM_NORMAL_RETURN);
}
/*F  ret = DBPrintAllMechanisms(bind) . . . . . . . . . bind: print molecules
**
**  DESCRIPTION
**    bind: The bind structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Print out the names of the mechanisms in the database (to stdout)
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: DBPrintAllMolSubs
**
**  HEADERFILE
**
*/
extern INT DBPrintAllMechanisms(BindStructure *bind)
{
  INT ret;
     
  ret = DBPrintAllMechs(bind,MECHANISM_DATABASE);
  return(ret);
}
/*f  ret = DBPrintAllMechs(bind,dbflags)  . . . . . . . . . . . static: print
**  DESCRIPTION
**
**    bind: The bind structure
**    dbflag:  
**      The database info flag (GetDataBaseInfoFromID is used to
**      fetch the DatabaseInfo structure
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The main work routine for printing out a list of molecules or structures.
**    The database is looped through using FetchFirstElement and FetchNextElement.
**
**  REMARKS
**
*/
static INT DBPrintAllMechs(BindStructure *bind, INT dbflag)
{
  DetailedMechanism *mechanism;
  DbaseKeyword *keyword;
  DataBaseInformation *dinfo;
  INT ret;
  ChemDBMaster *master;
     
  master = GetBoundStructure(bind,BIND_CHEMDBASE);
     
  mechanism = AllocateDetailedMechanism;
  keyword = AllocateDbaseKeyword;
  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,dbflag);
     
  ret = FetchFirstElement((VOID *) mechanism,keyword,dinfo);
     
  if(ret == SYSTEM_NORMAL_RETURN)
    {
      while(ret == SYSTEM_NORMAL_RETURN)
	{
	  printf("%10d: -->%s<--\n",mechanism->ID,mechanism->Name);
	  ret = FetchNextElement((VOID *) mechanism,keyword,dinfo);;
	}
      Free(mechanism);
      FreeDbaseKeyword(keyword);
    }
     
  Free(keyword);
	  
  return(SYSTEM_NORMAL_RETURN);
}
/*F ret = RetrieveMechanismsFromDatabase(bind)
**
**  DESCRIPTION
**      mechanism: The mechanism to store
**      master: The master information of the database
**
**      This stores the mechanism into the database
**
**  REMARKS
**
*/
extern INT RetrieveMechanismsFromDatabase(BindStructure *bind)
{
  CommandMaster *commandmaster;
  ChemDBMaster *master;
  DetailedMechanism *mechanism;
  DataBaseInformation *dinfo;
  DbaseKeyword *key;
  FILE *file;
  char *line,*mechname,*line1;
  int ret,final;

  line = AllocateString(LINELENGTH);

  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  master = GetBoundStructure(bind,BIND_CHEMDBASE);
  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,MECHANISM_DATABASE);

  file = OpenReadFileFromCurrent("MechDirectory","RootMechName",
				 "lst",
				 IGNORE,"Set of Mechanisms",commandmaster);

  mechanism = AllocateDetailedMechanism;

  final = SYSTEM_NORMAL_RETURN;
  line1 = NextNonBlankLine(file,line);
  printf("Retrieve Mechanisms From Database\n");
  while(line1 != 0)
    {
      printf("Mechanism Retrieve: '%s'\n",line1);
      key = ProduceKeywordFromName(line1);
      
      ret = FetchElement((VOID *) mechanism,
			 key,
			 dinfo);
      
      if(ret == SYSTEM_NORMAL_RETURN)
	{
	  InsertDetailedMechanismInSet(bind,mechanism);
	}
      else
	{
	  final = SYSTEM_ERROR_RETURN;
	}
      line1 = NextNonBlankLine(file,line);
      FreeDbaseKeyword(key);
      Free(key);
    }
  Free(line);
  return final; 
}
/*F ret = InitializeMechanismDataBase(bind)
**
**  DESCRIPTION
**    This initializes the mechanism database
**
**  REMARKS
**
*/
extern INT InitializeMechanismDataBase(BindStructure *bind)
{
  ChemDBMaster *master;
  DataBaseInformation *dinfo;

  master = GetBoundStructure(bind,BIND_CHEMDBASE);
  dinfo = GetDataBaseInfoFromID(master->DatabaseInfo,MECHANISM_DATABASE);

  return CreateDataBase(dinfo);
}
/*f ComputeMechanismKeyWord(mechanism)
**
**  DESCRIPTION
**    mechanism: The mechanism structure
**
**    This routine determines the keyword to be used by the 
**    database access routines
**
**  REMARKS
**
*/
static DbaseKeyword *ComputeMechanismKeyWord(DetailedMechanism *mechanism)
{
  return ProduceKeywordFromName(mechanism->Name);
}
/*F key = ProduceKeywordFromName(name)
**
**  DESCRIPTION
**    name: The name of the mechanism for the key
**
**  REMARKS
**
*/
static DbaseKeyword *ProduceKeywordFromName(char *name)
{
  DbaseKeyword *key;
  
  key = AllocateDbaseKeyword;
  CreateDbaseKeyword(key,0,name,
		     (INT) strlen(name)+1,name);
  
} 
