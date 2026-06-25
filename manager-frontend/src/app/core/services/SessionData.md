When a session is created a SessionData object should be created with the session data. 
This session data will be important for multi-step operations. 
SessionData will not only store uid and sessionId but also the data created by the session and any other data that is needed to complete the session.
The firestore path of the session objects cand be stored in the SessionData object. 
SessionData will be stored in the Firestore database every time it is modified both in the frontend and the backend.

SessionData will be a singleton object that is injected into the components that need it.
The  updateHeartbeat() logic will be modified to use SessionData. 

In session.service.ts we will need to add the following methods:

1. Write current session data to Firestore
2. Read session data in Firestore

A method is needed to get the firestore path of a object. The input will be the (Json) object and the output will be the firestore path of the object. The path will call the endpoint /api/getfirestorepath to get the path. 

the uid will be retrieved from the auth service when the session is created
When the uid is needed by a process, it will be retrieved from the SessionData.



