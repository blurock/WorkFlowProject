package info.esblurock.reaction.core.ontology.json;

import static org.junit.Assert.*;

import java.util.HashSet;
import java.util.Set;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class testReplaceIdentifiersWithPropertyValuePairs {

	@Test
	public void test() {
		JsonObject input = new JsonObject();
		Set<String> classSet = new HashSet<String>();
		
		classSet.add("dataset:AuthorizationName");
		classSet.add("dataset:UserClassification");
		classSet.add("dataset:TransactionID");
		input.addProperty(ClassLabelConstants.AuthorizationName, "AuthorizationName");
		input.addProperty(ClassLabelConstants.UserClassification, "UserClassification");
		input.addProperty(ClassLabelConstants.HTTPAddress, ": remains");
		input.addProperty("service", "service remains");
		System.out.println("Original JSON Object" + JsonObjectUtilities.toString(input));
		JsonObjectUtilities.replaceIdentifiersWithPropertyValuePairs(input,classSet);
		System.out.println("Changed JSON Object" + JsonObjectUtilities.toString(input));
	}

}
