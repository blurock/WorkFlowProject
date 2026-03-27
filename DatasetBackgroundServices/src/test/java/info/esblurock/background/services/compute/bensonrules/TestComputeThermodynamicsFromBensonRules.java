package info.esblurock.background.services.compute.bensonrules;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestComputeThermodynamicsFromBensonRules {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String srcpath = "src/test/java/resources/compute/bensonrules/testComputeThermodynamicsFromBensonRules.json";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			JsonObject response = DatabaseServicesBase.process(json);
			
            System.out.println("---------------------------------------------------------------------------------");
            JsonArray ans = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
            for(JsonElement element : ans) {
                JsonObject contribution = (JsonObject) element;
                System.out.println("================================");
                System.out.println(JsonObjectUtilities.toString(contribution));
                System.out.println("================================");
            }
            System.out.println("---------------------------------------------------------------------------------");
			//JsonObjectUtilities.printResponse(response);
		} catch (IOException e) {
			e.printStackTrace();
		}
		
	}

}
