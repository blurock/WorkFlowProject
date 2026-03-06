package info.esblurock.reaction.core.ontology.base.transaction;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.BaseCatalogData;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class CreateStandardTransactionElement {

	@Test
	public void test() {
		String owner = "Administrator";
		String transactionID = "11111111";
		String publicS = "true";
		JsonObject json = BaseCatalogData.createStandardDatabaseObject("dataset:TransactionEventObject", 
				owner, transactionID, publicS);
		System.out.println(JsonObjectUtilities.toString(json));
	}

}
