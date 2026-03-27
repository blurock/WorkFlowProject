package info.esblurock.background.services;

import static org.junit.Assert.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
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

public class TestCatalogWithAnnotations {

	@Test
	public void test() throws IOException, InterruptedException, ExecutionException {
		String catalogname = "dataset:RepositoryFileStaging";
		/*
		 * String projectId = "blurock-database";
		 * 
		 * FirestoreOptions firestoreOptions =
		 * FirestoreOptions.getDefaultInstance().toBuilder() .setProjectId(projectId)
		 * .setHost("localhost:8000")
		 * .setCredentials(GoogleCredentials.getApplicationDefault()) .build();
		 * Firestore db = firestoreOptions.getService();
		 * 
		 * Date today = new Date(); DateFormat dateFormat = new
		 * SimpleDateFormat("yyyy-mm-dd hh:mm:ss"); String strDate =
		 * dateFormat.format(today);
		 * 
		 * StandardOntologyCatalogElementHierarchy hierarchy =
		 * GenerateCatalogObject.generateSetOfStandardOntologyCatalogElement(catalogname
		 * ); BaseCatalogObject bascat = new BaseCatalogObject();
		 * bascat.fillBaseInfo("1", strDate, "Public", "blurock", catalogname);
		 * bascat.fill(hierarchy);
		 * 
		 * DocumentReference docRef = db.collection("catalog").document(catalogname);
		 * Map<String,Object> m = JSONToMap.ConvertJSONToMap(bascat.toJsonObject());
		 * ApiFuture<WriteResult> result = docRef.set(m);
		 * System.out.println("Update time : " + result.get().getUpdateTime());
		 * 
		 * AnnotationSet set = new AnnotationSet(); set.fill(hierarchy);
		 * DocumentReference docRef1 =
		 * db.collection("annotations").document(catalogname); Map<String,Object> a =
		 * JSONToMap.ConvertJSONToMap(set.toJsonObject()); ApiFuture<WriteResult>
		 * result1 = docRef1.set(a); System.out.println("Update time : " +
		 * result1.get().getUpdateTime()); System.out.println(set.toString(""));
		 * 
		 * JsonObject jobj = new JsonObject(); jobj.put("catalog" ,
		 * bascat.toJsonObject()); jobj.put("annotations", set.toJsonObject());
		 * 
		 * System.out.println(jobj);
		 * 
		 * DocumentReference docRef2 = db.collection("combined").document(catalogname);
		 * Map<String,Object> comb = JSONToMap.ConvertJSONToMap(jobj);
		 * ApiFuture<WriteResult> result2 = docRef2.set(comb);
		 * System.out.println("Update time : " + result2.get().getUpdateTime());
		 * 
		 */
	}

}
