package esblurock.info.neo4j.rdf.generalquery;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;


public class LisOfRDFDefinitions {

	Map<String, RDFPropertyDefinition> definitions;
	
	public LisOfRDFDefinitions() {
		definitions = new HashMap<String,RDFPropertyDefinition>();
	}
	
	public LisOfRDFDefinitions(List<String> classes) {
		this.definitions = new HashMap<String, RDFPropertyDefinition>();
		for (String cls : classes) {
			RDFPropertyDefinition definition = new RDFPropertyDefinition(cls);
			this.addDefinition(definition);
		}
	}
	
	public LisOfRDFDefinitions(JsonObject queryproperties) {
		this.definitions = new HashMap<String,RDFPropertyDefinition>();
		JsonArray properties = queryproperties.get(ClassLabelConstants.PropertyValueQueryPair).getAsJsonArray();
		for (int i = 0; i < properties.size(); i++) {
			JsonObject propertyvalue = properties.get(i).getAsJsonObject();
			RDFPropertyDefinition prop = new RDFPropertyDefinition(
					propertyvalue.get(ClassLabelConstants.CatalogObjectType).getAsString());
			this.addDefinition(prop);
		}
	}
	
	public void addAll(LisOfRDFDefinitions toadd) {
		for (String key : toadd.keySet()) {
			definitions.put(key, toadd.getDefinition(key));
		}
	}
	
	public void addDefinition(RDFPropertyDefinition def) {
        definitions.put(def.getPropertyClassString(), def);
    }
	
	RDFPropertyDefinition findDefinitionByID(String id) {
		return definitions.get(id);
	}
		
	public LisOfRDFDefinitions propertiesInDefinitions(ListOfRDFpropertyDefinitionWithValue properties) {
		return propertiesInDefinitions(properties, true);
	}
	
	public LisOfRDFDefinitions propertiesNotInDefinitions(ListOfRDFpropertyDefinitionWithValue properties) {
			return propertiesInDefinitions(properties, false);
	}
	
	private LisOfRDFDefinitions propertiesInDefinitions(ListOfRDFpropertyDefinitionWithValue properties, boolean inDefinitions) {
		
		LisOfRDFDefinitions props = new LisOfRDFDefinitions();
		for (String key : definitions.keySet()) {
			if (properties.hasKey(key)) {
				if(inDefinitions) {
					props.addDefinition(definitions.get(key));
				}
			} else {
				if(!inDefinitions) {
					props.addDefinition(definitions.get(key));
				}
			}
		}
		return props;
	}
	
	public RDFPropertyDefinition getDefinition(String key) {
		return definitions.get(key);
	}
	
	Set<String> keySet() {
		return definitions.keySet();
	}
	
	public boolean hasKey(String key) {
		return definitions.containsKey(key);
	}
	
    public String toString() {
    	 JsonArray array = this.toJsonArray();
         return JsonObjectUtilities.toString(array);
    }
    
    public JsonArray toJsonArray() {
    JsonArray array = new JsonArray();
    for(String key : definitions.keySet()) {
        RDFPropertyDefinition def = definitions.get(key);
        JsonObject defJsonObject = def.toJsonObject();
        array.add(defJsonObject);
    }
    return array;
    }
}
