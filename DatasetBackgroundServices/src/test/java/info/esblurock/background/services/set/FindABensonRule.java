package info.esblurock.background.services.set;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FindABensonRule {

	@Test
	public void test() {
		String bensonname = "c/d-(c)-(h)";
		String maintainer = "Administrator";
		String dataset = "StandardData";
		JsonObject setofprops1 = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		JsonArray arr1 = new JsonArray();
		setofprops1.add(ClassLabelConstants.PropertyValueQueryPair,arr1);
		JsonObject prop1 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		prop1.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:bensonrulestructure.dataset:bensonruleref");
		prop1.addProperty(ClassLabelConstants.ShortStringKey, bensonname);
		arr1.add(prop1);

		String classname = "dataset:ThermodynamicBensonRuleDefinition";
		String service = "ReadInDatasetWithDatasetCollectionLabel";
		JsonObject json = new JsonObject();
		JsonObject recordid = CreateDocumentTemplate.createTemplate("dataset:DatasetCollectionSetRecordIDInfo", false);
		recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
		json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
		json.addProperty(DatabaseServicesBase.service, service);
		json.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, setofprops1);
		JsonObject response = DatabaseServicesBase.process(json);
		System.out.println("-------------------------------------------------------------------");
		JsonObjectUtilities.printResponse(response);
		System.out.println("-------------------------------------------------------------------");
	}

}
