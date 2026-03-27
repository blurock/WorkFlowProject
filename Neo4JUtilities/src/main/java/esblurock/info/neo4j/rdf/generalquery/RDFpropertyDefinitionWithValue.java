package esblurock.info.neo4j.rdf.generalquery;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class RDFpropertyDefinitionWithValue extends RDFPropertyDefinition {
	
	String value;
	
	public RDFpropertyDefinitionWithValue(JsonObject propertyvalue) {
		super(propertyvalue.get(ClassLabelConstants.DatabaseObjectType).getAsString());
		this.value = propertyvalue.get(ClassLabelConstants.ShortStringKey).getAsString();
	}

	public RDFpropertyDefinitionWithValue(String propertyClassString, String value) {
		super(propertyClassString);
		this.value = value;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}
    public JsonObject toJsonObject() {
    	JsonObject jsonObject = super.toJsonObject();
    	jsonObject.addProperty(ClassLabelConstants.ShortStringKey, this.value);
    	return jsonObject;
    }
}
