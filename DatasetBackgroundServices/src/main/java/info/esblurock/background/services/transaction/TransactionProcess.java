package info.esblurock.background.services.transaction;

import java.io.Console;
import java.util.Iterator;
import java.util.List;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.CreateRDFs;
import info.esblurock.background.services.SystemObjectInformation;
import info.esblurock.background.services.datamanipulation.CatalogModificationEventProcess;
import info.esblurock.background.services.datamanipulation.DatasetObjectLabelListManipulation;
import info.esblurock.background.services.datamanipulation.InterpretTextBlock;
import info.esblurock.background.services.dataset.DatasetCollectionCreateSystemCollection;
import info.esblurock.background.services.dataset.DatasetCollectionManagement;
import info.esblurock.background.services.dataset.user.CreateDatabasePersonTransaction;
import info.esblurock.background.services.dataset.user.CreateUserAccountTransaction;
import info.esblurock.background.services.dataset.user.InitializerUserAccountTransaction;
import info.esblurock.background.services.datasetobjects.TransferDatasetObjectCollectionToDatabaseProcess;
import info.esblurock.background.services.firestore.ManageDatasetCatalogObjects;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.background.services.firestore.gcs.PartiionSetWithinRepositoryFileProcess;
import info.esblurock.background.services.firestore.gcs.UploadFileToGCS;
import info.esblurock.background.services.utilities.CreateLinksInStandardCatalogInformation;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;
import jnr.ffi.Struct.int16_t;

public enum TransactionProcess {

	CatalogModificationEvent {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return CatalogModificationEventProcess.process(event, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String type = catalog.get(ClassLabelConstants.DatabaseObjectType).getAsString();
			return type;
		}

		@Override
		String transactionObjectName() {
			return "dataset:ChemConnectTransactionEvent";
		}

	},
	DatabaseDeleteTransaction {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			JsonObject firestoreid = info.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
			JsonObject response = DeleteTransaction.deleteTransactionwithID(firestoreid);
			return response;
		}

		@Override
		String transactionKey(JsonObject catalog) {
			return null;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetTransactionEventObject";
		}

	},
	InitializerUserAccount {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return InitializerUserAccountTransaction.create(event, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String username = catalog.get(ClassLabelConstants.UID).getAsString();
			return username;
		}

		@Override
		String transactionObjectName() {
			return "dataset:UserManagementTransactionObject";
		}

	},

	CreateDatabasePersonEvent {

		@Override
		public JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return CreateDatabasePersonTransaction.create(event, info, true);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			JsonObject person = catalog.get(ClassLabelConstants.PersonalDescription).getAsJsonObject();
			String title = person.get(ClassLabelConstants.UserClassification).getAsString();
			return title;
		}

		@Override
		String transactionObjectName() {
			return "dataset:UserManagementTransactionObject";
		}

	},
	CreateUserAccountEvent {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return CreateUserAccountTransaction.create(event, prerequisites, info, true);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String username = catalog.get(ClassLabelConstants.username).getAsString();
			return username;
		}

		@Override
		String transactionObjectName() {
			return "dataset:UserManagementTransactionObject";
		}

	},
	InitialReadFromUserInterface {
		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			TransactionProcess process = TransactionProcess.valueOf("InitialReadInOfRepositoryFile");
			JsonObject simpledescr = event.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
			simpledescr.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitialReadInOfRepositoryFile");
			info.addProperty(ClassLabelConstants.InitialReadTypeClass, "dataset:InitialReadFromUserInterface");
			return process.process(event, prerequisites, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String key = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			return key;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetTransactionEventObject";
		}

	},
	InitialReadFromWebLocation {
		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			TransactionProcess process = TransactionProcess.valueOf("InitialReadInOfRepositoryFile");
			JsonObject simpledescr = event.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
			simpledescr.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitialReadInOfRepositoryFile");
			info.addProperty(ClassLabelConstants.InitialReadTypeClass, "dataset:InitialReadFromWebLocation");
			return process.process(event, prerequisites, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String key = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			return key;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetTransactionEventObject";
		}

	},
	InitialReadInLocalStorageSystem {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			TransactionProcess process = TransactionProcess.valueOf("InitialReadInOfRepositoryFile");
			JsonObject simpledescr = event.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
			simpledescr.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitialReadInOfRepositoryFile");
			info.addProperty(ClassLabelConstants.InitialReadTypeClass, "dataset:InitialReadInLocalStorageSystem");
			return process.process(event, prerequisites, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String key = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			return key;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetTransactionEventObject";
		}

	},
	InitialReadInOfRepositoryFile {
		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			JsonObject response = null;
			try {
				String owner = event.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
				String transactionID = event.get(ClassLabelConstants.TransactionID).getAsString();
				response = UploadFileToGCS.readFromSource(transactionID, owner, info);
				if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
					JsonArray arr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
					if (arr.size() > 0) {
						JsonObject catalog = arr.get(0).getAsJsonObject();
						JsonObject filededescription = info.get(ClassLabelConstants.DataDescriptionFileStaging)
								.getAsJsonObject();
						catalog.add(ClassLabelConstants.DataDescriptionFileStaging, filededescription);
						String description = info.get(ClassLabelConstants.DescriptionTitle).getAsString();
						catalog.addProperty(ClassLabelConstants.ShortDescription, description);
						String genericnameString = info.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel)
								.getAsString();
						String datasetobjecttype = info.get(ClassLabelConstants.DatasetObjectType)
								.getAsString();
						catalog.addProperty(ClassLabelConstants.DatasetObjectType, datasetobjecttype);	
						JsonObject shortdescr = event.get(ClassLabelConstants.ShortTransactionDescription)
								.getAsJsonObject();
						shortdescr.addProperty(ClassLabelConstants.TransactionKey, "Read-" + genericnameString);
						shortdescr.addProperty(ClassLabelConstants.ShortDescription, description);
						BaseCatalogData.insertFirestoreAddress(catalog);
						CreateLinksInStandardCatalogInformation.addPrerequisitesToDataObjectLink(catalog,
								prerequisites);
						
						
						CreateLinksInStandardCatalogInformation.transfer(info, catalog);
						JsonObject transfirestoreID = BaseCatalogData.insertFirestoreAddress(event);
						catalog.add(ClassLabelConstants.FirestoreCatalogIDForTransaction, transfirestoreID.deepCopy());
						String message = WriteFirestoreCatalogObject.writeCatalogObject(catalog);
						if (message.startsWith("ERROR")) {
							Document errdoc = MessageConstructor.startDocument("Error: InitialReadInOfRepositoryFile");
							MessageConstructor.combineBodyIntoDocument(errdoc,
									response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
							response = StandardResponse.standardErrorResponse(errdoc,
									"Error: No catalog objects generated\n" + message, null);

						}
					} else {
						Document errdoc = MessageConstructor.startDocument("Error: InitialReadInOfRepositoryFile");
						MessageConstructor.combineBodyIntoDocument(errdoc,
								response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
						response = StandardResponse.standardErrorResponse(errdoc, "Error: No catalog objects generated",
								null);
					}
				} else {
					Document errdoc = MessageConstructor.startDocument("Error:InitialReadInOfRepositoryFile");
					MessageConstructor.combineBodyIntoDocument(errdoc,
							response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
					response = StandardResponse.standardErrorResponse(errdoc, "Error: Could not write to repository",
							null);
				}
			} catch (Exception ex) {
				ex.printStackTrace();
				Document document = MessageConstructor.startDocument("InitialReadInOfRepositoryFile");
				response = StandardResponse.standardErrorResponse(document,
						"Error in InitialReadInOfRepositoryFile: \n" + ex.getMessage(), response);
			}
			return response;
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String key = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			return key;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetTransactionEventObject";
		}

	},
	PartiionSetWithinRepositoryFile {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return PartiionSetWithinRepositoryFileProcess.process(event, prerequisites, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String key = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			return key;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetTransactionEventObject";
		}
	},
	TransactionSetupMolecularThermodynamics {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return InterpretTextBlock.interpret(event, prerequisites, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			JsonObject structure = catalog.get(ClassLabelConstants.JThermodynamics2DSpeciesStructure).getAsJsonObject();
			String name = structure.get(ClassLabelConstants.JThermodynamicsStructureIsomerName).getAsString();
			return name;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetTransactionEventObject";
		}

	},
	TransactionInterpretTextBlock {
		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return InterpretTextBlock.interpret(event, prerequisites, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {

			String maintainer = catalog.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			String label = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			return maintainer + "." + label;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetTransactionEventObject";
		}

	},
	/*
	GenerateChemConnectDatabaseUniqueGenericLabelSetEvent {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return DatasetObjectLabelListManipulation.GenerateChemConnectDatabaseUniqueGenericLabelSet(event,
					prerequisites, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String maintainer = catalog.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			String classString = catalog.get(ClassLabelConstants.DatasetObjectTypeName).getAsString();
			return maintainer + "." + classString;
		}

		@Override
		String transactionObjectName() {
			// TODO Auto-generated method stub
			return null;
		}

	},
	
	ModifyChemConnectDatabaseUniqueGenericLabelSetEvent {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return DatasetObjectLabelListManipulation.ModifyChemConnectDatabaseUniqueGenericLabelSet(event,
					prerequisites, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String maintainer = catalog.get(ClassLabelConstants.CatalogObjectOwner).getAsString();
			String label = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			String classString = catalog.get(ClassLabelConstants.DatasetObjectTypeName).getAsString();
			return maintainer + "." + classString + "." + label;
		}

		@Override
		String transactionObjectName() {
			// TODO Auto-generated method stub
			return null;
		}

	},
	*/
	TransferDatasetObjectCollectionToDatabase {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return TransferDatasetObjectCollectionToDatabaseProcess.process(event, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String name = catalog.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString();
			JsonObject structure = catalog.get(ClassLabelConstants.DatasetSpecificationForCollectionSet)
					.getAsJsonObject();

			String maintainer = structure.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String dataset = structure.get(ClassLabelConstants.CollectionName).getAsString();
			return "Transfer." + maintainer + "." + name + "." + dataset;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetCollectionObjectSetWriteTransaction";
		}

	},
	DatasetCollectionSetCreationEvent {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			JsonObject response = DatasetCollectionManagement.setupNewDatabaseCollectionSet(event, info);
			return response;
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String maintainer = catalog.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String name = catalog.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
			return maintainer + "." + name;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetCollectionManagementTransaction";
		}

	},
	DatasetCollectionSetAddDatasetEvent {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return DatasetCollectionManagement.insertCollectionInfoDataset(event, info, prerequisites);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String maintainer = catalog.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String name = catalog.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
			return maintainer + "." + name;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetCollectionManagementTransaction";
		}

	},
	DatasetCollectionSetObjectManagementDelete {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return ManageDatasetCatalogObjects.processDatasetCollectionSetObjectManagementDelete(event, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {

			JsonObject structure = catalog.get(ClassLabelConstants.DatasetSpecificationforDestinationCollectionSet)
					.getAsJsonObject();
			String maintainer = structure.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String dataset = structure.get(ClassLabelConstants.CollectionName).getAsString();
			String version = structure.get(ClassLabelConstants.DatasetVersion).getAsString();
			return "Delete." + maintainer + "." + dataset + ":" + version;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetCollectionObjectSetManipulationTransaction";
		}

	},
	DatasetCollectionSetObjectManagementCopy {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return ManageDatasetCatalogObjects.processDatasetCollectionSetObjectManagementCopy(event, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {

			JsonObject structure = catalog.get(ClassLabelConstants.DatasetSpecificationforDestinationCollectionSet)
					.getAsJsonObject();
			String maintainer = structure.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String dataset = structure.get(ClassLabelConstants.CollectionName).getAsString();
			String version = structure.get(ClassLabelConstants.DatasetVersion).getAsString();
			return "Copy." + maintainer + "." + dataset + ":" + version;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetCollectionObjectSetManipulationTransaction";
		}

	},
	DatasetCollectionSetObjectManagementMove {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return ManageDatasetCatalogObjects.processDatasetCollectionSetObjectManagementMove(event, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {

			JsonObject structure = catalog.get(ClassLabelConstants.DatasetSpecificationforDestinationCollectionSet)
					.getAsJsonObject();
			String maintainer = structure.get(ClassLabelConstants.CatalogDataObjectMaintainer).getAsString();
			String dataset = structure.get(ClassLabelConstants.CollectionName).getAsString();
			String version = structure.get(ClassLabelConstants.DatasetVersion).getAsString();
			return "Move." + maintainer + "." + dataset + ":" + version;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetCollectionObjectSetManipulationTransaction";
		}

	},
	DatasetCollectionSetCreateSystemCollection {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return DatasetCollectionCreateSystemCollection.processCreateSystemCollection(event, info);
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String name = catalog.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
			return name;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetSystemCollectionManagementTransaction";
		}

	},
	DatasetCollectionSetCopyCollection {

		@Override
		JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info) {
			return DatasetCollectionCreateSystemCollection.copyCollectionSet(event, info,
					"dataset:ThermodynamicsDatasetCollectionIDsSet");
		}

		@Override
		String transactionKey(JsonObject catalog) {
			String name = catalog.get(ClassLabelConstants.DatasetCollectionsSetLabel).getAsString();
			return name;
		}

		@Override
		String transactionObjectName() {
			return "dataset:DatasetSystemCollectionManagementTransaction";
		}

	};

	public static void addLinkToCatalog(JsonArray catalogobjs, JsonObject linkobj, String type, String concept) {
		for (int i = 0; i < catalogobjs.size(); i++) {
			JsonObject catalog = catalogobjs.get(i).getAsJsonObject();
			JsonArray linkarr = catalog.get(ClassLabelConstants.DataObjectLink).getAsJsonArray();
			JsonObject link = CreateDocumentTemplate.createTemplate("dataset:DataObjectLink");
			link.add(ClassLabelConstants.RelatedCatalogObjectIDAndType, linkobj);
			link.addProperty(ClassLabelConstants.DatabaseObjectTypeLink, type);
			link.addProperty(ClassLabelConstants.DataTypeConcept, concept);
			linkarr.add(link);
		}
	}

	/**
	 * @param transaction The current transaction
	 * @return The set of prerequisite transactions (TransactionEventObject)
	 * 
	 *         <ul>
	 *         <li>The required transactions firestoreid's are retrieved
	 *         (DatabaseIDFromRequiredTransaction)
	 *         <li>The set of keys for the transactions are found
	 *         <li>For each key, read in the transaction from the corresponding
	 *         firestoreID and set in list
	 *         <ul>
	 * 
	 */
	public static JsonObject getPrerequisiteObjects(JsonObject transaction) {

		JsonObject transactions = new JsonObject();
		JsonObject prerequisites = transaction.get(ClassLabelConstants.DatabaseIDFromRequiredTransaction)
				.getAsJsonObject();
		Iterator<String> keys = prerequisites.keySet().iterator();
		while (keys.hasNext()) {
			String key = keys.next();
			JsonObject fireid = prerequisites.get(key).getAsJsonObject();
			JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(fireid);
			if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
				JsonObject pretrans = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
				transactions.add(key, pretrans);
			}
		}
		return transactions;
	}

	/**
	 * @param prerequisites   The set of prerequisite transactions
	 * @param transidentifier The identifier of the transaction to retrieve
	 * @return The corresponding output catalog object (returns null if
	 *         unsuccessful)
	 * 
	 */
	public static JsonObject retrieveSingleOutputFromTransaction(JsonObject prerequisites, String transidentifier) {
		JsonObject catalog = null;
		if (prerequisites.get(transidentifier) != null) {
			JsonObject stagingtransaction = prerequisites.get(transidentifier).getAsJsonObject();
			// Get the set of output FirestoreID from transaction
			JsonArray outobjects = stagingtransaction.get(ClassLabelConstants.DatabaseObjectIDOutputTransaction)
					.getAsJsonArray();
			if (outobjects.size() > 0) {
				// There is only one, get the FirestoreID of RepositoryFileStaging output
				JsonObject stagingid = outobjects.get(0).getAsJsonObject();
				// Read the catalog object and isolate it from the response
				JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(stagingid);
				if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
					catalog = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
				} else {
					System.err.println("Catalog object not found: " + JsonObjectUtilities.toString(stagingid));
					System.err.println(response.get(ClassLabelConstants.ServiceResponseMessage).getAsString());
				}
			} else {
				System.err.println("Error in prerequisites: found prerequisites, but empty");
			}
		} else {
			System.err.println("Prerequisite '" + transidentifier + "' not found in\n"
					+ JsonObjectUtilities.toString(prerequisites));
		}
		return catalog;
	}

	public static JsonArray retrieveSetOfOutputsFromTransaction(JsonObject prerequisites, String transidentifier) {
		JsonArray catalogset = new JsonArray();
		// Get the InitialReadInOfRepositoryFile transaction
		JsonObject stagingtransaction = prerequisites.get(transidentifier).getAsJsonObject();
		// Get the set of output FirestoreID from transaction
		JsonArray outobjects = stagingtransaction.get(ClassLabelConstants.DatabaseObjectIDOutputTransaction)
				.getAsJsonArray();
		for (int i = 0; i < outobjects.size(); i++) {
			JsonObject stagingid = outobjects.get(i).getAsJsonObject();
			// Read the catalog object and isolate it from the response
			JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(stagingid);
			if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
				JsonObject catalog = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
				catalogset.add(catalog);
			}
		}
		return catalogset;
	}

	/**
	 * @param transactionID The transaction ID (unique code for set of transactions)
	 * @param owner         the owner of all the objects generated by the
	 *                      transaction
	 * @param prerequisites The set of IDs for the prerequisites of the transaction
	 * @param info          The auxiliary information associated with the
	 *                      transaction
	 * @return the transaction event
	 */
	abstract JsonObject process(JsonObject event, JsonObject prerequisites, JsonObject info);

	/**
	 * Generate Transaction Key
	 * 
	 * @param catalog The catalog
	 * @return The key associated with the transaction
	 */
	abstract String transactionKey(JsonObject catalog);

	abstract String transactionObjectName();

	public static JsonObject processFromTransaction(String transaction, JsonObject prerequisites,
			JsonArray prerequisitelist, JsonObject info, String owner) {
		Document document = MessageConstructor.startDocument("Transaction: " + transaction);
		String transname = transaction.substring(8);
		TransactionProcess process = TransactionProcess.valueOf(transname);
		String transactionID = SystemObjectInformation.determineTransactionID();
		// These assume that all transaction are of class TransactionEventObject (which
		// is independent of the catalog object class):
		String transactionobjectname = process.transactionObjectName();
		JsonObject event = BaseCatalogData.createStandardDatabaseObject(transactionobjectname, owner, transactionID,
				"false");
		event.add(ClassLabelConstants.ActivityInformationRecord, info);
		JsonObject transfirestoreid = BaseCatalogData.insertFirestoreAddress(event);
		String title = info.get(ClassLabelConstants.DescriptionTitle).getAsString();
		JsonObject shortdescr = event.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
		shortdescr.addProperty(ClassLabelConstants.TransactionEventType, transaction);
		shortdescr.addProperty(ClassLabelConstants.TransactionKey, transactionID);
		shortdescr.addProperty(ClassLabelConstants.ShortDescription, title);
		event.add(ClassLabelConstants.ActivityInformationRecord, info);
		String shorttitleString = "";
		if(info.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel) != null) {
			shorttitleString = info.get(ClassLabelConstants.CatalogObjectUniqueGenericLabel).getAsString() + ":  " + title;
		} else {
			shorttitleString = title;
		}
		
		event.addProperty(ClassLabelConstants.ShortDescription, shorttitleString);
		JsonObject response = process.process(event, prerequisites, info);
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			if (!response.get(ClassLabelConstants.SimpleCatalogObject).isJsonNull()) {
				JsonArray arr = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
				if (arr.size() > 0) {
					JsonObject catalog = arr.get(0).getAsJsonObject();
					
					String transactionkey = process.transactionKey(catalog);
					addRequiredTransactionInformation(event, prerequisites,transactionkey);

					
					shortdescr.addProperty(ClassLabelConstants.TransactionKey, process.transactionKey(catalog));
					JsonArray output = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
					GenerateTransactionEventObject.addDatabaseObjectIDOutputTransaction(event, output);
					event.add(ClassLabelConstants.RequiredTransactionIDAndType, prerequisitelist);
					WriteFirestoreCatalogObject.writeCatalogObject(event);
					String message = response.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
					MessageConstructor.combineBodyIntoDocument(document, message);
					response.add(ClassLabelConstants.TransactionEventObject, event);
					boolean noerror = CreateRDFs.createRDFFromObjectArray(arr, document);
					boolean noeventrdferror = CreateRDFs.createRDFFromObject(event, document);
					if (!noerror || !noeventrdferror) {
						Element body = MessageConstructor.isolateBody(document);
						body.addElement("div").addText("Error in RDF generation: ");
					}
				} else {
					String docmessage = response.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
					MessageConstructor.combineBodyIntoDocument(document, docmessage);
					Element body = MessageConstructor.isolateBody(document);
					body.addElement("div").addText("No partitions executed, no catalog objects written");
					response = StandardResponse.standardErrorResponse(document, "No partitions executed", response);
				}
			} else {
				Element body = MessageConstructor.isolateBody(document);
				body.addElement("div").addText("No Catalog Object generated");
			}
		}
		return response;
	}

	protected static void addRequiredTransactionInformation(JsonObject event, JsonObject prerequisites, String transactionkey) {
		Iterator<String> keys = prerequisites.keySet().iterator();
		JsonArray requiredinfoArray = new JsonArray();
		event.add(ClassLabelConstants.RequiredTransactionInformation, requiredinfoArray);
		while (keys.hasNext()) {
			String key = keys.next();
			JsonObject requiredtransaction = prerequisites.get(key).getAsJsonObject();
			
			JsonObject infoJsonObject = new JsonObject();
			
			JsonObject firebaseID = requiredtransaction.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
			infoJsonObject.add(ClassLabelConstants.RequiredTransactionIDAndType, firebaseID);
			
			String transactionID = requiredtransaction.get(ClassLabelConstants.TransactionID).getAsString();
			infoJsonObject.addProperty(ClassLabelConstants.RequiredTransactionID, transactionID);
			
			JsonObject descr = requiredtransaction.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
			String titleString = descr.get(ClassLabelConstants.ShortDescription).getAsString();
			String typeString = descr.get(ClassLabelConstants.TransactionEventType).getAsString();
			infoJsonObject.addProperty(ClassLabelConstants.RequiredTransactionType, typeString);
			infoJsonObject.addProperty(ClassLabelConstants.DescriptionTitleRequiredTransaction, titleString);
			
			infoJsonObject.addProperty(ClassLabelConstants.RequiredTransactionKey, transactionkey);
			
			requiredinfoArray.add(infoJsonObject);
		}
	}



	/**
	 * @param json The TransactionEventWithPrerequisites object from the post
	 * @return the transaction event
	 * 
	 *         The object should have
	 *         <ul>
	 *         <li>Transaction (dataset:transaction) String
	 *         <li>Prerequisite IDs (dataset:requiredtransitionid) JsonArray
	 *         <li>ActivityInfo (dataset:activityinfo) JsonObject
	 *         <ul>
	 * 
	 *         Prerequisites that are subclasses of DatabaseTransactionEvent can be
	 *         filled in from the activity info.
	 */
	public static JsonObject processFromTransaction(JsonObject json, String owner) {
		String transaction = json.get(ClassLabelConstants.TransactionEventType).getAsString();
		// Dataset transaction events (subclass of DatabaseTransactionEvent), then can
		// be filled in automatically
		JsonArray prerequisitelist = fillInDatasetPrerequisites(transaction, json);
		JsonObject prerequisites = getPrerequisiteObjects(json);
		JsonObject info = json.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
		return processFromTransaction(transaction, prerequisites, prerequisitelist, info, owner);
	}

	/**
	 * Insert prerequisite transaction firestoreid into activity info
	 * 
	 * @param json            The activity info
	 * @param transactionname The name of prerequisite transaction
	 * @param criteria        The limiting criteria (the transaction key in
	 *                        ShortTransactionDescription)
	 * @param limittoone      If true, then only one transacation meeting the
	 *                        transactionname and criteria is allowed.
	 * @return true if successful
	 * 
	 *         This is primarily used for testing purposes, to find an appropriate
	 *         prerequisite transaction. This is why just the first transaction
	 *         found is taken.
	 * 
	 *         If DatabaseIDFromRequiredTransaction does not exist in the json, then
	 *         one is created.
	 * 
	 *         If limittoone is true, then only one is allowed (might be useful in
	 *         real cases).
	 * 
	 */
	public static boolean setFirstTransactionIntoActivityInfo(JsonObject json, String transactionname, String criteria,
			boolean limittoone) {
		boolean success = true;
		JsonObject transresponse = FindTransactions.findLabelFirestoreIDPairByType(transactionname, criteria);
		if (transresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonArray labelids = transresponse.get(ClassLabelConstants.LabelFirestoreIDPair).getAsJsonArray();
			if (labelids.size() > 0) {
				boolean go = true;
				if (limittoone) {
					go = labelids.size() == 1;
				}
				if (go) {
					JsonObject first = labelids.get(0).getAsJsonObject();
					JsonObject firestorid = first.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
					JsonObject prerequisites = new JsonObject();
					if (json.get(ClassLabelConstants.DatabaseIDFromRequiredTransaction) != null) {
						prerequisites = json.get(ClassLabelConstants.DatabaseIDFromRequiredTransaction)
								.getAsJsonObject();
					} else {
						json.add(ClassLabelConstants.DatabaseIDFromRequiredTransaction, prerequisites);
					}
					String preid = DatasetOntologyParseBase.getIDFromAnnotation(transactionname);
					prerequisites.add(preid, firestorid);
				} else {
					System.err.println("More than one prerequisite Transactions found: \n"
							+ JsonObjectUtilities.toString(labelids));
					success = false;
				}
			} else {
				System.err.println("Prerequisite Transaction not found meeting criteria: " + criteria);
				success = false;
			}
		} else {
			System.err.println("Prerequisite Transaction not found: " + transactionname);
			success = false;
		}
		return success;
	}

	/**
	 * @param eventtype the transaction event name
	 * @param json      The TransactionProcess input
	 * 
	 *                  If can be found using the standard information in the
	 *                  activity info and If a single prerequisite is found, then it
	 *                  is added to the prerequisites (or if onlyone is false, then
	 *                  the first one is returned).
	 * 
	 *                  If the set of prerequisites is not in the input, an empty
	 *                  prerequisite object i is put there and that is filled in.
	 * 
	 *                  If the label for the event type is present in the
	 *                  prerequisites, then it is not changed.
	 * 
	 *                  the working routine for this is
	 *                  FindTransactions.findDatasetTransaction. If this returns a
	 *                  non-null transaction, then the FirebaseCatalogID is entered
	 *                  in the prerequisites. Otherwise, nothing is fill in.
	 * 
	 * 
	 */
	public static JsonArray fillInDatasetPrerequisites(String eventtype, JsonObject json) {
		// Get Activity info of the input
		JsonObject info = json.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
		// Get prequisites, if not there, create prerequisites object
		JsonObject prerequisites = null;
		if (json.get(ClassLabelConstants.DatabaseIDFromRequiredTransaction) == null) {
			prerequisites = new JsonObject();
			json.add(ClassLabelConstants.DatabaseIDFromRequiredTransaction, prerequisites);
		} else {
			prerequisites = json.get(ClassLabelConstants.DatabaseIDFromRequiredTransaction).getAsJsonObject();
		}
		// From the event, find the prerequisite transactions
		List<String> prerequisitenames = OntologyUtilityRoutines.exactlyOnePropertyMultiple(eventtype,
				OntologyObjectLabels.requires);
		// Loop through each prerequisite
		JsonArray prerequisitelist = new JsonArray();
		for (String name : prerequisitenames) {
			String label = DatasetOntologyParseBase.getIDFromAnnotation(name);
			String idlabel = label;
			if (prerequisites.get(idlabel) == null) {
				if (prerequisites.get(name) != null) {
					idlabel = name;
				}
			}
			// If the prerequisite has not been filled in yet, find it and add it in.
			if (prerequisites.get(label) == null) {
				JsonObject transaction = FindTransactions.findDatasetTransaction(info, name, true);
				if (transaction != null) {
					JsonObject firebaseid = transaction.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
					prerequisitelist.add(firebaseid);
					prerequisites.add(label, firebaseid);
				} else {
					System.err.println("No transaction found");
				}
			} else {
				if (idlabel == name) {
					JsonObject prerequisite = prerequisites.get(name).getAsJsonObject();
					prerequisites.add(label, prerequisite);
					prerequisites.remove(name);
				}
			}
		}
		return prerequisitelist;
	}

}
