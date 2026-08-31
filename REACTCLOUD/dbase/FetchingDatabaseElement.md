*** Goal
Replace the SetOfSearchKeyTypes concept for accessing database objects with conditional searches within Firestore database. 

*** Implementation

There are two ways to access database objects with a key:
1. Where is key is the ID: When the ID is known, here the ID is the name of the document
2. When the key is the name of the molecule: Here Within the Molecule collection, a search is made where 'Name' in the database object is equal to the desired name. 

I assume this is already implemented in /api/db/fetch used in FetchElementFromFirestore
.


*** Modification of SearchKeyElement in /Users/edwardblurock/git/WorkFlowProject/REACTCLOUD/dbase/dbkeys.c

Determining the key is not necessary: bypass the following:
keytype = FindKeyTypeFromID(id,dinfo);
dbkey = GetCorrespondingDBKey(keyword,keytype);

The code from FetchElement can be bypassed by directly using the code:

ret = FetchElementFromFirestore(element, keyword, dinfo);
     if (ret != SYSTEM_NORMAL_RETURN)
	  {
	  Error(0,"Element Not Found");
	  ret = SYSTEM_ERROR_RETURN;
	  }
     
     return(ret);



