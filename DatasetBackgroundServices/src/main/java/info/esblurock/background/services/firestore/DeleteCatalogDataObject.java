package info.esblurock.background.services.firestore;

import java.io.IOException;
import java.util.List;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;

public class DeleteCatalogDataObject {

	protected static Firestore db;
	protected static int batchsize = 1000;

	public static void getFirestoreID() {
		if (db == null) {
			try {
				db = FirestoreBaseClass.getFirebaseDatabase();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
	
    /** Delete a set of catalog objects
     * @param objects The set of catalog objects to delete from database
     * @param deleteiferrors true is errors are allowed
     * @return The JsonArray of catalog objects not deleted.
     * 
     * This isolates the FirestoreID from each catalog object and then deletes the set.
     * An error is if the firestoreID is not found in the catalog objects
     * 
     */
    public static JsonArray deleteSetOfCatalogObjects(JsonArray objects, boolean deleteiferrors) {
        int errorcount = 0;
        JsonArray firestoreids = new JsonArray();
        JsonArray errors = new JsonArray();
        
        for (int i = 0; i < objects.size(); i++) {
            JsonObject catalog = objects.get(i).getAsJsonObject();
            if(catalog.get(ClassLabelConstants.FirestoreCatalogID) != null) {
                JsonObject firestoreid = catalog.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
                firestoreids.add(firestoreid);
            } else {
                errors.add(catalog);
            }
            boolean deleteobjects = deleteiferrors || (errors.size() == 0);
            if(deleteobjects) {
                deleteSetOfCatalogObjectsFromFirestoreIDs(firestoreids);
            }
        }
       return errors;
    }
    
	/** Delete objects with firestoreids as transaction
	 * @param firestoreids The firestoreids of the objects to delete
	 */
	public static void deleteSetOfCatalogObjectsFromFirestoreIDs(JsonArray firestoreids) {
        getFirestoreID();
        db.runTransaction(
                transaction -> {
                    for (int i = 0; i < firestoreids.size(); i++) {
                    JsonObject firestoreid = firestoreids.get(i).getAsJsonObject();
                    DocumentReference docref = SetUpDocumentReference.setup(db, firestoreid);
                    transaction.delete(docref);
                    }
                  return null;
                });
	}

	/**
	 * @param query     The query with the conditions
	 * @param batchSize The default batch
	 * @return The number of deleted objects
	 */
	protected static int deleteCollection(Query query, int batchSize) {
		int deleted = 0;
		try {
			// retrieve a small batch of documents to avoid out-of-memory errors
			ApiFuture<QuerySnapshot> future = query.limit(batchSize).get();

			// future.get() blocks on document retrieval
			List<QueryDocumentSnapshot> documents = future.get().getDocuments();
			for (QueryDocumentSnapshot document : documents) {
				document.getReference().delete();
				++deleted;
			}
			if (deleted >= batchSize) {
				// retrieve and delete another batch
				deleteCollection(query, batchSize);
			}
		} catch (Exception e) {
			System.err.println("Error deleting collection : " + e.getMessage());
		}
		return deleted;
	}
}
