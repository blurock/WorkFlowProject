package info.esblurock.reaction.core.ontology.base;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;

public class TestRetrieveAnnotationValues {

	@Test
	public void testGetValueFromAnnotation() {
		String structure = "dataset:CatalogHierarchyDatabasePerson";
		String identifier1 = OntologyObjectLabels.isDefinedBy;
		String value1 = DatasetOntologyParseBase.getValueFromAnnotation(structure, identifier1);
		System.out.println(structure + ": id: " + identifier1 + " = " + value1);
		String isdefinedbyShort = value1.substring(8);
		System.out.println("Without: " + isdefinedbyShort);
		
		String identifier2 = OntologyObjectLabels.label;
		String value2 = DatasetOntologyParseBase.getValueFromAnnotation(structure, identifier2);
		System.out.println(structure + ": id: " + identifier2 + " = " + value2);
	}

}
