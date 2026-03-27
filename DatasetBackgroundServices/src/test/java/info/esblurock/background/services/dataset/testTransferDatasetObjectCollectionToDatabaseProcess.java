package info.esblurock.background.services.dataset;

import static org.junit.Assert.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.datasetobjects.TransferDatasetObjectCollectionToDatabaseProcess;
import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class testTransferDatasetObjectCollectionToDatabaseProcess {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		JsonObject transaction = new JsonObject();
		transaction.addProperty(ClassLabelConstants.TransactionEventType, "dataset:TransferDatasetObjectCollectionToDatabase");
		
		JsonObject activity = new JsonObject();
		transaction.add(ClassLabelConstants.ActivityInformationRecord,activity);
		
		
		activity.addProperty(ClassLabelConstants.DescriptionTitle, "Transfer OpticalIsomerSymmetry (JThermodynamicsSymmetryStructureDefinitionDataSet) to SystemData"  );
		String maintainer = "Administrator";
		
		JsonObject datasetid = new JsonObject();
		activity.add(ClassLabelConstants.SpecificationForDataset, datasetid);
		datasetid.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, "OpticalIsomerSymmetry");
		datasetid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		datasetid.addProperty(ClassLabelConstants.DatasetObjectType, "dataset:JThermodynamicsSymmetryStructureDefinitionDataSet");
		
		
		JsonObject collectionid = new JsonObject();
		activity.add(ClassLabelConstants.DatasetSpecificationForCollectionSet, collectionid);
		collectionid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		collectionid.addProperty(ClassLabelConstants.CatalogDataObjectStatus, "dataset:CatalogObjectStatusCurrent");
		collectionid.addProperty(ClassLabelConstants.CollectionName, "SystemData");
		collectionid.addProperty(ClassLabelConstants.DatasetVersion, "1.0");
		
		try {
			JsonObject response = TransactionProcess.processFromTransaction(transaction,maintainer);
			JsonObjectUtilities.printResponse(response);
		} catch (Exception e) {
			e.printStackTrace();
		}

		
	}

}
