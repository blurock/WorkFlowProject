package info.esblurock.reaction.core.ontology.base.hierarchy;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestSearchForCatalogObjectInHierarchyTemplate {

	@Test
	public void test() {
		System.out.println("---------------------------------------");
		System.out.println("TestSearchForCatalogObjectInHierarchyTemplate: DatabasePerson");
		System.out.println("---------------------------------------");
		JsonObject obj = CreateDocumentTemplate.createTemplate("dataset:DatabasePerson");
		obj.addProperty(ClassLabelConstants.CatalogObjectKey, "lalalalalalalalalalalala");
		JsonObject pairs = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(obj);
		System.out.println("------------ dataset:DatabasePerson -------------");
		System.out.println(JsonObjectUtilities.toString(pairs));
	}
	
	@Test
	public void testRDF() {
		System.out.println("---------------------------------------");
		System.out.println("TestSearchForCatalogObjectInHierarchyTemplate: RDFSubjectPrimitiveObjectRecord");
		System.out.println("---------------------------------------");
		JsonObject obj = CreateDocumentTemplate.createTemplate("dataset:RDFSubjectPrimitiveObjectRecord");
		obj.addProperty(ClassLabelConstants.CatalogObjectKey, "lalalalalalalalalalalala");
		System.out.println("---------------------------------------");
		System.out.println(JsonObjectUtilities.toString(obj));
		JsonObject pairs = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(obj);
		System.out.println("------------ dataset:RDFSubjectPrimitiveObjectRecord -------------");
		System.out.println(JsonObjectUtilities.toString(pairs));
		System.out.println("---------------------------------------");
		
		
	}

}
