package info.esblurock.background.services.datasetobjects;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.ManageDatasetCatalogObjects;
import info.esblurock.background.services.utilities.CreateLinksInStandardCatalogInformation;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;

public class TransferDatasetObjectCollectionToDatabaseProcess {

	/** convertFromDatasetToDatabaseObject
	 * @param event The transaction object
	 * @param info The input information
	 * @return Response  with the list of destination database objects
	 * 
	 * The top routine for the transfer of dataset objects to database objects
	 * The information has the 
	 * SpecificationForDataset: for the collection of dataset objects to be transferred to the destination,
	 * DatasetSpecificationForCollectionSet: for the destination collection
	 * 
	 * Writing the database objects is done with ManageDatasetCatalogObjects.writeSetOfCatalogObjects
	 * 
	 * The dataset object is converted to a database object using convertFromDatasetToDatabaseObject.
	 * 
	 * The destination class name is found usingGenericSimpleQueries.classWithSameParent
	 */
	
	public static JsonObject process(JsonObject event, JsonObject info) {
		JsonObject response = null;
		Document document = MessageConstructor.startDocument("TransferDatasetObjectCollectionToDatabase");
		JsonObject readresponse = ReadInDatasetObjectCollectionProcess.process(info);
		String message = readresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
		MessageConstructor.combineBodyIntoDocument(document, message);
		Element body = MessageConstructor.isolateBody(document);
		if(readresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonObject collectionid = info.get(ClassLabelConstants.DatasetSpecificationForCollectionSet).getAsJsonObject();
			//event.add(ClassLabelConstants.DatasetSpecificationForCollectionSet, collectionid);
			JsonObject datasetid = info.get(ClassLabelConstants.SpecificationForDataset).getAsJsonObject();
			String datasetclass = datasetid.get(ClassLabelConstants.DatasetObjectType).getAsString();
			String collectionclassname = GenericSimpleQueries.classWithSameParent(datasetclass);
			//event.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, uniquelabel);
			JsonArray dataobjects = readresponse.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
			JsonArray databaseobjects = new JsonArray();
			Element lst = body.addElement("li");
			for(int i=0;i<dataobjects.size();i++) {
				JsonObject datasetobject = dataobjects.get(i).getAsJsonObject();
				String tmessage = "Transfering: " + datasetobject.get(ClassLabelConstants.CatalogObjectKey).getAsString();
				lst.addElement("ul").addText(tmessage);
				JsonObject datbaseobject = convertFromDatasetToDatabaseObject(datasetobject,collectionid,collectionclassname);
				databaseobjects.add(datbaseobject);
			}
			body.addElement("div").addText("Transfered " + dataobjects.size() + " catalog objects (" + collectionclassname + ")");
			JsonObject writeresponse = ManageDatasetCatalogObjects.writeSetOfCatalogObjects(event, collectionclassname, collectionid, databaseobjects);
			String wmessage = writeresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
			MessageConstructor.combineBodyIntoDocument(document, wmessage);
			response = StandardResponse.standardServiceResponse(document, "Transfer Successful", databaseobjects);
		} else {
			response = StandardResponse.standardErrorResponse(document, "Error in Reading in Dataset Objects", null);
		}
		return response;
	}

	/** convertFromDatasetToDatabaseObject
	 * 
	 * @param datasetobject This is the dataset object to be transferred to the database.
	 * @param collectionid this is the locaton of the database collection
	 * @param collectionclassname The destination class name.
	 * @return The database catalog object
	 * 
	 * Conversion:
	 * remove SpecificationForDataset
	 * add DatasetSpecificationForCollectionSet
	 * add CatalogObjectUniqueGenericLabel
	 * change identifier and DatabaseObjectType
	 * 
	 */
	private static JsonObject convertFromDatasetToDatabaseObject(JsonObject datasetobject, JsonObject collectionid,String collectionclassname) {
		JsonObject databaseobject = datasetobject.deepCopy();
		String identifier = DatasetOntologyParseBase.getIDFromAnnotation(collectionclassname);
		databaseobject.addProperty(AnnotationObjectsLabels.identifier, identifier);
		databaseobject.addProperty(ClassLabelConstants.DatabaseObjectType, "dataset:JThermodynamicsSymmetryStructureDefinitionDatabase");
		String uniquename = databaseobject.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
		databaseobject.remove(ClassLabelConstants.SpecificationForDataset);
		databaseobject.add(ClassLabelConstants.DatasetSpecificationForCollectionSet, collectionid);
		databaseobject.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, uniquename);
		
        CreateLinksInStandardCatalogInformation.linkCatalogObjects(datasetobject,
                "dataset:ConceptLinkDatasetObjectToDatabaseObject", databaseobject);
        BaseCatalogData.insertFirestoreAddress(databaseobject);
		return databaseobject;
	}
	
	
}
