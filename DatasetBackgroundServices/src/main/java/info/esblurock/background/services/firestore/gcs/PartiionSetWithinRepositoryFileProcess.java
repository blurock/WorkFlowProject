package info.esblurock.background.services.firestore.gcs;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.datamanipulation.PartitionSetOfStringObjects;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.background.services.utilities.CreateLinksInStandardCatalogInformation;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.transaction.transactionbase.catalogchangeevent.catcreateevent.CreateDatabasePersonEvent;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class PartiionSetWithinRepositoryFileProcess {

	/**
	 * @param transactionID The transactionID
	 * @param owner         The owner of the created objects
	 * @param prerequisites The InitialReadInOfRepositoryFile, where the text
	 *                      content lies
	 * @param info          Source of extra information
	 *                      (ActivityRepositoryPartitionToCatalog), including the
	 *                      method of partition
	 * @return A set of subclasses of RepositoryDataPartitionBlock, depending on the
	 *         partition method.
	 * 
	 *         This calls the desired partition method (PartitionSetOfStringObjects)
	 *         For each of the partitions, additional information is added (from
	 *         ActivityRepositoryPartitionToCatalog)
	 * 
	 */
	public static JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
	    JsonObject response = null;
    	String colltype = info.get(ClassLabelConstants.DatasetCollectionObjectType).getAsString();
    	event.addProperty(ClassLabelConstants.DatasetCollectionObjectType, colltype);
		String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
		String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
		String maintainer = info.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
		String uniquelabel = info.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
		String type = info.get(ClassLabelConstants.DatasetObjectType).getAsString();
		
        JsonObject transfirestoreID = BaseCatalogData.insertFirestoreAddress(event);
		Document document = MessageConstructor.startDocument("PartiionSetWithinRepositoryFile");
		Element body = MessageConstructor.isolateBody(document);
		JsonObject staging = retrieveContentCatalogObjectFromPrerequisites(prerequisites);
		if(staging != null) {
		String content = retrieveContentFromTransaction(staging);
		// Parse the content using the info (FilePartitionMethod)
		String methodS = info.get(ClassLabelConstants.FilePartitionMethod).getAsString();
		info.addProperty(ClassLabelConstants.CatalogObjectOwner, owner);
        JsonArray objects = PartitionSetOfStringObjects.partitionString(info, transactionID, content,document);
                
		String sourceformat = info.get(ClassLabelConstants.FileSourceFormat).getAsString();
		JsonArray set = new JsonArray();
		Element table = body.addElement("table");
		Element hrow = table.addElement("tr");
		hrow.addElement("th").addText("Position");
		hrow.addElement("th").addText("Message");
		for (int i = 0; i < objects.size(); i++) {
			Element row = table.addElement("tr");
			JsonObject catalog = objects.get(i).getAsJsonObject();
            catalog.add(ClassLabelConstants.FirestoreCatalogIDForTransaction,transfirestoreID.deepCopy());
			catalog.addProperty(ClassLabelConstants.FileSourceFormat, sourceformat);
			catalog.addProperty(ClassLabelConstants.FilePartitionMethod, methodS);

			catalog.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, uniquelabel);
			catalog.addProperty(ClassLabelConstants.DatasetObjectType, type);
			catalog.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, maintainer);
			
			
			CreateLinksInStandardCatalogInformation.transfer(info, catalog);
			CreateLinksInStandardCatalogInformation.transfer(staging, catalog);
			CreateLinksInStandardCatalogInformation.linkCatalogObjects(staging,
					"dataset:ConceptLinkRepositoryFileToPartition", catalog);
			BaseCatalogData.insertFirestoreAddress(catalog);
			String message = WriteFirestoreCatalogObject.writeCatalogObject(catalog);
			row.addElement("td").addText(catalog.get(ClassLabelConstants.Position).getAsString());
			row.addElement("td").addText(message);
			set.add(catalog);
		}
		String message = "Successful: " + objects.size() + "blocks";
		response = StandardResponse.standardServiceResponse(document, message, set);
        
      } else {
          String text =  "Prerequisites \"dataset:initreposfile\" not found in:\n " + JsonObjectUtilities.toString(prerequisites);
          response = StandardResponse.standardErrorResponse(document,text, null);
          System.out.println(text);
      }

		return response;
	}

	/**
	 * Read in the content from the blob storage using transaction
	 * 
	 * @param prerequisites The prerequisite transaction
	 * @return The content
	 * 
	 *         Using the InitialReadInOfRepositoryFile transaction, read in the
	 *         content from the blob storage. If the content string is empty, then
	 *         the read was not successful
	 * 
	 */
	private static String retrieveContentFromTransaction(JsonObject staging) {
		String content = "";
		if (staging != null) {
			// From the RepositoryDataPartitionBlock get the blob information
			// (GCSBlobFileInformationStaging)
			JsonObject gcsinfo = staging.get(ClassLabelConstants.GCSBlobFileInformationStaging).getAsJsonObject();
			// read content from blob storage
			//System.out.println("------------------------------------------------------");
			//System.out.println(JsonObjectUtilities.toString(gcsinfo));
			//System.out.println("------------------------------------------------------");
			content = ReadCloudStorage.read(gcsinfo);
			//System.out.println("------------------------------------------------------");
			//System.out.println(content);
			//System.out.println("------------------------------------------------------");
		}
		return content;
	}

	private static JsonObject retrieveContentCatalogObjectFromPrerequisites(JsonObject prerequisites) {
		JsonObject staging = TransactionProcess.retrieveSingleOutputFromTransaction(prerequisites,
				"dataset:initreposfile");
		return staging;
	}
}
