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
        Set<String> processed = new HashSet<String>();
        addToDataStoreTermSet(terms, processed, keysInList, topclassname, datatype);
        return terms;
    }

    public static void addToDataStoreTermSet(DictionaryTermSet terms, Set<String> processed, Set<String> keysInList, String classname, String datatype) {
        JsonObject template = CreateDocumentTemplate.createTemplateWithAnnotations(classname);
        JsonObject annotations = template.getAsJsonObject("annotations");
        Set<String> allkeys = annotations.keySet();
        
        // processed is used to prevent infinite recursion on classes
        if (processed.contains(classname)) return;
        processed.add(classname);

        Set<String> keys = new HashSet<>();
        for (String key : allkeys) {
            if (OntologyUtilityRoutines.isSubClassOf(key, "dataset:ChemConnectPrimitiveDataStructure", false)) {
                keys.add(key);
            }
        }
        
        System.out.println("Processing terms for Class: " + classname + ", terms identified: " + keys.size());
        for (String key : keys) {
            JsonObject element = annotations.getAsJsonObject(key);
            String identifier = element.has(AnnotationObjectsLabels.identifier) ? element.get(AnnotationObjectsLabels.identifier).getAsString() : key;
            String comment = element.has(AnnotationObjectsLabels.comment) ? element.get(AnnotationObjectsLabels.comment).getAsString() : "";

            String name = key.substring(key.lastIndexOf(":") + 1);
            // DictionaryTermSet.addTerm now handles merging datatypes into a List
            DictionaryTerm term = new DictionaryTerm(name, key, comment, datatype);
            terms.addTerm(term);
        }

        List<String> subclassifications = OntologyUtilityRoutines.listOfSubClasses(classname, true);  
        for(String subclassification : subclassifications) {
            addToDataStoreTermSet(terms, processed, keysInList, subclassification, datatype);
        }
    }
}
