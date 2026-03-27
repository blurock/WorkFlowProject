package info.esblurock.background.services.transaction;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

import org.dom4j.Element;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Storage;
import com.google.gson.JsonObject;

import info.esblurock.background.services.datamanipulation.DatasetObjectLabelListManipulation;
import info.esblurock.background.services.firestore.FirestoreBaseClass;
import info.esblurock.background.services.firestore.ReadFirestoreInformation;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;

public enum DeleteTransactionCatalogObjects {
	
	InitialReadInOfRepositoryFile {

		@Override
		void delete(JsonObject transaction, JsonObject firestoreid, DocumentReference docref,Element body) throws InterruptedException, ExecutionException {
			body.addElement("div","Deleting blob: ");
			JsonObject catalog = ReadFirestoreInformation.readUsingDocumentReference(firestoreid, docref);
			String id = catalog.get(AnnotationObjectsLabels.identifier).getAsString();
			if(id.equals(ClassLabelConstants.RepositoryFileStaging )) {
				Storage storage;
				JsonObject gcsinfo = catalog.get(ClassLabelConstants.GCSBlobFileInformationStaging).getAsJsonObject();
				String name = gcsinfo.get(ClassLabelConstants.GCSFileName).getAsString();
				String path = gcsinfo.get(ClassLabelConstants.GCSFilePath).getAsString();
				String fileS = path + "/" + name;
				String bucketS = "blurock-database.appspot.com";
				try {
					storage = FirestoreBaseClass.getStorage();
					storage.delete(bucketS, fileS);
					body.addElement("div","Deleting blob: " + fileS + " in " + bucketS);
				} catch (IOException e) {
					body.addElement("div","Error in deleting blob: " + fileS + " in " + bucketS);
				}
				
			} else {
				body.addElement("div","Wrong type: " + id + " not " + ClassLabelConstants.RepositoryFileStaging);
			}
		}
		
	}, TransactionInterpretTextBlock {

		@Override
		void delete(JsonObject transaction, JsonObject firestoreid, DocumentReference docref, Element body)
				throws InterruptedException, ExecutionException {
			body.addElement("div","Deleting blob: ");
			JsonObject catalog = ReadFirestoreInformation.readUsingDocumentReference(firestoreid, docref);
			//JsonObject response = DatasetObjectLabelListManipulation.deleteElementsFromLabelSets(transaction,catalog, body);
		}
		
	};
	
	
	abstract void delete(JsonObject transaction, JsonObject firestoreid, DocumentReference docref,Element body) throws InterruptedException, ExecutionException;

	protected boolean properType(JsonObject catalog, String type) {
		String id = catalog.get(AnnotationObjectsLabels.identifier).getAsString();
		boolean ans = id.equals(type);
		return ans;
	}

}
