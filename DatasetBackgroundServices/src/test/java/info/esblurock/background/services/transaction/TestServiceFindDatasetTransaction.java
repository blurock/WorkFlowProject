package info.esblurock.background.services.transaction;

import static org.junit.Assert.assertNotNull;
import org.junit.Test;
import com.google.gson.JsonObject;
import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestServiceFindDatasetTransaction {

	@Test
	public void testServiceCall() {
		InitiallizeSystem.initialize();
		JsonObject body = new JsonObject();
		body.addProperty("service", "FindDatasetTransaction");

		JsonObject infoObject = new JsonObject();
		String owner = "UOqk0KtFtaXma5TGsi8Seh9RMbx1";
		String labelString = "BensonSM";
		String typeString = "dataset:InitialReadInOfRepositoryFile";

		infoObject.addProperty(ClassLabelConstants.CatalogObjectOwner, owner);
		infoObject.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, labelString);
		infoObject.addProperty(ClassLabelConstants.DatabaseObjectType, typeString);

		body.add(ClassLabelConstants.ActivityInformationRecord, infoObject);
		body.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitialReadInOfRepositoryFile");
		body.addProperty("onlyone", false);

		try {
			JsonObject response = DatabaseServicesBase.process(body);
			System.out.println("Response from FindDatasetTransaction service:");
			System.out.println(JsonObjectUtilities.toString(response));
			assertNotNull(response);
		} catch (Exception ex) {
			ex.printStackTrace();
		}
	}
}
