package info.esblurock.reaction.core.ontology.base.dataset;

import java.util.List;
import java.util.Map;

import org.apache.jena.rdf.model.RDFNode;

import info.esblurock.reaction.core.ontology.base.OntologyBase;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class ParseCompoundObject {
	static String recordtype = "<http://www.w3.org/ns/dcat#record>";
	static String hasPartttype = "<http://purl.org/dc/terms/hasPart>";
	static String compoundclass = "dataset:ChemConnectCompoundBase";
	static String compoundexpclass = "dataset:ChemConnectCompoundExpData";
	static String thermoclass = "dataset:JThermodynamicsDataStructure";
	static String classificationtype = "dataset:Classification";

	public static CompoundObjectDimensionSet getCompoundElements(String classname) {
		CompoundObjectDimensionSet set = new CompoundObjectDimensionSet();
		compoundObjectTypeObjects(classname,recordtype, set);
		compoundObjectTypeObjects(classname,hasPartttype, set);
		return set;	
	}
	
	/**
	 * @param classname The name of the ontology ChemConnectElementCompound class
	 * @return The set of dimension parameters
	 */
	public static void compoundObjectTypeObjects(String classname, String type, CompoundObjectDimensionSet set) {
		String query = "SELECT ?subject ?record ?cardinality\n" + 
				"	WHERE { " + classname  + " rdfs:subClassOf ?object ."
						+ "?object owl:onProperty " + type + " ."
						+ "{?object owl:someValuesFrom ?record   }"
						+ "UNION"
						+ "{?object owl:onClass ?record . ?object owl:qualifiedCardinality ?cardinality}"
						+ "}";
		
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		for(Map<String, String> map : stringlst) {
			String elementType = map.get("record");
			//boolean compoundobject = OntologyUtilityRoutines.isSubClassOf(elementType, compoundclass, false);
			boolean compoundobject = isCompoundObject(elementType);
			String cardinalityS = map.get("cardinality");
			boolean singlet = true;
			int cardinality = 0;
			if (cardinalityS != null) {
				cardinality = Integer.parseInt(cardinalityS);
				if (cardinality > 1) {
					singlet = false;
				}
			} else {
				singlet = false;
			}
			boolean classification = OntologyUtilityRoutines.isSubClassOf(elementType, classificationtype, false);
			
			CompoundObjectDimensionInformation info = new CompoundObjectDimensionInformation(elementType, 
					cardinalityS, singlet,compoundobject, classification);
			set.add(info);
		}
	}
	
	private static boolean isCompoundObject(String elementType) {
		boolean activity = elementType.equals("dataset:ActivityInformationRecord");
        boolean compoundbaseobject = OntologyUtilityRoutines.isSubClassOf(elementType, compoundclass, false);
        boolean compoundexpobject = OntologyUtilityRoutines.isSubClassOf(elementType, compoundexpclass, false);
        boolean compoundthermoobject = OntologyUtilityRoutines.isSubClassOf(elementType, thermoclass, false);
        return compoundbaseobject || compoundexpobject || compoundthermoobject || activity;
	}
}
