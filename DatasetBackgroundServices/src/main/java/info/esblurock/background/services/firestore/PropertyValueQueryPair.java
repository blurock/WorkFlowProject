package info.esblurock.background.services.firestore;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.BaseObjectJSONInterface;

public class PropertyValueQueryPair extends BaseObjectJSONInterface {
	String property;
	String value;

	public PropertyValueQueryPair() {
		this.property = "";
		this.value = "";
	}

	public PropertyValueQueryPair(JsonObject obj) {
		this.fillJsonObject(obj);
	}

	public PropertyValueQueryPair(String property, String value) {
		super();
		this.property = property;
		this.value = value;
	}

	public String getProperty() {
		return property;
	}

	public void setProperty(String property) {
		this.property = property;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	@Override
	public JsonObject toJsonObject() {
		JsonObject json = new JsonObject();
		json.addProperty("dataset:objectype", property);
		json.addProperty("foaf:LabelProperty", value);
		return json;
	}

	@Override
	public void fillJsonObject(JsonObject json) {
		property = json.get("dataset:objectype").getAsString();
		value = json.get("foaf:LabelProperty").getAsString();
	}

}
