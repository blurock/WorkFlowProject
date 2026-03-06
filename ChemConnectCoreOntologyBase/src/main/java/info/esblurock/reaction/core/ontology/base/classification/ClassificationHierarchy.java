package info.esblurock.reaction.core.ontology.base.classification;

import java.util.HashSet;
import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.BaseObjectJSONInterface;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;


public class ClassificationHierarchy extends BaseObjectJSONInterface {
	String classification;
	BaseAnnotationObjects annotations;
	Set<ClassificationHierarchy> subclassificatons;
	
	public ClassificationHierarchy() {
		this.classification = "";
		this.subclassificatons = new HashSet<ClassificationHierarchy>();
	}
	public ClassificationHierarchy(String classification, BaseAnnotationObjects annotations) {
		super();
		this.classification = classification;
		this.subclassificatons = new HashSet<ClassificationHierarchy>();
		this.annotations = annotations;
	}
	public ClassificationHierarchy(String classification, BaseAnnotationObjects annotations, Set<ClassificationHierarchy> subclassificatons) {
		super();
		this.classification = classification;
		this.annotations = annotations;
		this.subclassificatons = subclassificatons;
	}
	public String getClassification() {
		return classification;
	}
	public void setClassification(String classification) {
		this.classification = classification;
	}
	public void addClassificationHierarchy(ClassificationHierarchy hierarchy) {
		subclassificatons.add(hierarchy);
	}
	public BaseAnnotationObjects getAnnotations() {
		return annotations;
	}
	public void setAnnotations(BaseAnnotationObjects annotations) {
		this.annotations = annotations;
	}
	public Set<ClassificationHierarchy> getSubclassificatons() {
		return subclassificatons;
	}
	public void setSubclassificatons(Set<ClassificationHierarchy> subclassificatons) {
		this.subclassificatons = subclassificatons;
	}
	public String toString() {
		JsonObject json = this.toJsonObject();
		return json.toString();
	}
	@Override
	public JsonObject toJsonObject() {
		JsonObject obj = new JsonObject();
		JsonObject annjson = annotations.toJsonObject();
		obj.addProperty(OntologyObjectLabels.classification, classification);
		obj.add(OntologyObjectLabels.annotations, annjson);		
		JsonArray arr = new JsonArray();
		obj.add(OntologyObjectLabels.subclassifications, arr);
		for(ClassificationHierarchy hierarchy : subclassificatons) {
			JsonObject hierjson = hierarchy.toJsonObject();
			arr.add(hierjson);
		}
		return obj;
	}
	
	public void fillJsonObject(JsonObject obj) {
		classification = obj.get(OntologyObjectLabels.classification).getAsString();
		fillJsonObject((JsonObject) obj.get((OntologyObjectLabels.annotations)));
		JsonArray arr = obj.get(OntologyObjectLabels.subclassifications).getAsJsonArray();
		for(int i = 0 ; i < arr.size() ; i++) {
			JsonObject element = (JsonObject) arr.get(i);
			ClassificationHierarchy hierarchy = new ClassificationHierarchy();
			hierarchy.fillJsonObject(element);
			subclassificatons.add(hierarchy);
		}
	}
}
