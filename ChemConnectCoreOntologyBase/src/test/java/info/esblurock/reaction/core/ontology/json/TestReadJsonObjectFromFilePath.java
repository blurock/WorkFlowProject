package info.esblurock.reaction.core.ontology.json;

import java.io.IOException;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadJsonObjectFromFilePath {

	@Test
	public void test() {
		String path = "./data/Blurock.json";
		try {
			JsonObject obj = JsonObjectUtilities.jsonObjectFromFile(path);
			System.out.println(JsonObjectUtilities.toString(obj));
		} catch (IOException e) {
			e.printStackTrace();
		}
		
	}

}
