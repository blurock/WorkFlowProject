/*------------------------------------------*/
/*   Database Structures   */
/* Structure:100:DbaseLinkedList

            AllocatedSize --(INT) The allocated space
                     Size --(INT) The space filled in (used in writing)
                 Position --(INT) The postion in the file (used in reading)
                  Element --(CHAR) The stored element
                     Next --(DbaseLinkedList) The next link element
*/
typedef struct dbaselinkedlist DbaseLinkedList;
struct dbaselinkedlist {
     INT ID;
     CHAR *Name;
     INT  AllocatedSize;
     INT  Size;
     INT  Position;
     CHAR *Element;
     DbaseLinkedList *Next;
     };
#define DbaseLinkedListSize sizeof(DbaseLinkedList)
#define AllocateDbaseLinkedList (DbaseLinkedList *) Malloc(DbaseLinkedListSize)
#define AllocArrayDbaseLinkedList(n) (DbaseLinkedList *) Calloc(n,DbaseLinkedListSize)
#define DbaseLinkedListPntrSize sizeof(DbaseLinkedList **)
#define AllocPntrArrayDbaseLinkedList(n) (DbaseLinkedList **) Calloc(n,DbaseLinkedListPntrSize)
#define SingCopyDbaseLinkedList(out,in) memcpy(out,in,DbaseLinkedListSize)
extern DbaseLinkedList *CreateDbaseLinkedList(DbaseLinkedList *newstruct,
                                       INT id,
                                       CHAR *name,
                                       INT  AllocatedSize,
                                       INT  Size,
                                       INT  Position,
                                       CHAR *Element,
                                       DbaseLinkedList *Next);

extern CHAR *GetNameDbaseLinkedList(DbaseLinkedList *str);
extern INT  GetIDDbaseLinkedList(DbaseLinkedList *str);
extern void PrintDbaseLinkedList(DbaseLinkedList *eleptr);
extern void FreeDbaseLinkedList(DbaseLinkedList *eleptr);
extern void *AllocDbaseLinkedList();
extern void WriteBinDbaseLinkedList(DbaseLinkedList *eleptr, DbaseLinkedList *file);
extern void ReadBinDbaseLinkedList(DbaseLinkedList *eleptr, DbaseLinkedList *file);
extern void xdr_DbaseLinkedList(XDR *stream, char **eleptr);
extern void CopyFullDbaseLinkedList(DbaseLinkedList *newstruct, DbaseLinkedList *oldstruct);
