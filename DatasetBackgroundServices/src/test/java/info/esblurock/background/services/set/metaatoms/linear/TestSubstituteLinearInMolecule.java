package info.esblurock.background.services.set.metaatoms.linear;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestSubstituteLinearInMolecule {

	@Test
	public void test() {
		
		String srcpath = "src/test/java/resources/metaatoms/linear/substituteLinearMolecule.json";
		try {
			String content = Files.readString(Paths.get(srcpath));
			JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
			JsonObject response = DatabaseServicesBase.process(json);
			JsonObjectUtilities.printResponse(response);
		} catch (IOException e) {
			e.printStackTrace();
		}

	}

}
