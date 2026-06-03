package info.esblurock.background.services.servicecollection;

import org.dom4j.Document;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.datasetobjects.ReadInDatasetObjectCollectionProcess;
import info.esblurock.background.services.datasetobjects.TransferDatasetObjectCollectionToDatabaseProcess;
import info.esblurock.background.services.transaction.FindTransactions;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;

public enum ServiceCollectionDatasetObjectsManipulation {

	ReadInDatasetObjectCollection {

		@Override
		public JsonObject process(JsonObject info) {
			return ReadInDatasetObjectCollectionProcess.process(info);
		}

	},
	FindDatasetTransaction {

		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("FindDatasetTransaction");
			JsonObject response = null;
			try {
				/*
				 * JsonObject info = json;
				 * if (json.has(ClassLabelConstants.ActivityInformationRecord)
				 * && json.get(ClassLabelConstants.ActivityInformationRecord).isJsonObject()) {
				 * info = json.getAsJsonObject(ClassLabelConstants.ActivityInformationRecord);
				 * } else if (json.has("info") && json.get("info").isJsonObject()) {
				 * info = json.getAsJsonObject("info");
				 * }
				 */
				String type = null;
				if (json.has(ClassLabelConstants.TransactionEventType)) {
					type = json.get(ClassLabelConstants.TransactionEventType).getAsString();
				} else if (json.has("type")) {
					type = json.get("type").getAsString();
				}

				boolean onlyone = false;
				if (json.has(ClassLabelConstants.AllowOnlyOne)) {
					onlyone = json.get(ClassLabelConstants.AllowOnlyOne).getAsBoolean();
				} else if (json.has("onlyone")) {
					onlyone = json.get("onlyone").getAsBoolean();
				}

				if (type == null) {
					return StandardResponse.standardErrorResponse(document,
							"Missing transaction event type parameter (type)", null);
				}

				JsonObject transaction = FindTransactions.findDatasetTransaction(json, type, onlyone);

				if (transaction != null) {
					JsonArray arr = new JsonArray();
					arr.add(transaction);
					response = StandardResponse.standardServiceResponse(document, "Success: FindDatasetTransaction",
							arr);
				} else {
					response = StandardResponse.standardErrorResponse(document,
							"No transaction found for type: " + type, null);
				}
			} catch (Exception ex) {
				ex.printStackTrace();
				response = StandardResponse.standardErrorResponse(document,
						"Error in FindDatasetTransaction: " + ex.toString(), null);
			}
			return response;
		}

	};

	public abstract JsonObject process(JsonObject info);
}
