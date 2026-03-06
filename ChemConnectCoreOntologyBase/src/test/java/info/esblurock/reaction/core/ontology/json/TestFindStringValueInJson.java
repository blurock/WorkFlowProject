package info.esblurock.reaction.core.ontology.json;


import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFindStringValueInJson {

	@Test
	public void test() {
		System.out.println("----------- TestFindStringValueInJson");
		String jsonS = "{\n"
				+ "  \"foaf:Person\": {\n"
				+ "    \"foaf:name\": {\n"
				+ "      \"foaf:givenName\": \"Edward\",\n"
				+ "      \"foaf:title\": \"Dr.\",\n"
				+ "      \"foaf:familyName\": \"Blurock\"\n"
				+ "    },\n"
				+ "    \"vcard:role\": \"Researcher\"\n"
				+ "  },\n"
				+ "  \"dataset:title-person\": \"Edward S. Blurock\"\n"
				+ "}\n";
		String name = "foaf:familyName";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		String ans = JsonObjectUtilities.getValueUsingIdentifier(json, name);
		System.out.println(name + " gives: "+ ans + " (should be Blurock)");
		
	}

}
