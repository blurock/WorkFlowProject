package info.esblurock.reaction.core.ontology.base.rdfs;


import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonObject;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.BaseObjectJSONInterface;

public class RDFInformation extends BaseObjectJSONInterface {
	String subjectNodeNameString;
	String objectNodeNameString;
	String classname;
	String predicateClass;
	Map<String,Object> subjectClass;
	Map<String,Object> objectClass;
	
	
	public RDFInformation(String classname, Map<String,Object> subjectClass, String predicateClass, Map<String,Object> objectClass) {
		super();
		this.classname = classname;
		this.subjectClass = subjectClass;
		this.predicateClass = predicateClass;
		this.objectClass = objectClass;
	}
	public RDFInformation(RDFInformation rdf) {
		this.classname = rdf.classname;
		this.subjectClass =  new HashMap<String,Object>(rdf.subjectClass);
		this.predicateClass = rdf.predicateClass;
		this.objectClass =  new HashMap<String,Object>(rdf.objectClass);
		
	}

	public String getSubjectNodeNameString() {
		return subjectNodeNameString;
	}

	public void setSubjectNodeNameString(String subjectNodeNameString) {
		this.subjectNodeNameString = subjectNodeNameString;
	}

	public String getObjectNodeNameString() {
		return objectNodeNameString;
	}

	public void setObjectNodeNameString(String objectNodeNameString) {
		this.objectNodeNameString = objectNodeNameString;
	}
	
	public String getClassname() {
		return classname;
	}
	public void setClassname(String classname) {
		this.classname = classname;
	}
	public Map<String,Object> getSubjectClass() {
		return subjectClass;
	}
	public void setSubjectClass(Map<String,Object> subjectClass) {
		this.subjectClass = subjectClass;
	}
	public String getPredicateClass() {
		return predicateClass;
	}
	public void setPredicateClass(String predicateClass) {
		this.predicateClass = predicateClass;
	}
	public Map<String,Object> getObjectClass() {
		return objectClass;
	}
	public void setObjectClass(Map<String,Object> objectClass) {
		this.objectClass = objectClass;
	}

	public void addSubjectValue(String key, Object value) {
		subjectClass.put(key, value);
	}

	public void addObjectValue(String key, Object value) {
		objectClass.put(key, value);
	}
	
	@Override
	public JsonObject toJsonObject() {
		JsonObject json = new JsonObject();
		json.addProperty(ClassLabelConstants.CatalogObjectType, classname);
		json.addProperty(OntologyObjectLabels.rdfmappingclass, predicateClass);
		JsonObject subjectClassMap = new JsonObject();
		for (String cls : subjectClass.keySet()) {
			subjectClassMap.addProperty(cls, subjectClass.get(cls).toString());
		}
		json.add(OntologyObjectLabels.subject, subjectClassMap);
		
		JsonObject objectClassMap = new JsonObject();
		for (String cls : objectClass.keySet()) {
			objectClassMap.addProperty(cls, objectClass.get(cls).toString());
		}
		json.add(OntologyObjectLabels.entity, objectClassMap);

		return json;
	}
	
	
}
