package info.esblurock.background.services.set.vibrational.version2;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.RunMultipleTransactions;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FullReadParseCreateVibrationalModes {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String paths = "src/test/java/resources/vibrational/version2/readVibrationalModes.json\n" +
				"src/test/java/resources/vibrational/version2/parseVibrationalModes.json\n" +
				"src/test/java/resources/vibrational/version2/createVibrationalModes.json\n";
		JsonObject response = RunMultipleTransactions.runMultipleFromListOfFiles(paths,"Adminstration",false,false);
		if(response != null) {
			JsonObjectUtilities.printResponse(response);
		} else {
			System.out.println("Error: no reponse formed");
		}
	}

}
