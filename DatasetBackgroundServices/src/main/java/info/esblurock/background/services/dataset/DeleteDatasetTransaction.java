package info.esblurock.background.services.dataset;

import org.dom4j.Document;

import com.google.gson.JsonObject;

import info.esblurock.background.services.transaction.DeleteTransaction;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;

public class DeleteDatasetTransaction {

	public static JsonObject deleteTransactionPath(JsonObject specificationfordataset, 
			boolean read, boolean parse, boolean interpret) {
		JsonObject response = null;
		Document document = MessageConstructor.startDocument("Delete Dataset Transactions: " + "read(" + read
				+ ") parse(" + parse + ") interpret(" + interpret + ")");

		JsonObject transaction = new JsonObject();
		transaction.add(ClassLabelConstants.SpecificationForDataset, specificationfordataset);

		boolean noerror = true;

		if (interpret) {
			transaction.addProperty(ClassLabelConstants.TransactionEventType, "dataset:TransactionInterpretTextBlock");
			JsonObject iresponse = DeleteTransaction.deleteDatasetTransaction(transaction);
			String message = iresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
			MessageConstructor.combineBodyIntoDocument(document, message);
			if (!iresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
				noerror = false;
			}
		}

		if (parse && noerror) {
			transaction.addProperty(ClassLabelConstants.TransactionEventType,
					"dataset:PartiionSetWithinRepositoryFile");
			JsonObject presponse = DeleteTransaction.deleteDatasetTransaction(transaction);
			String message = presponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
			MessageConstructor.combineBodyIntoDocument(document, message);
			if (!presponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
				noerror = false;
			}
		}

		if (read && noerror) {
			transaction.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitialReadInOfRepositoryFile");
			JsonObject rresponse = DeleteTransaction.deleteDatasetTransaction(transaction);
			String message = rresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
			MessageConstructor.combineBodyIntoDocument(document, message);
			if (!rresponse.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
				noerror = false;
			}
		}
		if (noerror) {
			response = StandardResponse.standardServiceResponse(document, "Successfully deleted", null);
		} else {
			response = StandardResponse.standardErrorResponse(document, "Deletion Not Successful", null);
		}

		return response;
	}

}
