package info.esblurock.background.services.firebase.gcs;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.OntologyBase;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadFileTransaction {

	@Test
	public void test() {

		InitiallizeSystem.initialize();
		// Initialize Ontology
		OntologyBase.Util.getDatabaseOntology();
		System.out.println("Initialization complete.");

		String infoString = """
				{
				  "prov:activity": "dataset:InitialReadInLocalStorageSystem",
				  "dataset:transreqobj": {},
				  "dataset:activityinfo": {
					  "dataset:uniquegenericname": "BBBBenson",
					  "dataset:fileidentifier": "upload/UOqk0KtFtaXma5TGsi8Seh9RMbx1/tableA1CarbonBensonSmallTest.txt",
					  "dataset:descrfilestaging": {
					    "dataset:keywordfilestaging": [],
					    "dataset:titlestaging": "ttttt",
					    "dataset:abstractstaging": "dddddd",
					    "dataset:purposefilestaging": {
					      "dataset:purposekeyfilestaging": "dataset:PurposeRepositoryPublishedResults",
					      "dataset:dataconceptstaging": "dataset:GCSSourceFile"
					    }
					  },
					  "dcterms:creator": "UOqk0KtFtaXma5TGsi8Seh9RMbx1",
					  "dataset:uploadsrc": "dataset:GCSSourceFile",
					  "dcterms:title": "tttttt",
					  "dcterms:created": "2026-05-27T13:48:22.627Z",
					  "foaf:page": [],
					  "dataset:objectype": "dataset:ActivityRepositoryInitialReadLocalFile",
					  "dataset:collectionobjecttype": "dataset:ThermodynamicBensonRuleDefinitionDatabase",
					  "dataset:filesourceformat": "dataset:TherGasBensonRules",
					  "skos:mappingRelation": [],
					  "dataset:datasetobjecttype": "dataset:ThermodynamicBensonRuleDefinitionDataSet",
					  "dataset:filesourcesubtype": "dataset:FileMediaText",
					  "<http://purl.org/dc/elements/1.1/identifier>": "dataset:initialrepositorylocal",
					  "dcterms:BibliographicResource": [],
					  "dataset:repositorytransactiontype": "dataset:TransactionInterpretBensonRule",
					  "dataset:filemediatype": "dataset:FileMediaText"
				  }
				}
				""";

		JsonObject info = JsonObjectUtilities.jsonObjectFromString(infoString);
		String owner = "UOqk0KtFtaXma5TGsi8Seh9RMbx1";
		System.out.println(JsonObjectUtilities.toString(info));
		TransactionProcess.processFromTransaction(info, owner);
	}

}
