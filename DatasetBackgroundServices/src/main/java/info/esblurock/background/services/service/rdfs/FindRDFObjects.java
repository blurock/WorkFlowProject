package info.esblurock.background.services.service.rdfs;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;

public class FindRDFObjects {

	/**
	 * @param rdftype   The RDF predicate (corresponding to class which generated
	 *                  the RDF)
	 * @param attribute The (primitive component) attribute of the subject
	 * @return The response of the database read
	 * 
	 *         The database read with two conditions:
	 *         <ul>
	 *         RDFPredicate: The type
	 *         <li>RDFSubjectKey: The attribute value
	 *         <ul>
	 * 
	 */
	public static JsonObject findRDFFromTypeAndSubjectAttribute(String rdftype, String attribute) {
		JsonObject json = CreateDocumentTemplate.createTemplate("dataset:RDFSubjectPrimitiveObjectRecord");
		JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(json);
		JsonObject setofprops = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		JsonArray props = new JsonArray();
		JsonObject prop1 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		prop1.addProperty(ClassLabelConstants.DatabaseObjectType, ClassLabelConstants.RDFPredicate);
		prop1.addProperty(ClassLabelConstants.ShortStringKey, rdftype);
		JsonObject prop2 = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		prop2.addProperty(ClassLabelConstants.DatabaseObjectType, ClassLabelConstants.RDFSubjectKey);
		prop2.addProperty(ClassLabelConstants.ShortStringKey, attribute);
		props.add(prop2);
		setofprops.add(ClassLabelConstants.PropertyValueQueryPair, props);
		JsonObject response = ReadFirestoreInformation.readFirestoreCollection(setofprops, firestoreid);
		return response;
	}

}
