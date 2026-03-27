package info.esblurock.background.services.transaction;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestDeleteTransaction {

	@Test
	public void test() {
		String type = "dataset:TransactionInterpretTextBlock";
		//String type = "dataset:TransactionInterpretTextBlock";
		// String type = "dataset:TransactionInterpretTextBlock";
		// String type = "dataset:InitialReadInOfRepositoryFile";
		// String type = "dataset:PartiionSetWithinRepositoryFile";
		JsonObject transresponse = FindTransactions.findLabelFirestoreIDPairByType(type, null);
		if (transresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonArray labelids = transresponse.get(ClassLabelConstants.LabelFirestoreIDPair).getAsJsonArray();
			if (labelids.size() > 0) {
				JsonObject first = labelids.get(0).getAsJsonObject();
				JsonObject firestorid = first.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
				JsonObject response = DeleteTransaction.deleteTransactionwithID(firestorid);
				JsonObjectUtilities.printResponse(response);
			} else {
				System.out.println("No " + type + " to delete");
			}
		}
	}

}
