package info.esblurock.background.services;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.rdfs.FindRDFInClass;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestTransactionRDFs {

	@Test
	public void test() {
		String jsonS = "{\n" + "    \"dataset:transoutobjid\": [\n" + "      {\n"
				+ "        \"dataset:addressidpairs\": {\n" + "          \"dataset:collectiondocpair\": []\n"
				+ "        },\n" + "        \"qb:DataSet\": \"e7f94553-4794-4e4d-8f33-fd56cec1ff52\",\n"
				+ "        \"skos:inScheme\": \"usrinfo\"\n" + "      }\n" + "    ],\n"
				+ "    \"dataset:transaction-description-short\": {\n"
				+ "      \"prov:activity\": \"dataset:CreateDatabasePersonEvent\",\n"
				+ "      \"dataset:title-transaction\": \"Edward Blurock, Sweden\"\n" + "    },\n"
				+ "    \"dataset:requiredtransitionid\": [],\n" + "    \"dataset:activityinfo\": {\n"
				+ "      \"foaf:Person\": {\n" + "        \"foaf:name\": {\n"
				+ "          \"foaf:familyName\": \"Blurock\",\n" + "          \"foaf:givenName\": \"Edward\",\n"
				+ "          \"foaf:title\": \"dataset:Doctor\"\n" + "        },\n"
				+ "        \"vcard:role\": \"dataset:ConceptProgrammer\"\n" + "      },\n"
				+ "      \"dataset:publicread\": \"true\",\n"
				+ "      \"dataset:personfullname\": \"Edward Blurock\",\n"
				+ "      \"dcterms:identifier\": \"dataset:personcreate\",\n"
				+ "      \"dcterms:title\": \"Edward Blurock, Sweden\"\n" + "    },\n"
				+ "    \"dataset:firestorecatalog\": {\n" + "      \"dataset:addressidpairs\": {\n"
				+ "        \"dataset:collectiondocpair\": []\n" + "      },\n"
				+ "      \"qb:DataSet\": \"976eb3b9-bfe9-48cf-9ea7-2346fc8f9e21\",\n"
				+ "      \"skos:inScheme\": \"transactionobject\"\n" + "    },\n"
				+ "    \"dataset:accessmodify\": \"Administrator\",\n"
				+ "    \"transaction\": \"6f202e9c-cf93-4e93-983d-1d27ba031d3e\",\n"
				+ "    \"dataset:objectype\": \"dataset:TransactionEventObject\",\n"
				+ "    \"dcterms:creator\": \"Administrator\",\n" + "    \"dataset:readaccess\": \"Administrator\",\n"
				+ "    \"dataset:catalogkey\": \"96cfdb48-1dfa-41b3-ba2b-9e7ca9dc266c\",\n"
				+ "    \"dcterms:identifier\": \"dataset:eventobject\"\n" + "  }\n" + "";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		System.out.println("Input:    \n" + JsonObjectUtilities.toString(json));
		//JsonArray rdfs = FindRDFInClass.createSetOfJsonObjectRDFs(json);
		//System.out.println(JsonObjectUtilities.toString(rdfs));
	}

}
