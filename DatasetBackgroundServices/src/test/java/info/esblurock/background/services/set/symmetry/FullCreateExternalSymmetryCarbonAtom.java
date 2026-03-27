package info.esblurock.background.services.set.symmetry;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.RunMultipleTransactions;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FullCreateExternalSymmetryCarbonAtom {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String paths = "src/test/java/resources/symmetrydefinition/readExternalSymmetryCarbonAtom.json\n" +
				"src/test/java/resources/symmetrydefinition/parseExternalSymmetryCarbonAtom.json\n" +
				"src/test/java/resources/symmetrydefinition/createExternalSymmetryCarbonAtom.json\n";
		JsonObject response = RunMultipleTransactions.runMultipleFromListOfFiles(paths,"Adminstration",false,false);
		if(response != null) {
			JsonObjectUtilities.printResponse(response);
		} else {
			System.out.println("Error: no reponse formed");
		}
	}

}
