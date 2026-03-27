package info.esblurock.background.services.firestore;

import java.io.IOException;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;

public class FirestoreBaseClass {

	public static String projectId = "blurock-database";
	public static String host = "localhost:8081";

	private static Firestore database = null;
	private static Storage storage = null;

	public static JsonObject createEmptyFirestoreCatalogID() {
		JsonObject firestoreid = CreateDocumentTemplate.createTemplate("dataset:FirestoreCatalogID");
		firestoreid.add(ClassLabelConstants.CollectionDocumentIDPair, new JsonArray());
		return firestoreid;
	}

	public static Storage getStorage() throws IOException {
		if(storage == null) {
			storage = StorageOptions.getDefaultInstance()
					.getService();
		} else {
			
		}
		return storage;
	}
	public static Firestore getFirebaseDatabase() throws IOException {
		if (database == null) {
			database = FirestoreBaseClass.setupDatabase();
		}
		return database;
	}

	private static Firestore setupDatabase() throws IOException {
	    
	    GoogleCredentials credentials = GoogleCredentials.getApplicationDefault();
	    
	    FirebaseOptions options = FirebaseOptions.builder()
	            .setCredentials(credentials)
	            .setProjectId(projectId)
	            .build();
	    
	    /*
	    FirebaseOptions options1 = new FirebaseOptions.Builder()
	        .setCredentials(credentials)
	        .setProjectId(projectId)
	        .build();
	    */
	    
	    if(FirebaseApp.getInstance() == null) {
	        FirebaseApp.initializeApp(options);
	    }

	    Firestore db = FirestoreClient.getFirestore();
	    
		return db;
	}

	private static Firestore setUpDatabaseLocal() throws IOException {
		GoogleCredentials cred = GoogleCredentials.getApplicationDefault();
		FirestoreOptions firestoreOptions = FirestoreOptions.getDefaultInstance().toBuilder()
		        .setProjectId(projectId)
				.setCredentials(cred)
				.setEmulatorHost(host)
				.build();
		 
		Firestore db = firestoreOptions.getService();
		return db;

	}

}
