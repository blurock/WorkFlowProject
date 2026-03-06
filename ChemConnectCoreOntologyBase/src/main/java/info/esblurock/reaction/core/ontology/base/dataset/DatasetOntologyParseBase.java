package info.esblurock.reaction.core.ontology.base.dataset;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.apache.jena.rdf.model.RDFNode;

import info.esblurock.reaction.core.ontology.base.OntologyBase;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;


/**
 * @author edwardblurock
 *
 */
public class DatasetOntologyParseBase {
	/**
	 * @param structure The ID structure object (subclass of ID)
	 * @return The data element information (annotated properties of the concept filled in).
	 * 
	 * The BaseAnnotationObjects has all the standard annotated information of the concept
	 * 
	 * @throws IOException
	 */
	static public BaseAnnotationObjects getSubElementStructureFromIDObject(String structure) {
		String query = "SELECT ?id ?type ?altl ?comment ?label ?identifer\n" 
				+ "	WHERE {\n" 
				+ "   " + structure + " <http://purl.org/dc/elements/1.1/type> ?type .\n" 
				+ "	  " + structure + " <http://purl.org/dc/terms/identifier> ?id .\n" + "	" 
				+ "   " + structure + " <http://www.w3.org/2004/02/skos/core#altLabel> ?altl .\n" 
				+ "   " + structure + " rdfs:label ?label .\n" 
				+ "   " + structure + " rdfs:comment ?comment\n" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		BaseAnnotationObjects object = null;
		if (stringlst.size() > 0) {
			String idS = stringlst.get(0).get("id");
			String typeS = stringlst.get(0).get("type");
			String labelS = stringlst.get(0).get("label");
			String commentS = stringlst.get(0).get("comment");
			String altlabelS = stringlst.get(0).get("altl");
			object = new BaseAnnotationObjects(labelS, commentS, altlabelS, typeS, idS);
			}
		return object;
	}
	
	static public BaseAnnotationObjects getAnnotationStructureFromIDObject(String structure) {
		String idS = getIDFromAnnotation(structure);
		String typeS = getTypeFromAnnotation(structure);
		String labelS = getLabelFromAnnotation(structure);
		String commentS = getCommentFromAnnotation(structure);
		String altlabelS = getAltLabelFromAnnotation(structure);
		BaseAnnotationObjects object = new BaseAnnotationObjects(labelS, commentS, altlabelS, typeS, idS);
		return object;
	}
	
	/** Find an annotation value of a class
	 * 
	 * @param name The name of the class
	 * @param identifier The identifier within the annotation
	 * @return The value of the annotation
	 */
	static public String getAnnotationObject(String name, String identifier) {
		String query = "SELECT ?id \n" 
				+ "	WHERE {\n" 
				+ "	  " + name + " " + identifier + " ?id .\n" + "	" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String idS = "";
		if (stringlst.size() > 0) {
			idS = stringlst.get(0).get("id");
		}
		return idS;		
	}
	
	static public String getConceptFromAnnotation(String structure) {
		String query = "SELECT ?id \n" 
				+ "	WHERE {\n" 
				+ "	  " + structure + " dataset:objectconcept ?id .\n" + "	" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String idS = "";
		if (stringlst.size() > 0) {
			idS = stringlst.get(0).get("id");
		}
		return idS;
	}
	static public String getPurposeFromAnnotation(String structure) {
		String query = "SELECT ?purpose \n" 
				+ "	WHERE {\n" 
				+ "	  " + structure + " dataset:objectpurpose ?purpose .\n" + "	" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String idS = "";
		if (stringlst.size() > 0) {
			idS = stringlst.get(0).get("purpose");
		}
		return idS;
	}
	
	
	
	static public String getIDFromAnnotation(String structure) {
		String query = "SELECT ?id \n" 
				+ "	WHERE {\n" 
				+ "	  " + structure + " <http://purl.org/dc/terms/identifier> ?id .\n" + "	" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String idS = "";
		if (stringlst.size() > 0) {
			idS = stringlst.get(0).get("id");
		}
		return idS;
	}

	static public String getAltLabelFromAnnotation(String structure) {
		String query = "SELECT ?altl \n" 
				+ "	WHERE {\n" 
				+ "   " + structure + " <http://www.w3.org/2004/02/skos/core#altLabel> ?altl .\n" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String altLabelS = "";
		if (stringlst.size() > 0) {
			altLabelS = stringlst.get(0).get("altl");
		}
		return altLabelS;
	}

	static public String getTypeFromAnnotation(String structure) {
		String query = "SELECT ?type \n" 
				+ "	WHERE {\n" 
				+ "   " + structure + " <http://purl.org/dc/elements/1.1/type> ?type .\n" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String typeS = "";
		if (stringlst.size() > 0) {
			typeS = stringlst.get(0).get("type");
		}
		return typeS;
	}

	static public String getCommentFromAnnotation(String structure) {
		String query = "SELECT ?comment \n" 
				+ "	WHERE {\n" 
				+ "   " + structure + " rdfs:comment ?comment\n" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String commentS = "";
		if (stringlst.size() > 0) {
			commentS = stringlst.get(0).get("comment");
		}
		return commentS;
	}

	static public String getLabelFromAnnotation(String structure) {
		String query = "SELECT ?label \n" 
				+ "	WHERE {\n" 
				+ "   " + structure + " rdfs:label ?label .\n" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String labelS = "";
		if (stringlst.size() > 0) {
			labelS = stringlst.get(0).get("label");
		}
		return labelS;
	}

	static public String getValueFromAnnotation(String structure, String identifier) {
		String query = "SELECT ?value \n" 
				+ "	WHERE {\n" 
				+ "   " + structure + " " + identifier + " ?value .\n" 
				+ "  }";
		List<Map<String, RDFNode>> lst = OntologyBase.resultSetToMap(query);
		List<Map<String, String>> stringlst = OntologyBase.resultmapToStrings(lst);
		
		String valueS = "";
		if (stringlst.size() > 0) {
			valueS = stringlst.get(0).get("value");
		}
		return valueS;
		
	}
	
	

}