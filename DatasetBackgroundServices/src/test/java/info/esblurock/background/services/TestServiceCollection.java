package info.esblurock.background.services;

import static org.junit.Assert.*;

import java.io.IOException;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestServiceCollection {

	@Test
	public void test() {
		System.out.println("---------------------------------------------------");
		System.out.println("TestServiceCollection");
		System.out.println("---------------------------------------------------");
		String jsonS = "{\n" + "service: DatasetCreateObjectTemplate,\n"
				+ "\"dataset:objectype\": \"dataset:DatabasePerson\"\n" + "}\n";

		JsonObject json = JsonObjectUtilities.jsonObjectFromString(jsonS);
		String catalogtype = json.get(ClassLabelConstants.DatabaseObjectType).getAsString();
		System.out.println(ClassLabelConstants.DatabaseObjectType + ":  " + catalogtype);
		System.out.println("---------------------------------------------------");

		System.out.println(JsonObjectUtilities.toString(json));
		System.out.println("---------------------------------------------------");
		JsonObject answer = DatabaseServicesBase.process(json);
		System.out.println("---------------------------------------------------");
		System.out.println(JsonObjectUtilities.toString(answer));
	}

}
