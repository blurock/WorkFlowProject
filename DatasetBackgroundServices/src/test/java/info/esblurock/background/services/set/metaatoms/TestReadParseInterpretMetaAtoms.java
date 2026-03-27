package info.esblurock.background.services.set.metaatoms;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.RunMultipleTransactions;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadParseInterpretMetaAtoms {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String paths = "src/test/java/resources/metaatoms/readmetaatom.json" +
				"src/test/java/resources/metaatoms/parsemetaatom.json" +
				"src/test/java/resources/metaatoms/createmetaatoms.json";
		JsonObject response = RunMultipleTransactions.runMultipleFromListOfFiles(paths,"Adminstration",false,false);
		if(response != null) {
			JsonObjectUtilities.printResponse(response);
		} else {
			System.out.println("Error: no reponse formed");
		}
		
	}

}
