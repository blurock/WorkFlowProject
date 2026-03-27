package info.esblurock.background.services.transaction;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateUserAccount {

	@Test
	public void test() {
		
		InitiallizeSystem.initialize();
		String jsonS = "{\n" 
		        + "    \"prov:activity\": 'dataset:CreateUserAccountEvent',\n"
				+ "    \"dataset:transreqobj\":  {\n" 
		        + "	    \"dataset:eventcreateperson\": {\n"
				+ "	    \"dataset:firestorecatalog\": {\n"
				+ "                 \"qb:DataSet\": \"1c05abf3-52a5-4bb6-831c-1a66b00006a1\",\n"
				+ "                 \"dataset:addressidpairs\": {\n"
				+ "                     \"dataset:collectiondocpair\": []\n" + "                 },\n"
				+ "                 \"skos:inScheme\": \"transactionobject\"\n" + "            }\n" + "	}\n"
				+ "    },\n" 
				+ "    \"dataset:activityinfo\": {\n" 
				+ "	\"dcterms:title\": \"blurock\",\n"
				+ "	\"dataset:AuthorizationType\": \"\",\n" 
				+ "	\"foaf:account\": \"blurock\"\n" 
				+ "    }\n" 
				+ "}\n"
				+ "";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		JsonObject activity = json.get("dataset:activityinfo").getAsJsonObject();
		activity.addProperty(ClassLabelConstants.UserAccountRole, "Administrator");
		activity.addProperty(ClassLabelConstants.Email,"me@whatever.com");
		activity.addProperty(ClassLabelConstants.UID, "GenericUID");
		JsonObject person = createDatabaseUser();
		JsonObject personid = person.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		activity.add(ClassLabelConstants.DataDescriptionPerson, person.get(ClassLabelConstants.DataDescriptionPerson));
		if(personid != null) {
			JsonObject inputs = json.get(ClassLabelConstants.DatabaseIDFromRequiredTransaction).getAsJsonObject();
			System.out.println("---------------------------------------------------------------------------------");
			System.out.println("FirestoreID: DatabasePerson:\n" + JsonObjectUtilities.toString(personid));
			System.out.println("---------------------------------------------------------------------------------");
			inputs.add("dataset:eventcreateperson", personid);
			System.out.println("Test:\n" + JsonObjectUtilities.toString(json));
			System.out.println("Required: " + ClassLabelConstants.DatabaseIDFromRequiredTransaction);
			System.out.println("--------------------------- Create User Account Input Prerequisites-----------------------------------------");			
			System.out.println(JsonObjectUtilities.toString(TransactionProcess.getPrerequisiteObjects(json)));
			System.out.println("---------------------------------------------------------------------------------");
			System.out.println("Call:");
			String maintainer = "Administrator";
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			JsonObjectUtilities.printResponse(response);
		} else {
			System.out.println("ERROR in creating user");
		}
	}

	JsonObject createDatabaseUser() {
		String jsonS = "{\n" + "    \"prov:activity\": 'dataset:CreateDatabasePersonEvent',\n"
				+ "    \"dataset:objectype\": \"dataset:DatabasePerson\",\n" 
				+ "    \"dataset:transreqobj\":  {},\n"
				+ "    \"dataset:activityinfo\": {\n" 
				+ "	        \"foaf:Person\": {\n" 
				+ "	              \"foaf:name\": "
				+ "                   {\n"
				+ "		                \"foaf:familyName\":\"Blurock\",\n" 
				+ "		                \"foaf:givenName\":\"Edward\",\n"
				+ "		                 \"foaf:title\":\"dataset:Doctor\"\n" 
				+ "	                  },\n"
				+ "	              \"vcard:role\":\"dataset:ConceptProgrammer\"\n" 
				+ "	               },\n"
				+ "     	\"dataset:readaccess\": \"Public\",\n" 
				+ "	        \"dataset:personfullname\":\"Edward Blurock\",\n"
				+ "	        \"dcterms:identifier\":\"dataset:personcreate\",\n"
				+ "	        \"dataset:descr-person\": {"
				+ "	               \"dataset:title-person\": \"Edward Blurock, Sweden\"\n" 
				+ "          },\n" 
				+ "	        \"dcterms:title\": \"Edward Blurock, Sweden\",\n" 
				+ "	        \"dcterms:title-person\": \"Edward Blurock, Sweden\"\n" 
				+ "         }\n" 
				+ "     }\n" + "";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		String maintainer = "Administrator";
		System.out.println("createDatabaseUser() 0");
		JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
		System.out.println("--------------------------- Create User -----------------------------------------");
		System.out.println(JsonObjectUtilities.toString(response));
		System.out.println("---------------------------------------------------------------------------------");
		JsonObject person = null;
		if(response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsString() != "false") {
			JsonArray output = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
			person = output.get(0).getAsJsonObject();
			
		} else {
			System.out.println("ERROR\n" + response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
		}
		return person;
	}

}
