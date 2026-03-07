package info.blurock.datamanager.datastoreterms;

import com.google.gson.JsonObject;
import java.util.Set;
import java.util.HashSet;
import java.util.List;
import info.esblurock.reaction.core.ontology.base.dataset.CreateDocumentTemplate;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;
import info.esblurock.reaction.core.ontology.base.utilities.OntologyUtilityRoutines;

public class CreateDataStoreTermSet {

    public static DictionaryTermSet createDataStoreDataObjectTermSet(String topclassname, String datatype) {
        DictionaryTermSet terms = new DictionaryTermSet();
        Set<String> keysInList = new HashSet<String>();
        addToDataStoreTermSet(terms, keysInList, topclassname, datatype);
        return terms;
    }

    public static void addToDataStoreTermSet(DictionaryTermSet terms, Set<String> keysInList, String classname, String datatype) {
        JsonObject template = CreateDocumentTemplate.createTemplateWithAnnotations(classname);
        JsonObject annotations = template.getAsJsonObject("annotations");
        Set<String> keys = annotations.keySet();
        for (String key : keys) {
           JsonObject element = annotations.getAsJsonObject(key);
           
           // Identifier is usually required, but let's be safe.
           String identifier = element.has(AnnotationObjectsLabels.identifier) ? element.get(AnnotationObjectsLabels.identifier).getAsString() : key;
           
           // Many elements in the ontology miss a label or comment, we must check before getting them!
           //String label = element.has(AnnotationObjectsLabels.label) ? element.get(AnnotationObjectsLabels.label).getAsString() : identifier;
           String comment = element.has(AnnotationObjectsLabels.comment) ? element.get(AnnotationObjectsLabels.comment).getAsString() : "";

           if(!keysInList.contains(identifier)) {
               keysInList.add(identifier);
               DictionaryTerm term = new DictionaryTerm(identifier, key, comment, datatype);
               terms.addTerm(term);
           }
        }
        List<String> subclassifications = OntologyUtilityRoutines.listOfSubClasses(classname, true);   
        for(String subclassification : subclassifications) {
            addToDataStoreTermSet(terms, keysInList, subclassification, datatype);
        }

    }
}
