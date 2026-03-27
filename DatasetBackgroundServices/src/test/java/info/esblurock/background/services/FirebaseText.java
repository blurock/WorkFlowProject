package info.esblurock.background.services;

import static org.junit.Assert.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import com.google.gson.JsonObject;
import org.junit.Test;

import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.firestore.WriteResult;

public class FirebaseText {

	@Test
	public void test() throws IOException, InterruptedException, ExecutionException {
		/*
		 * String projectId = "blurock-database";
		 * 
		 * FirestoreOptions firestoreOptions =
		 * FirestoreOptions.getDefaultInstance().toBuilder() .setProjectId(projectId)
		 * .setHost("localhost:8000")
		 * .setCredentials(GoogleCredentials.getApplicationDefault()) .build();
		 * Firestore db = firestoreOptions.getService();
		 * 
		 * System.out.println("Initialize database");
		 * 
		 * DocumentReference docRef = db.collection("users").document("alovelace");
		 * Map<String, Object> data = new HashMap<>(); data.put("first", "Ada");
		 * data.put("last", "Lovelace"); data.put("born", 1815); //asynchronously write
		 * data ApiFuture<WriteResult> result = docRef.set(data); // ... // result.get()
		 * blocks on response System.out.println("Update time : " +
		 * result.get().getUpdateTime());
		 * 
		 * String catalogname = "dataset:RepositoryFileStaging"; BaseAnnotationObjects
		 * hierarchy =
		 * DatasetOntologyParseBase.getAnnotationStructureFromIDObject(catalogname);
		 * JsonObject json = hierarchy.toJsonObject(); DocumentReference docRef2 =
		 * db.collection("users").document(catalogname); System.out.println(json);
		 * Map<String,Object> m = JSONToMap.ConvertJSONToMap(json); docRef2.set(m);
		 * 
		 */
	}

}
