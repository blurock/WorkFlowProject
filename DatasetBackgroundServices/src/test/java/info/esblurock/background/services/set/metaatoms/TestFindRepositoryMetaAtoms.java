package info.esblurock.background.services.set.metaatoms;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFindRepositoryMetaAtoms {

	@Test
	public void test2() {
		String jsonS = "{\n" + "    service: \"FindTransactionsOfType\",\n"
				+ "    \"prov:activity\": \"dataset:InitialReadInOfRepositoryFile\",\n"
				+ "    \"dataset:transactionkey\": \"dataset:JThermodynamicsMetaAtoms\"\n" + "}";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		JsonObject response = DatabaseServicesBase.process(json);
		JsonObjectUtilities.printResponse(response);

		jsonS = "{\n" + "    service: \"FindTransactionChoicesOfTypeAndKey\",\n"
				+ "    \"prov:activity\": \"dataset:InitialReadInOfRepositoryFile\",\n"
				+ "    \"dataset:transactionkey\": \"dataset:JThermodynamicsMetaAtoms\"\n" + "}";
		json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		response = DatabaseServicesBase.process(json);
		JsonObjectUtilities.printResponse(response);

	}

}
