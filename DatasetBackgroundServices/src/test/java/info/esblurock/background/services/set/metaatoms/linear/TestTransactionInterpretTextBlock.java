package info.esblurock.background.services.set.metaatoms.linear;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.transaction.FindTransactions;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestTransactionInterpretTextBlock {

	@Test
	public void test() {
		String srcpath = "src/test/java/resources/metaatoms/linear/createmetaatoms.json";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			String maintainer = "Administrator";
			//try {
			
			
			
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			System.out.println("1----------------------------------------------");
			//JsonObjectUtilities.printResponse(response);
			System.out.println("2----------------------------------------------");
			//} catch(Exception ex) {
				//ex.printStackTrace();
			//}
		} catch (IOException e) {
			e.printStackTrace();
		}

	}

}
