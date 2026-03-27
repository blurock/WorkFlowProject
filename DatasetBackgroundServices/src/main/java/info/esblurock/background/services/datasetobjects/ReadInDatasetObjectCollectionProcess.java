package info.esblurock.background.services.datasetobjects;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class ReadInDatasetObjectCollectionProcess {
	
	/**
	 * @param info 
	 * @return
	 */
	public static JsonObject process(JsonObject info) {
		
		JsonObject datasetid = info.get(ClassLabelConstants.SpecificationForDataset).getAsJsonObject();
		String classname = datasetid.get(ClassLabelConstants.DatasetObjectType).getAsString();
        JsonObject empty = CreateDocumentTemplate.createTemplate(classname);
		empty.add(ClassLabelConstants.SpecificationForDataset, datasetid);
        JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(empty);
        JsonObject response = ReadFirestoreInformation.readFirestoreCollection(null, firestoreid);
		return response;
	}

}
