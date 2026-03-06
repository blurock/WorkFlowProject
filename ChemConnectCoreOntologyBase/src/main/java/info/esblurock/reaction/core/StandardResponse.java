package info.esblurock.reaction.core;

import org.dom4j.Document;
import org.dom4j.Element;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;

public class StandardResponse {

	/**
	 * Standard successful service response
	 * 
	 * @param service The name of the service
	 * @param result  the JsonObject result of the service
	 * @return a full service response with ServiceProcessSuccessful and
	 *         ServiceResponseMessage added
	 * 
	 * 
	 *         public static JsonObject standardServiceResponse(Document document,
	 *         String message, JsonArray result) { Element body =
	 *         MessageConstructor.isolateBody(document);
	 *         body.addElement("h3").addText(message); JsonObject response = new
	 *         JsonObject();
	 *         response.addProperty(ClassLabelConstants.ServiceProcessSuccessful,
	 *         "true");
	 *         response.addProperty(ClassLabelConstants.ServiceResponseMessage,
	 *         MessageConstructor.DocumentToString(document));
	 *         response.add(ClassLabelConstants.SimpleCatalogObject, result); return
	 *         response; }
	 */
	/**
	 * Standard successful service response
	 * 
	 * @param service The name of the service
	 * @param result  the JsonObject result of the service
	 * @return a full service response with ServiceProcessSuccessful and
	 *         ServiceResponseMessage added
	 * 
	 */
	public static JsonObject standardServiceResponse(Document document, String message, JsonElement result) {
		Element body = MessageConstructor.isolateBody(document);
		body.addElement("div").addText(message);
		JsonObject response = new JsonObject();
		response.addProperty(ClassLabelConstants.ServiceProcessSuccessful, "true");
		response.addProperty(ClassLabelConstants.ServiceResponseMessage, MessageConstructor.DocumentToString(document));
		response.add(ClassLabelConstants.SimpleCatalogObject, result);
		return response;
	}

	public static JsonObject standardErrorResponse(Document document, JsonObject errresponse, JsonElement result) {
		JsonObject response = new JsonObject();
		response.addProperty(ClassLabelConstants.ServiceProcessSuccessful, "false");
		String rdfmessage = errresponse.get(ClassLabelConstants.ServiceResponseMessage).getAsString();
		MessageConstructor.combineBodyIntoDocument(document, rdfmessage);
	
		response.addProperty(ClassLabelConstants.ServiceResponseMessage, MessageConstructor.DocumentToString(document));
		response.add(ClassLabelConstants.SimpleCatalogObject, result);
		return response;
	}

	public static JsonObject standardErrorResponse(Document document, String errresponse, JsonElement result) {
		JsonObject response = new JsonObject();
		response.addProperty(ClassLabelConstants.ServiceProcessSuccessful, "false");
		Element body = MessageConstructor.isolateBody(document);
		body.addElement("div").addText(errresponse);
		response.addProperty(ClassLabelConstants.ServiceResponseMessage, MessageConstructor.DocumentToString(document));
		response.add(ClassLabelConstants.SimpleCatalogObject, result);
		return response;
	}

}
