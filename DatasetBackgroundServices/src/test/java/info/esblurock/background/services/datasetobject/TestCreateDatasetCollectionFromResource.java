package info.esblurock.background.services.datasetobject;

import static org.junit.Assert.*;
import org.junit.Test;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import com.google.gson.JsonObject;
import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateDatasetCollectionFromResource {

	@Test
	public void test() {
		InitiallizeSystem.initialize();
		String resourcePath = "/resources/dataset/createdatasetcollection.json";
		try {
			InputStream inputStream = getClass().getResourceAsStream(resourcePath);
			if (inputStream == null) {
				inputStream = getClass().getClassLoader()
						.getResourceAsStream("resources/dataset/createdatasetcollection.json");
			}
			assertNotNull("Resource not found: " + resourcePath, inputStream);

			String content = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);

			// Ensure all required properties are present in activity info
			JsonObject activityInfo = json.getAsJsonObject(ClassLabelConstants.ActivityInformationRecord);
			if (activityInfo != null) {
				if (!activityInfo.has(ClassLabelConstants.SessionId)) {
					activityInfo.addProperty(ClassLabelConstants.SessionId, "test-session-id");
				}
				if (!activityInfo.has(ClassLabelConstants.UID)) {
					activityInfo.addProperty(ClassLabelConstants.UID, "Administrator");
				}
				if (!activityInfo.has(ClassLabelConstants.DatasetCollectionsSetLabel)) {
					activityInfo.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, "StandardDataset");
				}
				if (!activityInfo.has(ClassLabelConstants.ShortDescription)) {
					activityInfo.addProperty(ClassLabelConstants.ShortDescription,
							"Standard JThermodynamic Dataset IDs");
				}
			}
			System.out.println("Activity: " + JsonObjectUtilities.toString(activityInfo));
			String maintainer = "Administrator";
			JsonObject response = TransactionProcess.processFromTransaction(json, maintainer);
			assertNotNull("Response should not be null", response);
			System.out.println("-----------------------------------------------------------------------");
			JsonObjectUtilities.printResponse(response);
			System.out.println("-----------------------------------------------------------------------");
		} catch (Exception e) {
			e.printStackTrace();
			fail("Exception occurred: " + e.getMessage());
		}
	}
}
