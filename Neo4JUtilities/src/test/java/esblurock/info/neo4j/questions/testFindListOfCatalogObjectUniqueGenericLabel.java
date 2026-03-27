package esblurock.info.neo4j.questions;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.RDFQuestionsUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class testFindListOfCatalogObjectUniqueGenericLabel {

	@Test
	public void test() {
	try {
		JsonObject input = new JsonObject();
		input.addProperty("owner", "Administration");
		JsonObject response = RDFQuestionsUtilities.FindListOfCatalogObjectUniqueGenericLabel(input);
		JsonObjectUtilities.printResponse(response);
	} catch (Exception e) {
		e.printStackTrace();
		fail("Exception in testFindListOfCatalogObjectUniqueGenericLabel: " + e.getMessage());
	}
	}

}
