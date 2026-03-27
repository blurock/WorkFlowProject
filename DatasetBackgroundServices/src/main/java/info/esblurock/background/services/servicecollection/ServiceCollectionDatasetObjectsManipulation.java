package info.esblurock.background.services.servicecollection;

import com.google.gson.JsonObject;

import info.esblurock.background.services.datasetobjects.ReadInDatasetObjectCollectionProcess;
import info.esblurock.background.services.datasetobjects.TransferDatasetObjectCollectionToDatabaseProcess;

public enum ServiceCollectionDatasetObjectsManipulation {
	
	ReadInDatasetObjectCollection {

		@Override
		public JsonObject process(JsonObject info) {
			return ReadInDatasetObjectCollectionProcess.process(info);
		}
		
	};

	
	public abstract JsonObject process(JsonObject info);
}
