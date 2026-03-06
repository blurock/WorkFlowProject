package info.esblurock.reaction.core.ontology.base;

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class TestSubClassesOfClass {

	@Test
	public void testListOfSubClasses() {
		System.out.println("--------------------------------------------------");
		System.out.println("listOfSubClasses");
		String top1 = "dataset:RepositoryFile";
		List<String> sub1 = OntologyUtilityRoutines.listOfSubClasses(top1, true);
		System.out.println("SubClasses: (true)\n" + sub1.toString());
		List<String> sub2 = OntologyUtilityRoutines.listOfSubClasses(top1, false);
		System.out.println("SubClasses: (false)\n" + sub2.toString());
	}

	@Test
	public void testIsSubClassOf() {
		System.out.println("--------------------------------------------------");
		System.out.println("isSubClassOf");
		String class1 = "dataset:RepositoryFile";
		String subclass1 = "dataset:InitialReadFromUserInterface";
		System.out.println(class1 + " subclass of " + subclass1 + " (indirect): " 
				+ OntologyUtilityRoutines.isSubClassOf(subclass1, class1, false));
		System.out.println(class1 + " subclass of " + subclass1 + "(direct): " 
				+ OntologyUtilityRoutines.isSubClassOf(subclass1, class1, true));
	}

	@Test
	public void testIsSameClass() {
		System.out.println("--------------------------------------------------");
		System.out.println("isSameClass");
		String class1 = "dataset:RepositoryFile";
		String subclass1 = "dataset:InitialReadFromUserInterface";
		System.out.println("isSameClassOf");
		System.out.println(class1 + " subclass of " + subclass1 + " (no): " 
				+ OntologyUtilityRoutines.isSameClass(subclass1, class1));
		System.out.println(class1 + " subclass of " + subclass1 + "(yes): " 
				+ OntologyUtilityRoutines.isSameClass(class1, class1));
		
	}

	@Test
	public void testtypesFromIdentifier() {
		System.out.println("--------------------------------------------------");
		System.out.println("typesFromIdentifier");
		String identifier = "dataset:initreadusrinterface";
		String classname = OntologyUtilityRoutines.typesFromIdentifier(identifier);
		System.out.println("identifier: " + identifier + " is of class: " + classname);
	}
	@Test
	public void test() {
		System.out.println("--------------------------------------------------");
		System.out.println("exactlyOnePropertyMultiple");
		String classname = "dataset:InitialReadFromUserInterface";
		String property = "<http://purl.org/dc/terms/source>";
		List<String> lst  = OntologyUtilityRoutines.exactlyOnePropertyMultiple(classname, property);
		System.out.println(classname + "(" + property + ") =   " + lst);
	}
	@Test
	public void testsomePropertyMultiple() {
		System.out.println("--------------------------------------------------");
		System.out.println("somePropertyMultiple");
		String classname = "dataset:ChemConnectDataStructure";
		String property = "<http://www.w3.org/ns/dcat#record>";
		List<String> lst  = OntologyUtilityRoutines.somePropertyMultiple(classname, property);
		System.out.println(classname + "(" + property + ") =  " + lst);
		
	}

}
