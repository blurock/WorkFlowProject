/*  FILE   rmolfile.c  
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
#include "rxn.h"
#include "molprops.h"
 
/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/

/*S  ReadRXNMolFile
*/
/*F  ReadRXNMolFile(file,reaction,metaset)
**
**  DESCRIPTION
**   The reaction molfile has the following form
**   ------------------------------------------------------
**   $RFMT $RIREG nnnnn
**   $RXN
**   (ignore)
**   (ignore)
**   (ignore)
**   pppprrr
**   [Set of Reactant Molfiles]
**   [Set of Product Molfiles]
**   ------------------------------------------------------
**    nnnnn  The reaction registry number
**    ppp    The number of products
**    rrr    The number of reactants
**
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
extern void ReadRXNMolFile(FILE *file, 
			   MolFileReaction *reaction,
			   SetOfMolFileMetaAtoms *metaset)
     {
     CHAR *line,*string,*name;
     INT id,reactants,products,i,error;
     MolFileMolecule *mol;
     
     line = AllocateString(LINELENGTH);
     
     fgets(line,LINELENGTH,file);
     id= ConvertStringToInteger(line+13);
     
     fgets(line,LINELENGTH,file);
     fgets(line,LINELENGTH,file);
     fgets(line,LINELENGTH,file);
     fgets(line,LINELENGTH,file);
     name = CopyNAME(line);
     EliminateBlanks(name);
     string = strchr(name,ENDOFLINE);
     if(string != 0) *string = ENDOFSTRING;
     
     fgets(line,LINELENGTH,file);
     
     reactants = 0;
     products = 0;
     sscanf(line,"%3d%3d",
	    &reactants,
	    &products);
     
     CreateMolFileReaction(reaction,id,name,
			   reactants,products,
			   0,0,0);
     error = 0;
     mol = reaction->Reactants;
     LOOPi(reaction->NumberOfReactants)
	  {
	  fgets(line,LINELENGTH,file);
	  if(strncmp(line,"$MOL",4))
	       {
	       string = AllocateString(LINELENGTH);
	       sprintf(string,"Expected $MOL,\nGot:%s\n",line);
	       Error(IGNORE,string);
	       error = 1;
	       }
	  if(error == 0)
	       ReadMFMol(file,mol,metaset);
	  mol++;
	  }
     mol = reaction->Products;
     LOOPi(reaction->NumberOfProducts)
	  {
	  fgets(line,LINELENGTH,file);
	  if(strncmp(line,"$MOL",4))
	       {
	       string = AllocateString(LINELENGTH);
	       sprintf(string,"Expected $MOL,\nGot:%s\n",line);
	       Error(IGNORE,string);
	       error = 1;
	       }
	  if(error == 0)
	       ReadMFMol(file,mol,metaset);
	  mol++;
	  }

     reaction->Properties = AllocateASCIIProperties;
     ReadInPropertyInfoSDF(file,line,reaction->Properties);
     reaction->Properties->ID = reaction->ID;
     reaction->Properties->Name = CopyString(reaction->Name);
     Free(line);
     Free(name);
     }




