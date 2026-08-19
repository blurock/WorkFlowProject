#include "basic.h"
#include "comlib.h"
#include <unistd.h>

#define MAX_OPEN_WRITE_FILES 64

typedef struct {
    FILE *fp;
    char local_path[1024];
    char gcs_rel_path[1024];
    int is_write;
} OpenWriteFileEntry;

static OpenWriteFileEntry g_write_file_table[MAX_OPEN_WRITE_FILES];
static int g_write_file_count = 0;
static OpenWriteFileEntry *g_active_write_flag = NULL;

static void RegisterWriteFile(FILE *fp, const char *local_path, const char *gcs_rel_path)
{
    int i;
    for (i = 0; i < MAX_OPEN_WRITE_FILES; i++) {
        if (!g_write_file_table[i].fp) {
            g_write_file_table[i].fp = fp;
            strncpy(g_write_file_table[i].local_path, local_path, sizeof(g_write_file_table[i].local_path) - 1);
            strncpy(g_write_file_table[i].gcs_rel_path, gcs_rel_path, sizeof(g_write_file_table[i].gcs_rel_path) - 1);
            g_write_file_table[i].is_write = 1;
            g_active_write_flag = &g_write_file_table[i];
            g_write_file_count++;
            return;
        }
    }
}

static OpenWriteFileEntry *FindWriteFileEntry(FILE *fp)
{
    int i;
    if (!fp) return NULL;
    for (i = 0; i < MAX_OPEN_WRITE_FILES; i++) {
        if (g_write_file_table[i].fp == fp && g_write_file_table[i].is_write) {
            return &g_write_file_table[i];
        }
    }
    return NULL;
}

static void UnregisterWriteFileEntry(OpenWriteFileEntry *entry)
{
    if (entry) {
        entry->fp = NULL;
        entry->local_path[0] = '\0';
        entry->gcs_rel_path[0] = '\0';
        entry->is_write = 0;
        if (g_active_write_flag == entry) {
            g_active_write_flag = NULL;
        }
        if (g_write_file_count > 0) g_write_file_count--;
    }
}

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
     char gcs_path[1024];
     const char *user_id;
     const char *react_root;

     filename = ProduceFileName(directory,name,suffix);

     user_id = getenv("REACT_USER_ID");
     if (!user_id || user_id[0] == '\0') {
         user_id = "user_default_local";
     }
     react_root = getenv("REACTROOT");
     if (!react_root || react_root[0] == '\0') {
         react_root = "/opt/react";
     }

     snprintf(gcs_path, sizeof(gcs_path), "users/%s/data/%s", user_id, filename);

     /* For read files: check local directory first, if missing fetch from Cloud Storage */
     if (type && (type[0] == 'r' || type[0] == 'R')) {
         if (access(filename, F_OK) != 0) {
             char sync_cmd[2048];
             snprintf(sync_cmd, sizeof(sync_cmd), "%s/bin/gcs-sync-user-data.sh download \"%s\" \"%s\"",
                      react_root, filename, gcs_path);
             system(sync_cmd);
         }
     }

     file = fopen(filename, type);

     if (file == 0) {
         line = AllocateString(LINELENGTH);
         sprintf(line, "Error in opening %s file:%s\n", description, filename);
         ErrorStatusSet(line, flag, commandmaster);
         Free(line);
     } else {
         /* For write files: register in global write tracking table and set write flag */
         if (type && (type[0] == 'w' || type[0] == 'W' || type[0] == 'a' || type[0] == 'A')) {
             RegisterWriteFile(file, filename, gcs_path);
         }
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
				"r",flag,description,commandmaster);
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

#ifdef fclose
#undef fclose
#endif

extern int FClose(FILE *file)
     {
     int status;
     OpenWriteFileEntry *entry;

     if (!file) return 0;

     entry = FindWriteFileEntry(file);

     /* Standard fclose */
     status = fclose(file);

     /* If file was opened for write (write flag set/entry non-null) */
     if (entry != NULL && entry->is_write) {
         char sync_cmd[2048];
         const char *react_root = getenv("REACTROOT");
         if (!react_root || react_root[0] == '\0') {
             react_root = "/opt/react";
         }

         snprintf(sync_cmd, sizeof(sync_cmd), "%s/bin/gcs-sync-user-data.sh upload \"%s\" \"%s\"",
                  react_root, entry->local_path, entry->gcs_rel_path);

         system(sync_cmd);

         /* Reset global write flag to NULL and unregister entry */
         UnregisterWriteFileEntry(entry);
     }

     return status;
     }
