package esblurock.info.neo4j.questions;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.RDFQuestionsUtilities;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FindDataSetObjectsWithCenterAtom {

	@Test
	public void test() {
		try {
			JsonObject input = new JsonObject();
			input.addProperty(ClassLabelConstants.CatalogObjectOwner, "Administrator");
			input.addProperty(ClassLabelConstants.JThermodynamicsBensonCenterAtom, "c");
			System.out.println("--------------------------------------------------------------");
			
			
			JsonObject response = RDFQuestionsUtilities.findDataSetObjectsWithCenterAtom(input);
			JsonObjectUtilities.printResponse(response);
			System.out.println("SmallTableA1CarbonBensonRules--------------------------------------------------------------");
			input.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, "SmallTableA1CarbonBensonRules");
			response = RDFQuestionsUtilities.findDataSetObjectsWithCenterAtom(input);
			JsonObjectUtilities.printResponse(response);
			System.out.println("--------------------------------------------------------------");
			
		} catch (Exception e) {
			e.printStackTrace();
			fail("Exception in testFindListOfCatalogObjectUniqueGenericLabel: " + e.getMessage());
		}

	}

}
