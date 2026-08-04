/*  FILE     linked.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    Basic interface routines for the datum structure used in
**    the gdbm library.  The key element is the DbaseLinkedList
**    which is used to convert the structure to a linear set of
**    bytes to be written to the database.  The base routines
**    WriteBin and ReadBin are fill in the DbaseLinkedList structure.
**
**    A linked list is used as an intermediate structure to datum
**    because the size of the convertedd structures is not known
**    a priori.
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/
 

/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/ 
#include "basic.h"
#include "dbase.h"

#include "dbase/dbasestr.c"

/*S LinkedListDatum
*/
 
/*F ret = InitializeReadLinkedList(link)
**
**  DESCRIPTION
**    link: The linked list
**    ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**    
**    The linked list is initialized for reading.  This is 
**    done by setting the position to zero in each of the 
**    links
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
extern INT InitializeReadLinkedList(DbaseLinkedList *link)
     {
     while(link != 0)
	  {
	  link->Position = 0;
	  link = link->Next;
	  }
     return(SYSTEM_NORMAL_RETURN);
     }
/*F datum = MakeDatumelement(link)
**
**  DESCRIPTION
**    link: The linked list with the element
**    datum: The datum structure for the database
**
**    This transfers the linked list bytes to one continuous
**    byte stream in the structure datum.
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
extern datum *MakeDatumElement(DbaseLinkedList *link)
     {
     datum *element;
     char *data;
     INT totalsize;
     
     totalsize = DbaseLinkedListMemory(link);

     element = AllocateDatum;

     CreateDatum(element,totalsize);
     
     data = element->dptr;
     while(link != 0)
	  {
	  memcpy(data,link->Element,(unsigned int) link->Size);
	  data += link->Size;
	  link = link->Next;
	  }
     return(element);
     }

 
/*F datum = CreateDatum(element,size)
**
**  DESCRIPTION
**    element: The allocated space for the datum structure
**    size: The space needed for the bytes within the structure
**
**    Create the datum structure with 'size' allocated bytes
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
extern datum *CreateDatum(datum *element, INT size)
     {
     element->dsize = size;
     element->dptr = Malloc(size);
     return(element);
     }

 
