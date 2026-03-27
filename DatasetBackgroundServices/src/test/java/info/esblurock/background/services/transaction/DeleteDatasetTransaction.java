package info.esblurock.background.services.transaction;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class DeleteDatasetTransaction {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String readS = "{\n"
				+ "	\"prov:activity\": \"dataset:InitialReadInOfRepositoryFile\",\n"
				+ "	\"dataset:transreqobj\": {},\n"
				+ "	\"dataset:activityinfo\": {\n"
				+ "		\"descr-filestaging\": {\n"
				+ "			\"dataset:purpose-filestaging\": {\n"
				+ "				\"dataset:purposekey-filestaging\": \"dataset:PurposeFileStaging\",\n"
				+ "				\"dataset:dataconcept-staging\": \"dataset:ConceptFileStaging\"\n"
				+ "			},\n"
				+ "			\"dataset:keyword-filestaging\": [],\n"
				+ "			\"dataset:title-staging\": \"Read in External Symmetry Rules for Carbon Atom\",\n"
				+ "			\"dataset:abstract-staging\": \"Read in External Symmetry Rules for Carbon Atom. The source of these rules is an extropolation of TherGas rules for symmetry contributions as outlined in the thesis\",\n"
				+ "			\"dcterms:created\": \"today\"\n"
				+ "		},\n"
				+ "		\"dataset:uploadsrc\": \"dataset:ResourceFileSystem\",\n"
				+ "		\"dataset:filesourceformat\": \"dataset:JThermodynamicSymmetry\",\n"
				+ "		\"dataset:fileidentifier\": \"/resources/standard/symmetry/external/data/ExternalSymmetryCarbonAtom.xml\",\n"
				+ "		\"dataset:filemediatype\": \"dataset:FileTypeText\",\n"
				+ "		\"dcterms:title\": \"External Symmetry Rules for Carbon Atom\",\n"
				+ "		\"dataset:filesourcesubtype\": \"\",\n"
				+ "		\"dataset:collectionobjecttype\": \"dataset:JThermodynamicsSymmetryStructureDefinitionDatabase\",\n"
				+ "		\"dataset:specificationfordataset\": {\n"
				+ "			\"dataset:catalogobjectmaintainer\": \"Administrator\",\n"
				+ "			\"dataset:uniquegenericname\": \"ExternalSymmetryCarbonAtom\",\n"
				+ "			\"dataset:datasetobjecttype\": \"dataset:JThermodynamicsSymmetryStructureDefinitionDataSet\"\n"
				+ "		},\n"
				+ "		\"dcterms:identifier\": \"initialrepositorylocal\",\n"
				+ "		\"dcterms:BibliographicResource\": []\n"
				+ "	}\n"
				+ "}\n"
				+ "";
		
		String parseS = "{\n"
				+ "	\"prov:activity\": \"dataset:PartiionSetWithinRepositoryFile\",\n"
				+ "		\"dataset:activityinfo\": {\n"
				+ "		\"dataset:collectionobjecttype\": \"dataset:JThermodynamicsSymmetryStructureDefinitionDatabase\",\n"
				+ "		\"dataset:specificationfordataset\": {\n"
				+ "			\"dataset:catalogobjectmaintainer\": \"Administrator\",\n"
				+ "			\"dataset:uniquegenericname\": \"ExternalSymmetryCarbonAtom\",\n"
				+ "			\"dataset:datasetobjecttype\": \"dataset:JThermodynamicsSymmetryStructureDefinitionDataSet\"\n"
				+ "		},\n"
				+ "		\"dataset:filepartitionmethod\": \"dataset:PartitionXMLListOfCatalogObjects\",\n"
				+ "		\"dataset:filesourceformat\": \"dataset:JThermodynamicsSymmetryDefinitionFormat\",\n"
				+ "		\"dcterms:title\": \"External Symmetry Rules for Carbon Atom: extropolation of TherGas rules for symmetry contributions as outlined in the Muller thesis\"\n"
				+ "	}\n"
				+ "}";
		
		String infoS = "{\n"
				+ "	\"prov:activity\": \"dataset:InitialReadInOfRepositoryFile\",\n"
				+ "		\"dataset:specificationfordataset\": {\n"
				+ "			\"dataset:catalogobjectmaintainer\": \"Administrator\",\n"
				+ "			\"dataset:uniquegenericname\": \"ExternalSymmetryCarbonAtom\",\n"
				+ "			\"dataset:datasetobjecttype\": \"dataset:JThermodynamicsSymmetryStructureDefinitionDataSet\"\n"
				+ "		}\n"
				+ "}";
		
		String parsedeleteS = "{\n"
				+ "	\"prov:activity\": \"dataset:PartiionSetWithinRepositoryFile\",\n"
				+ "		\"dataset:specificationfordataset\": {\n"
				+ "			\"dataset:catalogobjectmaintainer\": \"Administrator\",\n"
				+ "			\"dataset:uniquegenericname\": \"ExternalSymmetryCarbonAtom\",\n"
				+ "			\"dataset:datasetobjecttype\": \"dataset:JThermodynamicsSymmetryStructureDefinitionDataSet\"\n"
				+ "		}\n"
				+ "}";
		
		String paths = ""
		+ "/resources/standard/symmetry/secondary/TransactionReadSecondarySymmetryCarbonAtom.json\n"
		+ "/resources/standard/symmetry/secondary/TransactionParseSecondarySymmetryCarbonAtom.json\n"
		+ "/resources/standard/symmetry/secondary/TransactionCreateSecondarySymmetryCarbonAtom.json\n"
;		
		try {
		JsonObject response = RunMultipleTransactions.runMultipleFromListOfFiles(paths,"Administrator", true, false);
		if(response != null) {
			JsonObjectUtilities.printResponse(response);
			System.out.println("Success!!!!");
		} else {
			System.out.println("Error: no reponse formed");
		}
		} catch(Exception ex) {
			ex.printStackTrace();
		}

		
		System.out.println(infoS);
		try {
		JsonObject info =   JsonObjectUtilities.jsonObjectFromString(infoS);
		JsonObject read = JsonObjectUtilities.jsonObjectFromString(readS);
		JsonObject parse = JsonObjectUtilities.jsonObjectFromString(parseS);
		JsonObject parsedelete = JsonObjectUtilities.jsonObjectFromString(parsedeleteS);
		String maintainer = "";
		JsonObject readresponse = TransactionProcess.processFromTransaction(read,maintainer);
		JsonObject parseresponse = TransactionProcess.processFromTransaction(parse,maintainer);
		JsonObject presponse = DeleteTransaction.deleteDatasetTransaction(parsedelete);
		JsonObject rresponse = DeleteTransaction.deleteDatasetTransaction(info);
		JsonObjectUtilities.printResponse(rresponse);
		} catch(Exception ex) {
			ex.printStackTrace();
		}
	}

}
