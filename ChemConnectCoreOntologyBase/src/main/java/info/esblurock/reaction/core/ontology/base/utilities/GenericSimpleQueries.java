package info.esblurock.reaction.core.ontology.base.utilities;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.vocabulary.ReasonerVocabulary;

import info.esblurock.reaction.core.ontology.base.OntologyBase;

/**
 * @author edwardblurock
 *
 */

public class GenericSimpleQueries {

	
	/** List all the subclasses under the concept
	 * 
	 * @param concept The concept of the ontology
	 * @param inclusive if false, all the classes in the hierarchy, true, just direct classes
	 * @return The list of subclasses under the concept
	 */
	public static List<String> listOfSubClasses(String concept, boolean inclusive) {
		List<String> subobjs = new ArrayList<String>();
		String query = null;
		if(inclusive) {
			query = "SELECT ?obj {\n"
					+ "?obj <" + ReasonerVocabulary.directSubClassOf + "> " + concept
					+"}";
		} else {
			query = "SELECT ?obj {\n"
				+ "?obj rdfs:subClassOf* " + concept
				+"}";
		}
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		subobjs = OntologyBase.isolateProperty("obj", stringlst);
		subobjs.remove(concept);
		return subobjs;
	}
	
	/** Is a concept a subclass of general class
	 * 
	 * @param concept The ontology subclass to be tested against generalclass
	 * @param generalclass The general ontology class as reference
	 * @param direct If true, the concept should be a direct subclass of generalclass
	 * @return true: concept is a (direct) subclass of generalclass
	 */
	public static boolean isSubClassOf(String concept, String generalclass, boolean direct) {
		String query = null;
		if(concept == null || generalclass == null) {
			System.out.println("concept: " + concept + "    generalclass: " + generalclass);
		}
		if(direct) {
			query = "ASK {\n"
					+ concept + " <" + ReasonerVocabulary.directSubClassOf + "> " + generalclass
					+"}";
		} else {
			query = "ASK {\n"
				+ concept + " rdfs:subClassOf* " + generalclass
				+"}";
		}
		return OntologyBase.datasetASK(query);
	}

	/** Are two concepts the same
	 * 
	 * @param concept1 Concept to compare
	 * @param concept2 Concept to compare
	 * @return true if concept1 equals concept2
	 */
	public static boolean isSameClass(String concept1, String concept2) {
		return concept1.compareTo(concept2) == 0;
	}
	
	/** Get classname from identifier
	 * 
	 * @param identifier: The identifier of the class (found in annotations)
	 * @return The classname, if the identifier does not exist
	 * 
	 * It should be noted that if, by an error in the ontology, 
	 * the identifier is not unique, then the first will be given as the answer
	 */
	public static String classFromIdentifier(String identifier) {
		String query = "SELECT ?type\n" + 
				"			WHERE {?type <http://purl.org/dc/terms/identifier> \"" +  identifier +"\"^^xsd:string }";
		List<String> lst = OntologyBase.isolateProperty(query,"type");
		String type = null;
		if(lst.size() > 0) {
			type = lst.get(0);
		}
		return type;
	}
	public static String identifierFromAltLabel(String altlabel) {
		String query = "SELECT ?identifier\n" + 
				"			WHERE {"
				+ "?type <http://www.w3.org/2004/02/skos/core#altLabel> \"" +  altlabel +"\"^^xsd:string .\n"
				+ "?type <http://purl.org/dc/terms/identifier> ?identifier "
						+ "}";
		List<String> lst = OntologyBase.isolateProperty(query,"identifier");
		String type = null;
		if(lst.size() > 0) {
			type = lst.get(0);
		}
		return type;
	}

	public static String classWithSameParent(String classname) {
		String query = "SELECT ?siblingClass ?parentClass\n"
				+ "WHERE {\n"
				+ "    # Get the parent class of our input class\n"
				+ "    " + classname + " rdfs:subClassOf ?parentClass "
				+ "    . \n"
				+ "    # Find other classes with the same parent\n"
				+ "    ?siblingClass rdfs:subClassOf ?parentClass "
				+ "    . \n"
				+ "    # Exclude the input class itself\n"
				+ "    FILTER (?siblingClass != " + classname + ")\n"
				+ "    \n"
				+ "    # Optional: Ensure we're only looking at named classes (not blank nodes)\n"
				+ "    FILTER (isIRI(?siblingClass))\n"
				
				+ "}";
		
		List<String> lst = OntologyBase.isolateProperty(query,"siblingClass");
		String sibling = null;
		if(lst.size() > 0) {
			sibling = lst.get(0);
		}
		return sibling;
		
	}

}
