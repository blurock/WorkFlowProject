package info.esblurock.reaction.core.ontology.base.rdf;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.rdfs.FindRDFInClass;
import info.esblurock.reaction.core.ontology.base.rdfs.ListOfRDFInformation;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateRDFs {

	@Test
	public void test() {
		System.out.println("---------------------------------------");
		System.out.println("TestGetValueFromCatalog dataset:DatabasePerson");
		System.out.println("---------------------------------------");
		JsonObject obj = CreateDocumentTemplate.createTemplate("dataset:DatabasePerson");
		System.out.println(JsonObjectUtilities.toString(obj));
		System.out.println("---------------------------------------");
		ListOfRDFInformation lst = FindRDFInClass.createRDFList("dataset:DatabasePerson",obj);
		System.out.println("---------------------------------------");
		System.out.println(lst.toString());
		System.out.println("---------------------------------------");
		
	}

}
