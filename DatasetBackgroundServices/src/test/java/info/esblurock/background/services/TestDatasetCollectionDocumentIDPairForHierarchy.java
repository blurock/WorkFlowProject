package info.esblurock.background.services;

import static org.junit.Assert.*;

import java.io.IOException;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.SubstituteJsonValues;

public class TestDatasetCollectionDocumentIDPairForHierarchy {

	@Test
	public void test() {
		JsonObject obj = CreateDocumentTemplate.createTemplate("dataset:DatabasePerson");
		String jsonS = "{\n" + "  \"foaf:Person\": {\n" + "    \"foaf:name\": {\n"
				+ "      \"foaf:givenName\": \"Edward\",\n" + "      \"foaf:title\": \"Dr.\",\n"
				+ "      \"foaf:familyName\": \"Blurock\"\n" + "    },\n" + "    \"vcard:role\": \"Researcher\"\n"
				+ "  },\n" + "  \"dataset:title-person\": \"Edward S. Blurock\"\n" + "}\n" + "";
		JsonObject jsonsub = JsonObjectUtilities.jsonObjectFromString(jsonS);
		SubstituteJsonValues.substituteJsonObject(obj, jsonsub);
		JsonObject serviceJ = new JsonObject();
		serviceJ.addProperty("service", "DatasetCollectionDocumentIDPairForHierarchy");
		serviceJ.add("dataset:simpcatobj", obj);
		JsonObject id = DatabaseServicesBase.process(serviceJ);
		System.out.println(JsonObjectUtilities.toString(id));
	}

}
