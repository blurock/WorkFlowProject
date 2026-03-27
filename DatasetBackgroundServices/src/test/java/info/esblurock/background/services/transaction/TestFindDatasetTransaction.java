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
		String labelString = "ExternalSymmetryCarbonAtomSmall";
		String typeString = "dataset:JThermodynamicsSymmetryStructureDefinitionDataSet";
		infoObject.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitialReadInOfRepositoryFile");
		infoObject.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, owner);
		infoObject.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, labelString);
		infoObject.addProperty(ClassLabelConstants.DatasetObjectType, typeString);
		String type = "dataset:InitialReadInOfRepositoryFile";
		boolean onlyone = false;
		try {
			JsonObject transaction = FindTransactions.findDatasetTransaction(infoObject, type, onlyone);
			JsonObjectUtilities.toString(transaction);
		} catch (Exception ex) {
			ex.printStackTrace();
		}
		
	}

}
