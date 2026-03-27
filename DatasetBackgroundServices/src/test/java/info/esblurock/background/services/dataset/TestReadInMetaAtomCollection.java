package info.esblurock.background.services.dataset;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadInMetaAtomCollection {

	@Test
	public void test() {
	    /*
		JsonObject json = new JsonObject();
		String service = "ReadInDatasetWithDatasetCollectionLabel";
		String maintainer = "Administrator";
		String dataset = "StandardData";
		String classname = "dataset:JThermodynamicsMetaAtomDefinition";

		json.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		json.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
		json.addProperty(DatabaseServicesBase.service, service);

		JsonObject response = DatabaseServicesBase.process(json);
		*/
	       String metaatomtype = "BensonAtom";
	        String dataset = "StandardData";
	        String maintainer = "Administrator";
	        String classname = "dataset:JThermodynamicsMetaAtomDefinition";
	        String service = "ReadInDatasetWithDatasetCollectionLabel";
	 
	        JsonObject setofproperties = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
        JsonArray arr = new JsonArray();
        setofproperties.add(ClassLabelConstants.PropertyValueQueryPair, arr);
        JsonObject prop = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
        prop.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:jthermometaatominfo.dataset:metaatomtype");
        prop.addProperty(ClassLabelConstants.ShortStringKey, metaatomtype);
        arr.add(prop);
	    
        JsonObject json = new JsonObject();
        JsonObject recordid = CreateDocumentTemplate.createTemplate("dataset:DatasetCollectionSetRecordIDInfo", false);
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
        recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
        if (setofproperties != null) {
            json.add(ClassLabelConstants.SetOfPropertyValueQueryPairs, setofproperties);
        }
        json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
        json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
        json.addProperty(DatabaseServicesBase.service, service);
        JsonObject response = DatabaseServicesBase.process(json);

		JsonObjectUtilities.printResponse(response);
	}

}
