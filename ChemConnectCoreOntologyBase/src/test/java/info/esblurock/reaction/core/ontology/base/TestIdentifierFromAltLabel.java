package info.esblurock.reaction.core.ontology.base;

import static org.junit.Assert.*;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;

public class TestIdentifierFromAltLabel {

	@Test
	public void test() {
		String altlabelString = "shortdescription";
	    String identifier = GenericSimpleQueries.identifierFromAltLabel(altlabelString);
	    System.out.println("AltLabel: " + altlabelString + ", Identifier: " + identifier);
	}

}
