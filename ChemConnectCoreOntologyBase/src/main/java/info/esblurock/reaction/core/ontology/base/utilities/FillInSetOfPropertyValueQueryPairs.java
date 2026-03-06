package info.esblurock.reaction.core.ontology.base.utilities;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;

public class FillInSetOfPropertyValueQueryPairs {
	
	public static JsonObject createSetOfPropertyValueQueryPairs() {
		JsonObject set = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		return set;
	}
	
	public static JsonObject createSinglePropertySetOfPropertyValueQueryPairs(String propertyClass, String value) {
		JsonObject set = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		addProperty(set, propertyClass, value);
		return set;
	}
	
	public static JsonObject createSinglePropertySetOfPropertyValueQueryPairs(String propertyClass, JsonObject value) {
		JsonObject set = CreateDocumentTemplate.createTemplate("dataset:SetOfPropertyValueQueryPairs");
		addProperty(set, propertyClass, value);
		return set;
	}
	
	public static void addProperty(JsonObject set, String propertyClass, String value) {
		JsonObject property = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		property.addProperty(ClassLabelConstants.DatabaseObjectType, propertyClass);
		property.addProperty(ClassLabelConstants.ShortStringKey, value);
		JsonArray pairsArray = set.get(ClassLabelConstants.PropertyValueQueryPair).getAsJsonArray();
		pairsArray.add(property);
	}
	public static void addProperty(JsonObject set, String propertyClass, JsonObject value) {
		JsonObject property = CreateDocumentTemplate.createTemplate("dataset:PropertyValueQueryPair");
		property.addProperty(ClassLabelConstants.DatabaseObjectType, propertyClass);
		property.add(ClassLabelConstants.ShortStringKey, value);
		JsonArray pairsArray = set.get(ClassLabelConstants.PropertyValueQueryPair).getAsJsonArray();
		pairsArray.add(property);
	}

}
