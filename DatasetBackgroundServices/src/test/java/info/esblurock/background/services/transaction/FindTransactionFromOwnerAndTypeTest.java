package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import org.junit.Test;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class FindTransactionFromOwnerAndTypeTest {
/*
	@Test
	public void test1() {
		InitiallizeSystem.initialize();
		JsonObject activity = new JsonObject();
		activity.addProperty(ClassLabelConstants.CatalogObjectOwner, "UOqk0KtFtaXma5TGsi8Seh9RMbx1");
		activity.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitializerUserAccount");
		
		JsonObject responseJsonObject = FindTransactions.FindTransactionFromOwnerAndType(activity);
		JsonObjectUtilities.printResponse(responseJsonObject);
		}
	
	*/
	@Test
	public void test2() {
		InitiallizeSystem.initialize();
		JsonObject activity = new JsonObject();
		activity.addProperty(ClassLabelConstants.CatalogObjectOwner, "UOqk0KtFtaXma5TGsi8Seh9RMbx1");
		activity.addProperty(ClassLabelConstants.TransactionEventType, "dataset:InitialReadInOfRepositoryFile");
		
		JsonObject responseJsonObject = FindTransactions.FindTransactionFromOwnerAndType(activity);
		
		JsonArray simplecatalogJsonObject = responseJsonObject.get(ClassLabelConstants.SimpleCatalogObject).getAsJsonArray();
		System.out.println("---------------------------------------------------------------------");
		System.out.println("Simple Catalog JsonObject: " + simplecatalogJsonObject.size());
		System.out.println(JsonObjectUtilities.toString(simplecatalogJsonObject));
		System.out.println("---------------------------------------------------------------------");
		
		
		//JsonObjectUtilities.printResponse(responseJsonObject);
		}

}
