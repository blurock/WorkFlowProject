package info.esblurock.background.services.dataset;

import org.junit.Test;

import com.google.gson.JsonArray;

import info.esblurock.background.services.jthermodynamics.symmetry.ExtractSetOfSymmetryDefinitionsFromDataset;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestReadSymmetryDefinitions {

	@Test
	public void test() {
		String maintainer = "Administrator";
		String dataset = "StandardDataset";
		JsonArray symmarr = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSymmetryDefinitions(maintainer, dataset, 
				"dataset:StructureExternalSymmetry");
		System.out.println("-----------------------------------------------------------------");
		System.out.println(symmarr.size());
		//System.out.println(JsonObjectUtilities.toString(symmarr));
		System.out.println("-----------------------------------------------------------------");
		
		JsonArray symmarr2nd = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSymmetryDefinitions(maintainer, dataset, 
				"dataset:StructureSecondarySymmetry");	
	System.out.println("-----------------------------------------------------------------");
	System.out.println(symmarr2nd.size());
	//System.out.println(JsonObjectUtilities.toString(symmarr2nd));
	System.out.println("-----------------------------------------------------------------");
	JsonArray symmarrinternal = ExtractSetOfSymmetryDefinitionsFromDataset.databaseSymmetryDefinitions(maintainer, dataset, 
			"dataset:tructureInternalSymmetry");	
System.out.println("-----------------------------------------------------------------");
System.out.println(symmarrinternal.size());
//System.out.println(JsonObjectUtilities.toString(symmarr2nd));
System.out.println("-----------------------------------------------------------------");
	}
}
