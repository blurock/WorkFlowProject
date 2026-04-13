---
description: Execute a single TransactionEvent with a human-in-the-loop UI boundary
---
# Execute Single Transaction Event

This workflow coordinates a paused, human-in-the-loop transaction execution. It calculates a dynamic struct required for the transaction, auto-fills it from session memory, blocks for the frontend UI to capture human input, and then resumes the transaction against the backend.

## Input Values Required
- `TransactionEvent` (String): The ontology label of the transaction to execute.
- `SessionData` (JSON Object): The active user session state object.
- `UID`: The authenticated user ID triggering the flow.

## External Interfaces
- Backend Service Router: `/service` (for staging data)
- Backend Transaction Router: `/transaction` (for final execution)
- Frontend UI Portal: `/workflow-task/:uid/:sessionId` 

## Workflow Steps

1. Extract the `TransactionEvent` from the input arguments. Ensure the `UID` is present.
2. Call `/service` targeting `FindActivityInformationClassForTransaction` with the `TransactionEvent`. Ensure `UID` is passed in the JSON payload. Extract the `ActivityInformationClass` structure from the standard response.
3. Call `/service` targeting `FillDataObjectFromSessionData` passing both the newly obtained `ActivityInformationClass` (as `SimpleCatalogObject`) and the current `SessionData`. This performs an auto-substitution of parameters available in the session data.
4. Extract the pre-filled `ActivityInformationClass` from the returned `StandardResponse` payload.
5. Mutate the `SessionData` object: Add or overwrite the `ActivityInformationClass` key with the newly populated object.
6. Mutate the `SessionData` object: Set the `SessionStatus` string to `"UserInput"`.
7. Persist the updated `SessionData` object to the database (making use of the UpdateSessionDataService or the appropriate Firestore writing steps outlined in your skills).
8. **UI Boundary Wait**: Present or notify the user to complete the task via the frontend. The Angular `WorkflowTaskComponent` determines the required UI form automatically by requesting `getUITemplate()`. Note the return link configured in the `SessionData`. Wait for the user to complete the form and trigger the return HTTP hook.
9. Upon resuming execution (user submitted), extract the newly updated, finalized `ActivityInformationClass` from the `SessionData`.
10. Execute the core transaction by sending an HTTP POST call to the backend at `/transaction`. 
    The JSON payload must strictly look like:
    ```json
    {
      "uid": "<current uid>",
      "TransactionEventType": "<TransactionEvent string>",
      "ActivityInformationRecord": <The finalized ActivityInformationClass JSON object>
    }
    ```
11. Observe the result of the `/transaction` execution call. It will return a payload reflecting the outcome of the scientific/database transaction.
12. Store this entire outcome response under the key `ServiceResponseInformation` in the current `SessionData`.
13. Return the populated `SessionData` object to the workflow caller.
