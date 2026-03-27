package info.esblurock.background.services.datasetobject;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.datasetobjects.ReadInDatasetObjectCollectionProcess;
import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class testReadInDatasetObjectCollection {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		JsonObject info = new JsonObject();
		
		JsonObject data = new JsonObject();
		data.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, "OpticalIsomerSymmetry");
		data.addProperty(ClassLabelConstants.DatasetObjectType,"dataset:JThermodynamicsSymmetryStructureDefinitionDataSet");
		data.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, "Administrator");
		info.add(ClassLabelConstants.SpecificationForDataset, data);
		try {
		JsonObject response = ReadInDatasetObjectCollectionProcess.process(info);
		JsonObjectUtilities.printResponse(response);
		} catch(Exception ex) {
			ex.printStackTrace();
		}
	}

}
