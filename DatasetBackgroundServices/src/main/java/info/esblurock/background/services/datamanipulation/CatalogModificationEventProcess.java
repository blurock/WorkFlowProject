package info.esblurock.background.services.datamanipulation;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.WriteFirestoreCatalogObject;
import info.esblurock.reaction.core.MessageConstructor;
import info.esblurock.reaction.core.StandardResponse;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class CatalogModificationEventProcess {
	
	/**
	 * @param event
	 * @param info ActivityModifyAndWriteCatalogObject
	 * @return
	 * 
	 * 
	 * computes CatalogObjectModification for difference of the original and new catalog object.
	 */
	public static JsonObject process(JsonObject event, JsonObject info) {
		JsonObject response = null;
		JsonObject catalog = info.get(ClassLabelConstants.ModifiedCatalogObject).getAsJsonObject();
		JsonObject activity = event.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
		
		JsonObject eventfire = event.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		catalog.add(ClassLabelConstants.FirestoreCatalogIDForTransaction, eventfire);
		activity.remove(ClassLabelConstants.ModifiedCatalogObject);
		String message = WriteFirestoreCatalogObject.writeCatalogObject(catalog);
		if (message.startsWith("ERROR")) {
			Document errdoc = MessageConstructor.startDocument("Error: CatalogModificationEvent");
			MessageConstructor.combineBodyIntoDocument(errdoc,
					message);
			response = StandardResponse.standardErrorResponse(errdoc,
					"Error: Error in writing updated object\n" + message, null);
			
		} else {
			Document doc = MessageConstructor.startDocument("Error: CatalogModificationEvent");
			Element body = MessageConstructor.isolateBody(doc);
			JsonArray jsonarray = info.get(ClassLabelConstants.JsonDifferences).getAsJsonArray();
			String json = JsonObjectUtilities.toString(jsonarray);
			body.addElement("pre").addText(json);
			String name = catalog.get(ClassLabelConstants.CatalogObjectKey).getAsString();
			message = "New Object Updated: " + name;
			JsonArray array = new JsonArray();
			array.add(catalog);
			response = StandardResponse.standardServiceResponse(doc, message, array);
		}
		
		return response;
	}

}
