#include "basic.h"
#include "comlib.h"

static FILE *MasterOpenFile(CHAR *directory, CHAR *name, CHAR *suffix,
			    CHAR *type,
			    INT flag,
			    CHAR *description,
			    CommandMaster *commandmaster);
static FILE *OpenFileFromCurrent(CHAR *directory, CHAR *name, CHAR *suffix,
				 CHAR *type,
				 INT flag,
				 CHAR *description,
				 CommandMaster *commandmaster);

extern FILE *MasterOpenReadFile(CHAR *directory, CHAR *name, CHAR *suffix,
				INT flag,
				CHAR *description,
				CommandMaster *commandmaster)
     {
     FILE *file;
     file = MasterOpenFile(directory,name,suffix,"r",flag,description,
			   commandmaster);
     return(file);
     }

     
extern FILE *MasterOpenWriteFile(CHAR *directory, CHAR *name, CHAR *suffix,
				 INT flag,
				 CHAR *description,
				 CommandMaster *commandmaster)
     {
     FILE *file;
     file = MasterOpenFile(directory,name,suffix,"w",flag,description,
			   commandmaster);
     return(file);
     }

static FILE *MasterOpenFile(CHAR *directory, CHAR *name, CHAR *suffix,
			    CHAR *type,
			    INT flag,
			    CHAR *description,
			    CommandMaster *commandmaster)
     {
     FILE *file;
     CHAR *filename,*line;
     
     filename = ProduceFileName(directory,name,suffix);

     file = fopen(filename,type);
     if (file == 0)
          {
	  line = AllocateString(LINELENGTH);
          sprintf(line,"Error in opening %s file:%s\n",description,filename);
	  ErrorStatusSet(line,flag,commandmaster);
	  Free(line);
          }
     Free(filename);
     
     return(file);
}
     
extern FILE *OpenReadFileFromCurrent(CHAR *directory, CHAR *name, CHAR *suffix,
				     INT flag,
				     CHAR *description,
				     CommandMaster *commandmaster)
     {
     FILE *file;
     file = OpenFileFromCurrent(directory,name,suffix,
				"r",flag,description,commandmaster); /*  */
     return(file);
     }

extern FILE *OpenWriteFileFromCurrent(CHAR *directory, CHAR *name, CHAR *suffix,
				      INT flag,
				      CHAR *description,
				      CommandMaster *commandmaster)
     {
     FILE *file;
     file = OpenFileFromCurrent(directory,name,suffix,
				"w",flag,description,commandmaster);
     return(file);
     }

static FILE *OpenFileFromCurrent(CHAR *directory, CHAR *name, CHAR *suffix,
				 CHAR *type,
				 INT flag,
				 CHAR *description,
				 CommandMaster *commandmaster)
     {
     CHAR *cdir,*cname;
     FILE *file;
     
     cdir  = GetCurrentStringArgument(directory,commandmaster);
     cname = GetCurrentStringArgument(name,commandmaster);
     
     file = MasterOpenFile(cdir,cname,suffix,type,flag,description,
			   commandmaster);
     
     Free(cdir);
     Free(cname);
     
     return(file);
     }

