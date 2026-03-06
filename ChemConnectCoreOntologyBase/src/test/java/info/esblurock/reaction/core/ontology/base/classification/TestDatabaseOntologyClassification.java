package info.esblurock.reaction.core.ontology.base.classification;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestDatabaseOntologyClassification {

	@Test
	public void testHierarchy() {
		System.out.println("------------------------------------------");
		String classname = "dataset:CollectionDocumentHierarchy";
		System.out.println(classname);
		ClassificationHierarchy hierarchy = DatabaseOntologyClassification.getClassificationHierarchy(classname);
		JsonObject obj = hierarchy.toJsonObject();
		System.out.println(JsonObjectUtilities.toString(obj));
		System.out.println("------------------------------------------");
	}
	@Test
	public void testClassificationTree() {
		System.out.println("------------------------------------------");
		String classname = "dataset:CollectionDocumentHierarchy";
		System.out.println("From choices: " + classname);
		JsonObject tree = DatabaseOntologyClassification.classificationTreeFromChoices(classname);
		System.out.println(JsonObjectUtilities.toString(tree));
		System.out.println("------------------------------------------");
		String datatype = "dataset:CollectionDocumentHierarchyType";
		System.out.println("From datatype: " + datatype);
		JsonObject tree2 = DatabaseOntologyClassification.classificationTreeFromDataType(datatype);
		System.out.println(JsonObjectUtilities.toString(tree2));
		System.out.println("------------------------------------------");
		
	}

}
