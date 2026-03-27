package info.esblurock.background.services.set.symmetry.optical;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadOpticalIsomerDefinitions {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		
		String srcpath = "src/test/java/resources/symmetrydefinition/optical/readOpticalIsomerDefinitions.json";
		String maintainer = "Administrator";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			JsonObjectUtilities.printResponse(response);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
