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

/*P Prototypes
 */
static void LoopThroughMechanismsToAdd(SetOfDetailedMechanisms *mechset,
                                DetailedMechanism *newmech);
static DetailedMechanism *SetUpEmptyMechanism(int id,
                                              char *mechname,
                                              int mechmolcnt,
                                              int mechrxncnt
                                              );
int FindEqualSetOfMolecules(DataSubSet *orig,
                            DataSubSet *corrs,
                            DetailedMechanism *newmech,
                            DetailedMechanism *mechanism);
int ReallyTheSame(MoleculeInfo *mechmol, MoleculeInfo *newmol,
                  Graph *mechgrp, DataSubSet *mechset);
void AddNewMolecules(DataSubSet *corrs,
                     DetailedMechanism *newmech, 
                     DetailedMechanism *mech);
static INT CanonicalMechReactionEqual(MechanismReaction *r1,
                                      MechanismReaction *r2);
static void CanonicalMechRxn(MechanismReaction *rxn);
void static CalculateMolTotals(MoleculeElectronic *mechele,double *mechchrg,double *mechpol);
static void AddNewMechReactions(DataSubSet *orig,
                                DataSubSet *newset,
                                DetailedMechanism *origmech,
                                DetailedMechanism *newmech);
static int FindInNewReactions(MechanismReaction *rxn,
                              MechanismReactionSet *newrxnset);
static void TransformSetOfMechReactions(DataSubSet *orig,
                                        DataSubSet *newset,
                                        MechanismReactionSet *rxnset);

static void TransformMechReaction(DataSubSet *orig,
                                  DataSubSet *newset,
                                  MechanismReaction *rxn);
static void TransformMechReactionMolecules(DataSubSet *orig,
                                           DataSubSet *newset,
                                           RxnReacProdSet *rxn);
static int TransformMechReactionMol(int mol,
                                    DataSubSet *orig,
                                    DataSubSet *newset);
static DataSubSet *TransferOriginalMoleculeNumbers(MoleculeSet *set);

 
 
 
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static int IsGeneratedID(int id)
{
  int result;
  
  if(id < 1000 || id >= GENERATED_MOLECULE)
    result = 1;
  else 
    result = 0;
  return result;
}
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void PrintList(DataSubSet *set,CHAR *title)
{
  int i,*pnt;
  printf("%s (%s):\n",title,set->Name);
  pnt = set->Points;
  LOOPi(set->NumberOfPoints)
    {
      if(i != 0 && (i % 10) == 0)
        printf("\n");
      
      printf("%8d ",*pnt);
      pnt++;
    }
  printf("\n");
}
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void PrintListOfInts(int *pnt,int numberofints,CHAR *title)
{
  int i;
  printf("%s:\n",title);
  LOOPi(numberofints)
    {
      if(i != 0 && (i % 10) == 0)
        printf("\n");
      
      printf("%8d ",*pnt);
      pnt++;
    }
  printf("\n");
}
  
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static int CountMaximumNumberOfReactions(SetOfDetailedMechanisms *mechset)
{
  DetailedMechanism *mechanism;
  int i,count;

  count = 0;
  mechanism = mechset->Mechanisms;
  LOOPi(mechset->NumberOfMechanisms)
    {
      count += mechanism->RxnSet->NumberOfReactions;
      mechanism++;
    }
  return count;
}
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static int CountMaximumNumberOfMolecules(SetOfDetailedMechanisms *mechset)
{
  DetailedMechanism *mechanism;
  int i,count,num1,num2;

  count = 0;
  mechanism = mechset->Mechanisms;
  LOOPi(mechset->NumberOfMechanisms)
    {
      num1 = mechanism->MolSet->NumberOfMolecules;
      num2 = mechanism->Molecules->NumberOfMolecules;
      count += num1 + num2;
      mechanism++;
    }
  return count;
}
/*F CombineToTotalMechanism(bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern INT CombineToTotalMechanism(BindStructure *bind)
{
  CommandMaster *commandmaster;
  ChemDBMaster *master;
  SetOfDetailedMechanisms *mechset;
  DetailedMechanism *newmech,*newmech1;
  int mechrxncnt,mechmolcnt;
  CHAR *mechname;
  int length;
  char *string;
  FILE *fff;

  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  mechset = GetBoundStructure(bind,BIND_CURRENT_MECHANISMS);
  master = GetBoundStructure(bind,BIND_CHEMDBASE);

  mechname = GetCurrentStringArgument("MechanismName",commandmaster);
  mechrxncnt = CountMaximumNumberOfReactions(mechset);
  mechmolcnt = CountMaximumNumberOfMolecules(mechset);
  printf("Maximum Number of Molecules,Reactions: %20s    %d,%d\n",mechname,mechmolcnt,mechrxncnt);
  newmech = SetUpEmptyMechanism(1000,mechname,mechmolcnt,mechrxncnt);
  LoopThroughMechanismsToAdd(mechset,newmech);

  /*
  length = mechrxncnt*100;
  string = AllocateString(length);
  PrintStringDetailedMechanism(string,&length,"",newmech,bind);
  printf("-------------------------------------------------------\n");
  printf("%s",string);
  printf("-------------------------------------------------------\n");
  */
  fff = fopen("mol.sdf","w");
  printf("----****-------------------------------------------------------****---\n");
  printf("Number of Molecules: %10d\n",newmech->Molecules->NumberOfMolecules);
  PrintMoleculeSetAsMolFile(fff,newmech->Molecules);
  printf("---****-------------------------------------------------------****---\n");
  newmech->ID = newmech->MolSet->NumberOfMolecules +
    2000 * newmech->RxnSet->NumberOfReactions;
  StoreMechanismToDatabase(newmech,master);

  return(SYSTEM_NORMAL_RETURN);
}
 
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void LoopThroughMechanismsToAdd(SetOfDetailedMechanisms *mechset,
                                DetailedMechanism *newmech)
{
  DetailedMechanism *mechanism;
  DataSubSet *molcorrs,*orig;
  int i,count;

  printf("------------- Loop Through Mechanisms ----------------------\n");
  mechanism = mechset->Mechanisms;
  LOOPi(mechset->NumberOfMechanisms)
    {
      printf("Mechanism To Add: %20s\n",mechanism->Name);
      molcorrs = AllocateDataSubSet;
      orig     = AllocateDataSubSet;
      count = FindEqualSetOfMolecules(orig,molcorrs,newmech,mechanism);
      AddNewMolecules(molcorrs,newmech,mechanism);
      AddNewMechReactions(orig,molcorrs,
                          mechanism,
                          newmech);
      FreeDataSubSet(molcorrs);
      FreeDataSubSet(orig);
      Free(molcorrs);
      Free(orig);
      mechanism++;
    }
}
/*F CombineToTotalMechanism(bind)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern DetailedMechanism *AdjustTotalMechanismToDatabase(char *mechname,
                                                         DetailedMechanism *mechanism,
                                                         BindStructure *bind)
{
  CommandMaster *commandmaster;
  ChemDBMaster *master;
  SetOfDetailedMechanisms *mechset;
  DetailedMechanism *newmech;
  DataSubSet *molcorrs,*orig;
  int i,count,mechrxncnt;
  int j;
  MechanismMolecule *molsetmol;

  MechanismReactionSet *newmechrxnset;
  int length;
  char *string;
  string = AllocateString(10000);

  mechrxncnt = mechanism->RxnSet->NumberOfReactions;
  newmech = SetUpEmptyMechanism(1000,mechname,3000,mechrxncnt);

  molcorrs = AllocateDataSubSet;
  orig = ReplaceMoleculesFromDatabase(mechanism->Molecules,bind);
  AddNewMolecules(molcorrs,newmech,mechanism);
  AddNewMechReactions(orig,molcorrs,
                      mechanism,
                      newmech);

  length = 10000;
  PrintStringDetailedMechanism(string,&length,"",newmech,bind);
  printf("****-------------------------------------------------------****\n");
  printf("%s",string);
  return(newmech);
}
 
/*F empty = SetUpEmptyMechanism(id,mechname,mechmolcnt,mechrxncnt)
**
**  DESCRIPTION
**    id: The id of the new mechanism
**    mechname: The name of the new mechanism
**    mechmolcnt: The maximum number of molecules possible (used for allocation)
**    mechrxncnt: The maximum number of reactions possible (used for allocation)
**
**  REMARKS
**
*/
static DetailedMechanism *SetUpEmptyMechanism(int id,
                                              char *mechname,
                                              int mechmolcnt,
                                              int mechrxncnt)
{
  DetailedMechanism *newmech;
  MechanismReactionSet *newmechrxnset;

  newmech = AllocateDetailedMechanism;
  CreateDetailedMechanism(newmech,id,mechname,
                          0,0,0,0,0);

  newmech->Molecules = AllocateMoleculeSet;
  CreateMoleculeSet(newmech->Molecules,id,mechname,
                    mechmolcnt,0,0,0);
  newmech->Molecules->NumberOfMolecules = 0;

  newmech->MolSet = AllocateMechanismMoleculeSet;
  CreateMechanismMoleculeSet(newmech->MolSet,id,mechname,
                             mechmolcnt,0,0);
  newmech->MolSet->NumberOfMolecules = 0;

  newmechrxnset = newmech->RxnSet = AllocateMechanismReactionSet;
  CreateMechanismReactionSet(newmechrxnset,id,mechname,
                             mechrxncnt,0,0);
  newmechrxnset->NumberOfReactions = 0;

  newmech->Reactions = AllocateReactionSet;
  CreateReactionSet(newmech->Reactions,id,mechname,
                    mechrxncnt,0,0);
  newmech->Reactions->NumberOfReactions = 0;

  return newmech;
}
/*S MoleculeEquivalences
 */ 
 
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static DataSubSet *TransferOriginalMoleculeNumbers(MoleculeSet *set)
{
  DataSubSet *ids;
  int i,*id;
  MoleculeInfo *mol;
  
  ids = AllocateDataSubSet;
  CreateDataSubSet(ids,set->ID,set->Name,
                   set->NumberOfMolecules,
                   set->NumberOfMolecules,
                   0);
  id = ids->Points;
  mol = set->Molecules;
  LOOPi(set->NumberOfMolecules)
    {
      *id = mol->ID;
      id++;
      mol++;
    }
  return ids;
}
/*F corrs = FindEqualSetOfMolecules(newmech,mechanism)
**
**  DESCRIPTION
**    newmech: The new mechanism
**    mechanism: The combined mechanism
**    corrs: The set of correspondences
**
**  REMARKS
**
*/
int FindEqualSetOfMolecules(DataSubSet *orig,
                            DataSubSet *corrs,
                            DetailedMechanism *newmech,
                            DetailedMechanism *mechanism)
{
  MoleculeSet *newmols,*mechmols;
  MoleculeInfo *newmol,*mechmol;
  int *corr,*origmol,i,j,mcount,same;
  MoleculeElectronic *newele,*mechele;
  double newchrg,mechchrg,newpol,mechpol;
  DataSubSet *mechset,*origmols;
  Graph *mechgrp;

  newmols = newmech->Molecules;
  mechmols = mechanism->Molecules;

  mechset = AllocateDataSubSet;
  CreateDataSubSet(corrs,mechanism->ID,mechanism->Name,
                   mechmols->NumberOfMolecules,
                   mechmols->NumberOfMolecules,
                   0);
  CreateDataSubSet(orig,mechanism->ID,mechanism->Name,
                   mechmols->NumberOfMolecules,
                   mechmols->NumberOfMolecules,
                   0);
  
  mcount = 0;
  mechmol = mechmols->Molecules;
  corr = corrs->Points;
  LOOPi(mechmols->NumberOfMolecules)
    {
      *corr  = -mechmol->ID;
      mechele = mechmol->Electronic;
      
      CalculateMolTotals(mechele,&mechchrg,&mechpol);
      mechgrp = GraphFromMolFile(mechmol,VALENCE_STANDARD);
      /*      SetUpTotalGraphSet(mechset,mechgrp);*/
      mechset = SetWithoutHydrogen(mechgrp);
      /*      printf("Test if Same: %10d,%10d:%s\n",i,mechmol->ID,mechmol->Name);*/
      newmol = newmols->Molecules;
      LOOPj(newmols->NumberOfMolecules)
        {
          newele = newmol->Electronic;
          CalculateMolTotals(newele,&newchrg,&newpol);
          same = 0;
          if(mechchrg == newchrg && mechpol == newpol)
            {
              same = ReallyTheSame(mechmol,newmol,mechgrp,mechset);
            }
          if(same)
            {
              mcount++;
              *corr = newmol->ID;
              /*printf("Molecule Really the same: %10d,%10d:%s\n",newmol->ID,mechmol->ID,newmol->Name);*/
            }
          newmol++;
        }
      FreeGraph(mechgrp);
      Free(mechgrp);
      FreeDataSubSet(mechset);
      
      corr++;
      mechmol++;
    }
  Free(mechset);
  return mcount;
}
 
/*F AddNewMolecules(count,corrs,newmech,mechanism)
**
**  DESCRIPTION
      count:      
**    corrs:      The correlation with current set
**    newmech:    The new mechanism molecules
**    mechanism:  The current mechanism to merge
**
**  REMARKS
**
*/
void AddNewMolecules(DataSubSet *corrs,
                     DetailedMechanism *newmech, 
                     DetailedMechanism *mechanism)
{
  MoleculeSet *newmols,*mechmols;
  MoleculeInfo *newmol,*mechmol;
  MechanismMoleculeSet *newrxnmols,*mechrxnmols;
  MechanismMolecule *rxnmol,*newrxnmol;
  int *corr,*mcorr,i,j,mcount,same,id;
  char *newname,*abbname;
  ChemkinThermoRead *chemkin;
  GenPropValue *chemkinvalue,*value;
  PropertyValues *values;
  SetOfPropertyTypes *types;
  CHAR *string;
  int length,newlength;

  types = InitializeMolecularPropertyTypes(newmech->ID,newmech->Name);

  newmols = newmech->Molecules;
  if(newmols->PropertyTypes == NULL) 
    newmols->PropertyTypes = InitializeMolecularPropertyTypes(newmech->ID,newmech->Name);

  mechmols = mechanism->Molecules;
  newrxnmols = newmech->MolSet;
  mechrxnmols = mechanism->MolSet;
  
  mechmol = mechmols->Molecules;
  rxnmol = mechrxnmols->Molecules;
  corr = corrs->Points;
  LOOPi(mechmols->NumberOfMolecules)
    {
      /*printf("AddNewMolecules: %5d (%5d,%s)\n", i,*corr,mechmol->Name);*/
      if(*corr < 0)
        {
          id = newmols->NumberOfMolecules;
          newrxnmol = newrxnmols->Molecules + id;
          newmol = newmols->Molecules + id;

	  values = FindValuesFromType(CHEMKIN_READTHERMO_PROPERTY,
				      mechmol->Properties);
	  value = values->Values;
	  chemkin = AllocateChemkinThermoRead;
	  GetPropValue(chemkin,value,types);
	  
	  if(IsGeneratedID(mechmol->ID))
	    {
	      abbname = AllocateString(LINELENGTH);
	      sprintf(abbname,"PP%d-",id);
              length = LINELENGTH - strlen(abbname);
              NameOfMolecule(abbname+strlen(abbname),&length,mechmol);
	      newname = AllocateString(LINELENGTH);
	      sprintf(newname,"PP%d-",id);
	      *corr = id + GENERATED_MOLECULE;
              length = LINELENGTH - strlen(newname);
              GenerateLongName(newname+strlen(newname),&length,mechmol);
              /*printf("The molecule name is:  %s\n",newname); */
	    }
	  else
	    {
	      newname = CopyString(mechmol->Name);
	      /*abbname = CopyString(rxnmol->AbbreviatedName);*/
	      abbname = CopyString(chemkin->Species);
	      *corr = mechmol->ID;
	    }
	  
	  Free(chemkin->Species);
	  chemkin->Species = CopyString(abbname);
	  chemkinvalue = StoreValueInPropValue((VOID) chemkin,
					       CHEMKIN_READTHERMO_PROPERTY,
					       0,
					       PROP_VALUE_CALC,
					       value->Reference,
					       value->Text,
					       types);
	  chemkinvalue->Name = CopyString(value->Name);
	  CopyFullGenPropValue(values->Values,chemkinvalue);
          newmols->NumberOfMolecules++;

          CopyFullMoleculeInfo(newmol,mechmol);
          newmol->ID = *corr;

	  if(newmol->Molfile != 0)
	    {
	      Free(newmol->Molfile->Name);
	      newmol->Molfile->Name = CopyString(newname);
	      newmol->Molfile->ID = *corr;	      
	    }

          Free(newmol->Name);
          newmol->Name = newname;

          CopyFullMechanismMolecule(newrxnmol,rxnmol);
          newrxnmol->ID = *corr;
          newrxnmols->NumberOfMolecules++;
          Free(newrxnmol->Name);
          Free(newrxnmol->AbbreviatedName);
          newrxnmol->Name = CopyString(newname);
          newrxnmol->AbbreviatedName = CopyString(abbname);
	  if(newrxnmol->ThermoConstants)
	    {
	      /*printf("Update Species Name: %s %s\n", newrxnmol->ThermoConstants->Species, abbname);*/
	      newrxnmol->ThermoConstants->Species = CopyString(abbname); 
	    }
	  else
	    printf("Couldn't update Species Name: %s %s  \n",newname,abbname);
          /*printf("New Added Molecules: %10d %20s   (%s)\n",*corr,newmol->Name,newrxnmol->AbbreviatedName);*/
        }
      else
        {
          /*printf("Did Not Add Molecule: %10d\n",*corr);*/
        }
      corr++;
      mechmol++;
      rxnmol++;
    }

  corr = corrs->Points;
  mechmol = mechmols->Molecules;
  LOOPi(mechmols->NumberOfMolecules)
    {
      /*printf("Old: %10d <--- %10d : '%s'\n",*corr, mechmol->ID, mechmol->Name);*/
      corr++;
      mechmol++;
    }
  mechmol = newmols->Molecules;
  LOOPi(newmols->NumberOfMolecules)
    {
      /*printf("New:           %10d : '%s'\n",mechmol->ID, mechmol->Name);*/
      corr++;
      mechmol++;
    }
  length = 100*PRINT_BUFFER_LENGTH;
  string = AllocateString(100*PRINT_BUFFER_LENGTH);
  /*
  PrintChemkinValuesForMolecules(string,&length,newmols);
  printf("%s",string);
  */
}
/*F
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
int ReallyTheSame(MoleculeInfo *mechmol, MoleculeInfo *newmol,
                  Graph *mechgrp, DataSubSet *mechset)
{
  DataSubSet *newset;
  Graph *newgrp;
  int same;
  
  newgrp = GraphFromMolFile(newmol,VALENCE_STANDARD);
  newset = AllocateDataSubSet;
  /*SetUpTotalGraphSet(newset,newgrp);*/
  newset = SetWithoutHydrogen(newgrp);
  /*printf("ReallyTheSame: %10s %10d %10s %10d\n", mechmol->Name,newset->NumberOfPoints, newmol->Name,mechset->NumberOfPoints);*/
  same = IsSubGraph(SUBGRAPH_EQUAL,
                    mechgrp,mechset,
                    newgrp,newset);
  FreeDataSubSet(newset);
  Free(newset);
  FreeGraph(newgrp);
  Free(newgrp);

  return same;
}
/*F CalculateMolTotals(mechele,ele,chrg)
**
**  DESCRIPTION
**    mechele: The electronic info of the molecule
**    ele: returned sum of electronegativities
**    chrg: returned sum of charges
**
**  REMARKS
**
*/
void static CalculateMolTotals(MoleculeElectronic *mechele,double *mechchrg,double *mechpol)
{
  AtomElectronic *atom;
  int i,ichrg,ipol,ic,ip;
  double chrg,pol;

  ichrg = 0;
  ipol = 0;
  atom = mechele->Atoms;
  LOOPi(mechele->NAtoms)
    {
      ip = atom->Electronegativity * 100000. + 0.5;
      ic  =atom->Charge * 1000000. + 05;
      ichrg += ic;
      ipol += ip;
      atom++;
    }
  chrg = ichrg;
  pol = ipol;

  *mechchrg  = chrg;
  *mechpol = pol;
}
/*S Reactions
 */
 
 
/*F AddNewMechReactions(orig,newset,origmech,newmech)
**
**  DESCRIPTION
**    orig,newset: The correspondences
**    origmech: The original mechanism
**    newmech: The new mechanism to add new reactions
**
**  REMARKS
**
*/
static void AddNewMechReactions(DataSubSet *orig,
                                DataSubSet *newset,
                                DetailedMechanism *origmech,
                                DetailedMechanism *newmech)
{
  MechanismReaction *origmechrxn,*newmechrxn;
  MechanismReactionSet *origmechrxnset,*newmechrxnset;
  ReactionSet *origrxnset,*newrxnset;
  ReactionInfo *origrxn,*newrxn;
  int i,found;
  CHAR *line;
  int length;

  origrxnset = origmech->Reactions;
  newrxnset = newmech->Reactions;

  origmechrxnset = AllocateMechanismReactionSet;
  CopyFullMechanismReactionSet(origmechrxnset,origmech->RxnSet);
  newmechrxnset = newmech->RxnSet;
  TransformSetOfMechReactions(orig,newset,origmechrxnset);

  length = 200;
  line = AllocateString(length);

  origrxn = origrxnset->Reactions;
  origmechrxn = origmechrxnset->Reactions;
  LOOPi(origmechrxnset->NumberOfReactions)
    {
      found = FindInNewReactions(origmechrxn,newmechrxnset);
      if(found < 0)
        {
          newmechrxn = newmechrxnset->Reactions + newmechrxnset->NumberOfReactions;
          CopyFullMechanismReaction(newmechrxn,origmechrxn);
          (newmechrxnset->NumberOfReactions)++;
        }
      else
        {
          /*printf("Reaction %d:%s Found as %d\n",origmechrxn->ID,origmechrxn->Name,found);*/
        }
      origrxn++;
      origmechrxn++;
    }
}
 
/*F FindInNewReactions(rxn,newrxnset)
**
**  DESCRIPTION
**    rxn: The reaction to find
**    newrxnset: The set of reactions
**
**  REMARKS
**
*/
static int FindInNewReactions(MechanismReaction *rxn,
                              MechanismReactionSet *newrxnset)
{
  MechanismReaction *comp;
  int found,count;

  count = 0;
  found = -1;
  comp = newrxnset->Reactions;
  while(found < 0 && count < newrxnset->NumberOfReactions)
    {
      if(CanonicalMechReactionEqual(comp,rxn))
        found = count;
      //printf("%s  %s  %d\n", comp->Name, rxn->Name, found);
      comp++;
      count++;
    }
  return found;
}
/*F TransformSetOfMechReactions(orig,newset,rxnset)
**
**  DESCRIPTION
**    orig: The set of original id's
**    newset: The set of corresponding new id's
**    rxnset: The set of reactions to transform
**    
**  REMARKS
**
*/
static void TransformSetOfMechReactions(DataSubSet *orig,
                                        DataSubSet *newset,
                                        MechanismReactionSet *rxnset)
{
  int i;
  MechanismReaction *rxn;
  rxn = rxnset->Reactions;
  LOOPi(rxnset->NumberOfReactions)
    {
      TransformMechReaction(orig,newset,rxn);
      rxn++;
    }
}
/*F TransformMechReaction(orig,newset,rxn)
**
**  DESCRIPTION
**    orig: The set of original id's
**    newset: The set of corresponding new id's
**    rxn: The reaction to transform
**
**  REMARKS
**
*/
static void TransformMechReaction(DataSubSet *orig,
                                  DataSubSet *newset,
                                  MechanismReaction *rxn)
{
  TransformMechReactionMolecules(orig,newset,rxn->Reactants);
  TransformMechReactionMolecules(orig,newset,rxn->Products);
}
 
/*F TransformMechReactionMolecules(orig,newset,rxn)
**
**  DESCRIPTION
**    orig: The set of original id's
**    newset: The set of corresponding new id's
**    rxn: The single reaction side to transform
**
**  REMARKS
**
*/
static void TransformMechReactionMolecules(DataSubSet *orig,
                                           DataSubSet *newset,
                                           RxnReacProdSet *rxn)
{
  int i,*mol;
  
  mol = rxn->Molecules;
  LOOPi(rxn->NumberOfMolecules)
    {
      *mol = TransformMechReactionMol(*mol,orig,newset);
      mol++;
    }
}
 
/*F n = TransformMechReactionMol(mol,orig,newset)
**
**  DESCRIPTION
**    mol:    The id to be translated
**    orig:   The set of original id's (as in original reaction)
**    newset: The set of corresponding new id's (1 to 1 with orig)
**    n:      The new id number
**
**  REMARKS
**
*/
static int TransformMechReactionMol(int mol,
                                    DataSubSet *orig,
                                    DataSubSet *newset)
{
  /*
  int *newmol,*origmol,i,found;
  newmol = orig->Points;
  origmol = newset->Points;
  i = 0;
  found = -1;
  while(found == -1 && i < orig->NumberOfPoints)
    {
      if(*origmol == mol)
        found = *newmol;
      newmol++;
      origmol++;
    }
  if(found == -1)
    {
      printf("FATAL ERROR:  Reaction Molecule not found!!! %d\n",
	     mol);
    }
  */
  return *(newset->Points + mol);
}
/*F CanonicalMechReactionSet(rxnset)
**
**  DESCRIPTION
**    rxnset: The set to make canonical
**
**  REMARKS
**
*/
static void CanonicalMechReactionSet(MechanismReactionSet *rxnset)
{
  MechanismReaction *rxn;
  int i;

  rxn = rxnset->Reactions;
  LOOPi(rxnset->NumberOfReactions)
    {
      CanonicalMechRxn(rxn);
      rxn++;
    }
}
/*f IntegerGreaterThan(i1,i2)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT IntegerGreaterThan(INT *i1, INT *i2)
     {
     return(*i1 - *i2);
     } 

/*F CanonicalMechRxn(rxn)
**
**  DESCRIPTION
**    rxn: Reaction to put in canonical form
**
**  REMARKS
**
*/
static void CanonicalMechRxn(MechanismReaction *rxn)
     {
     qsort(rxn->Reactants->Molecules,
           rxn->Reactants->NumberOfMolecules,
           INTSize,
           IntegerGreaterThan);

     qsort(rxn->Products->Molecules,
           rxn->Products->NumberOfMolecules,
           INTSize,
           IntegerGreaterThan);
     }
/*F CanonicalMechReactionEqual(r1,r2)
**
**  DESCRIPTION
**    This routine checks to see if a reaction from a mechanism is the same.
**    One prerequisite is that it comes from the same source.  This
**    is check by the name (in the generation step, the name of the reaction
**    is the name of the reaction pattern).
**
**    The other check is that the set of reactants/products
**    are the same for both.  The WHILE loop is used to accomidate
**    the cases where a species is duplicated.
**    
**
**  REMARKS
**
*/ 
static INT CanonicalMechReactionEqual(MechanismReaction *r1,
                                      MechanismReaction *r2)
{
  INT count,done,*id1,*id2;
  INT count1,done1;
  INT *vecr,*vecp;
  
  done = 0;
  if(!strcmp(r1->Name,r2->Name)) {
    vecr = id1 = AllocArrayINT(r2->Reactants->NumberOfMolecules);
    id2 = r2->Reactants->Molecules;
    for(count=0;count<r2->Reactants->NumberOfMolecules;count++) {
      *id1++ = *id2++;
    }
    vecp = id1 = AllocArrayINT(r2->Products->NumberOfMolecules);
    id2 = r2->Products->Molecules;
    for(count=0;count<r2->Products->NumberOfMolecules;count++) {
      *id1++ = *id2++;
    }
    if(r1->Reactants->NumberOfMolecules == 
       r2->Reactants->NumberOfMolecules &&
       r1->Products->NumberOfMolecules == 
       r2->Products->NumberOfMolecules)
      {
	id1 = r1->Reactants->Molecules;
	count = 0; done = 1;
	while(done == 1 && count < r1->Reactants->NumberOfMolecules) {
	  /*	id2 = r2->Reactants->Molecules;*/
	  id2 = vecr;
	  count1 = 0; done1 = 0;
	  while(done1 == 0 && count1 < r1->Reactants->NumberOfMolecules) {
	    if(*id1 == *id2) {
	      *id2 = -1;
	      done1 = 1;
	    }
	    count1++; id2++;
	  }
	  if(done1 == 0) done = 0;
	  count++; id1++;
	}
	
	id1 = r1->Products->Molecules;
	count = 0;
	while(done == 1 && count < r1->Products->NumberOfMolecules)
	  {
	    id2 = vecp;
	    count1 = 0; done1 = 0;
	    while(done1 == 0 && count1 < r1->Products->NumberOfMolecules) {
	      if(*id1 == *id2) {
		done1 = 1;
		*id2 = -1;
	      }
	      id2++; count1++;
	    }
	    if(done1 == 0) done = 0;
	    count++;id1++;
	  }
      }
    else
      done = 0;
  }
  return(done);
}
