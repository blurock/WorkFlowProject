package info.esblurock.reaction.core.ontology.base.classification;

import java.util.Iterator;
import java.util.List;
import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;


public class DatabaseOntologyClassification {
	static String classificationinfotree = "dataset:ClassificationInfoTree";
	static String classificationinfoelement = "dataset:ClassificationInfoElement";
	
	public static ClassificationHierarchy getClassificationHierarchy(String classification) {
		BaseAnnotationObjects annotations = DatasetOntologyParseBase.getAnnotationStructureFromIDObject(classification);
		ClassificationHierarchy top = new ClassificationHierarchy(classification, annotations);
		
		List<String> subclassifications = OntologyUtilityRoutines.listOfSubClasses(classification, true);
		for(String sub : subclassifications) {
			ClassificationHierarchy subclass = getClassificationHierarchy(sub);
			top.addClassificationHierarchy(subclass);
		}
		return top;
	}

	public static JsonObject classificationTreeFromDataType(String datatype) {
		String choices = DatasetOntologyParseBase.getAnnotationObject(datatype, AnnotationObjectsLabels.isDefinedBy);
		if(choices.length() == 0) {
		    choices = "dataset:NoChoices";
		}
		return classificationTreeFromChoices(choices);
	}
	public static JsonObject classificationTreeFromChoices(String choices) {
		ClassificationHierarchy hier = DatabaseOntologyClassification.getClassificationHierarchy(choices);
		JsonObject annotations = new JsonObject();
		JsonObject hierarchy = classificationTreeFromHierarchy(hier, annotations);
		JsonObject information = new JsonObject();
		information.add("dataobject", hierarchy);
		information.add("annotations", annotations);
		return information;
	}
	public static JsonObject classificationTreeFromHierarchy(ClassificationHierarchy hier,JsonObject annotations) {
		JsonObject obj = new JsonObject();
        String subclassname = hier.getClassification();
        obj.addProperty(AnnotationObjectsLabels.identifier, hier.getAnnotations().getIdentifier());
        obj.addProperty(ClassLabelConstants.CatalogElementType, subclassname);
        JsonArray lst = new JsonArray();
		
        BaseAnnotationObjects subannotations = hier.getAnnotations();
        JsonObject clsobj = new JsonObject();
        String label = subannotations.getLabel();
        if(label.length() == 0) {
            label = subclassname;
        }
        clsobj.addProperty(AnnotationObjectsLabels.label, label);
        String comment = subannotations.getComment();
        if(comment.length() == 0) {
            comment = label;
        }
        clsobj.addProperty(AnnotationObjectsLabels.comment, comment);
        clsobj.addProperty(ClassLabelConstants.CatalogElementType, subclassname);
        annotations.add(subclassname,  clsobj);
		Set<ClassificationHierarchy> set = hier.getSubclassificatons();
		Iterator<ClassificationHierarchy> iter = set.iterator();
		while(iter.hasNext()) {
			JsonObject subnode = classificationTreeFromHierarchy(iter.next(), annotations);
			lst.add(subnode);
		}
		obj.add(ClassLabelConstants.ClassificationInfoTree, lst);
		return obj;
	}
}
