package esblurock.info.neo4j.questions;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.RDFQuestionsUtilities;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class testCatalogObjectsFromUniqueGenericLabel {

	@Test
	public void test() {
		JsonObject input = new JsonObject();
		input.addProperty(ClassLabelConstants.CatalogObjectOwner, "Administrator");
		input.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, "MetaAtomsForBensonAtoms");
		input.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:JThermodynamicsMetaAtomDefinitionDataSet");
		JsonObject responseJsonObject = RDFQuestionsUtilities.CatalogObjectsFromUniqueGenericLabel(input);
		JsonObjectUtilities.printResponse(responseJsonObject);
	}

}
