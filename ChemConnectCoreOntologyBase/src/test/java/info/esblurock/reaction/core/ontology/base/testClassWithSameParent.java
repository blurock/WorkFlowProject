package info.esblurock.reaction.core.ontology.base;

import static org.junit.Assert.*;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;

public class testClassWithSameParent {

	@Test
	public void test() {
		String classname = "dataset:JThermodynamicsMetaAtomDefinitionDatabase";
		String sibling = GenericSimpleQueries.classWithSameParent(classname);
		System.out.println(classname + " and " + sibling + " have the same direct parent");
	}

}
