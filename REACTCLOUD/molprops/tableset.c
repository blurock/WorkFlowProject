/*  FILE     tableset.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
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

#include "molprops/tables.c"
 
/*F tables = InitializeSetOfTables()
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
extern SetOfTables *InitializeSetOfTables(INT id, CHAR *name)
     {
     SetOfTables *tables;
     
     tables = AllocateSetOfTables;
     CreateSetOfTables(tables,id,name,
		       0,0,0,0);
     return(tables);
     }
