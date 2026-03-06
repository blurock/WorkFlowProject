package info.esblurock.reaction.core.ontology.base.dataset;


import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.SubstituteJsonValues;

public class TestCreateStandardEmptyObject {

	@Test
	public void test() {
		String owner = "Blurock";
		String transID = "transactionID value";
		/*
		System.out.println("---------------------------------------");
		System.out.println("TestCreateStandardEmptyObject: DatabasePerson");
		System.out.println("---------------------------------------");
		String classname = "dataset:DatabasePerson";
		JsonObject obj = BaseCatalogData.createStandardDatabaseObject(classname, owner, transID, "true");
		
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.DOI, "DOI value");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.PersonFullName, "Edward Blurock");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.givenName, "Edward");
		SubstituteJsonValues.substituteJsonValueString(obj, ClassLabelConstants.familyName, "Blurock");

		
		
		System.out.println("---------------------------------------");
		System.out.println("TestCreateStandardEmptyObject: UserAccount");
		System.out.println("---------------------------------------");
		String classname1 = "dataset:UserAccount";
		JsonObject obj1 = BaseCatalogData.createStandardDatabaseObject(classname1, owner, transID, "true");
		System.out.println(JsonObjectUtilities.toString(obj1));
*/
		System.out.println("---------------------------------------");
		System.out.println("TestCreateStandardEmptyObject: dataset:ThermodynamicBensonRuleDefinitionDataSet");
		System.out.println("---------------------------------------");
		String classname2 = "dataset:ThermodynamicBensonRuleDefinitionDataSet";
		JsonObject obj2 = BaseCatalogData.createStandardDatabaseObject(classname2, owner, transID, "true");
		System.out.println(JsonObjectUtilities.toString(obj2));
	}

}
