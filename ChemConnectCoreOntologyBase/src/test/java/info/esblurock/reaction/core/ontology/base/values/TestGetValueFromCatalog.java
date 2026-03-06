package info.esblurock.reaction.core.ontology.base.values;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestGetValueFromCatalog {

	@Test
	public void test() {
		System.out.println("---------------------------------------");
		System.out.println("TestGetValueFromCatalog");
		System.out.println("---------------------------------------");
		String jsonS = "{\n"
				+ "  \"postal-code\": \"92651\",\n"
				+ "  \"vcard:locality\": \"Laguna\",\n"
				+ "  \"vcard:street-address\": \"1600 Sunset Ridge\",\n"
				+ "  \"vcard:country-name\": \"USA\",\n"
				+ "  \"vcard:postal-code\": \"92651\",\n"
				+ "  \"geo:location\": {\n"
				+ "    \"geo:lat\": \"latitude\",\n"
				+ "    \"geo:long\": \"not assigned\"\n"
				+ "  }\n"
				+ "}";
		
		JsonObject obj = JsonObjectUtilities.jsonObjectFromString(jsonS);
		System.out.println("---------------------------------------");
		System.out.println("vcard:postal-code");
		JsonArray arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj,"vcard:postal-code");
		System.out.println(arr.toString());
		System.out.println(JsonObjectUtilities.toString(arr));
		System.out.println("---------------------------------------");
		System.out.println("geo:lat");
		arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj,"geo:lat");
		System.out.println(arr.toString());
		System.out.println(JsonObjectUtilities.toString(arr));
		System.out.println("---------------------------------------");
		
	}
	@Test
	public void testSimpleMultiple() {
		String jsonS = "{\n"
				+ " \"vcard:towns\": [\"laguna\", \"Newport\",\"CostaMesa\"]\n"
				+ "}";
		System.out.println(jsonS);
		System.out.println("---------------------------------------");
		JsonObject obj = JsonObjectUtilities.jsonObjectFromString(jsonS);
		System.out.println("vcard:towns");
		JsonArray arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj,"vcard:towns");
		System.out.println(arr.toString());
		System.out.println(JsonObjectUtilities.toString(arr));
		
	}
	@Test
	public void testmultiple() {
		String jsonS = "{\"places\":\n"
				+ " [\n"
				+ "{\n"
				+ "  \"vcard:locality\": \"laguna\",\n"
				+ "  \"vcard:street-address\": \"1600 Sunset Ridge\",\n"
				+ "  \"vcard:country-name\": \"USA\",\n"
				+ "  \"vcard:postal-code\": \"92651c\",\n"
				+ "  \"geo:location\": {\n"
				+ "    \"geo:lat\": \"lat1\",\n"
				+ "    \"geo:long\": \"not assigned\"\n"
				+ "  }\n"
				+ "},\n"
				+ "{\n"
				+ "  \"vcard:locality\": \"Newport\",\n"
				+ "  \"vcard:street-address\": \"1600 Sunset Ridge\",\n"
				+ "  \"vcard:country-name\": \"USA\",\n"
				+ "  \"vcard:postal-code\": \"92651b\",\n"
				+ "  \"geo:location\": {\n"
				+ "    \"geo:lat\": \"lat4\",\n"
				+ "    \"geo:long\": \"not assigned\"\n"
				+ "  }\n"
				+ "},\n"
				+ "{\n"
				+ "  \"vcard:locality\": \"CostaMesa\",\n"
				+ "  \"vcard:street-address\": \"1600 Sunset Ridge\",\n"
				+ "  \"vcard:country-name\": \"USA\",\n"
				+ "  \"vcard:postal-code\": \"92651a\",\n"
				+ "  \"geo:location\": {\n"
				+ "    \"geo:lat\": \"lat3\",\n"
				+ "    \"geo:long\": \"not assigned\"\n"
				+ "  }\n"
				+ "}\n"
				+ "],\n"
				+ " \"vcard:towns\": [\"laguna\", \"Newport\",\"CostaMesa\"]\n"
				+ "}\n"
				+ "";
		System.out.println("---------------------------------------");
		System.out.println(jsonS);
		System.out.println("---------------------------------------");
		JsonObject obj = JsonObjectUtilities.jsonObjectFromString(jsonS);
		System.out.println("vcard:towns");
		JsonArray arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj,"vcard:towns");
		System.out.println(arr.toString());
		System.out.println(JsonObjectUtilities.toString(arr));
		obj = JsonObjectUtilities.jsonObjectFromString(jsonS);
		System.out.println("---------------------------------------");
		System.out.println("vcard:postal-code");
		arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj,"vcard:postal-code");
		System.out.println(arr.toString());
		System.out.println(JsonObjectUtilities.toString(arr));
		System.out.println("---------------------------------------");
		System.out.println("geo:lat");
		arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj,"geo:lat");
		System.out.println(arr.toString());
		System.out.println(JsonObjectUtilities.toString(arr));
		System.out.println("---------------------------------------");
		}

	@Test
	public void testCatalogObject() {
		System.out.println("---------------------------------------");
		System.out.println("TestGetValueFromCatalog dataset:DatabasePerson");
		System.out.println("---------------------------------------");
		JsonObject obj = CreateDocumentTemplate.createTemplate("dataset:DatabasePerson");
		System.out.println(JsonObjectUtilities.toString(obj));
		System.out.println("---------------------------------------");
		System.out.println("qb:concept");
		JsonArray arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj,"qb:concept");
		System.out.println(arr.toString());
		System.out.println(JsonObjectUtilities.toString(arr));
		System.out.println("---------------------------------------");
		System.out.println("geo:lat");
		arr = JsonObjectUtilities.getValueUsingIdentifierMultiple(obj,"geo:lat");
		System.out.println(arr.toString());
		System.out.println(JsonObjectUtilities.toString(arr));
		System.out.println("---------------------------------------");
	}
}
