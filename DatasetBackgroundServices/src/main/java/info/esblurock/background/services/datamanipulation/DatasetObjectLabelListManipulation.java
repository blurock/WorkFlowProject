package info.esblurock.background.services.datamanipulation;

import static org.hamcrest.CoreMatchers.nullValue;

import org.dom4j.Element;

import com.google.cloud.firestore.DocumentReference;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.DeleteCatalogDataObject;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.firestore.SetUpDocumentReference;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;

public class DatasetObjectLabelListManipulation extends DeleteCatalogDataObject {
	
	public static JsonObject GenerateChemConnectDatabaseUniqueGenericLabelSet(JsonObject event, JsonObject prerequisites, JsonObject info) {
		JsonObject responseJsonObject = null;
		
		String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
		JsonObject datasetid = info.get(ClassLabelConstants.SpecificationForDataset).getAsJsonObject();		
		String maintainer = datasetid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
		String objtype = datasetid.get(ClassLabelConstants.DatasetObjectType).getAsString();
		JsonObject genericset = CreateDocumentTemplate.createTemplate("dataset:ChemConnectDatabaseUniqueGenericLabelSet");
		genericset.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		String objtypeshort = objtype.substring(8);
		genericset.addProperty(ClassLabelConstants.DatasetObjectType,objtype );
		genericset.addProperty(ClassLabelConstants.DatasetObjectTypeName,objtypeshort );
		BaseCatalogData.insertStandardBaseInformation(genericset, owner, transactionID, "false", false);
		BaseCatalogData.insertFirestoreAddress(genericset);
		
		
		return responseJsonObject;
	}
	
	public static JsonObject findGenerateChemConnectDatabaseUniqueGenericLabelSetTransaction(String owner, String classname ) {
		String keyString = owner + "." + classname;
		
        JsonObject setofprops1 = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
        JsonArray arr1 = new JsonArray();
        setofprops1.add(ClassLabelConstants.PropertyValueQueryPair, arr1);
        
        JsonObject prop1 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
        String ref1 = ClassLabelConstants.ShortTransactionDescription;
        prop1.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:bensonrulestructure.dataset:bensonruleref");
        prop1.addProperty(ClassLabelConstants.ShortStringKey, keyString);
        arr1.add(prop1);
		
		return null;
	}
	
	public static JsonObject ModifyChemConnectDatabaseUniqueGenericLabelSet(JsonObject event, JsonObject prerequisites, JsonObject info) {
		JsonObject responseJsonObject = null;
		
		
		return responseJsonObject;
	}
	
	
	
	public static JsonObject addToChemConnectDatabaseObjectsForLabel(JsonObject event, JsonObject catalog) {
		String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
		String objkey = catalog.get(ClassLabelConstants.CatalogObjectKey).getAsString();
		JsonObject created = createChemConnectDatabaseObjectsForLabel(owner,transactionID,objkey, catalog);
		JsonObject firestoreid = created.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		String simplename = firestoreid.get(ClassLabelConstants.SimpleCatalogName).getAsString();
		JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(firestoreid);
		JsonObject objforlabel = null;
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			if (!response.get(ClassLabelConstants.SimpleCatalogObject).isJsonNull()) {
				objforlabel = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
			} else {
				objforlabel = null;
			}
		} else {
			objforlabel = created;
			firestoreid.addProperty(ClassLabelConstants.SimpleCatalogName,simplename);
		}
		
		if (objforlabel != null) {
			String uniquelabelString = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			JsonArray names = objforlabel.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsJsonArray();
			names.add(uniquelabelString);
			String message = WriteFirestoreCatalogObject.writeCatalogObject(objforlabel);
			if (message.startsWith("ERROR")) {
				objforlabel = null;
			}
		}
		return objforlabel;
	}

	public static JsonObject createChemConnectDatabaseObjectsForLabel(String owner, String transactionID, String objkey, JsonObject datasetid) {
		String maintainer = datasetid.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
		String objtype = datasetid.get(ClassLabelConstants.DatasetObjectType).getAsString();
		JsonObject genericset = BaseCatalogData.createStandardDatabaseObject("dataset:ChemConnectDatabaseObjectsForLabel", 
				owner, transactionID, "false");

		genericset.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
		genericset.addProperty(ClassLabelConstants.DatasetObjectType,objtype );
		
		String uniquelabelString = datasetid.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
		genericset.addProperty(ClassLabelConstants.CatalogObjectKeyLabel,objkey);
		genericset.addProperty(ClassLabelConstants.CatalogObjectKey,objkey);

		BaseCatalogData.insertFirestoreAddress(genericset);
		return genericset;
	}
	/**
	 * @param event The transaction
	 * @param info  The activity info
	 * @return The current ChemConnectDatabaseUniqueGenericLabelSet, null if
	 *         something went wrong
	 * 
	 *         The necessary information is extracted from the transaction and the
	 *         info.
	 * 
	 *         This routine creates a ChemConnectDatabaseUniqueGenericLabelSet
	 *         (using createChemConnectDatabaseUniqueGenericLabelSet) using the
	 *         generated firestoreID, the database is checked if one already exists.
	 *         if no, the generated catalog object is used, if yes, then the one
	 *         from the database is used.
	 * 
	 *         The new ChemConnectDatabaseUniqueGenericLabelSet is added (using
	 *         addGenericLabel)
	 */
	public static JsonObject addToChemConnectDatabaseUniqueGenericLabelSet(JsonObject event, JsonObject info) {
		String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
		//JsonObject transactionfirestoreJsonObject = event.get(ClassLabelConstants.FirestoreCatalogIDForTransaction).getAsJsonObject();

		JsonObject created = createChemConnectDatabaseUniqueGenericLabelSet(owner, transactionID, info);
		
		JsonObject firestoreid = created.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		String simplename = firestoreid.get(ClassLabelConstants.SimpleCatalogName).getAsString();
		JsonObject response = ReadFirestoreInformation.readFirestoreCollection(null,firestoreid);
		JsonObject genericset = null;
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			if (!response.get(ClassLabelConstants.SimpleCatalogObject).isJsonNull()) {
				JsonArray arr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
				if (arr.size() > 0) {
					genericset = arr.get(0).getAsJsonObject();
				} else {
					genericset = null;
				}
			} else {
				genericset = null;
			}
		} else {
			genericset = created;
			firestoreid.addProperty(ClassLabelConstants.SimpleCatalogName,simplename);
		}

		if (genericset != null) {
			String uniquelabelString = info.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			JsonObject descr = event.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
			String title = descr.get(ClassLabelConstants.ShortDescription).getAsString();
			addGenericLabel(genericset, title, uniquelabelString);

			String message = WriteFirestoreCatalogObject.writeCatalogObject(genericset);
			if (message.startsWith("ERROR")) {
				genericset = null;
			}
		}
		return genericset;
	}

	/**
	 * @param genericset        The current ChemConnectDatabaseUniqueGenericLabelSet
	 * @param title             The title extracted from the transaction
	 * @param uniquelabelString The unique label extracted from info
	 * 
	 *                          A new UniqueGenericLabelSpecification is created and
	 *                          added to the
	 *                          ChemConnectDatabaseUniqueGenericLabelSet
	 * 
	 */
	private static void addGenericLabel(JsonObject genericset, String title, String uniquelabelString) {
		JsonObject uniqueelement = new JsonObject();
		uniqueelement.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, uniquelabelString);
		uniqueelement.addProperty(ClassLabelConstants.DescriptionTitle, title);
		JsonArray set = genericset.get(ClassLabelConstants.UniqueGenericLabelSpecification).getAsJsonArray();
		set.add(uniqueelement);
	}

	public static JsonObject findChemConnectDatabaseUniqueGenericLabelSet(String owner, JsonObject datasetid) {
		JsonObject labels = createChemConnectDatabaseUniqueGenericLabelSet(owner,"", datasetid);
		JsonObject firestoreid = labels.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(firestoreid);
		return response;
	}
	
	public static JsonObject findChemConnectDatabaseObjectsForLabel(String owner, String objkey, JsonObject datasetid) {
		JsonObject labels = createChemConnectDatabaseObjectsForLabel(owner,"", objkey,datasetid);
		JsonObject firestoreid = labels.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(firestoreid);
		return response;
	}
	
	public static JsonObject deleteElementsFromLabelSets(JsonObject event, JsonObject catalog, Element body) {
		String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
		try {
		JsonObject datasetid = catalog.get(ClassLabelConstants.SpecificationForDataset).getAsJsonObject();
		deleteUniqueGenericLabelSet(owner, datasetid, body);
		String objkey = catalog.get(ClassLabelConstants.CatalogObjectKey).getAsString();
		deleteChemConnectDatabaseObjectsForLabel(owner,objkey,datasetid,body);
		} catch(NullPointerException ex) {
			body.addElement("div").addText("Elements not found in catalog objects, deletion not complete");
		}
		return null;
	}
	private static void deleteChemConnectDatabaseObjectsForLabel(String owner, String objkey, JsonObject datasetid, Element body) throws NullPointerException {
		body.addElement("div").addText("Delete from DatabaseObjects for label Set");
		JsonObject responsel = findChemConnectDatabaseObjectsForLabel(owner,objkey,datasetid);
		if(responsel.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonObject labelset = responsel.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
			String uniquelabel = datasetid.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			JsonArray set = labelset.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsJsonArray();
			body.addElement("div").addText("Searching for " + uniquelabel + " in " + set.size() + " elements");
			int found = -1;
			for(int i=0; i<set.size() && found < 0;i++) {
				String name = set.get(i).getAsString();
				if(name.equals(uniquelabel)) {
					found = i;
				}
			}
			if(found >= 0) {
				JsonElement removed = set.remove(found);
				if(!removed.isJsonNull()) {
					body.addElement("div").addText(uniquelabel + " found and removed");
				} else {
					body.addElement("div").addText(uniquelabel + " found, but there is an error upon removal");
				}
				set = labelset.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsJsonArray();
				if(set.size() == 0) {
					JsonObject firestoreid = labelset.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
					getFirestoreID();
					DocumentReference docref = SetUpDocumentReference.setup(db, firestoreid);
					docref.delete();
				} else {
					String message = WriteFirestoreCatalogObject.writeCatalogObject(labelset);
					body.addElement("div").addText("Write reduced list (" + message + ")");
				}
			} else {
				body.addElement("div").addText(uniquelabel + " not found in list");
			}
			
		} else {
			body.addElement("div").addText("Error in reading DatabaseObjects For Label Set");
			body.addElement("div").addText(responsel.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
		}
	}
	
	
	private static void deleteUniqueGenericLabelSet(String owner, JsonObject datasetid, Element body) throws NullPointerException {
		body.addElement("div").addText("Delete from UniqueGenericLabel Set");
		JsonObject responseu = findChemConnectDatabaseUniqueGenericLabelSet(owner,datasetid);
		if(responseu.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonObject genericset = responseu.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
			String uniquelabel = datasetid.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			JsonArray set = genericset.get(ClassLabelConstants.UniqueGenericLabelSpecification).getAsJsonArray();
			JsonObject found = null;
			for(int i=0; i<set.size() && found == null;i++) {
				JsonObject element = set.get(i).getAsJsonObject();
				String uelementS = element.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
				if(uelementS.equals(uniquelabel)) {
					found = element;
				}
			}
			if(found != null) {
				boolean removed = set.remove(found);
				if(removed) {
					body.addElement("div").addText(uniquelabel + " found and removed");
				} else {
					body.addElement("div").addText(uniquelabel + " found, but there is an error upon removal");
				}
				set = genericset.get(ClassLabelConstants.UniqueGenericLabelSpecification).getAsJsonArray();
				if(set.size() == 0) {
					JsonObject firestoreid = genericset.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
					getFirestoreID();
					DocumentReference docref = SetUpDocumentReference.setup(db, firestoreid);
					docref.delete();
				} else {
					String message = WriteFirestoreCatalogObject.writeCatalogObject(genericset);
					body.addElement("div").addText("Write reduced list (" + message + ")");
				}
			} else {
				body.addElement("div").addText(uniquelabel + " not found in list");
			}
		} else {
			body.addElement("div").addText("Error in reading UniqueGenericLabel Set");
			body.addElement("div").addText(responseu.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
		}

	}
	
	private static JsonObject createChemConnectDatabaseUniqueGenericLabelSet(String owner, String transactionID, JsonObject datasetid) {
		return null;
	}
	
}
