package info.esblurock.background.services.firestore.gcs;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Storage;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.FirestoreBaseClass;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;

public class ReadCloudStorage {
	public static String read(JsonObject gcsinfo) {
		String name = gcsinfo.get(ClassLabelConstants.GCSFileName).getAsString();
		String path = gcsinfo.get(ClassLabelConstants.GCSFilePath).getAsString();
		return read(path, name);
	}

	public static String read(String path, String name) {
		String fileS = path + "/" + name;
		return read(fileS);
	}

	public static String read(String fullpath) {
		String fileContent = "";
		Storage storage;
		try {
			storage = FirestoreBaseClass.getStorage();
			Blob blob = storage.get("blurock-database.appspot.com", fullpath);
			if (blob != null) {
				fileContent = new String(blob.getContent(), StandardCharsets.UTF_8);
			} else {
				System.err.println("ReadCloudStorage: Blob not found: " + fullpath);
			}
		} catch (IOException e) {
			System.err.println("ReadCloudStorage error: " + e.getMessage());
			e.printStackTrace();
		}
		return fileContent;
	}

}
