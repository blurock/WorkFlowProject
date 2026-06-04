# Set up a polling system

The purpose of the polling mechanism is to allow the user to keep track of the progress of the background jobs and intermediate results, and where the jobs are in the calculation process. This is especially important for the longer running jobs as the user needs to know that the job is still running and not hung up.

## Requirements
1. No modification of existing background jobs, their APIs or signatures. Within the existing background jobs, only add calls to update the poll data when appropriate.
2. No modification of the front-end code calling structure (just the possible addition of an initialization)
3. Use existing infrastructure where possible.
4. Changes should be easily reversible.
5. Keep the code modular and well documented.
6. Consider the implications of moving this functionality to be managed.
7. Initially I will manually put in the polling interaction within the jobs. Do not try to integrate anything into the system at this time. Just set up the mechanism and classes to perform the polling actions.

## Possible implementation details
1. communication through a firebase structure.
2. create a static JAVA class that uses the Firestore API to read and write data.
3. This class will be called by the background jobs to update the status of the job. (when appropriate)
4. The transaction can call this class to report progress and intermediate results.
5. The transaction can call this class to report the completion of the transaction and results.
6. The front-end can call this class to get the status of the transaction.
7. The front-end can use this polling to create a visual indicator of the progress of the transaction and where in the calculation the transaction is.
8. It could also help when an error occurs in the calculation. the front-end could then direct the user to the appropriate resource to correct the error.
9. It is important that initialization (or zeroing) occurs so the front-end does not get confused with a previous transaction. This could be initiated by the front-end or be part of the job setup.


