package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFindTransactionFromTransactionID {

	@Test
	public void test() {
		InitiallizeSystem.initialize();
		JsonObject infoObject = new JsonObject();
		String transactionID = "63904e9b-33d0-45fe-a475-011dafacf20e";
		String owner = "UOqk0KtFtaXma5TGsi8Seh9RMbx1";
		String labelString = "ExternalSymmetryCarbonAtomSmall";
		String typeString = "dataset:JThermodynamicsSymmetryStructureDefinitionDataSet";
		infoObject.addProperty(ClassLabelConstants.TransactionID, transactionID);
		infoObject.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitialReadInOfRepositoryFile");
		infoObject.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, owner);
		infoObject.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, labelString);
		infoObject.addProperty(ClassLabelConstants.DatasetObjectType, typeString);
		try {
			JsonObject responseJsonObject = FindTransactions.findSpecificDatasetTransaction(infoObject, "dataset:InitialReadInOfRepositoryFile",transactionID);
			JsonObjectUtilities.printResponse(responseJsonObject);
		} catch (Exception ex) {
			ex.printStackTrace();
		}

	}

}
