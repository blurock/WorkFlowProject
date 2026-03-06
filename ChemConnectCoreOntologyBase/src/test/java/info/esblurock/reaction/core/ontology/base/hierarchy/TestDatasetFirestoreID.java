package info.esblurock.reaction.core.ontology.base.hierarchy;


import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestDatasetFirestoreID {

	@Test
	public void test() {
		String classname = "dataset:JThermodynamicsMetaAtomDefinitionClass";
		String id = "dataset:metaatomdefinition";
		String owner = "blurock";
		String transactionID = "xxxxxx";
		String publicB = "true";
		JsonObject json = BaseCatalogData.createStandardDatabaseObject(classname, owner, transactionID, publicB);
		
		String recordid = ClassLabelConstants.DatasetSpecificationForCollectionSet;
		System.out.println("insertStandardBaseInformation: " + recordid);
		System.out.println("insertStandardBaseInformation: " + JsonObjectUtilities.toString(json));
		JsonObject rec = json.get(recordid).getAsJsonObject();
		rec.addProperty(ClassLabelConstants.CatalogDataObjectStatus, "DatasetStatus");
		rec.addProperty(ClassLabelConstants.DatasetVersion, "version");
		rec.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, "Unique");
		rec.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, "Maintainer");
		
		
		JsonObject address = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(json);
		
		
		System.out.println(JsonObjectUtilities.toString(address));
		
		
	}

}
