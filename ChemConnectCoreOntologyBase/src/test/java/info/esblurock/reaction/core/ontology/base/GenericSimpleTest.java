package info.esblurock.reaction.core.ontology.base;

//import static org.junit.Assert.*;

import java.util.List;

import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;


public class GenericSimpleTest {

	@Test
	public void test() {
		String concept1 = "dataset:AccountPriviledgeData";
		List<String> inclusivelist = GenericSimpleQueries.listOfSubClasses(concept1, true);
		List<String> noninclusivelist = GenericSimpleQueries.listOfSubClasses(concept1, false);
		System.out.println("Inclusive List from " + concept1 + "\n" + inclusivelist);
		System.out.println("Non-Inclusive List from " + concept1 + "\n" + noninclusivelist);
		
		String conceptA = "dataset:AccountPriviledgeData";
		String conceptB = "dataset:AccountPriviledgeDataQuery";
		String conceptC = "dataset:AccountPriviledgeDataQueryUser";
	
		System.out.println(conceptA + "\t subclass of \t" + conceptB + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptA, conceptB, false));
		System.out.println(conceptA + "\t subclass of \t" + conceptC + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptA, conceptC, false));
		System.out.println(conceptB + "\t subclass of \t" + conceptC + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptB, conceptC, false));

		System.out.println(conceptB + "\t subclass of \t" + conceptA + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptB, conceptA, false));
		System.out.println(conceptC + "\t subclass of \t" + conceptB + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptC, conceptB, false));
		System.out.println(conceptC + "\t subclass of \t" + conceptA + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptC, conceptA, false));

		System.out.println(conceptA + "\t direct subclass of \t" + conceptB + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptA, conceptB, true));
		System.out.println(conceptA + "\t direct subclass of \t" + conceptC + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptA, conceptC, true));
		System.out.println(conceptB + "\t direct subclass of \t" + conceptC + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptB, conceptC, true));

		System.out.println(conceptB + "\t direct subclass of \t" + conceptA + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptB, conceptA, true));
		System.out.println(conceptC + "\t direct subclass of \t" + conceptB + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptC, conceptB, true));
		System.out.println(conceptC + "\t direct subclass of \t" + conceptA + " ans=" + 
				GenericSimpleQueries.isSubClassOf(conceptC, conceptA, true));


	}

}
