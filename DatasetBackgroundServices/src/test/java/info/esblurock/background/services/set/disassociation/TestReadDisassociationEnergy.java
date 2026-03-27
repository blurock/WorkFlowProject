package info.esblurock.background.services.set.disassociation;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadDisassociationEnergy {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String srcpath = "src/test/java/resources/disassociationenergy/readdisassociationenergy.json";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			String maintainer = "Administrator";
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			JsonObjectUtilities.printResponse(response);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
