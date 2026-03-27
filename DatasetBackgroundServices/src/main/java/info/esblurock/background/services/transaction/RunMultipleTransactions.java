package info.esblurock.background.services.transaction;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.StringTokenizer;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.gcs.UploadFileToGCS;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;


public class RunMultipleTransactions {
	/**
	 * @param transactioninputs A string where each line is the input file for a transaction
	 * @param printresults true if each transaction should be printed
	 * @return The last response. If an error occurred, then the last response is the error response.
	 */
	public static JsonObject runMultipleFromListOfFiles(String transactioninputs, String owner, boolean fromresource, boolean printresults) {
		StringTokenizer tok = new StringTokenizer(transactioninputs,"\n");
		boolean success = true;
		JsonObject response = null;
		while(tok.hasMoreElements() && success) {
			String srcpath = tok.nextToken();
			String content = null;
			try {
				if(fromresource) {
					InputStream inputStream = RunMultipleTransactions.class.getResourceAsStream(srcpath);
					if(inputStream == null) {
						System.out.println("Resource not found: '" + srcpath + "'");
					} else {
						content = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
						//System.out.println(content);
					}
				} else {
					content = Files.readString(Paths.get(srcpath));
				}
				if(content != null) {
				JsonObject json = JsonObjectUtilities.jsonObjectFromString(content);
				JsonObject activity = json.get(ClassLabelConstants.ActivityInformationRecord).getAsJsonObject();
				if (activity.get(ClassLabelConstants.CatalogDataObjectMaintainer) != null) {
					activity.addProperty(ClassLabelConstants.CatalogDataObjectMaintainer, owner);
				}
				
				response = TransactionProcess.processFromTransaction(json, owner);
				if(response.get(ClassLabelConstants.ServiceProcessSuccessful).getAsBoolean()) {
					if(printresults) {
						JsonObjectUtilities.printResponse(response);
					}
				} else {
					success = false;
					System.out.println(" ------------ Transaction failed ------------ ");
				}
				}
			} catch (IOException e) {
				success = false;
				System.out.println("Error in input translation: " + srcpath);
			}
		}
		return response;
	}
}
