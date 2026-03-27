package info.esblurock.background.services.firestore.gcs;

import java.io.IOException;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
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
		String fileContent = "";
		Storage storage;
		try {
			storage = FirestoreBaseClass.getStorage();
			String fileS = path + "/" + name;
			Blob blob = storage.get("blurock-database.appspot.com", fileS);
			fileContent = new String(blob.getContent());
		} catch (IOException e) {
			e.printStackTrace();
		}
		return fileContent;
	}

}
