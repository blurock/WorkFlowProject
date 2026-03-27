package info.esblurock.background.services.transaction;

import java.util.concurrent.ExecutionException;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.cloud.firestore.DocumentReference;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import esblurock.info.neo4j.rdf.RDFDelete;
import info.esblurock.background.services.firestore.DeleteCatalogDataObject;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.background.services.firestore.SetUpDocumentReference;
import info.esblurock.background.services.service.rdfs.DeleteRDFs;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class DeleteTransaction extends DeleteCatalogDataObject {

	/** deleteTransactionwithID
	 * 
	 * @param firestoreid The firestoreID of the transaction to delete.
	 * @return Response
	 * 
	 * Once the transaction is read in, DeleteTransaction.deleteTransaction is called.
	 * 
	 */
	public static JsonObject deleteTransactionwithID(JsonObject firestoreid) {
		JsonObject deleteresponse = null;
		JsonObject response = ReadFirestoreInformation.readFirestoreCatalogObject(firestoreid);
		if (response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
			JsonObject object = response.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonObject();
			deleteresponse = DeleteTransaction.deleteTransaction(object);
		} else {
			deleteresponse = response;
		}
		return deleteresponse;
	}
	
	/**
	 * @param info Info with TransactionEventType and DatasetCollectionSetRecordIDInfo
	 * @return The response for the deleted transaction
	 * 
	 * This finds the dataset transaction (using FindTransactions.findDatasetTransaction)
	 * and then deletes it and the associated transaction objects (using deleteTransaction in this class)
	 * 
	 */
	public static JsonObject deleteDatasetTransaction(JsonObject info) {
		String transactiontype = info.get(ClassLabelConstants.TransactionEventType).getAsString();
		JsonObject transaction = FindTransactions.findDatasetTransaction(info,transactiontype, true);
		JsonObject response = deleteTransaction(transaction);
		return response;
	}

	/**
	 * @param transaction The transaction JsonObject
	 * 
	 *                    This deletes the catalog objects listed in the
	 *                    transaction, the RDFs (using the TransactionID) that were
	 *                    created and the transactions
	 * @throws ExecutionException 
	 * @throws InterruptedException 
	 */
	public static JsonObject deleteTransaction(JsonObject transaction) {
	    String idS = transaction.get(ClassLabelConstants.CatalogObjectKey).getAsString();
		Document document = MessageConstructor.startDocument("Transaction: " + idS);
		Element body = MessageConstructor.isolateBody(document);
		DeleteCatalogDataObject.getFirestoreID();
		int deleted = 0;
		JsonArray arr = transaction.get(ClassLabelConstants.DatabaseObjectIDOutputTransaction).getAsJsonArray();
		JsonObject shortdescr = transaction.get(ClassLabelConstants.ShortTransactionDescription).getAsJsonObject();
		String transactionname = shortdescr.get(ClassLabelConstants.TransactionEventType).getAsString();
		String transname = transactionname.substring(8);
		
		String catalogtype = OntologyUtilityRoutines.exactlyOnePropertySingle(transactionname, "dcat:catalog");
		
		body.addElement("div").addText("Delete transaction: " + transname + " (" + arr.size() + " " + catalogtype + " objects)");
		DeleteTransactionCatalogObjects deleteprocess = null;
		try {
		deleteprocess = DeleteTransactionCatalogObjects.valueOf(transname);
		} catch(IllegalArgumentException ex) {
			body.addElement("div").addText("Just delete catalog objects");
		}
		for (int i = 0; i < arr.size(); i++) {
			JsonObject firestoreid = arr.get(i).getAsJsonObject();
			DocumentReference docref = SetUpDocumentReference.setup(db, firestoreid);
			if(deleteprocess != null) {
				try {
					deleteprocess.delete(transaction,firestoreid,docref,body);
				} catch (InterruptedException | ExecutionException e) {
					body.addElement("div").addText("Error in reading " + i + "th element");
				}
			}
			docref.delete();
			deleted++;
			body.addElement("div").addText("Delete Element: " + firestoreid.get(ClassLabelConstants.SimpleCatalogName).getAsString());
		}
		String message1 = "Deleted objects: " + Integer.toString(deleted);
		body.addElement("div").addText(message1);
		String transactionid = transaction.get(ClassLabelConstants.TransactionID).getAsString();
		
		JsonObject deleteresponseJsonObject = RDFDelete.deleteRDFsWithTransactionID(transactionid);
		MessageConstructor.combineBodyIntoDocument(document, deleteresponseJsonObject.get(ClassLabelConstants.ServiceResponseMessage).getAsString());

		JsonObject transid = transaction.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		DocumentReference docref = SetUpDocumentReference.setup(db, transid);
		docref.delete();
		body.addElement("div").addText("Deleted Transaction");

		deleted++;

		String totalmessage = "Total number of deleted items: " + Integer.toString(deleted);
		JsonObject response = StandardResponse.standardServiceResponse(document, totalmessage, null);

		return response;
	}
}
