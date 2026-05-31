package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFindDatasetTransaction {

	@Test
	public void test() {
		InitiallizeSystem.initialize();
		JsonObject infoObject = new JsonObject();
		String owner = "UOqk0KtFtaXma5TGsi8Seh9RMbx1";
		String labelString = "BensonSM";
		String typeString = "dataset:InitialReadInOfRepositoryFile";
		infoObject.addProperty(ClassLabelConstants.CatalogObjectOwner, owner);
		infoObject.addProperty(ClassLabelConstants.DatabaseObjectType, typeString);
		JsonObject activity = new JsonObject();
		infoObject.add(ClassLabelConstants.ActivityInformationRecord, activity);
		activity.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, labelString);
		String type = "dataset:InitialReadInOfRepositoryFile";
		boolean onlyone = false;
		try {
			JsonObject props = FindTransactionFromActivityInfo.determineSetOfProps(type, activity);
			System.out.println(JsonObjectUtilities.toString(props));

			JsonObject transaction = FindTransactions.findDatasetTransaction(infoObject, type, onlyone);
			assertNotNull(transaction);
			System.out.println(JsonObjectUtilities.toString(transaction));
		} catch (Exception ex) {
			ex.printStackTrace();
		}

	}

}
