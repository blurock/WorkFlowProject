/*  FILE     dbaselink.c
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
 
#include "basic.h"

extern CHAR *GetNameDbaseLinkedList(DbaseLinkedList *str)
     {
     return(str->Name);
     }

extern INT GetIDDbaseLinkedList(DbaseLinkedList *str)
     {
     return(str->ID);
     }

extern DbaseLinkedList *CreateDbaseLinkedList(DbaseLinkedList *newstruct,
					      INT id,
					      CHAR *name,
					      INT  AllocatedSize,
					      INT  Size,
					      INT  Position,
					      CHAR *Element,
					      DbaseLinkedList *Next)
     {
     CHAR *oldElement,*newElement;
     INT i;
     
     newstruct->Name = CopyNAME(name);
     newstruct->ID   = id;
     newstruct->AllocatedSize = AllocatedSize;
     newstruct->Size = Size;
     newstruct->Position = Position;
     if(Next != 0)
          {
          newstruct->Next = AllocateDbaseLinkedList;
          CopyFullDbaseLinkedList(newstruct->Next, Next);
          }
     else
          newstruct->Next = 0;
     
     newstruct->Element = AllocArrayCHAR(newstruct->AllocatedSize);
     if(Element != 0)
          {
          oldElement = Element;
          newElement = newstruct->Element;
          LOOPi(newstruct->AllocatedSize)
               CopyFullCHAR(newElement++, oldElement++);
          }
     
     
     
     return(newstruct);
     }


extern void CopyFullDbaseLinkedList(DbaseLinkedList *newstruct, DbaseLinkedList *oldstruct)
     {
     CHAR *oldElement,*newElement;
     INT i;
     
     newstruct->ID = oldstruct->ID;
     newstruct->Name = CopyNAME(oldstruct->Name);
     newstruct->AllocatedSize = oldstruct->AllocatedSize;
     newstruct->Size = oldstruct->Size;
     newstruct->Position = oldstruct->Position;

     if(oldstruct->Next != 0)
          {
          newstruct->Next = AllocateDbaseLinkedList;
          CopyFullDbaseLinkedList(newstruct->Next, oldstruct->Next);
          }
     else
          newstruct->Next = 0;

     newstruct->Element = AllocArrayCHAR(newstruct->AllocatedSize);
     if(oldstruct->Element != 0)
          {
          oldElement = oldstruct->Element;
          newElement = newstruct->Element;
          LOOPi(newstruct->AllocatedSize)
               CopyFullCHAR(newElement++, oldElement++);
          }


}
extern void PrintDbaseLinkedList(DbaseLinkedList *eleptr)
{
CHAR *ptrElement;
INT i;

     if(eleptr == 0) return;
     printf("ID  :%20d\n",eleptr->ID);
     printf("Name:%20s\n",eleptr->Name);
     printf(" The allocated space:");
     printf("%d\n",eleptr->AllocatedSize);
     printf("The space filled in (used in writing):");
     printf("%d\n",eleptr->Size);
     printf("The postion in the file (used in reading):");
     printf("%d\n",eleptr->Position);

     printf("The next link element:\n");
     PrintDbaseLinkedList(eleptr->Next);

     printf("  The stored element:\n");
     if(eleptr->Element != 0)
          {
          ptrElement = eleptr->Element;
          LOOPi(eleptr->AllocatedSize)
               PrintCHAR(ptrElement++);
          }


}
extern void FreeDbaseLinkedList(DbaseLinkedList *eleptr)
{

     if(eleptr == 0) return;
     Free(eleptr->Name);
     Free(eleptr->Element);

     FreeDbaseLinkedList(eleptr->Next);
     Free(eleptr->Next);

}
extern void WriteBinDbaseLinkedList(DbaseLinkedList *eleptr, DbaseLinkedList *file)
{
CHAR *ptrElement;
INT i;

     if(eleptr == 0)
           {
           WriteBinINT(&(NoStructureCode),file);
           return;
           }
     WriteBinINT(&(eleptr->ID),file);
     WriteBinNAME(&(eleptr->Name),file);
     WriteBinINT(&(eleptr->AllocatedSize),file);
     WriteBinINT(&(eleptr->Size),file);
     WriteBinINT(&(eleptr->Position),file);

     WriteBinDbaseLinkedList(eleptr->Next,file);

     if(eleptr->Element != 0)
          {
          ptrElement = eleptr->Element;
          LOOPi(eleptr->AllocatedSize)
               WriteBinCHAR(ptrElement++,file);
          }

}
extern void ReadBinDbaseLinkedList(DbaseLinkedList *eleptr,DbaseLinkedList *file)
{
CHAR *ptrElement;
INT i;

     ReadBinINT(&(eleptr->ID),file);
     if(eleptr->ID == NO_STRUCTURE_CODE)
            {
             eleptr = 0;
             return;
            }
     ReadBinNAME(&(eleptr->Name),file);
     ReadBinINT(&(eleptr->AllocatedSize),file);
     ReadBinINT(&(eleptr->Size),file);
     ReadBinINT(&(eleptr->Position),file);

     eleptr->Next = AllocateDbaseLinkedList;
     ReadBinDbaseLinkedList(eleptr->Next,file);

          eleptr->Element = AllocArrayCHAR(eleptr->AllocatedSize);
          ptrElement = eleptr->Element;
          LOOPi(eleptr->AllocatedSize)
               ReadBinCHAR(ptrElement++,file);

}
extern void xdr_DbaseLinkedList(XDR *stream, char **eleptrp)
{
     DbaseLinkedList *eleptr;
     eleptr = (DbaseLinkedList *) eleptrp;
     xdr_INT(stream,(char **) &(eleptr->ID));
     if(eleptr->ID == NO_STRUCTURE_CODE)
            {
             eleptr = 0;
             return;
            }
     xdr_NAME(stream,(char **) &(eleptr->Name));
     xdr_INT(stream,(char **) &(eleptr->AllocatedSize));
     xdr_INT(stream,(char **) &(eleptr->Size));
     xdr_INT(stream,(char **) &(eleptr->Position));

     xdr_pointer(stream,
          (char **) &(eleptr->Next),
          DbaseLinkedListSize,
                 (xdrproc_t) xdr_DbaseLinkedList);
     xdr_array(stream,(char **) &(eleptr->Element),
             (unsigned int *) &(eleptr->AllocatedSize),eleptr->AllocatedSize,
               CHARSize,(xdrproc_t) xdr_CHAR);
}

extern void *AllocDbaseLinkedList()
{
     return((void *) AllocateDbaseLinkedList);
}


/*S SpecialWWriteReadBin
**      These are specialized WriteBin and ReadBin functions
**      and helping routines
*/
 
/*F ret = WriteBinSTRING(string,link)
**
**  DESCRIPTION
**    string: The string to write to link
**    link: The linked list
**
**    The string bytes are written into the linked list.  A special
**    routine is needed because the number of bytes must be 
**    determined by strlen.
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
extern void WriteBinSTRING(CHAR *string, DbaseLinkedList *link)
     {
     INT length;
     
     if(string != 0)
	  {
	  length = strlen(string) + 1;
	  WriteBinINT(&length,link);
	  WriteBin(string,length,link);
	  }
     else
           {
           WriteBinINT(&(NoStructureCode),link);
           return;
           }
	  
     }

 
/*F ReadBinSTRING(string,link)
**
**  DESCRIPTION
**    string: The pointer to the string elements
**    link: The linked list
**
**    The string bytes are transfered from the linked list
**    to the memory location pointed to by string.  If the
**    NoStructureCode is read for the size, then a zero is
**    written to the pointed location.    
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
extern INT ReadBinSTRING(CHAR *string, DbaseLinkedList *link)
     {
     INT length;
     
     ReadBinINT(&length,link);
     if(length == NO_STRUCTURE_CODE)
            {
             return(NO_STRUCTURE_CODE);
            }
     else
	  ReadBin(string,length,link);

     return(STRUCTURE_READ);
     }

 
/*F WriteBinNAME(string,link)
**
**  DESCRIPTION
**    string: The pointer to the string
**    link: The linked list
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
extern void WriteBinNAME(CHAR **string, DbaseLinkedList *link)
     {
     INT length;
     
     if(*string != 0)
	  {
	  length = strlen(*string) + 1;
	  WriteBinINT(&length,link);
	  WriteBin(*string,length,link);
	  }
     else
           {
           WriteBinINT(&(NoStructureCode),link);
           return;
           }
     }

 
/*F ReadBinNAME(string,link)
**
**  DESCRIPTION
**    string: The pointer to the string 
**    link: the linked list
**    See ReadBinSTRING
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
extern INT ReadBinNAME(CHAR **string, DbaseLinkedList *link)
     {
     INT length;
     
     ReadBinINT(&length,link);
     if(length == NO_STRUCTURE_CODE)
            {
             *string = 0;
             return(NO_STRUCTURE_CODE);
            }
     else
	  {
	  *string = AllocateString(length);
	  ReadBin(*string,length,link);
	  }
     return(STRUCTURE_READ);     
     }
 
/*F mem = AllocateNAME()
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
extern CHAR **AllocateNAME()
     {
     CHAR **pntr;
     
     pntr = Malloc(sizeof(CHAR *));
     *pntr = Malloc(NAMESIZE);
     return(pntr);
     }

 
/*F ReadBinVOID(obj,link)
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
extern INT ReadBinVOID(VOID *obj,DbaseLinkedList *link)
     {
     return(STRUCTURE_READ);
     }
/*F WriteBinVOID(obj,link)
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
extern void WriteBinVOID(VOID *obj,DbaseLinkedList *link)
     {
     return;
     }


/*S ReadWriteBin
**      The basis routines for reading and writing to the 
**      DbaseLinkedList structure
*/
/*F ret = Writebin(element,size,linkstart)
**
**  DESCRIPTION
**    element: The element to write to the DbaseLinkedList structure
**    size: the number of bytes of the element
**    linkstart: The begining of the DbaseLinkedList structure
**
**    The linked list is search for the next position to write
**    (GetCurrentWriteLink) and if the element fits (a new link
**    is created if not) the element is written.  This is the
**      basis routine for all WriteBinxxxxx routines.
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      GetCurrentWriteLink
**  HEADERFILE
**
*/    
extern INT WriteBin(void *element,
	     INT size,
	     DbaseLinkedList *linkstart)
     {
     DbaseLinkedList *link;
     
     link = GetCurrentWriteLink(linkstart);

     if(link->Size + size > link->AllocatedSize)
	  {
	  link->Next = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link->Next,linkstart->ID, linkstart->Name,
				LINKED_SIZE,
				0,0,0,0);
	  link = link->Next;
	  }

     memcpy(link->Element + link->Size, element,(unsigned int) size);
     
     link->Size += size;
     link->Position = 0;
     
     return(SYSTEM_NORMAL_RETURN);
     }
 
/*F ret = ReadBin(element,size,linkstart)
**
**  DESCRIPTION
**    element: Allocated space for the element
**    size: The number of bytes to read
**    linkstart: The beginning of the linked list
**    ret: SYSTEM_NORMAL_RETURN,SYSTEM_ERROR_RETURN
**
**    The next bytes (determined by GetCurrentReadLink) 
**    are copied into the element.
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
extern INT ReadBin(void *element,
		   INT size,
		   DbaseLinkedList *linkstart)
     { 
     DbaseLinkedList *link;
         
     link = GetCurrentReadLink(linkstart);

     memcpy(element,link->Element + link->Position, (unsigned int) size);
     
     link->Position += size;
     
     return(SYSTEM_NORMAL_RETURN);
     }
 
/*F current = GetCurrentWriteLink(link)
**
**  DESCRIPTION
**    link: The first link
**    current: The last link, i.e. the current link
**
**    The links are followed until the last is found
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
extern DbaseLinkedList *GetCurrentWriteLink(DbaseLinkedList *link)
     {
     while(link->Next != 0)
	  link = link->Next;
     return(link);
     }
 
/*F current = GetCurrentReadLink(link)
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
extern DbaseLinkedList *GetCurrentReadLink(DbaseLinkedList *link)
     {
     while(link != 0 && link->Position == link->Size)
	  link = link->Next;
     return(link);
     }

 
/*F size = DbaseLinkedListMemory(link)
**
**  DESCRIPTION
**    link: The linked list
**    size: The total number  of bytes in the linked list
**
**    This follows the linked list counting the total number
**    of bytes
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
extern INT DbaseLinkedListMemory(DbaseLinkedList *link)
     {
     INT size;
     
     size = 0;
     while(link != 0)
	  {
	  size += link->Size;
	  link = link->Next;
	  }
     return(size);
     }

/*F datum = LinkedListToSingle(link)
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
extern DbaseLinkedList *LinkedListToSingle(DbaseLinkedList *link)
     {
     DbaseLinkedList *element;
     char *data;
     INT totalsize;
     
     totalsize = DbaseLinkedListMemory(link);

     element = AllocateDbaseLinkedList;

     CreateDbaseLinkedList(element,0,0,totalsize,totalsize,0,0,0);
     
     data = element->Element;
     while(link != 0)
	  {
	  memcpy(data,link->Element,(unsigned int) link->Size);
	  data += link->Size;
	  link = link->Next;
	  }
     return(element);
     }

