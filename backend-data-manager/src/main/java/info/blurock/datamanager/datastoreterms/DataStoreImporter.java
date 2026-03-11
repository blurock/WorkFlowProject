package info.blurock.datamanager.datastoreterms;

import com.google.cloud.discoveryengine.v1.DocumentServiceClient;
import com.google.cloud.discoveryengine.v1.FirestoreSource;
import com.google.cloud.discoveryengine.v1.ImportDocumentsRequest;
import com.google.cloud.discoveryengine.v1.BranchName;

import java.util.concurrent.ExecutionException;

public class DataStoreImporter {
    
    /**
     * Triggers an import from Firestore to Discovery Engine Data Store.
     * 
     * @return The operation ID/name if triggered, null otherwise.
     */
    public static String importFromFirestore() {
        try (DocumentServiceClient client = DocumentServiceClient.create()) {
            
            // The default branch is usually where you want to store documents
            BranchName parent = BranchName.ofProjectLocationCollectionDataStoreBranchName(
                DatastoreConstants.PROJECT_ID, 
                DatastoreConstants.LOCATION, 
                DatastoreConstants.DATASTORE_COLLECTION, 
                DatastoreConstants.DATA_STORE_ID, 
                DatastoreConstants.BRANCH_ID
            );

            FirestoreSource firestoreSource = FirestoreSource.newBuilder()
                    .setProjectId(DatastoreConstants.PROJECT_ID)
                    .setDatabaseId(DatastoreConstants.DATABASE_ID)
                    .setCollectionId(DatastoreConstants.DATASTORE_TERMS) 
                    .build();

            ImportDocumentsRequest request = ImportDocumentsRequest.newBuilder()
                .setParent(parent.toString())
                .setFirestoreSource(firestoreSource) 
                .setReconciliationMode(ImportDocumentsRequest.ReconciliationMode.FULL)
                .build();

            System.out.println("Triggering Discovery Engine Import (FULL mode) for collection: " + DatastoreConstants.DATASTORE_TERMS);
            
            // Trigger the operation asynchronously
            com.google.api.gax.longrunning.OperationFuture<com.google.cloud.discoveryengine.v1.ImportDocumentsResponse, com.google.cloud.discoveryengine.v1.ImportDocumentsMetadata> 
                future = client.importDocumentsAsync(request);
            
            String operationName = future.getName();
            System.out.println("Discovery Engine Import started. Operation Name: " + operationName);
            
            return operationName;
            
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR during Discovery Engine Import trigger: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}
