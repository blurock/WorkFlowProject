package info.esblurock.reaction.core.ontology.base.dataset;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

public abstract class BaseObjectJSONInterface extends BaseObjectInterface {
	
	public int indent = 5;
	
	public String toString() {
		return toString("");
	}
	public String toString(String prefix) {
		JsonObject obj = toJsonObject();
		Gson gson = new GsonBuilder().setPrettyPrinting().create();
		String prettyJsonString = gson.toJson(obj);
		return prettyJsonString;
	}
	public JsonObject toJsonObject() {
		System.out.println("was not overridden");
		return null;
	}
	public void fillJsonObject(JsonObject obj) {
		
	}
}
