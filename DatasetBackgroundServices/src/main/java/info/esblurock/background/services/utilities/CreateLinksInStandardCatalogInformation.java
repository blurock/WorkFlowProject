package info.esblurock.background.services.utilities;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;

public class CreateLinksInStandardCatalogInformation {

	/**
	 * Transfer ObjectSiteReference, DataObjectLink and DataSetReference objects
	 * from source to destination
	 * 
	 * 
	 * @param source             The source object
	 * @param destinationCatalog The destination catalog object
	 * 
	 *                           All the ObjectSiteReference, DataObjectLink and
	 *                           DataSetReference objects are transferred from
	 *                           source catalog object to destination the
	 *                           destination catalog object. The destination catalog
	 *                           object is modified directly, there is no return
	 *                           object.
	 * 
	 */
	public static void transfer(JsonObject source, JsonObject destinationCatalog) {
		transferType(ClassLabelConstants.BibliographicReferenceLink, source, destinationCatalog);
		//transferType(ClassLabelConstants.DataObjectLink, source, destinationCatalog);
		transferType(ClassLabelConstants.ObjectSiteReference, source, destinationCatalog);
	}

	/**
	 * @param type               The type identifier, used to isolate list from
	 *                           catalog object
	 * @param sourceCatalog      The source catalog object
	 * @param destinationCatalog The destination catalog object
	 * 
	 *                           This is basically the help routine of the transfer
	 *                           procedure.
	 */
	protected static void transferType(String type, JsonObject sourceCatalog, JsonObject destinationCatalog) {
		if (sourceCatalog.get(type) != null) {
			JsonArray arr = sourceCatalog.get(type).getAsJsonArray();
			JsonArray destination = null;
			if (destinationCatalog.get(type) == null) {
				destination = new JsonArray();
				destinationCatalog.add(type, destination);
			} else {
				destination = destinationCatalog.get(type).getAsJsonArray();
				for (int i = 0; i < arr.size(); i++) {
					destination.add(arr.get(i));
				}
			}
		}
	}

	/**
	 * Add a DataObjectLink for each prerequisite transaction
	 * 
	 * @param catalog       The catalog object to add the DataObjectLink
	 * @param prerequisites The prerequisite transactions.
	 * 
	 *                      This adds a DataObjectLink to each prerequisite
	 *                      transaction catalog object The FirestoreCatalogID is
	 *                      given as the link of type
	 *                      dataset:ConceptLinkPrerequisiteTransaction
	 */
	public static void addPrerequisitesToDataObjectLink(JsonObject catalog, JsonObject prerequisites) {
		JsonArray links = catalog.get(ClassLabelConstants.DataObjectLink).getAsJsonArray();
		Type type = new TypeToken<HashMap<String, Object>>() {
		}.getType();
		Map<String, Object> mapObj = new Gson().fromJson(prerequisites, type);
		Set<String> keys = mapObj.keySet();
		for (String key : keys) {
			JsonObject trans = prerequisites.get(key).getAsJsonObject();
			JsonObject firestore = trans.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();

			JsonObject link = new JsonObject();
			link.addProperty(ClassLabelConstants.DatabaseObjectTypeLink, "dataset:TransactionEvent");
			link.addProperty(ClassLabelConstants.DataTypeConcept, "dataset:ConceptLinkPrerequisiteTransaction");
			link.add(ClassLabelConstants.RelatedCatalogObjectIDAndType, firestore);

			links.add(link);

		}
	}

	/**
	 * Add a DataObjectLink to the destination catalog object linking the source
	 * catalog object
	 * 
	 * @param source          The source catalog object to link to
	 * @param datatypeconcept The concept describing how the source is connected
	 * @param destination     The catalog object where the link is added
	 * 
	 * 
	 */
	public static void linkCatalogObjects(JsonObject source, String datatypeconcept, JsonObject destination) {
		String identifier = source.get(AnnotationObjectsLabels.identifier).getAsString();
		String classname = GenericSimpleQueries.classFromIdentifier(identifier);
		JsonObject firestore = source.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();

		JsonObject link = new JsonObject();
		link.addProperty(ClassLabelConstants.DatabaseObjectTypeLink, classname);
		link.addProperty(ClassLabelConstants.DataTypeConcept, datatypeconcept);
		link.add(ClassLabelConstants.RelatedCatalogObjectIDAndType, firestore);

		JsonArray links = destination.get(ClassLabelConstants.DataObjectLink).getAsJsonArray();
		links.add(link);
	}

	/**
	 * DataObjectLink linking both catalog object to each other
	 * 
	 * @param catalog1        A catalog object to link
	 * @param datatypeconcept The concept describing how the source is connected
	 * @param catalog2        Another catalog object to link
	 */
	public static void bidirectionCatalogObjectLink(JsonObject catalog1, String datatypeconcept, JsonObject catalog2) {
		linkCatalogObjects(catalog1, datatypeconcept, catalog2);
		linkCatalogObjects(catalog2, datatypeconcept, catalog1);
	}

}
