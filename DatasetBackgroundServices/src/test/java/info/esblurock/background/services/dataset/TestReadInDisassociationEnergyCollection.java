package info.esblurock.background.services.dataset;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.servicecollection.DatabaseServicesBase;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadInDisassociationEnergyCollection {

	@Test
	public void test() {
		JsonObject json = new JsonObject();
		String service = "ReadInDatasetWithDatasetCollectionLabel";
		String maintainer = "Administrator";
		String dataset = "StandardDataset";
		String classname = "dataset:JThermodynamicsDisassociationEnergyOfStructure";
        JsonObject recordid = new JsonObject();
        json.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
        recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
        recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		json.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
		json.addProperty(DatabaseServicesBase.service, service);

		JsonObject response = DatabaseServicesBase.process(json);
		JsonObjectUtilities.printResponse(response);
	}

}
