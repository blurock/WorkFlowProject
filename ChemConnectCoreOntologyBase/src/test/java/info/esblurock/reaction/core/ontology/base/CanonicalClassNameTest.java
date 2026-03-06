package info.esblurock.reaction.core.ontology.base;


import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.classification.ClassificationHierarchy;
import info.esblurock.reaction.core.ontology.base.classification.DatabaseOntologyClassification;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;


public class CanonicalClassNameTest {

	@Test
	public void test() {
		//testConcept("dataset:ChemConnectCompoundBase");
		//testConcept("dataset:ChemConnectCompoundExpData");
		//testConcept("dataset:ActivityInformationRecordIDAndType");
		//testConcept("dataset:ChemConnectCompoundDataStructure");
		testConcept("dataset:ChemConnectStructureRepository");
		testConcept("dataset:ChemConnectDataStructure");
	}

	
	void testConcept(String classname) {
		System.out.println("CanonicalClassNameTest: " + classname + "---------------------------");
		//String module = DatasetOntologyParseBase.getModuleDirectFromConcept(classname);
		//System.out.println(classname + ": " + module);
		//if(module != null) {
		//	System.out.println(DatasetOntologyParseBase.getDomainFromModule(module));
		//}
		
		ClassificationHierarchy hierarchy = DatabaseOntologyClassification.getClassificationHierarchy(classname);
		System.out.println(hierarchy.toString(classname + ":   "));
		//System.out.println(DatasetOntologyParseBase.getSubClasses(classname));
		//System.out.println("from module: " + DatasetOntologyParseBase.getModuleMembershipFromConcept(classname));
		//System.out.println("classname: "   + DatasetOntologyParseBase.getCanonicalClassName(classname));
		//System.out.println("\n");
		
	}
}
