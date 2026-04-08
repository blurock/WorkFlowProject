package info.esblurock.reaction.core.ontology.base.dataset;

import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;
import java.util.Set;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.classification.DatabaseOntologyClassification;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;
import info.esblurock.reaction.core.ontology.base.utilities.GenericSimpleQueries;
import info.esblurock.reaction.core.ontology.base.utilities.JsonObjectUtilities;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class CreateDocumentTemplate {

    public static JsonObject createTemplateWithAnnotations(String classname) {
        JsonObject annotations = new JsonObject();
        JsonObject obj = createSubTemplateWithAnnotations(classname, annotations, true);
        JsonObject information = new JsonObject();
        information.add("dataobject", obj);
        information.add("annotations", annotations);
        return information;
    }

    private static JsonObject createSubTemplateWithAnnotations(String classname, JsonObject annotations,
            boolean arrexample) {
        JsonObject obj = new JsonObject();
        addAnnotations(classname, annotations);
        CompoundObjectDimensionSet set1 = ParseCompoundObject.getCompoundElements(classname);
        Iterator<CompoundObjectDimensionInformation> iter = set1.iterator();
        while (iter.hasNext()) {
            CompoundObjectDimensionInformation info = iter.next();
            String dimidentifier = DatasetOntologyParseBase.getIDFromAnnotation(info.getClassname());
            if (info.isCompoundobject()) {
                if (info.isSinglet()) {
                    JsonObject subelements = createSubTemplateWithAnnotations(info.getClassname(), annotations,
                            arrexample);
                    obj.add(dimidentifier, subelements);
                } else {
                    JsonArray arr = new JsonArray();
                    obj.add(dimidentifier, arr);
                    if (arrexample) {
                        JsonObject arrobj = createSubTemplateWithAnnotations(info.getClassname(), annotations,
                                arrexample);
                        arr.add(arrobj);
                    }
                }
            } else {
                JsonObject anno = addAnnotations(info.getClassname(), annotations);
                String singlevalue = "not assigned";
                if (info.isClassification()) {
                    singlevalue = "Unassigned classification: " + info.getClassname();
                    String classification = info.getClassname();
                    JsonObject classificationanno = DatabaseOntologyClassification
                            .classificationTreeFromDataType(classification);
                    JsonObject choices = classificationanno.get("dataobject").getAsJsonObject();
                    JsonObject choiceanno = classificationanno.get("annotations").getAsJsonObject();
                    mergeIntoAnnotations(choiceanno, annotations);
                    anno.add("classification", choices);
                }
                if (info.isSinglet()) {
                    obj.addProperty(dimidentifier, singlevalue);
                } else {
                    JsonArray arr = new JsonArray();
                    obj.add(dimidentifier, arr);
                    if (arrexample) {
                        arr.add(singlevalue);
                    }
                }
            }
        }
        return obj;
    }

    private static void mergeIntoAnnotations(JsonObject choiceanno, JsonObject annotations) {
        Set<Entry<String, JsonElement>> entries = choiceanno.entrySet();
        for (Entry<String, JsonElement> entry : entries) {
            annotations.add(entry.getKey(), entry.getValue());
        }
    }

    private static JsonObject addAnnotations(String classname, JsonObject annotationset) {
        BaseAnnotationObjects annotations = DatasetOntologyParseBase.getAnnotationStructureFromIDObject(classname);
        JsonObject anno = new JsonObject();
        String label = annotations.getLabel();
        if (label.length() == 0) {
            label = classname;
        }
        anno.addProperty(AnnotationObjectsLabels.label, label);

        String id = annotations.getIdentifier();
        if (id.length() == 0) {
            id = classname;
        }
        anno.addProperty(AnnotationObjectsLabels.identifier, id);

        String comment = annotations.getComment();
        if (comment.length() == 0) {
            comment = label;
        }
        anno.addProperty(AnnotationObjectsLabels.comment, comment);
        anno.addProperty(ClassLabelConstants.CatalogElementType, classname);

        if (GenericSimpleQueries.isSubClassOf(classname, "dataset:Classification", false)) {
            JsonObject classificationanno = DatabaseOntologyClassification.classificationTreeFromDataType(classname);
            JsonObject choices = classificationanno.get("dataobject").getAsJsonObject();
            JsonObject choiceanno = classificationanno.get("annotations").getAsJsonObject();
            mergeIntoAnnotations(choiceanno, annotationset);
            anno.add("classification", choices);
        }

        annotationset.add(classname, anno);
        return anno;
    }

    public static JsonObject createTemplate(String classname) {
        return createTemplate(classname, false);
    }

    public static JsonObject createTemplate(String classname, boolean arrexample) {
        JsonObject obj = createSubTemplate(classname, arrexample);
        String identifier = DatasetOntologyParseBase.getIDFromAnnotation(classname);
        obj.addProperty(AnnotationObjectsLabels.identifier, identifier);
        return obj;
    }

    private static JsonObject createSubTemplate(String classname, boolean arrexample) {
        JsonObject obj = new JsonObject();
        CompoundObjectDimensionSet set1 = ParseCompoundObject.getCompoundElements(classname);
        Iterator<CompoundObjectDimensionInformation> iter = set1.iterator();
        while (iter.hasNext()) {
            CompoundObjectDimensionInformation info = iter.next();
            String dimidentifier = DatasetOntologyParseBase.getIDFromAnnotation(info.getClassname());
            if (info.isCompoundobject()) {
                if (info.isSinglet()) {
                    JsonObject subelements = createSubTemplate(info.getClassname(), arrexample);
                    obj.add(dimidentifier, subelements);
                } else {
                    JsonArray arr = new JsonArray();
                    obj.add(dimidentifier, arr);
                    if (arrexample) {
                        JsonObject arrobj = createSubTemplate(info.getClassname(), arrexample);
                        arr.add(arrobj);
                    }
                }
            } else {
                String singlevalue = "not assigned";
                if (info.isClassification()) {
                    singlevalue = "Unassigned classification: " + info.getClassname();
                }
                if (info.isSinglet()) {
                    obj.addProperty(dimidentifier, singlevalue);
                } else {
                    JsonArray arr = new JsonArray();
                    obj.add(dimidentifier, arr);
                    if (arrexample) {
                        arr.add(singlevalue);
                    }
                }
            }
        }
        return obj;
    }

}
