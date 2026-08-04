/*  FILE     bensonord.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    The read in tables are ordered and manipulated
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/

#define DEBUG DEBUG0
 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "basic.h"
#include "comlib.h"
#include "graph.h"
#include "mol0.h"
#include "molprops.h"

#include "molprops/bencalc.c"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static int SortAtomConnections(BensonAtomConnections *c1,
			       BensonAtomConnections *c2);
static int SortCentralAtom(BensonSecondOrder *b1, 
			   BensonSecondOrder *b2);
static void SortSecondOrderBensonTable(BensonSecondOrderTable *bentable);
static SecondOrderBensonTree *ConvertSortedTableToBensonTree(BensonSecondOrderTable *bentable);
static INT CountCentralAtoms(BensonSecondOrderTable *bentable);
static INT CountNumberOfNextType(BensonSecondOrder *value,
			     INT count, INT totalcnt);
static void FillInCentralAtomBranch(CentralAtomBranch *central,
				    BensonSecondOrder *value,
				    INT numberoftype);
static INT FillInCaseConnections(BensonConnectionTree *contree,
				 INT numberofcases,
				 INT depth,
				 BensonSecondOrder *value,
				 INT numberoftype);
static INT CountNumberOfConnectionCases(BensonSecondOrder *value,
					INT depth, INT num);
 
static INT NumberOfCurrentCase(BensonAtomConnections *current,
				   INT depth,
				   BensonSecondOrder *value,
				   INT num);

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
void PrintOutBensonSecondOrder(BensonSecondOrder *benson)
{
  int i;
  BensonAtomConnections *conn;

  conn = benson->Connections;
  LOOPi(benson->NumberOfConnections)
    {
      printf("   (%10d  %10d) \n", conn->Valence, conn->Multiplicity);
      conn++;
    }
}
/*F benson = InitializeBensonCalculation(id,name)
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
extern BensonCalculation *InitializeBensonCalculation(INT id, CHAR *name)
     {
     BensonCalculation *benson;
     
     benson = AllocateBensonCalculation;
     CreateBensonCalculation(benson,id,name,
			     0,7);
     return(benson);
     }
/*F  ret = SetUpSecondOrderTable(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Convert set of Benson Tables to a sorted tree for
**    easy searching and place in BensonCalculation structure
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT SetUpSecondOrderTable(BindStructure *bind)
     {
     SetOfTables *tables;
     BensonSecondOrderTable *bentable;
     INT ret,length;
     BensonCalculation *bensoncalc;
     CHAR *string;
     
     ret = SYSTEM_NORMAL_RETURN;
     
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     bensoncalc = tables->BensonTree;
     
     if(bensoncalc == 0)
	  {
          bensoncalc = tables->BensonTree = AllocateBensonCalculation;
	  CreateBensonCalculation(bensoncalc,tables->ID,tables->Name,
				  0,0);
	  }
     
     if(bensoncalc->SecondOrderTree != 0)
	  {
	  FreeSecondOrderBensonTree(bensoncalc->SecondOrderTree);
	  Free(bensoncalc->SecondOrderTree);
	  }
     
     bentable = CondenseToOneBensonTable(tables->SecondOrder);
     
     SortSecondOrderBensonTable(bentable);
     
     if(DEBUG > DEBUG1)
	  {
	  string = AllocateString(PRINT_BUFFER_LENGTH);
	  length = PRINT_BUFFER_LENGTH;
	  StringSecondOrderBensonTableThermo(string,&length,
					     bentable,tables->AtomTranslations);
	  printf(string);
	  Free(string);
	  }
     
     bensoncalc->SecondOrderTree = ConvertSortedTableToBensonTree(bentable);
     bensoncalc->NumberOfTemperatures = 7;
     
     return(ret);
     }
 
 
/*F table = CondenseToOneBensonTable(tables)
**
**  DESCRIPTION
**    tables - The set of Benson Second Order Tables
**    table  - A single Second Order Table of Benson Values
**
**    Condense a set of Benson Second Order Tables to one
**    single table.  Preparation for sorting and conversion to tree
**
**    It is assumed that the set of temperatures for each table is the
**    same
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
extern BensonSecondOrderTable *CondenseToOneBensonTable(SetOfBenson2ndOrderTables *tables)
{
  BensonSecondOrderTable *bentable, *table;
  INT number,i,j;
  BensonSecondOrder *new,*old;
  
  number = 0;
  table = tables->Tables;
  LOOPi(tables->NumberOfTables)
    {
      number += table->NumberOfTableValues;
      table++;
    }
  
  bentable = AllocateBensonSecondOrderTable;
  CreateBensonSecondOrderTable(bentable,tables->ID,tables->Name,
			       number,0,
			       tables->Tables->NumberOfTemperatures,
			       tables->Tables->Temperatures,
			       "Condense Full Table");
  new = bentable->Values;
  table = tables->Tables;
  LOOPi(tables->NumberOfTables)
    {
      printf("--------------- Combine Table: %s\n",table->Name);
      old = table->Values;
      LOOPj(table->NumberOfTableValues)
	{
	  printf("   Center Atom: %d -> %d Connections\n", old->CenterAtom,old->NumberOfConnections);
	  CopyFullBensonSecondOrder(new,old);
	  qsort((new->Connections),(unsigned int) new->NumberOfConnections,
		BensonAtomConnectionsSize,(int (*)()) SortBensonAtomConnectionsValences);
	  PrintOutBensonSecondOrder(new);
	  new++;
	  old++;
	}
      table++;
    }
  return(bentable);
}
/*f ret = SortAtomConnections(c1,c2)
**
**  DESCRIPTION
**    c1 - First Connection
**    c2 - Second Connection
**
**    Sorted according to Valence and then Multiplicity
**
**  REMARKS
**
*/
static int SortAtomConnections(BensonAtomConnections *c1,
			       BensonAtomConnections *c2)
     {
     INT ret;
     
     if(c1->Valence > c2->Valence)
	  ret = 1;
     else if(c1->Valence < c2->Valence)
	  ret = -1;
     else if(c1->Multiplicity > c2->Multiplicity)
	  ret = 1;
     else if(c1->Multiplicity < c2->Multiplicity)
	  ret = -1;
     else 
	  ret = 0;
     return(ret);
     }
/*f ret = SortCentralAtom(b1,b2)
**
**  DESCRIPTION
**    b1 - First Value
**    b2 - Second Value
**
**    Sorted by:
**    - Central Atom
**    - Number of Connections
**    - The connections (SortAtomConnections)
**
**  REMARKS
**
*/
static int SortCentralAtom(BensonSecondOrder *b1, 
			   BensonSecondOrder *b2)
     {
     INT ret,count;
     BensonAtomConnections *connect1,*connect2;
     
     if(b1->CenterAtom > b2->CenterAtom)
	  ret = 1;
     else if(b1->CenterAtom < b2->CenterAtom)
	  ret = -1;
     else
	  {
	  connect1 = b1->Connections;
	  connect2 = b2->Connections;
	  count = 0;
	  ret = 0;
	  while(count < b1->NumberOfConnections &&
		count < b2->NumberOfConnections &&
		ret == 0)
	       {
	       ret = SortAtomConnections(connect1,connect2);
	       count++;
	       connect1++;
	       connect2++;
	       }
	  if(ret == 0 && b1->NumberOfConnections != b2->NumberOfConnections)
	       {
	       if(b1->NumberOfConnections < b2->NumberOfConnections)
		    ret = -1;
	       else
		    ret = 1;
	       }
	  
	  }
     return(ret);
     }
/*f SortSecondOrderBensonTable(bentable)
**
**  DESCRIPTION
**    bentable - The Benson Thermodynamic Table
**
**    The set of values are sorted according to:
**    - Central Atom
**    - Number of Connections
**    - The Valence of each connection
**    - The multiplicity of each connection
**          
**  REMARKS
**
*/
static void SortSecondOrderBensonTable(BensonSecondOrderTable *bentable)
     {
     BensonSecondOrder *value;
     INT i;
     unsigned int num;
     BensonAtomConnections *conn;
     
     value = bentable->Values;
     LOOPi(bentable->NumberOfTableValues)
	  {
	    conn = value->Connections + 1;
	    num = (unsigned int) value->NumberOfConnections-1;
	    
	    qsort(conn,num,
		  BensonAtomConnectionsSize,
		  (int (*)()) SortAtomConnections);
	    printf("SortSecondOrderBensonTable: %d\n",num);
	    PrintOutBensonSecondOrder(value);
	    value++;
	  }
     

     qsort(bentable->Values, 
	   (unsigned int) bentable->NumberOfTableValues, 
	   BensonSecondOrderSize, 
	   (int (*)()) SortCentralAtom);
     
     }
/*f tree = ConvertSortedTableToBensonTree(bentable)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static SecondOrderBensonTree *ConvertSortedTableToBensonTree(BensonSecondOrderTable *bentable)
     {
     INT numberofcentralatoms,numberoftype,count,i;
     SecondOrderBensonTree *tree;
     CentralAtomBranch *central;
     BensonSecondOrder *value;
     
     numberofcentralatoms = CountCentralAtoms(bentable);
     
     tree = AllocateSecondOrderBensonTree;
     CreateSecondOrderBensonTree(tree,bentable->ID,bentable->Name,
				 numberofcentralatoms,0);
     
     central = tree->CentralAtomTree;
     value = bentable->Values;
     count = 0;
     LOOPi(numberofcentralatoms)
	  {
	  numberoftype = CountNumberOfNextType(value,count,
					       bentable->NumberOfTableValues);
	  
	  CreateCentralAtomBranch(central,i,0,
				  value->CenterAtom,0);
	  printf("ConvertSortedTableToBensonTree: %10d %10d\n",i,value->CenterAtom);

	  FillInCentralAtomBranch(central,value,numberoftype);
	  
	  value += numberoftype;
	  count += numberoftype;
	  central++;
	  }
     return(tree);
     }
/*f count = CountCentralAtoms(bentable)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT CountCentralAtoms(BensonSecondOrderTable *bentable)
     {
     BensonSecondOrder *value;
     INT i,count,current;
     
     count = 1;
     value = bentable->Values;
     current = value->CenterAtom;
     LOOPi(bentable->NumberOfTableValues)
	  {
	  if(value->CenterAtom != current)
	       {
	       count++;
	       current = value->CenterAtom;
	       }
	  value++;
	  }
     return(count);
     }
 
/*f cnt = CountNumberOfNextType(value,count,totalcnt)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT CountNumberOfNextType(BensonSecondOrder *value,
				 INT count, INT totalcnt)
     {
     INT cnt,current;
     
     current = value->CenterAtom;
     cnt = 0;
     while(current == value->CenterAtom && count < totalcnt)
	  {
	  cnt++;
	  count++;
	  value++;
	  }
     return(cnt);
     }
/*f FillInCentralAtomBranch(central,value,numberoftype)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static void FillInCentralAtomBranch(CentralAtomBranch *central,
				    BensonSecondOrder *value,
				    INT numberoftype)
     {
     INT numcase;
     BensonConnectionTree *contree;
     
     numcase = CountNumberOfConnectionCases(value,0,numberoftype);
     
     contree = central->Tree = AllocateBensonConnectionTree;
     CreateBensonConnectionTree(contree,central->ID,central->Name,
				0,0,numcase,0);

     FillInCaseConnections(contree->Cases,numcase,0,value,numberoftype);
     
     }
/*f cnt = FillInCaseConnections(contree,numberofcases,depth,value,numberoftype)
**
**  DESCRIPTION
**    I have not corrected it yet, but in the tables, the elements
      with the most depth have to be listed first.  If not, then
      zeros appear for the valence.

**  REMARKS
**
*/
static INT FillInCaseConnections(BensonConnectionTree *contree,
				 INT numberofcases,
				 INT depth,
				 BensonSecondOrder *value,
				 INT numberoftype)
     {
     INT cnt,numsubcase;
     BensonAtomConnections *current;

     if(numberoftype == 0)
	  {
	  cnt = 0;
	  printf("FillInCaseConnections: (Depth %3d) (numberoftype %3d) (number of cases %3d) \n",
		 depth,numberoftype,numberofcases);
	  }
     else
	  {
	    PrintOutBensonSecondOrder(value);
	    current = value->Connections + depth;
	    cnt = NumberOfCurrentCase(current,depth,value,numberoftype);
	    numsubcase = CountNumberOfConnectionCases(value,depth+1,cnt);
	    printf("FillInCaseConnections: (Depth %3d) (numberoftype %3d) (number of cases %3d) (%3d %3d)\n",
		   depth,numberoftype,numberofcases,cnt,numsubcase);
	    CreateBensonConnectionTree(contree,value->ID,value->Name,
				       0,0,numsubcase,0);
	    
	    contree->Connection = AllocateBensonAtomConnections;
	    CopyFullBensonAtomConnections(contree->Connection,current);
	    
	    if(numsubcase == 0)
	      {
		printf("numsubcase == 0\n");
		contree->ThermoValues = AllocateBensonSecondThermoTable;
		CopyFullBensonSecondThermoTable(contree->ThermoValues,
						value->TableValues);
		cnt = 1;
	      }
	    else
	       {
		 FillInCaseConnections(contree->Cases,numsubcase,depth+1,value,cnt);
	       }
	    value += cnt;
	    cnt += FillInCaseConnections(contree+1,numberofcases-1,depth,value,numberoftype-cnt);
	  }
     printf("return: %10d\n",cnt);
     return(cnt);
     }
/*f
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
     static INT NumberOfCurrentCase(BensonAtomConnections *current,
			       INT depth,
				   BensonSecondOrder *value,
				   INT num)
     {
     INT test,count;
     
     test = 0;
     count = 0;
     while(test == 0 && count < num)
	  {
	  if(depth < value->NumberOfConnections)
	       {
	       test = SortAtomConnections(current,
					  value->Connections + depth);
	       if(test == 0)
		    count++;
	       }
	  else 
	       test = 1;
	  value++;
	  }
     return(count);
     }
     
/*f count = CountNumberOfConnectionCases(value,depth,num)
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT CountNumberOfConnectionCases(BensonSecondOrder *value,
					INT depth, INT num)
     {
     INT count,i,test;
     BensonAtomConnections *current;
     
     if(depth < value->NumberOfConnections)
	  {
	  count = 1;
	  current = value->Connections + depth;
	  LOOPi(num)
	       {
	       if(depth < value->NumberOfConnections)
		    {
		    test = SortAtomConnections(current,
					       value->Connections + depth);
		    }
	       else 
		    test = 1;
	       
	       if(test != 0)
		    {
		    current = value->Connections + depth;
		    count++;
		    }
	       value++;
	       }
	  }
     else
	  count = 0;
     
     return(count);
     }

 
/*F  ret = PrintOut2ndOrderBensonTree(bind)
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
extern INT PrintOut2ndOrderBensonTree(BindStructure *bind)
     {
     SetOfTables *tables;
     INT ret,length;
     BensonCalculation *bensoncalc;
     CHAR *string;
     
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     if(tables->BensonTree != 0)
	  {
	  bensoncalc = tables->BensonTree;
	  
	  ret = SYSTEM_NORMAL_RETURN;
	  
	  if(bensoncalc->SecondOrderTree != 0)
	       {
	       string = AllocateString(3*PRINT_BUFFER_LENGTH);
	       length =  3*PRINT_BUFFER_LENGTH;
	       
	       PrintStringSecondOrderBensonTree(string,&length,
						bensoncalc->SecondOrderTree);
	       printf(string);
	       Free(string);
	       }
	  else
	       Error(0,"No Tree To Print");
	  }
     else
	  Error(0,"No Tree To Print");
     
	  
     return(ret);
     }

 
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
extern CHAR *PrintStringSecondOrderBensonTree(CHAR *string, INT *length,
					      SecondOrderBensonTree *tree)
     {
     INT i;
     CentralAtomBranch *branch;
     
     branch = tree->CentralAtomTree;
     LOOPi(tree->NumberOfCentralAtomTypes)
	  {
	  string = PrintStringCentralAtomBranch(string,length,branch);
	  branch++;
	  }
     return(string);
     }
 
/*F out = PrintStringCentralAtomBranch(in,length,branch)
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
extern CHAR *PrintStringCentralAtomBranch(CHAR *string,
					  INT *length,
					  CentralAtomBranch *branch)
     {
     CHAR *line;
     
     line = AllocateString(LINELENGTH);
     
     sprintf(line,"%10d - \n",branch->CentralAtomValence);
     
     string = PrintStringString(string,length,line);
     
     string = PrintStringBensonConnectionTree(string,length,branch->Tree,
					      "               ");
     Free(line);
     return(string);
     }

 
/*F out = PrintStringBensonConnectionTree(string,length,tree,prefix)
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
extern CHAR *PrintStringBensonConnectionTree(CHAR *string, INT *length,
					     BensonConnectionTree *branch,
					     CHAR *prefix)
     {
     CHAR *line,*newprefix;
     BensonConnectionTree *casebranch;
     INT i;
     
     line = AllocateString(LINELENGTH);
     
     if(branch->Connection != 0)
	  {
	  sprintf(line,"%s%10d (%3d)\n",prefix,
		  branch->Connection->Valence,
		  branch->Connection->Multiplicity);
	  string = PrintStringString(string,length,line);
	  newprefix = AllocateString(LINELENGTH);
	  sprintf(newprefix,"%s                 ",prefix);
	  }
     else
	  newprefix = CopyString(prefix);
     

     if(branch->NumberOfConnectionCases == 0)
       {
	 if(branch->ThermoValues != 0)
	   {
	     sprintf(line,"%s %10.3f\n",newprefix,branch->ThermoValues->HeatOfFormation);
	     string = PrintStringString(string,length,line);
	   }
	 else
	   {
	     sprintf(line,"%s None\n",newprefix);
	     string = PrintStringString(string,length,line);
	   }
       }
     else
       {
	 casebranch = branch->Cases;
	 LOOPi(branch->NumberOfConnectionCases)
	   {
	       string = PrintStringBensonConnectionTree(string,length,casebranch,newprefix);
	       casebranch++;
	       }
	  }
     Free(line);
     Free(newprefix);

     return(string);
     }
