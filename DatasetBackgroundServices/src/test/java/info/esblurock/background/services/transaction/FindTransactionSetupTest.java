package info.esblurock.background.services.transaction;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FindTransactionSetupTest {

	@Test
	public void test() {
		String type = "dataset:InitialReadInOfRepositoryFile";
		String keyword = "dataset:JThermodynamicsMetaAtoms";
		JsonObject response = FindTransactions.findRDFShortTransactionDescriptionByType(type, keyword);
		// System.out.println(JsonObjectUtilities.toString(response));
		// JsonObject response =
		// FindTransactions.findLabelFirestoreIDPairByType(type,null);
		JsonObjectUtilities.printResponse(response);

		response = FindTransactions.findLabelFirestoreIDPairByType(type, keyword);
		// System.out.println(JsonObjectUtilities.toString(response));
		// JsonObject response =
		// FindTransactions.findLabelFirestoreIDPairByType(type,null);
		JsonObjectUtilities.printResponse(response);

	}

}
