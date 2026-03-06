package info.esblurock.reaction.core.ontology.base.classification;

import java.util.ArrayList;
import java.util.List;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.constants.ClassLabelConstants;
import info.esblurock.reaction.core.ontology.base.constants.OntologyObjectLabels;
import info.esblurock.reaction.core.ontology.base.dataset.DatasetOntologyParseBase;
import info.esblurock.reaction.core.ontology.base.dataset.annotations.BaseAnnotationObjects;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class TransactionEventHierarchy {

    public static JsonObject generate() {
        String classification = "dataset:TransactionEvent";
        return generate(classification);
    }

    public static JsonObject generate(String classification) {
        JsonObject annotations = new JsonObject();
        
        JsonObject hierarchy = generate(classification, annotations);
        
        JsonObject information = new JsonObject();
        information.add("dataobject", hierarchy);
        information.add("annotations", annotations);
        return information;
    }
    private static JsonObject generate(String classification, JsonObject annotations) {
        JsonObject hierarchy = new JsonObject();
        String idS = DatasetOntologyParseBase.getIDFromAnnotation(classification);
        String type = OntologyUtilityRoutines.exactlyOnePropertySingle(classification, OntologyObjectLabels.dctermstype);
        if(type == null) {
            type = "";
        }
        String source = OntologyUtilityRoutines.exactlyOnePropertySingle(classification, OntologyObjectLabels.source);
        if(source == null) {
            source = "";
        }
        String catalog = OntologyUtilityRoutines.exactlyOnePropertySingle(classification, OntologyObjectLabels.catalog);
        if(catalog == null) {
            catalog = "";
        }
        List<String> requires = OntologyUtilityRoutines.exactlyOnePropertyMultiple(classification, OntologyObjectLabels.requires);
        
        
        JsonArray requiresarray = new JsonArray();
        for(String name : requires) {
            requiresarray.add(name);
        }
        BaseAnnotationObjects annotationobj = DatasetOntologyParseBase.getAnnotationStructureFromIDObject(classification);
        JsonObject obj = annotationobj.toJsonObject();

        obj.addProperty(ClassLabelConstants.CatalogElementType, classification);
        obj.addProperty(OntologyObjectLabels.dctermstypesimple, type);
        obj.addProperty(OntologyObjectLabels.sourcesimple, source);
        obj.addProperty(OntologyObjectLabels.catalog, catalog);
        obj.add(OntologyObjectLabels.requiressimple, requiresarray);
        annotations.add(classification, obj);
        
        
        
        JsonArray sublist = new JsonArray();
        hierarchy.addProperty(AnnotationObjectsLabels.identifier, idS);
        hierarchy.addProperty(ClassLabelConstants.CatalogElementType, classification);
        hierarchy.add(ClassLabelConstants.ClassificationInfoTree, sublist);
        List<String> subclassifications = OntologyUtilityRoutines.listOfSubClasses(classification, true);
        for(String sub : subclassifications) {
            JsonObject subtree = generate(sub,annotations);
            sublist.add(subtree);
        }
        

        return hierarchy;
    }
}
