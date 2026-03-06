package info.esblurock.reaction.core.ontology.base.rdf;

import static org.junit.Assert.*;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.rdfs.FindRDFInClass;
import info.esblurock.reaction.core.ontology.base.rdfs.ListOfRDFInformation;

public class TestGenerateRDFInformation {

	@Test
	public void test() {
		String classname = "dataset:DatabasePerson";
		System.out.println("---------------------------------------");
		ListOfRDFInformation lst = FindRDFInClass.find(classname);
		System.out.println("GenerateRDFInformation: " + classname);
		System.out.println("Final List");
		System.out.println(lst.toString(""));
		System.out.println("---------------------------------------");
		System.out.println("---------------------------------------");
		String classname2 = "dataset:NameOfPerson";
		System.out.println("GenerateRDFInformation: " + classname2);
		ListOfRDFInformation lst2 = FindRDFInClass.find(classname2);
		System.out.println("Final List");
		System.out.println(lst2.toString(""));
		System.out.println("---------------------------------------");
	}

}
