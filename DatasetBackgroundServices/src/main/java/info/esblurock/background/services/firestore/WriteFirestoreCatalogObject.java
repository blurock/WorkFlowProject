package info.esblurock.background.services.firestore;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import info.esblurock.background.services.SystemObjectInformation;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class WriteFirestoreCatalogObject {
    
    public static String writeCatalogObjectWithException(JsonObject catalog) throws Exception {
        Firestore db;
        db = FirestoreBaseClass.getFirebaseDatabase();
        JsonObject firestorecatalogid = catalog.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
        String message = writeWithException(db, catalog, firestorecatalogid);
        return message;
    }
    
    
	public static String writeCatalogObject(JsonObject catalog) {
		Firestore db;
		String message = "";
		try {
		    message = writeCatalogObjectWithException(catalog);
		} catch (Exception e) {
			message = "ERROR: Could not set up Firestore: " + e.getMessage() + "\n";
		}
		return message;
	}

	public static String write(Firestore db, JsonObject catalog, JsonObject firestorecatalogid) {
		String message = "";
        try {		
		message = writeWithException(db,catalog,firestorecatalogid);
        } catch (InterruptedException | ExecutionException e) {
            message = "Catalog write to database failed: \n" + e.getMessage() + "\n";
        } catch(Exception ex) {
            message = "Failed write: " + ex.getMessage() + "\n";
        }		
		return message;
	}
	
	   public static String writeWithException(Firestore db, JsonObject catalog, JsonObject firestorecatalogid) throws Exception {
	        DocumentReference docRef = SetUpDocumentReference.setup(db, firestorecatalogid);
	        String message = "Successful Write:\n";
	        Type type = new TypeToken<HashMap<String, Object>>() {
	        }.getType();
	        Map<String, Object> mapObj = new Gson().fromJson(catalog, type);
	        ApiFuture<WriteResult> result =  null;
	        Timestamp time = null;

	              result = docRef.set(mapObj);
	                    time = result.get().getUpdateTime();
	                    String catid = firestorecatalogid.get(ClassLabelConstants.DataCatalog).getAsString();
	                    String id = firestorecatalogid.get(ClassLabelConstants.SimpleCatalogName).getAsString();

	                    message += catid + ": " + id + "(" + time.toString() + ")\n";

	        return message;
	    }

}
