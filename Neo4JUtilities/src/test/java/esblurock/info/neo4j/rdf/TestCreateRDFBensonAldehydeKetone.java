package esblurock.info.neo4j.rdf;

import static org.junit.Assert.assertTrue;
import org.junit.Test;
import java.util.Map;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.neo4j.driver.Session;
import org.neo4j.driver.Transaction;
import org.dom4j.Document;
import esblurock.info.neo4j.utilities.Neo4JInitialization;
import info.esblurock.reaction.core.firestore.FirestoreBaseClass;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.MessageConstructor;

public class TestCreateRDFBensonAldehydeKetone {

	@Test
	public void testRDFGeneration() {
		try {
			// 1. Read catalog object from Firestore
			Firestore db = FirestoreBaseClass.getFirebaseDatabase();
			String path = "hierthermodynamicdataset/UOqk0KtFtaXma5TGsi8Seh9RMbx1/datainformationhierarchy/hierdatasetseriesdataobjects/JThermodynamics2DSubstructureThermodynamicsDataSet/JThermodynamics2DSubstructureThermodynamicsDataSet/cyc5/R2y%231zxcR2xcR2x1";
			DocumentReference docref = db.document(path);
			ApiFuture<DocumentSnapshot> future = docref.get();
			DocumentSnapshot documentSnapshot = future.get();

			assertTrue("Document does not exist in Firestore at path: " + path, documentSnapshot.exists());

			Map<String, Object> mapObj = documentSnapshot.getData();
			String jsonString = new Gson().toJson(mapObj);
			JsonObject catalog = JsonObjectUtilities.jsonObjectFromString(jsonString);

			System.out.println("Successfully read catalog object from Firestore:");
			System.out.println(JsonObjectUtilities.toString(catalog));

			// 2. Call createRDFFromObject with Neo4J transaction and dom4j document
			try (Session session = Neo4JInitialization.getDriver().session()) {
				Transaction transaction = session.beginTransaction();

				Document document = MessageConstructor.startDocument("Transaction: " + transaction);

				boolean success = CreateRDFs.createRDFFromObject(transaction, catalog, document);

				System.out.println("Result of CreateRDFs.createRDFFromObject: " + success);
				System.out.println("Document XML output: \n" + document.asXML());

				assertTrue("RDF creation failed", success);

				transaction.commit();
				System.out.println("Transaction committed successfully.");
			}
		} catch (Exception e) {
			e.printStackTrace();
			assertTrue("Exception occurred during test execution: " + e.getMessage(), false);
		}
	}
}
