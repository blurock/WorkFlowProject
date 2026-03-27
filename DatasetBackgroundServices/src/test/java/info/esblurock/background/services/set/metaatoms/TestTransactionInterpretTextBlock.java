package info.esblurock.background.services.set.metaatoms;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.FindTransactions;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestTransactionInterpretTextBlock {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String srcpath = "src/test/java/resources/metaatoms/createmetaatoms.json";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			String maintainer = "Administrator";
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			System.out.println("----------------------------------------------");
			JsonObjectUtilities.printResponse(response);
			System.out.println("----------------------------------------------");
		} catch (IOException e) {
			e.printStackTrace();
		}

	}

}
