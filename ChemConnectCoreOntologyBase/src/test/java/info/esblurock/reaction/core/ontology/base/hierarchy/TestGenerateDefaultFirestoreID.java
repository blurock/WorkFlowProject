package info.esblurock.reaction.core.ontology.base.hierarchy;


import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestGenerateDefaultFirestoreID {

	@Test
	public void test() {
		System.out.println("----------- TestGenerateDefaultFirestoreID -------------");
		System.out.println("----------- dataset:TransactionEventObject -------------");
		String catalogID = "dataset:ThermodynamicBensonRuleDefinitionDatabase";
		JsonObject json = CreateDocumentTemplate.createTemplate(catalogID);
		JsonObject firestoreid = CreateHierarchyElement.searchForCatalogObjectInHierarchyTemplate(json);
		System.out.println(JsonObjectUtilities.toString(firestoreid));
		System.out.println("----------- dataset:RepositoryFileStaging -------------");
		catalogID = "dataset:RepositoryFileStaging";
		String owner = "blurock";
		String transactionID = "xxxxxx";
		String publicB = "true";
		json = BaseCatalogData.createStandardDatabaseObject(catalogID, owner, transactionID, publicB);
		firestoreid = json.get(ClassLabelConstants.FirestoreCatalogID).getAsJsonObject();
		System.out.println(JsonObjectUtilities.toString(firestoreid));
	}

}
