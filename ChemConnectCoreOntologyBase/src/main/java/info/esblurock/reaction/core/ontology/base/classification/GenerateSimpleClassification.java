package info.esblurock.reaction.core.ontology.base.classification;

import java.util.Iterator;
import java.util.Set;
import java.util.Map;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;

public class GenerateSimpleClassification {
	
	/**
	 * @param datatype This is the classification data type
	 * @return JsonArray with {type, label and comment} from Annotations
	 * 
	 * This uses the rdfs:isDefinedBy annotation to find the choices.
	 * 
	 * This routine assumes a flat set of classifications (returning just a list).
	 */
	public static JsonObject generateSimpleListFromDataType(String datatype) {
		String choices = DatasetOntologyParseBase.getAnnotationObject(datatype, AnnotationObjectsLabels.isDefinedBy);
		return generateSimpleListFromChoices(choices);
	}
	
	/**
	 * @param classname The class name of the classification
	 * @return JsonArray with {type, label and comment} from Annotations
	 * 
	 * This routine assumes a flat set of classifications (returning just a list).
	 * 
	 */
	public static JsonObject generateSimpleListFromChoices(String classname) {
		//String classificationinfo = "dataset:ClassificationInfo";
		JsonObject anno = new JsonObject();
		JsonArray lst = new JsonArray();
		ClassificationHierarchy hier = DatabaseOntologyClassification.getClassificationHierarchy(classname);
		Set<ClassificationHierarchy> set = hier.getSubclassificatons();
		Iterator<ClassificationHierarchy> iter = set.iterator();
		while(iter.hasNext()) {
			ClassificationHierarchy classification = iter.next();
            String subclassname = classification.getClassification();
            BaseAnnotationObjects annotations = classification.getAnnotations();
			lst.add(subclassname);
			JsonObject clsobj = new JsonObject();
			String label = annotations.getLabel();
			if(label.length() == 0) {
			    label = subclassname;
			}
			clsobj.addProperty(AnnotationObjectsLabels.label, label);
			String comment = annotations.getComment();
			if(comment.length() == 0) {
			    comment = label;
			}
			clsobj.addProperty(AnnotationObjectsLabels.comment, comment);
			clsobj.addProperty(ClassLabelConstants.CatalogElementType, subclassname);
			anno.add(subclassname,  clsobj);
		}
		JsonObject information = new JsonObject();
	      information.add("dataobject", lst);
	      information.add("annotations", anno);

		return information;
	}

	public static JsonObject generateHierarchyClassname(String classname) {
		JsonObject total = new JsonObject();
		if (!total.has("dataobject")) {
			total.add("dataobject", new JsonArray());
		}
		if (!total.has("annotations")) {
			total.add("annotations", new JsonObject());
		}
		generateHierarchyClassname(classname, total);
		return total;
	}


	public static void generateHierarchyClassname(String classname, JsonObject total) {
		JsonObject information = generateSimpleListFromChoices(classname);
		JsonArray lst = information.get("dataobject").getAsJsonArray();
		JsonObject anno = information.get("annotations").getAsJsonObject();

		total.get("dataobject").getAsJsonArray().addAll(lst);
		JsonObject annotations = total.get("annotations").getAsJsonObject();
		for (Map.Entry<String, JsonElement> entry : anno.entrySet()) {
			annotations.add(entry.getKey(), entry.getValue());
		}
		for (int i = 0; i < lst.size(); i++) {
			String subname = lst.get(i).getAsString();
			generateHierarchyClassname(subname, total);
		}
	}
	
	
}
