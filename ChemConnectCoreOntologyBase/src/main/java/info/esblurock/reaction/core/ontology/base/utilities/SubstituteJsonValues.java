package info.esblurock.reaction.core.ontology.base.utilities;

import java.util.Map;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

public class SubstituteJsonValues {
	
	public static boolean substituteJsonValueString(JsonObject original, String identifier, String newvalue) {
		boolean success = false;
		for (Map.Entry<String, JsonElement> prop : original.entrySet()) {
			String id = prop.getKey();
			if (id.equals(identifier)) {
				if (prop.getValue().isJsonPrimitive()) {
					if (prop.getValue().getAsJsonPrimitive().isString()) {
						original.addProperty(id, newvalue);
						success = true;
					}
				} else {
					if (prop.getValue().isJsonArray()) {
						JsonArray arr = prop.getValue().getAsJsonArray();
						arr.add(newvalue);
					}
				}
			}
		}
		if (!success) {
			for (Map.Entry<String, JsonElement> prop : original.entrySet()) {
				if (prop.getValue().isJsonObject()) {
					success = substituteJsonValueString(prop.getValue().getAsJsonObject(), identifier, newvalue);
				}
				if (prop.getValue().isJsonArray()) {
					JsonArray arr = prop.getValue().getAsJsonArray();
					for (int i = 0; i < arr.size(); i++) {
						JsonElement element = arr.get(i);
						if (element.isJsonObject()) {
							success = substituteJsonValueString(element.getAsJsonObject(), identifier, newvalue);
						}
					}
				}
			}
		}
		return success;
	}

	public static void substituteJsonObject(JsonObject original, JsonObject substitute) {
		for (Map.Entry<String, JsonElement> prop : substitute.entrySet()) {
			String id = prop.getKey();
			if (prop.getValue().isJsonPrimitive()) {
				String value = prop.getValue().getAsString();
				substituteJsonValueString(original, id, value);
			} else if (prop.getValue().isJsonObject()) {
				substituteJsonObject(original, prop.getValue().getAsJsonObject());
			} else if (prop.getValue().isJsonArray()) {
				JsonArray arr = prop.getValue().getAsJsonArray();
				for (int i = 0; i < arr.size(); i++) {
					JsonElement element = arr.get(i);
					if (element.isJsonPrimitive()) {
						substituteJsonValueString(original, id, element.getAsString());
					}
				}

			}
		}
	}
}
