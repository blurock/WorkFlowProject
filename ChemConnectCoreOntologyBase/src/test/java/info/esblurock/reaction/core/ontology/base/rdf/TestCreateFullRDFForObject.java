package info.esblurock.reaction.core.ontology.base.rdf;

import static org.junit.Assert.*;

import org.junit.Test;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.rdfs.FindRDFInClass;
import info.esblurock.reaction.core.ontology.base.rdfs.ListOfRDFInformation;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;

public class TestCreateFullRDFForObject {

	@Test
	public void test() {
		System.out.println("---------------------------------------");
		System.out.println("TestCreateFullRDFForObject dataset:DatabasePerson");
		System.out.println("---------------------------------------");
		JsonObject obj = CreateDocumentTemplate.createTemplate("dataset:DatabasePerson");
		System.out.println(JsonObjectUtilities.toString(obj));		
		ListOfRDFInformation lst = FindRDFInClass.createFullRDFForObject(obj);
		System.out.println("---------------------------------------");
		System.out.println(lst.toString());
		System.out.println("---------------------------------------");
	}

}
