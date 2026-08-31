#include "basic.h"
#include "dbase.h"

extern DataBaseInformation *GetDataBaseInfoFromID(DbaseMaster *master,
						  INT id)
     {
     DataBaseInformation *done,*dinfo;
     INT cnt;
     
     if (master == NULL) return NULL;
     dinfo = master->Databases;
     cnt = 0;
     done = 0;
     while(done == 0 && cnt < master->NumberOfDatabases)
	  {
	  if(dinfo->ID == id)
	       done = dinfo;
	  cnt++;
	  dinfo++;
	  }
     return(done);
     }


	  
     
     
