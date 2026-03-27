package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestFindDatasetTransactions {

	@Test
	public void test() {
		String eventtype = "dataset:PartiionSetWithinRepositoryFile";
		String series = "disassociationEnergyAlkanes";
		JsonObject json = new JsonObject();
		json.addProperty(ClassLabelConstants.CatalogObjectUniqueGenericLabel, series);
		TransactionProcess.fillInDatasetPrerequisites(eventtype, json);
		System.out.println(JsonObjectUtilities.toString(json));
	}

}
