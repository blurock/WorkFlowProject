package info.esblurock.background.services.dataset;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.collectionset.CollectionSetUtilities;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class DatasetCollectionManagement {

	// The set of DatasetCollectionSets that have been already read in from the
	// database
	private static JsonObject setOfDatasetCollectionSets;

	/**
	 * Retrieve copy of ChemConnectDatasetCollectionIDsSet with specification
	 * 
	 * @param collectionsetidinfo The DatasetCollectionSetRecordIDInfo
	 * @return The corresponding ChemConnectDatasetCollectionIDsSet, null if it
	 *         doesn't exist.
	 * 
	 *         If the ChemConnectDatasetCollectionIDsSet is in local memory from
	 *         this process then it is retrieved. If not, it is retrieved and put
	 *         into local memory. If it does not exist, then null is returned
	 * 
	 */
	public static JsonObject getDatasetCollectionSets(JsonObject collectionsetidinfo) {
		String maintainer = collectionsetidinfo.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
		String dataset = collectionsetidinfo.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
		JsonObject datasetcollectionset = null;
		if (setOfDatasetCollectionSets == null) {
			setOfDatasetCollectionSets = new JsonObject();
		}
		boolean notfound = true;
		/*
		if (setOfDatasetCollectionSets.get(maintainer) != null) {
			JsonObject maintainerset = setOfDatasetCollectionSets.get(maintainer).getAsJsonObject();
			if (maintainerset.get(dataset) != null) {
				datasetcollectionset = maintainerset.get(dataset).getAsJsonObject();
				notfound = false;
			}
		} else {
			JsonObject datasetelements = new JsonObject();
			setOfDatasetCollectionSets.add(maintainer, datasetelements);
		}
*/
		if (notfound) {
			JsonObject firestorecoll = getDatabaseSetID(collectionsetidinfo);
			JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(firestorecoll);
			if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
				datasetcollectionset = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
			}
		}
		return datasetcollectionset;
	}

	/**
	 * Generate the FirestoreCatalogID from the
	 * DatasetCollectionSetRecordIDInfo
	 * 
	 * @param collectionsetidinfo The DatasetCollectionSetRecordIDInfo
	 * @return The FirestoreID using the specification.
	 */
	public static JsonObject getDatabaseSetID(JsonObject collectionsetidinfo) {
		String maintainer = collectionsetidinfo.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
		String dataset = collectionsetidinfo.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
		JsonObject idcollection = null;
		if(maintainer.equals("systemthermodynamics")) {
		    idcollection = CreateDocumentTemplate.createTemplate("dataset:ThermodynamicsSystemCollectionIDsSet");
	        idcollection.addProperty(ClassLabelConstants.CatalogObjectKey, dataset);
		} else {
		     idcollection = CreateDocumentTemplate.createTemplate("dataset:ChemConnectDatasetCollectionIDsSet");
		}
		idcollection.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		idcollection.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, dataset);
		BaseCatalogData.insertFirestoreAddress(idcollection);

		JsonObject firestoreid = idcollection.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();

		return firestoreid;
	}

	/**
	 * Insert the ChemConnectDatasetCollectionIDsSet into local memory
	 * 
	 * @param collectionset A ChemConnectDatasetCollectionIDsSet
	 * 
	 *                      This uses the maintainer and dataset informmation to
	 *                      insert the ChemConnectDatasetCollectionIDsSet into local
	 *                      memory
	 */
	private static void putInLocalVersion(JsonObject collectionset) {
		String maintainer = collectionset.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
		String dataset = collectionset.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
		if (setOfDatasetCollectionSets == null) {
			setOfDatasetCollectionSets = new JsonObject();
		}
		if (setOfDatasetCollectionSets.get(maintainer) != null) {
			JsonObject maintainerset = setOfDatasetCollectionSets.get(maintainer).getAsJsonObject();
			maintainerset.add(dataset, collectionset);
		} else {
			JsonObject set = new JsonObject();
			setOfDatasetCollectionSets.add(maintainer, set);
			set.add(dataset, collectionset);
		}
	}

	/**
	 * @param owner               The owner of the catalog object
	 * @param transactionID       The transaction ID of the process to create the
	 *                            catalog object
	 * @param descr               A short description of this dataset
	 * @param collectionsetidinfo The ActivityInfoDatasetCollectionIDSpecification
	 * @return An empty ChemConnectDatasetCollectionIDsSet with no datasets loaded.
	 * 
	 */
	public static JsonObject setupNewDatabaseCollectionSet(JsonObject event, JsonObject info) {
		String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
		JsonObject recordid = info.get(ClassLabelConstants.DatasetCollectionSetRecordIDInfo).getAsJsonObject();
		JsonObject collectionid = info.get(ClassLabelConstants.DatasetSpecificationForCollectionSet).getAsJsonObject();
		String maintainer = recordid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
        String collectionname = recordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
        String title = info.get(ClassLabelConstants.DescriptionTitle).getAsString();
		String collectiontype = info.get("dcat:dataset").getAsString();
		event.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
		event.add(ClassLabelConstants.DatasetCollectionsSetLabel, collectionid);
		Document document = MessageConstructor.startDocument("Dataset Collection Set Creation Event");
		Element body = MessageConstructor.isolateBody(document);
		String descr = info.get(ClassLabelConstants.DescriptionAbstract).getAsString();
        body.addElement("div").addText("Collection Type      : " + collectiontype);
        body.addElement("div").addText("Owner                : " + owner);
        body.addElement("div").addText("Maintainer           : " + maintainer);
        body.addElement("div").addText("Collection Name      : " + collectionname);
        body.addElement("div").addText("Default Collection   : " + collectionid.get(ClassLabelConstants.CollectionName));
        body.addElement("div").addText("Default Status       : " + collectionid.get(ClassLabelConstants.CatalogDataObjectStatus));
        body.addElement("div").addText("Default Version      : " + collectionid.get(ClassLabelConstants.DatasetVersion));
		JsonObject idcollection = DatasetCollectionIDManagement
				.createEmptyChemConnectCurrentDatasetIDSet(collectionname, owner, transactionID, maintainer, descr);
		idcollection.addProperty(ClassLabelConstants.DescriptionTitle, title);
		fillInDatasetCollectionWithDefaults(collectiontype,collectionid,idcollection);
        JsonObject transfirestoreID = BaseCatalogData.insertFirestoreAddress(event);
        idcollection.add(ClassLabelConstants.FirestoreCatalogIDForTransaction,transfirestoreID.deepCopy());
		String message = WriteFirestoreCatalogObject.writeCatalogObject(idcollection);
		body.addElement("div").addText(message);
		putInLocalVersion(idcollection);
		JsonArray arr = new JsonArray();
		arr.add(idcollection);
		JsonObject response = StandardResponse.standardServiceResponse(document,
				"Success: Create Dataset Collection IDs set with standard values", arr);
		return response;
	}
	
	static void fillInDatasetCollectionWithDefaults(String collectiontype, JsonObject idcollection, JsonObject collectionid) {
	    collectionid.addProperty(ClassLabelConstants.DatasetCollectionType, collectiontype);
	    JsonArray datasets = CollectionSetUtilities.collectionDatasetInfo(collectiontype);
	    for(JsonElement element : datasets) {
	        JsonObject dataset = (JsonObject) element;
	        JsonObject id = new JsonObject();
            String maintainer = idcollection.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
            id.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
            String status = idcollection.get(ClassLabelConstants.CatalogDataObjectStatus).getAsString();
            id.addProperty(ClassLabelConstants.CatalogDataObjectStatus, status);
            String collectionname = idcollection.get(ClassLabelConstants.CollectionName).getAsString();
            id.addProperty(ClassLabelConstants.CollectionName, collectionname);
            String version = idcollection.get(ClassLabelConstants.DatasetVersion).getAsString();
            id.addProperty(ClassLabelConstants.DatasetVersion, version);
            
            String identifier = dataset.get(AnnotationObjectsLabels.identifier).getAsString();
            collectionid.add(identifier, id);
	    }
	}

	/**
	 * Insert dataset into ChemConnectDatasetCollectionIDsSet
	 * 
	 * @param recordid            The FirestoreCatalogID of the dataset to include
	 * @param collectionsetidinfo The DatasetCollectionSetRecordIDInfo
	 * @return The ChemConnectDatasetCollectionIDsSet with the dataset info included
	 * 
	 */
	public static JsonObject insertCollectionInfoDataset(JsonObject event, JsonObject info, JsonObject prerequisites) {
		Document document = MessageConstructor.startDocument("CreateDatabasePersonEvent");
		Element body = MessageConstructor.isolateBody(document);
		JsonArray objs = TransactionProcess.retrieveSetOfOutputsFromTransaction(prerequisites,
				"dataset:datasetcollectionsetcreationevent");
		JsonObject response = null;
		if (objs.size() > 0) {
			JsonObject collectionset = objs.get(0).getAsJsonObject();
            String origabstract = collectionset.get(ClassLabelConstants.DescriptionAbstract).getAsString();
            String newtitle = info.get(ClassLabelConstants.DescriptionTitle).getAsString();
            String newabstract = newtitle + "\n\n" + origabstract;
            collectionset.addProperty(ClassLabelConstants.DescriptionAbstract, newabstract);
            collectionset.addProperty(ClassLabelConstants.DescriptionTitle, newtitle);
			String collectiontype = collectionset.get(ClassLabelConstants.DatasetCollectionType).getAsString();
			JsonObject catrecordid = info.get(ClassLabelConstants.DatasetSpecificationForCollectionSet)
					.getAsJsonObject();
			JsonObject recordid = info.get(ClassLabelConstants.DatasetCollectionSetRecordIDInfo).getAsJsonObject();
			event.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
			String classname = info.get(ClassLabelConstants.DatabaseObjectType).getAsString();

			String collectionname = catrecordid.get(ClassLabelConstants.CollectionName).getAsString();
			String datasetversion = catrecordid.get(ClassLabelConstants.DatasetVersion).getAsString();

			String collection = collectionset.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();

			body.addElement("div").addText("Classname: " + classname + "(" + collectionname + ": " + datasetversion + ")");
			body.addElement("div").addText("Into collection: '" + collection + "'");
			DatasetCollectionIDManagement.insertCollectionInfoDataset(classname, collectiontype, catrecordid, collectionset);
			collectionset.add(ClassLabelConstants.DatasetCollectionSetRecordIDInfo, recordid);
			String newlabel = recordid.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
			collectionset.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, newlabel);
            BaseCatalogData.insertFirestoreAddress(collectionset);
            JsonObject transfirestoreid = BaseCatalogData.insertFirestoreAddress(event);
            collectionset.add(ClassLabelConstants.FirestoreCatalogIDForTransaction, transfirestoreid);
			WriteFirestoreCatalogObject.writeCatalogObject(collectionset);
			putInLocalVersion(collectionset);
			JsonArray arr = new JsonArray();
			arr.add(collectionset);
			response = StandardResponse.standardServiceResponse(document,
					"Success: Insert Dataset '" + classname + "' to Collection IDs set '" + collection + "'", arr);
		} else {
			response = StandardResponse.standardErrorResponse(document,
					"Error: Insert into Collection IDs set failed, prerequisite dataset:datasetcollectionsetcreationevent not found",
					null);
		}
		return response;
	}

	public static boolean writeCatalogObject(JsonObject catalog, JsonObject collectionids) {
		boolean success = true;
		String identifier = catalog.get(AnnotationObjectsLabels.identifier).getAsString();
		if (collectionids.get(identifier) != null) {
			String maintainer = collectionids.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String collectioname = collectionids.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
			JsonObject collectionid = collectionids.get(identifier).getAsJsonObject();
			String collectionname = collectionid.get(ClassLabelConstants.CollectionName).getAsString();
			String datasetversion = collectionid.get(ClassLabelConstants.DatasetVersion).getAsString();
			JsonObject recordid = catalog.get(ClassLabelConstants.DatabaseCollectionOfCurrentClass).getAsJsonObject();
			recordid.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
			recordid.addProperty(ClassLabelConstants.DatasetCollectionsSetLabel, collectioname);
			recordid.addProperty(ClassLabelConstants.CollectionName, collectionname);
			recordid.addProperty(ClassLabelConstants.DatasetVersion, datasetversion);
			recordid.addProperty(ClassLabelConstants.CatalogDataObjectStatus, "CatalogObjectStatusCurrent");
			String classname = GenericSimpleQueries.classFromIdentifier(identifier);
			recordid.addProperty(ClassLabelConstants.DatasetCollectionObjectType, classname);
			JsonObject catid = FindDatasetCollections.findDatasetCollectionID(classname, recordid);
			String id = catalog.get(ClassLabelConstants.CatalogObjectKey).getAsString();
			catid.addProperty(ClassLabelConstants.SimpleCatalogName, id);
			catalog.add(ClassLabelConstants.FirestoreCatalogID, catid);
			WriteFirestoreCatalogObject.writeCatalogObject(catalog);
			
		} else {
			success = false;
		}
		return success;
	}

}
