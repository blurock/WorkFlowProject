package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestPartiionSetWithinRepositoryFile {

	@Test
	public void test() {
		String srcpath = "src/test/java/resources/parsemolthermoblock.json";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			String maintainer = "Administrator";
			JsonObject response = TransactionProcess.processFromTransaction(json,maintainer);
			System.out.println(JsonObjectUtilities.toString(response));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

}
