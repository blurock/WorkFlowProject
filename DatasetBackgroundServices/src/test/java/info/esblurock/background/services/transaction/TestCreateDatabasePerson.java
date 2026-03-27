package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import java.io.IOException;

import org.junit.Test;

import com.google.cloud.firestore.Firestore;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.FirestoreBaseClass;
import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateDatabasePerson {

	@Test
	public void test() {
		try {
			InitiallizeSystem .initialize();
			
		String jsonS = "{\n" + "    \"prov:activity\": 'dataset:CreateDatabasePersonEvent',\n"
				+ "    \"dataset:objectype\": \"dataset:DatabasePerson\",\n"
				+ "    \"dataset:requiredtransitionid\":  {},\n" + "    \"dataset:activityinfo\": {\n"
				+ "	\"foaf:Person\": {\n" + "	    \"foaf:name\": {\n" + "		\"foaf:familyName\":\"Blurock\",\n"
				+ "		\"foaf:givenName\":\"Edward\",\n" + "		\"foaf:title\":\"dataset:Doctor\"\n"
				+ "	    },\n" + "	    \"vcard:role\":\"dataset:ConceptProgrammer\"\n" + "	},\n"
				+ "	\"dataset:publicread\": \"true\",\n" + "	\"dataset:personfullname\":\"Edward Blurock\",\n"
				+ "	\"dcterms:identifier\":\"dataset:personcreate\",\n"
				+ "	\"dcterms:title\": \"Edward Blurock, Sweden\",\n" 
				+ "\"dataset:descr-person\": {\n"
				+ "    \"dataset:purpose-person\": {\n"
				+ "      \"dataset:purposekey-person\": \"dataset:PurposePrincipleInvestigator\",\n"
				+ "      \"dataset:dataconcept-person\": \"dataset:ConceptResearcher\"\n"
				+ "    },\n"
				+ "    \"dataset:title-person\": \"Edward S. Blurock\",\n"
				+ "    \"dataset:keyword-person\": [],\n"
				+ "    \"dataset:abstract-person\": \"The creator of JThermodynamicsCloud\"\n"
				+ "  }\n"
				+ "  },\n"
				+ "        \"vcard:Location\": {\n"
				+ "        \"geo:location\": {\n"
				+ "          \"geo:lat\": \"55.703889\",\n"
				+ "          \"geo:long\": \"13.195\"\n"
				+ "        },\n"
				+ "        \"vcard:locality\": \"Lund\",\n"
				+ "        \"vcard:postal-code\": \"22594\",\n"
				+ "        \"vcard:country-name\": \"Sweden\",\n"
				+ "        \"vcard:street-address\": \"Bandelsvägen 1\"\n"
				+ "      },\n"
				+ "\n"
				
				+ "}\n" + "";
		System.out.println("JSON string: " + jsonS);
		String maintainer = "Administrator";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		System.out.println(JsonObjectUtilities.toString(json));
		JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
		System.out.println(JsonObjectUtilities.toString(response));
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

}
