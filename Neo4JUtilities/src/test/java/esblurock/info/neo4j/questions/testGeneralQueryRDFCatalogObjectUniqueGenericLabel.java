package esblurock.info.neo4j.questions;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.RDFQuestionsUtilities;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class testGeneralQueryRDFCatalogObjectUniqueGenericLabel {

	@Test
	public void test() {
		JsonObject inputJsonObject = new JsonObject();
		
		inputJsonObject.addProperty(ClassLabelConstants.RDFRelationClassName, "dataset:RDFCatalogObjectUniqueGenericLabel");
		inputJsonObject.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:RepositoryFileStaging");
		//inputJsonObject.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, "ExternalSymmetryCarbonAtomSmall");
		inputJsonObject.addProperty(ClassLabelConstants.CatalogObjectOwner, "UOqk0KtFtaXma5TGsi8Seh9RMbx1");
		try {
		JsonObject responseJsonObject = RDFQuestionsUtilities.RDFGeneralQueryWithJson(inputJsonObject);
		JsonObjectUtilities.printResponse(responseJsonObject);
		
		JsonArray catalogJsonObject = responseJsonObject.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
		JsonObject catalog = catalogJsonObject.get(0).getAsJsonObject();
		System.out.println(catalog.keySet());
		JsonArray properties = catalog.get(ClassLabelConstants.RDFGeneralQueryResultRow).getAsJsonArray();
		System.out.println(JsonObjectUtilities.toString(properties));
		for (int i = 0; i < properties.size(); i++) {
			JsonObject prop = properties.get(i).getAsJsonObject();
			System.out.println("----------------------------------");
			System.out.println(JsonObjectUtilities.toString(prop));
			}
		System.out.println("----------------------------------");
		
		JsonArray header = catalog.get(ClassLabelConstants.RDFPropertyDefinition).getAsJsonArray();
		for (int i = 0; i < header.size(); i++) {
			JsonObject column = header.get(i).getAsJsonObject();
			System.out.println("Column " + i + ": " + column.get(ClassLabelConstants.DescriptionTitle).getAsString());
		}
		for (int i = 0; i < properties.size(); i++) {
			JsonObject prop = properties.get(i).getAsJsonObject();
			JsonArray row = prop.get(ClassLabelConstants.ShortStringKey).getAsJsonArray(); 
			System.out.println("Row " + i + "---------------------------------");
			for (int j = 0; j < row.size(); j++) {
				System.out.println(" Column " + j + "   " + row.get(j).getAsString());
			}
		}
	} catch (Exception ex) {
		ex.printStackTrace();
	}
	}

}
