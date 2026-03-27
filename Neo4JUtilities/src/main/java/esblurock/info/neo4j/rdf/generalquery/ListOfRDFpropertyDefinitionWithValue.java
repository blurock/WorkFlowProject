package esblurock.info.neo4j.rdf.generalquery;

import java.util.Map;
import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class ListOfRDFpropertyDefinitionWithValue {
	
	Map<String, RDFpropertyDefinitionWithValue> defswithvalue;
	
	public ListOfRDFpropertyDefinitionWithValue() {
		defswithvalue = new java.util.HashMap<String, RDFpropertyDefinitionWithValue>();
	}
	
	public ListOfRDFpropertyDefinitionWithValue(JsonObject queryproperties) {
		defswithvalue = new java.util.HashMap<String, RDFpropertyDefinitionWithValue>();
		JsonArray properties = queryproperties.get(ClassLabelConstants.PropertyValueQueryPair).getAsJsonArray();
		for (int i = 0; i < properties.size(); i++) {
			JsonObject propertyvalue = properties.get(i).getAsJsonObject();
			RDFpropertyDefinitionWithValue prop = new RDFpropertyDefinitionWithValue(propertyvalue);
			defswithvalue.put(prop.getPropertyClassString(), prop);
		}
	}
	
	public void addAll(ListOfRDFpropertyDefinitionWithValue toadd) {
		for (String key : toadd.keySet()) {
			defswithvalue.put(key, toadd.getByKey(key));
		}
	}
	
	public void addValue(RDFpropertyDefinitionWithValue def) {
		defswithvalue.put(def.getPropertyClassString(), def);
	}
	
	public boolean hasKey(String key) {
		return defswithvalue.containsKey(key);
	}
	
	public RDFpropertyDefinitionWithValue getByKey(String key) {
		return defswithvalue.get(key);
	}
	
	public Set<String> keySet() {
		return defswithvalue.keySet();
	}
	
	public String  toString() {
		JsonArray array = this.toJsonArray();
		return JsonObjectUtilities.toString(array);
	}
	
	JsonObject toJsonResultRow() {
		JsonObject rowJsonObject = CreateDocumentTemplate.createTemplate("dataset:RDFGeneralQueryResultRow");
		Set<String> keySet = this.keySet();
		JsonArray array = new JsonArray();
		rowJsonObject.add(ClassLabelConstants.ShortStringKey, array);
		for(String key:keySet) {
			RDFpropertyDefinitionWithValue value = defswithvalue.get(key);
			String classname = value.getPropertyClassString();
			boolean isComponent = OntologyUtilityRoutines.isSubClassOf(classname, "dataset:ChemConnectPrimitiveDataStructure", false);
			String idString = value.getPropertyID();
			String valueString = value.getValue();
			if (!isComponent) {
				JsonObject jsonObject = JsonObjectUtilities.jsonObjectFromString(valueString);
				rowJsonObject.add(idString, jsonObject);
			} else {
				rowJsonObject.addProperty(idString, valueString);
			}
			
			array.add(value.getValue());
		}
		return rowJsonObject;
		
	}
	JsonArray toJsonArray() {
		Set<String> keySet = this.keySet();
		JsonArray array = new JsonArray();
		for(String key:keySet) {
			RDFpropertyDefinitionWithValue value = defswithvalue.get(key);
			JsonObject valueJsonObject = value.toJsonObject();
			array.add(valueJsonObject);
		}
		return array;
	}
}
