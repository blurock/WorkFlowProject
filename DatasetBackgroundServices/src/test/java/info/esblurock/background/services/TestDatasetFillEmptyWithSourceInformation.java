package info.esblurock.background.services;

import static org.junit.Assert.*;

import java.io.IOException;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestDatasetFillEmptyWithSourceInformation {

	@Test
	public void test() {
		JsonObject body = new JsonObject();
		String identifier = DatasetOntologyParseBase.getIDFromAnnotation("dataset:DatabasePerson");
		System.out.println("Identifier: dataset:DatabasePerson = " + identifier);
		body.addProperty("service", "DatasetFillEmptyWithSourceInformation");
		body.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:DatabasePerson");
		String jsonS = "{\n" + "	\"foaf:Person\": {\n" + "	    \"foaf:name\": {\n"
				+ "		\"foaf:familyName\":\"Blurock\",\n" + "		\"foaf:givenName\":\"Edward\",\n"
				+ "		\"foaf:title\":\"dataset:Doctor\"\n" + "	    },\n"
				+ "	    \"vcard:role\":\"dataset:ConceptProgrammer\"\n" + "	},\n"
				+ "	\"dataset:title-person\":\"Edward Blurock\",\n"
				+ "	\"dcterms:identifier\":\"dataset:personcreate\"\n" + "    }\n" + "";
		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		body.add(ClassLabelConstants.ActivityInformationRecord, json);
		JsonObject ans = DatabaseServicesBase.process(body);
		System.out.println(JsonObjectUtilities.toString(ans));
	}

}
