make a human in the loop workflow that executes a transaction.

** INPUT **

TransactionEvent (dataset:TransactionEvent): The name of the transaction to execute.

*** Service Calls ***

These calls use the endpoint /service (BackgroundServiceController)
Input to Service is a JSON file with the following structure:

uid: the user calling the service (must match the user in the database) String uidfrombody = body.get("uid").getAsString();
The rest of the properties depend on the service being called.
The whole body is sent to the service.

*** Running Services ***
Call the service with endpoint /service
All services must have UID as a property in the input JSON object.
FindActivityInformationClassForTransaction: 
    input: TransactionEvent (String): the name of the transaction to execute. 
    Output: The JSON object that has the class ActivityInformationClass (dataset:ActivityInformationClass): The information that needs to be filled in to execute the transaction.
FillDataObjectFromSessionData:
    input: SessionData: the current session data: this is the source of the information to be filled in
           SimpleCatalogObject: the object to be filled in
    Output: The filled SimpleCatalogObject, when a parameter from SimpleCatalogObject is found in the SessionData, it is substituted.
    In this workflow, the SimpleCatalogObject will the ActivityInformationClass object.


*** Running Transaction ***
Call the transaction to with the endpoint /transaction:
     input: A Json Object with the following properties:
           UID: the user calling the service (must match the user in the database) String uidfrombody = body.get("uid").getAsString();
           TransactionEventType: TransactionEvent (String): the name of the transaction to execute. 
           ActivityInformationRecord: The filled in ActivityInformationClass.
     

User Interface:
Display the ActivityInformationClass 
use the dynamic form builder to display the ActivityInformationClass (dataset:ActivityInformationClass)

Frontend Services:
getUITemplate(classname: string): Observable<OntologyStructure>  is the service that is used to get the OntologyStructure for a class.
The OntologyStructure is the 'structure' property of the dynamic primitives input.

*** SessionData ***: 
The data that is passed through the workflow and is the result of the workflow (see Accessing Object Parameters skill)

UID: the user calling the service (must match the user in the database) String uidfrombody = body.get("uid").getAsString();
SessionId: the id of the session
SessionStatus: "UserInput" or "Completed" or "Error"
ActivityInformationClass: The JSON input to the transaction that needs to be filled in by SessionData and the user
SessionWorkflow: the id of the workflow
SessionWorkflowReturnLink: the return link of the workflow
ServiceResponseInformation: the response of the workflow (the transaction response)

** FINAL OUTPUT **

 The StandardResponse object containing the result of the transaction

** WORKFLOW **

The goal is to execute a transaction called TransactionEvent (String) from the input.
From the transaction name, the input to the transaction (is ActivityInformationClass) is determined.
Some values are filled in from the SessionData (SessionData).
The final values are filled in by the user.
With the final filled in ActivityInformationClass, the transaction is executed and the result is returned through the session data.




The specific steps of this workflow are as follows.

1. Get the TransactionEvent (String) from the input.
2. Call FindActivityInformationClassForTransaction with the TransactionEvent.
3. Get the ActivityInformationClass from the output of FindActivityInformationClassForTransaction.
4. Call FillDataObjectFromSessionData with the ActivityInformationClass and the SessionData to fill in the values from the session data.
5. Get the filled ActivityInformationClass from the response (see skill ResponseObject) of FillDataObjectFromSessionData.
6. Write the filled ActivityInformationClass to the SessionData under the key ActivityInformationClass
7. Set status to "UserInput" in the SessionData, write under the key SessionStatus
8. Write the filled SessionData to the database under SessionData
9. Ask the user to fill in the missing information in the ActivityInformationClass.
9.1 Note the return link of the workflow
9.2 With SessionStatus being "UserInput", the WorkflowTaskComponent will determine how to display the ActivityInformationClass.
9.2 Call getUITemplate(ActivityInformationClass.classname) to get the OntologyStructure for the ActivityInformationClass.
9.3 The value is the filled in ActivityInformationClass.
9.4 In the user interface, display the ActivityInformationClass using the dynamic form builder.
9.5 When the user clicks the return link, the workflow will continue.
10. Using the final user copy of ActivityInformationClass, call the transaction with the endpoint /transaction.
11. The response will be the result of the transaction.
12. Write the total response under ServiceResponseInformation in the SessionData
13. Return to the caller of the workflow.



