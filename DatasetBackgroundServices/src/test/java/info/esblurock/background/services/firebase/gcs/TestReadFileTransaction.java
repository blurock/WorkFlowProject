package info.esblurock.background.services.firebase.gcs;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.transaction.TransactionProcess;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadFileTransaction {

	@Test
	public void test() {
		String infoS = "{\n" + "     \"prov:activity\": \"dataset:InitialReadInLocalStorageSystem\",\n"
				+ "     \"dataset:transreqobj\": {},\n" + "\"dataset:activityinfo\": {\n"
				+ "  \"descr-filestaging\": {\n" + "    \"dataset:purpose-filestaging\": {\n"
				+ "      \"dataset:purposekey-filestaging\": \"dataset:PurposeFileStaging\",\n"
				+ "      \"dataset:dataconcept-staging\": \"dataset:ConceptFileStaging\"\n" + "    },\n"
				+ "    \"dataset:keyword-filestaging\": [],\n"
				+ "    \"dataset:title-staging\": \"Read in a THERGAS molecule set\",\n"
				+ "    \"dataset:abstract-staging\": \"Read in a THERGAS molecule set. The set of molecules\",\n"
				+ "    \"dcterms:created\": \"today\"\n" + "  },\n"
				+ "  \"dataset:uploadsrc\": \"dataset:LocalFileSystem\",\n"
				+ "  \"dataset:filesourceformat\": \"dataset:TherGasMoleculeFormat\",\n"
				+ "  \"dataset:fileidentifier\": \"/Users/edwardblurock/project/Thergas/donnees/mol.don\",\n"
				+ "  \"dataset:filemediatype\": \"dataset:FileTypeText\",\n"
				+ "  \"dcterms:title\": \"The standard THERGAS molecules\",\n"
				+ "  \"dataset:filesourcesubtype\": \"\",\n" + "  \"dcterms:identifier\": \"initialrepositorylocal\"\n"
				+ "}\n" + "}\n";
		JsonObject info = JsonObjectUtilities.jsonObjectFromString(infoS);
		System.out.println(JsonObjectUtilities.toString(info));
		// TransactionProcess.processFromTransaction(info);
	}

}
