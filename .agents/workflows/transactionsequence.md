---
description: This workflow runs a set of transaction events, the prerequisites of the given transaction. This loops over the prerequisites with the single-transaction-event workflow.
---

# Execute A Set of Transaction Events

This workflow coordinates a paused, human-in-the-loop set of transactions execution. It calculates a dynamic struct required for the transaction, auto-fills it from session memory, blocks for the frontend UI to capture human input, and then resumes the transaction against the backend.

## Input Values Required
- `TransactionEvent` (String): The ontology label of the transaction to execute.
- `SessionData` (JSON Object): The active user session state object.
- `UID`: The authenticated user ID triggering the flow.

## External Interfaces
- Backend Service Router: `/service` (for staging data)
- Frontend UI Portal: `/workflow-task/:uid/:sessionId` 

## Workflow Steps
1. Extract the `TransactionEventType` from the input arguments. Ensure the `UID` is present.
2. Use the service OrderedListOfPrerequisites with input 'TransactionEventType' to find the list of transaction events that should be run. 
3. Loop through the set of prerequisite transaction events
3.1 Use FindDatasetTransaction to find if the prerequisite exists.
3.1.1 If the prerequisite transaction exists, exit loop

3.1.2 If the prerequisite transaction does not exist 
3.1.2.1 Set session variable 'singlerunning=true'
3.1.2.2 run the workflow 'single-transaction-workflow'
3.1.2.1 Show the result in the user interface: 
3.1.2.2 The message is displayed 
3.1.2.3 If the transaction is a success the resume button will resume to the next transaction.
3.1.2.4 Otherwise, if the transaction is not a success the process will stop.


