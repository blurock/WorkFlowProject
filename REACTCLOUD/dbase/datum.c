/*  FILE     datum.c
**  PACKAGE     REACTION    
**  AUTHOR   Edward S. Blurock
**
**  CONTENT
**    
**  The interface to the gdbm (Gnu Database management library).
**  For each of the routines in gdbm, there is a corresponding one
**  in this file.  The main differences are the use of this library's
**  keyword DbaseKeyword and the database information, DataBaseInformation 
**  andd the element being of type VOID.
**
**  REFERENCES
**
**  COPYRIGHT (C) 1995  REACTION Project / Edward S. Blurock 
*/ 
/*I  . . . INCLUDES  . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
#include "basic.h"
#include "dbase.h"
#include "cJSON.h"
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

static int PostJSONToOrchestrator(const char *path, const char *json_body, char *response_buf, size_t response_buf_size)
{
    int sockfd;
    struct sockaddr_in servaddr;
    const char *port_env;
    int port = 8085;
    char header[512];
    size_t body_len;

    port_env = getenv("REACT_ORCHESTRATOR_PORT");
    if (port_env && *port_env) {
        port = atoi(port_env);
    }

    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0) {
        printf("[Firestore IPC Error] socket() failed\n");
        return -1;
    }

    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_port = htons(port);
    servaddr.sin_addr.s_addr = inet_addr("127.0.0.1");

    if (connect(sockfd, (struct sockaddr *)&servaddr, sizeof(servaddr)) < 0) {
        printf("[Firestore IPC Error] Could not connect to Orchestrator at 127.0.0.1:%d (Is server.js running?)\n", port);
        close(sockfd);
        return -1;
    }

    body_len = strlen(json_body);
    snprintf(header, sizeof(header),
             "POST %s HTTP/1.1\r\n"
             "Host: 127.0.0.1:%d\r\n"
             "Content-Type: application/json\r\n"
             "Content-Length: %zu\r\n"
             "Connection: close\r\n\r\n",
             path, port, body_len);

    if (write(sockfd, header, strlen(header)) < 0 || write(sockfd, json_body, body_len) < 0) {
        printf("[Firestore IPC Error] Failed writing request body\n");
        close(sockfd);
        return -1;
    }

    if (response_buf && response_buf_size > 0) {
        ssize_t nread;
        size_t total = 0;
        memset(response_buf, 0, response_buf_size);
        while (total < response_buf_size - 1 && (nread = read(sockfd, response_buf + total, response_buf_size - 1 - total)) > 0) {
            total += nread;
        }
        response_buf[total] = '\0';
    }

    close(sockfd);
    return 0;
}

extern INT StoreElementToFirestore(DbaseKeyword *keyword, CHAR *json_str, DataBaseInformation *info)
{
    CHAR *body;
    size_t len;
    const char *uid;
    char key_name[256];
    
    if (info == NULL || keyword == NULL || json_str == NULL) {
        printf("[Firestore Debug] StoreElementToFirestore skipped: info=%p, keyword=%p, json_str=%p\n",
               info, keyword, json_str);
        return SYSTEM_ERROR_RETURN;
    }

    if (keyword->Name != NULL && strlen(keyword->Name) > 0) {
        snprintf(key_name, sizeof(key_name), "%s", keyword->Name);
    } else {
        snprintf(key_name, sizeof(key_name), "%d", keyword->ID);
    }

    uid = getenv("REACT_USER_UID");
    if (uid == NULL || *uid == '\0') {
        uid = "user_default_local";
    }

    printf("[Firestore Store] dbName='%s', key='%s', keyId=%d, uid='%s'\n",
           info->Name ? info->Name : "NULL", key_name, keyword->ID, uid);
    fflush(stdout);

    len = strlen(uid) + (info->Name ? strlen(info->Name) : 4) + strlen(key_name) + strlen(json_str) + 512;
    body = (CHAR *) Malloc(len);
    if (body == NULL) return SYSTEM_ERROR_RETURN;

    sprintf(body, "{\"uid\":\"%s\",\"dbName\":\"%s\",\"key\":\"%s\",\"keyId\":%d,\"jsonStr\":%s}",
            uid, info->Name ? info->Name : "UNKNOWN", key_name, keyword->ID, json_str);

    int res = PostJSONToOrchestrator("/api/db/store", body, NULL, 0);
    printf("[Firestore Store Result] PostJSONToOrchestrator returned: %d\n", res);
    fflush(stdout);

    Free(body);
    return SYSTEM_NORMAL_RETURN;
}

extern INT FetchElementFromFirestore(VOID element, DbaseKeyword *keyword, DataBaseInformation *dinfo)
{
    CHAR body[1024];
    CHAR *resp;
    size_t resp_size = 65536;
    int status = SYSTEM_ERROR_RETURN;
    const char *uid;
    int is_processed = 0;
    
    if (dinfo == NULL || keyword == NULL || element == NULL)
        return SYSTEM_ERROR_RETURN;

    uid = getenv("REACT_USER_UID");
    if (uid == NULL || *uid == '\0') {
        uid = "user_default_local";
    }

    if (keyword->KeyWord != NULL && keyword->Size > 0) {
        if (keyword->Size == sizeof(int) && !cJSON_IsASCIIBuffer(keyword->KeyWord, (size_t)keyword->Size)) {
            int key_val;
            memcpy(&key_val, keyword->KeyWord, sizeof(int));
            snprintf(body, sizeof(body), "{\"uid\":\"%s\",\"dbName\":\"%s\",\"type\":\"int\",\"key\":%d}",
                     uid, dinfo->Name ? dinfo->Name : "UNKNOWN", key_val);
            is_processed = 1;
        } else {
            snprintf(body, sizeof(body), "{\"uid\":\"%s\",\"dbName\":\"%s\",\"type\":\"string\",\"key\":\"%s\"}",
                     uid, dinfo->Name ? dinfo->Name : "UNKNOWN", (char *)keyword->KeyWord);
            is_processed = 1;
        }
    }





    if (!is_processed) {
        if (keyword->Name != NULL && strlen(keyword->Name) > 0) {
            snprintf(body, sizeof(body), "{\"uid\":\"%s\",\"dbName\":\"%s\",\"type\":\"string\",\"key\":\"%s\"}",
                     uid, dinfo->Name ? dinfo->Name : "UNKNOWN", keyword->Name);
        } else {
            snprintf(body, sizeof(body), "{\"uid\":\"%s\",\"dbName\":\"%s\",\"type\":\"int\",\"key\":%d}",
                     uid, dinfo->Name ? dinfo->Name : "UNKNOWN", keyword->ID);
        }
    }

    resp = (CHAR *) Malloc(resp_size);
    if (resp == NULL) return SYSTEM_ERROR_RETURN;

    if (PostJSONToOrchestrator("/api/db/fetch", body, resp, resp_size) == 0) {
        char *json_body = strstr(resp, "\r\n\r\n");
        if (json_body != NULL) {
            json_body += 4;
            cJSON *parsed = cJSON_Parse(json_body);
            if (parsed != NULL) {
                cJSON *found = cJSON_GetObjectItemCaseSensitive(parsed, "found");
                cJSON *data = cJSON_GetObjectItemCaseSensitive(parsed, "data");
                if (found != NULL && !cJSON_IsNull(found) && (found->type == cJSON_True || found->valueint != 0) && data != NULL) {
                    char *data_str = cJSON_PrintUnformatted(data);
                    if (data_str != NULL && dinfo->JSONStringToElement != NULL) {
                        (*dinfo->JSONStringToElement)(element, data_str);
                        cJSON_free(data_str);
                        status = SYSTEM_NORMAL_RETURN;
                    }
                }
                cJSON_Delete(parsed);
            }
        }
    }
    
    Free(resp);
    return status;
}

extern INT FetchDatabaseRecordSummaries(DataBaseInformation *dinfo, cJSON **out_records)
{
    CHAR body[512];
    CHAR *resp;
    size_t resp_size = 524288;
    int status = SYSTEM_ERROR_RETURN;
    const char *uid;

    if (dinfo == NULL || out_records == NULL)
        return SYSTEM_ERROR_RETURN;

    *out_records = NULL;

    uid = getenv("REACT_USER_UID");
    if (uid == NULL || *uid == '\0') {
        uid = "user_default_local";
    }

    snprintf(body, sizeof(body), "{\"uid\":\"%s\",\"dbName\":\"%s\",\"fields\":[\"ID\",\"Name\"]}",
             uid, dinfo->Name ? dinfo->Name : "UNKNOWN");

    resp = (CHAR *) Malloc(resp_size);
    if (resp == NULL) return SYSTEM_ERROR_RETURN;

    if (PostJSONToOrchestrator("/api/db/listSummary", body, resp, resp_size) == 0) {
        char *json_body = strstr(resp, "\r\n\r\n");
        if (json_body != NULL) {
            json_body += 4;
            cJSON *parsed = cJSON_Parse(json_body);
            if (parsed != NULL) {
                cJSON *found = cJSON_GetObjectItemCaseSensitive(parsed, "found");
                cJSON *records = cJSON_GetObjectItemCaseSensitive(parsed, "records");
                if (found != NULL && !cJSON_IsNull(found) && (found->type == cJSON_True || found->valueint != 0) && records != NULL && cJSON_IsArray(records)) {
                    *out_records = parsed;
                    status = SYSTEM_NORMAL_RETURN;
                } else {
                    cJSON_Delete(parsed);
                }
            }
        }
    }

    Free(resp);
    return status;
}

extern INT PrintDatabaseRecordSummaries(DataBaseInformation *dinfo, const char *fmt_str)
{
    cJSON *parsedObj = NULL;
    int ret;

    if (fmt_str == NULL) {
        fmt_str = "%10d: -->%s<--\n";
    }

    ret = FetchDatabaseRecordSummaries(dinfo, &parsedObj);
    if (ret == SYSTEM_NORMAL_RETURN && parsedObj != NULL) {
        cJSON *records = cJSON_GetObjectItemCaseSensitive(parsedObj, "records");
        if (records != NULL && cJSON_IsArray(records)) {
            cJSON *item = NULL;
            cJSON_ArrayForEach(item, records) {
                cJSON *idObj = cJSON_GetObjectItemCaseSensitive(item, "ID");
                cJSON *nameObj = cJSON_GetObjectItemCaseSensitive(item, "Name");
                int idVal = idObj ? idObj->valueint : 0;
                const char *nameVal = (nameObj && nameObj->valuestring) ? nameObj->valuestring : "";
                printf(fmt_str, idVal, nameVal);
            }
        }
        cJSON_Delete(parsedObj);
    }

    return ret;
}




extern INT StoreSearchKeysToFirestore(INT id, SetOfSearchKeys *keys, CHAR *json_str, DataBaseInformation *info)

{
    CHAR *body;
    size_t len;
    const char *uid;
    
    if (info == NULL || keys == NULL || json_str == NULL) {
        printf("[Firestore Debug] StoreSearchKeysToFirestore skipped: info=%p, keys=%p, json_str=%p\n",
               info, keys, json_str);
        return SYSTEM_ERROR_RETURN;
    }

    uid = getenv("REACT_USER_UID");
    if (uid == NULL || *uid == '\0') {
        uid = "user_default_local";
    }

    printf("[Firestore SearchKeys Store] dbName='%s', id=%d, uid='%s'\n",
           info->Name ? info->Name : "NULL", id, uid);
    fflush(stdout);

    len = strlen(uid) + (info->Name ? strlen(info->Name) : 4) + strlen(json_str) + 512;
    body = (CHAR *) Malloc(len);
    if (body == NULL) return SYSTEM_ERROR_RETURN;

    sprintf(body, "{\"uid\":\"%s\",\"dbName\":\"%s\",\"keyId\":%d,\"jsonStr\":%s}",
            uid, info->Name ? info->Name : "UNKNOWN", id, json_str);

    int res = PostJSONToOrchestrator("/api/db/storeSearchKeys", body, NULL, 0);
    printf("[Firestore SearchKeys Store Result] PostJSONToOrchestrator returned: %d\n", res);
    fflush(stdout);

    Free(body);
    return SYSTEM_NORMAL_RETURN;
}

extern INT FetchSearchKeysFromFirestore(INT id, SetOfSearchKeys *keys, DataBaseInformation *dinfo)
{
    CHAR body[512];
    CHAR *resp;
    size_t resp_size = 65536;
    int status = SYSTEM_ERROR_RETURN;
    const char *uid;
    
    if (dinfo == NULL || keys == NULL)
        return SYSTEM_ERROR_RETURN;

    uid = getenv("REACT_USER_UID");
    if (uid == NULL || *uid == '\0') {
        uid = "user_default_local";
    }

    snprintf(body, sizeof(body), "{\"uid\":\"%s\",\"dbName\":\"%s\",\"keyId\":%d}",
             uid, dinfo->Name ? dinfo->Name : "UNKNOWN", id);

    resp = (CHAR *) Malloc(resp_size);
    if (resp == NULL) return SYSTEM_ERROR_RETURN;

    if (PostJSONToOrchestrator("/api/db/fetchSearchKeys", body, resp, resp_size) == 0) {
        char *json_body = strstr(resp, "\r\n\r\n");
        if (json_body != NULL) {
            json_body += 4;
            cJSON *parsed = cJSON_Parse(json_body);
            if (parsed != NULL) {
                cJSON *found = cJSON_GetObjectItemCaseSensitive(parsed, "found");
                cJSON *data = cJSON_GetObjectItemCaseSensitive(parsed, "data");
                if (found != NULL && !cJSON_IsNull(found) && (found->type == cJSON_True || found->valueint != 0) && data != NULL) {
                    char key_field[64];
                    snprintf(key_field, sizeof(key_field), "searchKeys_%d", id);
                    cJSON *searchKeysData = cJSON_GetObjectItemCaseSensitive(data, key_field);
                    if (searchKeysData == NULL) searchKeysData = cJSON_GetObjectItemCaseSensitive(data, "data");
                    if (searchKeysData == NULL) searchKeysData = data;
                    char *data_str = cJSON_PrintUnformatted(searchKeysData);
                    if (data_str != NULL) {
                        ReadJSONSetOfSearchKeysFromString(keys, data_str);
                        cJSON_free(data_str);
                        status = SYSTEM_NORMAL_RETURN;
                    }
                }
                cJSON_Delete(parsed);
            }
        }
    }
    
    Free(resp);
    return status;
}

/*P  . . . PROTOTYPES  . . . . . . . . . . . . . . . . . . . . . . . . . . . 
*/
static DbaseKeyword *ProduceIndexKeyword(INT id);


/*S CreateOpenClose
*/
/*F ret = CreateDataBase(info)
**
**  DESCRIPTION   
**   info: DataBaseInformation
**   ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   This creates the database on disc with the name:
**     - directory: info->Directory
**     - rootname:  info->RootName
**     - suffix:    ".dbf"
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      gdbm_create
**
**  HEADERFILE
**
*/
extern INT CreateDataBase(DataBaseInformation *info)
     {
     GDBM_FILE dbf;
     CHAR *filename;
     
     filename = ProduceFileName(info->Directory, info->FilenameRoot,"dbf");
     
     dbf = gdbm_open(filename,0,GDBM_NEWDB,0666,0);
     
     info->File = (VOID) dbf;
     
     Free(filename);
     
     if(dbf == 0)
	  return(SYSTEM_ERROR_RETURN);
     else
	  return(SYSTEM_NORMAL_RETURN);
     }
/*F ret = OpenDataBase(info)
**
**  DESCRIPTION
**   info: DataBaseInformation
**   ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   This opens the database on disc with the name:
**     - directory: info->Directory
**     - rootname:  info->RootName
**     - suffix:    ".dbf"
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      gdbm_open
**
**  HEADERFILE
**
*/
extern INT OpenDataBase(DataBaseInformation *info)
     {
     GDBM_FILE dbf;
     CHAR *filename;
     
     filename = ProduceFileName(info->Directory, info->FilenameRoot, "dbf");
     
     dbf = gdbm_open(filename,0,GDBM_WRCREAT,0666,0);
     
     info->File = (VOID) dbf;
     
     Free(filename);

     if(dbf == 0)
	  return(SYSTEM_ERROR_RETURN);
     else
	  return(SYSTEM_NORMAL_RETURN);
     }
/*F ret = CloseDataBase(info)
**
**  DESCRIPTION
**   info: DataBaseInformation
**   ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**   This closes the database file: info->Info
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      gdbm_close
**
**  HEADERFILE
**
*/
extern INT CloseDataBase(DataBaseInformation *info)
     {
     if (info != NULL && info->File != NULL)
	  {
	  gdbm_close((GDBM_FILE) info->File);
	  info->File = NULL;
	  }

     return(SYSTEM_NORMAL_RETURN);
     }

/*S StoreFetch
*/
/*F ret = StoreElement(element,keyword,flag,info)
**
**  DESCRIPTION
**    element: The element to be stored
**    keyword: It's corresponding keyword
**    flag:    GDBM_INSERT, GDBM_REPLACE
**    info: The DataBaseInformation
**
**  The element is stored in the database using the keyword.
**  The flag determines whether the element in to be replaced or
**  not.
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
extern INT StoreElement(VOID element,
			DbaseKeyword *keyword,
			INT flag,
			DataBaseInformation *info)
     {
     DbaseLinkedList *firstlink;
     INT ret;
     
     firstlink = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(firstlink,keyword->ID,keyword->Name,
			   LINKED_SIZE,
			   0,0,0,0);
     
     (*info->WriteConversion)(element,firstlink);

     ret = WriteGenericElement(firstlink,keyword,flag,info);
     
     FreeDbaseLinkedList(firstlink);
     Free(firstlink);

     if(info != NULL && info->ElementToJSONString != NULL)
          {
          CHAR *json_str = (*info->ElementToJSONString)(element);
          if(json_str != NULL)
               {
               StoreElementToFirestore(keyword, json_str, info);
               cJSON_free(json_str);
               }
          else
               {
               printf("[Firestore Debug] ElementToJSONString returned NULL for dbName=%s\n", info->Name ? info->Name : "NULL");
               fflush(stdout);
               }
          }
     else
          {
          printf("[Firestore Debug] info->ElementToJSONString is NULL for dbName=%s\n", info ? (info->Name ? info->Name : "NULL") : "NULL");
          fflush(stdout);
          }

     return(ret);
     }

 
/*F ret = WriteDBSearchType(id,keywords,dinfo)
**
**  DESCRIPTION
**  id:  the index id (to identify the search keys)
**  keys: The search keys to be written to the database
**  info: The DataBaseInformation
**  ret: SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**  This routine write out the SetOfSearchKeys, identified by
**  id, to the database.  The keyword is produced by ProduceIndexKeyword.
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
extern INT WriteDBSearchType(INT id,
			     SetOfSearchKeys *keys,
			     DataBaseInformation *dinfo)
     {
     DbaseKeyword *indexkey;
     DbaseLinkedList *firstlink;
     datum *key, *datset;
     INT ret;
     
     indexkey = ProduceIndexKeyword(id);
     
     firstlink = AllocateDbaseLinkedList;
     CreateDbaseLinkedList(firstlink,indexkey->ID,indexkey->Name,
			   LINKED_SIZE,
			   0,0,0,0);
     
     WriteBinSetOfSearchKeys(keys, firstlink);
     
     
     key = AllocateDatum;
     key->dsize = indexkey->Size;
     key->dptr  = indexkey->KeyWord;
     
     datset = MakeDatumElement(firstlink);
     
     if (dinfo != NULL && dinfo->File != NULL)
          {
          ret = gdbm_store((GDBM_FILE) dinfo->File,
		      *key,
		      *datset,
		      (int) GDBM_REPLACE);
          }
     else
          {
          ret = SYSTEM_NORMAL_RETURN;
          }
     
     Free(datset->dptr);
     Free(datset);
     Free(indexkey);
     FreeDbaseLinkedList(firstlink);
     Free(firstlink);

     if (keys != NULL && dinfo != NULL)
          {
          CHAR *json_str = WriteJSONSetOfSearchKeysToString(keys);
          if (json_str != NULL)
               {
               StoreSearchKeysToFirestore(id, keys, json_str, dinfo);
               cJSON_free(json_str);
               }
          else
               {
               printf("[Firestore Debug] WriteJSONSetOfSearchKeysToString returned NULL for dbName=%s\n", dinfo->Name ? dinfo->Name : "NULL");
               fflush(stdout);
               }
          }

     return(ret);
     }
 
/*F ret = FetchElement(element,keyword,dinfo)
**
**  DESCRIPTION
**    element: Allocated space for the element to be fetched
**    keyword: The database keyword for the element
**    dinfo: The DataBaseInformation
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**      gdbm_fetch
**  HEADERFILE
**
*/
extern INT FetchElement(VOID element,
			DbaseKeyword *keyword,
			DataBaseInformation *dinfo)
     {
     INT ret;
     
     /* GDBM reference implementation
     datum key, datset;
     DbaseLinkedList *link;
     
     ret = SYSTEM_NORMAL_RETURN;
     key.dsize = keyword->Size;
     key.dptr  = keyword->KeyWord;
     
     if (dinfo != NULL && dinfo->File != NULL)
	  {
	  datset = gdbm_fetch((GDBM_FILE) dinfo->File,
			key);
	  }
     else
	  {
	  datset.dsize = 0;
	  datset.dptr = NULL;
	  }
     
     if(datset.dsize != 0)
	  {
	  link = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link,keyword->ID,keyword->Name,
				datset.dsize,
				datset.dsize,
				0,0,0);
	  memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	  (*(dinfo->ReadConversion))(element,link);
	  
	  FreeDbaseLinkedList(link);
	  Free(link);
	  }
     else
	  {
	  ret = FetchElementFromFirestore(element, keyword, dinfo);
	  if (ret != SYSTEM_NORMAL_RETURN)
	       {
	       Error(0,"Element Not Found");
	       ret = SYSTEM_ERROR_RETURN;
	       }
	  }
     */

     ret = FetchElementFromFirestore(element, keyword, dinfo);
     if (ret != SYSTEM_NORMAL_RETURN)
	  {
	  Error(0,"Element Not Found");
	  ret = SYSTEM_ERROR_RETURN;
	  }
     
     return(ret);
     }



 
/*F ret = ReadDBSearchType(id,keys,dinfo)
**
**  DESCRIPTION
**    id: The id of the SetOfSearchKeys
**    keys: The SetOfSearchKeys 
**    dinfo: The DataBaseInformation
**
**    This routine reads  in the set of search keywords for
**    this database.  The particular keywords are identified 
**    by the id.
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
extern INT ReadDBSearchType(INT id,
			    SetOfSearchKeys *keys,
			    DataBaseInformation *dinfo)
     {
     DbaseKeyword *indexkey;
     datum key, datset;
     DbaseLinkedList *link;
     CHAR *string;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;
     indexkey = ProduceIndexKeyword(id);

     key.dsize = indexkey->Size;
     key.dptr  = indexkey->KeyWord;
     
     if (dinfo != NULL && dinfo->File != NULL)
	  {
	  datset = gdbm_fetch((GDBM_FILE) dinfo->File,
			key);
	  }
     else
	  {
	  datset.dsize = 0;
	  datset.dptr = NULL;
	  }
     
     if(datset.dsize != 0)
	  {
	  link = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link,indexkey->ID,indexkey->Name,
				datset.dsize,
				datset.dsize,
				0,0,0);
	  
	  memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	  ReadBinSetOfSearchKeys(keys,link);
	  
	  printf("[GDBM SearchKeys Read] dbName='%s', id=%d: ReadBinSetOfSearchKeys loaded %d keys from GDBM (datset.dsize=%d)\n",
		 dinfo && dinfo->Name ? dinfo->Name : "NULL", id, keys ? keys->NumberOfKeys : -1, datset.dsize);
	  fflush(stdout);

	  FreeDbaseLinkedList(link);
	  Free(link);
	  }
     else
	  {
	  printf("[GDBM SearchKeys Read] dbName='%s', id=%d: GDBM key not found or empty (datset.dsize=0). Querying Firestore...\n",
		 dinfo && dinfo->Name ? dinfo->Name : "NULL", id);
	  fflush(stdout);

	  ret = FetchSearchKeysFromFirestore(id, keys, dinfo);
	  if (ret != SYSTEM_NORMAL_RETURN)
	       {
	       string = AllocateString(LINELENGTH);
	       sprintf(string,"No Keys for %s\n",dinfo->Name);
	       Error(0,string);
	       Free(string);
	       ret = SYSTEM_ERROR_RETURN;
	       }
	  else
	       {
	       printf("[Firestore SearchKeys Read] dbName='%s', id=%d: FetchSearchKeysFromFirestore loaded %d keys from Firestore\n",
		      dinfo && dinfo->Name ? dinfo->Name : "NULL", id, keys ? keys->NumberOfKeys : -1);
	       fflush(stdout);
	       }
	  }
     
     return(ret);
     }

 
/*f key = ProduceIndexKeyword(id)
**
**  DESCRIPTION
**    id:  The id of the SetOfKeywords
**    key: The key to be used in reading or writing to the database
**
**    Given the id of the SetOfKeywords, the DbaseKeyword is 
**    produced.
**    
**  REMARKS
**
*/
static DbaseKeyword *ProduceIndexKeyword(INT id)
     {
     CHAR *string;
     DbaseKeyword *keyword;
     INT size;
     
     string = AllocateString(LINELENGTH);
     sprintf(string,"%s%d",DBINDEXROOTNAME,id);
     size = strlen(string) + 1;
     
     keyword = AllocateDbaseKeyword;
     CreateDbaseKeyword(keyword,id,string,
			size,string);
     Free(string);
     return(keyword);
     }
/*S SequentialAccess
*/
/*F FetchFirstElement(element,keyword,info)
**
**  DESCRIPTION
**    element: Allocated space in which to put the element
**    keyword: Allocated space in which to put the keyword
**    info:    The database information
**    ret:     SYSTEM_NORMAL_RETURN, SYSTEM_ERROR_RETURN
**
**    This puts the first element (determined by the hash codes
**    of the database routines) into element and its key into
**    keyword.  This is the initialization of going through
**    all the  database (using FetchNextElement).
**
**  REMARKS
**    It is assumed that an index is not the first element
**
**  REFERENCES
**
**  SEE ALSO
**    gdbm_fetch
**  HEADERFILE
**
*/
static SetOfSearchKeys *GetFallbackSearchKeys(DataBaseInformation *info) {
    SearchKeyInfo *keytype;
    INT i;
    if (info == NULL || info->Keys == NULL) return NULL;
    keytype = info->Keys->KeyTypes;
    LOOPi(info->Keys->NumberOfKeyTypes) {
        if (keytype != NULL && keytype->Keys != NULL && keytype->Keys->NumberOfKeys > 0) {
            return keytype->Keys;
        }
        keytype++;
    }
    return NULL;
}

extern INT FetchFirstElement(VOID element,
			     DbaseKeyword *keyword,
			     DataBaseInformation *info)
     {
     datum key, datset;
     DbaseLinkedList *link;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;
     if (info != NULL && info->File != NULL)
	  {
	  key = gdbm_firstkey((GDBM_FILE) info->File);
	  }
     else
	  {
	  key.dptr = 0;
	  key.dsize = 0;
	  }

     if(key.dptr != 0)
	  {
	    if(strncmp(key.dptr,"DB-Index",8) == 0)
	      {
		CreateDbaseKeyword(keyword,0,0,
				   key.dsize,
				   key.dptr);
		return FetchNextElement(element,keyword,info);
	      }
	    
	  datset = gdbm_fetch((GDBM_FILE) info->File,
			      key);
	  link = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link,0,0,
				datset.dsize,
				datset.dsize,
				0,0,0);
	  memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	  (*(info->ReadConversion))(element,link);
	  
	  FreeDbaseLinkedList(link);
	  Free(link);
	  CreateDbaseKeyword(keyword,0,0,
			key.dsize,
			key.dptr);
	  }
     else
	  {
	  SetOfSearchKeys *keyset = GetFallbackSearchKeys(info);
	  if (keyset != NULL && keyset->NumberOfKeys > 0) {
	      SingleSearchKey *skey = keyset->Keys;
	      DbaseKeyword *target_key = skey->DBKey ? skey->DBKey : skey->Search;
	      if (target_key != NULL) {
	          CreateDbaseKeyword(keyword, target_key->ID, target_key->Name, target_key->Size, target_key->KeyWord);
	          ret = FetchElement(element, keyword, info);
	      } else {
	          ret = SYSTEM_ERROR_RETURN;
	      }
	  } else {
	      ret = SYSTEM_ERROR_RETURN;
	  }
	  }
     
     return(ret);
     }
 
/*F ret = FetchNextElement(element,keyword,info)
**
**  DESCRIPTION
**    element: Allocated space for the next element
**    keyword: The last keyword fetched 
**    info:     DataBaseInformation
**
**    The keyword of the last fetch (either by FetchFirstElement
**    or FetchNextElement) the next element is found (and 
**    its corresponding keyword
**
**  REMARKS
**
**  REFERENCES
**
**  SEE ALSO
**     gdbm_next
**  HEADERFILE
**
*/
extern INT FetchNextElement(VOID element,
			    DbaseKeyword *keyword,
			    DataBaseInformation *info)
     {
     datum key, newkey,datset;
     DbaseLinkedList *link;
     INT ret;
     
     ret = SYSTEM_NORMAL_RETURN;

     key.dsize = keyword->Size;
     key.dptr  = keyword->KeyWord;
     
     if (info != NULL && info->File != NULL)
	  {
	  newkey = gdbm_nextkey((GDBM_FILE) info->File,
			   key);
	  }
     else
	  {
	  newkey.dptr = 0;
	  newkey.dsize = 0;
	  }
     
     if(newkey.dptr != 0)
	  {
	  if(newkey.dsize <= strlen(DBINDEXROOTNAME) ||
	     strncmp(DBINDEXROOTNAME,newkey.dptr,strlen(DBINDEXROOTNAME)))
	       {
	       datset = gdbm_fetch((GDBM_FILE) info->File,
				   newkey);
	       
	       link = AllocateDbaseLinkedList;
	       CreateDbaseLinkedList(link,keyword->ID,keyword->Name,
				     datset.dsize,
				     datset.dsize,
				     0,0,0);
	       memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	       (*(info->ReadConversion))(element,link);
	       
	       FreeDbaseLinkedList(link);
	       Free(link);
	       FreeDbaseKeyword(keyword);
	       
	       CreateDbaseKeyword(keyword,0,0,
				  newkey.dsize,
				  newkey.dptr);
	       }
	  else
	       {
	       CreateDbaseKeyword(keyword,0,0,
				  newkey.dsize,
				  newkey.dptr);
	       ret = FetchNextElement(element,keyword,info);
	       }
	  }
     else
	  {
	  SetOfSearchKeys *keyset = GetFallbackSearchKeys(info);
	  if (keyset != NULL && keyset->NumberOfKeys > 0) {
	      INT idx = -1, i;
	      SingleSearchKey *skey = keyset->Keys;
	      LOOPi(keyset->NumberOfKeys) {
	          DbaseKeyword *tk = skey->DBKey ? skey->DBKey : skey->Search;
	          if (tk != NULL) {
	              if (keyword->ID != 0 && tk->ID == keyword->ID) {
	                  idx = i;
	                  break;
	              } else if (keyword->Name != NULL && tk->Name != NULL && strcmp(keyword->Name, tk->Name) == 0) {
	                  idx = i;
	                  break;
	              } else if (keyword->KeyWord != NULL && tk->KeyWord != NULL && keyword->Size == tk->Size && memcmp(keyword->KeyWord, tk->KeyWord, keyword->Size) == 0) {
	                  idx = i;
	                  break;
	              }
	          }
	          skey++;
	      }
	      if (idx >= 0 && idx + 1 < keyset->NumberOfKeys) {
	          SingleSearchKey *next_skey = &keyset->Keys[idx + 1];
	          DbaseKeyword *target_key = next_skey->DBKey ? next_skey->DBKey : next_skey->Search;
	          if (target_key != NULL) {
	              FreeDbaseKeyword(keyword);
	              CreateDbaseKeyword(keyword, target_key->ID, target_key->Name, target_key->Size, target_key->KeyWord);
	              ret = FetchElement(element, keyword, info);
	          } else {
	              ret = SYSTEM_ERROR_RETURN;
	          }
	      } else {
	          ret = SYSTEM_ERROR_RETURN;
	      }
	  } else {
	      ret = SYSTEM_ERROR_RETURN;
	  }
	  }
     return(ret);
     }


 
/*F link = ReadGenericElement(key,dinfo)
**
**  DESCRIPTION
**    key: The key
**    dinfo: The linked list structure
**    link: the link
**
**    Reads a generic element from the specified database and returns the 
**    linked list structure (DbaseLinkedList).
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
extern DbaseLinkedList *ReadGenericElement(DbaseKeyword *key,
					   DataBaseInformation *dinfo)
     {
     datum dkey, datset;
     DbaseLinkedList *link;
     
     dkey.dsize = key->Size;
     dkey.dptr  = key->KeyWord;
     
     if (dinfo != NULL && dinfo->File != NULL)
	  {
	  datset = gdbm_fetch((GDBM_FILE) dinfo->File,
			dkey);
	  }
     else
	  {
	  datset.dsize = 0;
	  datset.dptr = NULL;
	  }
     
     if(datset.dsize != 0)
	  {
	  link = AllocateDbaseLinkedList;
	  CreateDbaseLinkedList(link,key->ID,key->Name,
				datset.dsize,
				datset.dsize,
				0,0,0);
	  memcpy(link->Element,datset.dptr,(unsigned int) datset.dsize);
	  }
     else
	  link = 0;
     
     return(link);
     }
/*F ret = StoreGenericElement(link,key,dinfo)
**
**  DESCRIPTION
**    key: The key
**    dinfo: The linked list structure
**    link: the link
**
**    Writes a generic element to the specified database and returns the 
**    linked list structure (DbaseLinkedList).
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
extern INT WriteGenericElement(DbaseLinkedList *link,
			       DbaseKeyword *keyword,
			       INT flag,
			       DataBaseInformation *info)
     {
     datum *key, *datset;
     INT ret;
     
     key = AllocateDatum;
     key->dsize = keyword->Size;
     key->dptr  = keyword->KeyWord;
     
     datset = MakeDatumElement(link);
     
     if (info != NULL && info->File != NULL)
	  {
	  ret = gdbm_store((GDBM_FILE) info->File,
		      *key,
		      *datset,
		      (int) flag);
	  }
     else
	  {
	  ret = SYSTEM_NORMAL_RETURN;
	  }
     
     Free(datset->dptr);
     Free(datset);
     Free(key);

     return(ret);
     }

