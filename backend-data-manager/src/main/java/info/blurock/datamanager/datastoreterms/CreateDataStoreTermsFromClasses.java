package info.blurock.datamanager.datastoreterms;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import java.util.Map;
import info.esblurock.reaction.core.ontology.base.classification.GenerateSimpleClassification;
import info.esblurock.reaction.core.ontology.base.constants.AnnotationObjectsLabels;

public class CreateDataStoreTermsFromClasses {

    /**
     * Creates a DictionaryTermSet from a class hierarchy.
     * 
     * @param classname The top class name to start the hierarchy from.
     * @param datatype The data type to associate with the terms.
     * @return A DictionaryTermSet containing terms generated from the hierarchy annotations.
     */
    public static DictionaryTermSet createDataStoreTermsFromClasses(String classname, String datatype) {
        DictionaryTermSet terms = new DictionaryTermSet();
        JsonObject hierarchy = GenerateSimpleClassification.generateHierarchyClassname(classname);
        JsonObject annotations = hierarchy.getAsJsonObject("annotations");
        
        for (Map.Entry<String, JsonElement> entry : annotations.entrySet()) {
            String key = entry.getKey();
            JsonObject element = entry.getValue().getAsJsonObject();
            
            // Extract comment, similar to CreateDataStoreTermSet
            String comment = element.has(AnnotationObjectsLabels.comment) ? element.get(AnnotationObjectsLabels.comment).getAsString() : "";

            // The ID is the part after the colon in the class name
            String name = key.substring(key.lastIndexOf(":") + 1);
            
            // Create the term: ID, full class name (term), description, and datatype
            DictionaryTerm term = new DictionaryTerm(name, key, comment, datatype);
            terms.addTerm(term);
        }
        
        return terms;
    }
}
