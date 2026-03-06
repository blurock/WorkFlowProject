package info.esblurock.reaction.core.ontology.dataset;


import org.junit.Test;

import info.esblurock.reaction.core.ontology.base.dataset.CompoundObjectDimensionSet;
import info.esblurock.reaction.core.ontology.base.dataset.ParseCompoundObject;

public class TestGetCompoundObjectDimensionElements {

	@Test
	public void test() {
		
		System.out.println("------------------------------------------------------");
		System.out.println("TestGetCompoundObjectDimensionElements");
		System.out.println("------------------------------------------------------");
		String element1 = "dataset:DatabasePerson";
		System.out.println(element1);
		CompoundObjectDimensionSet set1 = ParseCompoundObject.getCompoundElements(element1);
		System.out.println(set1.toString());
		
		String element2 = "dataset:DatasetCreateObjectTemplate";
		System.out.println("------------------------------------------------------");
		System.out.println(element2);
		CompoundObjectDimensionSet set2 = ParseCompoundObject.getCompoundElements(element2);
		System.out.println(set2.toString());
		
		String element3 = "dataset:DatasetFillEmptyWithSourceInformation";
		System.out.println("------------------------------------------------------");
		System.out.println(element3);
		CompoundObjectDimensionSet set3 = ParseCompoundObject.getCompoundElements(element3);
		System.out.println(set3.toString());
		
		
	}

}
