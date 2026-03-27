package info.esblurock.background.services.service.rdfs;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Query;
import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.DeleteCatalogDataObject;
import info.esblurock.background.services.firestore.SetUpDocumentReference;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.hierarchy.CreateHierarchyElement;

public class DeleteRDFs extends DeleteCatalogDataObject {

	/**
	 * @param transactionid
	 * @return The number of RDFs deleted
	 * 
	 *         Deleted 4 types of RDFs using the TransactionID
	 * 
	 */
	public static int deleteRDFs(String transactionid) {
		getFirestoreID();
		int c1 = deleteCatalogObjectWithTransactionID("dataset:RDFObjectAsPrimitiveSubjectRecord", transactionid);
		int c2 = deleteCatalogObjectWithTransactionID("dataset:RDFSubjectObjectAsRecord", transactionid);
		int c3 = deleteCatalogObjectWithTransactionID("dataset:RDFSubjectObjectPrimitives", transactionid);
		int c4 = deleteCatalogObjectWithTransactionID("dataset:RDFSubjectPrimitiveObjectRecord", transactionid);
		return c1 + c2 + c3 + c4;
	}

	public static int deleteCatalogObjectWithTransactionID(String classname, String transactionid) {
		JsonObject objfirestoreid = rdfFirestoreid(classname);
		CollectionReference collref = SetUpDocumentReference.setupCollection(db, objfirestoreid);
		Query query = collref.whereEqualTo(ClassLabelConstants.TransactionID, transactionid);
		return deleteCollection(query, batchsize);
	}

	public static JsonObject rdfFirestoreid(String classname) {
		JsonObject oprimsrec = CreateDocumentTemplate.createTemplate(classname);
		JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(oprimsrec);
		firestoreid.remove(ClassLabelConstants.SimpleCatalogName);
		return firestoreid;
	}

}
