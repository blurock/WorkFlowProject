package info.esblurock.reaction.core.ontology.base.dataset.annotations;

import java.util.List;
import java.util.Set;

import org.checkerframework.common.returnsreceiver.qual.This;

import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;



public class ComponentAnnotations {
	String componentClassString = "dataset:ChemConnectPrimitiveDataStructure";
	String classificationsClassString = "dataset:Classification";

	
	JsonObject componentAnnoations;
	JsonObject classificationAnnotations;
	
	public ComponentAnnotations() {
		this.componentAnnoations = new JsonObject();
		this.classificationAnnotations = new JsonObject();
	}
		public ComponentAnnotations(JsonObject annotations) {
		this.componentAnnoations = new JsonObject();
		this.classificationAnnotations = new JsonObject();
		isolateComponentAnnotations(annotations);
	}

	public ComponentAnnotations(JsonObject componentAnnoations, JsonObject classificationAnnotations) {
		super();
		this.componentAnnoations = componentAnnoations;
		this.classificationAnnotations = classificationAnnotations;
	}
	
	public void addComponentAnnotation(String component, JsonObject annotation) {
		if(OntologyUtilityRoutines.isSubClassOf(component, componentClassString, false)) {
			this.componentAnnoations.add(component, annotation);
			if(OntologyUtilityRoutines.isSubClassOf(component, componentClassString, false)) {
				this.classificationAnnotations.add(component, annotation);
			}
		}
    }
	
	public void isolateComponentAnnotations(String mainclass){
		JsonObject template = CreateDocumentTemplate.createTemplateWithAnnotations(mainclass);
		isolateComponentAnnotations(template.get("annotations").getAsJsonObject());
	}
	
	public void isolateComponentAnnotations(JsonObject annotations) {
		
		Set<String> keyStrings = annotations.keySet();
		for(String keyString : keyStrings) {
			addComponentAnnotation(keyString, annotations.getAsJsonObject(keyString));
		}
	}

	public void merge(ComponentAnnotations other) {
		Set<String> keyStrings = other.componentAnnoations.keySet();
		System.out.println("New keys: (" + keyStrings.size() + ") " + keyStrings);
		Set<String> currentKeys = this.classificationAnnotations.keySet();
		System.out.println("Current keys: (" + currentKeys.size() + ") " + currentKeys);

		keyStrings.removeAll(currentKeys);
		System.out.println("Keys in other: " + keyStrings);
		System.out.println("Current keys: " + currentKeys);
		for (String keyString : keyStrings) {
			addComponentAnnotation(keyString, other.componentAnnoations.getAsJsonObject(keyString));
		}
		Set<String> total = this.classificationAnnotations.keySet();
		System.out.println("Total: (" + currentKeys.size() + ") " + currentKeys);
	}
	
	public JsonObject getComponentAnnoations() {
		return componentAnnoations;
	}

	public JsonObject getClassificationAnnotations() {
		return classificationAnnotations;
	}
	
	public void mergeAnnotationSet(String topclass) {
		List<String> classes = OntologyUtilityRoutines.listOfSubClasses(topclass, false); 
		ComponentAnnotations total = new ComponentAnnotations();
		for(String classnameString : classes) {
			ComponentAnnotations annosAnnotations = new ComponentAnnotations();
			annosAnnotations.isolateComponentAnnotations(classnameString);
			this.merge(annosAnnotations);
            }
        }
	public String annotationAsString() {
		StringBuilder sb = new StringBuilder();
		for (String key : componentAnnoations.keySet()) {
			sb.append("\tClass: ").append(key).append("\n");
			sb.append("\t\tDescription: ").append(componentAnnoations.getAsJsonObject(key).get("rdfs:comment").getAsString()).append("\n");
		}
		return sb.toString();
	}
	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder();
		sb.append("Component Annotations:\n");
		for (String key : componentAnnoations.keySet()) {
			sb.append("\tClass: ").append(key).append("\n");
			sb.append("\t\tAnnotations: ").append(componentAnnoations.getAsJsonObject(key).toString()).append("\n");
		}
		sb.append("Classificatiion Annotations:\n");
		for (String key : classificationAnnotations.keySet()) {
			sb.append("\tClassification: ").append(key).append("\n");
			sb.append("\t\tAnnotations: ").append(classificationAnnotations.getAsJsonObject(key).toString()).append("\n");
		}
		return sb.toString();
		
		
	}
}
