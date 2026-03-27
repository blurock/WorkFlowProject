package info.esblurock.background.services.dataset;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.background.services.firestore.InitiallizeSystem;
import info.esblurock.background.services.transaction.RunMultipleTransactions;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestSetInMultipleCollectionsInCollectionSet {

	@Test
	public void test() {
		InitiallizeSystem .initialize();
		String paths = "src/test/java/resources/dataset/createdatasetcollection.json\n"
				 + 
				"src/test/java/resources/dataset/addcollectionMetaAtom.json\n"
				+
				"src/test/java/resources/dataset/addcollectionSymmetry.json\n"
				+
				"src/test/java/resources/dataset/addcollectionDisassociationEnergy.json\n"
				+
				"src/test/java/resources/dataset/addcollectionVibration.json\n"
				+
				"src/test/java/resources/dataset/addcollectionBensonRules.json\n"
				;
		JsonObject response = RunMultipleTransactions.runMultipleFromListOfFiles(paths,"Adminstration",false,false);
		if(response != null) {
			JsonObjectUtilities.printResponse(response);
		} else {
			System.out.println("Error: no reponse formed");
		}
	}

}
