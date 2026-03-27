package info.esblurock.background.services.transaction;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateTransactionTemplates {

	@Test
	public void testSetupActivityInformationTemplate() {
		String transactionS = "dataset:CreateDatabasePersonEvent";
		JsonObject json = ProcessTransactionBase.setupActivityInformationTemplate(transactionS);
		System.out.println(JsonObjectUtilities.toString(json));
	}

	@Test
	public void testSetupCatalogTemplate() {
		String transactionS = "dataset:CreateDatabasePersonEvent";
		JsonObject json = ProcessTransactionBase.setupCatalogObjectTemplate(transactionS);
		System.out.println(JsonObjectUtilities.toString(json));

	}
}
