package info.blurock.datamanager.datastoreterms;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteBatch;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;

import java.util.List;

/**
 * Class to handle writing DictionaryTermSet to Firestore.
 */
public class WriteDictionaryTerms {

    private static final String COLLECTION_NAME = DatastoreConstants.DATASTORE_TERMS;

    /**
     * Writes all terms in the provided DictionaryTermSet to Firestore.
     * Uses batching for efficiency and ensures each term uses its ID as the document ID.
     *
     * @param termSet The set of terms to write.
     * @return true if successful, false otherwise.
     */
    public static boolean write(DictionaryTermSet termSet) {
        if (termSet == null || termSet.getTerms() == null || termSet.getTerms().isEmpty()) {
            System.out.println("No terms to write.");
            return true;
        }

        try {
            Firestore db = FirestoreClient.getFirestore();
            CollectionReference collection = db.collection(COLLECTION_NAME);
            
            List<DictionaryTerm> terms = termSet.getTerms();
            int total = terms.size();
            
            // Firestore has a limit of 500 writes per batch
            int batchSize = 500;
            for (int i = 0; i < total; i += batchSize) {
                int end = Math.min(i + batchSize, total);
                List<DictionaryTerm> subList = terms.subList(i, end);
                
                // 1. Fetch existing documents in one round-trip to handle merging
                com.google.cloud.firestore.DocumentReference[] refs = new com.google.cloud.firestore.DocumentReference[subList.size()];
                for (int j = 0; j < subList.size(); j++) {
                    refs[j] = collection.document(subList.get(j).getId());
                }
                
                List<com.google.cloud.firestore.DocumentSnapshot> snapshots = db.getAll(refs).get();
                java.util.Map<String, com.google.cloud.firestore.DocumentSnapshot> snapshotMap = new java.util.HashMap<>();
                for (com.google.cloud.firestore.DocumentSnapshot snap : snapshots) {
                    if (snap.exists()) {
                        snapshotMap.put(snap.getId(), snap);
                    }
                }

                // 2. Prepare the batch
                WriteBatch batch = db.batch();
                for (DictionaryTerm term : subList) {
                    com.google.cloud.firestore.DocumentSnapshot existing = snapshotMap.get(term.getId());
                    if (existing != null) {
                        // Merge metadata.datatype
                        java.util.Map<String, Object> existingMetadata = (java.util.Map<String, Object>) existing.get("metadata");
                        if (existingMetadata != null && existingMetadata.containsKey("datatype")) {
                            Object existingTypesObj = existingMetadata.get("datatype");
                            if (existingTypesObj instanceof java.util.List) {
                                java.util.List<String> existingTypes = (java.util.List<String>) existingTypesObj;
                                java.util.List<String> newTypes = (java.util.List<String>) term.getMetadataValue("datatype");
                                
                                java.util.Set<String> combined = new java.util.HashSet<>(existingTypes);
                                combined.addAll(newTypes);
                                term.addMetadata("datatype", new java.util.ArrayList<>(combined));
                            }
                        }
                    }
                    
                    batch.set(collection.document(term.getId()), term.toMap());
                }
                
                ApiFuture<List<WriteResult>> future = batch.commit();
                future.get(); // Blocking wait for completion
            }
            
            System.out.println("Successfully wrote " + total + " terms to Firestore collection: " + COLLECTION_NAME);
            return true;
            
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR writing terms to Firestore: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Deletes all documents in the dictionary_terms collection.
     * Use with caution!
     */
    public static boolean clearCollection() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            CollectionReference collection = db.collection(COLLECTION_NAME);
            
            // Get all documents (up to 500 at a time for safety)
            Iterable<com.google.cloud.firestore.DocumentReference> documents = collection.listDocuments();
            WriteBatch batch = db.batch();
            int count = 0;
            for (com.google.cloud.firestore.DocumentReference doc : documents) {
                batch.delete(doc);
                count++;
                if (count >= 500) {
                    batch.commit().get();
                    batch = db.batch();
                    count = 0;
                }
            }
            if (count > 0) {
                batch.commit().get();
            }
            
            System.out.println("Cleared Firestore collection: " + COLLECTION_NAME);
            return true;
        } catch (Exception e) {
            System.err.println("Error clearing collection: " + e.getMessage());
            return false;
        }
    }
}
