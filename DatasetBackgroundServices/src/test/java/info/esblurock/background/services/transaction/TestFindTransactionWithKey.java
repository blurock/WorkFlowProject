package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFindTransactionWithKey {

	@Test
	public void test() {
		String type = "dataset:InitialReadInOfRepositoryFile";
		String keyword = "dataset:JThermodynamicsMetaAtoms";
		JsonObject response = FindTransactions.findLabelFirestoreIDPairByType(type, keyword);
		JsonObjectUtilities.printResponse(response);
	}

}
