package esblurock.info.neo4j.questions;


import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.RDFQuestionsUtilities;
import esblurock.info.neo4j.rdf.generalquery.GeneralRDFQueryDefinition;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestGeneralRDFQueryDefinition {

	@Test
	public void test() {
		try {
			JsonObject inputJsonObject = new JsonObject();
			inputJsonObject.addProperty(ClassLabelConstants.RDFRelationClassName, "dataset:RDFJThermodynamicsMetaAtomInfoDataset");
			
			JsonObject propsJsonObject = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
			JsonObject property1 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
			property1.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:CatalogObjectOwner");
			property1.addProperty(ClassLabelConstants.ShortStringKey, "Administrator");
			JsonObject property2 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
			property2.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:JThermodynamicsStructureIsomerName");
			property2.addProperty(ClassLabelConstants.ShortStringKey, "COR2");
			JsonArray properties = propsJsonObject.get(ClassLabelConstants.PropertyValueQueryPair).getAsJsonArray();
			properties.add(property1);
			properties.add(property2);
			inputJsonObject.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, propsJsonObject);

			JsonObject responseJsonObject = RDFQuestionsUtilities.RDFGeneralQuery(inputJsonObject);
			JsonObjectUtilities.printResponse(responseJsonObject);
		} catch (Exception ex) {
			ex.printStackTrace();
		}
		
		
		
		
	}

}
