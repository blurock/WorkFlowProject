package info.esblurock.reaction.core.ontology.base.annotations;

import static org.junit.Assert.*;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.dataset.annotations.ComponentAnnotations;

public class ComponentAnnotationsTest {

	@Test
	public void test() {
		ComponentAnnotations annotations = new ComponentAnnotations();
		
		String mainclass = "dataset:ActivityRepositoryInitialReadURL";
		annotations.isolateComponentAnnotations(mainclass);
		
		System.out.println("------------------------------------------------------------------------");
		System.out.println(annotations.toString());
		System.out.println(annotations.annotationAsString());
		System.out.println("------------------------------------------------------------------------");
		
		System.out.println("Class Annotations ------------------------------------------------------------------------");
		ComponentAnnotations classannotations = new ComponentAnnotations();
		String activityString = "dataset:ActivityInformationRecordThermodynamics";
		classannotations.mergeAnnotationSet(activityString);
		System.out.println(classannotations.annotationAsString());
		System.out.println("Class Annotations ------------------------------------------------------------------------");
		
	}

}
