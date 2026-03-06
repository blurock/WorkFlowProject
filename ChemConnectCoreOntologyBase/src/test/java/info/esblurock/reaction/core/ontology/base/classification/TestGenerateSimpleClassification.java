package info.esblurock.reaction.core.ontology.base.classification;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestGenerateSimpleClassification {

	@Test
	public void test() {
		System.out.println("-------------------------------------");
		String classification = "dataset:UserTitleChoices";
		JsonObject obj = GenerateSimpleClassification.generateSimpleListFromChoices(classification);
		System.out.println(JsonObjectUtilities.toString(obj));
		System.out.println("-------------------------------------");
		String classification2 = "dataset:PersonClassification";
		JsonObject obj2 = GenerateSimpleClassification.generateSimpleListFromChoices(classification2);
		System.out.println(JsonObjectUtilities.toString(obj2));
		System.out.println("-------------------------------------");
		String classification3 = "dataset:UserClassification";
		JsonObject obj3 = GenerateSimpleClassification.generateSimpleListFromDataType(classification3);
		System.out.println(JsonObjectUtilities.toString(obj3));
	}

}
