package info.esblurock.background.services.dataset;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCollectionIDManagement {

	@Test
	public void test() {
	    /*
		System.out.println("------------------------------------");
		System.out.println("firebaseIDOfCollection");
		System.out.println("------------------------------------");
		String maintainer = "Administrator";
		String datasetname = "Standard";
		String datasetversion = "20200919";
		String classname = "dataset:JThermodynamicsMetaAtomDefinition";
		JsonObject catrecordid = CreateDocumentTemplate.createTemplate("dataset:DatasetforTypeInCollectionSet");
		catrecordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		catrecordid.addProperty(ClassLabelConstants.CollectionName, datasetname);
		catrecordid.addProperty(ClassLabelConstants.DatasetVersion, datasetversion);
		catrecordid.addProperty(ClassLabelConstants.CatalogDataObjectStatus, "CatalogObjectStatusCurrent");

		JsonObject firestoreid = DatasetCollectionIDManagement.firebaseIDOfCollection(classname, catrecordid);
		System.out.println(JsonObjectUtilities.toString(firestoreid));
		System.out.println("------------------------------------");
		System.out.println("createEmptyChemConnectCurrentDatasetIDSet");
		System.out.println("------------------------------------");

		String owner = "Administrator";
		String transactionID = "11111111111";
		String collectionname = "StandardCollection";
		String description = "The standard default dataset";
		JsonObject collectionset = DatasetCollectionIDManagement.createEmptyChemConnectCurrentDatasetIDSet(
				collectionname, owner, transactionID, maintainer, description);

		System.out.println(JsonObjectUtilities.toString(collectionset));
		System.out.println("------------------------------------");
		System.out.println("insertCollectionInfoDataset");
		System.out.println("------------------------------------");
		DatasetCollectionIDManagement.insertCollectionInfoDataset(classname, catrecordid, collectionset);
		System.out.println(JsonObjectUtilities.toString(collectionset));
		System.out.println("------------------------------------");
*/
	}

}
