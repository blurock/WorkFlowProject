/*  FILE     scndcorr.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Calculation of the Second Order Values for the Benson Thermodynamics
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/
 
#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "molprops.h"

 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static SetOfBensonCalcConnections *DetermineValenceConnections(Graph *graph);
static void FillInNeighborValences(BensonCalcConnections *connect,
				   Neighbor *atom,
				   Graph *graph,
				   int num);
static int SortINTValences(INT *valence1, INT *valence2);
static void FillInAtomConnections(BensonCalcConnections *connection);
static BensonSecondThermoTable *FindTableValueForConnectionType(INT central,
								BensonCalcConnections *connections,
								SecondOrderBensonTree *tree);
static BensonConnectionTree *FindCenterAtomTree(INT central, SecondOrderBensonTree *tree);
static BensonConnectionTree *RecursiveBensonTreeSearch(BensonConnectionTree *subtree,
						       INT level,
						       BensonCalcConnections *connections);
static void AddValueToTotal(BensonSecondThermoTable *total, 
			    BensonSecondThermoTable *value);

static void ModifyConnection(int valence,BensonCalcConnections *connection);
static int ProduceBondConnections(BensonCalcConnections *commconnection,
				   BensonCalcConnections *connection); 
 
 
/*F  ret = PrintOutMolThermo(bind)
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

extern INT PrintOutMolThermo(BindStructure *bind)
     {
     MoleculeSet *molset;
     BensonSecondThermoTable *benson;
     MoleculeInfo *mol;
     INT i,length;
     CHAR *name,*string;

     molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
     
     benson = AllocateBensonSecondThermoTable;

     name = AllocateString(LINELENGTH);
     string = AllocateString(2 * LINELENGTH);
     
     mol = molset->Molecules;
     LOOPi(molset->NumberOfMolecules)
	  {
	    if(mol->ID >= 0) {
	      length = 2 * LINELENGTH;
	      sprintf(name,"%-30s",mol->Name);
	      ValuesAsTableLine(string,&length,BENSON_THERMO_PROPERTY,
				name,LINELENGTH,mol->Properties, molset->PropertyTypes,
				bind);
	      printf(string);
	    } else {
	      printf("empty molecule\n");
	    }
	    mol++;
	  }

     return(SYSTEM_NORMAL_RETURN);
     }


/*F  ret = CurrentMolThermo(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    This routine calculates the Benson Second order Thermodynamic
**    Quantities for the set of Current Molecules.  The result is 
**    stored in the list of properties for the molecule.
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT CurrentMoleculeBensonThermo(BindStructure *bind) {
  MoleculeSet *molset;
  SetOfTables *tables;
  INT ret;
  CommandMaster *commandmaster;
  FILE *file;
  
  commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
  molset = GetBoundStructure(bind,BIND_CURRENT_MOLECULES);
  tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
  
  file = OpenWriteFileFromCurrent("MolOutDir","MolOutName","benson",
				  IGNORE,"Benson Parameters Output File",
				  commandmaster);
  ret = MolSubBensonThermo(molset,tables->BensonTree,file);
  return(ret);
}

extern INT MolSubBensonThermo(MoleculeSet *molset,BensonCalculation *tree,FILE *file) {
  BensonSecondThermoTable *benson;
  Graph *graph;
  MoleculeInfo *mol;
  INT i;
  CHAR *out;
  int bufferleft;

  out = AllocateString(PRINT_BUFFER_LENGTH);
  bufferleft = PRINT_BUFFER_LENGTH;
     
  graph = AllocateGraph;
     
  if(file) {
    fprintf(file,"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    fprintf(file,"<ThermoData  xmlns=\"http://blurock.forbrf.lth.se/thermo\">\n");
  }
  mol = molset->Molecules;
  LOOPi(molset->NumberOfMolecules) {
    if(file) {
      fprintf(file,"<Benson MoleculeName='%s'>\n",mol->Name);
    }
    GraphFromMolFileForArrays(graph,mol,VALENCE_STANDARD);
    benson = ComputeBensonThermoForGraph(graph,tree,file);
    bufferleft = PRINT_BUFFER_LENGTH;
    PrintStringBensonSecondThermoTable(out,&bufferleft,"BensonTotal",benson);
    if(file) {
      fprintf(file,"%s\n", out);
    }
    StoreBensonInMolecule(mol,benson,molset->PropertyTypes);
    if(file) {
      fprintf(file,"</Benson>\n");
    }
    FreeGraph(graph);
    FreeBensonSecondThermoTable(benson);
    Free(benson);
    mol++;
  }
  Free(graph);
  if(file) {
    fprintf(file,"</ThermoData>\n");
  }
     
  return(SYSTEM_NORMAL_RETURN);
}

 
/*F StoreBensonInMolecule(molecule,benson,types)
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
extern void StoreBensonInMolecule(MoleculeInfo *molecule,
				  BensonSecondThermoTable *benson,
				  SetOfPropertyTypes *types)
     {
     GenPropValue *prop;
     
     prop = StoreValueInPropValue((VOID) benson,
				  BENSON_THERMO_PROPERTY,
				  0,PROP_VALUE_CALC,
				  "Additivity",
				  "Benson Thermodynamics",
				  types);
     if(molecule->Properties == 0)
	  molecule->Properties = InitializeSetOfPropertyValues(types);
	  
     AddProperty(prop,molecule->Properties);
     FreeGenPropValue(prop);
     Free(prop);
     }
/*F ComputeBensonThermoForGraph(graph,tables)
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
extern BensonSecondThermoTable *ComputeBensonThermoForGraph(Graph *graph,
							    BensonCalculation *tree,
							    FILE *file) {
  BensonSecondThermoTable *benson;
  BensonCalcConnections *connection;
  BensonSecondThermoTable *tablevalue;
  SetOfBensonCalcConnections *connections;
  INT *atom,i;
  INT linelength;
  CHAR *line;
     
  line = AllocateString(PRINT_BUFFER_LENGTH);
  linelength = PRINT_BUFFER_LENGTH;

  if(tree != 0) {
    benson = AllocateBensonSecondThermoTable;
    CreateBensonSecondThermoTable(benson,graph->ID, graph->Name,
				  0.0,0.0,
				  tree->NumberOfTemperatures,
				  0);
    connections = DetermineValenceConnections(graph);
    connection = connections->Connections;
    atom = graph->NodeTypes;
    LOOPi(connections->NumberOfAtoms) {
      if(file) {
	fprintf(file,"<BensonAtom valence='%d' index='%d'>\n",connection->ID,i);
      }
      tablevalue = FindTableValueForConnectionType(connection->ID,connection,tree->SecondOrderTree);
      linelength = PRINT_BUFFER_LENGTH;
      if(tablevalue != 0) {
	AddValueToTotal(benson,tablevalue);
	PrintStringBensonSecondThermoTable(line,&linelength,"BensonAtomValues",tablevalue);
	if(file) {
	  fprintf(file,"%s\n",line);
	}
      } else {
	if(file) {
	  printf("<Unknown/>\n");
	} else {
	  printf("No Connection: %s %10d %10d\n",graph->Name,i,connection->ID);
	}
      }
      if(file) {
	fprintf(file,"</BensonAtom>\n");
      }
      connection++;
      atom++;
    }
  } else {
    benson = 0;
    Error(0,"No Benson Tree to do Thermodynamic calculations");
  }
  Free(line);     
  return(benson);
}
/*f connections = DetermineValenceConnections(graph)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static SetOfBensonCalcConnections *DetermineValenceConnections(Graph *graph)
{
  SetOfBensonCalcConnections *set;
  BensonCalcConnections *connection,*commconnection;
  Neighbor *atom;
  unsigned int i,num;
  int *valence;

  set = AllocateSetOfBensonCalcConnections;
  CreateSetOfBensonCalcConnections(set,graph->ID,graph->Name,
				   graph->NumberOfNodes*graph->NumberOfNodes,
				   0);
  commconnection = AllocateBensonCalcConnections;
  set->NumberOfAtoms = 0;
  connection = set->Connections;
  atom = graph->Neighbors;
  valence = graph->NodeTypes;
  LOOPi(graph->NumberOfNodes)
    {
      if(atom->NumberOfNeighbors > 1)
	{
	  CreateBensonCalcConnections(commconnection,*valence,0,
				      atom->NumberOfNeighbors,0,
				      atom->NumberOfNeighbors,0);
	  FillInNeighborValences(commconnection,atom,graph,atom->NumberOfNeighbors);
	  FillInAtomConnections(commconnection);
	  
	  num = ProduceBondConnections(commconnection,connection);
	  connection +=num;
	  set->NumberOfAtoms += num;
	}
      else
	{
	  /*printf("%5d %10d %5d ========= Not included ========================\n", i,*valence,atom->NumberOfNeighbors);*/
	}
      atom++;
      valence++;
    }
  return(set);
}
/*f ans = SortBensonAtomConnectionsValences(valence1,valence2)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static int SortBensonAtomConnectionsValences(BensonAtomConnections *valence1, BensonAtomConnections *valence2)
     {
     return((valence1->Valence)-(valence2->Valence));
     }
/*f FillInNeighborValences(connect,atom,graph)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static int ProduceBondConnections(BensonCalcConnections *commconnection,
				   BensonCalcConnections *connection)
{
  int i,*valence;

  CopyFullBensonCalcConnections(connection,commconnection);
  qsort((connection->Connections),(unsigned int) connection->NumberOfUniqueConnections,
	BensonAtomConnectionsSize,(int (*)()) SortBensonAtomConnectionsValences);
  valence = commconnection->Valences;
  LOOPi(commconnection->NumberOfNeighbors)
    {
  /*

      ModifyConnection(*valence,connection);
      connection++;
  */
      valence++;
    }
  /*
  return commconnection->NumberOfNeighbors;
  */
  return 1;
}
/*f ModifyConnection(valence,connection)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void ModifyConnection(int valence,BensonCalcConnections *connection)
{
  BensonAtomConnections *atomconn,*firstatom,*newatom;
  
  atomconn = connection->Connections;
  if(atomconn->Valence != valence)
    {
      firstatom = AllocateBensonAtomConnections;
      CopyFullBensonAtomConnections(firstatom,atomconn);
      atomconn++;
      while(atomconn->Valence != valence)
	atomconn++;

      FreeBensonAtomConnections(connection->Connections);
      CopyFullBensonAtomConnections(connection->Connections,atomconn);
      FreeBensonAtomConnections(atomconn);
      CopyFullBensonAtomConnections(atomconn,firstatom);
    }

}
/*f FillInNeighborValences(connect,atom,graph)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void FillInNeighborValences(BensonCalcConnections *connection,
				   Neighbor *atom,
				   Graph *graph,
				   int num)
     {
     INT *valence,*neighbor,i;
     
     valence = connection->Valences;
     neighbor = atom->List;
     LOOPi(num)
	  {
	  *valence = NthNodeType(*neighbor,graph);
	  valence++;
	  neighbor++;
	  }
     }
/*f ans = SortINTValences(valence1,valence2)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static int SortINTValences(INT *valence1, INT *valence2)
     {
     return((*valence1)-(*valence2));
     }
/*f FillInAtomConnections(connection)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void FillInAtomConnections(BensonCalcConnections *connection)
     {
     BensonAtomConnections *unique;
     INT *valence,i;
     
     qsort(connection->Valences,(unsigned int) connection->NumberOfNeighbors,
	   INTSize,(int (*)()) SortINTValences);
     
     connection->NumberOfUniqueConnections = 1;
     unique = connection->Connections;
     valence = connection->Valences;
     if(unique != 0)
       {
	 CreateBensonAtomConnections(unique,0,0,*valence,0);
	 LOOPi(connection->NumberOfNeighbors)
	   {
	     if(*valence == unique->Valence)
	       unique->Multiplicity += 1;
	     else
	       {
		 connection->NumberOfUniqueConnections += 1;
		 unique++;
		 CreateBensonAtomConnections(unique,0,0,*valence,1);
	       }
	     valence++;
	   }
       }
     else
       connection->NumberOfUniqueConnections = 0;
     }
/*f ret = FindTableValueForConnectionType(connections,tree)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static BensonSecondThermoTable *FindTableValueForConnectionType(INT central,
								BensonCalcConnections *connections,
								SecondOrderBensonTree *tree)
     {
     BensonConnectionTree *subtree;
     BensonSecondThermoTable *ret;
     
     subtree = FindCenterAtomTree(central,tree);
     if(subtree != 0)
	  {
	  subtree = RecursiveBensonTreeSearch(subtree,0,connections);
	  if(subtree != 0)
	       ret = subtree->ThermoValues;
	  else
	       ret = 0;
	  }
     else
       {
	 printf("FindTableValueForConnectionType: Center not found\n");
	 ret = 0;
       }
     return(ret);
     }
 
/*f subtree = FindCenterAtomTree(central,tree)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static BensonConnectionTree *FindCenterAtomTree(INT central, SecondOrderBensonTree *tree)
     {
     INT count;
     BensonConnectionTree *done;
     CentralAtomBranch *subtree;
     
     done = 0;
     count = 0;
     subtree = tree->CentralAtomTree;
     while(done == 0 && count < tree->NumberOfCentralAtomTypes)
	  { 
	  if(central == subtree-> CentralAtomValence)
	       done = subtree->Tree;
	  subtree++;
	  count++;
	  }
     return(done);
     }

	       
/*f subtree = RecursiveBensonTreeSearch(tree,level,connections)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static BensonConnectionTree *RecursiveBensonTreeSearch(BensonConnectionTree *subtree,
						       INT level,
						       BensonCalcConnections *connections)
{
  BensonConnectionTree *valcase,*done,*ret;
  BensonAtomConnections *connection,*subcase;
  INT count;
  
  if(level < connections->NumberOfUniqueConnections)
    {
      connection = connections->Connections + level;
      done = 0;
      count = 0;
      valcase = subtree->Cases;
      while(done == 0 && count < subtree->NumberOfConnectionCases)
	{
	  subcase = valcase->Connection;
	  if(connection->Valence == subcase->Valence &&
	     connection->Multiplicity == subcase->Multiplicity)
	    {
	      done = valcase;
	    }
	  valcase++;
	  count++;
	}
      if(done != 0)
	ret = RecursiveBensonTreeSearch(done,level+1,connections);
      else
	ret = 0;
    }
  else
    ret = subtree;
  
  return(ret);
}

	       
/*f AddValueToTotal(total,value)
**
**  DESCRIPTION
**    
**  REMARKS
**     It is assumed that the number of heat capacity values
**     are the same for value and total (no check is made).
*/
static void AddValueToTotal(BensonSecondThermoTable *total, 
			    BensonSecondThermoTable *value)
     {
     FLOAT *cptotal,*cpvalue;
     INT i;
     total->HeatOfFormation += value->HeatOfFormation;
     total->Entropy += value->Entropy;
     
     cptotal = total->HeatCapacityValues;
     cpvalue = value->HeatCapacityValues;
     LOOPi(total->NumberOfHeatCapacityValues)
	  {
	  *cptotal += *cpvalue;
	  cptotal++;
	  cpvalue++;
	  }
     }

