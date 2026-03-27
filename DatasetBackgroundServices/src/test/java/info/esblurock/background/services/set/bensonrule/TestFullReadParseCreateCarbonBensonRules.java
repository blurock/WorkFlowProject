package info.esblurock.background.services.set.bensonrule;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.RunMultipleTransactions;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFullReadParseCreateCarbonBensonRules {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String paths = "src/test/java/resources/bensonrules/test/testReadTableA1CarbonBensonRules.json\n" +
				 "src/test/java/resources/bensonrules/test/testParseTableA1CarbonBensonRules.json\n" +
				 "src/test/java/resources/bensonrules/test/testCreateTableA1CarbonBensonRules.json\n";
		JsonObject response = RunMultipleTransactions.runMultipleFromListOfFiles(paths,"Administrator", false, false);
		if(response != null) {
			JsonObjectUtilities.printResponse(response);
		} else {
			System.out.println("Error: no reponse formed");
		}
	}

}
