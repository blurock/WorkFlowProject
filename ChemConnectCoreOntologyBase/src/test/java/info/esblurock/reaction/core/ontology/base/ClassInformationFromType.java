package info.esblurock.reaction.core.ontology.base;

//import static org.junit.Assert.*;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;


public class ClassInformationFromType {

	@Test
	public void test() {
		
		String type = "SubSystemDescription";
		String structure = DatasetOntologyParseBase.getLabelFromAnnotation(type);
		System.out.println(type + "  Label: " + structure);
		
		
		//ClassificationInformation info = DatasetOntologyParseBase.getClassificationInformationFromType(type);
		//System.out.println("From " + type + "\n" + info.toString());
		
	}

}
