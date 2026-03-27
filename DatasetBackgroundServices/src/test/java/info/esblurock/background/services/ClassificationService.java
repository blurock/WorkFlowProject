package info.esblurock.background.services;

import static org.junit.Assert.*;

import java.io.IOException;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class ClassificationService {

	@Test
	public void testSimple() {
		System.out.println("------------------------------------------------");
		String jsonS = "{\n" + "  \"service\": \"DatasetCreateClassificationList\",\n"
				+ "  \"dataset:classificationcomponent\": \"dataset:UserTitle\"\n" + "}\n" + "";
		JsonObject answer1;
		answer1 = DatabaseServicesBase.process(JsonObjectUtilities.jsonObjectFromString(jsonS));
		System.out.println(JsonObjectUtilities.toString(answer1));

	}

}
