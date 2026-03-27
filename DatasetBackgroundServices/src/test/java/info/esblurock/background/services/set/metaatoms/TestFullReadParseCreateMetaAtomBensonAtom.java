package info.esblurock.background.services.set.metaatoms;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.RunMultipleTransactions;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFullReadParseCreateMetaAtomBensonAtom {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String paths = "src/test/java/resources/metaatoms/readmetaatom.json\n" +
				"src/test/java/resources/metaatoms/parsemetaatom.json\n" +
				"src/test/java/resources/metaatoms/createmetaatoms.json\n";
		JsonObject response = RunMultipleTransactions.runMultipleFromListOfFiles(paths,"Adminstration",false,false);
		if(response != null) {
			JsonObjectUtilities.printResponse(response);
		} else {
			System.out.println("Error: no reponse formed");
		}
	}

}
