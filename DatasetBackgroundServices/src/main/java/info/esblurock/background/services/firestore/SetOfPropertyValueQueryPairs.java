package info.esblurock.background.services.firestore;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.BaseObjectJSONInterface;

public class SetOfPropertyValueQueryPairs extends BaseObjectJSONInterface {

	List<PropertyValueQueryPair> pairs;

	public SetOfPropertyValueQueryPairs() {
		pairs = new ArrayList<PropertyValueQueryPair>();
	}

	public void add(PropertyValueQueryPair pair) {
		pairs.add(pair);
	}

	public void add(String property, String value) {
		PropertyValueQueryPair pair = new PropertyValueQueryPair(property, value);
		pairs.add(pair);
	}

	public List<PropertyValueQueryPair> getPairs() {
		return pairs;
	}

	@Override
	public JsonObject toJsonObject() {
		JsonObject json = new JsonObject();
		JsonArray arr = new JsonArray();
		json.add("dataset:propertyvaluepair", arr);
		Iterator<PropertyValueQueryPair> iter = pairs.iterator();
		while (iter.hasNext()) {
			PropertyValueQueryPair pair = iter.next();
			JsonObject pairjson = pair.toJsonObject();
			arr.add(pairjson);
		}
		return json;
	}

	@Override
	public void fillJsonObject(JsonObject obj) {
		JsonArray arr = obj.get("dataset:propertyvaluepair").getAsJsonArray();
		for (int i = 0; i < arr.size(); i++) {
			JsonObject json = arr.get(i).getAsJsonObject();
			PropertyValueQueryPair pair = new PropertyValueQueryPair(json);
			pairs.add(pair);
		}
	}

}
