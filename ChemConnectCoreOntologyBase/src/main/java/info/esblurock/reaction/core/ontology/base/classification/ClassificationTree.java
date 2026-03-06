package info.esblurock.reaction.core.ontology.base.classification;

import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.BaseObjectJSONInterface;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;


public class ClassificationTree extends BaseObjectJSONInterface {
	Set<ClassificationTree> subtrees;
	BaseAnnotationObjects annotations;
	
	
	
	public BaseAnnotationObjects getAnnotations() {
		return annotations;
	}

	public void setAnnotations(BaseAnnotationObjects annotations) {
		this.annotations = annotations;
	}

	public void addToSubTree(ClassificationTree subelement) {
		subtrees.add(subelement);
	}

	@Override
	public JsonObject toJsonObject() {
		JsonObject json = new JsonObject();
		JsonObject annjson = annotations.toJsonObject();
		json.add(OntologyObjectLabels.classification, annjson);
		JsonArray array = new JsonArray();
		for(ClassificationTree element : subtrees) {
			JsonObject elementjson = element.toJsonObject();
			array.add(elementjson);
		}
		json.add(OntologyObjectLabels.subclassifications, array);
		return json;
	}

	@Override
	public void fillJsonObject(JsonObject obj) {
		JsonObject annotationsjson = (JsonObject) obj.get(OntologyObjectLabels.classification);
		annotations.fillJsonObject(annotationsjson);
		JsonArray array = obj.get(OntologyObjectLabels.subclassifications).getAsJsonArray();
		for(int i=0; i < array.size(); i++) {
			JsonObject json = (JsonObject) array.get(i);
			ClassificationTree ann = new ClassificationTree();
			ann.fillJsonObject(json);
			subtrees.add(ann);
		}
	}
}
