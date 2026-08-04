/*  FILE     ben2ndorder.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Reading in and Printing the Benson Tables (2nd Order) and 
**    the set of translation tables (for converting valence to
**    table symbol and visa-versa.
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

#include "molprops/bentables.c"

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static INT FillInCentralAtom(CHAR *line, 
			     BensonSecondOrder *value,
			     SetOfBensonAtomTranslationPairs *translation);
static INT FillInConnections(CHAR *line, 
			     BensonSecondOrder *value,
			     SetOfBensonAtomTranslationPairs *translation);
static INT ReadInBensonAtomTranslationSingleLine(CHAR *line, 
						 INT count,
						 BensonTranslationPair *value);



/*S BindReadIn2ndOrdBensonTable
*/
 
/*F  ret = BindReadIn2ndOrdBensonTable(bind)
**
**  DESCRIPTION
**    bind: The bind structure
**
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Bind routine to Read in a single second order benson table
**
**  REMARKS
**
**  SEE ALSO
**      Main Functions: 
**
**  HEADERFILE
**
*/
extern INT BindReadIn2ndOrdBensonTable(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     SetOfTables *tables;
     SetOfBenson2ndOrderTables *bentables;
     FILE *file;
     INT ret;
     
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     
     file = OpenReadFileFromCurrent("TablesDataDirectory","TablesDataBensonRoot",
				    BENSON_2NDORDER_SUFFIX,
				    IGNORE,"Benson 2nd Order Thermodynamic Data",commandmaster);
     
     
     if(file != 0)
	  {
	  if(tables->SecondOrder != 0)
	       {
	       FreeSetOfBenson2ndOrderTables(tables->SecondOrder);
	       Free(tables->SecondOrder);
	       }
	  bentables = tables->SecondOrder = AllocateSetOfBenson2ndOrderTables;
	  CreateSetOfBenson2ndOrderTables(bentables, bind->ID,bind->Name,
					  1,0);
	  	  
	  ret = ReadIn2ndOrderBensonTable(file, bentables->Tables, 
					  tables->AtomTranslations);
	  fclose(file);
	  }
     return(ret);
     }

	  
/*F ret = ReadIn2ndOrderBensonTable(file,table)
**
**  DESCRIPTION
**    file  - The file from which to read the table info
**    table - The allocated space to put the table
**    ret   - SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    Given the already opened file, this routine reads in a complete
**    table of Benson 2nd Order Thermodynamic constants for use in 
**    calculating Heats of formation, entropy and heat capacities.
**
**    Comments are allowed in the file with %%
**
**    1st non-blank line of file:   Title
**    2nd non-blank Line of file:   Reference
**    3rd non-blank line of file:   List of temperatures for Heat capacities
**    Each following non-blank line:
**
**    - Columns 1-25
**      CC - X1N1 X2N2 X3N3 X4N4
**      - CC The center atom
**      - Xn The bound atom type
**      - Nn The number of this type
**    - Columns 25-
**      - Heat Of Formation (298K)
**      - Entropy (298K)
**      - Heat Capacity Values (7 at different temperatures
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
extern INT ReadIn2ndOrderBensonTable(FILE *file, 
				     BensonSecondOrderTable *table,
				     SetOfBensonAtomTranslationPairs *translation)
     {
     CHAR *string,*line,*name;
     INT count,ret;
     BensonSecondOrder *value;
     
     string = AllocateString(LINELENGTH);
     
     line = NextNonBlankLine(file,string);
     
     if(line != 0)
	  {
	    name = CopyString(line);
	    printf("Thermodynamic Table: '%s'\n", name);
	  
	    line = NextNonBlankLine(file,string);
	    if(line != 0)
	       {
	       
		 CreateBensonSecondOrderTable(table, 0,name,
					      MAX_NUMBER_BENSON_VALUES,
					      0,0,0,0);
		 table->Reference = CopyString(line);
		 Free(name);
		 
		 line = NextNonBlankLine(file,string);
		 count = 0;
		 value = table->Values;
		 while(line != 0 && count < MAX_NUMBER_BENSON_VALUES)
		   {
		     ReadInBensonSingleLine(line,count,value,translation);
		     line = NextNonBlankLine(file,string);
		     count++;
		     value++;
		   }
		 if(line != 0)
		   Error(0,"More than the maximum benson values");
		 table->NumberOfTableValues = count;
		 
		 ret = SYSTEM_NORMAL_RETURN;	       
	       }
	    else
	      ret = SYSTEM_ERROR_RETURN;	       
	  }
     else
       ret = SYSTEM_ERROR_RETURN;	       
     return(ret);
     }

 
/*F ret = ReadInBensonSingleLine(line,countvalue,translation)  
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
extern INT ReadInBensonSingleLine(CHAR *line, 
				   INT count,
				   BensonSecondOrder *value,
				   SetOfBensonAtomTranslationPairs *translation)
     {
     INT ret;
     
     CreateBensonSecondOrder(value,count,0,
			     0,
			     MAX_BENSON_BOUND,0,
			     0);
     
     ret = FillInCentralAtom(line,value,translation);
     if(ret ==  SYSTEM_NORMAL_RETURN)
	  {
	  ret = FillInConnections(line,value,translation);
	  if(ret ==  SYSTEM_NORMAL_RETURN)
	       {
	       value->TableValues = AllocateBensonSecondThermoTable;
	       FillInThermoValues(line+25,value->TableValues);
	       }
	  else
	       ret = SYSTEM_ERROR_RETURN;	         
	  }
     else
	  ret = SYSTEM_ERROR_RETURN; 	         
     return(ret);
     }
/*f ret = FillInCentralAtom(line,value,translation)
**
**  DESCRIPTION
**    line - The Benson line
**    value - The structure in which to insert
**    translation - The symbol to valence translation table
**    ret = SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    The central atom (characters 1-3, with '-' as end delimitor)
**    is filled in.
**
**  REMARKS
**
*/
static INT FillInCentralAtom(CHAR *line, 
			     BensonSecondOrder *value,
			     SetOfBensonAtomTranslationPairs *translation)
     {
     CHAR *central;
     
     central = AllocateString(10);
     IsolateNextWord(line,central,DASH,5);
     EliminateBlanks(central);
     value->CenterAtom = TranslateAtomSymbol(central,translation);
     printf("Center Atom: '%s' (%d)\n",central,value->CenterAtom);
     Free(central);
     
     return(SYSTEM_NORMAL_RETURN);
     }
/*f ret = FillInConnections(line,value,translation)
**
**  DESCRIPTION
**    line - The Benson line
**    value - The structure in which to insert
**    translation - The symbol to valence translation table
**    ret = SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  REMARKS
**
*/
static INT FillInConnections(CHAR *line, 
			     BensonSecondOrder *value,
			     SetOfBensonAtomTranslationPairs *translation)
     {
     CHAR *portion,*word;
     BensonAtomConnections *connection;
     
     portion = AllocateString(30);
     IsolateString(line,portion,0,24);
     
     word = AllocateString(25);

     line = IsolateNextWord(portion,word,DASH,25);

     value->NumberOfConnections = 0;
     connection = value->Connections;
     
     while(line != 0 && value->NumberOfConnections  < MAX_BENSON_BOUND)
	  {
	  line = IsolateNextWord(line,word,BLANK,25);
	  if(strlen(word) != 0)
	       {
	       CreateBensonAtomConnections(connection,value->NumberOfConnections,word,0,0);
	       
	       connection->Valence = TranslateAtomSymbol(word,translation);
	       
	       line = IsolateNextWord(line,word,BLANK,25);
	       connection->Multiplicity = ConvertStringToInteger(word);
	       printf("Connection: %s (%d %d)\n",translation,connection->Valence,connection->Multiplicity);

	       value->NumberOfConnections += 1;
	       connection++;
	       }
	  else
	       line= 0;
	  }
     Free(portion);
     Free(word);
     
     return(SYSTEM_NORMAL_RETURN);
     }

 
/*F ret = FillInThermoValues(line,value);
**
**  DESCRIPTION
**    line - The Benson line
**    value - The structure in which to insert
**    ret = SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    
**  REMARKS
**      The input values for Entropy and Heat Capacities are in calories.. 
**      These are converted to kcals
*/
extern INT FillInThermoValues(CHAR *line, 
			      BensonSecondThermoTable *thermo)
     {
     CHAR *rest,*word;
     FLOAT *flt;
     INT count;
     
     rest = line;
     word = AllocateString(25);
     CreateBensonSecondThermoTable(thermo,0,0,
				   (FLOAT) 0.0, (FLOAT) 0.0,7,0);
     
     rest = IsolateNextWord(rest,word,BLANK,20);
     thermo->HeatOfFormation = ConvertStringToFloat(word);
     thermo->HeatOfFormation *= 1000.0;
     
     rest = IsolateNextWord(rest,word,BLANK,20);
     thermo->Entropy = ConvertStringToFloat(word);
     
     count = 0;
     flt = thermo->HeatCapacityValues;
     while(rest != 0 && count < thermo->NumberOfHeatCapacityValues)
	  {
	  rest = IsolateNextWord(rest,word,BLANK,20);
	  *flt = ConvertStringToFloat(word);
	  flt++;
	  count++;
	  }
     thermo->NumberOfHeatCapacityValues = count;
     
     return(SYSTEM_NORMAL_RETURN);
     }

/*S PrintOutBensonTables
*/

 
/*F  ret = PrintOutSecondOrderTables(bind)
**
**  DESCRIPTION
**    bind: The bind structure
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
extern INT PrintOutBensonTables(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     SetOfTables *tables;
     FILE *file;
     INT ret;
     
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     if(tables->SecondOrder != 0)
	  {
	  file = OpenWriteFileFromCurrent("TablesOutputDirectory","TablesDataBensonRoot",
					  "out",
					  IGNORE,"Chemkin Thermodynamic Data",commandmaster);
	  if(file != 0)
	       ret = WriteOutStandardSecondOrderBensonTableSet(file,tables->SecondOrder,
							       tables->AtomTranslations);
	  else
	       ret = SYSTEM_ERROR_RETURN;
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;
     
     return(ret);
     }

 
/*F ret = WriteOutStandardSecondOrderBensonTableSet(file, benson)
**
**  DESCRIPTION
**    file: File to write to
**    set: The benson tables
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
extern INT WriteOutStandardSecondOrderBensonTableSet(FILE *file,
						     SetOfBenson2ndOrderTables *set,
						     SetOfBensonAtomTranslationPairs *translation)
     {
     BensonSecondOrderTable *thermo;
     INT i,length;
     CHAR *string;
     
     string = AllocateString(PRINT_BUFFER_LENGTH);
     length = PRINT_BUFFER_LENGTH;
     
     thermo = set->Tables;
     LOOPi(set->NumberOfTables)
	  {
	  StringSecondOrderBensonTableThermo(string,&length,thermo,translation);
	  fprintf(file,"%s",string);
	  thermo++;
	  }
     Free(string);
     return(SYSTEM_NORMAL_RETURN);
     }

 
/*F string = StringSecondOrderBensonTableThermo(instring,length,thermo,translation)
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
extern CHAR *StringSecondOrderBensonTableThermo(CHAR *string,
						INT *length,
						BensonSecondOrderTable *thermo,
						SetOfBensonAtomTranslationPairs *translation)
     {
     CHAR *line;
     FLOAT *temp;
     BensonSecondOrder *value;
     INT i;
     
     string = PrintStringString(string,length,thermo->Name);
     string = PrintStringString(string,length,"\n");
     string = PrintStringString(string,length,thermo->Reference);
     string = PrintStringString(string,length,"\n");

     string = PrintStringString(string,length,"CC - A1N1 A2N2 A3N3 A4N4    ");
     
     line = AllocateString(20);
     temp = thermo->Temperatures;
     LOOPi(thermo->NumberOfTemperatures)
	  {
	  sprintf(line,"%8.1f  ",*temp++);
	  string = PrintStringString(string,length,line);
	  }
     
     string = PrintStringString(string,length,"\n");

     value = thermo->Values;
     LOOPi(thermo->NumberOfTableValues)
	  {
	  string = BensonSecondOrderLine(string,length,value,translation);
	  string = PrintStringString(string,length,"\n");
	  value++;
	  }
     return(string);
     }
 
/*F out = BensonSecondOrderLine(in,length,value)
**
**  DESCRIPTION
**    in  - The string buffer
**    length - The length of the remaining string buffer
**    value  - The Benson 2nd Order parameters to be printed
**    out - The remaining string buffer
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
extern CHAR *BensonSecondOrderLine(CHAR *in, INT *length, 
				   BensonSecondOrder *value,
				   SetOfBensonAtomTranslationPairs *translation)
     {
     CHAR *trans,*line;
     INT i;
     BensonAtomConnections *connect;
     
     trans = TranslateValenceToString(value->CenterAtom,translation);
     line = AllocateString(LINELENGTH);
     sprintf(line,"%2s - ",trans);
     in = PrintStringString(in,length,line);
     
     connect = value->Connections;
     LOOPi(MAX_BENSON_BOUND)
	  {
	  if(i < value->NumberOfConnections)
	       {
	       trans = TranslateValenceToString(connect->Valence,translation);
	       sprintf(line,"%2s %2d ",trans,connect->Multiplicity);
	       in = PrintStringString(in,length,line);
	       }
	  else
	       in = PrintStringString(in,length,"      ");
	  connect++;
	  }

     in = PrintStringBensonSecondThermoTable(in,length,"",value->TableValues);

     Free(line);
    
     return(in);
     }

 
/*F out = PrintStringBensonSecondThermoTable(in,length,thermo)
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
extern CHAR *PrintStringBensonSecondThermoTable(CHAR *in, INT *length, CHAR *prefix,
						BensonSecondThermoTable *thermo)
     {
     CHAR *line;
     INT i;
     FLOAT *temp;

     line = AllocateString(LINELENGTH);
     sprintf(line,"<%s>\n<HeatOfFormation>%10.4f </HeatOfFormation>\n<Entropy>%10.4f</Entropy>\n",
	     prefix,thermo->HeatOfFormation,thermo->Entropy);
     in = PrintStringString(in,length,line);
     
     temp = thermo->HeatCapacityValues;
     sprintf(line,"<Cp>\n");
     in = PrintStringString(in,length,line);
     LOOPi(thermo->NumberOfHeatCapacityValues)
	  {
	  sprintf(line,"%8.2f ",*temp);
	  in = PrintStringString(in,length,line);
	  temp++;
	  }
     sprintf(line,"\n</Cp>\n</%s> ",prefix);
     in = PrintStringString(in,length,line);
     Free(line);

     return(in);
     }

/*S TranslationTables
*/
 
 
/*F  ret = ReadInBensonTranslationTable(bind)
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
extern INT ReadInBensonTranslationTables(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     SetOfTables *tables;
     SetOfBensonAtomTranslationPairs *table;
     FILE *file;
     INT ret;
     
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);
     
     file = OpenReadFileFromCurrent("TablesDataDirectory","TranslationDataBensonRoot",
				    BENSON_TRANSLATE_SUFFIX,
				    IGNORE,"Benson Translation Tables",commandmaster);
     
     
     if(file != 0)
	  {
	  if(tables->SecondOrder != 0)
	       {
	       FreeSetOfBensonAtomTranslationPairs(tables->AtomTranslations);
	       Free(tables->SecondOrder);
	       }
	  table = tables->AtomTranslations = AllocateSetOfBensonAtomTranslationPairs;
	  	  
	  ret = ReadInBensonTranslationPairs(file, tables->AtomTranslations);
	  }
     return(ret);
     }

 
/*F ret = ReadInBensonTranslationPairs(file,translation)
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
extern INT ReadInBensonTranslationPairs(FILE *file, 
					SetOfBensonAtomTranslationPairs *translation)
     {
     CHAR *string,*line,*name;
     INT count,ret;
     BensonTranslationPair *value;
     
     string = AllocateString(LINELENGTH);
     
     line = NextNonBlankLine(file,string);
     
     if(line != 0)
	  {
	  name = CopyString(line);
	       
	  CreateSetOfBensonAtomTranslationPairs(translation, 0,name,
						MAX_TRANSLATION_VALUES,0);
	  Free(name);
	       
	  line = NextNonBlankLine(file,string);
	  count = 0;
	  value = translation->Pairs;
	  while(line != 0 && count < MAX_TRANSLATION_VALUES)
	       {
	       ReadInBensonAtomTranslationSingleLine(line,count,value);
	       line = NextNonBlankLine(file,string);
	       count++;
	       value++;
	       }
	  if(line != 0)
	       Error(0,"More than the maximum benson values");
	  translation->NumberOfPairs = count;
	  
	  ret = SYSTEM_NORMAL_RETURN;	       
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;	       
     return(ret);
     }

 
/*f ret = ReadInBensonSingleLine(line,countvalue)  
**
**  DESCRIPTION
**    
**  REMARKS
**
*/
static INT ReadInBensonAtomTranslationSingleLine(CHAR *line, 
						 INT count,
						 BensonTranslationPair *value)
     {
     CHAR *word,*rest;
     
     word = AllocateString(20);
     rest = IsolateNextWord(line,word,BLANK,20);
     EliminateBlanks(word);
     CreateBensonTranslationPair(value,count,0,
				 0,word);
     rest = IsolateNextWord(rest,word,BLANK,20);
     value->Valence = ConvertStringToInteger(word);
     Free(word);
     
     return(SYSTEM_NORMAL_RETURN);
     }
 
 
/*F  ret = PrintBensonAtomTranslation(bind)
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
extern INT PrintBensonAtomTranslation(BindStructure *bind)
     {
     CommandMaster *commandmaster;
     SetOfTables *tables;
     FILE *file;
     INT ret,length;
     CHAR *string;
     
     tables = GetBoundStructure(bind,BIND_THERMO_TABLES);
     commandmaster = GetBoundStructure(bind,BIND_COMMANDMASTER);

     if(tables->AtomTranslations != 0)
	  {
	  file = OpenWriteFileFromCurrent("TablesOutputDirectory","TablesDataChemkinRoot",
					  "out",
					  IGNORE,"Benson Atom Translation Table",commandmaster);
	  if(file != 0)
	       {
	       string = AllocateString(PRINT_BUFFER_LENGTH);
	       length = PRINT_BUFFER_LENGTH;
	       StringBensonTranslationTable(string,&length,tables->AtomTranslations);
	       fprintf(file,string);
	       Free(string);
	       fclose(file);
	       ret = SYSTEM_NORMAL_RETURN;
	       }
	  else
	       ret = SYSTEM_ERROR_RETURN;
	  }
     else
	  ret = SYSTEM_ERROR_RETURN;
     
     return(ret);
     }

 
/*F out = StringBensonTranslationTable(in,length,pairs)
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
extern CHAR *StringBensonTranslationTable(CHAR *in,INT *length,
					  SetOfBensonAtomTranslationPairs *pairs)
     {
     INT i;
     BensonTranslationPair *pair;
     CHAR *line;
     
     in = PrintStringString(in,length,pairs->Name);
     in = PrintStringString(in,length,"\n");

     line = AllocateString(LINELENGTH);
     
     pair = pairs->Pairs;
     LOOPi(pairs->NumberOfPairs)
	  {
	  in = PrintStringString(in,length,pair->AtomName);
	  in = PrintStringString(in,length,"  ");
	  sprintf(line,"%10d",pair->Valence);
	  in = PrintStringString(in,length,line);
	  in = PrintStringString(in,length,"\n");
	  pair++;
	  }
     Free(line);
     return(in);
     }

     
/*F valence = TranslateAtomSymbol(string,translation)
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
extern INT TranslateAtomSymbol(CHAR *string, 
			       SetOfBensonAtomTranslationPairs *translation)
     {
     BensonTranslationPair *pair;
     INT count,done;
     
     pair = translation->Pairs;
     count = 0;
     done = 0;
     while(done == 0 && count < translation->NumberOfPairs)
	  {
	  if(!strcmp(pair->AtomName,string))
	       done = pair->Valence;
	  count++;
	  pair++;
	  }
     return(done);
     }

 
/*F string = TranslateValenceToString(valence,translation)
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
extern CHAR *TranslateValenceToString(INT valence, 
				    SetOfBensonAtomTranslationPairs *translation)
     {
     BensonTranslationPair *pair;
     INT count;
     CHAR *done;
     
     pair = translation->Pairs;
     count = 0;
     done = 0;
     while(done == 0 && count < translation->NumberOfPairs)
	  {
	  if(pair->Valence == valence)
	       done = pair->AtomName;
	  count++;
	  pair++;
	  }
     return(done);
     }

