package info.esblurock.background.services.servicecollection;

import org.dom4j.Document;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;

public enum ServiceCollectionSessionData {

	ReadSessionDataService {
		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("ReadSessionDataService");
			JsonObject fullResponse = info.esblurock.background.services.firestore.session.SessionDataManagement
					.readSessionData(json);

			// Extract the catalog from the standard response wrapper
			JsonObject catalog = fullResponse.getAsJsonObject(ClassLabelConstants.SimpleCatalogObject);
			if (catalog != null) {
				JsonArray arr = new JsonArray();
				arr.add(catalog);
				return StandardResponse.standardServiceResponse(document, "Success: ReadSessionDataService", arr);
			} else {
				return StandardResponse.standardErrorResponse(document, "Failed to read Session Data", null);
			}
		}
	},
	UpdateSessionDataService {
		@Override
		public JsonObject process(JsonObject json) {
			Document document = MessageConstructor.startDocument("UpdateSessionDataService");
			String message = info.esblurock.background.services.firestore.session.SessionDataManagement
					.updateSessionData(json);
			// System.out.println("UpdateSessionDataService: message=" + message);
			// MessageConstructor.combineBodyIntoDocument(document, message);

			JsonArray arr = new JsonArray();
			arr.add(json);
			JsonObject response = StandardResponse.standardServiceResponse(document,
					message, arr);
			return response;
		}
	};

	public abstract JsonObject process(JsonObject json);
}
