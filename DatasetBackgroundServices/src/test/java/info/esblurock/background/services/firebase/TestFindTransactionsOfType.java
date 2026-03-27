package info.esblurock.background.services.firebase;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.background.services.transaction.FindTransactions;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFindTransactionsOfType {

	@Test
	public void test1() {
		String jsonS = "{\n" + "    service: \"FindTransactionsOfType\",\n"
				+ "    \"prov:activity\": \"dataset:CreateDatabasePersonEvent\"\n" + "}";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		
		JsonObject response = DatabaseServicesBase.process(json);
		System.out.println(JsonObjectUtilities.toString(response));
	}

}
