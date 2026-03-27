package info.esblurock.background.services;

import java.io.IOException;
import org.junit.Test;

public class TestReadCatalogWithAnnotations {

	@Test
	public void test() throws IOException {
		/*
		 * String projectId = "blurock-database";
		 * 
		 * FirestoreOptions firestoreOptions =
		 * FirestoreOptions.getDefaultInstance().toBuilder() .setProjectId(projectId)
		 * .setHost("localhost:8000")
		 * .setCredentials(GoogleCredentials.getApplicationDefault()) .build();
		 * Firestore db = firestoreOptions.getService();
		 * 
		 * String catalogname = "dataset:RepositoryFileStaging"; DocumentReference
		 * docRef = db.collection("catalog").document(catalogname);
		 * ApiFuture<DocumentSnapshot> future = docRef.get(); try { DocumentSnapshot
		 * document = future.get(); if (document.exists()) { JsonObject obj =
		 * JSONToMap.ConvertMapToJsonObject(document.getData());
		 * System.out.println("Document data: " + obj); } else {
		 * System.out.println("No such document!"); } } catch (InterruptedException |
		 * ExecutionException e) { // TODO Auto-generated catch block
		 * e.printStackTrace(); }
		 * 
		 */
	}

}
